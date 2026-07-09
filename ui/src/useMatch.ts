/** Match controller: owns the true engine state and drives the animated view.
 *  Human = Player 0 (bottom). AI = Player 1 (top). Parameterized by a
 *  MatchConfig (decks/leaders/pre-placed units/hp) so campaign encounters and
 *  free-play use the same loop. Input enabled only when animation catches up. */
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createGame, applyAction, buildDeck,
  type GameState, type GameEvent, type Action, type CardDef,
} from '../../engine/src/index.ts';
import { registry } from './data.ts';
import { initialView, applyEvent, clearTransient, type View } from './view.ts';
import { pickAction } from './ai.ts';
import { sfx } from './sfx.ts';
import type { MatchConfig } from './campaign.ts';

export function needsTarget(c: CardDef): boolean {
  return !!c.effects?.arrival?.some((op) => op.target === 'target');
}

const deck = (ids: string[]) => buildDeck(registry, ids);
const leaderDef = (id?: string) => (id ? registry.get(id) : undefined);

export function useMatch(cfg: MatchConfig) {
  const [seed, setSeed] = useState(1);
  const [engine, setEngine] = useState<GameState | null>(null);
  const hp0 = cfg.heroHp?.[0] ?? 30;
  const hp1 = cfg.heroHp?.[1] ?? 30;
  const [view, setView] = useState<View>(() => initialView(hp0, hp1));
  const [busy, setBusy] = useState(false);
  const feed = useRef<GameEvent[]>([]);
  const cursor = useRef(0);

  // (re)start when the encounter or seed changes
  useEffect(() => {
    const g = createGame({
      seed,
      decks: [deck(cfg.playerDeck), deck(cfg.enemyDeck)],
      leaders: [leaderDef(cfg.playerLeader), leaderDef(cfg.enemyLeader)],
      startUnits: cfg.startUnits,
      heroHp: cfg.heroHp,
      skipMulligan: false,
    });
    feed.current = [...g.events];
    cursor.current = 0;
    setView(initialView(hp0, hp1));
    setEngine(g.state);
    setBusy(feed.current.length > 0);
  }, [seed, cfg.key]);

  // animation ticker
  useEffect(() => {
    const id = setInterval(() => {
      if (cursor.current < feed.current.length) {
        const e = feed.current[cursor.current];
        cursor.current += 1;
        sfx.forEvent(e);
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

  // AI + auto-mulligan loop
  useEffect(() => {
    if (!engine || busy) return;
    if (engine.phase === 'mulligan' && engine.active === 1) {
      const keep = engine.players[1].hand.map((_, i) => i);
      const t = setTimeout(() => dispatch({ type: 'MULLIGAN', keep }), 250);
      return () => clearTimeout(t);
    }
    if (engine.phase === 'main' && engine.active === 1) {
      const t = setTimeout(() => dispatch(pickAction(engine, cfg.difficulty ?? 2)), 420);
      return () => clearTimeout(t);
    }
  }, [engine, busy, dispatch, cfg.difficulty]);

  const canAct = !!engine && !busy && engine.phase === 'main' && engine.active === 0;
  const inMulligan = !!engine && engine.phase === 'mulligan' && engine.active === 0;

  return { engine, view, busy, canAct, inMulligan, dispatch, newGame: () => setSeed((s) => s + 1) };
}
