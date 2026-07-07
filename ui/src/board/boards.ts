/** Per-board palette / gradient / tints and mote-field settings, plus the
 *  chapter -> board mapping. Values are taken verbatim from docs/12 §4-7. */
export type BoardId = 'elah' | 'eden' | 'redsea' | 'babylon';

export interface MoteCfg {
  n: number; color: string; szMin: number; szMax: number; peak: number;
  durMin: number; durMax: number; ry: number; rx: number;
  fieldX: [number, number]; fieldY: [number, number]; // % of stage
}

export interface BoardTheme {
  id: BoardId; name: string; era: string;
  backdrop: string; dangerTint: string; flareTint: string;
  motes: MoteCfg;
}

export const BOARDS: Record<BoardId, BoardTheme> = {
  elah: {
    id: 'elah', name: 'The Valley of Elah', era: 'Kingdom',
    backdrop: 'linear-gradient(180deg,#d8c49a 0%,#c9b48a 42%,#b89a6a 70%,#a88a5c 100%)',
    dangerTint: '#3a3020', flareTint: '#f0c479',
    motes: { n: 36, color: '#e8d8b0', szMin: 2, szMax: 3, peak: .35, durMin: 10, durMax: 16, ry: -160, rx: 20, fieldX: [6, 94], fieldY: [42, 70] },
  },
  eden: {
    id: 'eden', name: 'East of Eden', era: 'Genesis',
    backdrop: 'linear-gradient(180deg,#f4d9a0 0%,#d8e0a8 45%,#9ab86a 72%,#7a9a52 100%)',
    dangerTint: '#5a4a2a', flareTint: '#fff0c0',
    motes: { n: 40, color: '#fdf0a0', szMin: 2, szMax: 4, peak: .55, durMin: 8, durMax: 14, ry: -120, rx: 24, fieldX: [4, 70], fieldY: [24, 66] },
  },
  redsea: {
    id: 'redsea', name: 'The Red Sea Crossing', era: 'Exodus',
    backdrop: 'linear-gradient(180deg,#2a3a5a 0%,#3a5578 40%,#5a7a90 60%,#d8b878 100%)',
    dangerTint: '#0e2436', flareTint: '#bfe4e4',
    motes: { n: 30, color: '#f0e8c8', szMin: 3, szMax: 3, peak: .4, durMin: 12, durMax: 18, ry: 140, rx: 16, fieldX: [24, 76], fieldY: [10, 40] },
  },
  babylon: {
    id: 'babylon', name: 'By the Rivers of Babylon', era: 'Exile',
    backdrop: 'linear-gradient(180deg,#2a2440 0%,#3a2f50 45%,#4a3a5a 72%,#5a4550 100%)',
    dangerTint: '#0c0a18', flareTint: '#f0c479',
    motes: { n: 44, color: '#f0a63c', szMin: 2, szMax: 3, peak: .5, durMin: 9, durMax: 15, ry: -150, rx: 20, fieldX: [6, 60], fieldY: [30, 72] },
  },
};

/** Map an encounter id (or a board id, for the ?scene= override) to its board
 *  scene. Free-play / unknown -> Elah. */
export function boardForEncounter(id?: string): BoardId {
  switch (id) {
    case 'egypt': case 'redsea': return 'redsea';
    case 'serpent': case 'eden': return 'eden';
    case 'exile': case 'babylon': return 'babylon';
    case 'elah': default: return 'elah';
  }
}
