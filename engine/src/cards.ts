/**
 * Card DATA pipeline: load the /data JSON (cards.seed, tokens, adversaries,
 * leaders) into typed CardDef[] and a registry. Cards are the single source of
 * content; the engine reads this, never hardcoded card logic.
 */
import { readFileSync } from 'node:fs';
import type { CardDef } from './types.ts';

/** The data files use slightly different top-level keys; flatten them all. */
function flatten(json: unknown): CardDef[] {
  if (Array.isArray(json)) return json as CardDef[];
  const obj = json as Record<string, unknown>;
  for (const key of ['cards', 'tokens', 'adversaries', 'leaders']) {
    if (Array.isArray(obj[key])) return obj[key] as CardDef[];
  }
  return [];
}

export function loadCardData(files: string[]): CardDef[] {
  const defs: CardDef[] = [];
  for (const f of files) {
    const j = JSON.parse(readFileSync(f, 'utf8'));
    for (const c of flatten(j)) {
      if (c && typeof c.id === 'string' && !c.id.startsWith('_')) defs.push(c);
    }
  }
  return defs;
}

export function makeRegistry(defs: CardDef[]): Map<string, CardDef> {
  const m = new Map<string, CardDef>();
  for (const d of defs) m.set(d.id, d);
  return m;
}

/** Build a concrete deck (array of card copies) from a list of ids. */
export function buildDeck(reg: Map<string, CardDef>, ids: string[]): CardDef[] {
  return ids.map((id) => {
    const d = reg.get(id);
    if (!d) throw new Error(`buildDeck: unknown card id "${id}"`);
    return structuredClone(d);
  });
}
