/** The board diorama that lives behind the cards (docs/12). Four scenes —
 *  Elah, Eden, Red Sea, Babylon — built from the shared recipes in board.css.
 *  Dim, slow, and desaturated: the scene never competes with the cards. */
import { useMemo, useState, useRef } from 'react';
import { BOARDS, boardForEncounter, type BoardId, type MoteCfg } from './boards.ts';
import './board.css';

const rand = (a: number, b: number) => a + Math.random() * (b - a);
type CSS = React.CSSProperties;
const pct = (n: number) => `${n}%`;

// ---- shared props ----------------------------------------------------------
function MoteField({ cfg }: { cfg: MoteCfg }) {
  const motes = useMemo(() => Array.from({ length: cfg.n }, () => {
    const dur = rand(cfg.durMin, cfg.durMax);
    return {
      left: rand(cfg.fieldX[0], cfg.fieldX[1]), top: rand(cfg.fieldY[0], cfg.fieldY[1]),
      sz: rand(cfg.szMin, cfg.szMax), delay: rand(0, dur), rx: (Math.random() * 2 - 1) * 30, dur,
    };
  }), [cfg]);
  return (
    <>{motes.map((m, i) => (
      <span key={i} className="mote" style={{
        left: pct(m.left), top: pct(m.top),
        '--sz': `${m.sz}px`, '--dur': `${m.dur}s`, '--delay': `${m.delay}s`,
        '--rx': `${m.rx}px`, '--ry': `${cfg.ry}px`, '--peak': cfg.peak, '--mote': cfg.color,
      } as CSS} />
    ))}</>
  );
}

function Ridge({ top, h, color, edge }: { top: number; h: number; color: string; edge?: string }) {
  return (
    <div className="prop" style={{ left: 0, top: pct(top), width: '100%', height: pct(h) }}>
      <svg width="100%" height="100%" viewBox="0 0 100 20" preserveAspectRatio="none">
        {edge && <polygon points="0,20 0,7 13,4 26,8 40,3 54,7 67,3 81,6 92,3 100,6 100,20" fill={edge} />}
        <polygon points="0,20 0,9 13,6 26,10 40,5 54,9 67,5 81,8 92,5 100,8 100,20" fill={color} />
      </svg>
    </div>
  );
}

// a tented camp with a swaying banner; when `toy`, tapping raises the banners
function Camp({ left, top, banner, flip, toy, title }: { left: number; top: number; banner: string; flip?: boolean; toy?: boolean; title?: string }) {
  const [raised, setRaised] = useState(false);
  const onClick = toy ? (e: React.MouseEvent) => { e.stopPropagation(); setRaised(true); setTimeout(() => setRaised(false), 1400); } : undefined;
  return (
    <div className={`prop${toy ? ' toy' : ''}`} style={{ left: pct(left), top: pct(top), width: 160, height: 70, transform: flip ? 'scaleX(-1)' : undefined }} onClick={onClick} title={title}>
      <svg width="160" height="70">
        <polygon points="14,64 46,64 30,34" fill="#7a6a4a" />
        <polygon points="52,64 92,64 72,30" fill="#6f6144" />
        <polygon points="98,64 130,64 114,36" fill="#7a6a4a" />
        <line x1="128" y1="12" x2="128" y2="44" stroke="#4a3a22" strokeWidth="2" />
      </svg>
      <div className="sway" style={{ position: 'absolute', left: 128, top: raised ? 6 : 12, transition: 'top .3s ease' }}>
        <svg width="26" height="14"><path d="M0,0 L26,4 L0,9 Z" fill={banner} /></svg>
      </div>
    </div>
  );
}

// ---- Board scenes ----------------------------------------------------------
function ElahScene({ goliath }: { goliath: boolean }) {
  const [stones, setStones] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const splash = (e: React.MouseEvent) => {
    e.stopPropagation();
    setStones((s) => s + 1);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setStones(0), 2300);
  };
  return (
    <>
      <Ridge top={30} h={12} color="#9a8258" edge="#8a7048" />
      <Ridge top={74} h={12} color="#b8a06a" edge="#a68d58" />
      <Camp left={12} top={26} banner="#3f5a6a" />
      <Camp left={74} top={72} banner="#a83a2c" flip toy title="raise the banners" />
      {/* the brook (center seam) — glint is Elah's 2nd ambient motion; no caustic */}
      <div className="prop water glint" style={{ left: 0, top: '46.5%', width: '100%', height: '2.6%', ['--w-top' as string]: '#8fb0c0', ['--w-bot' as string]: '#6a90a0' }} />
      <div className="toy" style={{ position: 'absolute', left: 0, top: '45%', width: '100%', height: '4%' }} onClick={splash} title="the brook" />
      {stones > 0 && Array.from({ length: 5 }).map((_, i) => (
        <span key={`${stones}-${i}`} className="brook-stone show"
          style={{ left: `${34 + i * 7}%`, top: '46.6%', animationDelay: `${i * 0.12}s` }} />
      ))}
      {/* shepherd's sling on a rock (easter egg) */}
      <div className="prop" style={{ left: '4%', top: '60%', width: 34, height: 34 }}>
        <svg width="34" height="34"><ellipse cx="17" cy="26" rx="14" ry="7" fill="#5a3d22" /><path d="M8,22 Q17,6 26,22" stroke="#3a2614" strokeWidth="2" fill="none" /></svg>
      </div>
      {/* giant's spear planted */}
      <div className="prop" style={{ left: '90%', top: '52%', width: 12, height: 90 }}>
        <svg width="12" height="90"><rect x="5" y="10" width="3" height="80" fill="#7d5a26" /><polygon points="6,0 11,12 1,12" fill="#c9c3b0" /></svg>
      </div>
      {/* distant flock */}
      <div className="prop" style={{ left: '84%', top: '30%', width: 40, height: 16 }}>
        <svg width="40" height="16">{[0, 12, 24, 8].map((x, i) => <circle key={i} cx={x + 4} cy={i % 2 ? 10 : 5} r="3" fill="#efe9d8" />)}</svg>
      </div>
      <div className="goliath-shadow" />
    </>
  );
}

function EdenScene() {
  const [leaf, setLeaf] = useState(0);
  const [serp, setSerp] = useState(false);
  return (
    <>
      {/* verdant -> barren split (right side drier) */}
      <div className="prop" style={{ inset: 0, background: 'linear-gradient(90deg,transparent 55%,rgba(184,146,90,.5) 100%)' }} />
      {/* Tree of Life */}
      <div className="prop toy" style={{ left: '6%', top: '20%', width: 150, height: 220 }} onClick={(e) => { e.stopPropagation(); setLeaf((n) => n + 1); }} title="the tree">
        <svg width="150" height="220">
          <rect x="66" y="120" width="18" height="96" fill="#5a3d22" />
          <g className="sway" style={{ animationDuration: '9s' }}>
            <ellipse cx="75" cy="90" rx="66" ry="52" fill="#4a6f37" />
            <ellipse cx="42" cy="110" rx="34" ry="30" fill="#43642f" />
            <ellipse cx="110" cy="108" rx="34" ry="30" fill="#527a3d" />
          </g>
        </svg>
        {leaf > 0 && <span key={leaf} className="eden-leaf" style={{ position: 'absolute', left: 70, top: 120 }} />}
      </div>
      {/* Gate of Eden + flaming sword */}
      <div className="prop" style={{ left: '47%', top: '7%', width: 90, height: 84 }}>
        <svg width="90" height="84"><rect x="20" y="24" width="50" height="60" rx="4" fill="#7a6a4a" /><rect x="30" y="24" width="30" height="60" fill="#5f523a" /></svg>
        <div className="spin20" style={{ position: 'absolute', left: 30, top: 2, width: 30, height: 30, borderRadius: '50%', background: 'conic-gradient(#fff3cf,#f0a63c,#a8461c,#f0a63c,#fff3cf)', boxShadow: '0 0 12px 3px rgba(240,166,60,.5)' }} />
      </div>
      {/* four rivers along seam (static, per spec) */}
      <div className="prop water" style={{ left: 0, top: '47%', width: '100%', height: '3%', ['--w-top' as string]: '#cfeecf', ['--w-bot' as string]: '#8fd0c0' }} />
      {/* coiled serpent (in the tree) */}
      <div className="prop toy" style={{ left: '10%', top: '30%', width: 40, height: 40, transform: serp ? 'translateX(4px)' : undefined, transition: 'transform 1.2s' }}
        onClick={(e) => { e.stopPropagation(); setSerp((v) => !v); }} title="did He really say…?">
        <svg width="40" height="40"><path d="M6,30 Q20,34 24,22 Q28,10 16,10 Q8,10 12,18" stroke="#6a7d4a" strokeWidth="5" fill="none" strokeLinecap="round" /><circle cx="7" cy="30" r="2" fill="#2a3a1a" /></svg>
      </div>
      {/* fig leaves + apple (easter egg) */}
      <div className="prop" style={{ left: '14%', top: '44%', width: 24, height: 20 }}>
        <svg width="24" height="20"><ellipse cx="7" cy="12" rx="6" ry="4" fill="#4a6f37" /><ellipse cx="15" cy="10" rx="6" ry="4" fill="#527a3d" /><circle cx="19" cy="14" r="3" fill="#a83a2c" /></svg>
      </div>
    </>
  );
}

function RedSeaScene() {
  const [fire, setFire] = useState(false);
  const [dart, setDart] = useState(false);
  const wall = (left: number, cls: string) => (
    <div className={`prop water rs-wall ${cls}`} style={{ left: pct(left), top: '15%', width: '22%', height: '62%', ['--w-top' as string]: '#2f7a8a', ['--w-bot' as string]: '#1a4a5a', clipPath: cls === 'left' ? 'polygon(0 0,100% 8%,100% 100%,0 100%)' : 'polygon(0 8%,100% 0,100% 100%,0 100%)' }}>
      <div className="caustic" />
      {[0, 1, 2].map((i) => <span key={i} className="rs-fish" style={{ left: `${20 + i * 24}%`, top: `${30 + i * 18}%` }} />)}
    </div>
  );
  return (
    <>
      <div className={`rs-walls${dart ? ' darting' : ''}`} style={{ position: 'absolute', inset: 0 }}>
        <div className="toy" style={{ position: 'absolute', left: 0, top: '15%', width: '22%', height: '62%' }}
          onClick={(e) => { e.stopPropagation(); setDart(true); setTimeout(() => setDart(false), 1200); }} title="the deep" />
        {wall(0, 'left')}
        {wall(78, 'right')}
      </div>
      {/* seabed crossing lane */}
      <div className="prop" style={{ left: '22%', top: '41%', width: '56%', height: '14%', background: 'linear-gradient(180deg,#d8b878,#c8a860)' }} />
      {/* Egypt bank + pyramids */}
      <div className="prop" style={{ left: 0, top: '13%', width: '100%', height: '4%' }}>
        <svg width="100%" height="100%" viewBox="0 0 100 6" preserveAspectRatio="none"><rect width="100" height="6" fill="#c9a86a" /><polygon points="8,6 12,1 16,6" fill="#b8965a" /><polygon points="20,6 25,2 30,6" fill="#b8965a" /></svg>
      </div>
      {/* pillar of cloud/fire (toggle) */}
      <div className="prop toy brightflick" style={{ left: '47%', top: '8%', width: 46, height: 110 }} onClick={(e) => { e.stopPropagation(); setFire((v) => !v); }} title="pillar of cloud / fire">
        <div style={{ position: 'absolute', inset: 0, borderRadius: '40% 40% 45% 45%', filter: 'blur(1px)', background: fire ? 'radial-gradient(circle at 50% 70%,#fff3cf,#f0a63c 55%,#a8461c 85%,transparent)' : 'radial-gradient(circle at 50% 40%,#f2eede,#e8e2d0 60%,transparent)', boxShadow: fire ? '0 0 20px 6px rgba(240,166,60,.45)' : '0 0 16px 4px rgba(232,226,208,.35)' }} />
      </div>
      {/* staff on near bank (easter egg) */}
      <div className="prop" style={{ left: '6%', top: '66%', width: 8, height: 70 }}><svg width="8" height="70"><rect x="3" y="0" width="3" height="70" fill="#5a3d22" /></svg></div>
    </>
  );
}

function BabylonScene() {
  const [furn, setFurn] = useState(false);
  const [harp, setHarp] = useState(false);
  return (
    <>
      {/* Ziggurat with brazier flames */}
      <div className="prop" style={{ left: '8%', top: '16%', width: 200, height: 130 }}>
        <svg width="200" height="130">
          <polygon points="10,130 190,130 170,96 30,96" fill="#5a4a3a" />
          <polygon points="34,96 166,96 150,64 50,64" fill="#6a5a4a" />
          <polygon points="56,64 144,64 130,36 70,36" fill="#5a4a3a" />
          <path d="M30,96 q-8,20 -2,34" stroke="#4a6a4a" strokeWidth="6" fill="none" opacity=".8" />
          <path d="M170,96 q8,20 2,34" stroke="#4a6a4a" strokeWidth="6" fill="none" opacity=".8" />
        </svg>
        {[[44, 92], [150, 92], [72, 60], [124, 60]].map(([x, y], i) => (
          <span key={i} className="flame" style={{ position: 'absolute', left: x, top: y, width: 10, height: 16, animationDelay: `${i * 0.3}s` }} />
        ))}
      </div>
      {/* river along seam (static; motions are the flames + harps) */}
      <div className="prop water" style={{ left: 0, top: '47%', width: '100%', height: '5%', ['--w-top' as string]: '#1a2436', ['--w-bot' as string]: '#0e1626' }} />
      {/* willow + hung harps */}
      <div className="prop toy" style={{ left: '84%', top: '40%', width: 90, height: 140 }} onClick={(e) => { e.stopPropagation(); setHarp((v) => !v); }} title="we hung our harps">
        <svg width="90" height="140">
          <path d="M40,0 Q20,40 24,80 M40,0 Q60,44 58,88 M40,0 Q40,50 40,92" stroke="#4a6a4a" strokeWidth="3" fill="none" opacity=".85" />
        </svg>
        <div className={`sway${harp ? '' : ' s2'}`} style={{ position: 'absolute', left: 20, top: 70, animationDuration: harp ? '3s' : '8s' }}>
          <svg width="18" height="26"><path d="M2,2 Q16,4 14,24 M2,2 L2,24 M6,4 L6,22 M10,5 L10,22" stroke="#c9a24b" strokeWidth="1.5" fill="none" /></svg>
        </div>
      </div>
      {/* furnace with three silhouettes */}
      <div className="prop toy" style={{ left: '4%', top: '62%', width: 60, height: 60, filter: `brightness(${furn ? 1.25 : 1})`, transition: 'filter 1.2s' }} onClick={(e) => { e.stopPropagation(); setFurn(true); setTimeout(() => setFurn(false), 1200); }} title="the fiery furnace">
        <div className="flame" style={{ position: 'absolute', left: 8, top: furn ? 0 : 8, width: 44, height: 52, background: 'radial-gradient(circle at 50% 70%,#fff3cf,#f0a63c 45%,#ff6a3c 80%,transparent)', transition: 'top .4s' }} />
        {/* the three stand unharmed — they brighten as the flames rise, never consumed (Daniel 3) */}
        <svg width="60" height="60" style={{ position: 'absolute', inset: 0 }}>{[20, 30, 40].map((x, i) => <rect key={i} x={x} y="30" width="4" height="24" rx="2" fill={furn ? '#e9d9b0' : '#3a2a18'} opacity={furn ? .95 : .7} style={{ transition: 'fill .4s, opacity .4s' }} />)}</svg>
      </div>
      {/* writing on the wall (easter egg) */}
      <div className="prop faintpulse" style={{ left: '62%', top: '20%', width: 120, height: 18 }}>
        <svg width="120" height="18"><text x="0" y="13" fontSize="10" fill="#cfe4ea" opacity=".6" letterSpacing="2">MENE MENE TEKEL</text></svg>
      </div>
      {/* lion's den */}
      <div className="prop" style={{ left: '90%', top: '60%', width: 40, height: 30 }}>
        <svg width="40" height="30"><ellipse cx="20" cy="20" rx="18" ry="9" fill="rgba(10,8,16,.7)" /><circle cx="14" cy="18" r="1.6" fill="#f0a63c" /><circle cx="24" cy="18" r="1.6" fill="#f0a63c" /></svg>
      </div>
    </>
  );
}

function Scene({ id, goliath }: { id: BoardId; goliath: boolean }) {
  switch (id) {
    case 'eden': return <EdenScene />;
    case 'redsea': return <RedSeaScene />;
    case 'babylon': return <BabylonScene />;
    case 'elah': default: return <ElahScene goliath={goliath} />;
  }
}

// ---- the board ------------------------------------------------------------
export function Board({ enc, danger, flare, goliath }:
  { enc?: string; danger: number; flare: number; goliath: boolean }) {
  const id = boardForEncounter(enc);
  const t = BOARDS[id];
  const style = {
    '--danger': danger, '--flare': flare,
    '--danger-tint': t.dangerTint, '--flare-tint': t.flareTint,
  } as CSS;
  return (
    <div className={`boardScene board-${id}${goliath ? ' goliath-present' : ''}`} style={style}>
      <div className="board-backdrop" style={{ background: t.backdrop }} />
      <div className="board-props">
        <Scene id={id} goliath={goliath} />
      </div>
      <div className="board-grain" />
      {/* motes live outside the filtered props layer and above the blended grain,
          so their per-frame animation never re-composites those static effects */}
      <div className="board-motes"><MoteField cfg={t.motes} /></div>
      <div className="board-scrim" />
      <div className="board-reactive"><div className="danger" /><div className="flare" /></div>
    </div>
  );
}
