/**
 * Effect-verb interpreter + targeting. Card `effects` are DATA: a map of
 * trigger -> EffectOp[]. This module executes those ops against an engine
 * context (Ctx) whose low-level mutators are implemented in engine.ts. Adding
 * a card should never need new engine code unless it needs a genuinely new verb.
 */
import type {
  GameState, UnitInstance, PlayerId, CardDef, EffectOp, TargetSpec, Keyword, CardType,
} from './types.ts';
import type { EventSink } from './events.ts';
import type { Rng } from './rng.ts';

export type Target =
  | { kind: 'unit'; unit: UnitInstance }
  | { kind: 'hero'; player: PlayerId };

/** Engine-provided capabilities the interpreter calls into. */
export interface Ctx {
  state: GameState;
  sink: EventSink;
  rng: Rng;
  registry: Map<string, CardDef>;
  /** the player whose effect is resolving (source controller) */
  controller: PlayerId;
  opponent(p: PlayerId): PlayerId;
  unitsOf(p: PlayerId): UnitInstance[];
  defOf(defId: string): CardDef | undefined;
  dealToUnit(u: UnitInstance, amount: number, srcUid?: number): void;
  dealToHero(p: PlayerId, amount: number, srcUid?: number): void;
  healUnit(u: UnitInstance, amount: number): void;
  healHero(p: PlayerId, amount: number): void;
  buff(u: UnitInstance, atk: number, hp: number): void;
  tempBuff(u: UnitInstance, atk: number): void;
  giveKeyword(u: UnitInstance, k: Keyword): void;
  silence(u: UnitInstance): void;
  setAttack(u: UnitInstance, atk: number): void;
  summon(owner: PlayerId, defId: string, position?: number, withKeyword?: Keyword): UnitInstance | null;
  draw(p: PlayerId, n: number): void;
  drawRandom(p: PlayerId, n: number): void;
  drawType(p: PlayerId, type: string, tag: string | undefined, n: number, random?: boolean): void;
  destroy(u: UnitInstance): void;
  transform(u: UnitInstance, intoDefId: string): void;
  exileUnit(u: UnitInstance): void;
  foresee(p: PlayerId, count: number): void;
  discover(p: PlayerId, count: number): void;
  addToHand(p: PlayerId, defId: string): void;
  returnUnitToHand(u: UnitInstance): void;
  shuffleUnitIntoDeck(u: UnitInstance): void;
  raiseFallen(op: EffectOp): void;
  queueDelayedReturn(p: PlayerId, intoDefId: string, turns: number): void;
  /** returns true the FIRST time a oncePerGame key is seen for this player. */
  onceGate(p: PlayerId, key: string): boolean;
  peekTopOfDeck(p: PlayerId): CardDef | undefined;
}

function effAttack(u: UnitInstance): number {
  return Math.max(0, u.attack + (u.auraAtk ?? 0) + (u.tempAtk ?? 0));
}

// ---- tribes (name-based; tokens carry the plain tribe name) -----------------
const wordIn = (name: string, w: string) => new RegExp(`(^|\\s)${w}(s?)($|\\s|,)`, 'i').test(name);
export const isSheep = (u: { name: string }) => wordIn(u.name, 'Sheep') || wordIn(u.name, 'Lamb');
export const isDisciple = (u: { name: string }) => wordIn(u.name, 'Disciple');
export const isHeir = (u: { name: string }) => wordIn(u.name, 'Heir');

/** Explicit-target specs: the PLAYER picks the target when playing the card. */
export function needsExplicitTarget(op: EffectOp): boolean {
  return op.target === 'target' || op.target === 'enemy' || op.target === 'ally'
    || op.target === 'anyUnit' || op.target === 'anyCharacter' || op.target === 'anyFriendlyOrHero'
    || op.target === 'friendlyDisciple';
}

/** Which side an explicit target must belong to (UI highlighting / AI). */
export function targetSide(spec: TargetSpec | undefined): 'enemy' | 'ally' | 'any' {
  switch (spec) {
    case 'enemy': return 'enemy';
    case 'ally': case 'anyFriendlyOrHero': case 'friendlyDisciple': return 'ally';
    default: return 'any';
  }
}

export function resolveTargets(
  ctx: Ctx, spec: TargetSpec | undefined, source: UnitInstance | undefined,
  explicitTargetUid: number | undefined,
): Target[] {
  const me = ctx.controller;
  const foe = ctx.opponent(me);
  const allies = ctx.unitsOf(me);
  const enemies = ctx.unitsOf(foe);
  const pick = (arr: UnitInstance[]): Target[] =>
    arr.length ? [{ kind: 'unit', unit: arr[ctx.rng.int(arr.length)] }] : [];
  const explicit = (pool: UnitInstance[]): Target[] => {
    if (explicitTargetUid == null) return [];
    const u = pool.find((x) => x.uid === explicitTargetUid);
    return u ? [{ kind: 'unit', unit: u }] : [];
  };

  switch (spec) {
    case 'self':
      return source ? [{ kind: 'unit', unit: source }] : [];
    case 'allAllies':
      return allies.map((unit) => ({ kind: 'unit', unit }));
    case 'allEnemies':
      return enemies.map((unit) => ({ kind: 'unit', unit }));
    case 'allEnemiesWithoutGuard':
      return enemies.filter((u) => !u.keywords.includes('guard') && !u.auraKw?.includes('guard'))
        .map((unit) => ({ kind: 'unit', unit }));
    case 'allUnits':
      return [...allies, ...enemies].map((unit) => ({ kind: 'unit', unit }));
    case 'randomAlly':
      return pick(allies);
    case 'randomEnemy':
      return pick(enemies);
    case 'damagedAlly':
      return pick(allies.filter((u) => u.health < u.maxHealth));
    case 'ownHero':
      return [{ kind: 'hero', player: me }];
    case 'enemyHero':
      return [{ kind: 'hero', player: foe }];
    case 'strongestEnemy': {
      if (!enemies.length) return [];
      const u = enemies.reduce((a, b) => (effAttack(b) > effAttack(a) ? b : a));
      return [{ kind: 'unit', unit: u }];
    }
    case 'weakestEnemy': {
      if (!enemies.length) return [];
      const u = enemies.reduce((a, b) => (b.health < a.health ? b : a));
      return [{ kind: 'unit', unit: u }];
    }
    case 'mostHealthEnemy': {
      if (!enemies.length) return [];
      const u = enemies.reduce((a, b) => (b.health + (b.auraHp ?? 0) > a.health + (a.auraHp ?? 0) ? b : a));
      return [{ kind: 'unit', unit: u }];
    }
    case 'cheapestEnemy': {
      if (!enemies.length) return [];
      const cost = (u: UnitInstance) => ctx.defOf(u.defId)?.cost ?? 0;
      const u = enemies.reduce((a, b) => (cost(b) < cost(a) ? b : a));
      return [{ kind: 'unit', unit: u }];
    }
    case 'friendlySheep':
      return allies.filter(isSheep).map((unit) => ({ kind: 'unit', unit }));
    case 'friendlyDisciples':
      return allies.filter(isDisciple).map((unit) => ({ kind: 'unit', unit }));
    case 'friendlyHeirs':
      return allies.filter(isHeir).map((unit) => ({ kind: 'unit', unit }));
    case 'friendlyDisciple': {
      const ex = explicit(allies.filter(isDisciple));
      return ex.length ? ex : pick(allies.filter(isDisciple));
    }
    // explicit-target aliases -------------------------------------------------
    case 'enemy':
      return explicit(enemies);
    case 'ally':
      return explicit(allies);
    case 'anyUnit':
      return explicit([...allies, ...enemies]);
    case 'anyCharacter':
    case 'anyFriendlyOrHero': {
      const pool = spec === 'anyCharacter' ? [...allies, ...enemies] : allies;
      const ex = explicit(pool);
      return ex.length ? ex : [{ kind: 'hero', player: me }];
    }
    case 'target':
    default: {
      return explicit([...allies, ...enemies]);
    }
  }
}

/** per-runTrigger memo so later ops can reference earlier ops' targets */
interface Memo { lastTargetDef?: CardDef }

function opCondition(ctx: Ctx, op: EffectOp, memo: Memo, source?: UnitInstance): boolean {
  const allies = ctx.unitsOf(ctx.controller);
  switch (op.condition) {
    case undefined: return true;
    case 'fewer_units_than_enemy':
      return allies.length < ctx.unitsOf(ctx.opponent(ctx.controller)).length;
    case 'target_is_priest':
      return memo.lastTargetDef?.class === 'priest';
    case 'ally_died_this_turn':
      return ctx.state.players[ctx.controller].fallen.some((f) => f.turn === ctx.state.turn);
    case 'ally_died_this_game':
      return ctx.state.players[ctx.controller].fallen.length > 0;
    case 'control_legendary':
      return allies.some((a) => a.uid !== source?.uid && ctx.defOf(a.defId)?.rarity === 'legendary');
    case 'control_6_plus':
      return allies.length >= 6;
    default: return true; // unknown conditions fail open (audit flags them)
  }
}

/** Execute one effect op. `source` is the unit whose effect this is (if any). */
export function applyEffect(
  ctx: Ctx, op: EffectOp, source?: UnitInstance, explicitTargetUid?: number, memo: Memo = {},
): void {
  if (!opCondition(ctx, op, memo, source)) return;
  // covenant onTurn gate (Enoch: only on the source's Nth turn-start)
  if (op.onTurn != null && source && (source.covenantTicks ?? 0) !== op.onTurn) return;

  const targets = resolveTargets(ctx, op.target, source, explicitTargetUid);
  for (const t of targets) if (t.kind === 'unit') memo.lastTargetDef = ctx.defOf(t.unit.defId);
  const eachUnit = (fn: (u: UnitInstance) => void) => {
    for (const t of targets) if (t.kind === 'unit') fn(t.unit);
  };

  switch (op.verb) {
    case 'deal':
      for (const t of targets) {
        if (t.kind === 'unit') ctx.dealToUnit(t.unit, op.amount ?? 0, source?.uid);
        else ctx.dealToHero(t.player, op.amount ?? 0, source?.uid);
      }
      break;
    case 'conditionalDeal': // condition already checked above
      for (const t of targets) {
        if (t.kind === 'unit') ctx.dealToUnit(t.unit, op.amount ?? 0, source?.uid);
        else ctx.dealToHero(t.player, op.amount ?? 0, source?.uid);
      }
      break;
    case 'healUnit':
    case 'heal':
      eachUnit((u) => ctx.healUnit(u, op.toFull ? u.maxHealth + (u.auraHp ?? 0) : op.amount ?? 0));
      for (const t of targets) if (t.kind === 'hero') {
        const pl = ctx.state.players[t.player];
        ctx.healHero(t.player, op.toFull ? pl.heroMaxHp : op.amount ?? 0);
      }
      break;
    case 'healHero': {
      const heal = (p: PlayerId) =>
        ctx.healHero(p, op.toFull ? ctx.state.players[p].heroMaxHp : op.amount ?? 0);
      if (targets.length) {
        for (const t of targets) if (t.kind === 'hero') heal(t.player);
      } else {
        heal(ctx.controller);
      }
      break;
    }
    case 'buff': {
      let atk = op.attack ?? 0;
      let hp = op.health ?? 0;
      if (op.ifLastCard && ctx.state.players[ctx.controller].hand.length === 0) {
        atk = op.ifLastCard.attack ?? atk; hp = op.ifLastCard.health ?? hp;
      }
      if (op.perEnemyUnit) {
        const n = ctx.unitsOf(ctx.opponent(ctx.controller)).length;
        atk *= n; hp *= n;
      }
      if (op.thisTurn) eachUnit((u) => ctx.tempBuff(u, atk));   // temp hp not modelled
      else eachUnit((u) => ctx.buff(u, atk, hp));
      break;
    }
    case 'gainForEachSheep': {
      if (!source) break;
      const n = ctx.unitsOf(ctx.controller).filter(isSheep).length;
      if (n > 0) ctx.buff(source, (op.attack ?? 0) * n, (op.health ?? 0) * n);
      break;
    }
    case 'auraBuff':
      // one-shot form (Coronation): the chosen ally CARRIES the aura from now on
      if (op.grantToTarget) {
        eachUnit((u) => {
          const aura = { ...op };
          delete aura.grantToTarget; delete aura.target;
          u.effects.aura = [...(u.effects.aura ?? []), { ...aura, target: 'allAllies', scope: 'other' }];
        });
      }
      // (continuous form lives in effects.aura and is handled by recomputeAuras)
      break;
    case 'setAttack':
      eachUnit((u) => ctx.setAttack(u, op.amount ?? op.attack ?? 0));
      break;
    case 'giveKeyword':
      if (op.keyword) eachUnit((u) => ctx.giveKeyword(u, op.keyword!));
      break;
    case 'silence':
      eachUnit((u) => ctx.silence(u));
      break;
    case 'destroy':
      eachUnit((u) => ctx.destroy(u));
      break;
    case 'exile':
      if (op.target === 'self' && source) ctx.exileUnit(source);
      else eachUnit((u) => ctx.exileUnit(u));
      break;
    case 'summon': {
      const n = op.count ?? 1;
      if (op.token) for (let i = 0; i < n; i++) ctx.summon(ctx.controller, op.token, undefined, op.withKeyword);
      break;
    }
    case 'draw':
      ctx.draw(ctx.controller, op.count ?? op.amount ?? 1);
      break;
    case 'drawType':
      ctx.drawType(ctx.controller, (op.type ?? op.cardType ?? 'minion') as CardType, op.tag,
        op.count ?? op.amount ?? 1, op.random);
      break;
    case 'discoverFromDeck':
      // v1 approximation of "Discover; keep N": N random cards from your deck
      ctx.drawRandom(ctx.controller, op.keep ?? 2);
      break;
    case 'transform':
      if (op.into && source) ctx.transform(source, op.into);
      break;
    case 'delayedTransform':
      if (op.into) ctx.queueDelayedReturn(ctx.controller, op.into, op.delayTurns ?? 2);
      break;
    case 'foresee': {
      ctx.foresee(ctx.controller, op.value ?? op.amount ?? op.count ?? 2);
      if (op.drawIfLegendary && ctx.peekTopOfDeck(ctx.controller)?.rarity === 'legendary') {
        ctx.draw(ctx.controller, 1);
      }
      break;
    }
    case 'discover':
      ctx.discover(ctx.controller, op.count ?? 3);
      break;
    case 'returnToHand':
      if (op.oncePerGame && source && !ctx.onceGate(source.owner, `${source.defId}:returnToHand`)) break;
      if (op.token) ctx.addToHand(ctx.controller, op.token);
      else if (op.target === 'self' && source) ctx.returnUnitToHand(source);
      else eachUnit((u) => ctx.returnUnitToHand(u));
      break;
    case 'shuffleIntoDeck':
      if (op.target === 'self' && source) ctx.shuffleUnitIntoDeck(source);
      else eachUnit((u) => ctx.shuffleUnitIntoDeck(u));
      break;
    case 'returnFromDiscard':
      ctx.raiseFallen(op);
      break;
    case 'discountHand':
      // arrival form (Terah's Caravan): your next card(s) this turn cost less
      ctx.state.players[ctx.controller].nextCardDiscount += (op.amount ?? 1) * (op.count ?? 1);
      break;
    case 'onHealBonus':
      // passive: read by the heal path in engine.ts, never executed directly
      break;
    case 'costReduce':
      // scaffolded: no-op placeholder wired for future engine support
      break;
  }
}

/**
 * Run a trigger's ops. Ops carrying an op-level `trigger`/`on` filter are
 * LISTENERS: they only run when the caller passes a matching `filter`
 * (e.g. 'friendlySheepDies', 'ally_death'); unfiltered calls skip them.
 * Ops with delayToNextTurn queue onto the source for its owner's next dawn.
 */
export function runTrigger(
  ctx: Ctx, effects: EffectOp[] | undefined, source?: UnitInstance,
  explicitTargetUid?: number, filter?: string,
): void {
  if (!effects) return;
  const memo: Memo = {};
  for (const op of effects) {
    const listenKey = op.trigger ?? op.on;
    if (filter ? listenKey !== filter : listenKey != null) continue;
    if (op.delayToNextTurn && source && filter) {
      const { delayToNextTurn: _d, on: _o, trigger: _t, ...rest } = op;
      source.pending = [...(source.pending ?? []), rest as EffectOp];
      continue;
    }
    applyEffect(ctx, op, source, explicitTargetUid, memo);
  }
}
