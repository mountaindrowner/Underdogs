/** The main menu — an ornate tooled-leather panel resting on the robe (docs/13
 *  §6). Story -> the chapter map; Free Play -> a sandbox skirmish; the rest are
 *  tasteful SOON stubs until those screens are built. */
import { useState } from 'react';
import { ShellBg, type SceneId } from './scenes.tsx';
import { MusicToggle } from '../MusicToggle.tsx';
import './menu.css';

const RIBBON = ['#9a3428', '#c39a48', '#6d773a', '#3f6b5c', '#33447a', '#5f4468', '#b5623a'];

type Act = 'story' | 'freeplay' | 'soon';
interface Item { key: string; gem: string; sub: string; act: Act; soon?: boolean }

const ITEMS: Item[] = [
  { key: 'Story', gem: '#c8322a', sub: 'The Long Way Round — Eden to the ends of the earth.', act: 'story' },
  { key: 'Free Play', gem: '#2f8f9a', sub: 'The Sparring Pit — no stakes. Still giants.', act: 'freeplay' },
  { key: 'Collection', gem: '#eec13a', sub: 'The Armory — five smooth stones and change.', act: 'soon' },
  { key: 'Packs', gem: '#3a9a54', sub: 'The Storehouse — store up for the lean years.', act: 'soon' },
  { key: 'Settings', gem: '#7e46b8', sub: 'Tent pegs & knobs.', act: 'soon' },
  { key: 'Path of the Faithful', gem: '#8a8474', sub: 'The wilderness awaits.', act: 'soon', soon: true },
];

export function MainMenu({ scene, onStory, onFreePlay }:
  { scene: SceneId; onStory: () => void; onFreePlay: () => void }) {
  const [toast, setToast] = useState('');
  const click = (it: Item) => {
    if (it.act === 'story') onStory();
    else if (it.act === 'freeplay') onFreePlay();
    else { setToast(`${it.key} — coming soon`); setTimeout(() => setToast(''), 1700); }
  };
  return (
    <div className="mainmenu">
      <ShellBg scene={scene} />
      <div className="mmTopRight"><MusicToggle /></div>

      <div className="mmHead">
        <div className="mmLogo">Underdogs</div>
        <div className="ribbon">{RIBBON.map((c) => <span key={c} style={{ background: c }} />)}</div>
        <div className="mmChapter">THE VALLEY OF ELAH</div>
      </div>

      <div className="mmPanel">
        {ITEMS.map((it) => (
          <button key={it.key} className={`mmItem${it.soon ? ' soon' : ''}`}
            style={{ ['--gem' as string]: it.gem } as React.CSSProperties} onClick={() => click(it)}>
            <span className="mmGem" />
            <span className="mmText">
              <span className="mmKey">{it.key}</span>
              <span className="mmSub">{it.sub}</span>
            </span>
            {it.soon ? <span className="mmSoon">SOON</span> : <span className="mmChev">›</span>}
          </button>
        ))}
      </div>

      {toast && <div className="mmToast">{toast}</div>}
    </div>
  );
}
