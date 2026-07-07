/** Opponent AI. v1 = curve-out + favorable-trade heuristic (greedy). Step 2 will
 *  add trade evaluation + 1-ply lookahead; the interface stays `pickAction`. */
import { effAttack, type GameState, type Action, type PlayerId, type CardDef } from '../../engine/src/index.ts';

function targetFree(c: CardDef): boolean {
  const arr = c.effects?.arrival ?? [];
  return !arr.some((op) => op.target === 'target');
}

/** Return the AI's next action for the active player, or END_TURN when done. */
export function pickAction(state: GameState): Action {
  const me = state.active;
  const pl = state.players[me];
  const foe = (me ^ 1) as PlayerId;

  // 1) develop: play the biggest affordable, target-free minion
  const playable = pl.hand
    .map((c, i) => [c, i] as const)
    .filter(([c]) => c.type === 'minion' && (c.cost ?? 0) <= pl.provision
      && targetFree(c) && pl.board.length < state.rules.boardLimit)
    .sort((a, b) => (b[0].cost ?? 0) - (a[0].cost ?? 0));
  if (playable.length) return { type: 'PLAY_CARD', handIndex: playable[0][1] };

  // 2) attack: take a favorable/even trade if one exists, else go face
  const attacker = pl.board.find((u) => u.ready && effAttack(u) > 0 && u.attacksThisTurn < 1);
  if (attacker) {
    const enemies = state.players[foe].board;
    const guard = enemies.find((u) => u.keywords.includes('guard'));
    if (guard) return { type: 'ATTACK', attackerUid: attacker.uid, targetUid: guard.uid };
    // best trade: kill something without dying, prefer highest-attack kill
    const kills = enemies
      .filter((e) => effAttack(attacker) >= e.health && effAttack(e) < attacker.health)
      .sort((a, b) => effAttack(b) - effAttack(a));
    if (kills.length) return { type: 'ATTACK', attackerUid: attacker.uid, targetUid: kills[0].uid };
    return { type: 'ATTACK', attackerUid: attacker.uid, targetUid: 'hero' };
  }
  return { type: 'END_TURN' };
}
