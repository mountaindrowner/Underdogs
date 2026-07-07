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
  type CardDef, type Action, type RuleConfig, type Keyword, DEFAULT_RULES,
} from './types.ts';
import { EventSink, type GameEvent } from './events.ts';
import { makeRng, rngFromState, type Rng } from './rng.ts';
import { runTrigger, type Ctx } from './effects.ts';

export interface GameConfig {
  seed: number;
  decks: [CardDef[], CardDef[]];
  leaders?: [CardDef | undefined, CardDef | undefined];
  rules?: Partial<RuleConfig>;
  skipMulligan?: boolean;
}

const other = (p: PlayerId): PlayerId => (p === 0 ? 1 : 0);

function makeUnit(state: GameState, def: CardDef, owner: PlayerId): UnitInstance {
  const kws = [...(def.keywords ?? [])] as Keyword[];
  return {
    uid: state.nextUid++, defId: def.id, name: def.name, owner,
    attack: def.attack ?? 0, health: def.health ?? 0, maxHealth: def.health ?? 0,
    keywords: kws, effects: def.effects ? structuredClone(def.effects) : {},
    fulfill: def.fulfill, ready: false, attacksThisTurn: 0,
    endure: kws.includes('endure'), auraAtk: 0,
  };
}

export function effAttack(u: UnitInstance): number {
  return Math.max(0, u.attack + u.auraAtk);
}

// ---- setup -----------------------------------------------------------------

export function createGame(cfg: GameConfig): { state: GameState; events: GameEvent[] } {
  const rules = { ...DEFAULT_RULES, ...(cfg.rules ?? {}) };
  const rng = makeRng(cfg.seed);
  const mkPlayer = (id: PlayerId, deck: CardDef[], leader?: CardDef): PlayerState => {
    const d = rng.shuffle([...deck]);
    const hp: PlayerState['heroPower'] = leader?.hero_power
      ? { name: leader.hero_power.name, cost: leader.hero_power.cost,
          effects: leader.effects?.arrival ?? [], usedThisTurn: false }
      : undefined;
    return {
      id, heroHp: rules.heroHp, heroMaxHp: rules.heroHp,
      provision: 0, provisionMax: 0,
      deck: d, hand: [], board: [], discard: [], exiled: [],
      fatigue: 0, heroPower: hp, leaderId: leader?.id,
    };
  };
  const state: GameState = {
    players: [mkPlayer(0, cfg.decks[0], cfg.leaders?.[0]),
              mkPlayer(1, cfg.decks[1], cfg.leaders?.[1])],
    active: 0, turn: 0, phase: 'mulligan', rngState: rng.state,
    nextUid: 1, winner: null, rules,
  };
  const sink = new EventSink();
  sink.emit({ t: 'gameStart', seed: cfg.seed, first: 0 });
  // opening hands: first player draws startingHand, second draws +1
  dealOpening(state, sink, rng, 0, rules.startingHand);
  dealOpening(state, sink, rng, 1, rules.startingHand + 1);
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
  switch (action.type) {
    case 'MULLIGAN': return doMulligan(state, sink, rng, action.keep);
    case 'PLAY_CARD': return playCard(state, sink, rng, action.handIndex, action.targetUid, action.position);
    case 'ATTACK': return attack(state, sink, rng, action.attackerUid, action.targetUid);
    case 'HERO_POWER': return heroPower(state, sink, rng, action.targetUid);
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
  for (const u of pl.board) { u.ready = true; u.attacksThisTurn = 0; u.survivedDamage = false; }
  pl.provisionMax = Math.min(state.rules.provisionCap, pl.provisionMax + 1);
  pl.provision = pl.provisionMax;
  if (pl.heroPower) pl.heroPower.usedThisTurn = false;
  sink.emit({ t: 'provision', player: p, current: pl.provision, max: pl.provisionMax });
  const ctx = makeCtx(state, sink, rng, p);
  // Covenant (start-of-turn) triggers
  for (const u of [...pl.board]) runTrigger(ctx, u.effects.covenant, u);
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
  beginTurn(state, sink, rng, other(p));
}

// ---- actions ---------------------------------------------------------------

function playCard(state: GameState, sink: EventSink, rng: Rng, handIndex: number,
                  targetUid?: number, position?: number): void {
  if (state.phase !== 'main') return;
  const p = state.active;
  const pl = state.players[p];
  const card = pl.hand[handIndex];
  if (!card) return;
  const cost = card.cost ?? 0;
  if (pl.provision < cost) return;                          // illegal: not enough Provision
  if (card.type === 'minion' && pl.board.length >= state.rules.boardLimit) return; // board full
  pl.provision -= cost;
  pl.hand.splice(handIndex, 1);
  sink.emit({ t: 'cardPlayed', player: p, defId: card.id });
  sink.emit({ t: 'provision', player: p, current: pl.provision, max: pl.provisionMax });
  const ctx = makeCtx(state, sink, rng, p);

  if (card.type === 'minion') {
    const u = makeUnit(state, card, p);
    const pos = position != null ? Math.max(0, Math.min(position, pl.board.length)) : pl.board.length;
    pl.board.splice(pos, 0, u);
    u.ready = u.keywords.includes('swift');                 // summoning sickness unless Swift
    sink.emit({ t: 'summon', uid: u.uid, defId: u.defId, owner: p, position: pos });
    recomputeAuras(state);
    runTrigger(ctx, u.effects.arrival, u, targetUid);       // Arrival: (battlecry)
  } else {
    // spell / relic: run its arrival-keyed effects, then discard
    runTrigger(ctx, card.effects?.arrival, undefined, targetUid);
    pl.discard.push(card);
  }
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
  settle(state, sink, rng, p);
}

function attack(state: GameState, sink: EventSink, rng: Rng, attackerUid: number,
                targetUid: number | 'hero'): void {
  if (state.phase !== 'main') return;
  const p = state.active;
  const foe = other(p);
  const attacker = state.players[p].board.find((u) => u.uid === attackerUid);
  if (!attacker || !attacker.ready || attacker.attacksThisTurn >= 1 || effAttack(attacker) <= 0) return;

  const enemies = state.players[foe].board;
  const guards = enemies.filter((u) => u.keywords.includes('guard'));
  let target: UnitInstance | undefined;
  if (targetUid !== 'hero') {
    target = enemies.find((u) => u.uid === targetUid);
    if (!target) return;
    if (guards.length && !target.keywords.includes('guard')) return;  // must hit Guard first
  } else {
    if (guards.length) return;                                        // can't go face past Guard
  }

  sink.emit({ t: 'attackDeclared', attacker: attacker.uid,
    target: targetUid, targetOwner: foe });
  const ctx = makeCtx(state, sink, rng, p);

  if (target) {
    const slaysGiant = attacker.keywords.includes('giant_slayer') && target.attack >= 4;
    if (slaysGiant) {
      ctx.destroy(target);
      attacker.slewGiant = true;                            // Fulfill: slay a giant
    } else {
      ctx.dealToUnit(target, effAttack(attacker), attacker.uid);
      ctx.dealToUnit(attacker, effAttack(target), target.uid); // counter-damage
    }
  } else {
    ctx.dealToHero(foe, effAttack(attacker), attacker.uid);
  }
  attacker.ready = false;
  attacker.attacksThisTurn += 1;
  settle(state, sink, rng, p);
}

// ---- engine context (the Ctx the effect interpreter calls into) ------------

function makeCtx(state: GameState, sink: EventSink, rng: Rng, controller: PlayerId): Ctx {
  const registry = new Map<string, CardDef>();   // populated lazily via summon lookups
  const unitsOf = (p: PlayerId) => state.players[p].board;
  const ctx: Ctx = {
    state, sink, rng, registry, controller,
    opponent: other, unitsOf,
    dealToUnit: (u, amount) => damageUnit(state, sink, u, amount),
    dealToHero: (p, amount, src) => damageHero(state, sink, p, amount, src),
    healUnit: (u, amount) => { const before = u.health; u.health = Math.min(u.maxHealth, u.health + amount);
      if (u.health > before) sink.emit({ t: 'heal', targetUid: u.uid, amount: u.health - before }); },
    healHero: (p, amount) => { const pl = state.players[p]; const before = pl.heroHp;
      pl.heroHp = Math.min(pl.heroMaxHp, pl.heroHp + amount);
      if (pl.heroHp > before) sink.emit({ t: 'heroHeal', player: p, amount: pl.heroHp - before }); },
    buff: (u, atk, hp) => { u.attack += atk; u.maxHealth += hp; u.health += hp;
      sink.emit({ t: 'buff', uid: u.uid, attack: atk, health: hp }); },
    giveKeyword: (u, k) => { if (!u.keywords.includes(k)) u.keywords.push(k);
      if (k === 'endure') u.endure = true; sink.emit({ t: 'keyword', uid: u.uid, keyword: k, gained: true }); },
    silence: (u) => { u.keywords = []; u.effects = {}; u.endure = false; u.auraAtk = 0;
      sink.emit({ t: 'silence', uid: u.uid }); },
    setAttack: (u, atk) => { u.attack = atk; sink.emit({ t: 'setAttack', uid: u.uid, attack: atk }); },
    summon: (owner, defId, position) => summonToken(state, sink, owner, defId, position),
    draw: (p, n) => draw(state, sink, rng, p, n),
    drawType: (p, type, tag, n) => drawType(state, sink, p, type, tag, n),
    destroy: (u) => { u.health = 0; },
    transform: (u, into) => transformUnit(state, sink, u, into),
    exileUnit: (u) => exileUnit(state, u),
    foresee: (p, count) => sink.emit({ t: 'foresee', player: p, count }),
    discover: (p, count) => sink.emit({ t: 'discover', player: p, count }),
  };
  return ctx;
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
  recomputeAuras(state);
  return u;
}

// ---- damage, death, fulfill ------------------------------------------------

function damageUnit(state: GameState, sink: EventSink, u: UnitInstance, amount: number): void {
  if (amount <= 0) return;
  if (u.endure) { u.endure = false; sink.emit({ t: 'endureShatter', uid: u.uid }); return; }
  u.health -= amount;
  sink.emit({ t: 'damage', targetUid: u.uid, amount });
  if (u.health > 0) u.survivedDamage = true;               // Fulfill: survive damage (Simon→Peter)
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
    for (const pl of state.players) for (const u of pl.board) if (u.health <= 0) dead.push(u);
    if (dead.length === 0) break;
    for (const u of dead) {
      const pl = state.players[u.owner];
      const idx = pl.board.indexOf(u);
      if (idx < 0) continue;
      pl.board.splice(idx, 1);
      const def = DEFS.get(u.defId);
      if (def) pl.discard.push(def);
      sink.emit({ t: 'death', uid: u.uid, defId: u.defId, owner: u.owner });
      const ctx = makeCtx(state, sink, rng, u.owner);
      if (u.effects.legacy) { sink.emit({ t: 'legacy', uid: u.uid, defId: u.defId }); runTrigger(ctx, u.effects.legacy, u); }
      if (u.effects.redeem) { sink.emit({ t: 'redeem', uid: u.uid, defId: u.defId }); runTrigger(ctx, u.effects.redeem, u); }
      if (u.keywords.includes('scatter')) { sink.emit({ t: 'scatter', uid: u.uid, defId: u.defId }); summonToken(state, sink, u.owner, 'tok_disciple'); }
    }
    recomputeAuras(state);
  }
  recomputeAuras(state);
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
  // keeps uid, owner, board position, ready state (no re-summoning-sickness)
  sink.emit({ t: 'fulfill', uid: u.uid, fromDef: from, intoDef: def.id });
  recomputeAuras(state);
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

function drawType(state: GameState, sink: EventSink, p: PlayerId, type: string,
                  tag: string | undefined, n: number): void {
  const pl = state.players[p];
  for (let i = 0; i < n; i++) {
    const idx = pl.deck.findIndex((c) => c.type === type && (!tag || c.tag === tag));
    if (idx < 0) break;
    const [card] = pl.deck.splice(idx, 1);
    if (pl.hand.length >= state.rules.handLimit) {
      pl.discard.push(card); sink.emit({ t: 'burnCard', player: p, defId: card.id });
    } else {
      pl.hand.push(card); sink.emit({ t: 'draw', player: p, defId: card.id, toHandSize: pl.hand.length });
    }
  }
}

// ---- auras (attack only in v1) ---------------------------------------------

function recomputeAuras(state: GameState): void {
  for (const pl of state.players) for (const u of pl.board) u.auraAtk = 0;
  for (const pl of state.players) {
    for (const src of pl.board) {
      const aura = src.effects.aura;
      if (!aura) continue;
      for (const op of aura) {
        if (op.verb !== 'buff' || !op.attack) continue;
        const targets = op.target === 'allEnemies'
          ? state.players[other(src.owner)].board
          : pl.board;                                        // allAllies (default)
        for (const t of targets) if (t.uid !== src.uid) t.auraAtk += op.attack; // "your OTHER units"
      }
    }
  }
}
