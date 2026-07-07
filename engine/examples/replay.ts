/**
 * Demo: play a short, deterministic game with a trivial greedy auto-player and
 * print the GameEvent stream. This doubles as a reference for how the UI /
 * animation layer consumes the engine: read state, animate each event in order.
 *
 *   node engine/examples/replay.ts
 */
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  createGame, applyAction, registerDefs, effAttack,
  makeRegistry, buildDeck,
  type GameState, type Action, type GameEvent, type PlayerId, type CardDef,
} from '../src/index.ts';
import { loadCardData } from '../src/cards.node.ts';

const here = dirname(fileURLToPath(import.meta.url));
const dataDir = join(here, '..', '..', 'data');
const defs = loadCardData([
  join(dataDir, 'cards.seed.json'), join(dataDir, 'tokens.json'),
  join(dataDir, 'adversaries.json'), join(dataDir, 'leaders.json'),
]);
registerDefs(defs);
const reg = makeRegistry(defs);

// simple 30-card decks of on-curve, target-free bodies (demo only)
const picks = ['watchman', 'shepherd_boy', 'firstborn_heir', 'eager_convert', 'benaiah', 'ruth'];
const mkDeck = (): CardDef[] => Array.from({ length: 30 }, (_, i) => structuredClone(reg.get(picks[i % picks.length])!));

let { state, events } = createGame({ seed: 1234, decks: [mkDeck(), mkDeck()], skipMulligan: true });
const feed: GameEvent[] = [...events];

/** Greedy player: play the cheapest affordable minion, then swing all ready units at face. */
function greedyTurn(): void {
  const me = state.active;
  for (let guard = 0; guard < 30 && state.phase === 'main'; guard++) {
    const pl = state.players[me];
    let acted = false;
    const idx = pl.hand
      .map((c, i) => [c, i] as const)
      .filter(([c]) => c.type === 'minion' && (c.cost ?? 0) <= pl.provision && !hasTargetedArrival(c))
      .sort((a, b) => (a[0].cost ?? 0) - (b[0].cost ?? 0))[0]?.[1];
    if (idx != null) { step({ type: 'PLAY_CARD', handIndex: idx }); acted = true; }
    else {
      const attacker = state.players[me].board.find((u) => u.ready && effAttack(u) > 0 && u.attacksThisTurn < 1);
      const foe = (me ^ 1) as PlayerId;
      const guardUnit = state.players[foe].board.find((u) => u.keywords.includes('guard'));
      if (attacker) {
        step({ type: 'ATTACK', attackerUid: attacker.uid, targetUid: guardUnit ? guardUnit.uid : 'hero' });
        acted = true;
      }
    }
    if (!acted) break;
  }
  if (state.phase === 'main') step({ type: 'END_TURN' });
}

function hasTargetedArrival(c: CardDef): boolean {
  return !!c.effects?.arrival?.some((op) => op.target === 'target' || op.target == null && op.verb === 'deal');
}
function step(a: Action): void { const r = applyAction(state, a); state = r.state; feed.push(...r.events); }

for (let t = 0; t < 8 && state.phase !== 'over'; t++) greedyTurn();

// ---- report ----------------------------------------------------------------
const counts = new Map<string, number>();
for (const e of feed) counts.set(e.t, (counts.get(e.t) ?? 0) + 1);
console.log(`\nUNDERDOGS engine demo — seed 1234, ${feed.length} events over turn ${state.turn}\n`);
console.log('event stream (first 40):');
for (const e of feed.slice(0, 40)) console.log('  ', JSON.stringify(e));
console.log('\nevent histogram:');
for (const [k, v] of [...counts].sort((a, b) => b[1] - a[1])) console.log(`  ${k.padEnd(16)} ${v}`);
console.log(`\nfinal: P0 hero ${state.players[0].heroHp} | P1 hero ${state.players[1].heroHp} | phase ${state.phase}` +
  (state.winner != null ? ` | winner P${state.winner}` : ''));
