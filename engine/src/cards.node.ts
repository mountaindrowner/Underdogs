/** Node-only card loader (uses node:fs). The browser UI imports JSON directly
 *  and uses collectDefs() from cards.ts instead. */
import { readFileSync } from 'node:fs';
import type { CardDef } from './types.ts';
import { flattenCards } from './cards.ts';

export function loadCardData(files: string[]): CardDef[] {
  const defs: CardDef[] = [];
  for (const f of files) {
    const j = JSON.parse(readFileSync(f, 'utf8'));
    for (const c of flattenCards(j)) {
      if (c && typeof c.id === 'string' && !c.id.startsWith('_')) defs.push(c);
    }
  }
  return defs;
}
