/** The main menu — an ornate tooled-leather panel resting on the robe (docs/13
 *  §6). Story -> the chapter map; Free Play -> a sandbox skirmish; the rest are
 *  tasteful SOON stubs until those screens are built. */
import { useState } from 'react';
import { ShellBg, type SceneId } from './scenes.tsx';
import { MusicToggle } from '../MusicToggle.tsx';
import './menu.css';
import { version } from '../../package.json';
import { CLASSES, CLASS_META } from '../decks.ts';
import { ownsStarter, chooseStarter, claimGift, eco } from '../economy.ts';
import { completed, encounters } from '../campaign.ts';

const RIBBON: [string, number][] = [
  ['#8a3a2c', 1.3], ['#a9843f', 0.8], ['#5f6b38', 1.1], ['#3c6154', 0.7],
  ['#334769', 1.2], ['#584158', 0.9], ['#9c5636', 1.0],
];

type Act = 'story' | 'freeplay' | 'decks' | 'settings' | 'packs' | 'soon';
interface Item { key: string; gem: string; sub: string; act: Act; soon?: boolean }

// kicker under the logo — matches the painted scene showing behind the menu
const SCENE_NAME: Record<SceneId, string> = {
  coat: 'THE COAT OF MANY COLOURS', reeds: 'THE REEDS OF THE NILE',
  elah: 'THE VALLEY OF ELAH', redsea: 'THE RED SEA CROSSING',
};

const ITEMS: Item[] = [
  { key: 'Story', gem: '#c8322a', sub: 'The Long Way Round — Eden to the ends of the earth.', act: 'story' },
  { key: 'Free Play', gem: '#2f8f9a', sub: 'The Sparring Pit — pick a war-band, pick a fight.', act: 'freeplay' },
  { key: 'Decks', gem: '#eec13a', sub: 'The Armory — war-bands, cards, and the forge.', act: 'decks' },
  { key: 'Packs', gem: '#3a9a54', sub: 'The Storehouse — store up for the lean years.', act: 'packs' },
  { key: 'Settings', gem: '#7e46b8', sub: 'Tent pegs & knobs.', act: 'settings' },
  { key: 'Path of the Faithful', gem: '#8a8474', sub: 'The wilderness awaits.', act: 'soon', soon: true },
];

export function MainMenu({ scene, onStory, onFreePlay, onDecks, onSettings, onPacks }:
  { scene: SceneId; onStory: () => void; onFreePlay: () => void; onDecks: () => void; onSettings: () => void; onPacks: () => void }) {
  const [toast, setToast] = useState('');
  const click = (it: Item) => {
    if (it.act === 'story') onStory();
    else if (it.act === 'freeplay') onFreePlay();
    else if (it.act === 'decks') onDecks();
    else if (it.act === 'settings') onSettings();
    else if (it.act === 'packs') onPacks();
    else { setToast(`${it.key} — coming soon`); setTimeout(() => setToast(''), 1700); }
  };
  return (
    <div className="mainmenu">
      <ShellBg scene={scene} />
      <div className="mmTopRight"><MusicToggle /></div>

      <div className="mmHead">
        <div className="mmLogo">Underdogs</div>
        <div className="ribbon">{RIBBON.map(([c, w], i) => <span key={i} style={{ background: c, flexGrow: w }} />)}</div>
        <div className="mmChapter">{SCENE_NAME[scene]}</div>
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

      <CallingOverlays />
      <div className="mmVersion">v{version}</div>
      {toast && <div className="mmToast">{toast}</div>}
    </div>
  );
}

/** First-run "choose your calling" + the post-chapter-1 second deck gift. */
function CallingOverlays() {
  const [, bump] = useState(0);
  if (!ownsStarter()) {
    return (
      <div className="calling">
        <div className="callingPanel">
          <div className="callingHead">Choose Your Calling</div>
          <div className="callingSub">A free war-band to begin. Every other card, you earn — packs, crafting, Daily Bread. Free forever.</div>
          <div className="callingGrid">
            {CLASSES.map((cls) => {
              const m = CLASS_META[cls];
              return (
                <button key={cls} className="callingTile" style={{ ['--gem' as string]: m.color } as React.CSSProperties}
                  onClick={() => { chooseStarter(cls); bump((n) => n + 1); }}>
                  <span className="ctIcon">{m.icon}</span>
                  <span className="ctName">{m.name}</span>
                  <span className="ctBlurb">{m.blurb}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }
  const ch1 = encounters[0]?.id;
  if (ch1 && completed().has(ch1) && !eco().gifts.includes('second_deck')) {
    const remaining = CLASSES.filter((c) => c !== eco().starterClass);
    return (
      <div className="calling">
        <div className="callingPanel">
          <div className="callingHead">A Second Calling</div>
          <div className="callingSub">The first chapter is behind you. Take a second war-band — a gift, not a wage.</div>
          <div className="callingGrid">
            {remaining.map((cls) => {
              const m = CLASS_META[cls];
              return (
                <button key={cls} className="callingTile" style={{ ['--gem' as string]: m.color } as React.CSSProperties}
                  onClick={() => { claimGift('second_deck', cls); bump((n) => n + 1); }}>
                  <span className="ctIcon">{m.icon}</span>
                  <span className="ctName">{m.name}</span>
                  <span className="ctBlurb">{m.blurb}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }
  return null;
}
