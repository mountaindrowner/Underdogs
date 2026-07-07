import { useEffect, useRef, useState } from 'react';
import { initialView, applyEvent, clearTransient, type View } from './view.ts';
import { registry } from './data.ts';
import type { GameEvent } from '../../engine/src/index.ts';

/** Plays a GameEvent feed one beat at a time into an animated View. */
export function useReplay(events: GameEvent[], heroHp: number, beatMs = 360) {
  const [view, setView] = useState<View>(() => initialView(heroHp));
  const idx = useRef(0);
  const done = useRef(false);

  useEffect(() => {
    setView(initialView(heroHp));
    idx.current = 0; done.current = false;
    const id = setInterval(() => {
      setView((v) => {
        let nv = clearTransient(v);
        const e = events[idx.current];
        if (!e) { done.current = true; return nv; }
        nv = applyEvent(nv, e, registry);
        idx.current += 1;
        // skip zero-visual bookkeeping beats quickly by fast-forwarding trivial events
        return nv;
      });
    }, beatMs);
    return () => clearInterval(id);
  }, [events, heroHp, beatMs]);

  return { view, isDone: () => done.current };
}
