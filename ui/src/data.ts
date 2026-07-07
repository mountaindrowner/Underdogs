/** Card data + art, browser-side. Imports the /data JSON directly (Vite) and
 *  registers token/transform defs with the engine so summon/fulfill resolve. */
import cardsSeed from '../../data/cards.seed.json';
import tokens from '../../data/tokens.json';
import adversaries from '../../data/adversaries.json';
import leaders from '../../data/leaders.json';
import { collectDefs, makeRegistry, registerDefs, type CardDef } from '../../engine/src/index.ts';

export const defs: CardDef[] = collectDefs(cardsSeed, tokens, adversaries, leaders);
registerDefs(defs);
export const registry = makeRegistry(defs);

// ---- art: map defId -> illustration url (raw art, not the framed card) ------
const artGlobs = {
  ...import.meta.glob('../assets/cards/*.png', { eager: true, query: '?url', import: 'default' }),
  ...import.meta.glob('../assets/tokens/*.png', { eager: true, query: '?url', import: 'default' }),
  ...import.meta.glob('../assets/adversaries/*.png', { eager: true, query: '?url', import: 'default' }),
  ...import.meta.glob('../assets/leaders/*.png', { eager: true, query: '?url', import: 'default' }),
} as Record<string, string>;

const artByFile = new Map<string, string>();
for (const [path, url] of Object.entries(artGlobs)) {
  const base = path.split('/').pop()!.replace('.png', '');
  artByFile.set(base, url);
}

import cardBack from '../assets/backs/underdogs-card-back.png';
export const CARD_BACK = cardBack as string;

export function artUrl(defId: string): string | undefined {
  return artByFile.get(defId);
}
