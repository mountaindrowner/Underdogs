/** Decks: six preset starter decks (one per class, built deterministically
 *  from the card pool along a target curve) plus custom decks persisted in
 *  localStorage. Deck rules (CLAUDE.md §3): 30 cards, one class + neutral,
 *  max 2 copies, max 1 of each Legendary. */
import { defs, registry } from './data.ts';
import type { CardDef } from '../../engine/src/index.ts';

export interface DeckDef {
  id: string;
  name: string;
  class: string;
  leader: string;
  cards: string[];       // 30 def ids
  blurb: string;
  custom?: boolean;
}

export const CLASSES = ['prophet', 'warrior', 'priest', 'shepherd', 'patriarch', 'disciple'] as const;

export const CLASS_META: Record<string, { icon: string; color: string; leader: string; name: string; blurb: string }> = {
  prophet:   { icon: '📜', color: '#7a5fd0', leader: 'elijah_leader',   name: 'Fire and Vision',      blurb: 'Foresee the top, then burn what comes.' },
  warrior:   { icon: '🛡️',  color: '#c0392b', leader: 'joshua_leader',   name: 'The Giant-Slayers',    blurb: 'Relics, edges, and men too small to lose.' },
  priest:    { icon: '✨',  color: '#e8d9a0', leader: 'aaron_leader',    name: 'Balm and Bulwark',     blurb: 'Heal, shield, and raise what fell.' },
  shepherd:  { icon: '🐑', color: '#79b56a', leader: 'david_leader',    name: 'Not One Lost',         blurb: 'Small allies keep coming back.' },
  patriarch: { icon: '⭐',  color: '#d9a441', leader: 'abraham_leader',  name: 'The Promise Compounds', blurb: 'Covenants tick; the blessing snowballs.' },
  disciple:  { icon: '🔥', color: '#e07b39', leader: 'peter_leader',    name: 'Sparks to Wildfire',   blurb: 'Every loss scatters new embers.' },
};

/** all collectible, playable cards (no tokens / adversaries / leaders) */
export function collectiblePool(): CardDef[] {
  return defs.filter((c) => c.collectible !== false && c.type !== 'leader' && !c.boss
    && (c.rarity === 'common' || c.rarity === 'rare' || c.rarity === 'epic' || c.rarity === 'legendary'));
}

const byCostThenName = (a: CardDef, b: CardDef) =>
  (a.cost ?? 0) - (b.cost ?? 0) || a.name.localeCompare(b.name);

export function maxCopies(c: CardDef): number { return c.rarity === 'legendary' ? 1 : 2; }

/** Deterministic starter deck: fill a target curve from class cards first,
 *  then patch holes with neutrals. */
function buildPreset(cls: string): string[] {
  const pool = collectiblePool();
  const cards = (want: (c: CardDef) => boolean) => pool.filter(want).sort(byCostThenName);
  const classCards = cards((c) => c.class === cls);
  const neutrals = cards((c) => c.class === 'neutral');

  // target copies per cost bucket (cost 7+ folds into the last) — sums to 30
  const curve = [0, 4, 6, 6, 5, 4, 3, 2];
  const bucket = (c: CardDef) => Math.min(Math.max(c.cost ?? 0, 1), 7);

  const out: string[] = [];
  const used = new Map<string, number>();
  const take = (c: CardDef, n: number) => {
    const have = used.get(c.id) ?? 0;
    const add = Math.min(n, maxCopies(c) - have, 30 - out.length);
    for (let i = 0; i < add; i++) out.push(c.id);
    if (add > 0) used.set(c.id, have + add);
    return add;
  };

  for (const source of [classCards, neutrals]) {
    for (const c of source) {
      const b = bucket(c);
      if (curve[b] <= 0 || out.length >= 30) continue;
      curve[b] -= take(c, Math.min(2, curve[b]));
    }
  }
  // curve holes (e.g. no 7-drops in class+neutral): fill with whatever's legal
  for (const c of [...classCards, ...neutrals]) {
    if (out.length >= 30) break;
    take(c, 2);
  }
  return out;
}

export const PRESETS: DeckDef[] = CLASSES.map((cls) => {
  const m = CLASS_META[cls];
  return { id: `preset_${cls}`, name: m.name, class: cls, leader: m.leader, cards: buildPreset(cls), blurb: m.blurb };
});

// ---- custom decks (localStorage) -------------------------------------------
const KEY = 'underdogs.decks.custom';

export function customDecks(): DeckDef[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '[]') as DeckDef[];
    return raw.filter((d) => d && d.id && Array.isArray(d.cards))
      .map((d) => ({ ...d, custom: true, cards: d.cards.filter((id) => registry.has(id)) }));
  } catch { return []; }
}

export function saveCustomDeck(d: DeckDef): void {
  const rest = customDecks().filter((x) => x.id !== d.id);
  try { localStorage.setItem(KEY, JSON.stringify([...rest, { ...d, custom: true }])); } catch { /* ignore */ }
}

export function deleteCustomDeck(id: string): void {
  try { localStorage.setItem(KEY, JSON.stringify(customDecks().filter((x) => x.id !== id))); } catch { /* ignore */ }
}

export function allDecks(): DeckDef[] { return [...PRESETS, ...customDecks()]; }

export function deckById(id: string): DeckDef | undefined { return allDecks().find((d) => d.id === id); }

/** Legality per CLAUDE.md §3. Returns [] when the deck is tournament-ready. */
export function deckProblems(d: { class: string; cards: string[] }): string[] {
  const probs: string[] = [];
  if (d.cards.length !== 30) probs.push(`${d.cards.length}/30 cards`);
  const counts = new Map<string, number>();
  for (const id of d.cards) counts.set(id, (counts.get(id) ?? 0) + 1);
  for (const [id, n] of counts) {
    const c = registry.get(id);
    if (!c) { probs.push(`unknown card ${id}`); continue; }
    if (n > maxCopies(c)) probs.push(`${n}x ${c.name} (max ${maxCopies(c)})`);
    if (c.class !== d.class && c.class !== 'neutral') probs.push(`${c.name} is ${c.class}, not ${d.class}/neutral`);
    if (n > ownedCount(id)) probs.push(`${c.name}: own ${ownedCount(id)}, need ${n} — craft or replace`);
  }
  return probs;
}

// wire the economy's card universe (economy.ts stays Vite-free for tests)
import { initEconomyData, ownedCount } from './economy.ts';
initEconomyData({ pool: collectiblePool(), presets: PRESETS, maxCopies, byId: (id) => registry.get(id) });
