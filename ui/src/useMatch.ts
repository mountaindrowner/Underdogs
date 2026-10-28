/** Match controller: owns the true engine state and drives the animated view.
 *  Human = Player 0 (bottom). AI = Player 1 (top). Parameterized by a
 *  MatchConfig (decks/leaders/pre-placed units/hp) so campaign encounters and
 *  free-play use the same loop. Input enabled only when animation catches up. */
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createGame, applyAction, buildDeck,
  type GameState, type GameEvent, type Action,
} from '../../engine/src/index.ts';
import { registry } from './data.ts';
import { initialView, applyEvent, clearTransient, reconcile, type View } from './view.ts';
import { pickAction, pickActionStrong } from './ai.ts';
import { sfx } from './sfx.ts';
import { haptics } from './haptics.ts';
import type { MatchConfig } from './campaign.ts';

const deck = (ids: string[]) => buildDeck(registry, ids);
/** DEV: ?autopilot=1 plays the human seat with the strong AI and runs the beats fast. */
const AUTOPILOT = typeof location !== 'undefined' && new URLSearchParams(location.search).has('autopilot');
const leaderDef = (id?: string) => (id ? registry.get(id) : undefined);

export function useMatch(cfg: MatchConfig) {
  const [seed, setSeed] = useState(1);
  const [engine, setEngine] = useState<GameState | null>(null);
  const [matchId, setMatchId] = useState('');   // set together with each new engine
  const hp0 = cfg.heroHp?.[0] ?? 30;
  const hp1 = cfg.heroHp?.[1] ?? 30;
  const [view, setView] = useState<View>(() => initialView(hp0, hp1));
  const [busy, setBusy] = useState(false);
  const feed = useRef<GameEvent[]>([]);
  const truth = useRef<GameState | null>(null);   // latest engine state, for reconcile
  // economy: running tally of YOUR actions this match (docs/21 quest fuel)
  const stats = useRef({ spellsCast: 0, fulfills: 0, classCardsPlayed: 0, unitsSummoned: 0 });
  const youClass = registry.get(cfg.playerLeader ?? '')?.class;
  const tally = (evs: { t: string }[]) => {
    for (const e of evs as Array<Record<string, unknown> & { t: string }>) {
      if (e.t === 'cardPlayed' && e.player === 0) {
        const def = registry.get(e.defId as string);
        if (def?.type === 'spell') stats.current.spellsCast += 1;
        if (youClass && def?.class === youClass) stats.current.classCardsPlayed += 1;
      }
      if (e.t === 'summon' && e.owner === 0) stats.current.unitsSummoned += 1;
      if (e.t === 'fulfill' && e.owner === 0) stats.current.fulfills += 1;
    }
  };
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
      interactivePlayer: 0,          // the human pauses for Foresee / Discover
    });
    feed.current = [...g.events];
    stats.current = { spellsCast: 0, fulfills: 0, classCardsPlayed: 0, unitsSummoned: 0 };
    tally(g.events);
    cursor.current = 0;
    setView(initialView(hp0, hp1));
    truth.current = g.state;
    setEngine(g.state);
    setMatchId(`${cfg.key}:${seed}`);
    setBusy(feed.current.length > 0);
  }, [seed, cfg.key]);

  // animation ticker
  useEffect(() => {
    const id = setInterval(() => {
      if (cursor.current < feed.current.length) {
        const e = feed.current[cursor.current];
        cursor.current += 1;
        sfx.forEvent(e);
        haptics.forEvent(e);
        setView((v) => applyEvent(clearTransient(v), e, registry));
        setBusy(cursor.current < feed.current.length);
      } else if (busy) {
        // every beat has played: snap the board to the engine's truth
        if (truth.current) { const t = truth.current; setView((v) => reconcile(v, t)); }
        setBusy(false);
      }
    }, AUTOPILOT ? 40 : 300);
    return () => clearInterval(id);
  }, [busy]);

  const dispatch = useCallback((a: Action) => {
    setEngine((prev) => {
      if (!prev || prev.phase === 'over') return prev;
      const r = applyAction(prev, a);
      truth.current = r.state;
      feed.current.push(...r.events);
      tally(r.events);
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
      const t = setTimeout(() => dispatch(
        cfg.difficulty === 3 ? pickActionStrong(engine) : pickAction(engine, (cfg.difficulty ?? 2) as 0 | 1 | 2)), AUTOPILOT ? 60 : 420);
      return () => clearTimeout(t);
    }
  }, [engine, busy, dispatch, cfg.difficulty]);

  // DEV ?autopilot=1 — the strong AI plays YOUR seat too (mulligan, choices,
  // moves), so whole chapters run through the real screens for end-to-end checks
  useEffect(() => {
    if (!AUTOPILOT || !engine || busy || engine.phase === 'over' || engine.active !== 0) return;
    const pc = engine.pending;
    const a: Action | null = engine.phase === 'mulligan' ? { type: 'MULLIGAN', keep: engine.players[0].hand.map((_, i) => i) }
      : pc ? { type: 'RESOLVE_CHOICE', keep: [], picked: Array.from({ length: pc.pick }, (_, i) => i) }
      : engine.phase === 'main' ? pickActionStrong(engine) : null;
    if (!a) return;
    const t = setTimeout(() => dispatch(a), 60);
    return () => clearTimeout(t);
  }, [engine, busy, dispatch]);

  // a Foresee/Discover awaiting the human (only surface it once animations catch up)
  const choice = engine?.pending && !busy ? engine.pending : null;
  const canAct = !!engine && !busy && !engine.pending && engine.phase === 'main' && engine.active === 0;
  const inMulligan = !!engine && engine.phase === 'mulligan' && engine.active === 0;

  // matchId: one per played match (Retry / Play Again start a new one) — keys the payout
  return { engine, view, busy, canAct, inMulligan, choice, dispatch, stats, matchId, newGame: () => setSeed((s) => s + 1) };
}
