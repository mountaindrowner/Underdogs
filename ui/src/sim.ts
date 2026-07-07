/** Autoplay a full game with a simple greedy AI on both sides and return the
 *  ordered GameEvent feed. The UI animates that feed; nothing here touches DOM. */
import {
  createGame, applyAction, effAttack, buildDeck,
  type GameEvent, type GameState, type PlayerId, type CardDef,
} from '../../engine/src/index.ts';
import { registry } from './data.ts';

// varied, mostly target-free bodies so the AI can play without a targeting UI
const DECK_IDS = [
  'shepherd_boy', 'watchman', 'firstborn_heir', 'eager_convert', 'benaiah', 'ruth',
  'stephen', 'isaiah', 'shepherd_david', 'faithful_sheepdog', 'gather_the_flock', 'sarah',
];

function deck(): CardDef[] {
  const ids: string[] = [];
  for (let i = 0; i < 30; i++) ids.push(DECK_IDS[i % DECK_IDS.length]);
  return buildDeck(registry, ids.filter((id) => registry.has(id)));
}

function targetFree(c: CardDef): boolean {
  const arr = c.effects?.arrival ?? [];
  return !arr.some((op) => op.target === 'target' || (op.target == null && op.verb === 'deal'));
}

export function simulate(seed: number): { events: GameEvent[]; heroHp: number } {
  let { state, events } = createGame({ seed, decks: [deck(), deck()], skipMulligan: true });
  const feed: GameEvent[] = [...events];
  const step = (s: GameState, a: Parameters<typeof applyAction>[1]) => {
    const r = applyAction(s, a); feed.push(...r.events); return r.state;
  };

  for (let safety = 0; safety < 400 && state.phase !== 'over'; safety++) {
    const me = state.active;
    const pl = state.players[me];
    // 1) play cheapest affordable, target-free minion
    const playable = pl.hand
      .map((c, i) => [c, i] as const)
      .filter(([c]) => c.type === 'minion' && (c.cost ?? 0) <= pl.provision && targetFree(c)
        && pl.board.length < state.rules.boardLimit)
      .sort((a, b) => (b[0].cost ?? 0) - (a[0].cost ?? 0)); // biggest we can afford
    if (playable.length) { state = step(state, { type: 'PLAY_CARD', handIndex: playable[0][1] }); continue; }
    // 2) attack: ready units hit the weakest enemy minion, else face
    const attacker = pl.board.find((u) => u.ready && effAttack(u) > 0 && u.attacksThisTurn < 1);
    if (attacker) {
      const foe = (me ^ 1) as PlayerId;
      const enemies = state.players[foe].board;
      const guard = enemies.find((u) => u.keywords.includes('guard'));
      let target: number | 'hero' = 'hero';
      if (guard) target = guard.uid;
      else if (enemies.length) {
        // prefer a favorable/even trade, else face
        const t = [...enemies].sort((a, b) => a.health - b.health)[0];
        target = effAttack(attacker) >= t.health ? t.uid : 'hero';
      }
      state = step(state, { type: 'ATTACK', attackerUid: attacker.uid, targetUid: target });
      continue;
    }
    // 3) nothing to do
    state = step(state, { type: 'END_TURN' });
  }
  return { events: feed, heroHp: state.rules?.heroHp ?? 30 };
}
