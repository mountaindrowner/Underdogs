/** Card-effects audit: walks EVERY definition (cards, tokens, adversaries,
 *  leaders) and flags anything the engine cannot actually execute — unknown
 *  triggers, unimplemented verbs, unresolvable targets, missing token /
 *  transform ids, unsupported fulfill conditions, and stray fields the
 *  interpreter ignores. Run: node tools/audit-cards.ts
 *  Exits 1 on NEW problems; the DEFERRED list is tracked design debt. */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { collectDefs, makeRegistry } from '../engine/src/index.ts';
import type { CardDef, EffectOp } from '../engine/src/index.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const load = (f: string) => JSON.parse(readFileSync(join(root, 'data', f), 'utf8'));

const defs: CardDef[] = collectDefs(
  load('cards.seed.json'), load('tokens.json'), load('adversaries.json'), load('leaders.json'));
const registry = makeRegistry(defs);

// ---- what the engine ACTUALLY supports (keep in sync with engine/src) ------
const TRIGGERS = new Set(['arrival', 'legacy', 'redeem', 'covenant', 'scatter', 'aura',
  'startOfTurn', 'endOfTurn', 'onDeath', 'raise', 'trigger', 'passive']);
const VERBS = new Set(['deal', 'heal', 'healUnit', 'healHero', 'buff', 'setAttack', 'giveKeyword',
  'silence', 'destroy', 'exile', 'summon', 'draw', 'drawType', 'transform', 'foresee', 'discover',
  'returnToHand', 'shuffleIntoDeck', 'delayedTransform', 'conditionalDeal', 'gainForEachSheep',
  'discoverFromDeck', 'onHealBonus', 'discountHand', 'returnFromDiscard', 'auraBuff']);
const NOOP_VERBS = new Set(['costReduce']); // declared placeholders
const TARGETS = new Set(['self', 'allAllies', 'allEnemies', 'allUnits', 'randomAlly', 'randomEnemy',
  'ownHero', 'enemyHero', 'strongestEnemy', 'weakestEnemy', 'target',
  'enemy', 'ally', 'anyUnit', 'anyCharacter', 'anyFriendlyOrHero',
  'damagedAlly', 'mostHealthEnemy', 'cheapestEnemy', 'allEnemiesWithoutGuard',
  'friendlySheep', 'friendlyDisciple', 'friendlyDisciples', 'friendlyHeirs',
  'lastFallenAlly', 'strongestFallenAlly', 'alliesDiedThisTurn', 'allHand']);
const AURA_VERBS = new Set(['buff', 'auraBuff', 'giveKeyword', 'discountHand']);
const CONDITIONS = new Set([undefined, 'fewer_units_than_enemy', 'target_is_priest',
  'ally_died_this_turn', 'ally_died_this_game', 'control_legendary', 'control_6_plus']);
const AURA_CONDITION_OK = (c?: string) => c == null || c.startsWith('control_');
const OP_FIELDS = new Set(['verb', 'amount', 'count', 'value', 'attack', 'health', 'target', 'keyword',
  'token', 'into', 'type', 'tag', 'scope', 'condition', 'grantToTarget', 'grantKeyword',
  'refreshEachTurn', 'perEnemyUnit', 'ifLastCard', 'thisTurn', 'toFull', 'toField', 'withKeyword',
  'oncePerTurn', 'oncePerGame', 'replaceDeath', 'onTurn', 'random', 'cardType', 'keep',
  'delayTurns', 'drawIfLegendary', 'trigger', 'on', 'delayToNextTurn']);
const OP_LISTENERS = new Set([undefined, 'friendlySheepDies', 'ally_death', 'self_damaged']);
const FULFILL = new Set(['control_allies', 'slay_giant', 'survive_damage',
  'survive_stronger', 'survive_damaged_turn', 'auto_next_turn']);
const KEYWORDS = new Set(['guard', 'swift', 'endure', 'giant_slayer', 'redeem', 'scatter',
  'foresee', 'covenant', 'raise', 'executes_damaged']);

/** Known, intentionally-deferred gaps (design debt — see docs/06). */
const DEFERRED = new Set([
  'pharaohs_magician',   // needs a Serpent token (art + def)
  'pharaoh_the_hardened',// attack-prevention mechanic not built
  'sanballat_and_tobiah',// relic-activation costs not built
  'leviathan',           // spell-damage immunity not built
]);

const problems: string[] = [];
const deferred: string[] = [];
const flag = (c: CardDef, msg: string) =>
  (DEFERRED.has(c.id) ? deferred : problems).push(`${c.id}: ${msg}`);

const tokenResolves = (id: string) => registry.has(id) || registry.has('tok_' + id);

for (const c of defs) {
  for (const k of c.keywords ?? []) {
    if (!KEYWORDS.has(k)) flag(c, `unknown keyword "${k}"`);
  }
  if (c.fulfill) {
    if (!FULFILL.has(c.fulfill.condition)) flag(c, `fulfill condition "${c.fulfill.condition}" not implemented`);
    if (!registry.has(c.fulfill.into)) flag(c, `fulfill.into "${c.fulfill.into}" not in registry`);
  }
  const effects = (c.effects ?? {}) as Record<string, EffectOp[]>;
  for (const [trig, ops] of Object.entries(effects)) {
    if (!TRIGGERS.has(trig)) flag(c, `trigger "${trig}" never fires`);
    if (!Array.isArray(ops)) { flag(c, `trigger "${trig}" is not an op list`); continue; }
    for (const op of ops as (EffectOp & Record<string, unknown>)[]) {
      for (const f of Object.keys(op)) if (!OP_FIELDS.has(f)) flag(c, `[${trig}] unknown op field "${f}"`);
      if (trig === 'aura') {
        if (!AURA_VERBS.has(op.verb as string)) flag(c, `[aura] verb "${op.verb}" not supported by recomputeAuras`);
        if (!AURA_CONDITION_OK(op.condition as string | undefined)) flag(c, `[aura] condition "${op.condition}" not implemented`);
        if (op.target && !TARGETS.has(op.target as string)) flag(c, `[aura] target "${op.target}" unresolvable`);
        continue;
      }
      if (!VERBS.has(op.verb as string)) {
        flag(c, NOOP_VERBS.has(op.verb as string)
          ? `[${trig}] verb "${op.verb}" is a declared no-op placeholder`
          : `[${trig}] verb "${op.verb}" not implemented`);
      }
      if (op.target && !TARGETS.has(op.target as string)) flag(c, `[${trig}] target "${op.target}" unresolvable`);
      if (op.condition && !CONDITIONS.has(op.condition as string)) flag(c, `[${trig}] condition "${op.condition}" not implemented`);
      const listen = (op.trigger ?? op.on) as string | undefined;
      if (!OP_LISTENERS.has(listen)) flag(c, `[${trig}] listener "${listen}" not implemented`);
      if (op.verb === 'summon' && op.token && !tokenResolves(op.token as string)) flag(c, `[${trig}] summon token "${op.token}" missing`);
      if (op.verb === 'transform' && op.into && !registry.has(op.into as string)) flag(c, `[${trig}] transform into "${op.into}" missing`);
      if (op.verb === 'delayedTransform' && op.into && !registry.has(op.into as string)) flag(c, `[${trig}] delayedTransform into "${op.into}" missing`);
      if (op.verb === 'returnToHand' && op.token && !tokenResolves(op.token as string)) flag(c, `[${trig}] returnToHand token "${op.token}" missing`);
      if (op.verb === 'giveKeyword' && !KEYWORDS.has(op.keyword as string)) flag(c, `[${trig}] giveKeyword "${op.keyword}" unknown`);
    }
  }
  // text mentions a trigger word the data doesn't carry (cheap heuristic)
  const text = (c.text ?? '').toLowerCase();
  if (/arrival:/.test(text) && !effects.arrival) flag(c, 'text says "Arrival:" but no arrival effects');
  if (/legacy:/.test(text) && !effects.legacy && !(c.keywords ?? []).includes('scatter')) flag(c, 'text says "Legacy:" but no legacy effects');
}

if (deferred.length) {
  console.log(`deferred (known design debt): ${deferred.length}`);
  for (const d of deferred) console.log('   ~', d);
}
if (problems.length) {
  console.log(`\nCARD AUDIT: ${problems.length} problem(s)\n`);
  for (const p of problems) console.log(' -', p);
  process.exit(1);
} else {
  console.log(`\nCARD AUDIT: all ${defs.length} definitions check out (${deferred.length} deferred)`);
}
