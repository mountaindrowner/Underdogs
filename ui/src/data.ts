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
// Paintings are landscape but most windows are portrait, so only a slice shows;
// artFocus.json (tools/cardart/art_focus.py) records where the face sits.
import FOCUS from './artFocus.json';
import type { CSSProperties } from 'react';
type Surface = 'hand' | 'minion' | 'reader' | 'ritual' | 'chapter' | 'intro' | 'portrait';
/** window aspect (w/h), where the focal point should land vertically, extra zoom */
const SURF: Record<Surface, { ac: number; ty: number; zoom: number }> = {
  hand:     { ac: 0.717, ty: 0.38, zoom: 1.04 },   // hand, album, mulligan, choice, drag ghost
  minion:   { ac: 0.75,  ty: 0.38, zoom: 1.04 },   // name band covers the bottom
  reader:   { ac: 1.347, ty: 0.42, zoom: 1.04 },
  ritual:   { ac: 0.711, ty: 0.38, zoom: 1.04 },
  chapter:  { ac: 0.75,  ty: 0.40, zoom: 1.04 },
  intro:    { ac: 3.1,   ty: 0.42, zoom: 1.0 },
  portrait: { ac: 1,     ty: 0.46, zoom: 1.45 },   // small circle: lean in on the face
};
const DEFAULT_FOCUS: [number, number, number] = [0.5, 0.42, 768 / 560];

/** inline background style: image + size + position for one surface */
export function artStyle(defId: string | undefined, surface: Surface): CSSProperties | undefined {
  const url = defId ? artUrl(defId) : undefined;
  if (!url) return undefined;
  const [fx, fy, ai] = (FOCUS as Record<string, [number, number, number]>)[defId!] ?? DEFAULT_FOCUS;
  const { ac, ty, zoom } = SURF[surface];
  const rx = zoom * Math.max(1, ai / ac);           // image width / window width
  const ry = zoom * Math.max(1, ac / ai);           // image height / window height
  // background-position p puts image point f at window point t when p = (t - f·r) / (1 - r)
  const pos = (t: number, f: number, r: number) =>
    r <= 1.0001 ? 50 : Math.min(100, Math.max(0, ((t - f * r) / (1 - r)) * 100));
  return {
    backgroundImage: `url(${url})`,
    backgroundSize: `${(rx * 100).toFixed(1)}% ${(ry * 100).toFixed(1)}%`,
    backgroundPosition: `${pos(0.5, fx, rx).toFixed(1)}% ${pos(ty, fy, ry).toFixed(1)}%`,
  };
}
