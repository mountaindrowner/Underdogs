/** The Armory — decks & collection. Browse every war-band (six starter decks
 *  plus your forged ones), read any card, and forge new decks under the real
 *  deck rules (30 cards, one class + neutral, max 2 copies, 1 per Legendary). */
import { useMemo, useState } from 'react';
import { ShellBg, type SceneId } from './title/scenes.tsx';
import { MusicToggle } from './MusicToggle.tsx';
import { CardPreview } from './CardPreview.tsx';
import { fitName } from './fit.ts';
import { ownedCount, craft, canCraft, craftCost, disenchant, shatterValue, collectionStats, eco, clearNew } from './economy.ts';
import { artUrl, registry } from './data.ts';
import {
  allDecks, collectiblePool, saveCustomDeck, deleteCustomDeck, deckProblems, maxCopies,
  CLASSES, CLASS_META, type DeckDef,
} from './decks.ts';
import type { CardDef } from '../../engine/src/index.ts';

type Mode =
  | { t: 'decks'; sel: string | null }
  | { t: 'collection' }
  | { t: 'edit'; draft: DeckDef };

const byCost = (a: CardDef, b: CardDef) => (a.cost ?? 0) - (b.cost ?? 0) || a.name.localeCompare(b.name);

type CollSort = 'cost' | 'name' | 'rarity' | 'attack' | 'health';
const RAR_ORD: Record<string, number> = { common: 0, rare: 1, epic: 2, legendary: 3 };

function GridCard({ c, count, onClick, dim, ribbon }:
  { c: CardDef; count?: number; onClick?: () => void; dim?: boolean; ribbon?: boolean }) {
  const art = artUrl(c.id);
  return (
    <div className={`handcard big r-${c.rarity ?? 'common'} gridCard${dim ? ' unowned' : ''}${ribbon ? ' gcNew' : ''}`} onClick={onClick}>
      <div className="hcInner"><div className="hcFace">
        <div className="hcArt" style={art ? { backgroundImage: `url(${art})` } : undefined} />
        <div className={`hcName${fitName(c.name)}`}>{c.name}</div>
      </div></div>
      <div className="hcCost">{c.cost ?? 0}</div>
      {c.type === 'minion' && <><div className="hcAtk">{c.attack}</div><div className="hcHp">{c.health}</div></>}
      {count ? <div className="gcCount">×{count}</div> : null}
    </div>
  );
}

/** one line of a deck list: cost gem · name · copies */
function DeckRow({ c, n, onClick, onRemove }: { c: CardDef; n: number; onClick?: () => void; onRemove?: () => void }) {
  return (
    <div className={`dRow r-${c.rarity ?? 'common'}`} onClick={onClick}>
      <span className="drCost">{c.cost ?? 0}</span>
      <span className="drName">{c.name}</span>
      {n > 1 && <span className="drN">×{n}</span>}
      {onRemove && <button className="drDel" onClick={(e) => { e.stopPropagation(); onRemove(); }}>−</button>}
    </div>
  );
}

function deckEntries(cards: string[]): { c: CardDef; n: number }[] {
  const counts = new Map<string, number>();
  for (const id of cards) counts.set(id, (counts.get(id) ?? 0) + 1);
  return [...counts.entries()]
    .map(([id, n]) => ({ c: registry.get(id)!, n }))
    .filter((e) => e.c)
    .sort((a, b) => byCost(a.c, b.c));
}

export function DecksScreen({ scene, onBack }: { scene: SceneId; onBack: () => void }) {
  const [mode, setMode] = useState<Mode>({ t: 'decks', sel: null });
  const [peek, setPeek] = useState<CardDef | null>(null);
  const [rev, setRev] = useState(0); // bump after save/delete
  const decks = useMemo(allDecks, [rev]);
  const pool = useMemo(collectiblePool, []);

  const startForge = (cls: string) => {
    const m = CLASS_META[cls];
    setMode({
      t: 'edit',
      draft: { id: `custom_${Date.now()}`, name: `New ${cls[0].toUpperCase()}${cls.slice(1)} Deck`, class: cls, leader: m.leader, cards: [], blurb: '', custom: true },
    });
  };
  const editCopy = (d: DeckDef) => setMode({
    t: 'edit',
    draft: d.custom ? { ...d, cards: [...d.cards] }
      : { ...d, id: `custom_${Date.now()}`, name: `${d.name} (forged)`, cards: [...d.cards], custom: true },
  });

  // ---- editor helpers ----
  const draft = mode.t === 'edit' ? mode.draft : null;
  const setDraft = (d: DeckDef) => setMode({ t: 'edit', draft: d });
  const countOf = (id: string) => draft ? draft.cards.filter((x) => x === id).length : 0;
  const canAdd = (c: CardDef) => !!draft && draft.cards.length < 30
    && countOf(c.id) < Math.min(maxCopies(c), ownedCount(c.id))
    && (c.class === draft.class || c.class === 'neutral');
  const add = (c: CardDef) => { if (draft && canAdd(c)) setDraft({ ...draft, cards: [...draft.cards, c.id].sort() }); };
  const removeOne = (id: string) => {
    if (!draft) return;
    const i = draft.cards.indexOf(id);
    if (i >= 0) setDraft({ ...draft, cards: [...draft.cards.slice(0, i), ...draft.cards.slice(i + 1)] });
  };

  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const [collClass, setCollClass] = useState<string>('all');
  const [collQ, setCollQ] = useState('');
  const [collRarity, setCollRarity] = useState<string>('all');
  const [collSort, setCollSort] = useState<CollSort>('cost');
  const [collOwn, setCollOwn] = useState<'all' | 'owned' | 'missing'>('all');

  const header = (
    <div className="topbar">
      <button className="backBtn" onClick={() => (mode.t === 'decks' ? onBack() : setMode({ t: 'decks', sel: mode.t === 'edit' ? null : null }))}>
        ‹ {mode.t === 'decks' ? 'Menu' : 'Armory'}</button>
      <div className="brand">UNDERDOGS <span>· the armory</span></div>
      <MusicToggle />
    </div>
  );

  // ============================ EDITOR ============================
  if (draft) {
    const legalPool = pool.filter((c) => (c.class === draft.class || c.class === 'neutral')
      && ownedCount(c.id) > 0).sort(byCost);   // the forge works only with what you own
    const probs = deckProblems(draft);
    const leaders = [...registry.values()].filter((c) => c.type === 'leader' && c.class === draft.class);
    return (
      <div className="app storyMenu armory">
        <ShellBg scene={scene} />
        <div className="storyWrap">
          {header}
          <div className="forge">
            <div className="forgeSide">
              <input className="forgeName" value={draft.name} maxLength={28}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
              <select className="forgeLeader" value={draft.leader}
                onChange={(e) => setDraft({ ...draft, leader: e.target.value })}>
                {leaders.map((l) => <option key={l.id} value={l.id}>{l.name} — {l.hero_power?.name}</option>)}
              </select>
              <div className={`forgeCount${draft.cards.length === 30 ? ' ok' : ''}`}>{draft.cards.length} / 30</div>
              <div className="forgeList">
                {deckEntries(draft.cards).map(({ c, n }) => (
                  <DeckRow key={c.id} c={c} n={n} onClick={() => setPeek(c)} onRemove={() => removeOne(c.id)} />
                ))}
              </div>
              <button className="bigbtn forgeSave" disabled={probs.length > 0}
                onClick={() => { saveCustomDeck(draft); setRev((r) => r + 1); setMode({ t: 'decks', sel: draft.id }); }}>
                {probs.length ? probs[0] : 'Seal the Deck'}
              </button>
            </div>
            <div className="forgeBrowse">
              {legalPool.map((c) => (
                <div key={c.id} className={`fbCell${canAdd(c) ? '' : ' spent'}`}>
                  <GridCard c={c} count={countOf(c.id)} onClick={() => (canAdd(c) ? add(c) : setPeek(c))} />
                  <button className="fbInfo" onClick={(e) => { e.stopPropagation(); setPeek(c); }}>ℹ</button>
                </div>
              ))}
            </div>
          </div>
        </div>
        {peek && <div className="peek" onClick={() => setPeek(null)}><CardPreview card={peek} /></div>}
      </div>
    );
  }

  // ============================ COLLECTION ============================
  if (mode.t === 'collection') {
    const SORTS: Record<CollSort, (a: CardDef, b: CardDef) => number> = {
      cost: byCost,
      name: (a, b) => a.name.localeCompare(b.name),
      rarity: (a, b) => (RAR_ORD[b.rarity ?? 'common'] - RAR_ORD[a.rarity ?? 'common']) || byCost(a, b),
      attack: (a, b) => (b.attack ?? -1) - (a.attack ?? -1) || byCost(a, b),
      health: (a, b) => (b.health ?? -1) - (a.health ?? -1) || byCost(a, b),
    };
    const q = collQ.trim().toLowerCase();
    const stats = collectionStats();
    const shown = pool.filter((c) => (collClass === 'all' || c.class === collClass)
      && (collRarity === 'all' || (c.rarity ?? 'common') === collRarity)
      && (collOwn === 'all' || (collOwn === 'owned') === (ownedCount(c.id) > 0))
      && (!q || c.name.toLowerCase().includes(q) || (c.text ?? '').toLowerCase().includes(q)))
      .sort(SORTS[collSort]);
    return (
      <div className="app storyMenu armory">
        <ShellBg scene={scene} />
        <div className="storyWrap">
          {header}
          <div className="armTabs">
            <button onClick={() => setMode({ t: 'decks', sel: null })}>War-bands</button>
            <button className="on">Collection</button>
          </div>
          <div className="collBar">
            <input className="collSearch" type="search" placeholder="Search name or text…"
              value={collQ} onChange={(e) => setCollQ(e.currentTarget.value)} />
            <div className="collRarities">
              {(['all', 'common', 'rare', 'epic', 'legendary'] as const).map((r) => (
                <button key={r} className={`chip rc-${r}${collRarity === r ? ' on' : ''}`}
                  onClick={() => setCollRarity(r)}>{r === 'all' ? 'Any' : r[0].toUpperCase() + r.slice(1)}</button>
              ))}
            </div>
            <select className="collSort" value={collSort}
              onChange={(e) => setCollSort(e.currentTarget.value as CollSort)}>
              <option value="cost">Sort: Cost</option>
              <option value="name">Sort: Name</option>
              <option value="rarity">Sort: Rarity</option>
              <option value="attack">Sort: Attack</option>
              <option value="health">Sort: Health</option>
            </select>
            <div className="collRarities">
              {(['all', 'owned', 'missing'] as const).map((o) => (
                <button key={o} className={`chip${collOwn === o ? ' on' : ''}`}
                  onClick={() => setCollOwn(o)}>{o === 'all' ? 'Every card' : o === 'owned' ? `Owned ${stats.owned}` : `Missing ${stats.total - stats.owned}`}</button>
              ))}
            </div>
            <span className="collCount">{shown.length}</span>
          </div>
          <div className="collChips">
            {['all', ...CLASSES, 'neutral'].map((k) => (
              <button key={k} className={`chip${collClass === k ? ' on' : ''}`} onClick={() => setCollClass(k)}>
                {k === 'all' ? '❖ All' : `${CLASS_META[k]?.icon ?? '◇'} ${k[0].toUpperCase()}${k.slice(1)}`}
              </button>
            ))}
          </div>
          <div className="collGrid">
            {shown.length === 0 && <div className="collEmpty">Nothing gleaned — loosen the sieve.</div>}
            {shown.map((c) => (
              <GridCard key={c.id} c={c} onClick={() => { setPeek(c); clearNew(c.id); }}
                count={ownedCount(c.id) || undefined} dim={ownedCount(c.id) === 0}
                ribbon={eco().newIds.includes(c.id)} />
            ))}
          </div>
        </div>
        {peek && (
          <div className="peek" onClick={() => setPeek(null)}>
            <div onClick={(e) => e.stopPropagation()} className="peekWrap">
              <CardPreview card={peek} />
              <div className="peekForge">
                <button className="bigbtn quiet" disabled={!canCraft(peek)}
                  onClick={() => { if (craft(peek)) setPeek({ ...peek }); }}>
                  Craft — {craftCost(peek)} ✦</button>
                {ownedCount(peek.id) > 0 && (
                  <button className="bigbtn quiet" onClick={() => { if (disenchant(peek)) setPeek({ ...peek }); }}>
                    Shatter — +{shatterValue(peek)} ✦</button>
                )}
                <span className="peekOwn">{ownedCount(peek.id)} owned · ✦ {eco().fragments}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ============================ DECK LIST ============================
  const sel = decks.find((d) => d.id === mode.sel) ?? null;
  return (
    <div className="app storyMenu armory">
      <ShellBg scene={scene} />
      <div className="storyWrap">
        {header}
        <div className="armTabs">
          <button className="on">War-bands</button>
          <button onClick={() => setMode({ t: 'collection' })}>Collection</button>
        </div>
        <div className="armBody">
          <div className="deckShelf armShelf">
            {decks.map((d) => {
              const m = CLASS_META[d.class];
              return (
                <button key={d.id} className={`deckTile${sel?.id === d.id ? ' sel' : ''}`}
                  style={{ ['--gem' as string]: m?.color ?? '#888' } as React.CSSProperties}
                  onClick={() => setMode({ t: 'decks', sel: d.id })}>
                  <span className="dtIcon">{m?.icon ?? '❖'}</span>
                  <span className="dtName">{d.name}</span>
                  <span className="dtSub">{registry.get(d.leader)?.name ?? d.class}{d.custom ? ' · forged' : ''}</span>
                </button>
              );
            })}
            <button className="deckTile forgeTile" onClick={() => setMode({ t: 'decks', sel: '__new__' })}>
              <span className="dtIcon">⚒</span>
              <span className="dtName">Forge a Deck</span>
              <span className="dtSub">five smooth stones &amp; change</span>
            </button>
          </div>

          {mode.sel === '__new__' ? (
            <div className="deckDetail">
              <div className="ddName">Choose a calling</div>
              <div className="classPick">
                {CLASSES.map((cls) => (
                  <button key={cls} style={{ ['--gem' as string]: CLASS_META[cls].color } as React.CSSProperties}
                    onClick={() => startForge(cls)}>
                    <span>{CLASS_META[cls].icon}</span>{cls[0].toUpperCase()}{cls.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          ) : sel && (
            <div className="deckDetail">
              <div className="ddName">{sel.name}</div>
              <div className="ddSub">{registry.get(sel.leader)?.name} · {sel.cards.length} cards{sel.blurb ? ` — ${sel.blurb}` : ''}</div>
              <div className="ddList">
                {deckEntries(sel.cards).map(({ c, n }) => (
                  <DeckRow key={c.id} c={c} n={n} onClick={() => setPeek(c)} />
                ))}
              </div>
              <div className="ddBtns">
                <button className="bigbtn quiet" onClick={() => editCopy(sel)}>{sel.custom ? 'Edit' : 'Copy & Edit'}</button>
                {sel.custom && (confirmDel === sel.id
                  ? <button className="bigbtn ddDel sure" onClick={() => { deleteCustomDeck(sel.id); setConfirmDel(null); setMode({ t: 'decks', sel: null }); setRev((r) => r + 1); }}>Really melt it?</button>
                  : <button className="bigbtn ddDel" onClick={() => setConfirmDel(sel.id)}>Melt Down</button>)}
              </div>
            </div>
          )}
        </div>
      </div>
      {peek && <div className="peek" onClick={() => setPeek(null)}><CardPreview card={peek} /></div>}
    </div>
  );
}
