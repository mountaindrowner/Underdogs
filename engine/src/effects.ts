/**
 * Effect-verb interpreter + targeting. Card `effects` are DATA: a map of
 * trigger -> EffectOp[]. This module executes those ops against an engine
 * context (Ctx) whose low-level mutators are implemented in engine.ts. Adding
 * a card should never need new engine code unless it needs a genuinely new verb.
 */
import type {
  GameState, UnitInstance, PlayerId, CardDef, EffectOp, TargetSpec, Keyword,
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
  dealToUnit(u: UnitInstance, amount: number, srcUid?: number): void;
  dealToHero(p: PlayerId, amount: number, srcUid?: number): void;
  healUnit(u: UnitInstance, amount: number): void;
  healHero(p: PlayerId, amount: number): void;
  buff(u: UnitInstance, atk: number, hp: number): void;
  giveKeyword(u: UnitInstance, k: Keyword): void;
  silence(u: UnitInstance): void;
  setAttack(u: UnitInstance, atk: number): void;
  summon(owner: PlayerId, defId: string, position?: number): UnitInstance | null;
  draw(p: PlayerId, n: number): void;
  drawType(p: PlayerId, type: string, tag: string | undefined, n: number): void;
  destroy(u: UnitInstance): void;
  transform(u: UnitInstance, intoDefId: string): void;
  exileUnit(u: UnitInstance): void;
  foresee(p: PlayerId, count: number): void;
  discover(p: PlayerId, count: number): void;
}

function effAttack(u: UnitInstance): number {
  return u.attack + ((u as { auraAtk?: number }).auraAtk ?? 0);
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

  switch (spec) {
    case 'self':
      return source ? [{ kind: 'unit', unit: source }] : [];
    case 'allAllies':
      return allies.map((unit) => ({ kind: 'unit', unit }));
    case 'allEnemies':
      return enemies.map((unit) => ({ kind: 'unit', unit }));
    case 'allUnits':
      return [...allies, ...enemies].map((unit) => ({ kind: 'unit', unit }));
    case 'randomAlly':
      return pick(allies);
    case 'randomEnemy':
      return pick(enemies);
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
    case 'target':
    default: {
      if (explicitTargetUid != null) {
        const all = [...allies, ...enemies];
        const u = all.find((x) => x.uid === explicitTargetUid);
        if (u) return [{ kind: 'unit', unit: u }];
      }
      return [];
    }
  }
}

/** Execute one effect op. `source` is the unit whose effect this is (if any). */
export function applyEffect(
  ctx: Ctx, op: EffectOp, source?: UnitInstance, explicitTargetUid?: number,
): void {
  const targets = resolveTargets(ctx, op.target, source, explicitTargetUid);
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
    case 'healUnit':
    case 'heal':
      eachUnit((u) => ctx.healUnit(u, op.amount ?? 0));
      for (const t of targets) if (t.kind === 'hero') ctx.healHero(t.player, op.amount ?? 0);
      break;
    case 'healHero':
      // default to own hero if no explicit target
      if (targets.length) {
        for (const t of targets) if (t.kind === 'hero') ctx.healHero(t.player, op.amount ?? 0);
      } else {
        ctx.healHero(ctx.controller, op.amount ?? 0);
      }
      break;
    case 'buff':
      eachUnit((u) => ctx.buff(u, op.attack ?? 0, op.health ?? 0));
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
      eachUnit((u) => ctx.exileUnit(u));
      break;
    case 'summon': {
      const n = op.count ?? 1;
      if (op.token) for (let i = 0; i < n; i++) ctx.summon(ctx.controller, op.token);
      break;
    }
    case 'draw':
      ctx.draw(ctx.controller, op.count ?? op.amount ?? 1);
      break;
    case 'drawType':
      ctx.drawType(ctx.controller, op.type ?? 'minion', op.tag, op.count ?? 1);
      break;
    case 'transform':
      if (op.into && source) ctx.transform(source, op.into);
      break;
    case 'foresee':
      ctx.foresee(ctx.controller, op.value ?? op.count ?? 2);
      break;
    case 'discover':
      ctx.discover(ctx.controller, op.count ?? 3);
      break;
    case 'costReduce':
    case 'returnFromDiscard':
      // scaffolded: no-op placeholders wired for future engine support
      break;
  }
}

export function runTrigger(
  ctx: Ctx, effects: EffectOp[] | undefined, source?: UnitInstance, explicitTargetUid?: number,
): void {
  if (!effects) return;
  for (const op of effects) applyEffect(ctx, op, source, explicitTargetUid);
}
