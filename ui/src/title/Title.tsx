/** Boot title screen: a random HD scene behind the logo + load sequence.
 *  Tapping anywhere begins (arming/fading in the music) and hands off to the
 *  menu. Reverence: the scene and copy celebrate the underdog, never the holy. */
import { useState } from 'react';
import { Scene, type SceneId } from './scenes.tsx';
import './title.css';
import { version } from '../../package.json';

// a woven band of the coat's dyed wools (not a spectrum) — uneven panels,
// muted dye tones, gold seams between. The recurring brand accent.
const RIBBON: [string, number][] = [
  ['#8a3a2c', 1.3], ['#a9843f', 0.8], ['#5f6b38', 1.1], ['#3c6154', 0.7],
  ['#334769', 1.2], ['#584158', 0.9], ['#9c5636', 1.0],
];

function Filigree({ pos }: { pos: string }) {
  return (
    <svg className={`filigree ${pos}`} viewBox="0 0 120 120" fill="none" aria-hidden>
      <path d="M6 52 Q6 6 52 6" stroke="#e9c47a" strokeWidth="2.4" />
      <path d="M6 34 Q6 20 20 14" stroke="#e9c47a" strokeWidth="1.6" opacity=".8" />
      <path d="M24 10 q12 5 10 18 q-8 2 -12 -6" stroke="#e9c47a" strokeWidth="1.6" opacity=".8" />
      <circle cx="52" cy="6" r="2.6" fill="#f4e2b0" />
      <circle cx="6" cy="52" r="2.6" fill="#f4e2b0" />
      <circle cx="34" cy="30" r="1.8" fill="#e9c47a" />
    </svg>
  );
}

export function Title({ scene, onBegin }: { scene: SceneId; onBegin: () => void }) {
  const [leaving, setLeaving] = useState(false);
  const begin = () => {
    if (leaving) return;
    setLeaving(true);
    setTimeout(onBegin, 680);
  };
  return (
    <div className={`title${leaving ? ' leaving' : ''}`} onPointerDown={begin}>
      <div className="titleScene"><Scene id={scene} /></div>
      <div className="titleGrain" />
      <div className="titleVignette" />
      <div className="titleDim" />
      <Filigree pos="tl" /><Filigree pos="tr" /><Filigree pos="bl" /><Filigree pos="br" />

      <div className="titleCenter">
        <div className="titleLogo">Underdogs</div>
        <div className="ribbon">{RIBBON.map(([c, w], i) => <span key={i} style={{ background: c, flexGrow: w }} />)}</div>
        <div className="tagline">Every hero starts unqualified.</div>
        <div className="tapBegin">TAP TO BEGIN</div>
      </div>
      <div className="titleFooter">{`V${version} · SINGLE-PLAYER · FREE FOREVER`}</div>
    </div>
  );
}
