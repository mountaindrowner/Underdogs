/** Title background scenes. One is chosen at random on boot and stays put
 *  (no slideshow). All texture is CSS/SVG — no image files. Global grain,
 *  vignette, and dim (in Title.tsx) sit over whichever scene shows. */
import { useMemo, useRef, useEffect } from 'react';

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

// A layer of organic reeds: tapered, gently-bent stalks of varied height with
// feathery seed-heads and the odd leaf blade — not a barcode of straight lines.
function Reeds({ n, hMin, hMax, stalk, head, leafColor, className }:
  { n: number; hMin: number; hMax: number; stalk: string; head: string; leafColor?: string; className: string }) {
  const H = 200, W = 1000;
  const reeds = useMemo(() => Array.from({ length: n }, (_, i) => {
    const x = (i + 0.5) * (W / n) + rand(-W / n * 0.4, W / n * 0.4);
    const h = rand(hMin, hMax);
    const bend = rand(-16, 16);
    const bw = rand(3, 6.5);
    return { x, h, bend, bw, head: Math.random() < 0.75, leaf: Math.random() < 0.22, lend: rand(-1, 1) < 0 ? -1 : 1 };
  }), []);
  return (
    <svg className={className} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden>
      {reeds.map((r, i) => {
        const ty = H - r.h, tx = r.x + r.bend;
        const d = `M${r.x - r.bw / 2},${H} Q${r.x - r.bw / 4 + r.bend * 0.5},${H - r.h * 0.55} ${tx - 0.6},${ty}`
          + ` L${tx + 0.6},${ty} Q${r.x + r.bw / 4 + r.bend * 0.5},${H - r.h * 0.55} ${r.x + r.bw / 2},${H} Z`;
        return (
          <g key={i}>
            <path d={d} fill={stalk} />
            {r.head && <ellipse cx={tx} cy={ty - 4} rx="2.1" ry="6.5" fill={head} transform={`rotate(${r.bend * 0.4} ${tx} ${ty})`} />}
            {r.leaf && leafColor && (() => {
              const ly = H - r.h * 0.46, dir = r.lend, tipX = r.x + dir * 30, tipY = ly - 20;
              return (
                <path d={`M${r.x},${ly + 5} Q${r.x + dir * 20},${ly - 4} ${tipX},${tipY}`
                  + ` Q${r.x + dir * 14},${ly + 2} ${r.x},${ly - 3} Z`}
                  fill={leafColor} opacity=".85" />
              );
            })()}
          </g>
        );
      })}
    </svg>
  );
}

// ---- Reeds of the Nile -----------------------------------------------------
function ReedsScene() {
  return (
    <div className="scene reeds">
      <div className="clouds" />
      <div className="rd-rays rays" />
      <div className="rd-sun" /><div className="rd-sunbloom" />
      <div className="rd-haze" /><div className="rd-bank" />
      <div className="rd-water" /><div className="rd-ripple" /><div className="rd-glitter" />
      <svg className="rd-felucca" viewBox="0 0 150 150" aria-hidden>
        <path d="M40 22 Q78 40 112 90 L40 96 Z" fill="#efe4ca" />
        <path d="M40 22 Q60 42 74 66" stroke="#d8c8a2" strokeWidth="1" fill="none" opacity=".7" />
        <path d="M40 18 L40 98" stroke="#5a3d22" strokeWidth="2.5" />
        <path d="M34 96 L118 96 Q108 115 92 115 L60 115 Q46 115 34 96 Z" fill="#2b1d11" />
        <path d="M40 118 Q78 132 108 118 L100 128 Q78 138 48 128 Z" fill="#0f3a38" opacity=".4" />
      </svg>
      <Reeds n={34} hMin={60} hMax={110} stalk="rgba(30,66,54,.5)" head="rgba(120,140,110,.5)" className="rd-reed far" />
      <Reeds n={26} hMin={110} hMax={175} stalk="#13342a" head="#3f5a3a" leafColor="#1c4636" className="rd-reed mid" />
      <Reeds n={18} hMin={175} hMax={250} stalk="#081f18" head="#2c4630" leafColor="#0f2f22" className="rd-reed near" />
      <svg className="rd-basket" viewBox="0 0 60 40" aria-hidden>
        <ellipse cx="30" cy="30" rx="26" ry="9" fill="#3a2a14" opacity=".4" />
        <path d="M6 22 Q30 34 54 22 L52 26 Q30 38 8 26 Z" fill="#8a6a3a" />
        <ellipse cx="30" cy="20" rx="24" ry="8" fill="#7a5a30" />
        <ellipse cx="30" cy="18" rx="24" ry="6" fill="#9a7a44" />
        <path d="M8 19 H52 M10 22 Q30 27 50 22 M12 16 H48" stroke="#5a4020" strokeWidth="1" opacity=".55" fill="none" />
      </svg>
      <svg className="rd-birds" viewBox="0 0 120 40" aria-hidden fill="none" stroke="#3a3348" strokeWidth="1.1" opacity=".55">
        <path d="M8 16 q7 -6 13 0 q6 -6 13 0" /><path d="M60 11 q6 -5 11 0 q5 -5 11 0" opacity=".8" />
        <path d="M92 21 q5 -4 10 0 q4 -4 10 0" opacity=".65" />
      </svg>
      <Motes n={16} />
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
      <div className="el-sun" /><div className="el-sunbloom" />
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

// ---- living painted scenes (Imagen base + keyed transparent overlays) -------
// Painted HD backdrops with drifting light sprites layered on top. If a base
// webp is missing, the scene falls back to its procedural CSS/SVG version.
const BASES: Record<string, string> = Object.fromEntries(
  Object.entries(import.meta.glob('../../assets/scenes/*.webp', { eager: true, query: '?url', import: 'default' }))
    .map(([p, url]) => [p.split('/').pop()!.replace('.webp', ''), url as string]));
const OVERLAYS: Record<string, string> = Object.fromEntries(
  Object.entries(import.meta.glob('../../assets/scenes/overlays/*.webp', { eager: true, query: '?url', import: 'default' }))
    .map(([p, url]) => [p.split('/').pop()!.replace('.webp', ''), url as string]));
// per-scene FX mix: which sprites, whether the sun/ray planes show, bokeh
// strength, and mote counts [far, near]. The coat is a fabric CLOSE-UP — no
// sun or sky rays; it gets gold-thread glints and a low godray "sheen" instead.
interface SceneFx { overlays: string[]; sun: boolean; rays: boolean; bokeh: number; motes: [number, number] }
const SCENE_FX: Record<SceneId, SceneFx> = {
  reeds:  { overlays: ['fireflies', 'mist'], sun: true,  rays: true,  bokeh: 0.40, motes: [22, 9] },
  coat:   { overlays: ['glints', 'godrays'], sun: false, rays: false, bokeh: 0.20, motes: [12, 5] },
  elah:   { overlays: ['godrays', 'mist'],   sun: true,  rays: true,  bokeh: 0.30, motes: [22, 9] },
  redsea: { overlays: ['spray', 'godrays'],  sun: true,  rays: true,  bokeh: 0.30, motes: [18, 7] },
};

function SceneMotes({ n, cls = 'ls-motes', big = 0 }: { n: number; cls?: string; big?: number }) {
  const motes = useMemo(() => Array.from({ length: n }, () => ({
    left: Math.random() * 100, top: 34 + Math.random() * 56, sz: 1 + big + Math.random() * (3 + big),
    dur: 7 + Math.random() * 10, delay: -Math.random() * 16,
  })), [n, big]);
  return <div className={cls}>{motes.map((m, i) => (
    <span key={i} style={{ left: `${m.left}%`, top: `${m.top}%`, width: m.sz, height: m.sz,
      animationDuration: `${m.dur}s`, animationDelay: `${m.delay}s` } as React.CSSProperties} />
  ))}</div>;
}

function LivingScene({ id, base }: { id: SceneId; base: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const onMove = (e: PointerEvent) => {
      el.style.setProperty('--px', ((e.clientX / window.innerWidth) - 0.5).toFixed(3));
      el.style.setProperty('--py', ((e.clientY / window.innerHeight) - 0.5).toFixed(3));
    };
    window.addEventListener('pointermove', onMove);
    return () => window.removeEventListener('pointermove', onMove);
  }, []);
  const fx = SCENE_FX[id];
  return (
    <div className={`liveScene ls-${id}`} ref={ref} style={{ ['--bokeh-o' as string]: fx.bokeh } as React.CSSProperties}>
      <div className="ls-base" style={{ backgroundImage: `url(${base})` }} />
      {fx.sun && <div className="ls-sun" />}
      {fx.overlays.map((o, i) => OVERLAYS[o] && (
        <div key={o} className={`ls-ovr ls-ovr${i}`} style={{ backgroundImage: `url(${OVERLAYS[o]})` }} />
      ))}
      {fx.rays && <div className="ls-rays" />}
      <SceneMotes n={fx.motes[0]} />
      <SceneMotes n={fx.motes[1]} cls="ls-motes ls-near" big={2} />
      {OVERLAYS.bokeh && fx.bokeh > 0 && <div className="ls-bokeh" style={{ backgroundImage: `url(${OVERLAYS.bokeh})` }} />}
    </div>
  );
}

function ProceduralScene({ id }: { id: SceneId }) {
  switch (id) {
    case 'reeds': return <ReedsScene />;
    case 'elah': return <ElahScene />;
    case 'redsea': return <RedSeaScene />;
    case 'coat':
    default: return <CoatScene />;
  }
}

export function Scene({ id }: { id: SceneId }) {
  const base = BASES[id];
  return base ? <LivingScene id={id} base={base} /> : <ProceduralScene id={id} />;
}
