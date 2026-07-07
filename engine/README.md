# `@underdogs/engine` — rules engine

Pure **TypeScript**, **zero runtime dependencies**, **deterministic given a seed**,
and **event-emitting** so the UI can animate. Runs on Node 22's native TypeScript
(no build step) and tests with the built-in runner.

```bash
cd engine
node --test "test/*.test.ts"   # run the suite  (npm test)
node examples/replay.ts        # play a demo game, print the event stream (npm run demo)
```

## Principles (from `CLAUDE.md` §8, §12)

1. **Deterministic.** All randomness comes from a seeded PRNG (`rng.ts`); the
   seed + action list fully reproduce a game. Enables headless AI-vs-AI balance
   sims and replays. Never `Math.random`/`Date.now`.
2. **Cards are data.** Card behaviour lives in `/data/*.json` as an `effects`
   map of *trigger → EffectOp[]*, executed by the effect-verb interpreter
   (`effects.ts`). Adding a card needs **no engine code** unless it needs a
   genuinely new verb.
3. **UI-free & event-driven.** The engine never imports UI code. Every visible
   state change is emitted as a `GameEvent`. The animation layer replays those
   events, then reflects the resulting state. This is what keeps the board
   Hearthstone-alive without coupling rules to rendering.

## Public API

```ts
import { createGame, applyAction, registerDefs, loadCardData, makeRegistry, buildDeck } from '@underdogs/engine';

registerDefs(loadCardData([...jsonPaths]));           // once: register token/transform defs for summon/fulfill
const { state, events } = createGame({ seed, decks: [d0, d1], leaders, skipMulligan });
const next = applyAction(state, { type: 'PLAY_CARD', handIndex: 0, targetUid });
//    next.state   -> new immutable GameState
//    next.events  -> ordered GameEvent[] to animate
```

`applyAction` is a **pure reducer**: it deep-clones the input state, mutates the
clone, and returns `{ state, events }`. Actions: `MULLIGAN`, `PLAY_CARD`,
`ATTACK`, `HERO_POWER`, `END_TURN`.

## The animation contract (`events.ts`)

The UI consumes the `GameEvent` stream in order. Suggested mapping to the
animation vocabulary in `docs/07-animation-and-feel.md`:

| Event | Animation |
|---|---|
| `summon` | unit fades/scales in with a light bloom |
| `cardPlayed` / `provision` | hand card arcs to board; Provision crystals drain |
| `attackDeclared` | attacker lifts & lunges; targeting arrow |
| `damage` / `heroDamage` | impact flash + screen-shake (scaled), floating damage number |
| `heal` / `heroHeal` | soft green rise + number |
| `endureShatter` | shield shimmer shatters on the blocked hit |
| `buff` / `setAttack` / `keyword` | stat pop / keyword glyph flare |
| `death` | unit **falls and fades to light/dust** (Law 4 — never gore) |
| `legacy` / `redeem` / `scatter` | deathrattle spray / Sheep re-form / Disciple tokens spray |
| `fulfill` | **gold burst + name/stat morph** (the signature beat) |
| `heroPower` / `foresee` / `discover` | distinct flourish; choice UI |
| `phase` / `gameOver` | turn banners; victory/defeat |

Because the engine is deterministic, the UI can also *pre-roll* the whole event
list for an action and choreograph timing before committing the new state.

## Implemented

- Turn structure: Dawn (ready, +Provision refill, Covenant triggers, draw) →
  Main → Dusk. Provision 1→cap 10. Board/hand limits. Fatigue. Win at 0 HP.
- Combat: attack, counter-damage, **Guard**, **Swift**, **Endure**,
  **Giant-Slayer**, deaths → **Legacy** / self-**Redeem** / **Scatter**.
- **Auras** (attack, recomputed on board change — e.g. David the King).
- **Fulfill**: `control_allies`, `slay_giant`, `survive_damage` (framework for more).
- Effect verbs: `deal, heal/healUnit/healHero, buff, setAttack, giveKeyword,
  silence, summon, draw, drawType, destroy, exile, transform`. Targeting:
  self / target / all / random / hero / strongest-weakest.
- Hero Powers (from Leader defs).

## Extension points (TODO, clearly stubbed)

- `foresee` / `discover` emit events but need a choice callback for interactive
  play (headless AI resolves deterministically).
- `costReduce`, `returnFromDiscard`, relic attach/standing: scaffolded no-ops.
- Watcher-style Redeem (a Shepherd reacting to *other* units dying) — currently
  self-Redeem only.
- Health auras (v1 auras are attack-only).
- More Fulfill conditions (`survive_stronger`, `win_outnumbered`, Saul→Paul auto).

## Layout

```
engine/
  src/  rng · types · events · cards(data loader) · effects(verb interpreter) · engine · index
  test/ engine.test.ts   (node:test)
  examples/ replay.ts     (demo + reference greedy AI)
```
