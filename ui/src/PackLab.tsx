/** The Pack Lab (?pack=1) — dev-only ritual tester, not linked from any menu.
 *  Fire simulated packs on demand (forced finishes, instant replay) so the
 *  pack-opening cinematic can be tuned without grinding Talents or touching
 *  the save. `simulatePack` never mutates the economy; the only mutating
 *  control is the clearly-labeled dev faucet (+1000 Talents) for testing the
 *  REAL Storehouse flow afterwards. Sibling of the ?zoo=1 card gallery. */
import { useState } from 'react';
import './decks.ts';   // side effect: initEconomyData (the card universe)
import { PackRitual } from './PackRitual.tsx';
import { simulatePack, devGrant, eco, type PackCard, type SimFinish } from './economy.ts';

const FINISHES: { f: SimFinish; label: string; sub: string }[] = [
  { f: 'random',    label: 'Random pack',   sub: 'real odds' },
  { f: 'rare',      label: 'Rare finish',   sub: 'ends on a rare' },
  { f: 'epic',      label: 'Epic finish',   sub: 'ends on an epic' },
  { f: 'legendary', label: 'LEGENDARY',     sub: 'the full moment' },
  { f: 'commons',   label: 'All commons',   sub: 'the floor' },
  { f: 'dupes',     label: 'All dupes',     sub: 'shatter test' },
];

export function PackLab() {
  const [cards, setCards] = useState<PackCard[] | null>(null);
  const [run, setRun] = useState(0);
  const [last, setLast] = useState<SimFinish>('legendary');
  const [, bump] = useState(0);

  const open = (f: SimFinish) => { setLast(f); setCards(simulatePack(f)); setRun((r) => r + 1); };
  const replayLast = () => open(last);

  return (
    <div className="app packlab">
      <div className="plBar">
        <div className="plTitle">PACK LAB <span>· dev ritual tester — simulated, nothing is granted or spent</span></div>
        <div className="plBtns">
          {FINISHES.map(({ f, label, sub }) => (
            <button key={f} className={`plBtn${last === f ? ' sel' : ''}`} onClick={() => open(f)}>
              <b>{label}</b><i>{sub}</i>
            </button>
          ))}
          <button className="plBtn faucet" onClick={() => { devGrant(1000); bump((n) => n + 1); }}>
            <b>+1000 🪙</b><i>real save · {eco().talents} now</i>
          </button>
        </div>
      </div>
      {cards
        ? <PackRitual key={run} cards={cards} onDone={() => setCards(null)} />
        : (
          <div className="plEmpty">
            <div className="plHint">Pick a finish above to run the ritual.<br />
              <span>Same cinematic the Storehouse uses — tune here, ship everywhere.</span></div>
            <button className="bigbtn" onClick={replayLast}>Run “{FINISHES.find((x) => x.f === last)?.label}”</button>
          </div>
        )}
    </div>
  );
}
