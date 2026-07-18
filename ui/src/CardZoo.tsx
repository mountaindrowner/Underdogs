/** DEV-ONLY card gallery (?zoo=1): every card surface rendered with the
 *  worst-case cards (longest names, wordiest text, each type) so a single
 *  screenshot audits fit/format everywhere. Not linked from any menu. */
import { registry, artUrl } from './data.ts';
import { CardPreview } from './CardPreview.tsx';
import { fitName } from './fit.ts';
import type { CardDef } from '../../engine/src/index.ts';

const all = [...registry.values()].filter((c) => c.type !== 'leader');
const byId = (id: string) => registry.get(id);
const longestName = [...all].sort((a, b) => b.name.length - a.name.length)[0];
const longestText = [...all].sort((a, b) => (b.text ?? '').length - (a.text ?? '').length)[0];
const ZOO: CardDef[] = [
  longestName, longestText,
  byId('jar_of_flour'), byId('the_great_cloud'), byId('eleventh_hour_laborer'),
  byId('widows_jar'), byId('melchizedeks_blessing'), byId('stonemason'),
  byId('nehemiah_rebuilder'), byId('shepherd_david'),
].filter(Boolean) as CardDef[];

function Hand({ c, big }: { c: CardDef; big?: boolean }) {
  const art = artUrl(c.id);
  return (
    <div className={`handcard${big ? ' big' : ''} r-${c.rarity ?? 'common'}`} style={{ margin: 0, transform: 'none', filter: 'none' }}>
      <div className="hcInner"><div className="hcFace">
        <div className="hcArt" style={art ? { backgroundImage: `url(${art})` } : undefined} />
        <div className={`hcName${fitName(c.name)}`}>{c.name}</div>
      </div></div>
      <div className="hcCost">{c.cost ?? 0}</div>
      {c.type === 'minion' && <><div className="hcAtk">{c.attack}</div><div className="hcHp">{c.health}</div></>}
    </div>
  );
}
function BoardMinion({ c }: { c: CardDef }) {
  const art = artUrl(c.id);
  return (
    <div className="minion" style={{ position: 'relative' }}>
      <div className="body"><div className="mFace" style={art ? { backgroundImage: `url(${art})` } : undefined}>
        <div className={`nameband${fitName(c.name)}`}>{c.name}</div>
      </div></div>
      <div className="atk">{c.attack ?? 0}</div><div className="hp">{c.health ?? 0}</div>
    </div>
  );
}

export function CardZoo() {
  return (
    <div style={{ minHeight: '100dvh', background: '#141018', padding: 16, display: 'flex',
      flexDirection: 'column', gap: 14, overflow: 'auto', color: '#cbb283', fontFamily: 'serif' }}>
      <div>CARD ZOO — worst-case fit audit ({ZOO.map((c) => c.name.length).join('/')} ch names)</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {ZOO.map((c) => <Hand key={c.id} c={c} />)}
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {ZOO.slice(0, 5).map((c) => <Hand key={c.id} c={c} big />)}
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {ZOO.filter((c) => c.type === 'minion').map((c) => <BoardMinion key={c.id} c={c} />)}
      </div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {[longestName, longestText, byId('jar_of_flour')!, byId('shepherd_david')!].map((c) => (
          <div key={c.id} className="zooPrev"><CardPreview card={c} /></div>
        ))}
        <style>{'.zooPrev{position:relative;width:250px}.zooPrev .preview{position:static;animation:none;transform:none}'}</style>
      </div>
    </div>
  );
}
