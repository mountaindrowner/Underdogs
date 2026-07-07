/** Keyword glossary for the card preview (UI ref §4). Sourced from
 *  /data/keywords.json so the in-game text is the single source of truth. */
import kw from '../../data/keywords.json';

const flat: Record<string, string> = {
  ...(kw.core as Record<string, string>),
  ...(kw.classSignatures as Record<string, string>),
};

export const KW_LABEL: Record<string, string> = {
  guard: 'Guard', swift: 'Swift', endure: 'Endure', giant_slayer: 'Giant-Slayer',
  redeem: 'Redeem', scatter: 'Scatter', covenant: 'Covenant', raise: 'Raise',
  foresee: 'Foresee', discover: 'Discover', arrival: 'Arrival', legacy: 'Legacy',
  fulfill: 'Fulfill',
};

/** Description for a keyword id, or undefined if we have none. */
export function kwDesc(id: string): string | undefined {
  return flat[id];
}

/** The glossary terms relevant to a card: its keywords, plus any inline
 *  mechanics named in its rules text (Arrival:, Legacy:, Fulfill:, …). */
export function glossaryFor(card: { keywords?: string[]; text?: string; fulfill?: unknown }): Array<{ label: string; desc: string }> {
  const ids = new Set<string>(card.keywords ?? []);
  const text = (card.text ?? '').toLowerCase();
  for (const term of ['arrival', 'legacy', 'foresee', 'discover', 'redeem', 'scatter', 'covenant', 'raise', 'endure', 'guard', 'swift']) {
    if (text.includes(term)) ids.add(term);
  }
  if (card.fulfill || text.includes('fulfill')) ids.add('fulfill');
  const out: Array<{ label: string; desc: string }> = [];
  for (const id of ids) {
    const desc = kwDesc(id);
    if (desc) out.push({ label: KW_LABEL[id] ?? id, desc });
  }
  return out;
}
