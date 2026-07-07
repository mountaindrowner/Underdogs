# `@underdogs/ui` — React board + animation layer

Renders the board and **animates the engine's `GameEvent` stream** (CLAUDE.md §12).
React + DOM/CSS (not canvas), Vite. Mirrors `/prototypes/battle-slice.html`, using
the real generated card art.

```bash
cd ui
npm install
npm run dev       # dev server
npm run build     # production bundle -> dist/
npm run preview   # serve the build
```

## How it works — the animation pipeline

```
engine.applyAction(state, action) → { state, events }      (deterministic, in /engine)
             │
             ▼
   sim.ts   plays a full game (greedy AI both sides) → GameEvent[]
             │
             ▼
   view.ts  event-sources a View from the stream — the UI holds NO engine state.
            Each event is one "beat"; transient flags (lunge, damage float, hit
            flash, Fulfill burst) live one beat then clear; dead units fade then
            are removed.
             │
             ▼
   useReplay.ts  ticks the feed into the View on a timer
             │
             ▼
   App.tsx / styles.css  render + CSS keyframes (summon bloom, attack lunge,
            death-fade, floating numbers, shield shatter, gold Fulfill burst,
            screen-shake). Respects prefers-reduced-motion.
```

The current app is a **spectator demo**: both sides are played by the greedy demo
AI so you can watch the engine and animation vocabulary end-to-end. Interactive
play (drag-to-play, targeting arrows, mulligan) plugs into the same
`applyAction` + event-replay pipeline — the UI already speaks the event contract.

## Files
- `data.ts` — imports /data JSON, registers defs, maps `defId → art url`
- `sim.ts` — autoplay → event feed (also a reference greedy AI)
- `view.ts` — View model + `applyEvent` (event → board) + `clearTransient`
- `useReplay.ts` — timed playback hook
- `App.tsx` / `styles.css` — board + animations
