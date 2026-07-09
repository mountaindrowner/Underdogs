/** AI-vs-AI soak: every class-vs-class matchup, full games with the real
 *  1-ply AI on both sides. Any crash, hang, or non-terminating game fails.
 *  Run: node tools/soak.ts [games-per-matchup] */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createGame, applyAction, registerDefs, makeRegistry, buildDeck, collectDefs,
  type CardDef, type GameState,
} from '../engine/src/index.ts';
import { pickAction } from '../ui/src/ai.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const load = (f: string) => JSON.parse(readFileSync(join(root, 'data', f), 'utf8'));
const defs: CardDef[] = collectDefs(
  load('cards.seed.json'), load('tokens.json'), load('adversaries.json'), load('leaders.json'));
registerDefs(defs);
const registry = makeRegistry(defs);

const CLASSES = ['prophet', 'warrior', 'priest', 'shepherd', 'patriarch', 'disciple'];
const pool = defs.filter((c) => c.collectible !== false && c.type !== 'leader' && !c.boss
  && ['common', 'rare', 'epic', 'legendary'].includes(c.rarity ?? ''));

function classDeck(cls: string): CardDef[] {
  const ids: string[] = [];
  const cards = pool.filter((c) => c.class === cls || c.class === 'neutral')
    .sort((a, b) => (a.cost ?? 0) - (b.cost ?? 0) || a.name.localeCompare(b.name));
  for (const c of cards) {
    const copies = c.rarity === 'legendary' ? 1 : 2;
    for (let i = 0; i < copies && ids.length < 30; i++) ids.push(c.id);
    if (ids.length >= 30) break;
  }
  return buildDeck(registry, ids);
}

const perMatchup = Number(process.argv[2] ?? 1);
let games = 0, actions = 0;
const results: string[] = [];

for (const a of CLASSES) {
  for (const b of CLASSES) {
    for (let g = 0; g < perMatchup; g++) {
      const seed = 1000 + games * 7 + g;
      let { state } = createGame({ seed, decks: [classDeck(a), classDeck(b)], skipMulligan: true });
      let n = 0;
      const LIMIT = 2000;
      while (state.phase !== 'over' && n++ < LIMIT) {
        const action = pickAction(state, 2);
        const next: GameState = applyAction(state, action).state;
        state = next;
        actions++;
      }
      if (state.phase !== 'over') {
        console.error(`HANG: ${a} vs ${b} seed ${seed} — no winner after ${LIMIT} actions`);
        process.exit(1);
      }
      results.push(`${a[0]}${b[0]}:${state.winner}`);
      games++;
    }
  }
}
console.log(`SOAK OK: ${games} games, ${actions} actions, no crashes, all terminated`);
