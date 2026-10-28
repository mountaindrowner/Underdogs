/** First-run intro (D-54): three short beats, one line each, then the Calling.
 *  Plays once (underdogs.intro.seen); tap to advance, Skip to leave. The
 *  scenes celebrate the underdog — never the holy (Law 3/4). */
import { useEffect, useState } from 'react';
import { Scene } from './scenes.tsx';
import { artStyle } from '../data.ts';
import './intro.css';

export const INTRO_KEY = 'underdogs.intro.seen';
export function introSeen(): boolean { try { return localStorage.getItem(INTRO_KEY) === '1'; } catch { return true; } }
function markSeen() { try { localStorage.setItem(INTRO_KEY, '1'); } catch { /* ignore */ } }

const TRIO: [string, string, string][] = [
  ['shepherd_david', 'A shepherd boy', 'too young for armour'],
  ['gideon_threshing', 'A farmer', 'hiding in a winepress'],
  ['abram_the_called', 'An old man', 'told to start over at seventy-five'],
];
const BEAT_MS = [5200, 7600, 3200];

export function Intro({ onDone }: { onDone: () => void }) {
  const [beat, setBeat] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const finish = () => { if (leaving) return; markSeen(); setLeaving(true); setTimeout(onDone, 600); };
  const next = () => (beat < BEAT_MS.length - 1 ? setBeat(beat + 1) : finish());
  useEffect(() => { const t = setTimeout(next, BEAT_MS[beat]); return () => clearTimeout(t); }, [beat]);

  return (
    <div className={`fi${leaving ? ' leaving' : ''}`} onPointerDown={next}>
      <div className="fiStage" key={beat}>
        {beat === 0 && <>
          <div className="fiScene push"><div className="titleScene"><Scene id="elah" /></div></div>
          <div className="fiShade" />
          <div className="fiLine">Forty days, a giant shouted. Nobody answered.</div>
          <div className="fiPlace">The Valley of Elah</div>
        </>}
        {beat === 1 && <>
          <div className="fiScene dim"><div className="titleScene"><Scene id="reeds" /></div></div>
          <div className="fiShade" />
          <div className="fiTrio">{TRIO.map(([id, who, what], i) => (
            <figure key={id} className="fiCard" style={{ ['--i' as string]: i } as React.CSSProperties}>
              <div className="fiArt art-win" style={artStyle(id, 'chapter')} />
              <figcaption><b>{who}</b><span>{what}</span></figcaption>
            </figure>
          ))}</div>
          <div className="fiLine late">Every hero in this book started unqualified.</div>
        </>}
        {beat === 2 && <>
          <div className="fiScene dim"><div className="titleScene"><Scene id="coat" /></div></div>
          <div className="fiShade" />
          <div className="fiLine center">Choose who you'll follow.</div>
        </>}
      </div>
      <div className="fiDots" aria-hidden>{BEAT_MS.map((_, i) => <i key={i} className={i === beat ? 'on' : ''} />)}</div>
      <button className="fiSkip" onPointerDown={(e) => { e.stopPropagation(); finish(); }}>Skip ›</button>
    </div>
  );
}
