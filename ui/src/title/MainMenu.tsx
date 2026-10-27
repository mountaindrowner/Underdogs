/** The main menu — the codex lies open on the painted scene (docs/22).
 *  Left leaf: the frontispiece (illuminated wordmark, the scene's name, the
 *  epigraph, a joke in the margin). Right leaf: the Contents — every mode is a
 *  chapter heading with a rubricated numeral; a silk ribbon falls to the line
 *  you're about to open. */
import { useState } from 'react';
import { ShellBg, type SceneId } from './scenes.tsx';
import { MusicToggle } from '../MusicToggle.tsx';
import './menu.css';
import { version } from '../../package.json';
import { CLASSES, CLASS_META } from '../decks.ts';
import { ownsStarter, chooseStarter, claimGift, eco } from '../economy.ts';
import { completed, encounters } from '../campaign.ts';
import { Corners, Crest, DropCap, Glyph, Rule } from '../codex/Codex.tsx';
import type { GlyphName } from '../codex/glyphs.ts';
import { FullscreenButton } from '../Fullscreen.tsx';

/** the coat of many colours — one thread per era, the game's oldest motif */
const TRIBES: [string, number][] = [
  ['#8a3a2c', 1.3], ['#a9843f', 0.8], ['#5f6b38', 1.1], ['#3c6154', 0.7],
  ['#334769', 1.2], ['#584158', 0.9], ['#9c5636', 1.0],
];

type Act = 'story' | 'freeplay' | 'decks' | 'settings' | 'packs' | 'soon';
interface Item { key: string; glyph: GlyphName; sub: string; act: Act; soon?: boolean }

const SCENE_NAME: Record<SceneId, string> = {
  coat: 'The Coat of Many Colours', reeds: 'The Reeds of the Nile',
  elah: 'The Valley of Elah', redsea: 'The Red Sea Crossing',
};

const ROMAN = ['i', 'ii', 'iii', 'iv', 'v', 'vi'];
const ITEMS: Item[] = [
  { key: 'Story', glyph: 'story', sub: 'The Long Way Round — Eden to the ends of the earth.', act: 'story' },
  { key: 'Free Play', glyph: 'freeplay', sub: 'The Sparring Pit — pick a war-band, pick a fight.', act: 'freeplay' },
  { key: 'The Armory', glyph: 'decks', sub: 'War-bands, the card album, and the forge.', act: 'decks' },
  { key: 'The Storehouse', glyph: 'packs', sub: 'Packs & Daily Bread — store up for the lean years.', act: 'packs' },
  { key: 'Settings', glyph: 'settings', sub: 'Tent pegs & knobs.', act: 'settings' },
  { key: 'Path of the Faithful', glyph: 'path', sub: 'The wilderness awaits.', act: 'soon', soon: true },
];

/** the hedera — a printer's leaf, closing each line of the Contents */
function Hedera() {
  return (
    <svg className="tocMark" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path d="M3 12h4" stroke="currentColor" strokeWidth="1.4" />
      <path d="M7 12c2-6 9-8 14-5c-2 2-2 4 0 5c-2 1-2 3 0 5c-5 3-12 1-14-5z" fill="currentColor" />
    </svg>
  );
}

export function MainMenu({ scene, onStory, onFreePlay, onDecks, onSettings, onPacks }:
  { scene: SceneId; onStory: () => void; onFreePlay: () => void; onDecks: () => void; onSettings: () => void; onPacks: () => void }) {
  const [toast, setToast] = useState('');
  const click = (it: Item) => {
    if (it.act === 'story') onStory();
    else if (it.act === 'freeplay') onFreePlay();
    else if (it.act === 'decks') onDecks();
    else if (it.act === 'settings') onSettings();
    else if (it.act === 'packs') onPacks();
    else { setToast(`${it.key} — forthcoming`); setTimeout(() => setToast(''), 1700); }
  };
  return (
    <div className="mainmenu codexMenu">
      <ShellBg scene={scene} />
      <div className="mmTopRight"><MusicToggle /><FullscreenButton /></div>

      <div className="book">
        <div className="bookBoard" />
        <section className="bookPage vellum left">
          <Corners />
          <div className="pageInner frontis">
            <div className="wordmark">
              <DropCap letter="U" pigment="#1f3a78" size={92} />
              <span className="wmRest">NDERDOGS</span>
            </div>
            <div className="tribes">
              {TRIBES.map(([c, w], i) => <span key={i} style={{ background: c, ['--w' as string]: w } as React.CSSProperties} />)}
            </div>
            <div className="sceneKicker">{SCENE_NAME[scene]}</div>
            <Rule />
            <p className="epigraph">The giants are real.<br />So is the sling.</p>
            <aside className="marginalia"><Glyph name="point" size={22} /> giants sold separately</aside>
            <div className="folioNo">folio · v{version}</div>
          </div>
        </section>

        <section className="bookPage vellum right">
          <Corners />
          <div className="pageInner">
            <div className="contentsHead">Contents <Rule /></div>
            <ol className="toc">
              {ITEMS.map((it, i) => (
                <li key={it.key}>
                  <button className={`tocItem${it.soon ? ' soon' : ''}`} onClick={() => click(it)}>
                    <span className="tocNum">{ROMAN[i]}.</span>
                    <Glyph name={it.glyph} size={24} />
                    <span className="tocText">
                      <span className="tocKey">{it.key}</span>
                      <span className="tocSub">{it.sub}</span>
                    </span>
                    {it.soon ? <span className="tocSoon">forthcoming</span> : <Hedera />}
                  </button>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </div>

      <CallingOverlays />
      {toast && <div className="mmToast">{toast}</div>}
    </div>
  );
}

/** First-run "choose your calling" + the post-chapter-1 second deck gift. */
function CallingOverlays() {
  const [, bump] = useState(0);
  const panel = (head: string, sub: string, classes: readonly string[], pick: (cls: string) => void) => (
    <div className="calling">
      <div className="callingPanel">
        <Corners />
        <div className="callingHead"><DropCap letter={head[0]} pigment="#a5301c" size={46} />{head.slice(1)}</div>
        <div className="callingSub">{sub}</div>
        <Rule />
        <div className="callingGrid">
          {classes.map((cls) => {
            const m = CLASS_META[cls];
            return (
              <button key={cls} className="callingTile" onClick={() => { pick(cls); bump((n) => n + 1); }}>
                <Crest cls={cls} size={44} />
                <span className="ctText">
                  <span className="ctName">{m.name}</span>
                  <span className="ctBlurb">{m.blurb}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
  if (!ownsStarter()) {
    return panel('Choose Your Calling',
      'A free war-band to begin. Every other card, you earn — packs, crafting, Daily Bread. Free forever.',
      CLASSES, (cls) => chooseStarter(cls));
  }
  const ch1 = encounters[0]?.id;
  if (ch1 && completed().has(ch1) && !eco().gifts.includes('second_deck')) {
    return panel('A Second Calling',
      'The first chapter is behind you. Take a second war-band — a gift, not a wage.',
      CLASSES.filter((c) => c !== eco().starterClass), (cls) => claimGift('second_deck', cls));
  }
  return null;
}
