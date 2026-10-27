/** Card data + art, browser-side. Imports the /data JSON directly (Vite) and
 *  registers token/transform defs with the engine so summon/fulfill resolve. */
import cardsSeed from '../../data/cards.seed.json';
import cardsSet2 from '../../data/cards.set2.json';
import cardsNeutral from '../../data/cards.neutral-expansion.json';
import tokens from '../../data/tokens.json';
import adversaries from '../../data/adversaries.json';
import leaders from '../../data/leaders.json';
import { collectDefs, makeRegistry, registerDefs, type CardDef } from '../../engine/src/index.ts';

export const defs: CardDef[] = collectDefs(cardsSeed, cardsSet2, cardsNeutral, tokens, adversaries, leaders);
registerDefs(defs);
export const registry = makeRegistry(defs);

// ---- art: map defId -> illustration url (raw art, not the framed card) ------
const artGlobs = {
  ...import.meta.glob('../assets/cards/*.webp', { eager: true, query: '?url', import: 'default' }),
  ...import.meta.glob('../assets/tokens/*.webp', { eager: true, query: '?url', import: 'default' }),
  ...import.meta.glob('../assets/adversaries/*.webp', { eager: true, query: '?url', import: 'default' }),
  ...import.meta.glob('../assets/leaders/*.webp', { eager: true, query: '?url', import: 'default' }),
} as Record<string, string>;

const artByFile = new Map<string, string>();
for (const [path, url] of Object.entries(artGlobs)) {
  const base = path.split('/').pop()!.replace('.webp', '');
  artByFile.set(base, url);
}

import cardBack from '../assets/backs/underdogs-card-back.webp';
export const CARD_BACK = cardBack as string;

export function artUrl(defId: string): string | undefined {
  return artByFile.get(defId);
}

// ---- art placement: put each painting's focal point (usually a face) in view.
// Paintings are landscape but most windows are portrait, so only a slice shows.
// artFocus.json (tools/cardart/art_focus.py, hand-checked) records where the
// main face sits; codex.css (.art-win::before) does the maths against the
// window's REAL size via container units, so the painting always covers the
// window, never tiles, and the face lands at --ty from the top.
import FOCUS from './artFocus.json';
import type { CSSProperties } from 'react';
type Surface = 'hand' | 'minion' | 'reader' | 'ritual' | 'chapter' | 'intro' | 'portrait';
/** where the face should land vertically (0 top..1 bottom) and extra zoom */
const SURF: Record<Surface, { ty: number; zoom: number }> = {
  hand:     { ty: 0.30, zoom: 1.0 },    // hand, album, mulligan, choice, drag ghost (name plate low)
  minion:   { ty: 0.30, zoom: 1.0 },    // name band covers the bottom
  reader:   { ty: 0.36, zoom: 1.0 },
  ritual:   { ty: 0.30, zoom: 1.0 },
  chapter:  { ty: 0.32, zoom: 1.0 },
  intro:    { ty: 0.40, zoom: 1.0 },
  portrait: { ty: 0.45, zoom: 1.6 },    // small circle: lean in on the face
};
const DEFAULT_FOCUS: [number, number, number] = [0.5, 0.35, 768 / 560];

/** style for an art window: the element must also carry className "art-win" */
export function artStyle(defId: string | undefined, surface: Surface): CSSProperties | undefined {
  const url = defId ? artUrl(defId) : undefined;
  if (!url) return undefined;
  const f = (FOCUS as unknown as Record<string, [number, number, number]>)[defId!];
  const [fx, fy, ai] = Array.isArray(f) ? f : DEFAULT_FOCUS;
  const { ty, zoom } = SURF[surface];
  return {
    '--art': `url(${url})`, '--fx': fx, '--fy': fy, '--ai': ai, '--ty': ty, '--z': zoom,
  } as CSSProperties;
}
