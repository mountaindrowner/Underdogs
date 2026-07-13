/** Regression tests for the effect audit: each test exercises a REAL card from
 *  /data against the engine and asserts its text actually happens. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  createGame, applyAction, registerDefs, makeRegistry, effAttack, effHealth, hasKeyword, effCost,
  type CardDef, type Action, type GameState,
} from '../src/index.ts';
import { loadCardData } from '../src/cards.node.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const defs = loadCardData([
  join(root, 'data', 'cards.seed.json'),
  join(root, 'data', 'cards.set2.json'),
  join(root, 'data', 'cards.neutral-expansion.json'),
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

/** rig + a known deck top + interactive-player toggle (for Foresee/Discover). */
function rigDeck(hand: string[], top: string[], interactive = true, heroHp?: number) {
  let s = rig(hand);
  s = structuredClone(s);
  s.interactivePlayer = interactive ? 0 : null;
  s.players[0].deck = [...top.map(card), ...s.players[0].deck];
  if (heroHp != null) s.players[0].heroHp = heroHp;
  return s;
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

test('The Tabernacle (standing relic): persists and buffs a damaged ally at end of turn', () => {
  let s = rig(['the_tabernacle', 'shepherd_boy']);
  s = act(s, { type: 'PLAY_CARD', handIndex: 0 });
  s = act(s, { type: 'PLAY_CARD', handIndex: 0 });
  assert.equal(s.players[0].relics.length, 1, 'relic stands');
  // Tabernacle now targets a DAMAGED ally (balance change) — wound it first.
  s = structuredClone(s);
  s.players[0].board[0].health -= 1;
  const before = s.players[0].board[0].attack + s.players[0].board[0].health;
  s = act(s, { type: 'END_TURN' });
  const after = s.players[0].board[0].attack + s.players[0].board[0].health;
  assert.equal(after, before + 2, '+1/+1 at dusk on the damaged ally');
});

test('Second player gets a Loaf of Bread: eat it for +1 Provision this turn', () => {
  const deck = () => Array.from({ length: 30 }, () => structuredClone(FILLER));
  let { state } = createGame({ seed: 7, decks: [deck(), deck()], skipMulligan: true });
  assert.equal(state.players[1].hand.filter((c) => c.id === 'loaf_of_bread').length, 1,
    'second player starts with one Loaf of Bread');
  assert.equal(state.players[0].hand.some((c) => c.id === 'loaf_of_bread'), false,
    'first player gets no loaf');
  state = act(state, { type: 'END_TURN' });            // → P1's first turn
  assert.equal(state.active, 1);
  const before = state.players[1].provision;           // 1 on the first turn
  const idx = state.players[1].hand.findIndex((c) => c.id === 'loaf_of_bread');
  state = act(state, { type: 'PLAY_CARD', handIndex: idx });
  assert.equal(state.players[1].provision, before + 1, 'eating the loaf grants +1 Provision');
  assert.equal(state.players[1].provisionMax, 1, 'the loaf is not banked into max');
  assert.equal(state.players[1].hand.some((c) => c.id === 'loaf_of_bread'), false, 'loaf is consumed');
});

test('Sarah: Covenant now buffs unconditionally (no Legendary required)', () => {
  let s = rig(['sarah']);
  s = act(s, { type: 'PLAY_CARD', handIndex: 0 });
  const before = s.players[0].board[0].attack + s.players[0].board[0].health; // 1/3 = 4
  s = act(s, { type: 'END_TURN' });                   // → P1
  s = act(s, { type: 'END_TURN' });                   // → P0 dawn: Covenant fires
  const sarah = s.players[0].board.find((u) => u.defId === 'sarah');
  assert.ok(sarah, 'Sarah still on board');
  assert.equal(sarah!.attack + sarah!.health, before + 2, 'gained +1/+1 with no Legendary in play');
});

test('Aaron Intercede: hero power restores 3 to a friendly unit, not the hero', () => {
  const deck = () => Array.from({ length: 30 }, () => structuredClone(FILLER));
  let { state } = createGame({
    seed: 5, decks: [deck(), deck()],
    leaders: [card('aaron_leader'), undefined] as [CardDef, CardDef | undefined],
    startUnits: [['benaiah'], []], skipMulligan: true,
  });
  state = structuredClone(state);
  state.players[0].provision = 10; state.players[0].provisionMax = 10;
  const ally = state.players[0].board[0];
  ally.health = 1;                                     // wound the 3/3
  const heroBefore = state.players[0].heroHp;
  state = act(state, { type: 'HERO_POWER', targetUid: ally.uid });
  const healed = state.players[0].board.find((u) => u.uid === ally.uid)!;
  assert.equal(healed.health, healed.maxHealth, 'Intercede healed the unit (capped at max)');
  assert.equal(state.players[0].heroHp, heroBefore, 'hero HP unchanged — no longer a face heal');
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

test('Foresee (interactive): reveals the top of the deck and lets you bottom a card', () => {
  let s = rigDeck(['scribe_of_the_word'], ['benaiah', 'ruth']); // Foresee 2
  s = act(s, { type: 'PLAY_CARD', handIndex: 0 });
  assert.ok(s.pending, 'a choice is pending');
  assert.equal(s.pending!.kind, 'foresee');
  assert.deepEqual(s.pending!.cardIds, ['benaiah', 'ruth'], 'shows the top 2');
  // send index 0 (benaiah) to the bottom; ruth rises to the top
  s = act(s, { type: 'RESOLVE_CHOICE', bottom: [0] });
  assert.equal(s.pending, null, 'choice resolved');
  assert.equal(s.players[0].deck[0].id, 'ruth', 'kept card is now on top');
  assert.equal(s.players[0].deck[s.players[0].deck.length - 1].id, 'benaiah', 'bottomed card is last');
});

test('Foresee resumes the ops after it — Elisha heals AFTER you look', () => {
  let s = rigDeck(['elisha'], ['watchman', 'ruth'], true, 25); // Foresee 2, then restore 2
  s = act(s, { type: 'PLAY_CARD', handIndex: 0 });
  assert.ok(s.pending, 'paused on the Foresee');
  assert.equal(s.players[0].heroHp, 25, 'heal has NOT happened yet');
  s = act(s, { type: 'RESOLVE_CHOICE', keep: [0, 1] });
  assert.equal(s.pending, null);
  assert.equal(s.players[0].heroHp, 27, 'the heal resumed after the choice');
});

test('Discover (Solomon): reveal 3, keep 2 into hand, the third is bottomed', () => {
  let s = rigDeck(['solomon_the_king'], ['benaiah', 'ruth', 'stephen']);
  s = act(s, { type: 'PLAY_CARD', handIndex: 0 });
  assert.ok(s.pending, 'a choice is pending');
  assert.equal(s.pending!.kind, 'discover');
  assert.equal(s.pending!.cardIds.length, 3);
  assert.equal(s.pending!.pick, 2);
  s = act(s, { type: 'RESOLVE_CHOICE', picked: [0, 2] }); // keep benaiah + stephen
  assert.equal(s.pending, null);
  const hand = s.players[0].hand.map((c) => c.id);
  assert.ok(hand.includes('benaiah') && hand.includes('stephen'), 'kept cards are in hand');
  assert.ok(!hand.includes('ruth'), 'unpicked card is not in hand');
  assert.equal(s.players[0].deck[s.players[0].deck.length - 1].id, 'ruth', 'unpicked → bottom');
});

test('Choices auto-resolve inline for a non-interactive player (AI / headless)', () => {
  // Foresee: no interactive player → no pause, deck order preserved
  let f = rigDeck(['scribe_of_the_word'], ['benaiah', 'ruth'], false);
  f = act(f, { type: 'PLAY_CARD', handIndex: 0 });
  assert.equal(f.pending, null, 'no pause without an interactive player');
  assert.equal(f.players[0].deck[0].id, 'benaiah', 'deck untouched by auto-foresee');
  // Discover: auto-keeps the first `keep` into hand
  let d = rigDeck(['solomon_the_king'], ['benaiah', 'ruth', 'stephen'], false);
  d = act(d, { type: 'PLAY_CARD', handIndex: 0 });
  assert.equal(d.pending, null);
  const hand = d.players[0].hand.map((c) => c.id);
  assert.ok(hand.includes('benaiah') && hand.includes('ruth'), 'auto-kept the first two');
});

test('While a choice is pending, other actions are refused', () => {
  let s = rigDeck(['scribe_of_the_word', 'watchman'], ['benaiah', 'ruth']);
  s = act(s, { type: 'PLAY_CARD', handIndex: 0 });
  assert.ok(s.pending);
  const before = JSON.stringify(s.players[0].board.map((u) => u.defId));
  s = act(s, { type: 'PLAY_CARD', handIndex: 0 }); // try to play watchman mid-choice
  assert.ok(s.pending, 'still pending — the play was ignored');
  assert.equal(JSON.stringify(s.players[0].board.map((u) => u.defId)), before, 'board unchanged');
});

test('AI takes lethal face damage instead of trading', async () => {
  const { pickAction } = await import('../../ui/src/ai.ts');
  // AI (player 0 here) has two ready 3-attack Benaiahs; foe at exactly 6 HP.
  // Correct play: everything to the face, ignore any tempting board math.
  let s = rig([], ['goliath_of_gath'], ['benaiah', 'benaiah']);
  s = structuredClone(s);
  s.players[1].heroHp = 6;
  for (const u of s.players[0].board) u.ready = true;
  s.players[1].board = [];                          // face is open
  const first = pickAction(s, 2);
  assert.deepEqual(first.type, 'ATTACK');
  assert.equal((first as { targetUid: number | 'hero' }).targetUid, 'hero', 'goes face');
  // follow the line to the kill
  let st = s;
  for (let i = 0; i < 6 && st.phase !== 'over'; i++) st = act(st, pickAction(st, 2));
  assert.equal(st.winner, 0, 'lethal is taken');
});

// ---- Set 2 legendaries: the new engine capabilities -----------------------

test('Joel: Arrival hits the enemy hero and heals your own', () => {
  let s = rig(['joel_herald']);
  s = structuredClone(s);
  s.players[0].heroHp = 25;                              // damaged so the heal shows
  s = act(s, { type: 'PLAY_CARD', handIndex: 0 });
  assert.equal(s.players[1].heroHp, 27, 'enemy hero took 3');
  assert.equal(s.players[0].heroHp, 28, 'own hero restored 3');
});

test('Jael of the Tent: Arrival destroys a DAMAGED enemy, ignores the healthy', () => {
  let s = rig(['jael_of_the_tent'], ['goliath_of_gath', 'watchman']);
  s = structuredClone(s);
  s.players[1].board[0].health -= 1;                     // wound the giant only
  s = act(s, { type: 'PLAY_CARD', handIndex: 0 });
  const foe = s.players[1].board.map((u) => u.defId);
  assert.ok(!foe.includes('goliath_of_gath'), 'the wounded giant falls');
  assert.ok(foe.includes('watchman'), 'the unhurt watchman is spared');
});

test('Hezekiah: Fulfill fires once your hero has taken damage', () => {
  let s = rig(['hezekiah_sick_king']);
  s = structuredClone(s);
  s.players[0].heroHp = 28;                              // king already ailing
  s = act(s, { type: 'PLAY_CARD', handIndex: 0 });
  assert.equal(s.players[0].board[0].defId, 'hezekiah_fifteen_years', 'the 15 years are added');
});

test('Miriam: Fulfill after you cast two spells', () => {
  let s = rig(['miriam_riverbank', 'word_of_the_lord', 'word_of_the_lord']);
  s = act(s, { type: 'PLAY_CARD', handIndex: 0 });        // Miriam to the board (Foresee auto-resolves)
  assert.equal(s.players[0].board[0].defId, 'miriam_riverbank', 'still early form');
  s = act(s, { type: 'PLAY_CARD', handIndex: 0 });        // spell 1
  s = act(s, { type: 'PLAY_CARD', handIndex: 0 });        // spell 2
  assert.equal(s.players[0].board[0].defId, 'miriam_prophetess_song', 'the song is sung');
});

test('Gideon: Fulfill by winning a fight while outnumbered', () => {
  let s = rig([], ['watchman', 'watchman'], ['gideon_threshing']);
  s = structuredClone(s);
  const gideon = s.players[0].board[0];
  gideon.ready = true;
  const foe = s.players[1].board[0];
  s = act(s, { type: 'ATTACK', attackerUid: gideon.uid, targetUid: foe.uid });
  const g = s.players[0].board[0];
  assert.equal(g.defId, 'gideon_mighty_valor', 'the 300 are enough');
});

test('Barak: cannot attack while he is your only unit', () => {
  let s = rig([], [], ['barak_the_reluctant']);
  s = structuredClone(s);
  const barak = s.players[0].board[0];
  barak.ready = true;
  const before = s.players[1].heroHp;
  s = act(s, { type: 'ATTACK', attackerUid: barak.uid, targetUid: 'hero' });
  assert.equal(s.players[1].heroHp, before, 'the reluctant one holds back alone');
});

test('Bezalel: your Relics cost (1) less while he stands', () => {
  let s = rig(['bezalel_spirit_gifted']);
  const relicBase = reg.get('sword_of_goliath')!.cost ?? 0;
  assert.equal(effCost(s, 0, reg.get('sword_of_goliath')!), relicBase, 'full price before');
  s = act(s, { type: 'PLAY_CARD', handIndex: 0 });
  assert.equal(effCost(s, 0, reg.get('sword_of_goliath')!), relicBase - 1, 'discounted with Bezalel out');
});

test('Nehemiah: raises TWO fallen allies and gives them Guard', () => {
  let s = rig(['nehemiah_rebuilder']);
  s = structuredClone(s);
  s.players[0].fallen = [
    { defId: 'shepherd_boy', turn: 1 },
    { defId: 'benaiah', turn: 1 },
  ];
  s = act(s, { type: 'PLAY_CARD', handIndex: 0 });
  const raised = s.players[0].board.filter((u) => u.defId !== 'nehemiah_rebuilder');
  assert.equal(raised.length, 2, 'two walls rebuilt');
  assert.ok(raised.every((u) => hasKeyword(u, 'guard')), 'each stands as a Guard');
});

// ---- Neutral expansion: the new engine capabilities -----------------------

test('Gleaner: Arrival draws only when your hand is empty (empty_hand)', () => {
  // hand = just Gleaner -> playing it empties the hand -> the draw fires
  let s = rig(['gleaner']);
  s = act(s, { type: 'PLAY_CARD', handIndex: 0 });
  assert.equal(s.players[0].hand.length, 1, 'drew a card off the empty hand');
  // hand = Gleaner + another -> hand not empty when Gleaner resolves -> no draw
  let t = rig(['gleaner', 'watchman']);
  t = act(t, { type: 'PLAY_CARD', handIndex: 0 });
  assert.equal(t.players[0].hand.length, 1, 'only the leftover card, no bonus draw');
});

test('The Lone Pilgrim: draws 3 only if the deck has no duplicates (singleton_deck)', () => {
  let s = rig(['the_lone_pilgrim']);
  s = structuredClone(s);
  s.players[0].deck = ['benaiah', 'ruth', 'stephen', 'watchman', 'scribe'].map(card); // all unique
  s = act(s, { type: 'PLAY_CARD', handIndex: 0 });
  assert.equal(s.players[0].hand.length, 3, 'singleton deck -> draw 3');
  // a deck with a duplicate id -> no draw
  let t = rig(['the_lone_pilgrim']);
  t = structuredClone(t);
  t.players[0].deck = ['benaiah', 'benaiah', 'ruth'].map(card);   // benaiah x2
  t = act(t, { type: 'PLAY_CARD', handIndex: 0 });
  assert.equal(t.players[0].hand.length, 0, 'duplicates -> no draw');
});

test('Eleventh-Hour Laborer: cannot attack unless you played another card this turn', () => {
  let s = rig(['watchman'], [], ['eleventh_hour_laborer']);
  s = structuredClone(s);
  s.players[0].board[0].ready = true;
  s.players[0].cardsPlayedThisTurn = 0;
  const laborer = s.players[0].board[0];
  const before = s.players[1].heroHp;
  s = act(s, { type: 'ATTACK', attackerUid: laborer.uid, targetUid: 'hero' });
  assert.equal(s.players[1].heroHp, before, 'idle: refuses to swing');
  s = act(s, { type: 'PLAY_CARD', handIndex: 0 });                 // play another card
  s = act(s, { type: 'ATTACK', attackerUid: laborer.uid, targetUid: 'hero' });
  assert.equal(s.players[1].heroHp, before - effAttack(laborer), 'now it swings');
});

test('The Great Cloud of Witnesses: buffs other units +1/+1 per other unit (perOtherAlly)', () => {
  let s = rig(['the_great_cloud'], [], ['watchman', 'watchman']); // 2 other allies (0/2 each)
  s = act(s, { type: 'PLAY_CARD', handIndex: 0 });
  const others = s.players[0].board.filter((u) => u.defId === 'watchman');
  assert.equal(others.length, 2);
  for (const u of others) {
    assert.equal(effAttack(u), 0 + 2, 'each watchman +2 attack (x2 other allies)');
    assert.equal(effHealth(u), 2 + 2, 'each watchman +2 health');
  }
  const cloud = s.players[0].board.find((u) => u.defId === 'the_great_cloud')!;
  assert.equal(cloud.auraAtk ?? 0, 0, 'the Cloud does not buff itself (scope other)');
});

test('Kinsman-Redeemer: returns an ally that died THIS turn to hand (diedThisTurn)', () => {
  let s = rig(['kinsman_redeemer']);
  s = structuredClone(s);
  s.players[0].fallen = [
    { defId: 'ruth', turn: s.turn - 2 },      // an old death — must be ignored
    { defId: 'benaiah', turn: s.turn },       // died this turn — the one to redeem
  ];
  s = act(s, { type: 'PLAY_CARD', handIndex: 0 });
  const hand = s.players[0].hand.map((c) => c.id);
  assert.ok(hand.includes('benaiah'), 'this-turn casualty returns to hand');
  assert.ok(!hand.includes('ruth'), 'the old death stays fallen');
});

test('The Jar of Oil: heals 2 at each of your dawns, then breaks after 3 turns (breakAfterTurns)', () => {
  let s = rig(['widows_jar']);
  s = structuredClone(s);
  s.players[0].heroHp = 20;
  s = act(s, { type: 'PLAY_CARD', handIndex: 0 });        // set the jar down
  assert.equal(s.players[0].relics.length, 1, 'jar stands');
  for (let i = 0; i < 3; i++) {                            // three of my dawns
    s = act(s, { type: 'END_TURN' });                     // → P1
    s = act(s, { type: 'END_TURN' });                     // → my dawn: heal 2 (then break on the 3rd)
  }
  assert.equal(s.players[0].heroHp, 26, 'healed 2 three times');
  assert.equal(s.players[0].relics.length, 0, 'the jar has run dry and broken');
});

test('AI never offers a lone Barak\'s no-op attack (would stall the greedy loop)', async () => {
  const { pickAction } = await import('../../ui/src/ai.ts');
  let s = rig([], ['watchman'], ['barak_the_reluctant']);
  s = structuredClone(s);
  s.active = 0;
  s.players[0].board[0].ready = true;
  // With Barak alone, the AI must not return an ATTACK for him — it would be a
  // no-op the engine refuses, and the greedy re-pick would loop forever.
  const a = pickAction(s, 2);
  if (a.type === 'ATTACK') {
    assert.notEqual((a as { attackerUid: number }).attackerUid, s.players[0].board[0].uid,
      'lone Barak is not offered as an attacker');
  }
  // and applying the chosen action must make progress (turn advances or board changes)
  const before = JSON.stringify(s.players[0].board);
  const s2 = act(s, a);
  assert.ok(s2.active !== 0 || JSON.stringify(s2.players[0].board) !== before || s2.phase === 'over',
    'the AI makes real progress, never a no-op');
});

test('AI never offers the Eleventh-Hour Laborer a no-op attack (no stall)', async () => {
  const { pickAction } = await import('../../ui/src/ai.ts');
  let s = rig([], ['watchman'], ['eleventh_hour_laborer', 'watchman']); // 2 units (not "alone")
  s = structuredClone(s);
  s.active = 0;
  s.players[0].cardsPlayedThisTurn = 0;                 // hasn't played a card this turn
  for (const u of s.players[0].board) u.ready = true;
  const laborer = s.players[0].board.find((u) => u.defId === 'eleventh_hour_laborer')!;
  const a = pickAction(s, 2);
  if (a.type === 'ATTACK') {
    assert.notEqual((a as { attackerUid: number }).attackerUid, laborer.uid,
      'the idle laborer is not offered as an attacker');
  }
  const before = JSON.stringify(s.players[0]);
  const s2 = act(s, a);
  assert.ok(s2.active !== 0 || JSON.stringify(s2.players[0]) !== before || s2.phase === 'over',
    'the AI makes real progress, never a no-op');
});

test('Strong AI (2-ply rollout): deterministic, legal, and always progresses', async () => {
  const { pickActionStrong } = await import('../../ui/src/ai.ts');
  let s = rig(['shepherd_boy', 'fire_from_heaven', 'physician'], ['goliath_of_gath']);
  s = structuredClone(s); s.active = 0;
  const a = pickActionStrong(s);
  const b = pickActionStrong(structuredClone(s));
  assert.deepEqual(a, b, 'same state -> same action (no RNG)');
  // applying it makes real progress (turn advances, board/hand changes, or win)
  const before = JSON.stringify(s.players[0]);
  const s2 = act(s, a);
  assert.ok(s2.active !== 0 || JSON.stringify(s2.players[0]) !== before || s2.phase === 'over',
    'the strong AI never returns a no-op');
  // and it drives a whole turn to END_TURN without stalling
  let st = s; let guard = 0;
  while (st.active === 0 && st.phase !== 'over' && guard++ < 30) {
    const act3 = pickActionStrong(st);
    if (act3.type === 'END_TURN') break;
    st = act(st, act3);
  }
  assert.ok(guard < 30, 'the strong turn terminates (no infinite loop)');
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
