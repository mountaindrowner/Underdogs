/** Campaign encounters -> match configs. Decks are padded/cycled to 30 and
 *  unknown card ids are dropped so content edits can't crash a battle. */
import campaignData from '../../data/campaign.json';
import { registry } from './data.ts';

export interface Encounter {
  id: string; title: string; subtitle: string; art: string;
  narrative: string; tip: string;
  playerLeader?: string | null; enemyLeader?: string | null;
  playerHp?: number; enemyHp?: number;
  enemyBoard?: string[]; playerDeck: string[]; enemyDeck: string[];
}

export interface MatchConfig {
  key: string;
  playerDeck: string[]; enemyDeck: string[];
  playerLeader?: string; enemyLeader?: string;
  startUnits?: [string[], string[]];
  heroHp?: [number, number];
}

export const encounters: Encounter[] =
  (campaignData.encounters as Encounter[]).filter((e) => e && e.id && !e.id.startsWith('_'));

function padDeck(ids: string[], n = 30): string[] {
  const valid = ids.filter((id) => registry.has(id));
  if (!valid.length) return ['watchman'].filter((id) => registry.has(id));
  const out: string[] = [];
  for (let i = 0; i < n; i++) out.push(valid[i % valid.length]);
  return out;
}

export function toMatchConfig(e: Encounter): MatchConfig {
  return {
    key: e.id,
    playerDeck: padDeck(e.playerDeck),
    enemyDeck: padDeck(e.enemyDeck),
    playerLeader: e.playerLeader ?? undefined,
    enemyLeader: e.enemyLeader ?? undefined,
    startUnits: [[], e.enemyBoard ?? []],
    heroHp: [e.playerHp ?? 30, e.enemyHp ?? 30],
  };
}

// quick sandbox (mirror match) for the "Free Play" menu entry
export const SANDBOX: MatchConfig = {
  key: 'sandbox',
  playerDeck: padDeck(['shepherd_boy', 'watchman', 'firstborn_heir', 'eager_convert', 'benaiah',
    'ruth', 'stephen', 'isaiah', 'shepherd_david', 'faithful_sheepdog', 'gather_the_flock', 'sarah', 'fire_from_heaven']),
  enemyDeck: padDeck(['shepherd_boy', 'watchman', 'firstborn_heir', 'eager_convert', 'benaiah',
    'ruth', 'stephen', 'isaiah', 'shepherd_david', 'faithful_sheepdog', 'gather_the_flock', 'sarah', 'fire_from_heaven']),
  playerLeader: 'david_leader', enemyLeader: 'elijah_leader',
  heroHp: [30, 30],
};

// ---- progress (localStorage) ----
const KEY = 'underdogs.campaign.done';
export function completed(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(KEY) || '[]')); } catch { return new Set(); }
}
export function markComplete(id: string): void {
  const s = completed(); s.add(id);
  try { localStorage.setItem(KEY, JSON.stringify([...s])); } catch { /* ignore */ }
}
