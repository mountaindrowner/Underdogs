/**
 * UNDERDOGS rules engine — deterministic, seeded, event-emitting.
 *
 *   createGame(opts) -> { state, events }
 *   applyAction(state, action) -> { state, events }
 *
 * applyAction is a pure reducer: it clones the input state, mutates the clone,
 * and returns the new state plus the ordered GameEvent stream for the UI to
 * animate. Rules never touch presentation; the UI never mutates state.
 */
import {
  type GameState, type PlayerState, type PlayerId, type UnitInstance,
  type CardDef, type Action, type RuleConfig, type Keyword, type EffectOp, DEFAULT_RULES,
} from './types.ts';
import { EventSink, type GameEvent } from './events.ts';
import { makeRng, rngFromState, type Rng } from './rng.ts';
import { runTrigger, isSheep, type Ctx } from './effects.ts';

export interface GameConfig {
  seed: number;
  decks: [CardDef[], CardDef[]];
  leaders?: [CardDef | undefined, CardDef | undefined];
  rules?: Partial<RuleConfig>;
  skipMulligan?: boolean;
  /** Pre-placed units per player (def ids), e.g. a boss on the enemy board. */
  startUnits?: [string[], string[]];
  /** Per-hero HP overrides (campaign encounters). */
  heroHp?: [number, number];
  /** Which player pauses for interactive Foresee/Discover (the human). Omit
   *  for headless/AI-vs-AI: all choices auto-resolve inline, no pauses. */
  interactivePlayer?: PlayerId;
}

const other = (p: PlayerId): PlayerId => (p === 0 ? 1 : 0);

function makeUnit(state: GameState, def: CardDef, owner: PlayerId): UnitInstance {
  const kws = [...(def.keywords ?? [])] as Keyword[];
  return {
    uid: state.nextUid++, defId: def.id, name: def.name, owner,
    attack: def.attack ?? 0, health: def.health ?? 0, maxHealth: def.health ?? 0,
    keywords: kws, effects: def.effects ? structuredClone(def.effects) : {},
    fulfill: def.fulfill, ready: false, attacksThisTurn: 0,
    endure: kws.includes('endure'), auraAtk: 0, auraHp: 0, auraKw: [], tempAtk: 0,
    covenantTicks: 0, enteredTurn: state.turn, spellsAtEntry: state.players[owner].spellsCast ?? 0,
  };
}

export function effAttack(u: UnitInstance): number {
  return Math.max(0, u.attack + (u.auraAtk ?? 0) + (u.tempAtk ?? 0));
}

export function effHealth(u: UnitInstance): number {
  return u.health + (u.auraHp ?? 0);
}

export function hasKeyword(u: UnitInstance, k: Keyword): boolean {
  return u.keywords.includes(k) || (u.auraKw ?? []).includes(k);
}

/** What a card actually costs for this player right now (Israel, Terah). */
export function effCost(state: GameState, p: PlayerId, card: CardDef): number {
  const pl = state.players[p];
  let discount = pl.nextCardDiscount ?? 0;
  const matchesFilter = (f?: { cardType?: string; class?: string; tribe?: string }) =>
    !f || ((f.cardType == null || card.type === f.cardType) && (f.class == null || card.class === f.class));
  for (const src of [...pl.board, ...pl.relics]) {
    for (const op of src.effects.aura ?? []) {
      if (op.verb === 'discountHand') discount += op.amount ?? 1;
      // costReduce: a continuous cost aura, optionally filtered to a card type/class
      if (op.verb === 'costReduce' && matchesFilter(op.filter)) discount += op.amount ?? 1;
    }
  }
  return Math.max(0, (card.cost ?? 0) - discount);
}

// ---- setup -----------------------------------------------------------------

export function createGame(cfg: GameConfig): { state: GameState; events: GameEvent[] } {
  const rules = { ...DEFAULT_RULES, ...(cfg.rules ?? {}) };
  const rng = makeRng(cfg.seed);
  const mkPlayer = (id: PlayerId, deck: CardDef[], leader?: CardDef): PlayerState => {
    const d = rng.shuffle([...deck]);
    const hp: PlayerState['heroPower'] = leader?.hero_power
      ? { name: leader.hero_power.name, cost: leader.hero_power.cost,
          effects: leader.hero_power.effects ?? [], usedThisTurn: false }
      : undefined;
    return {
      id, heroHp: rules.heroHp, heroMaxHp: rules.heroHp,
      provision: 0, provisionMax: 0,
      deck: d, hand: [], board: [], relics: [], discard: [], exiled: [],
      fallen: [], delayed: [], usedOnce: [], nextCardDiscount: 0, spellsCast: 0, cardsPlayedThisTurn: 0,
      fatigue: 0, heroPower: hp, leaderId: leader?.id,
    };
  };
  const state: GameState = {
    players: [mkPlayer(0, cfg.decks[0], cfg.leaders?.[0]),
              mkPlayer(1, cfg.decks[1], cfg.leaders?.[1])],
    active: 0, turn: 0, phase: 'mulligan', rngState: rng.state,
    nextUid: 1, winner: null,
    pending: null, interactivePlayer: cfg.interactivePlayer ?? null,
    rules,
  };
  // per-hero HP overrides (campaign)
  if (cfg.heroHp) {
    for (const p of [0, 1] as const) {
      state.players[p].heroHp = cfg.heroHp[p];
      state.players[p].heroMaxHp = cfg.heroHp[p];
    }
  }
  const sink = new EventSink();
  sink.emit({ t: 'gameStart', seed: cfg.seed, first: 0 });
  // opening hands: first player draws startingHand, second draws +1
  dealOpening(state, sink, rng, 0, rules.startingHand);
  dealOpening(state, sink, rng, 1, rules.startingHand + 1);
  // The second player also gets Loaves of Bread — 0-cost cards that grant +1
  // Provision for the turn (our "Coin"), offsetting the first player's tempo.
  const loaf = DEFS.get('loaf_of_bread');
  if (loaf) for (let i = 0; i < rules.secondPlayerBonus; i++) state.players[1].hand.push(structuredClone(loaf));
  // pre-placed units (e.g. a boss on the enemy board), summoning-sick turn 1
  if (cfg.startUnits) {
    for (const p of [0, 1] as const) {
      for (const defId of cfg.startUnits[p]) {
        const def = DEFS.get(defId);
        if (!def) continue;
        const u = makeUnit(state, def, p); u.ready = false;
        state.players[p].board.push(u);
        sink.emit({ t: 'summon', uid: u.uid, defId: u.defId, owner: p, position: state.players[p].board.length - 1 });
      }
    }
    recomputeAuras(state, sink);
  }
  if (cfg.skipMulligan) {
    beginTurn(state, sink, rng, 0);
  }
  state.rngState = rng.state;
  return { state, events: sink.events };
}

function dealOpening(state: GameState, sink: EventSink, rng: Rng, p: PlayerId, n: number): void {
  const pl = state.players[p];
  for (let i = 0; i < n && pl.deck.length; i++) pl.hand.push(pl.deck.shift()!);
}

// ---- public reducer --------------------------------------------------------

export function applyAction(prev: GameState, action: Action): { state: GameState; events: GameEvent[] } {
  const state = structuredClone(prev);
  const sink = new EventSink();
  const rng = rngFromState(state.rngState);
  try {
    dispatch(state, sink, rng, action);
  } finally {
    state.rngState = rng.state;
  }
  return { state, events: sink.events };
}

function dispatch(state: GameState, sink: EventSink, rng: Rng, action: Action): void {
  if (state.phase === 'over') return;
  // RESOLVE_CHOICE is the only legal action while a choice is pending.
  if (state.pending && action.type !== 'RESOLVE_CHOICE') return;
  switch (action.type) {
    case 'MULLIGAN': return doMulligan(state, sink, rng, action.keep);
    case 'PLAY_CARD': return playCard(state, sink, rng, action.handIndex, action.targetUid, action.position);
    case 'ATTACK': return attack(state, sink, rng, action.attackerUid, action.targetUid);
    case 'HERO_POWER': return heroPower(state, sink, rng, action.targetUid);
    case 'RESOLVE_CHOICE': return resolveChoice(state, sink, rng, action);
    case 'END_TURN': return endTurn(state, sink, rng);
  }
}

function doMulligan(state: GameState, sink: EventSink, rng: Rng, keep: number[]): void {
  if (state.phase !== 'mulligan') return;
  const p = state.active;
  const pl = state.players[p];
  const keepSet = new Set(keep);
  const kept: CardDef[] = [];
  const toss: CardDef[] = [];
  pl.hand.forEach((c, i) => (keepSet.has(i) ? kept : toss).push(c));
  pl.deck.push(...toss);
  rng.shuffle(pl.deck);
  pl.hand = kept;
  for (let i = 0; i < toss.length && pl.deck.length; i++) pl.hand.push(pl.deck.shift()!);
  if (p === 0) {
    state.active = 1;
  } else {
    beginTurn(state, sink, rng, 0);
  }
}

// ---- turn structure --------------------------------------------------------

function beginTurn(state: GameState, sink: EventSink, rng: Rng, p: PlayerId): void {
  state.active = p;
  state.turn += 1;
  const pl = state.players[p];
  // Dawn: ready units, +Provision (refill), start-triggers, draw 1
  state.phase = 'dawn';
  sink.emit({ t: 'phase', phase: 'dawn', player: p, turn: state.turn });
  for (const u of pl.board) {
    u.ready = true; u.attacksThisTurn = 0; u.survivedDamage = false;
    u.tempAtk = 0;                                           // thisTurn buffs wear off
    if (u.health < u.maxHealth) u.survivedDamagedTurn = true; // Daniel in the den
    u.covenantTicks = (u.covenantTicks ?? 0) + 1;
  }
  for (const r of pl.relics) r.covenantTicks = (r.covenantTicks ?? 0) + 1;
  pl.cardsPlayedThisTurn = 0;                               // reset the per-turn play counter
  pl.provisionMax = Math.min(state.rules.provisionCap, pl.provisionMax + 1);
  pl.provision = pl.provisionMax;
  if (pl.heroPower) pl.heroPower.usedThisTurn = false;
  sink.emit({ t: 'provision', player: p, current: pl.provision, max: pl.provisionMax });
  const ctx = makeCtx(state, sink, rng, p);
  // units returning after a delay (Joseph, Lord of Egypt)
  for (const d of [...pl.delayed]) {
    d.remaining -= 1;
    if (d.remaining <= 0 && summonToken(state, sink, p, d.into)) {
      pl.delayed.splice(pl.delayed.indexOf(d), 1);
    }
  }
  // ops queued for this dawn (Job's restoration)
  for (const u of [...pl.board]) {
    if (u.pending?.length) { const ops = u.pending; u.pending = undefined; runTrigger(ctx, ops, u); }
  }
  // Covenant / start-of-turn triggers (board units and standing relics)
  for (const u of [...pl.board, ...pl.relics]) {
    runTrigger(ctx, u.effects.covenant, u);
    runTrigger(ctx, u.effects.startOfTurn, u);
    // refreshEachTurn auras re-arm consumable keywords (Moses: Sheep get Endure)
    for (const op of u.effects.aura ?? []) {
      if (op.verb === 'giveKeyword' && op.refreshEachTurn && op.keyword) {
        for (const t of state.players[p].board) {
          if (op.target === 'friendlySheep' && !isSheep(t)) continue;
          if (t.uid === u.uid) continue;
          if (!t.keywords.includes(op.keyword)) t.keywords.push(op.keyword);
          if (op.keyword === 'endure' && !t.endure) {
            t.endure = true;
            sink.emit({ t: 'keyword', uid: t.uid, keyword: 'endure', gained: true });
          }
        }
      }
    }
  }
  // standing relics that expire after N of your turns (Jar of Oil): break after they've ticked
  for (const r of [...pl.relics]) {
    const brk = (r.effects.passive ?? []).find((op) => op.verb === 'breakAfterTurns');
    if (brk && (r.covenantTicks ?? 0) >= (brk.amount ?? 3)) {
      pl.relics.splice(pl.relics.indexOf(r), 1);
      const def = DEFS.get(r.defId); if (def) pl.discard.push(def);
      sink.emit({ t: 'relicBroken', player: p, defId: r.defId });
      recomputeAuras(state, sink);
    }
  }
  draw(state, sink, rng, p, 1);
  settle(state, sink, rng, p);
  if (state.phase === 'over') return;
  state.phase = 'main';
  sink.emit({ t: 'phase', phase: 'main', player: p, turn: state.turn });
}

function endTurn(state: GameState, sink: EventSink, rng: Rng): void {
  if (state.phase !== 'main') return;
  const p = state.active;
  state.phase = 'dusk';
  sink.emit({ t: 'phase', phase: 'dusk', player: p, turn: state.turn });
  // Dusk: end-of-turn triggers (Tabernacle, Musician, the idols of the AI…)
  const ctx = makeCtx(state, sink, rng, p);
  const pl = state.players[p];
  for (const u of [...pl.board, ...pl.relics]) runTrigger(ctx, u.effects.endOfTurn, u);
  pl.nextCardDiscount = 0;                                    // Terah's window closes
  settle(state, sink, rng, p);
  if (state.phase === 'over') return;
  beginTurn(state, sink, rng, other(p));
}

// ---- actions ---------------------------------------------------------------

/** does this relic persist (standing) rather than resolve once (equip)? */
function isStandingRelic(card: CardDef): boolean {
  if (card.type !== 'relic') return false;
  const e = card.effects ?? {};
  return !!(e.aura || e.startOfTurn || e.endOfTurn || e.covenant || e.passive || e.raise || e.trigger);
}

function playCard(state: GameState, sink: EventSink, rng: Rng, handIndex: number,
                  targetUid?: number, position?: number): void {
  if (state.phase !== 'main') return;
  const p = state.active;
  const pl = state.players[p];
  const card = pl.hand[handIndex];
  if (!card) return;
  const cost = effCost(state, p, card);
  if (pl.provision < cost) return;                          // illegal: not enough Provision
  if (card.type === 'minion' && pl.board.length >= state.rules.boardLimit) return; // board full
  pl.provision -= cost;
  if (pl.nextCardDiscount > 0) pl.nextCardDiscount = 0;     // Terah: the NEXT card only
  pl.hand.splice(handIndex, 1);
  pl.cardsPlayedThisTurn = (pl.cardsPlayedThisTurn ?? 0) + 1;  // Eleventh-Hour Laborer gate
  sink.emit({ t: 'cardPlayed', player: p, defId: card.id });
  sink.emit({ t: 'provision', player: p, current: pl.provision, max: pl.provisionMax });
  const ctx = makeCtx(state, sink, rng, p);

  if (card.type === 'minion') {
    const u = makeUnit(state, card, p);
    const pos = position != null ? Math.max(0, Math.min(position, pl.board.length)) : pl.board.length;
    pl.board.splice(pos, 0, u);
    u.ready = u.keywords.includes('swift');                 // summoning sickness unless Swift
    sink.emit({ t: 'summon', uid: u.uid, defId: u.defId, owner: p, position: pos });
    recomputeAuras(state, sink);
    runTrigger(ctx, u.effects.arrival, u, targetUid);       // Arrival: (battlecry)
  } else if (isStandingRelic(card)) {
    // standing relic: set it down; its auras / turn triggers run while it stands
    const r = makeUnit(state, card, p);
    pl.relics.push(r);
    sink.emit({ t: 'relicPlaced', player: p, defId: card.id });
    recomputeAuras(state, sink);
    runTrigger(ctx, card.effects?.arrival, r, targetUid);
  } else {
    // spell / equip relic: run its arrival-keyed effects, then discard
    if (card.type === 'spell') pl.spellsCast = (pl.spellsCast ?? 0) + 1;   // Fulfill: cast_spells
    runTrigger(ctx, card.effects?.arrival, undefined, targetUid);
    pl.discard.push(card);
  }
  if (state.pending) return;              // a Foresee/Discover is waiting — settle on resolve
  settle(state, sink, rng, p);
}

function heroPower(state: GameState, sink: EventSink, rng: Rng, targetUid?: number): void {
  if (state.phase !== 'main') return;
  const p = state.active;
  const pl = state.players[p];
  const hp = pl.heroPower;
  if (!hp || hp.usedThisTurn || pl.provision < hp.cost) return;
  pl.provision -= hp.cost;
  hp.usedThisTurn = true;
  sink.emit({ t: 'heroPower', player: p, name: hp.name });
  sink.emit({ t: 'provision', player: p, current: pl.provision, max: pl.provisionMax });
  const ctx = makeCtx(state, sink, rng, p);
  runTrigger(ctx, hp.effects, undefined, targetUid);
  if (state.pending) return;              // Isaiah's Foresee is waiting — settle on resolve
  settle(state, sink, rng, p);
}

function attack(state: GameState, sink: EventSink, rng: Rng, attackerUid: number,
                targetUid: number | 'hero'): void {
  if (state.phase !== 'main') return;
  const p = state.active;
  const foe = other(p);
  const attacker = state.players[p].board.find((u) => u.uid === attackerUid);
  if (!attacker || !attacker.ready || attacker.attacksThisTurn >= 1 || effAttack(attacker) <= 0) return;
  // Barak: can't attack while it's your only unit
  if (state.players[p].board.length <= 1 &&
      (attacker.effects.passive ?? []).some((op) => op.verb === 'cannotAttackAlone')) return;
  // Eleventh-Hour Laborer: can't attack unless you played another card this turn
  if ((state.players[p].cardsPlayedThisTurn ?? 0) < 1 &&
      (attacker.effects.passive ?? []).some((op) => op.verb === 'requiresOtherPlay')) return;

  const enemies = state.players[foe].board;
  const guards = enemies.filter((u) => hasKeyword(u, 'guard'));
  let target: UnitInstance | undefined;
  if (targetUid !== 'hero') {
    target = enemies.find((u) => u.uid === targetUid);
    if (!target) return;
    if (guards.length && !hasKeyword(target, 'guard')) return;        // must hit Guard first
  } else {
    if (guards.length) return;                                        // can't go face past Guard
  }

  sink.emit({ t: 'attackDeclared', attacker: attacker.uid,
    target: targetUid, targetOwner: foe });
  const ctx = makeCtx(state, sink, rng, p);

  if (target) {
    const slaysGiant = hasKeyword(attacker, 'giant_slayer') && effAttack(target) >= 4;
    const executes = hasKeyword(attacker, 'executes_damaged') && target.health < target.maxHealth;
    if (slaysGiant) {
      ctx.destroy(target);
      attacker.slewGiant = true;                            // Fulfill: slay a giant
    } else if (executes) {
      ctx.destroy(target);                                  // Jael finishes the wounded
      ctx.dealToUnit(attacker, effAttack(target), target.uid); // …but takes the counter-blow
    } else {
      ctx.dealToUnit(target, effAttack(attacker), attacker.uid);
      ctx.dealToUnit(attacker, effAttack(target), target.uid); // counter-damage
      // Fulfill: survive combat vs a stronger unit (Jacob wrestles)
      if (effHealth(target) > 0 && effAttack(attacker) > effAttack(target)) target.survivedStronger = true;
      if (effHealth(attacker) > 0 && effAttack(target) > effAttack(attacker)) attacker.survivedStronger = true;
    }
  } else {
    ctx.dealToHero(foe, effAttack(attacker), attacker.uid);
  }
  // Fulfill: win a fight while outnumbered (Gideon) — attacker survived, fewer allies
  if (effHealth(attacker) > 0 && state.players[p].board.length < state.players[foe].board.length) {
    attacker.wonOutnumbered = true;
  }
  attacker.ready = false;
  attacker.attacksThisTurn += 1;
  settle(state, sink, rng, p);
}

// ---- engine context (the Ctx the effect interpreter calls into) ------------

function makeCtx(state: GameState, sink: EventSink, rng: Rng, controller: PlayerId): Ctx {
  const registry = DEFS;
  const unitsOf = (p: PlayerId) => state.players[p].board;
  /** Zadok: "whenever you restore health, restore 1 more" */
  const healBonus = (): number => {
    let bonus = 0;
    const pl = state.players[controller];
    for (const src of [...pl.board, ...pl.relics]) {
      for (const op of src.effects.passive ?? []) {
        if (op.verb === 'onHealBonus') bonus += op.amount ?? 1;
      }
    }
    return bonus;
  };
  const addToHand = (p: PlayerId, def: CardDef) => {
    const pl = state.players[p];
    if (pl.hand.length >= state.rules.handLimit) {
      pl.discard.push(def); sink.emit({ t: 'burnCard', player: p, defId: def.id });
    } else {
      pl.hand.push(def); sink.emit({ t: 'returnToHand', player: p, defId: def.id });
    }
  };
  /** pull ONE copy of defId out of the discard/fallen records (it left the grave) */
  const unbury = (p: PlayerId, defId: string) => {
    const pl = state.players[p];
    const di = pl.discard.findIndex((c) => c.id === defId);
    if (di >= 0) pl.discard.splice(di, 1);
    for (let i = pl.fallen.length - 1; i >= 0; i--) {
      if (pl.fallen[i].defId === defId) { pl.fallen.splice(i, 1); break; }
    }
  };
  const ctx: Ctx = {
    state, sink, rng, registry, controller,
    opponent: other, unitsOf,
    defOf: (defId) => DEFS.get(defId),
    dealToUnit: (u, amount) => damageUnit(state, sink, u, amount),
    dealToHero: (p, amount, src) => damageHero(state, sink, p, amount, src),
    healUnit: (u, amount) => {
      if (amount <= 0) return;
      const cap = u.maxHealth + (u.auraHp ?? 0) - u.health;
      const healed = Math.min(amount + healBonus(), Math.max(0, cap));
      if (healed > 0) { u.health += healed; sink.emit({ t: 'heal', targetUid: u.uid, amount: healed }); }
    },
    healHero: (p, amount) => {
      if (amount <= 0) return;
      const pl = state.players[p]; const before = pl.heroHp;
      pl.heroHp = Math.min(pl.heroMaxHp, pl.heroHp + amount + healBonus());
      if (pl.heroHp > before) sink.emit({ t: 'heroHeal', player: p, amount: pl.heroHp - before });
    },
    buff: (u, atk, hp) => { u.attack += atk; u.maxHealth += hp; u.health += hp;
      sink.emit({ t: 'buff', uid: u.uid, attack: atk, health: hp }); },
    tempBuff: (u, atk) => { u.tempAtk = (u.tempAtk ?? 0) + atk;
      sink.emit({ t: 'buff', uid: u.uid, attack: atk, health: 0 }); },
    giveKeyword: (u, k) => { if (!u.keywords.includes(k)) u.keywords.push(k);
      if (k === 'endure') u.endure = true; sink.emit({ t: 'keyword', uid: u.uid, keyword: k, gained: true }); },
    silence: (u) => { u.keywords = []; u.effects = {}; u.endure = false;
      u.auraAtk = 0; u.auraHp = 0; u.auraKw = []; u.tempAtk = 0;
      sink.emit({ t: 'silence', uid: u.uid }); },
    setAttack: (u, atk) => { u.attack = atk; sink.emit({ t: 'setAttack', uid: u.uid, attack: atk }); },
    summon: (owner, defId, position, withKeyword) => {
      const u = summonToken(state, sink, owner, defId, position);
      if (u && withKeyword && !u.keywords.includes(withKeyword)) {
        u.keywords.push(withKeyword);
        if (withKeyword === 'swift') u.ready = true;
        if (withKeyword === 'endure') u.endure = true;
        sink.emit({ t: 'keyword', uid: u.uid, keyword: withKeyword, gained: true });
      }
      return u;
    },
    draw: (p, n) => draw(state, sink, rng, p, n),
    drawRandom: (p, n) => {
      const pl = state.players[p];
      for (let i = 0; i < n && pl.deck.length; i++) {
        const [card] = pl.deck.splice(rng.int(pl.deck.length), 1);
        addToHandViaDraw(state, sink, p, card);
      }
    },
    drawType: (p, type, tag, n, random) => drawType(state, sink, rng, p, type, tag, n, random),
    destroy: (u) => { u.health = -(u.auraHp ?? 0); },
    transform: (u, into) => transformUnit(state, sink, u, into),
    exileUnit: (u) => exileUnit(state, u),
    foreseeChoice: (count, source, targetUid) =>
      openChoice(state, sink, controller, 'foresee', count, 0, source, targetUid),
    discoverChoice: (count, keep, source, targetUid) =>
      openChoice(state, sink, controller, 'discover', count, keep, source, targetUid),
    addToHand: (p, defId) => { const def = DEFS.get(defId) ?? DEFS.get('tok_' + defId); if (def) addToHand(p, def); },
    returnUnitToHand: (u) => {
      const pl = state.players[u.owner];
      const idx = pl.board.indexOf(u);
      if (idx >= 0) { pl.board.splice(idx, 1); recomputeAuras(state, sink); }
      else unbury(u.owner, u.defId);                        // died this settle: leave the grave
      const def = DEFS.get(u.defId);
      if (def) addToHand(u.owner, def);
    },
    shuffleUnitIntoDeck: (u) => {
      const pl = state.players[u.owner];
      const idx = pl.board.indexOf(u);
      if (idx >= 0) { pl.board.splice(idx, 1); recomputeAuras(state, sink); }
      else unbury(u.owner, u.defId);
      const def = DEFS.get(u.defId);
      if (!def) return;
      pl.deck.splice(rng.int(pl.deck.length + 1), 0, def);
      sink.emit({ t: 'shuffleIn', player: u.owner, defId: u.defId });
    },
    raiseFallen: (op) => {
      const pl = state.players[controller];
      // spells / relics come back from the discard pile, not the fallen
      const wantType = op.cardType ?? (op.type !== 'minion' ? op.type : undefined);
      if (wantType && wantType !== 'minion') {
        for (let i = pl.discard.length - 1; i >= 0; i--) {
          if (pl.discard[i].type === wantType) { addToHand(controller, pl.discard.splice(i, 1)[0]); return; }
        }
        return;
      }
      const revive = (defId: string) => {
        unbury(controller, defId);
        if (op.toField) {
          const u = summonToken(state, sink, controller, defId);
          if (u) {
            if (op.health != null) u.health = Math.min(op.health, u.maxHealth);
            if (op.withKeyword) {
              if (!u.keywords.includes(op.withKeyword)) u.keywords.push(op.withKeyword);
              if (op.withKeyword === 'endure') u.endure = true;
              sink.emit({ t: 'keyword', uid: u.uid, keyword: op.withKeyword, gained: true });
            }
          }
        } else {
          const def = DEFS.get(defId);
          if (def) addToHand(controller, def);
        }
      };
      if (op.target === 'alliesDiedThisTurn') {
        const batch = pl.fallen.filter((f) => f.turn === state.turn).map((f) => f.defId);
        for (const defId of batch) revive(defId);
        return;
      }
      if (!pl.fallen.length) return;
      if (op.target === 'strongestFallenAlly') {
        const atk = (defId: string) => DEFS.get(defId)?.attack ?? 0;
        const best = pl.fallen.reduce((a, b) => (atk(b.defId) > atk(a.defId) ? b : a));
        revive(best.defId);
        return;
      }
      // lastFallenAlly / 'fallenAlly' / default: the N most recent fallen minions
      // (Kinsman-Redeemer restricts to units that died THIS turn, returned to hand)
      const pool = op.diedThisTurn ? pl.fallen.filter((f) => f.turn === state.turn) : pl.fallen;
      const n = Math.min(op.count ?? 1, pool.length);
      for (const f of pool.slice(-n).reverse()) revive(f.defId);
    },
    queueDelayedReturn: (p, into, turns) => { state.players[p].delayed.push({ into, remaining: turns }); },
    onceGate: (p, key) => {
      const pl = state.players[p];
      if (pl.usedOnce.includes(key)) return false;
      pl.usedOnce.push(key);
      return true;
    },
    peekTopOfDeck: (p) => state.players[p].deck[0],
  };
  return ctx;
}

/** deck -> hand respecting the hand limit (shared by draw paths). */
function addToHandViaDraw(state: GameState, sink: EventSink, p: PlayerId, card: CardDef): void {
  const pl = state.players[p];
  if (pl.hand.length >= state.rules.handLimit) {
    pl.discard.push(card); sink.emit({ t: 'burnCard', player: p, defId: card.id });
  } else {
    pl.hand.push(card); sink.emit({ t: 'draw', player: p, defId: card.id, toHandSize: pl.hand.length });
  }
}

function findUnitByUid(state: GameState, uid: number): UnitInstance | undefined {
  for (const pl of state.players) {
    const u = pl.board.find((x) => x.uid === uid) ?? pl.relics.find((x) => x.uid === uid);
    if (u) return u;
  }
  return undefined;
}

// ---- interactive choices (Foresee / Discover) ------------------------------

/** Reveal the top `count` of a player's deck. For the interactive player, set
 *  a pending choice and stop; for everyone else, auto-resolve inline so the
 *  engine stays fully-resolving (AI, headless, lookahead). The revealed cards
 *  stay in the deck until resolveChoice pulls them. */
function openChoice(state: GameState, sink: EventSink, player: PlayerId,
                    kind: 'foresee' | 'discover', count: number, keep: number,
                    source?: UnitInstance, targetUid?: number): void {
  const pl = state.players[player];
  const n = Math.min(count, pl.deck.length);
  if (n <= 0) return;                                    // empty deck → nothing to do
  if (state.interactivePlayer === player) {
    state.pending = {
      kind, player, cardIds: pl.deck.slice(0, n).map((c) => c.id),
      pick: kind === 'discover' ? Math.min(keep, n) : 0,
      resume: [], sourceUid: source?.uid, targetUid,
    };
    sink.emit(kind === 'foresee' ? { t: 'foresee', player, count: n } : { t: 'discover', player, count: n });
    return;
  }
  // auto-resolve inline
  if (kind === 'foresee') return;                        // reveal only (keep order)
  const k = Math.min(keep, n);
  const slice = pl.deck.splice(0, n);
  for (let i = 0; i < k; i++) addToHandViaDraw(state, sink, player, slice[i]);
  for (let i = k; i < n; i++) pl.deck.push(slice[i]);    // unpicked → bottom
}

/** Apply the interactive player's Foresee reorder / Discover pick, then run any
 *  ops that were queued to run after the choice (e.g. Elisha's heal) and settle. */
function resolveChoice(state: GameState, sink: EventSink, rng: Rng,
                       action: { keep?: number[]; bottom?: number[]; picked?: number[] }): void {
  const pc = state.pending;
  if (!pc) return;
  const pl = state.players[pc.player];
  const n = pc.cardIds.length;
  const slice = pl.deck.splice(0, n);                    // pull the revealed cards
  const inRange = (i: number) => i >= 0 && i < n;

  if (pc.kind === 'foresee') {
    const bottom = new Set((action.bottom ?? []).filter(inRange));
    const keep = (action.keep ?? []).filter((i) => inRange(i) && !bottom.has(i));
    const mentioned = new Set([...keep, ...bottom]);
    // kept order first, then any card the UI didn't mention (still on top)
    const topIdx = [...keep, ...slice.map((_, i) => i).filter((i) => !mentioned.has(i))];
    pl.deck.unshift(...topIdx.map((i) => slice[i]));
    pl.deck.push(...[...bottom].map((i) => slice[i]));
  } else {
    const picked = (action.picked ?? Array.from({ length: pc.pick }, (_, i) => i)).filter(inRange);
    const set = new Set(picked);
    for (const i of picked) addToHandViaDraw(state, sink, pc.player, slice[i]);
    for (let i = 0; i < n; i++) if (!set.has(i)) pl.deck.push(slice[i]);  // unpicked → bottom
  }

  const { resume, sourceUid, targetUid } = pc;
  state.pending = null;
  const ctx = makeCtx(state, sink, rng, pc.player);
  runTrigger(ctx, resume, sourceUid != null ? findUnitByUid(state, sourceUid) : undefined, targetUid);
  settle(state, sink, rng, pc.player);
}

// token/def resolution: effects reference def ids (e.g. 'tok_sheep'); the token
// registry is injected once at startup via registerDefs so summon() can build them.
const DEFS = new Map<string, CardDef>();
export function registerDefs(defs: CardDef[]): void {
  for (const d of defs) DEFS.set(d.id, d);
}

function summonToken(state: GameState, sink: EventSink, owner: PlayerId,
                     defId: string, position?: number): UnitInstance | null {
  const def = DEFS.get(defId) ?? DEFS.get('tok_' + defId);
  const pl = state.players[owner];
  if (!def || pl.board.length >= state.rules.boardLimit) return null;
  const u = makeUnit(state, def, owner);
  u.ready = u.keywords.includes('swift');
  const pos = position != null ? position : pl.board.length;
  pl.board.splice(pos, 0, u);
  sink.emit({ t: 'summon', uid: u.uid, defId: u.defId, owner, position: pos });
  recomputeAuras(state, sink);
  return u;
}

// ---- damage, death, fulfill ------------------------------------------------

function damageUnit(state: GameState, sink: EventSink, u: UnitInstance, amount: number): void {
  if (amount <= 0) return;
  if (u.endure) { u.endure = false; sink.emit({ t: 'endureShatter', uid: u.uid }); return; }
  u.health -= amount;
  sink.emit({ t: 'damage', targetUid: u.uid, amount });
  if (effHealth(u) > 0) {
    u.survivedDamage = true;                               // Fulfill: survive damage (Simon→Peter)
    // self_damaged listeners queue their delayed ops (Job's restoration at dawn)
    for (const op of u.effects.trigger ?? []) {
      if (op.on === 'self_damaged' && op.delayToNextTurn) {
        const { delayToNextTurn: _d, on: _o, ...rest } = op;
        u.pending = [...(u.pending ?? []), rest as EffectOp];
      }
    }
  }
}

function damageHero(state: GameState, sink: EventSink, p: PlayerId, amount: number, src?: number): void {
  if (amount <= 0) return;
  const pl = state.players[p];
  pl.heroHp -= amount;
  sink.emit({ t: 'heroDamage', player: p, amount, sourceUid: src });
}

/** Resolve deaths, run their triggers, recompute auras, check Fulfills, check win. Loops to fixpoint. */
function settle(state: GameState, sink: EventSink, rng: Rng, controller: PlayerId): void {
  let guard = 0;
  while (guard++ < 64) {
    const dead: UnitInstance[] = [];
    for (const pl of state.players) for (const u of pl.board) if (effHealth(u) <= 0) dead.push(u);
    if (dead.length === 0) break;
    for (const u of dead) {
      const pl = state.players[u.owner];
      const idx = pl.board.indexOf(u);
      if (idx < 0) continue;
      pl.board.splice(idx, 1);
      const ctx = makeCtx(state, sink, rng, u.owner);

      // death replacement (Jonah swims, Elijah rides, Joseph waits)
      const replaced = (u.effects.onDeath ?? []).some((op) => op.replaceDeath);
      if (!replaced) {
        const def = DEFS.get(u.defId);
        if (def) { pl.discard.push(def); pl.fallen.push({ defId: u.defId, turn: state.turn }); }
      }
      sink.emit({ t: 'death', uid: u.uid, defId: u.defId, owner: u.owner });
      if (u.effects.onDeath) runTrigger(ctx, u.effects.onDeath, u);

      if (u.effects.legacy) { sink.emit({ t: 'legacy', uid: u.uid, defId: u.defId }); runTrigger(ctx, u.effects.legacy, u); }
      if (u.effects.redeem) { sink.emit({ t: 'redeem', uid: u.uid, defId: u.defId }); runTrigger(ctx, u.effects.redeem, u); }
      if (u.keywords.includes('scatter')) {
        sink.emit({ t: 'scatter', uid: u.uid, defId: u.defId });
        summonToken(state, sink, u.owner, 'tok_disciple');
        // extra Scatter ops (Stephen scatters two)
        if (u.effects.scatter) runTrigger(ctx, u.effects.scatter, u);
      } else if (u.effects.scatter) {
        sink.emit({ t: 'scatter', uid: u.uid, defId: u.defId });
        runTrigger(ctx, u.effects.scatter, u);
      }

      // ---- listeners on the owner's other units/relics ----
      const listeners = [...pl.board, ...pl.relics];
      if (isSheep(u)) {
        for (const v of listeners) {
          if (v.effects.redeem?.some((op) => op.trigger === 'friendlySheepDies')) {
            const vctx = makeCtx(state, sink, rng, v.owner);
            sink.emit({ t: 'redeem', uid: v.uid, defId: v.defId });
            runTrigger(vctx, v.effects.redeem, v, undefined, 'friendlySheepDies');
          }
        }
      }
      for (const v of listeners) {
        // Ruth: whenever another ally dies, gain +1/+1
        if (v !== u && v.effects.trigger?.some((op) => op.on === 'ally_death')) {
          runTrigger(makeCtx(state, sink, rng, v.owner), v.effects.trigger, v, undefined, 'ally_death');
        }
        // Samuel: Raise — once per turn, when an ally dies, restore it
        if (v !== u && !replaced && v.effects.raise && v.raiseUsedTurn !== state.turn) {
          const ops = v.effects.raise.filter((op) => !op.oncePerTurn || v.raiseUsedTurn !== state.turn);
          if (ops.length) {
            v.raiseUsedTurn = state.turn;
            runTrigger(makeCtx(state, sink, rng, v.owner), ops, v);
          }
        }
      }
    }
    recomputeAuras(state, sink);
  }
  recomputeAuras(state, sink);
  checkFulfills(state, sink, rng);
  checkWin(state, sink);
}

function checkFulfills(state: GameState, sink: EventSink, rng: Rng): void {
  for (const pl of state.players) {
    for (const u of [...pl.board]) {
      if (!u.fulfill) continue;
      if (fulfillMet(state, u)) transformUnit(state, sink, u, u.fulfill.into);
    }
  }
}

function fulfillMet(state: GameState, u: UnitInstance): boolean {
  const f = u.fulfill!;
  const allies = state.players[u.owner].board;
  switch (f.condition) {
    case 'control_allies': return allies.filter((x) => x.uid !== u.uid).length >= (f.value ?? 3);
    case 'slay_giant': return !!u.slewGiant;
    case 'survive_damage': return !!u.survivedDamage;
    case 'survive_stronger': return !!u.survivedStronger;          // Jacob wrestles
    case 'survive_damaged_turn': return !!u.survivedDamagedTurn;   // Daniel in the den
    case 'hero_damaged':                                            // Hezekiah, Caleb, Esther…
      return state.players[u.owner].heroHp < state.players[u.owner].heroMaxHp;
    case 'cast_spells':                                            // Miriam, Habakkuk
      return (state.players[u.owner].spellsCast ?? 0) - (u.spellsAtEntry ?? 0) >= (f.value ?? 2);
    case 'outnumbered_win': return !!u.wonOutnumbered;             // Gideon
    // Saul→Paul: the one automatic, unearned Fulfill (grace, not works —
    // CLAUDE.md §6). Fires at the start of the owner's next turn, no condition.
    case 'auto_next_turn': return state.turn >= (u.enteredTurn ?? 0) + 2;
    default: return false;                                   // other conditions: framework in place
  }
}

function transformUnit(state: GameState, sink: EventSink, u: UnitInstance, intoDefId: string): void {
  const def = DEFS.get(intoDefId);
  if (!def) return;
  const from = u.defId;
  u.defId = def.id; u.name = def.name;
  u.attack = def.attack ?? 0;
  u.maxHealth = def.health ?? u.maxHealth;
  u.health = u.maxHealth;                                    // heal to new max, clear damage
  u.keywords = [...(def.keywords ?? [])] as Keyword[];
  u.effects = def.effects ? structuredClone(def.effects) : {};
  u.fulfill = def.fulfill;                                   // usually undefined on fulfilled form
  u.endure = u.keywords.includes('endure');
  u.slewGiant = false; u.survivedDamage = false;
  u.survivedStronger = false; u.survivedDamagedTurn = false;
  u.tempAtk = 0; u.covenantTicks = 0; u.enteredTurn = state.turn; u.pending = undefined;
  // keeps uid, owner, board position, ready state (no re-summoning-sickness)
  sink.emit({ t: 'fulfill', uid: u.uid, fromDef: from, intoDef: def.id });
  recomputeAuras(state, sink);
}

function exileUnit(state: GameState, u: UnitInstance): void {
  const pl = state.players[u.owner];
  const idx = pl.board.indexOf(u);
  if (idx >= 0) pl.board.splice(idx, 1);
  const def = DEFS.get(u.defId);
  if (def) pl.exiled.push(def);
}

function checkWin(state: GameState, sink: EventSink): void {
  const dead0 = state.players[0].heroHp <= 0;
  const dead1 = state.players[1].heroHp <= 0;
  if (dead0 || dead1) {
    // if both somehow died, the active player's opponent... default: player 1 loses ties to attacker
    const winner: PlayerId = dead1 ? 0 : 1;
    state.winner = winner;
    state.phase = 'over';
    sink.emit({ t: 'gameOver', winner });
  }
}

// ---- draw / fatigue --------------------------------------------------------

function draw(state: GameState, sink: EventSink, rng: Rng, p: PlayerId, n: number): void {
  const pl = state.players[p];
  for (let i = 0; i < n; i++) {
    if (pl.deck.length === 0) {
      pl.fatigue += 1;
      sink.emit({ t: 'fatigue', player: p, amount: pl.fatigue });
      damageHero(state, sink, p, pl.fatigue);
      continue;
    }
    const card = pl.deck.shift()!;
    if (pl.hand.length >= state.rules.handLimit) {
      pl.discard.push(card);
      sink.emit({ t: 'burnCard', player: p, defId: card.id });   // over hand limit → burned
    } else {
      pl.hand.push(card);
      sink.emit({ t: 'draw', player: p, defId: card.id, toHandSize: pl.hand.length });
    }
  }
}

function drawType(state: GameState, sink: EventSink, rng: Rng, p: PlayerId, type: string,
                  tag: string | undefined, n: number, random?: boolean): void {
  const pl = state.players[p];
  for (let i = 0; i < n; i++) {
    const matches = pl.deck.reduce<number[]>((acc, c, idx) => {
      if (c.type === type && (!tag || c.tag === tag)) acc.push(idx);
      return acc;
    }, []);
    if (!matches.length) break;
    const idx = random ? matches[rng.int(matches.length)] : matches[0];
    const [card] = pl.deck.splice(idx, 1);
    addToHandViaDraw(state, sink, p, card);
  }
}

// ---- auras (attack / health / granted keywords) -----------------------------

/** condition strings like control_david / control_ruth: "you control an X" */
function auraConditionMet(state: GameState, src: UnitInstance, condition?: string): boolean {
  if (!condition) return true;
  if (condition === 'outnumbered') {                            // Gideon: enemy has more units
    return state.players[src.owner].board.length < state.players[other(src.owner)].board.length;
  }
  if (condition.startsWith('control_')) {
    const who = condition.slice('control_'.length);
    return state.players[src.owner].board.some((a) => a.uid !== src.uid && a.defId.includes(who));
  }
  return false; // unknown conditions fail closed (the audit flags them)
}

function recomputeAuras(state: GameState, sink?: EventSink): void {
  const before = new Map<number, string>();
  for (const pl of state.players) for (const u of pl.board) {
    before.set(u.uid, `${u.auraAtk}|${u.auraHp}|${(u.auraKw ?? []).join(',')}`);
    u.auraAtk = 0; u.auraHp = 0; u.auraKw = [];
  }
  for (const pl of state.players) {
    for (const src of [...pl.board, ...pl.relics]) {
      for (const op of src.effects.aura ?? []) {
        if (op.verb !== 'buff' && op.verb !== 'auraBuff') continue;
        if (!auraConditionMet(state, src, op.condition)) continue;
        let targets: UnitInstance[];
        switch (op.target) {
          case 'allEnemies': targets = state.players[other(src.owner)].board; break;
          case 'self': targets = pl.board.includes(src) ? [src] : []; break;
          case 'friendlySheep': targets = pl.board.filter(isSheep); break;
          default: // allAllies — "your OTHER units" unless the source is a relic
            targets = pl.board.filter((t) => t.uid !== src.uid);
        }
        for (const t of targets) {
          if (op.attack) t.auraAtk += op.attack;
          if (op.health) t.auraHp += op.health;
          if (op.grantKeyword && !t.auraKw.includes(op.grantKeyword)) t.auraKw.push(op.grantKeyword);
        }
      }
    }
  }
  if (sink) {
    for (const pl of state.players) for (const u of pl.board) {
      const now = `${u.auraAtk}|${u.auraHp}|${u.auraKw.join(',')}`;
      if (before.get(u.uid) !== now) {
        sink.emit({ t: 'auraUpdate', uid: u.uid, attack: u.auraAtk, health: u.auraHp, keywords: [...u.auraKw] });
      }
    }
  }
}
