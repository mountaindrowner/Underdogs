/** The Codex kit — the UI's single governing metaphor (docs/22).
 *  UNDERDOGS is a book: menus are leaves of a codex (vellum, iron-gall ink,
 *  gold leaf, real pigments), battle is played on the table it rests on.
 *  Every menu surface is built from these pieces so the voice stays one voice. */
import type { ReactNode } from 'react';
import { GLYPHS, type GlyphName } from './glyphs.ts';
import { ShellBg, type SceneId } from '../title/scenes.tsx';
import { MusicToggle } from '../MusicToggle.tsx';

/** Pigment per class — the crest field. Each is a real manuscript colour. */
export const PIGMENT: Record<string, string> = {
  prophet: '#5b2a6b',    // murex purple — visions, royalty
  warrior: '#a5301c',    // vermilion
  priest: '#2c5596',     // azurite — "the robe of the ephod all of blue" (Ex 28)
  shepherd: '#2d6a4c',   // verdigris
  patriarch: '#6b4a16',  // umber under gold — the dust of the earth, the stars
  disciple: '#b25a1e',   // red ochre — the coal fire
  neutral: '#4a3b2a',    // sepia
};

/** A game-icons.net glyph (CC BY 3.0), drawn in currentColor. */
export function Glyph({ name, size = 20, className = '' }: { name: GlyphName; size?: number; className?: string }) {
  return (
    <svg className={`glyph ${className}`} viewBox="0 0 512 512" width={size} height={size}
      aria-hidden="true" dangerouslySetInnerHTML={{ __html: GLYPHS[name] }} />
  );
}

/** The glyph that stands for a class (falls back to the neutral triquetra). */
export const glyphFor = (cls?: string): GlyphName => (cls && cls in GLYPHS ? cls : 'neutral') as GlyphName;

/** An illuminated crest: gold glyph on a pigment field inside a gilt frame. */
export function Crest({ cls, glyph, size = 44, className = '' }:
  { cls?: string; glyph?: GlyphName; size?: number; className?: string }) {
  const name = glyph ?? glyphFor(cls);
  const field = PIGMENT[cls ?? 'neutral'] ?? PIGMENT.neutral;
  return (
    <span className={`crest ${className}`} style={{ ['--field' as string]: field, width: size, height: size } as React.CSSProperties}>
      <Glyph name={name} size={Math.round(size * 0.62)} />
    </span>
  );
}

/** An illuminated initial: one Uncial letter, gold on a pigment ground. */
export function DropCap({ letter, pigment = '#1f3a78', size = 56 }: { letter: string; pigment?: string; size?: number }) {
  return (
    <span className="dropCap" style={{ ['--field' as string]: pigment, width: size, height: size, fontSize: size * 0.78 } as React.CSSProperties}
      aria-hidden="true">{letter}</span>
  );
}

/** A gold rule with a centred lozenge — the codex's section divider. */
export function Rule({ className = '' }: { className?: string }) {
  return (
    <div className={`rule ${className}`} aria-hidden="true">
      <span />
      <svg viewBox="0 0 40 12" width="40" height="12">
        <path d="M2 6 L8 6 M32 6 L38 6" stroke="currentColor" strokeWidth="1.2" />
        <path d="M20 1 L25 6 L20 11 L15 6 Z" fill="currentColor" />
        <circle cx="11" cy="6" r="1.4" fill="currentColor" /><circle cx="29" cy="6" r="1.4" fill="currentColor" />
      </svg>
      <span />
    </div>
  );
}

/** The four gilt corner fleurons of a ruled page. */
export function Corners() {
  return <><i className="fleuron tl" /><i className="fleuron tr" /><i className="fleuron bl" /><i className="fleuron br" /></>;
}

/** A title opened with an illuminated initial: "T" + "he Sparring Pit". */
export function Rubric({ title, kicker, pigment }: { title: string; kicker?: ReactNode; pigment?: string }) {
  const [first, rest] = [title.slice(0, 1), title.slice(1)];
  return (
    <header className="rubricHead">
      <h1 className="rubricTitle">
        <DropCap letter={first} pigment={pigment} />
        <span>{rest}</span>
      </h1>
      {kicker && <div className="rubricKicker">{kicker}</div>}
    </header>
  );
}

/** One leaf of the codex: the shared frame for every menu sub-screen.
 *  A silk ribbon bookmark is the way back; the title is opened by an initial. */
export function Folio({ scene, title, kicker, back, backLabel = 'Contents', pigment, wide, className = '', children }:
  {
    scene: SceneId; title: string; kicker?: ReactNode; back: () => void; backLabel?: string;
    pigment?: string; wide?: boolean; className?: string; children: ReactNode;
  }) {
  return (
    <div className={`app codexScreen ${className}`}>
      <ShellBg scene={scene} />
      <div className={`leaf vellum${wide ? ' wide' : ''}`}>
        <Corners />
        <button className="ribbonBack" onClick={back} aria-label={`Back to ${backLabel}`}>
          <span>‹ {backLabel}</span>
        </button>
        <div className="leafMusic"><MusicToggle /></div>
        <Rubric title={title} kicker={kicker} pigment={pigment} />
        <Rule />
        <div className="leafBody">{children}</div>
      </div>
    </div>
  );
}
