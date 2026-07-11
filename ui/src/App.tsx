import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useMatch, needsTarget, targetSideOf } from './useMatch.ts';
import { artUrl, CARD_BACK, registry } from './data.ts';
import { encounters, toMatchConfig, SANDBOX, completed, markComplete,
  type Encounter, type MatchConfig } from './campaign.ts';
import { FreePlaySetup } from './FreePlay.tsx';
import { DecksScreen } from './Decks.tsx';
import type { VUnit, HeroV, Prov } from './view.ts';
import { effAttack, effCost, hasKeyword, needsExplicitTarget, type CardDef, type Action, type PendingChoice } from '../../engine/src/index.ts';
import { KW_LABEL } from './glossary.ts';
import { CardPreview } from './CardPreview.tsx';
import { Board } from './board/Board.tsx';
import { music } from './audio.ts';
import { sfx } from './sfx.ts';
import { haptics } from './haptics.ts';
import { MusicToggle } from './MusicToggle.tsx';
import { Title } from './title/Title.tsx';
import { MainMenu } from './title/MainMenu.tsx';
import { ShellBg, chooseScene, type SceneId } from './title/scenes.tsx';
import './styles.css';

const REDUCED = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const CAN_HOVER = typeof matchMedia !== 'undefined' && matchMedia('(hover: hover)').matches;

type SrcHand = { kind: 'hand'; index: number; card: CardDef };
type Src = SrcHand | { kind: 'attacker'; uid: number } | { kind: 'heropower' };
// Pointer position/tilt are NOT stored here — they live in refs and the ghost/
// arrow are positioned imperatively, so a drag never re-renders the board.
type Act = { src: Src; from: { x: number; y: number }; dragging: boolean; needsTgt: boolean };
type Drop = { kind: 'none' | 'board' | 'foeHero' } | { kind: 'unit'; uid: number; owner: number };

const needsTargetPower = (hp?: { effects?: { target?: string }[] }) =>
  !!hp?.effects?.some((op) => needsExplicitTarget(op as never));

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
  const rootRef = useRef<HTMLDivElement>(null);
  const c = ['minion', `r-${rarity}`, cls];
  if (u.dead) c.push('dead'); if (u.enter) c.push('enter'); if (u.fulfilling) c.push('fulfilling');
  if (u.hit) c.push('hit'); if (u.buffed) c.push('buffed'); if (valid) c.push('validTgt');

  // Directional lunge: measure the real vector to this beat's target and drive
  // the strike keyframes with it — the attacker travels INTO its victim.
  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el || u.lungeAt == null) return;
    const tgt = u.lungeAt === 'hero'
      ? document.querySelector(u.owner === 0 ? '.foeCorner .hero' : '.youCorner .hero')
      : document.querySelector(`[data-uid="${u.lungeAt}"]`);
    let dx = 0, dy = (u.lunge ?? (u.owner === 0 ? -1 : 1)) * -52;   // fallback: straight ahead
    if (tgt) {
      const a = el.getBoundingClientRect(), b = tgt.getBoundingClientRect();
      dx = (b.left + b.width / 2) - (a.left + a.width / 2);
      dy = (b.top + b.height / 2) - (a.top + a.height / 2);
      const len = Math.hypot(dx, dy) || 1;
      const reach = Math.max(40, len - 34);                          // stop just inside the target
      dx = (dx / len) * reach; dy = (dy / len) * reach;
    }
    el.style.setProperty('--lx', `${dx}px`);
    el.style.setProperty('--ly', `${dy}px`);
    el.classList.add('lunging');
    return () => { el.classList.remove('lunging'); };
  }, [u.lungeAt, u.uid, u.owner, u.lunge]);

  return (
    <div ref={rootRef} className={c.join(' ')} onPointerDown={onDown}
      onMouseEnter={onEnter} onMouseLeave={onLeave}
      data-drop="unit" data-uid={u.uid} data-owner={u.owner}>
      {(u.keywords.includes('guard') || u.auraKw.includes('guard')) && <div className="ward" />}
      <div className="body">
        <div className="mFace" style={art ? { backgroundImage: `url(${art})` } : undefined}>
          {!art && <div className="artFallback">{u.name[0]}</div>}
          <div className="nameband">{u.name}</div>
          {kw && <div className="kw">{KW_LABEL[kw].toUpperCase()}</div>}
        </div>
      </div>
      <div className={`atk${u.auraAtk > 0 ? ' aurad' : ''}`}>{u.attack + u.auraAtk}</div>
      <div className={`hp${u.auraHp > 0 ? ' aurad' : ''}`}>{u.health + u.auraHp}</div>
      {u.dmg != null && (
        <div className={`float dmg${u.dmg >= 6 ? ' huge' : u.dmg >= 3 ? ' big' : ''}`}>-{u.dmg}</div>
      )}
      {u.heal != null && <div className="float heal">+{u.heal}</div>}
      {u.hit && (
        <div className="impactFx" aria-hidden>
          {Array.from({ length: 6 }).map((_, i) => <span key={i} />)}
          <i className="impactRing" />
        </div>
      )}
      {u.dead && (
        <div className="dustRise" aria-hidden>
          {Array.from({ length: 6 }).map((_, i) => <span key={i} />)}
        </div>
      )}
      {u.endure && (
        <>
          <div className="shield" />
          <div className="shatterFx" aria-hidden>{Array.from({ length: 4 }).map((_, i) => <span key={i} />)}</div>
        </>
      )}
      {u.fulfilling && <div className="burst" />}
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

// A small face used inside the choice overlay (same frame as the mulligan cards).
function ChoiceFace({ c }: { c: CardDef }) {
  const art = artUrl(c.id);
  return (
    <div className={`handcard big r-${c.rarity ?? 'common'}`}>
      <div className="hcInner"><div className="hcFace">
        <div className="hcArt" style={art ? { backgroundImage: `url(${art})` } : undefined} />
        <div className="hcName">{c.name}</div>
      </div></div>
      <div className="hcCost">{c.cost ?? 0}</div>
      {c.type === 'minion' && <><div className="hcAtk">{c.attack}</div><div className="hcHp">{c.health}</div></>}
    </div>
  );
}

// Foresee / Discover choice overlay. Foresee: tap cards to send them to the
// bottom (the rest stay on top in order). Discover: tap to pick exactly N.
function ChoiceOverlay({ choice, onResolve }: { choice: PendingChoice; onResolve: (a: Action) => void }) {
  const cards = choice.cardIds.map((id) => registry.get(id)).filter(Boolean) as CardDef[];
  const foresee = choice.kind === 'foresee';
  const [bottomed, setBottomed] = useState<Set<number>>(new Set());
  const [picked, setPicked] = useState<Set<number>>(new Set());
  const toggle = (i: number) => {
    if (foresee) setBottomed((s) => { const n = new Set(s); n.has(i) ? n.delete(i) : n.add(i); return n; });
    else setPicked((s) => { const n = new Set(s); if (n.has(i)) n.delete(i); else if (n.size < choice.pick) n.add(i); return n; });
  };
  const confirm = () => onResolve(foresee
    ? { type: 'RESOLVE_CHOICE', keep: cards.map((_, i) => i).filter((i) => !bottomed.has(i)), bottom: [...bottomed] }
    : { type: 'RESOLVE_CHOICE', picked: [...picked] });
  const ready = foresee || picked.size === choice.pick;
  // running "TOP n" numbering for the kept cards
  let topN = 0;
  return (
    <div className="overlay choiceOverlay" onPointerDown={(e) => e.stopPropagation()}>
      <div className="choiceHead">{foresee ? 'Foresee' : 'Discover'}</div>
      <div className="choiceSub">
        {foresee
          ? 'Tap a card to send it to the bottom of your deck. The rest stay on top, in this order.'
          : `Choose ${choice.pick} to take into your hand.`}
      </div>
      <div className="choiceRow">
        {cards.map((c, i) => {
          const bottom = foresee && bottomed.has(i);
          const sel = !foresee && picked.has(i);
          if (foresee && !bottom) topN += 1;
          return (
            <div key={i} className={`choiceCard${bottom ? ' bottomed' : ''}${sel ? ' picked' : ''}`} onClick={() => toggle(i)}>
              <ChoiceFace c={c} />
              <div className="choiceTag">
                {foresee ? (bottom ? '↓ BOTTOM' : `TOP ${topN}`) : (sel ? '✓ KEEP' : 'TAP TO KEEP')}
              </div>
            </div>
          );
        })}
      </div>
      <button className="bigbtn" disabled={!ready} onClick={confirm}>
        {foresee ? 'Set the Order' : `Take ${picked.size}/${choice.pick}`}
      </button>
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
  const { engine, view, busy, canAct, inMulligan, choice, dispatch, newGame } = useMatch(cfg);
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
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastX = useRef(0);
  const ptrRef = useRef({ x: 0, y: 0 });
  const tiltRef = useRef(0);
  const ghostRef = useRef<HTMLDivElement>(null);
  const arrowRef = useRef<SVGLineElement>(null);
  const flareLatch = useRef(false);
  const tableRef = useRef<HTMLDivElement>(null);
  const parRaf = useRef(0);
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
  // Pointer moves only touch refs; React state flips at most once (idle->drag),
  // so the board is not re-rendered per frame.
  useEffect(() => {
    if (!act) return;
    const move = (e: PointerEvent) => {
      ptrRef.current = { x: e.clientX, y: e.clientY };
      if (!act.dragging && Math.hypot(e.clientX - act.from.x, e.clientY - act.from.y) > 10) {
        setAct((a) => (a ? { ...a, dragging: true } : a));
      }
      if (!REDUCED) tiltRef.current = Math.max(-16, Math.min(16, (e.clientX - lastX.current) * 0.9));
      lastX.current = e.clientX;
    };
    const up = (e: PointerEvent) => {
      ptrRef.current = { x: e.clientX, y: e.clientY };
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
  }, [act?.src, act?.dragging]);

  // rAF loop positions the ghost + arrow imperatively while a card is held
  useEffect(() => {
    if (!act) return;
    let raf = 0;
    const tick = () => {
      const { x, y } = ptrRef.current;
      if (arrowRef.current) { arrowRef.current.setAttribute('x2', String(x)); arrowRef.current.setAttribute('y2', String(y)); }
      const g = ghostRef.current;
      if (g) {
        tiltRef.current *= 0.86;
        const t = tiltRef.current;
        g.style.left = `${x}px`; g.style.top = `${y}px`;
        g.style.transform = `translate(-50%,-58%) rotateY(${t}deg) rotate(${t * 0.2}deg)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [act?.src, act?.dragging]);

  if (!engine) return <div className="app"><div className="brand">UNDERDOGS</div></div>;
  const you = engine.players[0];
  const foe = engine.players[1];
  const readyUids = new Set(you.board.filter((u) => u.ready && u.attacksThisTurn < 1 && effAttack(u) > 0).map((u) => u.uid));
  const guardActive = foe.board.some((u) => hasKeyword(u, 'guard'));
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
    sfx.play('select');
    haptics.tap();
    const from = center(e);
    lastX.current = e.clientX;
    ptrRef.current = { x: e.clientX, y: e.clientY };
    tiltRef.current = 0;
    setAct({ src, from, dragging: false, needsTgt });
    if (holdTimer.current) clearTimeout(holdTimer.current);
    holdTimer.current = setTimeout(() => setAct((a) => (a && !a.dragging ? { ...a, dragging: true } : a)), 170);
  }

  // resolve a placement/attack given the source and where it landed
  function resolve(src: Src, drop: Drop) {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    if (drop.kind !== 'none') haptics.play();
    if (src.kind === 'hand') {
      const card = src.card;
      if (needsTarget(card)) {
        const side = targetSideOf(card);
        const ok = drop.kind === 'unit'
          && (side === 'any' || (side === 'enemy' ? drop.owner === 1 : drop.owner === 0));
        if (ok && drop.kind === 'unit') dispatch({ type: 'PLAY_CARD', handIndex: src.index, targetUid: drop.uid });
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
    const affordable = effCost(engine, 0, card) <= you.provision &&
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
    if (act.src.kind === 'hand') {
      if (!act.needsTgt) return false;
      const side = targetSideOf(act.src.card);
      return side === 'any' || (side === 'enemy' ? u.owner === 1 : u.owner === 0);
    }
    return false;
  };
  const foeHeroTarget = !!act && act.src.kind === 'attacker' && !guardActive;
  const boardOpen = !!act && act.src.kind === 'hand' && !act.needsTgt;

  const previewCard = (act?.src.kind === 'hand' ? act.src.card : null) ?? hover;

  // impact this beat = the biggest blow that just landed (drives table shake)
  const impactAmt = Math.max(0,
    ...view.boards[0].map((u) => u.dmg ?? 0), ...view.boards[1].map((u) => u.dmg ?? 0),
    view.heroes[0].dmg ?? 0, view.heroes[1].dmg ?? 0);
  const impactCls = REDUCED ? '' : impactAmt >= 6 ? ' impact-3' : impactAmt >= 3 ? ' impact-2' : impactAmt > 0 ? ' impact-1' : '';
  const hurt = view.heroes[0].dmg ?? 0;

  // subtle diorama parallax on hover-capable devices (rAF-throttled, vars only)
  const onParallax = (e: React.PointerEvent) => {
    if (!CAN_HOVER || REDUCED) return;
    const x = e.clientX, y = e.clientY;
    if (parRaf.current) return;
    parRaf.current = requestAnimationFrame(() => {
      parRaf.current = 0;
      const el = tableRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty('--parx', ((x - r.left) / r.width - 0.5).toFixed(3));
      el.style.setProperty('--pary', ((y - r.top) / r.height - 0.5).toFixed(3));
    });
  };

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
      <div className="app mulliganApp">
        <div className="mulBg"><Board enc={sceneOverride ?? meta?.id} danger={0} flare={0} goliath={false} /></div>
        <div className="mulScrim" />
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
          <button className="bigbtn" data-tip="Trade every card not marked KEEP for a fresh draw"
            onClick={() => { sfx.play('mulligan'); dispatch({ type: 'MULLIGAN', keep: [...keep].filter((i) => i < you.hand.length) }); }}>Cast Lots</button>
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
            data-tip="Change the table's finish" data-tip-side="bottom">◈ {BOARD_LABEL[board]}</button>
          <button onPointerDown={(e) => e.stopPropagation()} onClick={onExit}
            data-tip="Leave the match" data-tip-side="bottom">Menu</button>
        </div>
      </div>

      <div ref={tableRef} className={`table${over ? ' ended' : ''}${aiming ? ' aiming' : ''}${impactCls}`}
        data-board={board} onPointerMove={onParallax}>
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
        {/* red edge-pulse when YOUR hero takes a hit, scaled to the blow */}
        {hurt > 0 && <div className="hurtFx" style={{ ['--hurt' as string]: Math.min(1, hurt / 8) } as React.CSSProperties} />}

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
            <div className={`hpower${hpUsable ? ' usable' : ''}`} onPointerDown={heroPowerDown} data-tip-align="left"
              data-tip={`${hpwr.name} (${hpwr.cost} Provision, once per turn)\n${registry.get(you.leaderId ?? '')?.hero_power?.text ?? ''}`}>
              <div className="hpGlyph">✦</div><div className="hpCost">{hpwr.cost}</div>
              <div className="hpLabel">{hpwr.name}</div>
            </div>
          )}
        </HeroCorner>

        {/* standing relics: small emblems by each hero corner */}
        {([1, 0] as const).map((side) => view.relics[side].length > 0 && (
          <div key={side} className={`relicRow ${side === 0 ? 'you' : 'foe'}`}>
            {view.relics[side].map((defId, i) => {
              const d = defOf(defId);
              return (
                <div key={`${defId}-${i}`} className="relicChip"
                  data-tip={`${d?.name ?? defId}\n${d?.text ?? ''}`}
                  onMouseEnter={() => setHover(d ?? null)} onMouseLeave={() => setHover(null)}>
                  {(d?.name ?? '?')[0]}
                </div>
              );
            })}
          </div>
        ))}

        {/* opponent face-down hand, top-center */}
        <div className="foeHand">{Array.from({ length: foe.hand.length }).map((_, i) => <img key={i} src={CARD_BACK} alt="" />)}</div>

        {/* your hand, bottom-center (fanned) */}
        <div className="handTray">
          {you.hand.map((c, i) => {
            const off = i - (n - 1) / 2;
            const fan = { rot: Math.max(-9, Math.min(9, off * 3)), ty: Math.abs(off) * 5 };
            const playable = canAct && effCost(engine, 0, c) <= you.provision &&
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
          data-tip={canAct ? 'End your turn — pass to the rival' : 'Wait for your turn'} data-tip-align="right"
          onClick={() => { sfx.play('ui'); dispatch({ type: 'END_TURN' }); clear(); }}>
          <span className="etScroll">End Turn</span>
        </button>

        {/* L6 — announcements / overlays */}
        {view.banner && !over && <div className="banner" key={view.banner}>{view.banner}</div>}
        {busy && engine.active === 1 && <div className="thinking">the Adversary ponders…</div>}
        {choice && !over && <ChoiceOverlay choice={choice} onResolve={(a) => { sfx.play('select'); dispatch(a); }} />}
        {over && (
          <div className="overlay" onPointerDown={(e) => e.stopPropagation()}>
            <div className={`result ${won ? 'victory' : 'defeat'}`}>{won ? (meta ? 'CHAPTER CLEARED' : 'VICTORY') : 'DEFEAT'}</div>
            <div className="ovBtns">
              <button className="bigbtn" onClick={() => newGame()}>{won ? 'Play Again' : 'Retry'}</button>
              <button className="bigbtn quiet" onClick={onExit}>Menu</button>
            </div>
          </div>
        )}

        {/* L4 — interaction: targeting arrow (positioned imperatively) */}
        {act && aiming && (
          <svg className="arrowLayer">
            <defs><marker id="ah" markerWidth="12" markerHeight="12" refX="8" refY="4" orient="auto">
              <path d="M0,0 L8,4 L0,8 Z" fill="#e6a33a" /></marker></defs>
            <line ref={arrowRef} x1={act.from.x} y1={act.from.y} x2={ptrRef.current.x} y2={ptrRef.current.y}
              stroke="#e6a33a" strokeWidth="5" strokeLinecap="round" markerEnd="url(#ah)" opacity="0.92" />
          </svg>
        )}
      </div>

      {/* right-side card reader */}
      {previewCard && <CardPreview card={previewCard} />}

      {/* the lifted drag ghost — starts at the source, then the rAF loop drives it */}
      {act && act.dragging && act.src.kind === 'hand' && (
        <div ref={ghostRef} className={`ghost handcard r-${act.src.card.rarity ?? 'common'}`}
          style={{ left: act.from.x, top: act.from.y, transform: 'translate(-50%,-58%)' }}>
          <div className="hcInner"><div className="hcFace">
            <div className="hcArt" style={artUrl(act.src.card.id) ? { backgroundImage: `url(${artUrl(act.src.card.id)})` } : undefined} />
            <div className="hcName">{act.src.card.name}</div>
          </div></div>
          <div className="hcCost">{act.src.card.cost ?? 0}</div>
          {act.src.card.type === 'minion' && <><div className="hcAtk">{act.src.card.attack}</div><div className="hcHp">{act.src.card.health}</div></>}
        </div>
      )}
    </div>
  );
}

// hovering a board unit shows its definition in the reader
function defOf(id: string): CardDef | null { return registry.get(id) ?? null; }

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

// ---- match-start transition: leather doors close, emboss, swing open -------
function MatchTransition({ label, sub, onDone }: { label: string; sub?: string; onDone: () => void }) {
  // reduced-motion (or anything else) can suppress the CSS animation, so a
  // timer guarantees the covers always lift
  useEffect(() => { const t = setTimeout(onDone, 2400); return () => clearTimeout(t); }, [onDone]);
  return (
    <div className="mtrans">
      <div className="mtDoor mtL" />
      <div className="mtDoor mtR" />
      <div className="mtTitle">
        <span className="mtName">{label}</span>
        {sub && <span className="mtSub">{sub}</span>}
      </div>
    </div>
  );
}

// ---- router ----------------------------------------------------------------
export default function App() {
  const [scene] = useState<SceneId>(chooseScene); // one scene for the whole session shell
  const [started, setStarted] = useState(false);
  const [screen, setScreen] = useState<'menu' | 'story' | 'freeplay' | 'decks'>('menu');
  const [battle, setBattle] = useState<{ cfg: MatchConfig; meta?: Encounter } | null>(null);
  const [trans, setTrans] = useState<{ label: string; sub?: string } | null>(null);
  // menu theme (fades in on first interaction) <-> gameplay theme, crossfaded
  useEffect(() => { if (battle) music.playBattle(); else music.playMenu(); }, [!!battle]);

  // every road into a match passes through the doors
  const play = (cfg: MatchConfig, meta?: Encounter) => {
    setTrans({ label: meta?.title ?? 'The Sparring Pit', sub: meta?.subtitle ?? 'a skirmish among friends' });
    setBattle({ cfg, meta });
  };

  const overlay = trans && <MatchTransition label={trans.label} sub={trans.sub} onDone={() => setTrans(null)} />;

  if (!started) return <Title scene={scene} onBegin={() => setStarted(true)} />;
  if (battle) {
    return <>
      <Battle key={battle.cfg.key} cfg={battle.cfg} meta={battle.meta} onExit={() => setBattle(null)} />
      {overlay}
    </>;
  }
  if (screen === 'story') {
    return <>{<StoryMenu scene={scene} onBack={() => setScreen('menu')} onPlay={play} />}{overlay}</>;
  }
  if (screen === 'freeplay') {
    return <>{<FreePlaySetup scene={scene} onBack={() => setScreen('menu')} onBegin={(cfg) => play(cfg)} />}{overlay}</>;
  }
  if (screen === 'decks') {
    return <DecksScreen scene={scene} onBack={() => setScreen('menu')} />;
  }
  return <MainMenu scene={scene} onStory={() => setScreen('story')}
    onFreePlay={() => setScreen('freeplay')} onDecks={() => setScreen('decks')} />;
}
