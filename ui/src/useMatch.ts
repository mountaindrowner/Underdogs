/** Match controller: owns the true engine state and drives the animated view.
 *  Human = Player 0 (bottom). AI = Player 1 (top). The board is rendered from
 *  the event-sourced `view` (lagged/animated); legality is read from `engine`.
 *  Input is enabled only when the animation has caught up to the engine. */
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createGame, applyAction, buildDeck,
  type GameState, type GameEvent, type Action, type CardDef,
} from '../../engine/src/index.ts';
import { registry } from './data.ts';
import { initialView, applyEvent, clearTransient, type View } from './view.ts';
import { pickAction } from './ai.ts';

const HERO_HP = 30;
const DECK_IDS = [
  'shepherd_boy', 'watchman', 'firstborn_heir', 'eager_convert', 'benaiah', 'ruth',
  'stephen', 'isaiah', 'shepherd_david', 'faithful_sheepdog', 'gather_the_flock', 'sarah',
  'fire_from_heaven',
];
function deck(): CardDef[] {
  const ids: string[] = [];
  for (let i = 0; i < 30; i++) ids.push(DECK_IDS[i % DECK_IDS.length]);
  return buildDeck(registry, ids.filter((id) => registry.has(id)));
}

export function needsTarget(c: CardDef): boolean {
  return !!c.effects?.arrival?.some((op) => op.target === 'target');
}

export function useMatch() {
  const [seed, setSeed] = useState(1);
  const [engine, setEngine] = useState<GameState | null>(null);
  const [view, setView] = useState<View>(() => initialView(HERO_HP));
  const [busy, setBusy] = useState(false);
  const feed = useRef<GameEvent[]>([]);
  const cursor = useRef(0);

  // (re)start game — you = David (Gather), AI = Elijah (Fire)
  useEffect(() => {
    const leaders: [CardDef | undefined, CardDef | undefined] =
      [registry.get('david_leader'), registry.get('elijah_leader')];
    const g = createGame({ seed, decks: [deck(), deck()], leaders, skipMulligan: false });
    feed.current = [...g.events];
    cursor.current = 0;
    setView(initialView(HERO_HP));
    setEngine(g.state);
    setBusy(feed.current.length > 0);
  }, [seed]);

  // animation ticker: play the feed into the view, one beat at a time
  useEffect(() => {
    const id = setInterval(() => {
      if (cursor.current < feed.current.length) {
        const e = feed.current[cursor.current];   // capture BEFORE advancing
        cursor.current += 1;
        setView((v) => applyEvent(clearTransient(v), e, registry));
        setBusy(cursor.current < feed.current.length);
      } else if (busy) {
        setBusy(false);
      }
    }, 300);
    return () => clearInterval(id);
  }, [busy]);

  const dispatch = useCallback((a: Action) => {
    setEngine((prev) => {
      if (!prev || prev.phase === 'over') return prev;
      const r = applyAction(prev, a);
      feed.current.push(...r.events);
      setBusy(true);
      return r.state;
    });
  }, []);

  // AI + auto-mulligan loop: acts once animations have caught up
  useEffect(() => {
    if (!engine || busy) return;
    if (engine.phase === 'mulligan' && engine.active === 1) {
      const keep = engine.players[1].hand.map((_, i) => i); // AI keeps its hand
      const t = setTimeout(() => dispatch({ type: 'MULLIGAN', keep }), 250);
      return () => clearTimeout(t);
    }
    if (engine.phase === 'main' && engine.active === 1) {
      const t = setTimeout(() => dispatch(pickAction(engine)), 420);
      return () => clearTimeout(t);
    }
  }, [engine, busy, dispatch]);

  const canAct = !!engine && !busy && engine.phase === 'main' && engine.active === 0;
  const inMulligan = !!engine && engine.phase === 'mulligan' && engine.active === 0;

  return { engine, view, busy, canAct, inMulligan, dispatch, newGame: () => setSeed((s) => s + 1) };
}
