import { useEffect, useMemo, useState } from 'react';
import { simulate } from './sim.ts';
import { useReplay } from './useReplay.ts';
import { artUrl, CARD_BACK } from './data.ts';
import type { VUnit, HeroV, Prov } from './view.ts';
import type { PlayerId } from '../../engine/src/index.ts';
import './styles.css';

const KW_LABEL: Record<string, string> = {
  guard: 'GUARD', swift: 'SWIFT', endure: 'ENDURE', giant_slayer: 'GIANT-SLAYER',
  redeem: 'REDEEM', scatter: 'SCATTER',
};

function Minion({ u }: { u: VUnit }) {
  const art = artUrl(u.defId);
  const cls = ['minion'];
  if (u.dead) cls.push('dead');
  if (u.enter) cls.push('enter');
  if (u.fulfilling) cls.push('fulfilling');
  if (u.hit) cls.push('hit');
  if (u.buffed) cls.push('buffed');
  const kw = u.keywords.find((k) => KW_LABEL[k]);
  const style = u.lunge ? { transform: `translateY(${u.lunge * 16}px) scale(1.05)` } : undefined;
  return (
    <div className={cls.join(' ')} style={style}>
      {u.keywords.includes('guard') && <div className="ward" />}
      <div className="body" style={art ? { backgroundImage: `url(${art})` } : undefined}>
        {!art && <div className="artFallback">{u.name[0]}</div>}
        <div className="nameband">{u.name}</div>
        {kw && <div className="kw">{KW_LABEL[kw]}</div>}
      </div>
      <div className="atk">{u.attack}</div>
      <div className="hp">{u.health}</div>
      {u.dmg != null && <div className="float dmg">-{u.dmg}</div>}
      {u.heal != null && <div className="float heal">+{u.heal}</div>}
      {u.endure && <div className="shield" />}
      {u.fulfilling && <div className="burst" />}
    </div>
  );
}

function Hero({ h, side, name }: { h: HeroV; side: 'enemy' | 'you'; name: string }) {
  return (
    <div className={`hero ${side}${h.shake ? ' shake' : ''}`}>
      <div className="portrait">
        <div className="hpbadge">{h.hp}</div>
      </div>
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
        {Array.from({ length: Math.max(p.max, 1) }).map((_, i) => (
          <span key={i} className={`gem${i < p.cur ? ' on' : ''}`} />
        ))}
      </div>
      <div className="manaLbl">PROVISION {p.cur}/{p.max}</div>
    </div>
  );
}

export default function App() {
  const [seed, setSeed] = useState(1234);
  const [speed, setSpeed] = useState(360);
  const sim = useMemo(() => simulate(seed), [seed]);
  const { view } = useReplay(sim.events, sim.heroHp, speed);

  // auto-restart a couple seconds after a game ends
  useEffect(() => {
    if (view.over == null) return;
    const t = setTimeout(() => setSeed((s) => s + 1), 3000);
    return () => clearTimeout(t);
  }, [view.over]);

  return (
    <div className="app">
      <div className="topbar">
        <div className="brand">UNDERDOGS <span>· battle slice</span></div>
        <div className="controls">
          <span className="turnLbl">Turn {view.turn}</span>
          <button onClick={() => setSpeed((s) => (s === 360 ? 160 : 360))}>{speed === 360 ? 'Fast' : 'Normal'}</button>
          <button onClick={() => setSeed((s) => s + 1)}>New Game</button>
        </div>
      </div>

      <div className={`table${view.over != null ? ' ended' : ''}`}>
        <Hero h={view.heroes[1]} side="enemy" name="Player 2" />
        <div className={`boardRow enemy${view.heroes[1].shake ? ' shake' : ''}`}>
          {view.boards[1].map((u) => <Minion key={u.uid} u={u} />)}
        </div>

        <div className="divider" />

        <div className={`boardRow you${view.heroes[0].shake ? ' shake' : ''}`}>
          {view.boards[0].map((u) => <Minion key={u.uid} u={u} />)}
        </div>
        <Hero h={view.heroes[0]} side="you" name="Player 1" />

        <Mana p={view.prov[view.active]} />
        <div className="deckpile"><img src={CARD_BACK} alt="deck" /></div>

        {view.banner && <div className={`banner${view.over != null ? ' win' : ''}`} key={view.banner}>{view.banner}</div>}
        {view.over != null && <div className="turnGlow" />}
      </div>

      <div className="footer">
        Deterministic engine · animating the GameEvent stream · both sides played by the greedy demo AI
      </div>
    </div>
  );
}
