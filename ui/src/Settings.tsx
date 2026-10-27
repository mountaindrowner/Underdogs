/** Settings — "Tent pegs & knobs." Sound, feel, the battle-board finish, and
 *  the reset lever. Everything persists locally (no backend, per canon). */
import { useState } from 'react';
import type { SceneId } from './title/scenes.tsx';
import { MusicToggle } from './MusicToggle.tsx';
import { haptics } from './haptics.ts';
import { version } from '../package.json';
import { Folio } from './codex/Codex.tsx';
import { fullscreenSupported, toggleFullscreen, useFullscreen } from './Fullscreen.tsx';

const BOARD_KEY = 'underdogs.board';
const BOARD_OPTS = [
  ['relief', 'Carved Stone'], ['timber', 'Tavern Timber'], ['flat', 'Flat'],
] as const;
/** everything a "fresh slate" should forget */
const RESET_KEYS = [
  'underdogs.campaign.done', 'underdogs.decks.custom', 'underdogs.freeplay.sel', 'underdogs.economy.v1',
  'underdogs.board', 'underdogs.haptics', 'underdogs.music.vol', 'underdogs.music.muted',
];

export function SettingsScreen({ scene, onBack }: { scene: SceneId; onBack: () => void }) {
  const [hap, setHap] = useState(() => haptics.enabled);
  const full = useFullscreen();
  const [board, setBoard] = useState(() => {
    try { return localStorage.getItem(BOARD_KEY) ?? 'relief'; } catch { return 'relief'; }
  });
  const [armed, setArmed] = useState(false);   // reset needs a second tap
  const [wiped, setWiped] = useState(false);

  const pickBoard = (id: string) => {
    setBoard(id);
    try { localStorage.setItem(BOARD_KEY, id); } catch { /* ignore */ }
  };
  const reset = () => {
    if (!armed) { setArmed(true); return; }
    for (const k of RESET_KEYS) { try { localStorage.removeItem(k); } catch { /* ignore */ } }
    setArmed(false); setWiped(true);
    setTimeout(() => setWiped(false), 2200);
  };

  return (
    <Folio scene={scene} title="Settings" kicker="Tent pegs & knobs." back={onBack} className="settings">
      <div className="setPanel">
        <div className="setRow">
          <div className="setText">
            <div className="setKey">Music &amp; Sound</div>
            <div className="setSub">One mute governs both; the slider is the music.</div>
          </div>
          <MusicToggle />
        </div>
        {fullscreenSupported() && (
          <div className="setRow">
            <div className="setText">
              <div className="setKey">Fullscreen</div>
              <div className="setSub">Fill the whole screen. Press F any time; Esc steps back out.</div>
            </div>
            <button className={`chip${full ? ' on' : ''}`} onClick={toggleFullscreen}>{full ? 'On' : 'Off'}</button>
          </div>
        )}
        <div className="setRow">
          <div className="setText">
            <div className="setKey">Haptics</div>
            <div className="setSub">Little thumps on hits. Android browsers only, for now.</div>
          </div>
          <button className={`chip${hap ? ' on' : ''}`}
            onClick={() => { const v = !hap; setHap(v); haptics.setEnabled(v); if (v) haptics.play(); }}>
            {hap ? 'On' : 'Off'}</button>
        </div>
        <div className="setRow">
          <div className="setText">
            <div className="setKey">Board Finish</div>
            <div className="setSub">The battle table&rsquo;s trim. Also cycles in-match.</div>
          </div>
          <div className="setChips">
            {BOARD_OPTS.map(([id, name]) => (
              <button key={id} className={`chip${board === id ? ' on' : ''}`} onClick={() => pickBoard(id)}>{name}</button>
            ))}
          </div>
        </div>
        <div className="setRow">
          <div className="setText">
            <div className="setKey">Begin Again</div>
            <div className="setSub">Forget campaign progress, custom war-bands, the collection, and these knobs.</div>
          </div>
          <button className={`bigbtn ddDel setReset${armed ? ' sure' : ''}`} onClick={reset}
            onBlur={() => setArmed(false)}>
            {armed ? 'Tap again — no takebacks' : 'Reset everything'}</button>
        </div>
      </div>
      <div className="setVersion">UNDERDOGS v{version} · single-player · free forever</div>
      <div className="setCredits">
        Icons by Lorc, Delapouite &amp; contributors from game-icons.net (CC BY 3.0). Type: IM Fell by
        Igino Marini and Uncial Antiqua by Astigmatic (SIL Open Font License).
      </div>
      {wiped && <div className="mmToast">The slate is clean.</div>}
    </Folio>
  );
}
