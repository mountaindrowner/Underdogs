/** Right-side card reader (UI ref §4): a large, fully legible card plus the
 *  keyword glossary for anything printed on it. Anchored so it never covers the
 *  player's bottom-left HUD. Shown on hover (desktop) or select/hold (touch). */
import type { CardDef } from '../../engine/src/index.ts';
import { artUrl } from './data.ts';
import { glossaryFor } from './glossary.ts';

const CLASS_LABEL: Record<string, string> = {
  prophet: 'Prophet', warrior: 'Warrior', priest: 'Priest', shepherd: 'Shepherd',
  patriarch: 'Patriarch', disciple: 'Disciple', neutral: 'Neutral', adversary: 'Adversary',
};

export function CardPreview({ card }: { card: CardDef }) {
  const art = artUrl(card.id);
  const rarity = card.rarity ?? 'common';
  const flavor = (card as { flavor?: string }).flavor;
  const gloss = glossaryFor(card);
  const line = [card.tag ? card.tag[0].toUpperCase() + card.tag.slice(1) : null, CLASS_LABEL[card.class]]
    .filter(Boolean).join(' · ');
  return (
    <div className="preview" data-rarity={rarity}>
      <div className={`bigcard r-${rarity}`}>
        <div className="bcWindow">
          <div className="bcArt" style={art ? { backgroundImage: `url(${art})` } : undefined}>
            {!art && <div className="bcArtFallback">{card.name[0]}</div>}
          </div>
        </div>
        <div className="bcCost">{card.cost ?? 0}</div>
        <div className="bcRarity">{rarity}</div>
        <div className="bcNameplate">
          <div className="bcName">{card.name}</div>
          <div className="bcType">{line || card.type}</div>
        </div>
        <div className={`bcPanel${!card.text ? ' vanillaPanel' : ''}`}>
          {card.text && <div className="bcText">{card.text}</div>}
          {flavor && <div className="bcFlavor">{flavor}</div>}
        </div>
        {card.type === 'minion' && <><div className="bcAtk">{card.attack}</div><div className="bcHp">{card.health}</div></>}
        <div className="bcGem" title={rarity} />
      </div>
      {gloss.length > 0 && (
        <div className="glossary">
          {gloss.map((g) => (
            <div className="gloss" key={g.label}>
              <span className="glossTerm">{g.label}</span>
              <span className="glossDesc">{g.desc}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
