/** Title background scenes. One is chosen at random on boot and stays put
 *  (no slideshow). Stage 1 ships the Coat of Many Colors; Reeds, Elah-sunset,
 *  and Red Sea slot into SCENES here in stage 2. All texture is CSS/SVG. */
import { useMemo } from 'react';

const rand = (a: number, b: number) => a + Math.random() * (b - a);

function CoatScene() {
  const dust = useMemo(() => Array.from({ length: 26 }, () => ({
    left: rand(2, 98), top: rand(28, 96), d: rand(10, 18), dl: rand(0, 14),
  })), []);
  return (
    <div className="coat">
      <div className="stars" />
      <div className="coatStage">
        <div className="robe">
          <div className="r-stripes" /><div className="r-round" /><div className="r-folds" />
          <div className="r-light" /><div className="r-sheen" /><div className="r-weave" />
          <div className="r-threads" /><div className="r-trim" />
          <div className="r-collar" /><div className="r-hem" />
        </div>
      </div>
      <div className="ao" />
      <div className="dust">
        {dust.map((m, i) => (
          <span key={i} style={{ left: `${m.left}%`, top: `${m.top}%`,
            ['--d' as string]: `${m.d}s`, ['--dl' as string]: `${m.dl}s` } as React.CSSProperties} />
        ))}
      </div>
    </div>
  );
}

export type SceneId = 'coat'; // 'reeds' | 'elah' | 'redsea' land here in stage 2
export const SCENES: SceneId[] = ['coat'];
export function pickScene(): SceneId { return SCENES[Math.floor(Math.random() * SCENES.length)]; }

export function Scene({ id }: { id: SceneId }) {
  switch (id) {
    case 'coat':
    default: return <CoatScene />;
  }
}
