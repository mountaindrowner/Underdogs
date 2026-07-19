/** The pack-opening cinematic (docs/21 §3 — "the ritual, not a list reveal").
 *  Staged: a ray from heaven → the pack falls and LANDS (thud, dust, shake) →
 *  tap to break the seal → it shudders, light leaks from the cracks → BURSTS
 *  open → cards fly out face-down and reveal one by one, ranked worst-to-best
 *  so the last flip is always the big one. Rare+ faces carry a pointer-tilt
 *  holographic sheen. Escalating stings per rarity; the Legendary gets a
 *  held-breath tease, a dimmed screen, and a gold pillar.
 *
 *  Reused by the Storehouse (real packs) and the Pack Lab (?pack=1 dev kit,
 *  simulated packs) — identical spectacle either way. */
import { useCallback, useEffect, useRef, useState } from 'react';
import { artUrl, CARD_BACK } from './data.ts';
import { sfx } from './sfx.ts';
import { haptics } from './haptics.ts';
import { music } from './audio.ts';
import { fitName } from './fit.ts';
import type { PackCard } from './economy.ts';

const RANK: Record<string, number> = { common: 0, rare: 1, epic: 2, legendary: 3 };
const STING: Record<string, string> = { common: 'select', rare: 'buff', epic: 'notify', legendary: 'drawBig' };

// ---- tiny WebAudio layer — cinematic-only cues the SFX library lacks --------
let AC: AudioContext | null = null;
function actx(): AudioContext | null {
  if (music.isMuted() || typeof AudioContext === 'undefined') return null;
  try {
    AC ??= new AudioContext();
    if (AC.state === 'suspended') void AC.resume();
    return AC;
  } catch { return null; }
}
function tone(c: AudioContext, t0: number, dur: number, peak: number,
  type: OscillatorType, f0: number, f1?: number, attack = 0.02) {
  const o = c.createOscillator(); const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f0, t0);
  if (f1 != null) o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t0 + dur * 0.9);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(peak, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g); g.connect(c.destination);
  o.start(t0); o.stop(t0 + dur + 0.05);
}
const cue = {
  /** the pack hits the ground */
  thud() { const c = actx(); if (!c) return; const t = c.currentTime;
    tone(c, t, 0.3, 0.5, 'sine', 120, 36, 0.004); tone(c, t, 0.12, 0.12, 'triangle', 70, 44, 0.004); },
  /** the shaking pack — a low swelling growl */
  rumble(dur = 1.35) { const c = actx(); if (!c) return; const t = c.currentTime;
    tone(c, t, dur, 0.2, 'sawtooth', 36, 52, dur * 0.6); tone(c, t, dur, 0.12, 'sine', 30, 46, dur * 0.6); },
  /** held-breath riser before a big flip */
  riser(dur = 0.85) { const c = actx(); if (!c) return; const t = c.currentTime;
    tone(c, t, dur, 0.14, 'sine', 220, 1240, dur * 0.75); },
  /** the pack explodes open */
  burst() { const c = actx(); if (!c) return; const t = c.currentTime;
    tone(c, t, 0.45, 0.35, 'triangle', 560, 70, 0.004); tone(c, t, 0.35, 0.14, 'square', 180, 40, 0.004);
    tone(c, t + 0.03, 0.5, 0.1, 'sine', 1320, 2200, 0.01); },
  /** legendary sparkle — a rising major-ish arpeggio */
  shimmer() { const c = actx(); if (!c) return; const t = c.currentTime;
    [880, 1174.66, 1567.98, 2093].forEach((f, i) => tone(c, t + i * 0.09, 0.5, 0.11, 'sine', f)); },
};

type Phase = 'descend' | 'sealed' | 'shake' | 'burst' | 'reveal';

export function PackRitual({ cards, onDone }: { cards: PackCard[]; onDone: () => void }) {
  // display + reveal order: worst → best, so the last flip is the payoff
  const order = useRef([...cards].sort((a, b) =>
    (RANK[a.card.rarity ?? 'common'] ?? 0) - (RANK[b.card.rarity ?? 'common'] ?? 0))).current;
  const [phase, setPhase] = useState<Phase>('descend');
  const [landed, setLanded] = useState(false);
  const [flipped, setFlipped] = useState(0);
  const [teasing, setTeasing] = useState(false);       // legendary held breath
  const [legendMoment, setLegendMoment] = useState(false);
  const [auto, setAuto] = useState(false);
  const busy = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const later = (fn: () => void, ms: number) => { timers.current.push(setTimeout(fn, ms)); };
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // phase 1: the descent — ray from heaven, the pack falls, LANDS
  useEffect(() => {
    later(() => { setLanded(true); cue.thud(); sfx.play('play'); haptics.hit(8); }, 1000);
    later(() => setPhase('sealed'), 1900);
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  const breakSeal = () => {
    if (phase !== 'sealed') return;
    setPhase('shake');
    cue.rumble(1.35); sfx.play('debuff'); haptics.fulfill();
    later(() => {
      setPhase('burst');
      cue.burst(); sfx.play('mulligan'); haptics.victory();
    }, 1350);
    later(() => { setPhase('reveal'); sfx.play('shuffle'); }, 2050);
  };

  const allFlipped = flipped >= order.length;
  const flippedRef = useRef(0);
  const autoRef = useRef(false);
  const flipNextRef = useRef<() => void>(() => {});

  const doFlip = useCallback((idx: number) => {
    const p = order[idx];
    const rar = p.card.rarity ?? 'common';
    flippedRef.current = idx + 1;
    setFlipped(idx + 1);
    setTeasing(false);
    sfx.play(STING[rar] ?? 'select');
    if (rar === 'legendary') { cue.shimmer(); haptics.victory(); later(() => setLegendMoment(false), 1400); }
    else if (rar === 'epic') haptics.fulfill();
    later(() => {
      busy.current = false;
      // unattended reveal continues itself (still one at a time — the escalation IS the point)
      if (autoRef.current && flippedRef.current < order.length) later(() => flipNextRef.current(), 320);
    }, rar === 'legendary' ? 950 : 380);
  }, [order]);  // eslint-disable-line react-hooks/exhaustive-deps

  const flipNext = useCallback(() => {
    if (busy.current || phase !== 'reveal') return;
    const f = flippedRef.current;
    if (f >= order.length) return;
    busy.current = true;
    const rar = order[f].card.rarity ?? 'common';
    if (rar === 'legendary') {
      // the held breath: dim the world, raise the beam, THEN turn it
      setLegendMoment(true); setTeasing(true);
      cue.riser(0.9); sfx.play('notify');
      later(() => doFlip(f), 950);
      return;
    }
    doFlip(f);
  }, [phase, order, doFlip]);  // eslint-disable-line react-hooks/exhaustive-deps
  flipNextRef.current = flipNext;

  const startAuto = () => {
    autoRef.current = true; setAuto(true);
    if (!busy.current) flipNext();
  };

  const newCount = order.filter((p) => p.isNew).length;
  const fragSum = order.reduce((n, p) => n + p.frags, 0);

  return (
    <div className={`ritual v2 ph-${phase}${legendMoment ? ' legendMoment' : ''}`}
      onPointerDown={(e) => e.stopPropagation()}>
      <div className="godray" />
      <div className="rayMotes">{Array.from({ length: 10 }, (_, i) => <i key={i} style={{ ['--i' as string]: i } as React.CSSProperties} />)}</div>

      {(phase === 'descend' || phase === 'sealed' || phase === 'shake') && (
        <div className={`packWrap${landed ? ' landed' : ''}`}
          onClick={breakSeal} role="button" aria-label="Break the seal">
          <div className="packBody">
            <div className="packFace" style={{ backgroundImage: `url(${CARD_BACK})` }} />
            <div className="packSheen" />
            <div className="packCracks"><span /><span /><span /><span /></div>
            <div className="packSeal">✠</div>
          </div>
          <div className="dustRing" />
          <div className="dustKick">{Array.from({ length: 8 }, (_, i) => <i key={i} style={{ ['--i' as string]: i } as React.CSSProperties} />)}</div>
          {phase === 'sealed' && <div className="sealHint">Break the seal</div>}
        </div>
      )}

      {phase === 'burst' && (
        <div className="burstWrap">
          <div className="burstFlash" />
          <div className="burstStar">{Array.from({ length: 14 }, (_, i) => <i key={i} style={{ ['--a' as string]: `${(360 / 14) * i}deg`, ['--i' as string]: i } as React.CSSProperties} />)}</div>
        </div>
      )}

      {phase === 'reveal' && (
        <>
          <div className="ritualFan" onClick={() => { if (!auto) flipNext(); }}>
            {order.map((p, i) => (
              <RitCard key={i} p={p} i={i}
                flipped={i < flipped}
                armed={i === flipped && !allFlipped}
                teasing={teasing && i === flipped} />
            ))}
          </div>
          {!allFlipped && flipped === 0 && <div className="ritHint">Tap a card — best for last</div>}
          <div className="ritualBtns">
            {!allFlipped && flipped > 0 && !auto &&
              <button className="bigbtn quiet" onClick={startAuto}>Reveal the rest</button>}
            {allFlipped && (
              <div className="ritSummary">
                <span>{newCount > 0 ? `${newCount} new` : 'no new cards'}{fragSum > 0 ? ` · +${fragSum} ✦` : ''}</span>
                <button className="bigbtn" onClick={onDone}>Gather them up</button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/** One card in the fan — face-down until its turn; holographic tilt once shown. */
function RitCard({ p, i, flipped, armed, teasing }:
  { p: PackCard; i: number; flipped: boolean; armed: boolean; teasing: boolean }) {
  const el = useRef<HTMLDivElement>(null);
  const rar = p.card.rarity ?? 'common';
  const art = artUrl(p.card.id);

  // pointer-tilt + moving holo sheen (rare+ only, once revealed)
  const tilt = (e: React.PointerEvent) => {
    const n = el.current; if (!n || !flipped) return;
    const r = n.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    n.style.setProperty('--rx', `${(x * 14).toFixed(2)}deg`);
    n.style.setProperty('--ry', `${(-y * 12).toFixed(2)}deg`);
    n.style.setProperty('--hx', `${(x * 100 + 50).toFixed(1)}%`);
  };
  const untilt = () => {
    const n = el.current; if (!n) return;
    n.style.setProperty('--rx', '0deg'); n.style.setProperty('--ry', '0deg');
  };

  return (
    <div ref={el}
      className={`ritCard r-${rar}${flipped ? ' flipped' : ''}${armed ? ' armed' : ''}${teasing ? ' teasing' : ''}`}
      style={{ ['--i' as string]: i } as React.CSSProperties}
      onPointerMove={tilt} onPointerLeave={untilt}>
      <div className="ritInner">
        <div className="ritBack" style={{ backgroundImage: `url(${CARD_BACK})` }}>
          <div className="ritGlow" />
        </div>
        <div className="ritFace">
          <div className="ritArt" style={art ? { backgroundImage: `url(${art})` } : undefined} />
          {(rar === 'rare' || rar === 'epic' || rar === 'legendary') && <div className="ritHolo" />}
          <div className={`ritName${fitName(p.card.name)}`}>{p.card.name}</div>
          {p.card.type === 'minion' && (
            <div className="ritStats"><span>{p.card.attack}</span><span>{p.card.health}</span></div>
          )}
          {p.isNew && <div className="ritNew">NEW</div>}
          {p.dupe && <div className="ritDupe">+{p.frags} ✦</div>}
        </div>
      </div>
    </div>
  );
}
