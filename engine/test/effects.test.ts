/** Regression tests for the effect audit: each test exercises a REAL card from
 *  /data against the engine and asserts its text actually happens. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  createGame, applyAction, registerDefs, makeRegistry, effAttack, effHealth, hasKeyword,
  type CardDef, type Action, type GameState,
} from '../src/index.ts';
import { loadCardData } from '../src/cards.node.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const defs = loadCardData([
  join(root, 'data', 'cards.seed.json'),
  join(root, 'data', 'tokens.json'),
  join(root, 'data', 'adversaries.json'),
  join(root, 'data', 'leaders.json'),
]);
registerDefs(defs);
const reg = makeRegistry(defs);
const card = (id: string): CardDef => {
  const c = reg.get(id);
  assert.ok(c, `card ${id} exists`);
  return structuredClone(c!);
};

const FILLER = card('watchman'); // plain 1-drop for deck padding

/** a game where P0's opening hand is exactly `hand` (rigged decks, no mulligan) */
function rig(hand: string[], foeBoard: string[] = [], myBoard: string[] = []) {
  const deck0 = [...hand.map(card), ...Array.from({ length: 26 }, () => structuredClone(FILLER))];
  const deck1 = Array.from({ length: 30 }, () => structuredClone(FILLER));
  let { state } = createGame({
    seed: 42, decks: [deck0, deck1] as [CardDef[], CardDef[]],
    skipMulligan: true, startUnits: [myBoard, foeBoard],
  });
  // skipMulligan shuffles decks; instead re-deal: force hand directly
  state = structuredClone(state);
  state.players[0].hand = hand.map(card);
  state.players[0].provision = 10; state.players[0].provisionMax = 10;
  return state;
}

function act(state: GameState, a: Action): GameState {
  return applyAction(state, a).state;
}

// ---------------------------------------------------------------------------

test('David, the King: other allies get +1 attack (aura), not himself', () => {
  let s = rig(['shepherd_boy', 'david_the_king']);
  s = act(s, { type: 'PLAY_CARD', handIndex: 0 });
  s = act(s, { type: 'PLAY_CARD', handIndex: 0 });
  const [boy, david] = s.players[0].board;
  assert.equal(david.defId, 'david_the_king');
  assert.equal(boy.auraAtk, 1, 'ally is buffed');
  assert.equal(effAttack(boy), (reg.get('shepherd_boy')!.attack ?? 0) + 1);
  assert.equal(david.auraAtk, 0, 'the king does not buff himself');
});

test('Fire from Heaven: deals 4 to the CHOSEN enemy unit', () => {
  let s = rig(['fire_from_heaven'], ['goliath_of_gath']);
  const goliath = s.players[1].board[0];
  const before = goliath.health;
  s = act(s, { type: 'PLAY_CARD', handIndex: 0, targetUid: goliath.uid });
  assert.equal(s.players[1].board[0].health, before - 4);
});

test('Lost Sheep: Redeem — returns to hand when it dies', () => {
  let s = rig([], ['goliath_of_gath'], ['lost_sheep']);
  const sheep = s.players[0].board[0];
  s = structuredClone(s);
  s.players[0].board[0].health = 0;                     // strike it down
  s = act(s, { type: 'END_TURN' });                     // settle runs on next action
  assert.ok(s.players[0].hand.some((c) => c.id === 'lost_sheep'), 'sheep came home');
  assert.ok(!s.players[0].discard.some((c) => c.id === 'lost_sheep'), 'not in discard');
  assert.ok(sheep, 'sheep existed');
});

test('Saul of Tarsus becomes Paul at the start of your next turn (grace, not works)', () => {
  let s = rig(['saul_of_tarsus']);
  s = act(s, { type: 'PLAY_CARD', handIndex: 0 });
  assert.equal(s.players[0].board[0].defId, 'saul_of_tarsus');
  s = act(s, { type: 'END_TURN' });                     // rival's turn
  s = act(s, { type: 'END_TURN' });                     // your next dawn
  assert.equal(s.players[0].board[0].defId, 'paul_apostle', 'Saul → Paul, automatically');
});

test('The Tabernacle (standing relic): persists and buffs at end of turn', () => {
  let s = rig(['the_tabernacle', 'shepherd_boy']);
  s = act(s, { type: 'PLAY_CARD', handIndex: 0 });
  s = act(s, { type: 'PLAY_CARD', handIndex: 0 });
  assert.equal(s.players[0].relics.length, 1, 'relic stands');
  const before = s.players[0].board[0].attack + s.players[0].board[0].health;
  s = act(s, { type: 'END_TURN' });
  const after = s.players[0].board[0].attack + s.players[0].board[0].health;
  assert.equal(after, before + 2, '+1/+1 at dusk');
});

test('David, the Shepherd: when a Sheep dies, deal 2 to a random enemy', () => {
  let s = rig([], ['goliath_of_gath'], ['david_the_shepherd', 'tok_sheep']);
  const goliathBefore = s.players[1].board[0].health;
  s = structuredClone(s);
  const sheep = s.players[0].board.find((u) => u.defId === 'tok_sheep')!;
  sheep.health = 0;
  s = act(s, { type: 'END_TURN' });
  assert.equal(s.players[1].board[0].health, goliathBefore - 2, 'the flock is avenged');
});

test('Atonement: strongest fallen ally returns to the field with Endure', () => {
  let s = rig(['atonement'], [], ['benaiah']);
  s = structuredClone(s);
  s.players[0].board[0].health = 0;                     // Benaiah falls
  s = act(s, { type: 'END_TURN' });
  s = act(s, { type: 'END_TURN' });
  s = structuredClone(s);
  s.players[0].hand = [card('atonement')];
  s.players[0].provision = 10;
  s = act(s, { type: 'PLAY_CARD', handIndex: 0 });
  const raised = s.players[0].board.find((u) => u.defId === 'benaiah');
  assert.ok(raised, 'Benaiah returns');
  assert.ok(raised!.endure, 'with Endure');
});

test('Jonah: if he would die, he is shuffled into your deck instead', () => {
  let s = rig([], [], ['jonah']);
  s = structuredClone(s);
  s.players[0].board[0].health = 0;
  const deckBefore = s.players[0].deck.length;
  s = act(s, { type: 'END_TURN' });
  assert.equal(s.players[0].board.length, 0, 'off the board');
  assert.ok(!s.players[0].discard.some((c) => c.id === 'jonah'), 'not in the discard');
  assert.equal(s.players[0].deck.filter((c) => c.id === 'jonah').length, 1, 'in the deck (three days later…)');
  assert.equal(s.players[0].deck.length, deckBefore + 1);
});

test('The Good Fold (standing relic): your Sheep get +1/+1 and Guard', () => {
  let s = rig(['the_good_fold'], [], ['tok_sheep', 'shepherd_boy']);
  s = act(s, { type: 'PLAY_CARD', handIndex: 0 });
  const sheep = s.players[0].board.find((u) => u.defId === 'tok_sheep')!;
  const boy = s.players[0].board.find((u) => u.defId === 'shepherd_boy')!;
  assert.equal(sheep.auraAtk, 1);
  assert.equal(sheep.auraHp, 1);
  assert.ok(hasKeyword(sheep, 'guard'), 'the fold guards the sheep');
  assert.equal(boy.auraAtk, 0, 'shepherd boy is not a sheep');
  assert.ok(effHealth(sheep) === sheep.health + 1);
});

test('Jael\'s Tent Peg: wielder destroys an already-damaged unit it strikes', () => {
  let s = rig(['jaels_tent_peg'], ['goliath_of_gath'], ['benaiah']);
  s = structuredClone(s);
  const ben = s.players[0].board[0];
  ben.ready = true;
  const goliath = s.players[1].board[0];
  s.players[1].board[0].health -= 1;                     // pre-damaged giant
  s = act(s, { type: 'PLAY_CARD', handIndex: 0, targetUid: ben.uid });
  s = act(s, { type: 'ATTACK', attackerUid: ben.uid, targetUid: goliath.uid });
  assert.equal(s.players[1].board.length, 0, 'the peg finds the temple');
});

test('AI difficulty is deterministic per level', async () => {
  // same state, same level -> same action (no Math.random anywhere)
  const { pickAction } = await import('../../ui/src/ai.ts');
  let s = rig(['shepherd_boy', 'fire_from_heaven'], ['goliath_of_gath']);
  s = structuredClone(s); s.active = 0;
  for (const lvl of [0, 1, 2] as const) {
    const a = pickAction(s, lvl);
    const b = pickAction(structuredClone(s), lvl);
    assert.deepEqual(a, b, `level ${lvl} deterministic`);
  }
});
