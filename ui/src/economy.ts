/** The economy — Talents, Fragments, packs, crafting, Daily Bread (docs/21).
 *  Everything resolves on-device (no backend, per canon). DOM-free so node
 *  tests can drive it; localStorage access is guarded and injectable.
 *
 *  Design pillars (docs/21): packs are the dopamine, Fragments the certainty,
 *  Daily Bread the habit, duplicate protection the trust. Generosity target:
 *  a casual daily session earns ~a pack a day, free forever. */
import type { CardDef } from '../../engine/src/index.ts';

// ---- injected card universe (keeps this module Vite-free -> node-testable) --
export interface EconomyData {
  pool: CardDef[];                                    // all collectible cards
  presets: { class: string; cards: string[] }[];      // starter deck lists
  maxCopies: (c: CardDef) => number;
  byId: (id: string) => CardDef | undefined;
}
let D: EconomyData | null = null;
export function initEconomyData(d: EconomyData): void { D = d; }
const data = (): EconomyData => {
  if (!D) throw new Error('economy: initEconomyData() not called');
  return D;
};

// ---- numbers (docs/21 §8 — all tunable) ------------------------------------
export const PACK_COST = 100;
export const PACK_SIZE = 5;
export const FIRST_WIN_BONUS = 50;
export const WIN_TALENTS = 10;
export const LOSS_TALENTS = 2;
export const TAPER_AFTER_WINS = 10;   // full pay for the first N wins/day…
export const TAPER_WIN_TALENTS = 2;   // …then a trickle (soft daily taper)
export const PITY_FIRST = 10;         // first Legendary guaranteed by pack 10 (CLAUDE §10)
export const PITY_AFTER = 20;         // then guaranteed within every 20 (docs/21)
export const FIRST_FRUITS_PACKS = 3;  // early packs draw from your starter class + neutrals
export const STARTING_TALENTS = 200;  // two packs in hand on day one — learn the ritual fast
export const CRAFT: Record<string, number> = { common: 40, rare: 100, epic: 400, legendary: 1600 };
export const SHATTER: Record<string, number> = { common: 10, rare: 25, epic: 100, legendary: 400 };
const RARITY_ODDS: [string, number][] = [['common', 70], ['rare', 22], ['epic', 6], ['legendary', 2]];

// ---- state -----------------------------------------------------------------
export interface Quest {
  id: string; desc: string; target: number; progress: number; reward: number; frags: number; done: boolean;
}
export interface EconomyState {
  talents: number;
  fragments: number;
  owned: Record<string, number>;       // card id -> copies (0..maxCopies)
  packsOpened: number;
  sinceLegendary: number;              // pity counter
  seed: number;                        // pack RNG (persisted LCG — random to the player, testable)
  starterClass: string | null;
  gifts: string[];                     // one-time grants already claimed
  fwotdDate: string | null;            // last First-Win-of-the-Day date
  winsToday: number; winsDate: string;
  quests: Quest[]; questsDate: string; rerollUsed: string | null;
  newIds: string[];                    // cards to ribbon as "New!" in the collection
}

const KEY = 'underdogs.economy.v1';

const blank = (seed: number): EconomyState => ({
  talents: 0, fragments: 0, owned: {}, packsOpened: 0, sinceLegendary: 0, seed,
  starterClass: null, gifts: [], fwotdDate: null, winsToday: 0, winsDate: '',
  quests: [], questsDate: '', rerollUsed: null, newIds: [],
});

function load(): EconomyState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...blank(1), ...JSON.parse(raw) };
  } catch { /* ignore */ }
  // first run: seed from the clock ONCE, then the LCG owns randomness
  return blank((typeof Date !== 'undefined' ? Date.now() : 12345) % 2147483647 || 1);
}
function save(s: EconomyState): void {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* ignore */ }
}

let state: EconomyState | null = null;
export function eco(): EconomyState { return (state ??= load()); }
/** tests: inject a fresh state with a known seed */
export function _reset(seed = 42): EconomyState { state = blank(seed); return state; }
function commit(): void { if (state) save(state); }

// ---- rng (LCG, persisted) --------------------------------------------------
function rnd(s: EconomyState): number {
  s.seed = (s.seed * 48271) % 2147483647;
  return s.seed / 2147483647;
}

// ---- day handling (injectable for tests) ------------------------------------
let _today: (() => string) | null = null;
export function _setToday(fn: (() => string) | null): void { _today = fn; }
function today(): string {
  if (_today) return _today();
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ---- ownership -------------------------------------------------------------
export function ownedCount(id: string): number { return eco().owned[id] ?? 0; }
export function ownsStarter(): boolean { return eco().starterClass != null; }

/** grant the chosen starter war-band (2 copies of each card, 1 of legendaries) */
export function chooseStarter(cls: string): void {
  const s = eco();
  if (s.starterClass) return;
  s.starterClass = cls;
  const preset = data().presets.find((p) => p.class === cls);
  for (const id of preset?.cards ?? []) {
    const c = data().byId(id); if (!c) continue;
    s.owned[id] = Math.min(data().maxCopies(c), (s.owned[id] ?? 0) + 1);
  }
  s.talents += STARTING_TALENTS;
  commit();
}

/** one-time grants (second deck after chapter 1, etc.) */
export function claimGift(kind: string, cls?: string): boolean {
  const s = eco();
  if (s.gifts.includes(kind)) return false;
  s.gifts.push(kind);
  if (kind === 'second_deck' && cls) {
    const preset = data().presets.find((p) => p.class === cls);
    for (const id of preset?.cards ?? []) {
      const c = data().byId(id); if (!c) continue;
      s.owned[id] = Math.min(data().maxCopies(c), (s.owned[id] ?? 0) + 1);
      if (!s.newIds.includes(id)) s.newIds.push(id);
    }
  }
  commit(); return true;
}

// ---- packs -----------------------------------------------------------------
export interface PackCard { card: CardDef; isNew: boolean; dupe: boolean; frags: number }

function rollRarity(s: EconomyState): string {
  const r = rnd(s) * 100;
  let acc = 0;
  for (const [rar, w] of RARITY_ODDS) { acc += w; if (r < acc) return rar; }
  return 'common';
}

function candidates(s: EconomyState, rarity: string, firstFruits: boolean): CardDef[] {
  let pool = data().pool.filter((c) => (c.rarity ?? 'common') === rarity);
  if (firstFruits && s.starterClass) {
    const focus = pool.filter((c) => c.class === s.starterClass || c.class === 'neutral');
    if (focus.length) pool = focus;
  }
  // duplicate protection: prefer cards you own none of, then not-maxed
  const fresh = pool.filter((c) => (s.owned[c.id] ?? 0) === 0);
  if (fresh.length) return fresh;
  const unmaxed = pool.filter((c) => (s.owned[c.id] ?? 0) < data().maxCopies(c));
  return unmaxed.length ? unmaxed : pool;    // fully complete rarity -> dupes (shatter)
}

/** open one pack; returns the 5 cards (with new/dupe flags) or null if broke */
export function openPack(): PackCard[] | null {
  const s = eco();
  if (s.talents < PACK_COST) return null;
  s.talents -= PACK_COST;
  s.packsOpened += 1;
  const firstFruits = s.packsOpened <= FIRST_FRUITS_PACKS;

  const rarities: string[] = [];
  for (let i = 0; i < PACK_SIZE; i++) rarities.push(rollRarity(s));
  // guarantee ≥1 Rare-or-better
  if (!rarities.some((r) => r !== 'common')) rarities[PACK_SIZE - 1] = 'rare';
  // pity: first Legendary by PITY_FIRST, then within every PITY_AFTER
  const pityAt = s.packsOpened <= PITY_FIRST ? PITY_FIRST : PITY_AFTER;
  if (!rarities.includes('legendary') && s.sinceLegendary + 1 >= pityAt) rarities[PACK_SIZE - 1] = 'legendary';
  if (rarities.includes('legendary')) s.sinceLegendary = 0; else s.sinceLegendary += 1;

  const out: PackCard[] = [];
  for (const rar of rarities) {
    const pool = candidates(s, rar, firstFruits);
    const card = pool[Math.floor(rnd(s) * pool.length)];
    const have = s.owned[card.id] ?? 0;
    if (have >= data().maxCopies(card)) {
      out.push({ card, isNew: false, dupe: true, frags: SHATTER[rar] ?? 10 });
      s.fragments += SHATTER[rar] ?? 10;
    } else {
      s.owned[card.id] = have + 1;
      const isNew = have === 0;
      if (isNew && !s.newIds.includes(card.id)) s.newIds.push(card.id);
      out.push({ card, isNew, dupe: false, frags: 0 });
    }
  }
  commit();
  return out;
}

// ---- crafting --------------------------------------------------------------
export function craftCost(c: CardDef): number { return CRAFT[c.rarity ?? 'common'] ?? 40; }
export function shatterValue(c: CardDef): number { return SHATTER[c.rarity ?? 'common'] ?? 10; }
export function canCraft(c: CardDef): boolean {
  return eco().fragments >= craftCost(c) && ownedCount(c.id) < data().maxCopies(c);
}
export function craft(c: CardDef): boolean {
  const s = eco();
  if (!canCraft(c)) return false;
  s.fragments -= craftCost(c);
  s.owned[c.id] = (s.owned[c.id] ?? 0) + 1;
  if (!s.newIds.includes(c.id)) s.newIds.push(c.id);
  commit(); return true;
}
export function disenchant(c: CardDef): boolean {
  const s = eco();
  if ((s.owned[c.id] ?? 0) <= 0) return false;
  s.owned[c.id] -= 1;
  s.fragments += shatterValue(c);
  commit(); return true;
}

// ---- Daily Bread (quests) ---------------------------------------------------
interface QuestDef { id: string; desc: string; target: number; reward: number; frags: number }
const QUEST_POOL: QuestDef[] = [
  { id: 'win2', desc: 'Win 2 matches', target: 2, reward: 60, frags: 10 },
  { id: 'win1', desc: 'Win a match', target: 1, reward: 40, frags: 5 },
  { id: 'spells6', desc: 'Cast 6 spells', target: 6, reward: 50, frags: 10 },
  { id: 'fulfill1', desc: 'Fulfill a Legendary', target: 1, reward: 50, frags: 15 },
  { id: 'underdog', desc: 'Win with 10 HP or less (the underdog way)', target: 1, reward: 60, frags: 15 },
  { id: 'play12', desc: 'Play 12 cards of your class', target: 12, reward: 50, frags: 10 },
  { id: 'summon8', desc: 'Summon 8 units', target: 8, reward: 40, frags: 5 },
];

/** refresh (2 fresh quests per day; unfinished ones roll over, max 3 banked) */
export function refreshQuests(): Quest[] {
  const s = eco();
  const t = today();
  if (s.questsDate !== t) {
    s.questsDate = t;
    s.rerollUsed = null;
    const keep = s.quests.filter((q) => !q.done).slice(-2);      // forgive absence: bank up to 2
    const have = new Set(keep.map((q) => q.id));
    const fresh: Quest[] = [];
    let guard = 0;
    while (keep.length + fresh.length < 3 && guard++ < 40) {
      const d = QUEST_POOL[Math.floor(rnd(s) * QUEST_POOL.length)];
      if (have.has(d.id) || fresh.some((q) => q.id === d.id)) continue;
      fresh.push({ ...d, progress: 0, done: false });
    }
    s.quests = [...keep, ...fresh];
    commit();
  }
  return s.quests;
}

export function rerollQuest(id: string): boolean {
  const s = eco();
  const t = today();
  if (s.rerollUsed === t) return false;
  const i = s.quests.findIndex((q) => q.id === id && !q.done);
  if (i < 0) return false;
  const have = new Set(s.quests.map((q) => q.id));
  let guard = 0;
  while (guard++ < 40) {
    const d = QUEST_POOL[Math.floor(rnd(s) * QUEST_POOL.length)];
    if (have.has(d.id)) continue;
    s.quests[i] = { ...d, progress: 0, done: false };
    s.rerollUsed = t;
    commit(); return true;
  }
  return false;
}

// ---- match rewards ----------------------------------------------------------
export interface MatchSummary {
  won: boolean;
  finalHp: number;                // your hero's HP at the end
  spellsCast: number;             // spells YOU played
  fulfills: number;               // your Fulfill transforms
  classCardsPlayed: number;       // cards of your deck's class you played
  unitsSummoned: number;          // your units that hit the board
}
export interface MatchPayout {
  talents: number; fragments: number;
  firstWin: boolean; tapered: boolean;
  questsDone: Quest[];
}

export function applyMatch(m: MatchSummary): MatchPayout {
  const s = eco();
  refreshQuests();
  const t = today();
  if (s.winsDate !== t) { s.winsDate = t; s.winsToday = 0; }

  let talents = 0; let fragments = 0; let firstWin = false; let tapered = false;
  if (m.won) {
    s.winsToday += 1;
    tapered = s.winsToday > TAPER_AFTER_WINS;
    talents += tapered ? TAPER_WIN_TALENTS : WIN_TALENTS;
    if (s.fwotdDate !== t) { s.fwotdDate = t; talents += FIRST_WIN_BONUS; firstWin = true; }
  } else {
    talents += LOSS_TALENTS;
  }

  const questsDone: Quest[] = [];
  for (const q of s.quests) {
    if (q.done) continue;
    let add = 0;
    if (q.id === 'win1' || q.id === 'win2') add = m.won ? 1 : 0;
    else if (q.id === 'spells6') add = m.spellsCast;
    else if (q.id === 'fulfill1') add = m.fulfills;
    else if (q.id === 'underdog') add = m.won && m.finalHp <= 10 ? 1 : 0;
    else if (q.id === 'play12') add = m.classCardsPlayed;
    else if (q.id === 'summon8') add = m.unitsSummoned;
    if (add > 0) {
      q.progress = Math.min(q.target, q.progress + add);
      if (q.progress >= q.target) {
        q.done = true; talents += q.reward; fragments += q.frags;
        questsDone.push(q);
      }
    }
  }

  s.talents += talents; s.fragments += fragments;
  commit();
  return { talents, fragments, firstWin, tapered, questsDone };
}

/** first win of the day still unclaimed? (for the Storehouse chip) */
export function fwotdAvailable(): boolean { return eco().fwotdDate !== today(); }

// ---- collection helpers -----------------------------------------------------
export function collectionStats(): { owned: number; total: number } {
  const pool = data().pool;
  const s = eco();
  return { owned: pool.filter((c) => (s.owned[c.id] ?? 0) > 0).length, total: pool.length };
}
export function clearNew(id?: string): void {
  const s = eco();
  s.newIds = id ? s.newIds.filter((x) => x !== id) : [];
  commit();
}

// ---- dev kit (the Pack Lab, ?pack=1) ----------------------------------------
/** Simulated pack for the ritual tester — NEVER touches the save. Ownership
 *  flags (isNew/dupe) are computed against the real collection but nothing is
 *  granted, spent, or persisted. `finish` forces the last card's rarity so the
 *  reveal escalation can be exercised on demand. */
export type SimFinish = 'random' | 'rare' | 'epic' | 'legendary' | 'commons' | 'dupes';
let simSeed = 20260719;
const simRnd = () => { simSeed = (simSeed * 48271) % 2147483647; return simSeed / 2147483647; };
export function simulatePack(finish: SimFinish = 'random'): PackCard[] {
  const rollR = (): string => {
    const r = simRnd() * 100; let acc = 0;
    for (const [rar, w] of RARITY_ODDS) { acc += w; if (r < acc) return rar; }
    return 'common';
  };
  let rarities: string[] = [];
  for (let i = 0; i < PACK_SIZE; i++) rarities.push(rollR());
  if (finish === 'commons') rarities = rarities.map(() => 'common');
  else {
    if (!rarities.some((r) => r !== 'common')) rarities[PACK_SIZE - 1] = 'rare';
    if (finish === 'rare' || finish === 'epic' || finish === 'legendary') {
      rarities = rarities.map((r) => (r === 'legendary' || r === 'epic' ? 'common' : r));
      rarities[PACK_SIZE - 1] = finish;
    }
  }
  const s = eco();
  return rarities.map((rar) => {
    const pool = data().pool.filter((c) => (c.rarity ?? 'common') === rar);
    const card = (pool.length ? pool : data().pool)[Math.floor(simRnd() * Math.max(1, pool.length || data().pool.length))];
    const have = s.owned[card.id] ?? 0;
    const dupe = finish === 'dupes' || have >= data().maxCopies(card);
    return { card, isNew: !dupe && have === 0, dupe, frags: dupe ? (SHATTER[rar] ?? 10) : 0 };
  });
}

/** Dev-only faucet for the Pack Lab (+ testing the real Storehouse). */
export function devGrant(talents = 1000, fragments = 0): void {
  const s = eco();
  s.talents += talents; s.fragments += fragments;
  commit();
}
