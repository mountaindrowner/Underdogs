/** Free Play setup — The Sparring Pit. Pick a war-band (preset or custom
 *  deck) and how hard the rival fights, then begin. The rival draws a random
 *  preset deck each match so skirmishes stay fresh. */
import { useMemo, useState } from 'react';
import { ShellBg, type SceneId } from './title/scenes.tsx';
import { MusicToggle } from './MusicToggle.tsx';
import { allDecks, PRESETS, CLASS_META, type DeckDef } from './decks.ts';
import { registry } from './data.ts';
import type { MatchConfig } from './campaign.ts';

const SEL_KEY = 'underdogs.freeplay.sel';

export const DIFFICULTIES = [
  { lvl: 0 as const, name: 'Novice', sub: 'The rival pulls his punches.' },
  { lvl: 1 as const, name: 'Faithful', sub: 'A fair fight, most days.' },
  { lvl: 2 as const, name: 'Valiant', sub: 'He read the same scrolls you did.' },
];

function loadSel(): { deckId: string; diff: 0 | 1 | 2 } {
  try {
    const s = JSON.parse(localStorage.getItem(SEL_KEY) || '{}');
    return { deckId: typeof s.deckId === 'string' ? s.deckId : PRESETS[0].id, diff: [0, 1, 2].includes(s.diff) ? s.diff : 1 };
  } catch { return { deckId: PRESETS[0].id, diff: 1 }; }
}

export function freePlayConfig(deck: DeckDef, diff: 0 | 1 | 2): MatchConfig {
  const rival = PRESETS[(Math.random() * PRESETS.length) | 0];
  return {
    key: `freeplay-${Date.now()}`,
    playerDeck: deck.cards, playerLeader: deck.leader,
    enemyDeck: rival.cards, enemyLeader: rival.leader,
    heroHp: [30, 30],
    difficulty: diff,
  };
}

export function FreePlaySetup({ scene, onBegin, onBack }:
  { scene: SceneId; onBegin: (cfg: MatchConfig) => void; onBack: () => void }) {
  const decks = useMemo(allDecks, []);
  const init = useMemo(loadSel, []);
  const [deckId, setDeckId] = useState(decks.some((d) => d.id === init.deckId) ? init.deckId : decks[0].id);
  const [diff, setDiff] = useState<0 | 1 | 2>(init.diff);
  const deck = decks.find((d) => d.id === deckId) ?? decks[0];

  const begin = () => {
    try { localStorage.setItem(SEL_KEY, JSON.stringify({ deckId, diff })); } catch { /* ignore */ }
    onBegin(freePlayConfig(deck, diff));
  };

  return (
    <div className="app storyMenu fpSetup">
      <ShellBg scene={scene} />
      <div className="storyWrap">
        <div className="topbar">
          <button className="backBtn" onClick={onBack}>‹ Menu</button>
          <div className="brand">UNDERDOGS <span>· the sparring pit</span></div>
          <MusicToggle />
        </div>
        <div className="fpBody">
          <h1 className="menuTitle">The Sparring Pit</h1>

          <div className="fpLabel">Choose your war-band</div>
          <div className="deckShelf">
            {decks.map((d) => {
              const m = CLASS_META[d.class];
              const leader = registry.get(d.leader);
              return (
                <button key={d.id} className={`deckTile${d.id === deckId ? ' sel' : ''}`}
                  style={{ ['--gem' as string]: m?.color ?? '#888' } as React.CSSProperties}
                  onClick={() => setDeckId(d.id)}>
                  <span className="dtIcon">{m?.icon ?? '❖'}</span>
                  <span className="dtName">{d.name}</span>
                  <span className="dtSub">{leader?.name ?? d.class}{d.custom ? ' · forged' : ''}</span>
                </button>
              );
            })}
          </div>
          <div className="fpBlurb">{deck.blurb}</div>

          <div className="fpLabel">The rival</div>
          <div className="diffRow">
            {DIFFICULTIES.map((d) => (
              <button key={d.lvl} className={`diffTile${d.lvl === diff ? ' sel' : ''}`} onClick={() => setDiff(d.lvl)}>
                <span className="dfName">{d.name}</span>
                <span className="dfSub">{d.sub}</span>
              </button>
            ))}
          </div>
          <div className="fpNote">Your rival draws a different war-band each match.</div>

          <button className="bigbtn fpGo" onClick={begin}>Enter the Pit</button>
        </div>
      </div>
    </div>
  );
}
