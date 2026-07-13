import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  createGame, applyAction, registerDefs, effAttack,
  makeRegistry, buildDeck,
  type CardDef, type Action, type GameState,
} from '../src/index.ts';
import { loadCardData } from '../src/cards.node.ts';

// ---- test cards ------------------------------------------------------------
const D = (o: Partial<CardDef> & { id: string; name: string }): CardDef =>
  ({ class: 'neutral', type: 'minion', cost: 1, ...o } as CardDef);

const VANILLA = D({ id: 'v', name: 'Vanilla', attack: 2, health: 2 });
const SWIFT = D({ id: 'sw', name: 'Swift', attack: 2, health: 2, keywords: ['swift'] });
const BOMB = D({ id: 'bomb', name: 'Bomb', attack: 1, health: 1, effects: { arrival: [{ verb: 'deal', amount: 1, target: 'enemyHero' }] } });
const LEGACY = D({ id: 'leg', name: 'Legacy', attack: 1, health: 1, effects: { legacy: [{ verb: 'summon', token: 'tok_disciple', count: 1 }] } });
const ENDURE = D({ id: 'end', name: 'Endurer', attack: 2, health: 2, keywords: ['endure'] });
const KING = D({ id: 'king', name: 'King', attack: 2, health: 2, effects: { aura: [{ verb: 'buff', attack: 1, target: 'allAllies' }] } });
const ABRAM = D({ id: 'abram', name: 'Abram', attack: 2, health: 2, fulfill: { condition: 'control_allies', value: 2, into: 'abraham' } });
const ABRAHAM = D({ id: 'abraham', name: 'Abraham', attack: 4, health: 4 });
const NUKE = D({ id: 'nuke', name: 'Nuke', type: 'spell', effects: { arrival: [{ verb: 'deal', amount: 30, target: 'enemyHero' }] } });
const TOK_DISCIPLE = D({ id: 'tok_disciple', name: 'Disciple', attack: 1, health: 1 });

registerDefs([VANILLA, SWIFT, BOMB, LEGACY, ENDURE, KING, ABRAM, ABRAHAM, NUKE, TOK_DISCIPLE]);

const deckOf = (def: CardDef, n = 30) => Array.from({ length: n }, () => structuredClone(def));

function run(seed: number, d0: CardDef, d1: CardDef, actions: Action[], n0 = 30, n1 = 30) {
  let { state, events } = createGame({ seed, decks: [deckOf(d0, n0), deckOf(d1, n1)], skipMulligan: true });
  const all = [...events];
  for (const a of actions) { const r = applyAction(state, a); state = r.state; all.push(...r.events); }
  return { state, events: all };
}

// ---- tests -----------------------------------------------------------------

test('deterministic: same seed + actions -> identical state & events', () => {
  const acts: Action[] = [{ type: 'PLAY_CARD', handIndex: 0 }, { type: 'END_TURN' }, { type: 'END_TURN' }];
  const a = run(7, VANILLA, VANILLA, acts);
  const b = run(7, VANILLA, VANILLA, acts);
  assert.deepEqual(a.state, b.state);
  assert.deepEqual(a.events, b.events);
});

test('turn/provision: starts at 1, refills and grows', () => {
  const { state } = run(1, VANILLA, VANILLA, []);
  assert.equal(state.phase, 'main');
  assert.equal(state.players[0].provision, 1);
  assert.equal(state.players[0].provisionMax, 1);
  const t2 = run(1, VANILLA, VANILLA, [{ type: 'END_TURN' }, { type: 'END_TURN' }]);
  assert.equal(t2.state.players[0].provision, 2); // P0's second turn
});

test('play minion: spends provision, summons, arrival fires', () => {
  const { state } = run(2, BOMB, VANILLA, [{ type: 'PLAY_CARD', handIndex: 0 }]);
  assert.equal(state.players[0].board.length, 1);
  assert.equal(state.players[0].provision, 0);
  assert.equal(state.players[1].heroHp, 29); // Bomb arrival dealt 1 to enemy hero
});

test('attack: 2/2 trade, both die, deaths fire', () => {
  let { state } = createGame({ seed: 3, decks: [deckOf(SWIFT), deckOf(VANILLA)], skipMulligan: true });
  ({ state } = applyAction(state, { type: 'PLAY_CARD', handIndex: 0 }));      // P0 swift 2/2
  ({ state } = applyAction(state, { type: 'END_TURN' }));                     // -> P1
  ({ state } = applyAction(state, { type: 'PLAY_CARD', handIndex: 0 }));      // P1 vanilla 2/2
  ({ state } = applyAction(state, { type: 'END_TURN' }));                     // -> P0 (swift now ready)
  const atk = state.players[0].board[0].uid;
  const tgt = state.players[1].board[0].uid;
  const r = applyAction(state, { type: 'ATTACK', attackerUid: atk, targetUid: tgt });
  assert.equal(r.state.players[0].board.length, 0);
  assert.equal(r.state.players[1].board.length, 0);
  assert.ok(r.events.some((e) => e.t === 'death'));
});

test('Guard: cannot attack past a Guard unit', () => {
  const GUARD = D({ id: 'g', name: 'Guard', attack: 1, health: 4, keywords: ['guard'] });
  registerDefs([GUARD]);
  let { state } = createGame({ seed: 5, decks: [deckOf(SWIFT), deckOf(GUARD)], skipMulligan: true });
  ({ state } = applyAction(state, { type: 'PLAY_CARD', handIndex: 0 }));
  ({ state } = applyAction(state, { type: 'END_TURN' }));
  ({ state } = applyAction(state, { type: 'PLAY_CARD', handIndex: 0 }));      // P1 guard
  ({ state } = applyAction(state, { type: 'END_TURN' }));
  const atk = state.players[0].board[0].uid;
  const before = state.players[1].heroHp;
  const r = applyAction(state, { type: 'ATTACK', attackerUid: atk, targetUid: 'hero' });
  assert.equal(r.state.players[1].heroHp, before); // illegal, no damage
});

test('Endure: prevents the first damage, then shatters', () => {
  let { state } = createGame({ seed: 9, decks: [deckOf(SWIFT), deckOf(ENDURE)], skipMulligan: true });
  ({ state } = applyAction(state, { type: 'PLAY_CARD', handIndex: 0 }));      // P0 swift 2/2
  ({ state } = applyAction(state, { type: 'END_TURN' }));
  ({ state } = applyAction(state, { type: 'PLAY_CARD', handIndex: 0 }));      // P1 endure 2/2
  ({ state } = applyAction(state, { type: 'END_TURN' }));
  const atk = state.players[0].board[0].uid;
  const tgt = state.players[1].board[0].uid;
  const r = applyAction(state, { type: 'ATTACK', attackerUid: atk, targetUid: tgt });
  const endurer = r.state.players[1].board.find((u) => u.uid === tgt)!;
  assert.equal(endurer.health, 2);     // shield ate the hit
  assert.equal(endurer.endure, false); // consumed
  assert.equal(r.state.players[0].board.length, 0); // attacker took counter and died
  assert.ok(r.events.some((e) => e.t === 'endureShatter'));
});

test('Aura: King gives OTHER allies +1 attack', () => {
  let { state } = createGame({ seed: 4, decks: [deckOf(KING), deckOf(VANILLA)], skipMulligan: true });
  ({ state } = applyAction(state, { type: 'END_TURN' }));   // P0 -> P1
  ({ state } = applyAction(state, { type: 'END_TURN' }));   // P1 -> P0 (provision 2)
  ({ state } = applyAction(state, { type: 'PLAY_CARD', handIndex: 0 }));  // King
  const r = applyAction(state, { type: 'PLAY_CARD', handIndex: 0 });      // an ally (also a King def, still a body)
  const board = r.state.players[0].board;
  const ally = board[1];
  assert.equal(effAttack(ally), 3);   // 2 base + 1 aura
});

test('Legacy: summons a Disciple token on death', () => {
  let { state } = createGame({ seed: 6, decks: [deckOf(SWIFT), deckOf(LEGACY)], skipMulligan: true });
  ({ state } = applyAction(state, { type: 'PLAY_CARD', handIndex: 0 }));
  ({ state } = applyAction(state, { type: 'END_TURN' }));
  ({ state } = applyAction(state, { type: 'PLAY_CARD', handIndex: 0 }));   // P1 legacy 1/1
  ({ state } = applyAction(state, { type: 'END_TURN' }));
  const atk = state.players[0].board[0].uid;
  const tgt = state.players[1].board[0].uid;
  const r = applyAction(state, { type: 'ATTACK', attackerUid: atk, targetUid: tgt });
  const p1 = r.state.players[1].board;
  assert.equal(p1.length, 1);
  assert.equal(p1[0].defId, 'tok_disciple');   // legacy fired
});

test('Fulfill: Abram -> Abraham when controlling 2+ other allies', () => {
  let { state } = createGame({ seed: 8, decks: [deckOf(ABRAM), deckOf(VANILLA)], skipMulligan: true });
  ({ state } = applyAction(state, { type: 'PLAY_CARD', handIndex: 0 }));   // turn1: 1 Abram
  ({ state } = applyAction(state, { type: 'END_TURN' }));
  ({ state } = applyAction(state, { type: 'END_TURN' }));                  // -> P0 turn2, provision 2
  ({ state } = applyAction(state, { type: 'PLAY_CARD', handIndex: 0 }));
  const r = applyAction(state, { type: 'PLAY_CARD', handIndex: 0 });       // board = 3 Abrams
  const names = r.state.players[0].board.map((u) => u.name);
  assert.ok(names.includes('Abraham'), `expected a transform, got ${names.join(',')}`);
  const abe = r.state.players[0].board.find((u) => u.name === 'Abraham')!;
  assert.equal(abe.attack, 4);
  assert.ok(r.events.some((e) => e.t === 'fulfill'));
});

test('Fatigue: drawing from an empty deck damages the hero', () => {
  const r = run(11, VANILLA, VANILLA, [{ type: 'END_TURN' }, { type: 'END_TURN' }], 4, 10);
  assert.ok(r.state.players[0].heroHp < 30);
  assert.ok(r.events.some((e) => e.t === 'fatigue'));
});

test('Win: reducing a hero to 0 ends the game', () => {
  const r = run(12, NUKE, VANILLA, [{ type: 'PLAY_CARD', handIndex: 0 }]);
  assert.equal(r.state.phase, 'over');
  assert.equal(r.state.winner, 0);
  assert.ok(r.events.some((e) => e.t === 'gameOver'));
});

test('data pipeline: loads real /data and builds a deck', () => {
  const here = dirname(fileURLToPath(import.meta.url));
  const dataDir = join(here, '..', '..', 'data');
  const defs = loadCardData([
    join(dataDir, 'cards.seed.json'),
    join(dataDir, 'cards.set2.json'),
    join(dataDir, 'cards.neutral-expansion.json'),
    join(dataDir, 'tokens.json'),
    join(dataDir, 'adversaries.json'),
    join(dataDir, 'leaders.json'),
  ]);
  assert.ok(defs.length > 120, `expected 120+ cards, got ${defs.length}`);
  const reg = makeRegistry(defs);
  assert.ok(reg.has('david_the_king'));
  const deck = buildDeck(reg, ['watchman', 'shepherd_boy', 'watchman']);
  assert.equal(deck.length, 3);
  assert.equal(deck[0].name, 'Watchman');
});
