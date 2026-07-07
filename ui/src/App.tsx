import { useState } from 'react';
import { useMatch, needsTarget } from './useMatch.ts';
import { artUrl, CARD_BACK } from './data.ts';
import { encounters, toMatchConfig, SANDBOX, completed, markComplete,
  type Encounter, type MatchConfig } from './campaign.ts';
import type { VUnit, HeroV, Prov } from './view.ts';
import { effAttack, type UnitInstance } from '../../engine/src/index.ts';
import './styles.css';

const KW_LABEL: Record<string, string> = {
  guard: 'GUARD', swift: 'SWIFT', endure: 'ENDURE', giant_slayer: 'GIANT-SLAYER',
  redeem: 'REDEEM', scatter: 'SCATTER',
};
type Sel = null | { kind: 'hand'; index: number } | { kind: 'attacker'; uid: number } | { kind: 'heropower' };
const needsTargetPower = (hp?: { effects: { target?: string }[] }) =>
  !!hp?.effects.some((op) => op.target === 'target');

// ---- presentational pieces -------------------------------------------------
function Minion({ u, cls, onClick }: { u: VUnit; cls: string; onClick?: (e: React.MouseEvent) => void }) {
  const art = artUrl(u.defId);
  const kw = u.keywords.find((k) => KW_LABEL[k]);
  const c = ['minion', cls];
  if (u.dead) c.push('dead'); if (u.enter) c.push('enter'); if (u.fulfilling) c.push('fulfilling');
  if (u.hit) c.push('hit'); if (u.buffed) c.push('buffed');
  const style = u.lunge ? { transform: `translateY(${u.lunge * 16}px) scale(1.05)` } : undefined;
  return (
    <div className={c.join(' ')} style={style} onClick={onClick}>
      {u.keywords.includes('guard') && <div className="ward" />}
      <div className="body" style={art ? { backgroundImage: `url(${art})` } : undefined}>
        {!art && <div className="artFallback">{u.name[0]}</div>}
        <div className="nameband">{u.name}</div>
        {kw && <div className="kw">{KW_LABEL[kw]}</div>}
      </div>
      <div className="atk">{u.attack}</div><div className="hp">{u.health}</div>
      {u.dmg != null && <div className="float dmg">-{u.dmg}</div>}
      {u.heal != null && <div className="float heal">+{u.heal}</div>}
      {u.endure && <div className="shield" />}{u.fulfilling && <div className="burst" />}
    </div>
  );
}
function HandCard({ c, playable, selected, onClick }:
  { c: import('../../engine/src/index.ts').CardDef; playable: boolean; selected: boolean; onClick: (e: React.MouseEvent) => void }) {
  const art = artUrl(c.id);
  return (
    <div className={`handcard${playable ? ' playable' : ''}${selected ? ' selected' : ''}`} onClick={onClick}>
      <div className="hcCost">{c.cost ?? 0}</div>
      <div className="hcArt" style={art ? { backgroundImage: `url(${art})` } : undefined} />
      <div className="hcName">{c.name}</div>
      {c.type === 'minion' && <><div className="hcAtk">{c.attack}</div><div className="hcHp">{c.health}</div></>}
    </div>
  );
}
function Hero({ h, side, name, art, targetable, onClick }:
  { h: HeroV; side: 'enemy' | 'you'; name: string; art?: string; targetable?: boolean; onClick?: () => void }) {
  return (
    <div className={`hero ${side}${h.shake ? ' shake' : ''}${targetable ? ' foeTarget' : ''}`} onClick={onClick}>
      <div className="portrait" style={art ? { backgroundImage: `url(${art})` } : undefined}>
        <div className="hpbadge">{h.hp}</div></div>
      <div className="namep">{name}</div>
      {h.dmg != null && <div className="float dmg heroFloat">-{h.dmg}</div>}
      {h.heal != null && <div className="float heal heroFloat">+{h.heal}</div>}
    </div>
  );
}
function Mana({ p }: { p: Prov }) {
  return (
    <div className="mana">
      <div className="manaGems">
        {Array.from({ length: Math.max(p.max, 1) }).map((_, i) => <span key={i} className={`gem${i < p.cur ? ' on' : ''}`} />)}
      </div>
      <div className="manaLbl">PROVISION {p.cur}/{p.max}</div>
    </div>
  );
}

// ---- battle ----------------------------------------------------------------
function Battle({ cfg, meta, onExit }: { cfg: MatchConfig; meta?: Encounter; onExit: () => void }) {
  const { engine, view, busy, canAct, inMulligan, dispatch, newGame } = useMatch(cfg);
  const [sel, setSel] = useState<Sel>(null);
  const [src, setSrc] = useState<{ x: number; y: number } | null>(null);
  const [ptr, setPtr] = useState<{ x: number; y: number } | null>(null);
  const [keep, setKeep] = useState<Set<number>>(new Set([0, 1, 2, 3]));
  const [intro, setIntro] = useState(!!meta);

  if (!engine) return <div className="app"><div className="brand">UNDERDOGS</div></div>;
  const you = engine.players[0];
  const foe = engine.players[1];
  const readyUids = new Set(you.board.filter((u) => u.ready && u.attacksThisTurn < 1 && effAttack(u) > 0).map((u) => u.uid));
  const guardActive = foe.board.some((u) => u.keywords.includes('guard'));
  const clear = () => { setSel(null); setSrc(null); };
  const at = (e: React.MouseEvent) => { const r = (e.currentTarget as HTMLElement).getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };

  const clickHand = (i: number, e: React.MouseEvent) => {
    e.stopPropagation(); if (!canAct) return;
    const card = you.hand[i];
    if ((card.cost ?? 0) > you.provision) return;
    if (card.type === 'minion' && you.board.length >= engine.rules.boardLimit) return;
    if (needsTarget(card)) { setSel({ kind: 'hand', index: i }); setSrc(at(e)); }
    else { dispatch({ type: 'PLAY_CARD', handIndex: i }); clear(); }
  };
  const clickUnit = (u: VUnit, e: React.MouseEvent) => {
    e.stopPropagation();
    if (sel?.kind === 'heropower') { dispatch({ type: 'HERO_POWER', targetUid: u.uid }); clear(); return; }
    if (sel?.kind === 'hand') { dispatch({ type: 'PLAY_CARD', handIndex: sel.index, targetUid: u.uid }); clear(); return; }
    if (sel?.kind === 'attacker') {
      if (u.owner === 1 && (!guardActive || u.keywords.includes('guard'))) { dispatch({ type: 'ATTACK', attackerUid: sel.uid, targetUid: u.uid }); clear(); }
      return;
    }
    if (canAct && u.owner === 0 && readyUids.has(u.uid)) { setSel({ kind: 'attacker', uid: u.uid }); setSrc(at(e)); }
  };
  const clickEnemyHero = () => { if (sel?.kind === 'attacker' && !guardActive) { dispatch({ type: 'ATTACK', attackerUid: sel.uid, targetUid: 'hero' }); clear(); } };
  const targetableUnit = (u: VUnit) => {
    if (sel?.kind === 'hand' || sel?.kind === 'heropower') return true;
    if (sel?.kind === 'attacker') return u.owner === 1 && (!guardActive || u.keywords.includes('guard'));
    return false;
  };
  const hp = you.heroPower;
  const hpUsable = canAct && !!hp && you.provision >= hp.cost && !hp.usedThisTurn;
  const useHeroPower = (e: React.MouseEvent) => {
    e.stopPropagation(); if (!hpUsable || !hp) return;
    if (needsTargetPower(hp)) { setSel({ kind: 'heropower' }); setSrc(at(e)); }
    else { dispatch({ type: 'HERO_POWER' }); clear(); }
  };

  const over = engine.phase === 'over';
  const won = over && engine.winner === 0;
  if (won && meta) markComplete(meta.id);

  // intro narrative
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

  // mulligan
  if (inMulligan) {
    return (
      <div className="app">
        <div className="topbar"><div className="brand">UNDERDOGS <span>· mulligan</span></div>
          <button onClick={onExit}>Menu</button></div>
        <div className="mulligan">
          <h2>Keep your opening hand?</h2>
          <div className="mulHand">
            {you.hand.map((c, i) => (
              <div key={i} className={`mulCard${keep.has(i) ? ' keep' : ''}`}
                onClick={() => setKeep((k) => { const n = new Set(k); n.has(i) ? n.delete(i) : n.add(i); return n; })}>
                <HandCard c={c} playable selected={keep.has(i)} onClick={() => {}} />
                <div className="mulTag">{keep.has(i) ? 'KEEP' : 'REPLACE'}</div>
              </div>
            ))}
          </div>
          <button className="bigbtn" onClick={() => dispatch({ type: 'MULLIGAN', keep: [...keep].filter((i) => i < you.hand.length) })}>Confirm</button>
        </div>
      </div>
    );
  }

  return (
    <div className="app" onClick={clear} onMouseMove={(e) => setPtr({ x: e.clientX, y: e.clientY })}>
      <div className="topbar">
        <div className="brand">UNDERDOGS <span>· {meta ? meta.title : 'free play'}</span></div>
        <div className="controls">
          <span className="turnLbl">Turn {view.turn} · {view.active === 0 ? 'Your turn' : 'Opponent'}</span>
          <button onClick={(e) => { e.stopPropagation(); onExit(); }}>Menu</button>
        </div>
      </div>

      <div className={`table${over ? ' ended' : ''}`}>
        <Hero h={view.heroes[1]} side="enemy" name={meta ? 'Adversary' : 'Rival'} art={artUrl(foe.leaderId ?? (cfg.startUnits?.[1]?.[0] ?? ''))}
          targetable={sel?.kind === 'attacker' && !guardActive} onClick={clickEnemyHero} />
        <div className={`boardRow enemy${view.heroes[1].shake ? ' shake' : ''}`}>
          {view.boards[1].map((u) => <Minion key={u.uid} u={u} onClick={(e) => clickUnit(u, e)} cls={targetableUnit(u) ? 'foeTarget' : ''} />)}
        </div>
        <div className="divider" />
        <div className={`boardRow you${view.heroes[0].shake ? ' shake' : ''}`}>
          {view.boards[0].map((u) => <Minion key={u.uid} u={u} onClick={(e) => clickUnit(u, e)}
            cls={[sel?.kind === 'attacker' && sel.uid === u.uid ? 'sel' : '', readyUids.has(u.uid) ? 'ready' : (u.owner === 0 ? 'sick' : '')].join(' ')} />)}
        </div>
        <Hero h={view.heroes[0]} side="you" name="You" art={artUrl(you.leaderId ?? '')} />

        {hp && (
          <div className={`hpower${hpUsable ? ' usable' : ''}`} onClick={useHeroPower} title={hp.name}>
            <div className="hpGlyph">✦</div><div className="hpCost">{hp.cost}</div><div className="hpLabel">{hp.name}</div>
          </div>
        )}
        <Mana p={view.prov[view.active]} />
        <div className="deckpile"><img src={CARD_BACK} alt="deck" /></div>
        {view.banner && !over && <div className="banner" key={view.banner}>{view.banner}</div>}
        {busy && engine.active === 1 && <div className="thinking">…</div>}

        {over && (
          <div className="overlay" onClick={(e) => e.stopPropagation()}>
            <div className={`result ${won ? 'victory' : 'defeat'}`}>{won ? (meta ? 'CHAPTER CLEARED' : 'VICTORY') : 'DEFEAT'}</div>
            <div className="ovBtns">
              <button className="bigbtn" onClick={() => newGame()}>{won ? 'Play Again' : 'Retry'}</button>
              <button className="bigbtn ghost" onClick={onExit}>Menu</button>
            </div>
          </div>
        )}
      </div>

      <div className="hand">
        {you.hand.map((c, i) => (
          <HandCard key={i} c={c}
            playable={canAct && (c.cost ?? 0) <= you.provision && !(c.type === 'minion' && you.board.length >= engine.rules.boardLimit)}
            selected={sel?.kind === 'hand' && sel.index === i} onClick={(e) => clickHand(i, e)} />
        ))}
        <button className={`endturn${canAct ? ' hot' : ''}`} disabled={!canAct}
          onClick={(e) => { e.stopPropagation(); dispatch({ type: 'END_TURN' }); clear(); }}>End Turn</button>
      </div>

      <div className="foeHand">{Array.from({ length: foe.hand.length }).map((_, i) => <img key={i} src={CARD_BACK} alt="" />)}</div>

      {sel && src && ptr && (
        <svg className="arrowLayer">
          <defs><marker id="ah" markerWidth="12" markerHeight="12" refX="8" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill="#ffca4d" /></marker></defs>
          <line x1={src.x} y1={src.y} x2={ptr.x} y2={ptr.y} stroke="#ffca4d" strokeWidth="4" strokeLinecap="round" markerEnd="url(#ah)" opacity="0.9" />
        </svg>
      )}
    </div>
  );
}

// ---- menu ------------------------------------------------------------------
function Menu({ onPlay }: { onPlay: (cfg: MatchConfig, meta?: Encounter) => void }) {
  const done = completed();
  return (
    <div className="app">
      <div className="topbar"><div className="brand">UNDERDOGS <span>· campaign</span></div></div>
      <div className="menu">
        <h1 className="menuTitle">Choose your battle</h1>
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
  );
}

// ---- router ----------------------------------------------------------------
export default function App() {
  const [battle, setBattle] = useState<{ cfg: MatchConfig; meta?: Encounter } | null>(null);
  if (!battle) return <Menu onPlay={(cfg, meta) => setBattle({ cfg, meta })} />;
  return <Battle key={battle.cfg.key} cfg={battle.cfg} meta={battle.meta} onExit={() => setBattle(null)} />;
}
