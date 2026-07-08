/** Boot title screen: a random HD scene behind the logo + load sequence.
 *  Tapping anywhere begins (arming/fading in the music) and hands off to the
 *  menu. Reverence: the scene and copy celebrate the underdog, never the holy. */
import { useMemo, useState } from 'react';
import { Scene, pickScene } from './scenes.tsx';
import './title.css';

const RIBBON = ['#c8322a', '#e07a2a', '#eec13a', '#3a9a54', '#2f8f9a', '#3a4fa8', '#7e46b8'];

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

export function Title({ onBegin }: { onBegin: () => void }) {
  const scene = useMemo(() => pickScene(), []);
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
        <div className="ribbon">{RIBBON.map((c) => <span key={c} style={{ background: c }} />)}</div>
        <div className="tagline">Every hero starts unqualified.</div>
        <div className="tapBegin">TAP TO BEGIN</div>
      </div>
      <div className="titleFooter">V0.1 · SINGLE-PLAYER · FREE FOREVER</div>
    </div>
  );
}
