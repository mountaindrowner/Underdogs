/** Class / matchup balance harness. Plays the real six preset war-bands
 *  (leaders + hero powers included) against each other, AI-vs-AI, across many
 *  seeds, and reports:
 *    - a 6x6 win-rate matrix (row = first player)
 *    - each class's overall win-rate (averaged across both seats)
 *    - first-player advantage (P0 win-rate in mirror matchups)
 *    - game-length distribution (turns to a winner)
 *  Deterministic: same seed => same game. Nothing here mutates card data.
 *  Run: node tools/balance.ts [seeds-per-ordered-pair] [ai-level 0|1|2]
 *
 *  NOTE: decks here mirror ui/src/decks.ts buildPreset exactly (class cards
 *  first along a target curve, holes patched with neutrals). If that builder
 *  changes, mirror the change here — this file can't import the Vite-only
 *  data.ts. Verified equal to the shipped presets by card list on write. */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createGame, applyAction, registerDefs, makeRegistry, buildDeck, collectDefs,
  type CardDef, type GameState,
} from '../engine/src/index.ts';
import { pickAction, type AiLevel } from '../ui/src/ai.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const load = (f: string) => JSON.parse(readFileSync(join(root, 'data', f), 'utf8'));
const defs: CardDef[] = collectDefs(
  load('cards.seed.json'), load('tokens.json'), load('adversaries.json'), load('leaders.json'));
registerDefs(defs);
const registry = makeRegistry(defs);

const CLASSES = ['prophet', 'warrior', 'priest', 'shepherd', 'patriarch', 'disciple'] as const;
type Cls = typeof CLASSES[number];
const LEADER: Record<Cls, string> = {
  prophet: 'elijah_leader', warrior: 'joshua_leader', priest: 'aaron_leader',
  shepherd: 'david_leader', patriarch: 'abraham_leader', disciple: 'peter_leader',
};

// ---- preset decks (mirror of ui/src/decks.ts buildPreset) ------------------
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

// ---- run ------------------------------------------------------------------
const SEEDS = Number(process.argv[2] ?? 60);
const LEVEL = (Number(process.argv[3] ?? 2) as AiLevel);
const LIMIT = 2000;

/** one game: returns { winner, turns } */
function playGame(first: Cls, second: Cls, seed: number): { winner: 0 | 1 | null; turns: number } {
  let { state } = createGame({
    seed,
    decks: [deckOf(first), deckOf(second)],
    leaders: [leaderOf(first), leaderOf(second)],
    skipMulligan: true,
  });
  let n = 0;
  while (state.phase !== 'over' && n++ < LIMIT) {
    const next: GameState = applyAction(state, pickAction(state, LEVEL)).state;
    state = next;
  }
  return { winner: state.winner ?? null, turns: state.turn };
}

// matrix[a][b] = a's win% when a goes FIRST vs b
const wins: Record<string, Record<string, number>> = {};
const games: Record<string, Record<string, number>> = {};
const classWins = new Map<Cls, number>(CLASSES.map((c) => [c, 0]));
const classGames = new Map<Cls, number>(CLASSES.map((c) => [c, 0]));
let p0wins = 0, decisive = 0, hangs = 0;
const lengths: number[] = [];

for (const a of CLASSES) {
  wins[a] = {}; games[a] = {};
  for (const b of CLASSES) { wins[a][b] = 0; games[a][b] = 0; }
}

let done = 0;
const totalPairs = CLASSES.length * CLASSES.length;
for (const a of CLASSES) {
  for (const b of CLASSES) {
    for (let s = 0; s < SEEDS; s++) {
      const seed = 5000 + (done * SEEDS + s) * 13;
      const { winner, turns } = playGame(a, b, seed);
      if (winner == null) { hangs++; continue; }
      lengths.push(turns);
      games[a][b]++;
      classGames.set(a, classGames.get(a)! + 1);
      classGames.set(b, classGames.get(b)! + 1);
      if (winner === 0) { wins[a][b]++; classWins.set(a, classWins.get(a)! + 1); p0wins++; }
      else { classWins.set(b, classWins.get(b)! + 1); }
      decisive++;
    }
    done++;
  }
}

// ---- report ---------------------------------------------------------------
const pct = (n: number, d: number) => (d ? ((100 * n) / d).toFixed(1) : '  -  ').padStart(5);
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

console.log(`\nBALANCE — ${SEEDS} seeds/ordered-pair, AI level ${LEVEL}, ${decisive} decisive games` +
  (hangs ? ` (${hangs} hangs!)` : ''));
console.log('Win-rate matrix — row plays FIRST (P0) vs column, cell = row win%\n');
console.log('   first\\vs   ' + CLASSES.map((c) => cap(c).slice(0, 5).padStart(6)).join(' '));
for (const a of CLASSES) {
  const row = CLASSES.map((b) => pct(wins[a][b], games[a][b])).join('  ');
  console.log(cap(a).padEnd(12) + row);
}

console.log('\nOverall win-rate (both seats):');
const overall = CLASSES.map((c) => ({ c, wr: (100 * classWins.get(c)!) / (classGames.get(c)! || 1) }))
  .sort((x, y) => y.wr - x.wr);
for (const { c, wr } of overall) {
  const flag = wr > 55 ? '  ⬆ strong' : wr < 45 ? '  ⬇ weak' : '';
  console.log(`  ${cap(c).padEnd(11)} ${wr.toFixed(1).padStart(5)}%${flag}`);
}

console.log(`\nFirst-player advantage: P0 won ${pct(p0wins, decisive)}% of all games.`);
// mirror-only (isolates seat effect from class strength)
let mirW = 0, mirG = 0;
for (const a of CLASSES) { mirW += wins[a][a]; mirG += games[a][a]; }
console.log(`  In mirror matchups only: P0 won ${pct(mirW, mirG)}% (50% = no seat bias).`);

lengths.sort((x, y) => x - y);
const q = (p: number) => lengths[Math.min(lengths.length - 1, Math.floor(p * lengths.length))];
const mean = lengths.reduce((s, n) => s + n, 0) / (lengths.length || 1);
console.log(`\nGame length (turns to a winner): min ${lengths[0]}  p25 ${q(0.25)}  median ${q(0.5)}` +
  `  p75 ${q(0.75)}  max ${lengths[lengths.length - 1]}  mean ${mean.toFixed(1)}`);
console.log('');
