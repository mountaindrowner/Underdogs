/** Opponent AI (v2): evaluation-based 1-ply lookahead.
 *  Enumerate every legal action (plays incl. targeted spells, every attack
 *  matchup, end turn), simulate each with the pure engine, score the resulting
 *  state, and take the best — passing only when nothing beats ending the turn.
 *  `pickAction` returns ONE action; the controller loops it until END_TURN. */
import {
  applyAction, effAttack,
  type GameState, type Action, type PlayerId, type CardDef, type UnitInstance,
} from '../../engine/src/index.ts';

function needsTargetCard(c: CardDef): boolean {
  return !!c.effects?.arrival?.some((op) => op.target === 'target');
}

function unitValue(u: UnitInstance): number {
  let v = 1 + effAttack(u) + u.health;                 // a body worth ~1 + its stats
  if (u.keywords.includes('guard')) v += 1.5;
  if (u.keywords.includes('endure')) v += 1;
  if (u.keywords.includes('giant_slayer')) v += 1.5;
  if (!u.ready) v -= 0.3;                               // summoning-sick this turn
  return v;
}

/** Score a state from `me`'s perspective (higher = better for the AI). */
function evaluate(s: GameState, me: PlayerId): number {
  const foe = (me ^ 1) as PlayerId;
  if (s.winner === me) return 1e6;
  if (s.winner === foe) return -1e6;
  const mine = s.players[me];
  const theirs = s.players[foe];
  let v = 0;
  v += (mine.heroHp - theirs.heroHp) * 0.9;
  v += (theirs.heroMaxHp - theirs.heroHp) * 0.7;         // reward pressure on the enemy hero
  for (const u of mine.board) v += unitValue(u);
  for (const u of theirs.board) v -= unitValue(u) * 1.08; // value removing enemy units a touch more
  v += mine.hand.length * 0.25 - theirs.hand.length * 0.12; // card advantage
  return v;
}

function legalActions(s: GameState, me: PlayerId): Action[] {
  const pl = s.players[me];
  const foe = (me ^ 1) as PlayerId;
  const enemies = s.players[foe].board;
  const acts: Action[] = [];

  // plays (enumerate targets for targeted cards)
  pl.hand.forEach((c, i) => {
    if ((c.cost ?? 0) > pl.provision) return;
    if (c.type === 'minion' && pl.board.length >= s.rules.boardLimit) return;
    if (needsTargetCard(c)) {
      for (const t of [...pl.board, ...enemies]) acts.push({ type: 'PLAY_CARD', handIndex: i, targetUid: t.uid });
    } else {
      acts.push({ type: 'PLAY_CARD', handIndex: i });
    }
  });

  // hero power
  const hp = pl.heroPower;
  if (hp && !hp.usedThisTurn && pl.provision >= hp.cost) {
    if (hp.effects.some((op) => op.target === 'target')) {
      for (const t of [...pl.board, ...enemies]) acts.push({ type: 'HERO_POWER', targetUid: t.uid });
    } else {
      acts.push({ type: 'HERO_POWER' });
    }
  }

  // attacks (respect Guard)
  const guards = enemies.filter((u) => u.keywords.includes('guard'));
  for (const u of pl.board) {
    if (!u.ready || u.attacksThisTurn >= 1 || effAttack(u) <= 0) continue;
    if (guards.length) {
      for (const g of guards) acts.push({ type: 'ATTACK', attackerUid: u.uid, targetUid: g.uid });
    } else {
      for (const e of enemies) acts.push({ type: 'ATTACK', attackerUid: u.uid, targetUid: e.uid });
      acts.push({ type: 'ATTACK', attackerUid: u.uid, targetUid: 'hero' });
    }
  }
  return acts;
}

export function pickAction(state: GameState): Action {
  const me = state.active;
  const pass: Action = { type: 'END_TURN' };
  // baseline: the value of simply ending the turn now
  let best: Action = pass;
  let bestScore = evaluate(applyAction(state, pass).state, me);

  for (const a of legalActions(state, me)) {
    const sc = evaluate(applyAction(state, a).state, me);
    if (sc > bestScore + 1e-6) { bestScore = sc; best = a; }
  }
  return best;
}
