/** The Storehouse — packs, wallet, and Daily Bread (docs/21).
 *  A ledger leaf: the wallet is written at the head, a sealed bundle waits on
 *  the left, the day's bread is reckoned on the right. Opening a bundle plays
 *  the full ritual (PackRitual.tsx). */
import { useState } from 'react';
import type { SceneId } from './title/scenes.tsx';
import { CARD_BACK } from './data.ts';
import { sfx } from './sfx.ts';
import { PackRitual } from './PackRitual.tsx';
import { Folio, Glyph } from './codex/Codex.tsx';
import {
  eco, openPack, refreshQuests, rerollQuest, fwotdAvailable, collectionStats,
  PACK_COST, type PackCard,
} from './economy.ts';

export function StorehouseScreen({ scene, onBack }: { scene: SceneId; onBack: () => void }) {
  const [, bump] = useState(0);
  const rerender = () => bump((n) => n + 1);
  const [ritual, setRitual] = useState<PackCard[] | null>(null);

  const s = eco();
  const quests = refreshQuests();
  const stats = collectionStats();

  const startPack = () => {
    const cards = openPack();
    if (!cards) return;
    sfx.play('draw');
    setRitual(cards);
  };
  const closeRitual = () => { setRitual(null); rerender(); };

  return (
    <>
      <Folio scene={scene} title="The Storehouse" kicker="Store up for the lean years." back={onBack} className="storehouse">
        <div className="wallet">
          <span className="wTal" data-tip="Talents — earned by playing; spent on packs"><Glyph name="talents" size={22} />{s.talents} Talents</span>
          <span className="wFrag" data-tip="Fragments — shattered dupes; craft any card"><Glyph name="fragments" size={20} />{s.fragments} Fragments</span>
          <span className="wColl">{stats.owned} of {stats.total} cards gathered</span>
          {fwotdAvailable() && <span className="wFwotd">— the first win of the day still awaits</span>}
        </div>

        <div className="shMain">
          <div className="packShelf">
            <div className="packTile" onClick={startPack} role="button"
              data-tip={`5 cards, at least one Rare — ${PACK_COST} Talents`}>
              <div className="packArt" style={{ backgroundImage: `url(${CARD_BACK})` }} />
              <div className="packName">Storehouse Pack</div>
              <div className="packSub">five cards · one Rare or better</div>
              <div className={`bigbtn packCost${s.talents < PACK_COST ? ' broke' : ''}`}>{PACK_COST} Talents</div>
            </div>
            <div className="packNote">Every card can be earned by playing. Duplicates shatter into Fragments.</div>
          </div>

          <div className="breadPanel">
            <div className="breadHead"><Glyph name="bread" size={22} />Daily Bread</div>
            {quests.map((q) => (
              <div key={q.id} className={`breadRow${q.done ? ' done' : ''}`}>
                <div className="breadText">
                  <div className="breadDesc">{q.desc}</div>
                  <div className="breadBar"><span style={{ width: `${(100 * q.progress) / q.target}%` }} /></div>
                </div>
                <div className="breadMeta">
                  {q.done ? <span className="breadDone"><Glyph name="check" size={20} /></span>
                    : <span className="breadPay">{q.reward} Talents{q.frags ? ` · ${q.frags} Fragments` : ''}</span>}
                  {!q.done && eco().rerollUsed == null && (
                    <button className="breadReroll" data-tip="Ask for different bread (once a day)"
                      onClick={() => { if (rerollQuest(q.id)) { sfx.play('shuffle'); rerender(); } }}>↺</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Folio>

      {ritual && <PackRitual cards={ritual} onDone={closeRitual} />}
    </>
  );
}
