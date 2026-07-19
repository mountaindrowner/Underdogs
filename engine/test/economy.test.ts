/** Economy core tests (docs/21): packs, pity, duplicate protection, crafting,
 *  the daily taper, and Daily Bread quests — all deterministic via the
 *  injected seed + today(). */
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { loadCardData } from '../src/cards.node.ts';
import type { CardDef } from '../src/index.ts';
import {
  initEconomyData, _reset, _setToday, eco, chooseStarter, openPack, craft, disenchant,
  canCraft, applyMatch, refreshQuests, rerollQuest, ownedCount,
  PACK_COST, PACK_SIZE, STARTING_TALENTS, PITY_FIRST, PITY_AFTER,
  WIN_TALENTS, LOSS_TALENTS, FIRST_WIN_BONUS, TAPER_AFTER_WINS, TAPER_WIN_TALENTS,
  CRAFT, SHATTER,
} from '../../ui/src/economy.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const defs = loadCardData([
  join(root, 'data', 'cards.seed.json'),
  join(root, 'data', 'cards.set2.json'),
  join(root, 'data', 'cards.neutral-expansion.json'),
  join(root, 'data', 'tokens.json'),
  join(root, 'data', 'adversaries.json'),
  join(root, 'data', 'leaders.json'),
]);
const byId = new Map(defs.map((c) => [c.id, c]));
const pool = defs.filter((c) => c.collectible !== false && c.type !== 'leader' && !(c as { boss?: boolean }).boss
  && ['common', 'rare', 'epic', 'legendary'].includes(c.rarity ?? ''));
const maxCopies = (c: CardDef) => (c.rarity === 'legendary' ? 1 : 2);
// a plausible starter list: 15 distinct shepherd/neutral cards x2 copies
const starterIds = pool.filter((c) => c.class === 'shepherd' || c.class === 'neutral')
  .slice(0, 15).flatMap((c) => [c.id, c.id]);
initEconomyData({
  pool, maxCopies, byId: (id) => byId.get(id),
  presets: [{ class: 'shepherd', cards: starterIds }, { class: 'prophet', cards: starterIds }],
});
_setToday(() => '2026-07-19');

test('starter grant: cards owned + starting Talents', () => {
  _reset(7);
  chooseStarter('shepherd');
  assert.equal(eco().talents, STARTING_TALENTS);
  assert.ok(Object.keys(eco().owned).length >= 10, 'starter cards granted');
  chooseStarter('prophet');                       // second call is a no-op
  assert.equal(eco().starterClass, 'shepherd');
});

test('pack: costs Talents, 5 cards, at least one Rare-or-better', () => {
  _reset(11);
  eco().talents = PACK_COST;
  const cards = openPack()!;
  assert.equal(eco().talents, 0);
  assert.equal(cards.length, PACK_SIZE);
  assert.ok(cards.some((p) => (p.card.rarity ?? 'common') !== 'common'), '>=1 rare+');
  assert.equal(openPack(), null, 'broke -> no pack');
});

test('pity: a Legendary lands within the first PITY_FIRST packs and every PITY_AFTER thereafter', () => {
  _reset(13);
  eco().talents = PACK_COST * 60;
  let gap = 0; let firstAt: number | null = null;
  for (let i = 1; i <= 60; i++) {
    const got = openPack()!.some((p) => p.card.rarity === 'legendary');
    gap = got ? 0 : gap + 1;
    if (got && firstAt == null) firstAt = i;
    assert.ok(gap < PITY_AFTER, `gap ${gap} exceeded pity at pack ${i}`);
  }
  assert.ok(firstAt != null && firstAt <= PITY_FIRST, `first legendary by pack ${PITY_FIRST} (got ${firstAt})`);
});

test('duplicate protection: never exceeds max copies; dupes pay Fragments', () => {
  _reset(17);
  eco().talents = PACK_COST * 200;
  let sawDupeFrags = false;
  for (let i = 0; i < 200; i++) {
    const cards = openPack()!;
    for (const p of cards) {
      const max = maxCopies(p.card);
      assert.ok(ownedCount(p.card.id) <= max, `${p.card.id} exceeded ${max}`);
      if (p.dupe) { assert.ok(p.frags > 0); sawDupeFrags = true; }
    }
  }
  assert.ok(eco().fragments > 0 || !sawDupeFrags, 'dupes credited fragments');
});

test('first fruits: the first packs draw only starter-class + neutral cards', () => {
  _reset(19);
  chooseStarter('shepherd');
  eco().talents += PACK_COST * 3;
  for (let i = 0; i < 3; i++) {
    for (const p of openPack()!) {
      assert.ok(p.card.class === 'shepherd' || p.card.class === 'neutral',
        `first-fruits pack held a ${p.card.class} card`);
    }
  }
});

test('craft + disenchant roundtrip', () => {
  _reset(23);
  const target = pool.find((c) => c.rarity === 'epic')!;
  eco().fragments = CRAFT.epic;
  assert.ok(canCraft(target));
  assert.ok(craft(target));
  assert.equal(ownedCount(target.id), 1);
  assert.equal(eco().fragments, 0);
  assert.ok(disenchant(target));
  assert.equal(ownedCount(target.id), 0);
  assert.equal(eco().fragments, SHATTER.epic);
});

test('match payout: first win bonus, full rate, then the daily taper', () => {
  _reset(29);
  const m = { won: true, finalHp: 20, spellsCast: 0, fulfills: 0, classCardsPlayed: 0, unitsSummoned: 0 };
  const first = applyMatch(m);
  assert.equal(first.talents >= WIN_TALENTS + FIRST_WIN_BONUS, true, 'first win pays the bonus');
  assert.ok(first.firstWin);
  for (let i = 2; i <= TAPER_AFTER_WINS; i++) {
    const p = applyMatch(m);
    assert.ok(p.talents >= WIN_TALENTS && !p.tapered, `win ${i} full rate`);
  }
  const tapered = applyMatch(m);
  assert.ok(tapered.tapered && tapered.talents <= TAPER_WIN_TALENTS + 60, 'win 11 tapers');
  const loss = applyMatch({ ...m, won: false });
  assert.ok(loss.talents >= LOSS_TALENTS, 'losses still pay a little');
});

test('Daily Bread: three quests, progress, completion pays, one reroll per day', () => {
  _reset(31);
  const quests = refreshQuests();
  assert.equal(quests.length, 3);
  const before = eco().talents;
  // complete a win-based quest by winning enough times
  applyMatch({ won: true, finalHp: 5, spellsCast: 10, fulfills: 2, classCardsPlayed: 15, unitsSummoned: 10 });
  applyMatch({ won: true, finalHp: 5, spellsCast: 10, fulfills: 2, classCardsPlayed: 15, unitsSummoned: 10 });
  assert.ok(eco().quests.some((q) => q.done), 'some quest completed');
  assert.ok(eco().talents > before, 'quest paid out');
  const open = eco().quests.find((q) => !q.done);
  if (open) {
    assert.ok(rerollQuest(open.id), 'first reroll works');
    const open2 = eco().quests.find((q) => !q.done);
    if (open2) assert.equal(rerollQuest(open2.id), false, 'second reroll denied');
  }
});
