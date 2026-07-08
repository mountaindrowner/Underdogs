import { useEffect, useRef, useState } from 'react';
import { useMatch, needsTarget } from './useMatch.ts';
import { artUrl, CARD_BACK, registry } from './data.ts';
import { encounters, toMatchConfig, SANDBOX, completed, markComplete,
  type Encounter, type MatchConfig } from './campaign.ts';
import type { VUnit, HeroV, Prov } from './view.ts';
import { effAttack, type CardDef } from '../../engine/src/index.ts';
import { KW_LABEL } from './glossary.ts';
import { CardPreview } from './CardPreview.tsx';
import { Board } from './board/Board.tsx';
import { music } from './audio.ts';
import { MusicToggle } from './MusicToggle.tsx';
import { Title } from './title/Title.tsx';
import { MainMenu } from './title/MainMenu.tsx';
import { ShellBg, chooseScene, type SceneId } from './title/scenes.tsx';
import './styles.css';

const REDUCED = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

type SrcHand = { kind: 'hand'; index: number; card: CardDef };
type Src = SrcHand | { kind: 'attacker'; uid: number } | { kind: 'heropower' };
type Act = { src: Src; from: { x: number; y: number }; ptr: { x: number; y: number };
  dragging: boolean; tilt: number; needsTgt: boolean };
type Drop = { kind: 'none' | 'board' | 'foeHero' } | { kind: 'unit'; uid: number; owner: number };

const needsTargetPower = (hp?: { effects?: { target?: string }[] }) =>
  !!hp?.effects?.some((op) => op.target === 'target');

function dropAt(x: number, y: number): Drop {
  const el = document.elementFromPoint(x, y);
  const hit = el && (el as HTMLElement).closest('[data-drop]');
  if (!hit) return { kind: 'none' };
  const kind = hit.getAttribute('data-drop')!;
  if (kind === 'unit') return { kind: 'unit', uid: Number(hit.getAttribute('data-uid')), owner: Number(hit.getAttribute('data-owner')) };
  return { kind: kind as 'board' | 'foeHero' };
}

// ---- presentational pieces -------------------------------------------------
function Minion({ u, cls, valid, onDown, onEnter, onLeave }:
  { u: VUnit; cls: string; valid?: boolean;
    onDown?: (e: React.PointerEvent) => void; onEnter?: () => void; onLeave?: () => void }) {
  const art = artUrl(u.defId);
  const kw = u.keywords.find((k) => KW_LABEL[k]);
  const rarity = registry.get(u.defId)?.rarity ?? 'common';
  const c = ['minion', `r-${rarity}`, cls];
  if (u.dead) c.push('dead'); if (u.enter) c.push('enter'); if (u.fulfilling) c.push('fulfilling');
  if (u.hit) c.push('hit'); if (u.buffed) c.push('buffed'); if (valid) c.push('validTgt');
  const style = u.lunge ? { transform: `translateY(${u.lunge * 18}px) scale(1.06)` } : undefined;
  return (
    <div className={c.join(' ')} style={style} onPointerDown={onDown}
      onMouseEnter={onEnter} onMouseLeave={onLeave}
      data-drop="unit" data-uid={u.uid} data-owner={u.owner}>
      {u.keywords.includes('guard') && <div className="ward" />}
      <div className="body">
        <div className="mFace" style={art ? { backgroundImage: `url(${art})` } : undefined}>
          {!art && <div className="artFallback">{u.name[0]}</div>}
          <div className="nameband">{u.name}</div>
          {kw && <div className="kw">{KW_LABEL[kw].toUpperCase()}</div>}
        </div>
      </div>
      <div className="atk">{u.attack}</div><div className="hp">{u.health}</div>
      {u.dmg != null && <div className="float dmg">-{u.dmg}</div>}
      {u.heal != null && <div className="float heal">+{u.heal}</div>}
      {u.endure && <div className="shield" />}{u.fulfilling && <div className="burst" />}
    </div>
  );
}

function HandCard({ c, playable, selected, fan, onDown, onEnter, onLeave }:
  { c: CardDef; playable: boolean; selected: boolean; fan: { rot: number; ty: number };
    onDown: (e: React.PointerEvent) => void; onEnter: () => void; onLeave: () => void }) {
  const art = artUrl(c.id);
  const style = { '--rot': `${fan.rot}deg`, '--ty': `${fan.ty}px` } as React.CSSProperties;
  return (
    <div className={`handcard r-${c.rarity ?? 'common'}${playable ? ' playable' : ''}${selected ? ' selected' : ''}`}
      style={style} onPointerDown={onDown} onMouseEnter={onEnter} onMouseLeave={onLeave}>
      <div className="hcInner"><div className="hcFace">
        <div className="hcArt" style={art ? { backgroundImage: `url(${art})` } : undefined} />
        <div className="hcName">{c.name}</div>
      </div></div>
      <div className="hcCost">{c.cost ?? 0}</div>
      {c.type === 'minion' && <><div className="hcAtk">{c.attack}</div><div className="hcHp">{c.health}</div></>}
    </div>
  );
}

function ProvisionRail({ p, side }: { p: Prov; side: 'you' | 'foe' }) {
  return (
    <div className={`provRail ${side}`}>
      {Array.from({ length: Math.max(p.max, 1) }).map((_, i) => (
        <span key={i} className={`drop${i < p.cur ? ' on' : ''}`} />
      ))}
      <span className="provNum">{p.cur}/{p.max}</span>
    </div>
  );
}

// A dimensional deck pile: a stack of card-backs whose visible thickness
// tracks the count. Hover to highlight and read the exact number remaining.
function Deck({ n, side }: { n: number; side: 'you' | 'foe' }) {
  const layers = Math.min(7, Math.max(1, Math.ceil(n / 5)));
  return (
    <div className={`deck ${side}`} title={`${n} cards left in deck`}>
      <div className="deckStack">
        {Array.from({ length: layers }).map((_, i) => (
          <img key={i} src={CARD_BACK} alt="" style={{ '--i': i } as React.CSSProperties} />
        ))}
        <span className="deckCount">{n}</span>
      </div>
      <div className="deckReadout">{n} <small>in deck</small></div>
    </div>
  );
}

function HeroCorner({ h, side, name, art, prov, deck, targetable, foe, children, onDown }:
  { h: HeroV; side: 'you' | 'foe'; name: string; art?: string; prov: Prov; deck: number;
    targetable?: boolean; foe?: boolean; children?: React.ReactNode; onDown?: (e: React.PointerEvent) => void }) {
  return (
    <div className={`corner ${side}Corner`}>
      <div className={`hero ${side}${h.shake ? ' shake' : ''}${targetable ? ' foeTarget' : ''}`}
        onPointerDown={onDown} data-drop={foe ? 'foeHero' : undefined}>
        <div className="portrait" style={art ? { backgroundImage: `url(${art})` } : undefined} />
        <div className="hpbadge">{h.hp}</div>
        {h.dmg != null && <div className="float dmg heroFloat">-{h.dmg}</div>}
        {h.heal != null && <div className="float heal heroFloat">+{h.heal}</div>}
      </div>
      <div className="cornerMeta">
        <div className="namep">{name}</div>
        <ProvisionRail p={prov} side={side} />
      </div>
      <Deck n={deck} side={side} />
      {children}
    </div>
  );
}

// optional ?scene= override lets any board scene be previewed in free play
const sceneOverride = typeof location !== 'undefined'
  ? (new URLSearchParams(location.search).get('scene') ?? undefined) : undefined;

const BOARD_STYLES = ['relief', 'timber', 'flat'] as const;
type BoardStyle = typeof BOARD_STYLES[number];
const BOARD_LABEL: Record<BoardStyle, string> = { relief: 'Carved Stone', timber: 'Tavern Timber', flat: 'Flat' };

// ---- battle ----------------------------------------------------------------
function Battle({ cfg, meta, onExit }: { cfg: MatchConfig; meta?: Encounter; onExit: () => void }) {
  const { engine, view, busy, canAct, inMulligan, dispatch, newGame } = useMatch(cfg);
  const [act, setAct] = useState<Act | null>(null);
  const [hover, setHover] = useState<CardDef | null>(null);
  const [keep, setKeep] = useState<Set<number>>(new Set([0, 1, 2, 3]));
  const [intro, setIntro] = useState(!!meta);
  const [board, setBoard] = useState<BoardStyle>(() => {
    const s = localStorage.getItem('underdogs.board');
    return (BOARD_STYLES as readonly string[]).includes(s ?? '') ? (s as BoardStyle) : 'relief';
  });
  const cycleBoard = () => setBoard((b) => {
    const next = BOARD_STYLES[(BOARD_STYLES.indexOf(b) + 1) % BOARD_STYLES.length];
    try { localStorage.setItem('underdogs.board', next); } catch { /* ignore */ }
    return next;
  });
  const [flare, setFlare] = useState(0);
  const tiltReset = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastX = useRef(0);
  const flareLatch = useRef(false);
  const flareTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // signature-moment flare: on entering a Fulfill morph or a victory, hold
  // --flare at 1 long enough for the .9s CSS ramp to bloom, then ease it out.
  // Edge-triggered (latch) so it fires once and the timer isn't torn down by
  // the per-beat view churn — otherwise the bloom stays invisible or sticks on.
  useEffect(() => {
    const fulfilling = view.boards[0].some((u) => u.fulfilling) || view.boards[1].some((u) => u.fulfilling);
    const should = fulfilling || view.over === 0;
    if (should && !flareLatch.current) {
      flareLatch.current = true;
      setFlare(1);
      if (flareTimer.current) clearTimeout(flareTimer.current);
      flareTimer.current = setTimeout(() => setFlare(0), 850);
    } else if (!should) {
      flareLatch.current = false;
    }
  }, [view]);
  useEffect(() => () => { if (flareTimer.current) clearTimeout(flareTimer.current); }, []);

  // ---- global pointer handling for the active grab -------------------------
  useEffect(() => {
    if (!act) return;
    const move = (e: PointerEvent) => {
      const ptr = { x: e.clientX, y: e.clientY };
      setAct((a) => {
        if (!a) return a;
        const moved = Math.hypot(ptr.x - a.from.x, ptr.y - a.from.y) > 10;
        const dragging = a.dragging || moved;
        let tilt = a.tilt;
        if (dragging && !REDUCED) {
          tilt = Math.max(-16, Math.min(16, (ptr.x - lastX.current) * 0.9));
          if (tiltReset.current) clearTimeout(tiltReset.current);
          tiltReset.current = setTimeout(() => setAct((z) => (z ? { ...z, tilt: 0 } : z)), 90);
        }
        lastX.current = ptr.x;
        return { ...a, ptr, dragging, tilt };
      });
    };
    const up = (e: PointerEvent) => {
      setAct((a) => {
        if (!a) return a;
        if (a.dragging) { resolve(a.src, dropAt(e.clientX, e.clientY)); return null; }
        return a; // tap: stay "picked up" for tap-to-place
      });
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [act?.src]);

  if (!engine) return <div className="app"><div className="brand">UNDERDOGS</div></div>;
  const you = engine.players[0];
  const foe = engine.players[1];
  const readyUids = new Set(you.board.filter((u) => u.ready && u.attacksThisTurn < 1 && effAttack(u) > 0).map((u) => u.uid));
  const guardActive = foe.board.some((u) => u.keywords.includes('guard'));
  const over = engine.phase === 'over';
  const won = over && engine.winner === 0;
  if (won && meta) markComplete(meta.id);
  // reactive board signal: your peril (0 at >=33% HP, 1 at 0 HP)
  const hpFrac = view.heroes[0].hp / Math.max(1, view.heroes[0].maxHp);
  const dangerLevel = Math.max(0, Math.min(1, (0.33 - hpFrac) / 0.33));

  const clear = () => { setAct(null); if (holdTimer.current) clearTimeout(holdTimer.current); };

  function center(e: React.PointerEvent) {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }
  function beginGrab(src: Src, e: React.PointerEvent, needsTgt: boolean) {
    e.stopPropagation();
    const from = center(e);
    lastX.current = e.clientX;
    setAct({ src, from, ptr: { x: e.clientX, y: e.clientY }, dragging: false, tilt: 0, needsTgt });
    if (holdTimer.current) clearTimeout(holdTimer.current);
    holdTimer.current = setTimeout(() => setAct((a) => (a && !a.dragging ? { ...a, dragging: true } : a)), 170);
  }

  // resolve a placement/attack given the source and where it landed
  function resolve(src: Src, drop: Drop) {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    if (src.kind === 'hand') {
      const card = src.card;
      if (needsTarget(card)) {
        if (drop.kind === 'unit') dispatch({ type: 'PLAY_CARD', handIndex: src.index, targetUid: drop.uid });
      } else if (drop.kind === 'board' || drop.kind === 'unit') {
        dispatch({ type: 'PLAY_CARD', handIndex: src.index });
      }
    } else if (src.kind === 'attacker') {
      if (drop.kind === 'unit' && drop.owner === 1 && (!guardActive || view.boards[1].find((u) => u.uid === drop.uid)?.keywords.includes('guard')))
        dispatch({ type: 'ATTACK', attackerUid: src.uid, targetUid: drop.uid });
      else if (drop.kind === 'foeHero' && !guardActive)
        dispatch({ type: 'ATTACK', attackerUid: src.uid, targetUid: 'hero' });
    } else if (src.kind === 'heropower') {
      if (drop.kind === 'unit') dispatch({ type: 'HERO_POWER', targetUid: drop.uid });
    }
    setAct(null);
  }

  // pointer-down entry points -------------------------------------------------
  const handDown = (i: number, e: React.PointerEvent) => {
    if (!canAct) { setHover(you.hand[i]); return; }
    if (act && !act.dragging) { resolve(act.src, { kind: 'none' }); return; } // second tap on hand cancels
    const card = you.hand[i];
    const affordable = (card.cost ?? 0) <= you.provision &&
      !(card.type === 'minion' && you.board.length >= engine.rules.boardLimit);
    if (!affordable) { setHover(card); return; }
    beginGrab({ kind: 'hand', index: i, card }, e, needsTarget(card));
  };
  const unitDown = (u: VUnit, e: React.PointerEvent) => {
    if (act && !act.dragging) { e.stopPropagation(); resolve(act.src, { kind: 'unit', uid: u.uid, owner: u.owner }); return; }
    if (canAct && u.owner === 0 && readyUids.has(u.uid)) beginGrab({ kind: 'attacker', uid: u.uid }, e, true);
  };
  const foeHeroDown = (e: React.PointerEvent) => {
    if (act && !act.dragging) { e.stopPropagation(); resolve(act.src, { kind: 'foeHero' }); }
  };
  const hpwr = you.heroPower;
  const hpUsable = canAct && !!hpwr && you.provision >= hpwr.cost && !hpwr.usedThisTurn;
  const heroPowerDown = (e: React.PointerEvent) => {
    if (!hpUsable || !hpwr) return;
    if (needsTargetPower(hpwr)) beginGrab({ kind: 'heropower' }, e, true);
    else { dispatch({ type: 'HERO_POWER' }); clear(); }
  };

  // which things are valid targets for the current grab (highlight/dim) -------
  const aiming = !!act && (act.needsTgt || act.src.kind === 'attacker' || act.src.kind === 'heropower');
  const validUnit = (u: VUnit): boolean => {
    if (!act) return false;
    if (act.src.kind === 'attacker') return u.owner === 1 && (!guardActive || u.keywords.includes('guard'));
    if (act.src.kind === 'heropower') return true;
    if (act.src.kind === 'hand') return act.needsTgt;
    return false;
  };
  const foeHeroTarget = !!act && act.src.kind === 'attacker' && !guardActive;
  const boardOpen = !!act && act.src.kind === 'hand' && !act.needsTgt;

  const previewCard = (act?.src.kind === 'hand' ? act.src.card : null) ?? hover;

  // ---- gated screens --------------------------------------------------------
  if (intro && meta) {
    return (
      <div className="app">
        <div className="topbar"><div className="brand">UNDERDOGS <span>· {meta.subtitle}</span></div>
          <button onClick={onExit}>Menu</button></div>
        <div className="intro">
          <div className="introArt" style={{ backgroundImage: `url(${artUrl(meta.art)})` }} />
          <h1>{meta.title}</h1>
          <p className="narr">{meta.narrative}</p>
          <p className="tip">{meta.tip}</p>
          <button className="bigbtn" onClick={() => setIntro(false)}>Begin the Battle</button>
        </div>
      </div>
    );
  }
  if (inMulligan) {
    return (
      <div className="app">
        <div className="topbar"><div className="brand">UNDERDOGS <span>· casting lots</span></div>
          <button onClick={onExit}>Menu</button></div>
        <div className="mulligan">
          <h2>Keep your opening hand?</h2>
          <div className="mulHand">
            {you.hand.map((c, i) => (
              <div key={i} className={`mulCard${keep.has(i) ? ' keep' : ''}`}
                onClick={() => setKeep((k) => { const n = new Set(k); n.has(i) ? n.delete(i) : n.add(i); return n; })}>
                <div className={`handcard big r-${c.rarity ?? 'common'}`}>
                  <div className="hcInner"><div className="hcFace">
                    <div className="hcArt" style={artUrl(c.id) ? { backgroundImage: `url(${artUrl(c.id)})` } : undefined} />
                    <div className="hcName">{c.name}</div>
                  </div></div>
                  <div className="hcCost">{c.cost ?? 0}</div>
                  {c.type === 'minion' && <><div className="hcAtk">{c.attack}</div><div className="hcHp">{c.health}</div></>}
                </div>
                <div className="mulTag">{keep.has(i) ? 'KEEP' : 'REPLACE'}</div>
              </div>
            ))}
          </div>
          <button className="bigbtn" onClick={() => dispatch({ type: 'MULLIGAN', keep: [...keep].filter((i) => i < you.hand.length) })}>Cast Lots</button>
        </div>
      </div>
    );
  }

  const n = you.hand.length;
  return (
    <div className="app" onPointerDown={() => { if (act && !act.dragging) clear(); }}>
      <div className="topbar">
        <div className="brand">UNDERDOGS <span>· {meta ? meta.title : 'free play'}</span></div>
        <div className="controls">
          <span className="turnLbl">Turn {view.turn} · {view.active === 0 ? 'Your turn' : 'Adversary'}</span>
          <MusicToggle />
          <button className="boardBtn" onPointerDown={(e) => e.stopPropagation()} onClick={cycleBoard}
            title="Change board look">◈ {BOARD_LABEL[board]}</button>
          <button onPointerDown={(e) => e.stopPropagation()} onClick={onExit}>Menu</button>
        </div>
      </div>

      <div className={`table${over ? ' ended' : ''}${aiming ? ' aiming' : ''}`} data-board={board}>
        {/* L0–L3 — the board diorama (per-chapter scene, dim and behind cards) */}
        <Board enc={sceneOverride ?? meta?.id} danger={dangerLevel} flare={flare}
          goliath={foe.board.some((u) => u.defId === 'goliath_of_gath')}
          enemyLow={view.heroes[1].hp / Math.max(1, view.heroes[1].maxHp) < 0.33} />
        {/* L1 stage — zone plate (consistent carved trays) */}
        <div className="plate">
          <div className="tray foeTray" /><div className="tray youTray" /><div className="centerStrip" />
        </div>
        {/* ornate stage frame, painted over the edges (no input) */}
        <div className="frame" />

        {/* L3 — board objects */}
        <div className={`boardRow enemy${view.heroes[1].shake ? ' shake' : ''}`}>
          {view.boards[1].map((u) => (
            <Minion key={u.uid} u={u} valid={aiming && validUnit(u)}
              cls={aiming && !validUnit(u) ? 'dim' : ''}
              onDown={(e) => unitDown(u, e)}
              onEnter={() => setHover(defOf(u.defId))} onLeave={() => setHover(null)} />
          ))}
        </div>
        <div className={`boardRow you${view.heroes[0].shake ? ' shake' : ''}${boardOpen ? ' open' : ''}`} data-drop="board"
          onPointerDown={(e) => { if (act && !act.dragging && act.src.kind === 'hand' && !act.needsTgt) { e.stopPropagation(); resolve(act.src, { kind: 'board' }); } }}>
          {view.boards[0].map((u) => (
            <Minion key={u.uid} u={u} valid={aiming && validUnit(u)}
              cls={[readyUids.has(u.uid) ? 'ready' : (u.owner === 0 ? 'sick' : ''),
                act?.src.kind === 'attacker' && act.src.uid === u.uid ? 'sel' : '',
                aiming && !validUnit(u) && !(act?.src.kind === 'attacker' && act.src.uid === u.uid) ? 'dim' : ''].join(' ')}
              onDown={(e) => unitDown(u, e)}
              onEnter={() => setHover(defOf(u.defId))} onLeave={() => setHover(null)} />
          ))}
        </div>

        {/* L2 — HUD: hero corners (opponent top-right, you bottom-left) */}
        <HeroCorner h={view.heroes[1]} side="foe" name={meta ? 'Adversary' : 'Rival'}
          art={artUrl(foe.leaderId ?? (cfg.startUnits?.[1]?.[0] ?? ''))}
          prov={view.prov[1]} deck={foe.deck.length} foe targetable={foeHeroTarget} onDown={foeHeroDown} />
        <HeroCorner h={view.heroes[0]} side="you" name="You" art={artUrl(you.leaderId ?? '')}
          prov={view.prov[0]} deck={you.deck.length}>
          {hpwr && (
            <div className={`hpower${hpUsable ? ' usable' : ''}`} onPointerDown={heroPowerDown} title={hpwr.text}>
              <div className="hpGlyph">✦</div><div className="hpCost">{hpwr.cost}</div>
              <div className="hpLabel">{hpwr.name}</div>
            </div>
          )}
        </HeroCorner>

        {/* opponent face-down hand, top-center */}
        <div className="foeHand">{Array.from({ length: foe.hand.length }).map((_, i) => <img key={i} src={CARD_BACK} alt="" />)}</div>

        {/* your hand, bottom-center (fanned) */}
        <div className="handTray">
          {you.hand.map((c, i) => {
            const off = i - (n - 1) / 2;
            const fan = { rot: Math.max(-9, Math.min(9, off * 3)), ty: Math.abs(off) * 5 };
            const playable = canAct && (c.cost ?? 0) <= you.provision &&
              !(c.type === 'minion' && you.board.length >= engine.rules.boardLimit);
            const picked = act?.src.kind === 'hand' && act.src.index === i;
            return (
              <HandCard key={i} c={c} playable={playable} selected={!!picked} fan={fan}
                onDown={(e) => handDown(i, e)} onEnter={() => setHover(c)} onLeave={() => setHover(null)} />
            );
          })}
        </div>

        {/* End Turn, bottom-right seal */}
        <button className={`endturn${canAct ? ' hot' : ''}`} disabled={!canAct}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => { dispatch({ type: 'END_TURN' }); clear(); }}>
          <span className="etScroll">End Turn</span>
        </button>

        {/* L6 — announcements / overlays */}
        {view.banner && !over && <div className="banner" key={view.banner}>{view.banner}</div>}
        {busy && engine.active === 1 && <div className="thinking">the Adversary ponders…</div>}
        {over && (
          <div className="overlay" onPointerDown={(e) => e.stopPropagation()}>
            <div className={`result ${won ? 'victory' : 'defeat'}`}>{won ? (meta ? 'CHAPTER CLEARED' : 'VICTORY') : 'DEFEAT'}</div>
            <div className="ovBtns">
              <button className="bigbtn" onClick={() => newGame()}>{won ? 'Play Again' : 'Retry'}</button>
              <button className="bigbtn ghost" onClick={onExit}>Menu</button>
            </div>
          </div>
        )}

        {/* L4 — interaction: targeting arrow + drag ghost */}
        {act && (act.dragging || aiming) && (
          <svg className="arrowLayer">
            <defs><marker id="ah" markerWidth="12" markerHeight="12" refX="8" refY="4" orient="auto">
              <path d="M0,0 L8,4 L0,8 Z" fill="#e6a33a" /></marker></defs>
            {aiming && <line x1={act.from.x} y1={act.from.y} x2={act.ptr.x} y2={act.ptr.y}
              stroke="#e6a33a" strokeWidth="5" strokeLinecap="round" markerEnd="url(#ah)" opacity="0.92" />}
          </svg>
        )}
      </div>

      {/* right-side card reader */}
      {previewCard && <CardPreview card={previewCard} />}

      {/* the lifted drag ghost, follows the pointer */}
      {act && act.dragging && act.src.kind === 'hand' && (
        <GhostCard card={act.src.card} x={act.ptr.x} y={act.ptr.y} tilt={act.tilt} />
      )}
    </div>
  );
}

// hovering a board unit shows its definition in the reader
function defOf(id: string): CardDef | null { return registry.get(id) ?? null; }

function GhostCard({ card, x, y, tilt }: { card: CardDef; x: number; y: number; tilt: number }) {
  const art = artUrl(card.id);
  return (
    <div className={`ghost handcard r-${card.rarity ?? 'common'}`}
      style={{ left: x, top: y, transform: `translate(-50%,-58%) rotateY(${tilt}deg) rotate(${tilt * 0.2}deg)` }}>
      <div className="hcInner"><div className="hcFace">
        <div className="hcArt" style={art ? { backgroundImage: `url(${art})` } : undefined} />
        <div className="hcName">{card.name}</div>
      </div></div>
      <div className="hcCost">{card.cost ?? 0}</div>
      {card.type === 'minion' && <><div className="hcAtk">{card.attack}</div><div className="hcHp">{card.health}</div></>}
    </div>
  );
}

// ---- story / chapter map ---------------------------------------------------
function StoryMenu({ scene, onPlay, onBack }:
  { scene: SceneId; onPlay: (cfg: MatchConfig, meta?: Encounter) => void; onBack: () => void }) {
  const done = completed();
  return (
    <div className="app storyMenu">
      <ShellBg scene={scene} />
      <div className="storyWrap">
      <div className="topbar">
        <button className="backBtn" onClick={onBack}>‹ Menu</button>
        <div className="brand">UNDERDOGS <span>· story</span></div>
        <MusicToggle />
      </div>
      <div className="menu">
        <h1 className="menuTitle">The Long Way Round</h1>
        <div className="chapters">
          {encounters.map((e, i) => {
            const locked = i > 0 && !done.has(encounters[i - 1].id);
            return (
              <div key={e.id} className={`chapter${done.has(e.id) ? ' done' : ''}${locked ? ' locked' : ''}`}
                onClick={() => { if (!locked) onPlay(toMatchConfig(e), e); }}>
                <div className="chArt" style={{ backgroundImage: `url(${artUrl(e.art)})` }} />
                <div className="chNo">Chapter {i + 1}</div>
                <div className="chTitle">{e.title}</div>
                <div className="chSub">{e.subtitle}</div>
                {done.has(e.id) && <div className="chDone">✓ Cleared</div>}
                {locked && <div className="chLock">🔒 Locked</div>}
              </div>
            );
          })}
          <div className="chapter free" onClick={() => onPlay(SANDBOX)}>
            <div className="chArt" style={{ backgroundImage: `url(${artUrl('david_the_king')})` }} />
            <div className="chNo">Free Play</div>
            <div className="chTitle">Skirmish</div>
            <div className="chSub">A quick sandbox match</div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

// ---- router ----------------------------------------------------------------
export default function App() {
  const [scene] = useState<SceneId>(chooseScene); // one scene for the whole session shell
  const [started, setStarted] = useState(false);
  const [screen, setScreen] = useState<'menu' | 'story'>('menu');
  const [battle, setBattle] = useState<{ cfg: MatchConfig; meta?: Encounter } | null>(null);
  // menu theme (fades in on first interaction) <-> gameplay theme, crossfaded
  useEffect(() => { if (battle) music.playBattle(); else music.playMenu(); }, [!!battle]);

  if (!started) return <Title scene={scene} onBegin={() => setStarted(true)} />;
  if (battle) return <Battle key={battle.cfg.key} cfg={battle.cfg} meta={battle.meta} onExit={() => setBattle(null)} />;
  if (screen === 'story') {
    return <StoryMenu scene={scene} onBack={() => setScreen('menu')}
      onPlay={(cfg, meta) => setBattle({ cfg, meta })} />;
  }
  return <MainMenu scene={scene} onStory={() => setScreen('story')} onFreePlay={() => setBattle({ cfg: SANDBOX })} />;
}
