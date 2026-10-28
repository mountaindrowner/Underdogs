/** AI-vs-AI soak over every MODE the player can reach, with the real AI on
 *  both sides and the human seat (P0) interactive like the UI — so Foresee /
 *  Discover pauses are resolved, not skipped:
 *    · every Story chapter (its real decks, leaders, pre-placed boss, hero HP)
 *      at Novice and Valiant, plus the Skirmish sandbox
 *    · every Free Play war-band vs every war-band, rival at all four levels
 *    · random legal decks per class, so every collectible card gets dealt
 *  Fails on any crash, hang, stall (an action that changes nothing), or broken
 *  invariant (board > 7, hand > 10, a dead unit left standing, NaN, a human
 *  choice opened outside the human's own turn).
 *  Run: node tools/soak.ts [games-per-config] */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createGame, applyAction, registerDefs, makeRegistry, buildDeck, collectDefs, effHealth,
  type CardDef, type GameState, type Action,
} from '../engine/src/index.ts';
import { pickAction, pickActionStrong } from '../ui/src/ai.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const load = (f: string) => JSON.parse(readFileSync(join(root, 'data', f), 'utf8'));
const defs: CardDef[] = collectDefs(
  load('cards.seed.json'), load('cards.set2.json'), load('cards.neutral-expansion.json'), load('tokens.json'), load('adversaries.json'), load('leaders.json'));
registerDefs(defs);
const reg = makeRegistry(defs);
const GAMES = Number(process.argv[2] ?? 1);

// ---- mirrors of ui/src/campaign.ts (padDeck) and ui/src/decks.ts (presets);
//      those modules import Vite-only assets, so the logic is restated here
const padDeck = (ids: string[], n = 30) => {
  const v = ids.filter((id) => reg.has(id)); const out: string[] = [];
  for (let i = 0; i < n; i++) out.push(v[i % v.length]);
  return out;
};
const pool = defs.filter((c) => c.collectible !== false && c.type !== 'leader' && !c.boss
  && ['common', 'rare', 'epic', 'legendary'].includes(c.rarity ?? ''));
const maxCopies = (c: CardDef) => (c.rarity === 'legendary' ? 1 : 2);
function buildPreset(cls: string): string[] {
  const byCN = (a: CardDef, b: CardDef) => (a.cost ?? 0) - (b.cost ?? 0) || a.name.localeCompare(b.name);
  const classCards = pool.filter((c) => c.class === cls).sort(byCN);
  const neutrals = pool.filter((c) => c.class === 'neutral').sort(byCN);
  const curve = [0, 4, 6, 6, 5, 4, 3, 2];
  const bucket = (c: CardDef) => Math.min(Math.max(c.cost ?? 0, 1), 7);
  const out: string[] = []; const used = new Map<string, number>();
  const take = (c: CardDef, n: number) => {
    const have = used.get(c.id) ?? 0; const add = Math.min(n, maxCopies(c) - have, 30 - out.length);
    for (let i = 0; i < add; i++) out.push(c.id);
    if (add > 0) used.set(c.id, have + add);
    return add;
  };
  for (const src of [classCards, neutrals]) for (const c of src) {
    const b = bucket(c); if (curve[b] <= 0 || out.length >= 30) continue;
    curve[b] -= take(c, Math.min(2, curve[b]));
  }
  for (const c of [...classCards, ...neutrals]) { if (out.length >= 30) break; take(c, 2); }
  return out;
}
const LEADER: Record<string, string> = { prophet: 'elijah_leader', warrior: 'joshua_leader', priest: 'aaron_leader',
  shepherd: 'david_leader', patriarch: 'abraham_leader', disciple: 'peter_leader' };
const ALT_LEADER: Record<string, string> = { prophet: 'isaiah_leader', warrior: 'deborah_leader', priest: 'melchizedek_leader',
  shepherd: 'moses_leader', patriarch: 'sarah_leader', disciple: 'paul_leader' };
const CLASSES = Object.keys(LEADER);

let lcg = 12345;                                   // deterministic deck shuffles
const rnd = (n: number) => { lcg = (lcg * 1103515245 + 12345) >>> 0; return lcg % n; };
/** a random legal 30: class cards first (so each one shows up), then neutrals */
function randomDeck(cls: string): string[] {
  const cands = pool.filter((c) => c.class === cls || c.class === 'neutral')
    .map((c) => ({ c, k: (c.class === cls ? 0 : 1000) + rnd(1000) })).sort((a, b) => a.k - b.k).map((x) => x.c);
  const out: string[] = []; const used = new Map<string, number>();
  for (let pass = 0; out.length < 30 && pass < 3; pass++) for (const c of cands) {
    if (out.length >= 30) break;
    const have = used.get(c.id) ?? 0;
    if (have < maxCopies(c) && (pass > 0 || have === 0)) { out.push(c.id); used.set(c.id, have + 1); }
  }
  return out;
}

interface Cfg { name: string; deck0: string[]; deck1: string[]; lead0?: string; lead1?: string;
  start?: [string[], string[]]; hp?: [number, number]; ai1: 0 | 1 | 2 | 3 }
const cfgs: Cfg[] = [];
for (const e of load('campaign.json').encounters.filter((x: { id?: string }) => x?.id && !x.id.startsWith('_'))) {
  for (const ai1 of [e.aiLevel ?? 3, 0] as const) cfgs.push({ name: `story:${e.id}@${ai1}`, deck0: padDeck(e.playerDeck), deck1: padDeck(e.enemyDeck),
    lead0: e.playerLeader ?? undefined, lead1: e.enemyLeader ?? undefined, start: [[], e.enemyBoard ?? []],
    hp: [e.playerHp ?? 30, e.enemyHp ?? 30], ai1 });
}
const SANDBOX = ['shepherd_boy', 'watchman', 'firstborn_heir', 'eager_convert', 'benaiah', 'ruth', 'stephen',
  'isaiah', 'shepherd_david', 'faithful_sheepdog', 'gather_the_flock', 'sarah', 'fire_from_heaven'];
cfgs.push({ name: 'skirmish', deck0: padDeck(SANDBOX), deck1: padDeck(SANDBOX), lead0: 'david_leader', lead1: 'elijah_leader', ai1: 2 });
CLASSES.forEach((a, i) => CLASSES.forEach((b, j) => cfgs.push({ name: `free:${a}v${b}`, deck0: buildPreset(a), deck1: buildPreset(b),
  lead0: (i + j) % 2 ? ALT_LEADER[a] : LEADER[a], lead1: LEADER[b], ai1: ((i + j) % 4) as 0 | 1 | 2 | 3 })));
const dealt = new Set<string>();
CLASSES.forEach((a, i) => { for (let k = 0; k < 6; k++) {
  const b = CLASSES[(i + k) % 6]; const d0 = randomDeck(a), d1 = randomDeck(b);
  [...d0, ...d1].forEach((x) => dealt.add(x));
  cfgs.push({ name: `pool:${a}v${b}#${k}`, deck0: d0, deck1: d1, lead0: k % 2 ? ALT_LEADER[a] : LEADER[a], lead1: LEADER[b], ai1: 2 });
} });
const undealt = pool.filter((c) => !dealt.has(c.id)).map((c) => c.id);

const problems: string[] = [];
const fail = (m: string) => { if (problems.length < 20) problems.push(m); };
function invariants(s: GameState, where: string) {
  for (const pl of s.players) {
    if (pl.board.length > s.rules.boardLimit) fail(`${where}: board over limit`);
    if (pl.hand.length > s.rules.handLimit) fail(`${where}: hand over limit`);
    if (!(pl.provision >= 0 && pl.provision <= s.rules.provisionCap)) fail(`${where}: provision ${pl.provision}`);
    if (Number.isNaN(pl.heroHp)) fail(`${where}: NaN hero hp`);
    for (const u of pl.board) {
      if (!s.pending && effHealth(u) <= 0) fail(`${where}: dead ${u.defId} left on board`);
      if (Number.isNaN(u.attack) || Number.isNaN(u.health)) fail(`${where}: NaN stats on ${u.defId}`);
    }
  }
  if (s.pending && (s.pending.player !== 0 || s.active !== 0)) fail(`${where}: human choice opened outside the human's turn`);
}

let games = 0, actions = 0, choices = 0;
for (const c of cfgs) for (let g = 0; g < GAMES; g++) {
  const seed = 1000 + games * 7 + g;
  const where = `${c.name} seed ${seed}`;
  let s = createGame({ seed, decks: [buildDeck(reg, c.deck0), buildDeck(reg, c.deck1)],
    leaders: [c.lead0 ? reg.get(c.lead0) : undefined, c.lead1 ? reg.get(c.lead1) : undefined],
    startUnits: c.start, heroHp: c.hp, interactivePlayer: 0 }).state;
  let n = 0, idle = 0;
  while (s.phase !== 'over' && n++ < 3000) {
    let a: Action;
    if (s.pending) {               // the human: bottom one Foresee card / take the last Discover cards
      choices++;
      const p = s.pending;
      a = p.kind === 'foresee' ? { type: 'RESOLVE_CHOICE', bottom: [0] }
        : { type: 'RESOLVE_CHOICE', picked: Array.from({ length: p.pick }, (_, i) => p.cardIds.length - 1 - i) };
    } else if (s.phase === 'mulligan') a = { type: 'MULLIGAN', keep: s.players[s.active].hand.map((_, i) => i).filter((i) => i % 2 === 0) };
    else if (s.active === 0) a = pickAction(s, 2);
    else a = c.ai1 === 3 ? pickActionStrong(s) : pickAction(s, c.ai1);
    let r;
    try { r = applyAction(s, a); } catch (e) { fail(`${where}: CRASH on ${JSON.stringify(a)} — ${(e as Error).message}`); break; }
    if (!r.events.length && r.state.turn === s.turn && JSON.stringify(r.state) === JSON.stringify(s)) {
      if (++idle > 3) { fail(`${where}: STALL — ${JSON.stringify(a)} changes nothing`); break; }
    } else idle = 0;
    s = r.state; actions++;
    invariants(s, `${where} t${s.turn}`);
  }
  if (s.phase !== 'over') fail(`${where}: HANG — no winner`);
  games++;
}

if (undealt.length) fail(`collectibles never dealt into a soak deck: ${undealt.join(', ')}`);
if (problems.length) {
  console.error(`SOAK FAILED (${problems.length}):`);
  for (const p of problems) console.error('  -', p);
  process.exit(1);
}
console.log(`SOAK OK: ${games} games over ${cfgs.length} configs (story, skirmish, free play, full pool), ` +
  `${actions} actions, ${choices} human choices resolved — no crashes, stalls or broken invariants`);
