/** AI strength + balance-under-strong-play harness.
 *  Two experiments, same preset war-bands as tools/balance.ts:
 *    (A) Head-to-head: does the STRONG policy (2-ply rollout) actually beat the
 *        GREEDY one? Mirror decks, both seats, many seeds -> strong win-rate.
 *    (B) Class spread under greedy-both vs strong-both: if Warrior's dominance
 *        is a greedy-AI artifact, a stronger pilot should NARROW the spread.
 *  Deterministic. Run: node tools/ai-eval.ts [seeds] [which: all|ab|a|b]
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createGame, applyAction, registerDefs, makeRegistry, buildDeck, collectDefs,
  type CardDef, type GameState, type Action,
} from '../engine/src/index.ts';
import { pickAction, pickActionStrong } from '../ui/src/ai.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const load = (f: string) => JSON.parse(readFileSync(join(root, 'data', f), 'utf8'));
const defs: CardDef[] = collectDefs(
  load('cards.seed.json'), load('cards.set2.json'), load('cards.neutral-expansion.json'),
  load('tokens.json'), load('adversaries.json'), load('leaders.json'));
registerDefs(defs);
const registry = makeRegistry(defs);

const CLASSES = ['prophet', 'warrior', 'priest', 'shepherd', 'patriarch', 'disciple'] as const;
type Cls = typeof CLASSES[number];
const LEADER: Record<Cls, string> = {
  prophet: 'elijah_leader', warrior: 'joshua_leader', priest: 'aaron_leader',
  shepherd: 'david_leader', patriarch: 'abraham_leader', disciple: 'peter_leader',
};

// ---- preset decks (mirror of tools/balance.ts / ui/src/decks.ts) -----------
const pool = defs.filter((c) => c.collectible !== false && c.type !== 'leader' && !c.boss
  && ['common', 'rare', 'epic', 'legendary'].includes(c.rarity ?? ''));
const maxCopies = (c: CardDef) => (c.rarity === 'legendary' ? 1 : 2);
const byCostThenName = (a: CardDef, b: CardDef) =>
  (a.cost ?? 0) - (b.cost ?? 0) || a.name.localeCompare(b.name);
function presetIds(cls: string): string[] {
  const cards = (want: (c: CardDef) => boolean) => pool.filter(want).sort(byCostThenName);
  const classCards = cards((c) => c.class === cls);
  const neutrals = cards((c) => c.class === 'neutral');
  const curve = [0, 4, 6, 6, 5, 4, 3, 2];
  const bucket = (c: CardDef) => Math.min(Math.max(c.cost ?? 0, 1), 7);
  const out: string[] = [];
  const used = new Map<string, number>();
  const take = (c: CardDef, n: number) => {
    const have = used.get(c.id) ?? 0;
    const add = Math.min(n, maxCopies(c) - have, 30 - out.length);
    for (let i = 0; i < add; i++) out.push(c.id);
    if (add > 0) used.set(c.id, have + add);
    return add;
  };
  for (const source of [classCards, neutrals]) {
    for (const c of source) {
      const b = bucket(c);
      if (curve[b] <= 0 || out.length >= 30) continue;
      curve[b] -= take(c, Math.min(2, curve[b]));
    }
  }
  for (const c of [...classCards, ...neutrals]) { if (out.length >= 30) break; take(c, 2); }
  return out;
}
const deckOf = (cls: Cls) => buildDeck(registry, presetIds(cls));
const leaderOf = (cls: Cls) => registry.get(LEADER[cls]);

// ---- policies --------------------------------------------------------------
type Policy = (s: GameState) => Action;
const greedy: Policy = (s) => pickAction(s, 2);
const strong: Policy = (s) => pickActionStrong(s);

const SEEDS = Number(process.argv[2] ?? 3);
const WHICH = String(process.argv[3] ?? 'all');
const LIMIT = 2000;

/** one game; seat 0 uses polA, seat 1 uses polB. winner null = hang. */
function playGame(first: Cls, second: Cls, seed: number, polA: Policy, polB: Policy): 0 | 1 | null {
  let state: GameState;
  try {
    state = createGame({
      seed, decks: [deckOf(first), deckOf(second)], leaders: [leaderOf(first), leaderOf(second)],
      skipMulligan: true,
    }).state;
    let n = 0;
    while (state.phase !== 'over' && n++ < LIMIT) {
      state = applyAction(state, (state.active === 0 ? polA : polB)(state)).state;
    }
  } catch (e) {
    console.log(`  ! crash ${first} vs ${second} seed ${seed}: ${(e as Error).message?.split('\n')[0]}`);
    return null;
  }
  return state.winner ?? null;
}

const pct = (n: number, d: number) => (d ? ((100 * n) / d).toFixed(1) : ' - ').padStart(5);
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

// ---- (A) head-to-head: strong vs greedy ------------------------------------
function experimentA() {
  console.log(`\n(A) STRONG vs GREEDY — mirror war-bands, ${SEEDS} seeds each seat, both orders`);
  let sWins = 0, games = 0, hangs = 0;
  for (const cls of CLASSES) {
    for (let s = 0; s < SEEDS; s++) {
      const seed = 9000 + s * 31;
      // strong as seat 0
      let w = playGame(cls, cls, seed, strong, greedy);
      if (w == null) hangs++; else { games++; if (w === 0) sWins++; }
      // strong as seat 1 (swap seats to cancel first-player bias)
      w = playGame(cls, cls, seed, greedy, strong);
      if (w == null) hangs++; else { games++; if (w === 1) sWins++; }
    }
  }
  console.log(`   strong won ${pct(sWins, games)}% of ${games} games` +
    (hangs ? ` (${hangs} hangs)` : '') + `   [>50% = stronger; ~50% = no better]`);
}

// ---- (B) class spread: greedy-both vs strong-both --------------------------
function classMatrix(pol: Policy, label: string) {
  const wins = new Map<Cls, number>(CLASSES.map((c) => [c, 0]));
  const games = new Map<Cls, number>(CLASSES.map((c) => [c, 0]));
  let hangs = 0;
  const lens: number[] = [];
  for (const a of CLASSES) for (const b of CLASSES) for (let s = 0; s < SEEDS; s++) {
    const seed = 5000 + s * 13;
    let state: GameState;
    const w = ((): 0 | 1 | null => {
      try {
        state = createGame({ seed, decks: [deckOf(a), deckOf(b)], leaders: [leaderOf(a), leaderOf(b)], skipMulligan: true }).state;
        let n = 0;
        while (state.phase !== 'over' && n++ < LIMIT) state = applyAction(state, (state.active === 0 ? pol : pol)(state)).state;
        lens.push(state.turn);
        return state.winner ?? null;
      } catch { return null; }
    })();
    if (w == null) { hangs++; continue; }
    games.set(a, games.get(a)! + 1); games.set(b, games.get(b)! + 1);
    if (w === 0) wins.set(a, wins.get(a)! + 1); else wins.set(b, wins.get(b)! + 1);
  }
  const rows = CLASSES.map((c) => ({ c, wr: (100 * wins.get(c)!) / (games.get(c)! || 1) })).sort((x, y) => y.wr - x.wr);
  const spread = rows[0].wr - rows[rows.length - 1].wr;
  lens.sort((x, y) => x - y);
  const med = lens[Math.floor(lens.length / 2)] ?? 0;
  console.log(`\n(B) class win-rate — ${label} (${SEEDS} seeds/pair${hangs ? `, ${hangs} hangs` : ''}, median ${med} turns):`);
  for (const { c, wr } of rows) {
    const flag = wr > 55 ? ' ⬆' : wr < 45 ? ' ⬇' : '';
    console.log(`     ${cap(c).padEnd(10)} ${wr.toFixed(1).padStart(5)}%${flag}`);
  }
  console.log(`     spread ${spread.toFixed(1)} pts  (narrower = classes closer to fair)`);
  return spread;
}

if (WHICH === 'all' || WHICH === 'ab' || WHICH === 'a') experimentA();
if (WHICH === 'all' || WHICH === 'ab' || WHICH === 'b') {
  const g = classMatrix(greedy, 'GREEDY on both seats');
  const st = classMatrix(strong, 'STRONG on both seats');
  console.log(`\n=> spread greedy ${g.toFixed(1)} -> strong ${st.toFixed(1)}  (${(g - st).toFixed(1)} pts ${g > st ? 'narrower' : 'wider'} under strong play)`);
}
console.log('');
