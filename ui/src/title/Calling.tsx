/** The Calling: choose a war-band to keep (first run), or take a second one as
 *  a gift after chapter i. Pictures do the explaining — the leader, their hero
 *  power, three cards from the deck, and three short facts — then a "yours"
 *  moment that offers the gentle First Lesson (D-54). */
import { useState } from 'react';
import { CLASS_META, PRESETS } from '../decks.ts';
import { registry, artStyle } from '../data.ts';
import { fitName } from '../fit.ts';
import { Crest, DropCap, Glyph } from '../codex/Codex.tsx';
import { STARTING_TALENTS } from '../economy.ts';
import { sfx } from '../sfx.ts';
import './calling.css';

/** what each war-band is like, in a few words — difficulty 1 (easy) to 3 */
const CALLING: Record<string, { plays: string; pace: string; difficulty: 1 | 2 | 3; show: [string, string][] }> = {
  shepherd: { plays: 'Small allies keep coming back', pace: 'Steady, wide board', difficulty: 1, show: [
    ['moses_of_midian', 'Two Sheep, and they shrug off the first hit.'],
    ['the_ninety_nine', 'Three Sheep in one play.'],
    ['lost_sheep', 'Falls, and comes home to your hand.']] },
  warrior: { plays: 'Hit first, hit hard', pace: 'Fast', difficulty: 1, show: [
    ['gideon_threshing', 'Win a fight outnumbered and he rises.'],
    ['samson', 'When he falls, every enemy takes 2.'],
    ['left_handed_ehud', 'Strikes the turn he arrives.']] },
  priest: { plays: 'Shield, heal, outlast', pace: 'Slow, patient', difficulty: 2, show: [
    ['aaron_high_priest', 'Shields your whole board for a turn.'],
    ['atonement', 'Your strongest fallen ally returns.'],
    ['eleazar_the_faithful', 'Shrugs off the first blow.']] },
  disciple: { plays: 'Every loss becomes two', pace: 'Swarm the board', difficulty: 2, show: [
    ['saul_of_tarsus', 'Becomes Paul, Apostle at your next turn.'],
    ['pentecost', 'Three Disciples that strike at once.'],
    ['eager_convert', 'Falls, and a Disciple takes his place.']] },
  prophet: { plays: 'See the top of the deck, then burn', pace: 'Control', difficulty: 3, show: [
    ['elijah', 'Burns the strongest foe, leaves his mantle.'],
    ['fire_from_heaven', '4 damage to an enemy unit.'],
    ['daniel', 'Survives the den, and is changed.']] },
  patriarch: { plays: 'The promise compounds', pace: 'Slow build, big finish', difficulty: 3, show: [
    ['abram_the_called', 'Start a turn with three allies to become Abraham.'],
    ['joseph_the_dreamer', 'Falls, and returns as Lord of Egypt.'],
    ['noah_ark_builder', 'Two Doves on arrival.']] },
};
/** the order the leaders are offered in — the easiest first */
const ORDER = ['shepherd', 'warrior', 'priest', 'disciple', 'prophet', 'patriarch'];
const DIFF = ['', 'Easy', 'Medium', 'Advanced'];

function Face({ id }: { id: string }) {
  const c = registry.get(id);
  if (!c) return null;
  const rar = c.rarity ?? 'common';
  return (
    <div className={`handcard big r-${rar} gridCard cpFace`}>
      <div className="hcInner"><div className="hcFace">
        <div className="hcArt art-win" style={artStyle(id, 'hand')} />
        <div className={`hcName${fitName(c.name)}`}>{c.name}</div>
      </div></div>
      <div className="hcCost">{c.cost ?? 0}</div>
      {c.type === 'minion' && <><div className="hcAtk">{c.attack}</div><div className="hcHp">{c.health}</div></>}
      {rar !== 'common' && <div className="cpRar">{rar}</div>}
    </div>
  );
}

export function CallingPage({ mode, exclude, onChoose, onLesson, onDone }: {
  mode: 'starter' | 'gift';
  exclude?: string | null;
  onChoose: (cls: string) => void;
  onLesson?: (cls: string) => void;
  onDone: () => void;
}) {
  const classes = ORDER.filter((c) => c !== exclude);
  const [sel, setSel] = useState(classes[0]);
  const [taken, setTaken] = useState<string | null>(null);
  const meta = CLASS_META[sel];
  const info = CALLING[sel];
  const leader = registry.get(meta.leader);
  const hp = leader?.hero_power;
  const preset = PRESETS.find((p) => p.class === (taken ?? sel));
  const legends = new Set((preset?.cards ?? []).filter((id) => registry.get(id)?.rarity === 'legendary')).size;

  // ---- the "yours" moment ----
  if (taken && preset) {
    const fan = [...new Set(preset.cards)].filter((id) => registry.get(id)?.class === taken).slice(-7);
    return (
      <div className="cpBound">
        <div className="cpFan">{fan.map((id, i) => (
          <div key={id} className="cpFanCard" style={{ ['--i' as string]: i - (fan.length - 1) / 2, ['--a' as string]: Math.abs(i - (fan.length - 1) / 2) } as React.CSSProperties}><Face id={id} /></div>
        ))}</div>
        <h2 className="cpBoundHead">{CLASS_META[taken].name} is yours</h2>
        <p className="cpBoundSub">{preset.cards.length} cards, bound into your book.</p>
        <div className="cpChips">
          <span>{preset.cards.length} cards</span><span>{legends} Legendaries</span>
          {mode === 'starter' && <span><Glyph name="talents" size={16} />+{STARTING_TALENTS} Talents</span>}
        </div>
        <div className="cpBtns">
          {mode === 'starter' && onLesson
            ? <>
                <button className="bigbtn" onClick={() => { sfx.play('select'); onLesson(taken); }}>Play your first battle</button>
                <button className="bigbtn quiet" onClick={() => { sfx.play('ui'); onDone(); }}>Look around first</button>
              </>
            : <button className="bigbtn" onClick={() => { sfx.play('ui'); onDone(); }}>Onward</button>}
        </div>
      </div>
    );
  }

  // ---- choosing ----
  return (
    <div className="cpPage">
      <div className="cpLeaf">
        <header className="cpHead">
          <div className="cpTitle">
            <DropCap letter={mode === 'starter' ? 'C' : 'A'} pigment="#a5301c" size={44} />
            {mode === 'starter' ? "hoose who you'll follow first" : ' second calling'}
          </div>
          <div className="cpSub">{mode === 'starter'
            ? 'One war-band is yours to keep. You can earn the other five by playing.'
            : 'Chapter i is behind you. Take a second war-band, as a gift.'}</div>
          <div className="cpFree">Free · 30 cards · yours to keep</div>
        </header>
        <nav className="cpLeaders" aria-label="War-bands">
          {classes.map((cls, i) => {
            const m = CLASS_META[cls];
            return (
              <button key={cls} className={`cpLd${cls === sel ? ' on' : ''}`} aria-pressed={cls === sel}
                onClick={() => { sfx.play('ui'); setSel(cls); }}>
                <span className="cpPt art-win" style={artStyle(m.leader, 'portrait')} />
                <span className="cpLdText"><b>{m.name}</b><i>{registry.get(m.leader)?.name} · {cls[0].toUpperCase() + cls.slice(1)}</i>
                  {mode === 'starter' && i === 0 && <span className="cpStart">Start here</span>}</span>
              </button>
            );
          })}
        </nav>
        <section className="cpDetail" key={sel}>
          <div className="cpHero">
            <div className="cpBigPt art-win" style={artStyle(meta.leader, 'reader')} />
            <div className="cpName"><Crest cls={sel} size={26} />{meta.name}</div>
            <div className="cpLed">led by {leader?.name}</div>
            {hp && (
              <div className="cpPower">
                <span className="cpGem">{hp.cost}</span>
                <span><b>Hero power · {hp.name}</b><span>{hp.text}</span></span>
              </div>
            )}
          </div>
          <div className="cpRight">
            <div className="cpFacts">
              <div className="cpFact wide"><span>Plays like</span><b>{info.plays}</b></div>
              <div className="cpFact"><span>Difficulty</span><b>{DIFF[info.difficulty]}
                <i className="cpPips" aria-label={`${info.difficulty} of 3`}>{[1, 2, 3].map((n) => <em key={n} className={n <= info.difficulty ? 'f' : ''} />)}</i></b></div>
              <div className="cpFact"><span>Pace</span><b>{info.pace}</b></div>
            </div>
            <div className="cpShow">{info.show.map(([id, line]) => (
              <div key={id} className="cpCard"><Face id={id} /><span>{line}</span></div>
            ))}</div>
            <div className="cpCta">
              <button className="bigbtn" onClick={() => { sfx.play('select'); onChoose(sel); setTaken(sel); }}>
                {mode === 'starter' ? 'Take up this calling' : 'Take this war-band'}</button>
              {mode === 'starter' && <span className="cpTal"><Glyph name="talents" size={18} />+{STARTING_TALENTS} Talents to start</span>}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
