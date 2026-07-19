/** The Storehouse — packs, wallet, and Daily Bread (docs/21).
 *  The pack-opening RITUAL lives here: break the seal, cards fan out
 *  face-down, the back-glow telegraphs rarity before the flip, dupes
 *  shatter into Fragments. Reveal-all fast-path for veterans. */
import { useState } from 'react';
import { ShellBg, type SceneId } from './title/scenes.tsx';
import { MusicToggle } from './MusicToggle.tsx';
import { artUrl } from './data.ts';
import { sfx } from './sfx.ts';
import { haptics } from './haptics.ts';
import { fitName } from './fit.ts';
import {
  eco, openPack, refreshQuests, rerollQuest, fwotdAvailable, collectionStats,
  PACK_COST, type PackCard,
} from './economy.ts';

const FLIP_SFX: Record<string, string> = { common: 'select', rare: 'buff', epic: 'notify', legendary: 'notify' };

export function StorehouseScreen({ scene, onBack }: { scene: SceneId; onBack: () => void }) {
  const [, bump] = useState(0);
  const rerender = () => bump((n) => n + 1);
  const [ritual, setRitual] = useState<PackCard[] | null>(null);
  const [sealed, setSealed] = useState(true);
  const [flipped, setFlipped] = useState<Set<number>>(new Set());

  const s = eco();
  const quests = refreshQuests();
  const stats = collectionStats();
  const allFlipped = ritual != null && flipped.size >= ritual.length;

  const startPack = () => {
    const cards = openPack();
    if (!cards) return;
    sfx.play('draw');
    setRitual(cards); setSealed(true); setFlipped(new Set());
  };
  const breakSeal = () => {
    sfx.play('mulligan'); haptics.play();
    setSealed(false);
  };
  const flip = (i: number) => {
    if (sealed || !ritual || flipped.has(i)) return;
    const rar = ritual[i].card.rarity ?? 'common';
    sfx.play(FLIP_SFX[rar] ?? 'select');
    if (rar === 'legendary') haptics.play();
    setFlipped((f) => new Set([...f, i]));
  };
  const revealAll = () => {
    if (!ritual) return;
    sfx.play('shuffle');
    setFlipped(new Set(ritual.map((_, i) => i)));
  };
  const closeRitual = () => { setRitual(null); rerender(); };

  return (
    <div className="app storyMenu storehouse">
      <ShellBg scene={scene} />
      <div className="storyWrap">
        <div className="topbar">
          <button className="backBtn" onClick={onBack}>‹ Menu</button>
          <div className="brand">UNDERDOGS <span>· the storehouse</span></div>
          <MusicToggle />
        </div>
        <div className="shBody">
          <h1 className="menuTitle">The Storehouse</h1>
          <div className="wallet">
            <span className="wTal" data-tip="Talents — earned by playing; spent on packs">🪙 {s.talents}</span>
            <span className="wFrag" data-tip="Fragments — shattered dupes; craft any card">✦ {s.fragments}</span>
            <span className="wColl">{stats.owned}/{stats.total} cards</span>
            {fwotdAvailable() && <span className="wFwotd">☀ First win of the day awaits</span>}
          </div>

          <div className="shMain">
            {/* the pack */}
            <div className="packShelf">
              <div className="packTile" onClick={startPack} role="button"
                data-tip={`5 cards, at least one Rare — ${PACK_COST} Talents`}>
                <div className="packArt">📜</div>
                <div className="packName">Storehouse Pack</div>
                <div className="packSub">5 cards · ≥1 Rare</div>
                <div className={`packCost${s.talents < PACK_COST ? ' broke' : ''}`}>{PACK_COST} 🪙</div>
              </div>
              <div className="packNote">Every card can be earned by playing. Dupes shatter into ✦.</div>
            </div>

            {/* Daily Bread */}
            <div className="breadPanel">
              <div className="breadHead">Daily Bread</div>
              {quests.map((q) => (
                <div key={q.id} className={`breadRow${q.done ? ' done' : ''}`}>
                  <div className="breadText">
                    <div className="breadDesc">{q.desc}</div>
                    <div className="breadBar"><span style={{ width: `${(100 * q.progress) / q.target}%` }} /></div>
                  </div>
                  <div className="breadMeta">
                    {q.done ? <span className="breadDone">✓</span>
                      : <span className="breadPay">{q.reward}🪙{q.frags ? ` ${q.frags}✦` : ''}</span>}
                    {!q.done && eco().rerollUsed == null && (
                      <button className="breadReroll" data-tip="Ask for different bread (once a day)"
                        onClick={() => { if (rerollQuest(q.id)) { sfx.play('shuffle'); rerender(); } }}>↺</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ---- the ritual ---- */}
      {ritual && (
        <div className="ritual" onPointerDown={(e) => e.stopPropagation()}>
          {sealed ? (
            <div className="sealCase" onClick={breakSeal} role="button">
              <div className="sealScroll">📜</div>
              <div className="sealWax">✠</div>
              <div className="sealHint">Break the seal</div>
            </div>
          ) : (
            <>
              <div className="ritualFan">
                {ritual.map((p, i) => {
                  const rar = p.card.rarity ?? 'common';
                  const art = artUrl(p.card.id);
                  const isFlipped = flipped.has(i);
                  return (
                    <div key={i} className={`ritCard r-${rar}${isFlipped ? ' flipped' : ''}`}
                      style={{ ['--i' as string]: i } as React.CSSProperties} onClick={() => flip(i)}>
                      <div className="ritInner">
                        <div className="ritBack"><div className="ritGlow" /></div>
                        <div className="ritFace">
                          <div className="ritArt" style={art ? { backgroundImage: `url(${art})` } : undefined} />
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
                })}
              </div>
              <div className="ritualBtns">
                {!allFlipped && <button className="bigbtn quiet" onClick={revealAll}>Reveal all</button>}
                {allFlipped && <button className="bigbtn" onClick={closeRitual}>Gather them up</button>}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
