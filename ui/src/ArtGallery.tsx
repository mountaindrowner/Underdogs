/** DEV-ONLY art gallery (?art=1): every painting in every place it appears,
 *  drawn with the real game markup + stylesheet — hand card, board unit,
 *  card reader, pack reveal, hero portrait, chapter picture and chapter
 *  banner. One row per painting. ?art=1&q=david filters by id/name.
 *  Not linked from any menu (sibling of ?zoo=1 and ?pack=1). */
import { CardPreview } from './CardPreview.tsx';
import { artStyle, registry } from './data.ts';
import { fitName } from './fit.ts';
import FOCUS from './artFocus.json';
import type { CardDef } from '../../engine/src/index.ts';

const ids = Object.keys(FOCUS).filter((k) => !k.startsWith('_')).sort();
const q = typeof location !== 'undefined' ? (new URLSearchParams(location.search).get('q') ?? '').toLowerCase() : '';

function Row({ id }: { id: string }) {
  const c = registry.get(id) as CardDef | undefined;
  const name = c?.name ?? id;
  const card = c ?? ({ id, name, type: 'minion', cost: 0, attack: 0, health: 0, rarity: 'common', class: 'neutral' } as unknown as CardDef);
  const rar = card.rarity ?? 'common';
  return (
    <div className="agRow">
      <div className="agLab"><b>{name}</b><i>{id}</i></div>
      <div className="agCell"><span>hand / album</span>
        <div className={`handcard big r-${rar} gridCard`} style={{ margin: 0, transform: 'none', filter: 'none' }}>
          <div className="hcInner"><div className="hcFace">
            <div className="hcArt art-win" style={artStyle(id, 'hand')} />
            <div className={`hcName${fitName(name)}`}>{name}</div>
          </div></div>
          <div className="hcCost">{card.cost ?? 0}</div>
        </div></div>
      <div className="agCell"><span>board unit</span>
        <div className={`minion r-${rar}`} style={{ position: 'relative' }}>
          <div className="body"><div className="mFace art-win" style={artStyle(id, 'minion')}>
            <div className={`nameband${fitName(name)}`}>{name}</div>
          </div></div>
        </div></div>
      <div className="agCell agReader"><span>card reader</span><CardPreview card={card} /></div>
      <div className="agCell"><span>pack reveal</span>
        <div className={`ritCard r-${rar} flipped`} style={{ animation: 'none' }}>
          <div className="ritInner" style={{ transform: 'none', transition: 'none' }}>
            <div className="ritFace" style={{ transform: 'none' }}>
              <div className="ritArt art-win" style={artStyle(id, 'ritual')} />
              <div className={`ritName${fitName(name)}`}>{name}</div>
            </div>
          </div>
        </div></div>
      <div className="agCell"><span>portrait</span>
        <div className="hero" style={{ position: 'relative', width: 88, height: 88 }}>
          <div className="portrait art-win" style={artStyle(id, 'portrait')} />
        </div></div>
      <div className="agCell"><span>chapter picture</span>
        <div className="chMini" style={{ width: 120 }}><div className="chArt art-win" style={artStyle(id, 'chapter')} /></div></div>
      <div className="agCell"><span>chapter banner</span>
        <div className="introMini art-win" style={{ ...artStyle(id, 'intro'), width: 300, height: 100 }} /></div>
    </div>
  );
}

export function ArtGallery() {
  const shown = ids.filter((id) => !q || id.includes(q) || (registry.get(id)?.name ?? '').toLowerCase().includes(q));
  return (
    <div className="artGallery">
      <div className="agHead">ART GALLERY · {shown.length} paintings × 7 surfaces · ?art=1&amp;q=name to filter</div>
      {shown.map((id) => <Row key={id} id={id} />)}
      <style>{`
        html,body,#root{height:auto!important;overflow:auto!important;touch-action:auto}
        .artGallery{background:#1a140c;padding:14px;color:#e8dbbb;font-family:var(--f-body)}
        .agHead{font-family:var(--f-display);font-size:18px;margin-bottom:12px;color:var(--gold-lt)}
        .agRow{display:flex;align-items:center;gap:16px;padding:10px 0;border-bottom:1px solid #3a2c18}
        .agLab{width:150px;flex:0 0 auto;display:flex;flex-direction:column;gap:3px}
        .agLab b{font-family:var(--f-display);font-weight:400;font-size:15px}
        .agLab i{font:11px monospace;color:#9a8660;word-break:break-all}
        .agCell{display:flex;flex-direction:column;align-items:center;gap:5px;flex:0 0 auto}
        .agCell>span{font:10px monospace;color:#9a8660}
        .agReader .preview{position:static;animation:none;width:222px}
        .agReader .glossary{display:none}
        .agRow .ritCard{width:132px;height:184px}
        .agRow .ritCard::before,.agRow .ritCard::after{display:none}
      `}</style>
    </div>
  );
}
