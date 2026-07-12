/** Opponent AI (v2): evaluation-based 1-ply lookahead.
 *  Enumerate every legal action (plays incl. targeted spells, every attack
 *  matchup, end turn), simulate each with the pure engine, score the resulting
 *  state, and take the best — passing only when nothing beats ending the turn.
 *  `pickAction` returns ONE action; the controller loops it until END_TURN. */
import {
  applyAction, effAttack, effCost, hasKeyword, needsExplicitTarget, targetSide,
  type GameState, type Action, type PlayerId, type CardDef, type UnitInstance,
} from '../../engine/src/index.ts';

function needsTargetCard(c: CardDef): boolean {
  return !!c.effects?.arrival?.some(needsExplicitTarget);
}

/** which units a targeted card may legally pick */
function targetPool(c: CardDef, allies: UnitInstance[], enemies: UnitInstance[]): UnitInstance[] {
  const op = c.effects?.arrival?.find(needsExplicitTarget);
  switch (targetSide(op?.target)) {
    case 'enemy': return enemies;
    case 'ally': return allies;
    default: return [...allies, ...enemies];
  }
}

function unitValue(u: UnitInstance): number {
  let v = 1 + effAttack(u) + u.health;                 // a body worth ~1 + its stats
  if (hasKeyword(u, 'guard')) v += 1.5;
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

  // plays (enumerate targets for targeted cards, on the legal side only)
  pl.hand.forEach((c, i) => {
    if (effCost(s, me, c) > pl.provision) return;
    if (c.type === 'minion' && pl.board.length >= s.rules.boardLimit) return;
    if (needsTargetCard(c)) {
      for (const t of targetPool(c, pl.board, enemies)) acts.push({ type: 'PLAY_CARD', handIndex: i, targetUid: t.uid });
    } else {
      acts.push({ type: 'PLAY_CARD', handIndex: i });
    }
  });

  // hero power
  const hp = pl.heroPower;
  if (hp && !hp.usedThisTurn && pl.provision >= hp.cost) {
    const hpOp = hp.effects.find(needsExplicitTarget);
    if (hpOp) {
      const side = targetSide(hpOp.target);
      const hpPool = side === 'enemy' ? enemies : side === 'ally' ? pl.board : [...pl.board, ...enemies];
      for (const t of hpPool) acts.push({ type: 'HERO_POWER', targetUid: t.uid });
    } else {
      acts.push({ type: 'HERO_POWER' });
    }
  }

  // attacks (respect Guard). A unit that "can't attack alone" (Barak) is a
  // no-op swing while it's your only unit — never offer it, or the greedy loop
  // would re-pick a move the engine refuses and stall.
  const canSwing = (u: (typeof pl.board)[number]) =>
    pl.board.length > 1 || !(u.effects.passive ?? []).some((op) => op.verb === 'cannotAttackAlone');
  const guards = enemies.filter((u) => hasKeyword(u, 'guard'));
  for (const u of pl.board) {
    if (!u.ready || u.attacksThisTurn >= 1 || effAttack(u) <= 0 || !canSwing(u)) continue;
    if (guards.length) {
      for (const g of guards) acts.push({ type: 'ATTACK', attackerUid: u.uid, targetUid: g.uid });
    } else {
      for (const e of enemies) acts.push({ type: 'ATTACK', attackerUid: u.uid, targetUid: e.uid });
      acts.push({ type: 'ATTACK', attackerUid: u.uid, targetUid: 'hero' });
    }
  }
  return acts;
}

/** AI difficulty: 2 = Valiant (always the best line), 1 = Faithful (may take
 *  the second-best line when it's close), 0 = Novice (picks loosely among the
 *  decent lines). Deterministic — the "noise" is hashed from the state, never
 *  Math.random, so seeded games stay reproducible. */
export type AiLevel = 0 | 1 | 2;

function stateHash(s: GameState, me: PlayerId): number {
  const p = s.players[me], f = s.players[(me ^ 1) as PlayerId];
  return (s.turn * 7919 + p.hand.length * 131 + p.board.length * 17 + f.board.length * 29 + p.provision * 3) >>> 0;
}

export function pickAction(state: GameState, level: AiLevel = 2): Action {
  const me = state.active;
  const pass: Action = { type: 'END_TURN' };

  // Eat a Loaf of Bread when it unlocks a card you couldn't otherwise afford.
  // (The greedy eval won't play it on its own — it only sheds a hand card — so
  // this heuristic captures the one case where the extra Provision pays off.)
  const myHand = state.players[me].hand;
  const loafIdx = myHand.findIndex((c) => c.id === 'loaf_of_bread');
  if (loafIdx >= 0) {
    const prov = state.players[me].provision;
    const boardFull = state.players[me].board.length >= state.rules.boardLimit;
    const unlocks = myHand.some((c, i) => i !== loafIdx && c.id !== 'loaf_of_bread'
      && effCost(state, me, c) > prov && effCost(state, me, c) <= prov + 1
      && !(c.type === 'minion' && boardFull));
    if (unlocks) return { type: 'PLAY_CARD', handIndex: loafIdx };
  }

  // Lethal awareness (all levels — even a novice smells blood): if the face is
  // open and the board's remaining attacks add up to the kill, go face. The
  // greedy loop re-checks each call, so every attacker follows through.
  const foePl = state.players[(me ^ 1) as PlayerId];
  const faceOpen = !foePl.board.some((u) => hasKeyword(u, 'guard'));
  if (faceOpen) {
    const board = state.players[me].board;
    const swings = board
      .filter((u) => u.ready && u.attacksThisTurn < 1 && effAttack(u) > 0
        && (board.length > 1 || !(u.effects.passive ?? []).some((op) => op.verb === 'cannotAttackAlone')));
    const total = swings.reduce((sum, u) => sum + effAttack(u), 0);
    if (total >= foePl.heroHp && swings.length) {
      return { type: 'ATTACK', attackerUid: swings[0].uid, targetUid: 'hero' };
    }
  }

  // baseline: the value of simply ending the turn now
  const passScore = evaluate(applyAction(state, pass).state, me);

  const scored: { a: Action; sc: number }[] = [];
  for (const a of legalActions(state, me)) {
    const sc = evaluate(applyAction(state, a).state, me);
    if (sc > passScore + 1e-6) scored.push({ a, sc });
  }
  if (!scored.length) return pass;
  scored.sort((x, y) => y.sc - x.sc);

  if (level >= 2) return scored[0].a;
  const margin = level === 1 ? 1.5 : 4;
  const k = level === 1 ? 2 : 3;
  const pool = scored.filter((x) => x.sc >= scored[0].sc - margin).slice(0, k);
  return pool[stateHash(state, me) % pool.length].a;
}
