/** Title background scenes. One is chosen at random on boot and stays put
 *  (no slideshow). All texture is CSS/SVG — no image files. Global grain,
 *  vignette, and dim (in Title.tsx) sit over whichever scene shows. */
import { useMemo } from 'react';

const rand = (a: number, b: number) => a + Math.random() * (b - a);
type CSS = React.CSSProperties;

function Motes({ n, className = 'motes' }: { n: number; className?: string }) {
  const m = useMemo(() => Array.from({ length: n }, () => ({
    l: rand(0, 100), t: rand(24, 100), d: rand(9, 17), dl: rand(0, 16), s: rand(2, 4),
  })), []);
  return (
    <div className={className}>
      {m.map((x, i) => (
        <span key={i} style={{ left: `${x.l}%`, top: `${x.t}%`,
          ['--d' as string]: `${x.d}s`, ['--dl' as string]: `${x.dl}s`, ['--s' as string]: `${x.s}px` } as CSS} />
      ))}
    </div>
  );
}

// ---- Coat of Many Colors ---------------------------------------------------
function CoatScene() {
  const dust = useMemo(() => Array.from({ length: 26 }, () => ({
    left: rand(2, 98), top: rand(28, 96), d: rand(10, 18), dl: rand(0, 14),
  })), []);
  return (
    <div className="scene coat">
      <div className="stars" />
      <div className="coatStage">
        <div className="robe">
          <div className="r-stripes" /><div className="r-round" /><div className="r-folds" />
          <div className="r-light" /><div className="r-sheen" /><div className="r-weave" />
          <div className="r-threads" />
          <div className="r-collar" /><div className="r-hem" />
        </div>
      </div>
      <div className="ao" />
      <div className="dust">
        {dust.map((m, i) => (
          <span key={i} style={{ left: `${m.left}%`, top: `${m.top}%`,
            ['--d' as string]: `${m.d}s`, ['--dl' as string]: `${m.dl}s` } as CSS} />
        ))}
      </div>
    </div>
  );
}

// ---- Reeds of the Nile -----------------------------------------------------
function ReedsScene() {
  return (
    <div className="scene reeds">
      <div className="clouds" />
      <div className="rd-rays rays" />
      <div className="rd-sun" />
      <div className="rd-haze" /><div className="rd-bank" />
      <div className="rd-water" /><div className="rd-ripple" /><div className="rd-glitter" />
      <svg className="rd-felucca" viewBox="0 0 150 150" aria-hidden>
        <path d="M40 20 L40 96 L112 92 Z" fill="#e9ddc0" />
        <path d="M40 20 L40 96" stroke="#5a3d22" strokeWidth="2.5" />
        <path d="M34 96 L118 96 Q108 114 92 114 L60 114 Q46 114 34 96 Z" fill="#2a1c10" />
        <path d="M40 116 L108 116 Q100 126 88 126 L60 126 Z" fill="#123f3d" opacity=".45" />
      </svg>
      <div className="rd-reed far" /><div className="rd-reed mid" /><div className="rd-reed near" />
      <svg className="rd-basket" viewBox="0 0 52 34" aria-hidden>
        <ellipse cx="26" cy="22" rx="23" ry="11" fill="#8a6a3a" />
        <ellipse cx="26" cy="15" rx="21" ry="7" fill="#6a4e28" />
        <path d="M6 20 H46 M10 25 H42" stroke="#4a3418" strokeWidth="1" opacity=".6" />
      </svg>
      <svg className="rd-birds" viewBox="0 0 120 40" aria-hidden fill="none" stroke="#2a2038" strokeWidth="1.6">
        <path d="M8 16 q7 -7 13 0 q7 -7 13 0" /><path d="M60 10 q6 -6 11 0 q6 -6 11 0" opacity=".8" />
        <path d="M92 22 q5 -5 10 0 q5 -5 10 0" opacity=".7" />
      </svg>
      <Motes n={18} />
    </div>
  );
}

// small tented camp for the Elah ridges
function Camp({ left, top, banner, scarlet }: { left: number; top: number; banner: string; scarlet?: boolean }) {
  return (
    <div className="el-camp" style={{ left: `${left}%`, top: `${top}%` }}>
      <svg viewBox="0 0 120 44" width="120" height="44" aria-hidden>
        <polygon points="10,40 34,40 22,18" fill={scarlet ? '#6a2a1e' : '#3a2f22'} />
        <polygon points="38,40 66,40 52,14" fill={scarlet ? '#7a3222' : '#443626'} />
        <polygon points="70,40 94,40 82,20" fill={scarlet ? '#6a2a1e' : '#3a2f22'} />
        <line x1="100" y1="8" x2="100" y2="34" stroke="#2a2018" strokeWidth="2" />
        <path d="M100 8 L118 12 L100 16 Z" fill={banner} />
      </svg>
    </div>
  );
}

// ---- Valley of Elah — Sunset ----------------------------------------------
function ElahScene() {
  return (
    <div className="scene elah">
      <div className="clouds" />
      <div className="el-rays rays" />
      <div className="el-sun" />
      <div className="el-haze" />
      <div className="el-mtn"><svg viewBox="0 0 100 20" preserveAspectRatio="none" aria-hidden>
        <polygon points="0,20 0,11 14,6 28,12 44,5 60,11 74,6 88,12 100,7 100,20" fill="#6a3a52" /></svg></div>
      <div className="el-ridgeFar"><svg viewBox="0 0 100 20" preserveAspectRatio="none" aria-hidden>
        <polygon points="0,20 0,12 20,8 40,13 62,7 82,12 100,9 100,20" fill="#8a4038" /></svg></div>
      <Camp left={12} top={49} banner="#3f5a6a" />
      <div className="el-brook" />
      <div className="el-ridgeNear"><svg viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden>
        <polygon points="0,40 0,10 24,5 48,11 72,4 100,9 100,40" fill="#3a1e28" />
        <polygon points="0,12 24,7 48,13 72,6 100,11 100,15 0,16" fill="#c26240" opacity=".5" /></svg></div>
      <Camp left={70} top={64} banner="#c0342a" scarlet />
      <Motes n={22} />
    </div>
  );
}

// ---- The Red Sea Crossing --------------------------------------------------
function RedSeaScene() {
  const embers = useMemo(() => Array.from({ length: 26 }, () => ({
    l: rand(38, 62), t: rand(30, 90), d: rand(7, 13), dl: rand(0, 12), s: rand(2, 3.5),
  })), []);
  const fish = [[30, 40], [64, 62], [46, 78]];
  const wall = (side: 'l' | 'r') => (
    <div className={`rs-wall ${side}`}>
      <div className="foam" /><div className="caus" />
      {fish.map(([x, y], i) => <span key={i} className="fish" style={{ left: `${x}%`, top: `${y}%` }} />)}
    </div>
  );
  return (
    <div className="scene rs">
      <div className="clouds" style={{ opacity: .3 }} />
      {wall('l')}{wall('r')}
      <div className="rs-seabed" />
      <div className="rs-mist" />
      <div className="rs-pillar" /><div className="rs-core" />
      <div className="embers">
        {embers.map((x, i) => (
          <span key={i} style={{ left: `${x.l}%`, top: `${x.t}%`,
            ['--d' as string]: `${x.d}s`, ['--dl' as string]: `${x.dl}s`, ['--s' as string]: `${x.s}px` } as CSS} />
        ))}
      </div>
    </div>
  );
}

export type SceneId = 'coat' | 'reeds' | 'elah' | 'redsea';
export const SCENES: SceneId[] = ['coat', 'reeds', 'elah', 'redsea'];
export function pickScene(): SceneId { return SCENES[Math.floor(Math.random() * SCENES.length)]; }

/** Scene for this session: a ?title= override (dev/preview), else random. */
export function chooseScene(): SceneId {
  const q = typeof location !== 'undefined' ? new URLSearchParams(location.search).get('title') : null;
  return (SCENES as string[]).includes(q ?? '') ? (q as SceneId) : pickScene();
}

/** The persistent shell background: the chosen scene under grain + vignette. */
export function ShellBg({ scene }: { scene: SceneId }) {
  return (
    <>
      <div className="titleScene"><Scene id={scene} /></div>
      <div className="titleGrain" />
      <div className="titleVignette" />
      <div className="shellDim" />
    </>
  );
}

export function Scene({ id }: { id: SceneId }) {
  switch (id) {
    case 'reeds': return <ReedsScene />;
    case 'elah': return <ElahScene />;
    case 'redsea': return <RedSeaScene />;
    case 'coat':
    default: return <CoatScene />;
  }
}
