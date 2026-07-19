# UNDERDOGS

A digital collectible card game — Hearthstone-quality, skinned for Scripture. Adventure-epic, dry-witted, reverent at the core. Digital-only (iOS + web), free forever, solo-vs-AI first. The biblical story is taught *through mechanics* (see the **Fulfill** transformation system), never through sermons.

> Working title "COVENANT" is retired — the game is **UNDERDOGS** (decision D-21). *Covenant* survives only as the Patriarch **keyword** and in card names; it is not the product name.

> **Start here:**
> 1. [`CLAUDE.md`](./CLAUDE.md) — the constitution (laws, rules canon, conventions). Source of truth.
> 2. [`STATUS.md`](./STATUS.md) — **what is actually built vs. not.** Read before writing code.
> 3. [`docs/06-decisions-log.md`](./docs/06-decisions-log.md) — locked decisions + open questions.
>
> Where any doc disagrees, `CLAUDE.md` + the decisions log win on *canon*; `STATUS.md` wins on *current state*.

## Where the project is (short version)

Playable end to end: boot → choose your calling → earn Talents → open packs in the Storehouse → forge a deck from cards you actually own → play a full match vs. a heuristic AI to a win/loss, desktop or mobile-landscape. The **rules engine is built, deterministic, tested, and data-driven** — 239 card definitions all execute their text (audited). Campaign has 4 combat chapters; the economy (packs, crafting, Daily Bread — free forever) is real. **Not yet built:** Scroll Study, the sacred interlude, iOS wrapper. Full breakdown in [`STATUS.md`](./STATUS.md).

## Run it / check it

```bash
cd ui && npm install && npm run dev     # play locally (landscape)
cd ui && npm run build                  # production build → ui/dist

node --test engine/test/*.test.ts       # engine + effect tests (expect 32 pass)
node tools/audit-cards.ts               # card data ↔ engine check (expect: all check out)
node tools/soak.ts 1                     # AI-vs-AI crash test across all matchups
```

The engine runs on **Node 22 native TypeScript** (no build step). The UI is Vite + React 19.

## Documentation map
| File | What it is |
|---|---|
| [`CLAUDE.md`](./CLAUDE.md) | **The constitution.** Laws, rules canon, classes, keywords, balance rail, tech, how-to. |
| [`STATUS.md`](./STATUS.md) | **State of the union.** What works / is stubbed / is missing; how to verify; footguns. |
| [`docs/01-game-design.md`](./docs/01-game-design.md) | Full GDD. *(Some era-language predates the role-class pivot; CLAUDE.md is canon.)* |
| [`docs/02-set-architecture.md`](./docs/02-set-architecture.md) | Set structure, rarity, packs, economy, rotation. |
| [`docs/03-class-system.md`](./docs/03-class-system.md) | Classes as **roles**, eras as **tags**; the six classes in depth. |
| [`docs/04-card-database.md`](./docs/04-card-database.md) | The card list with class, tag, stats, rarity, text, flavor, art seeds. |
| [`docs/05-art-direction.md`](./docs/05-art-direction.md) | Master style prompt, per-class palettes, card-frame spec. |
| [`docs/06-decisions-log.md`](./docs/06-decisions-log.md) | **Locked decisions + open questions.** The reconciliation record. |
| [`docs/07-animation-and-feel.md`](./docs/07-animation-and-feel.md) | Animation vocabulary and juice targets. |
| [`docs/08-card-additions.md`](./docs/08-card-additions.md) | Card-fill working notes. |

## Data contracts
| File | What it is |
|---|---|
| [`data/cards.schema.json`](./data/cards.schema.json) | JSON Schema every card must validate against. |
| [`data/cards.seed.json`](./data/cards.seed.json) | **126 collectible cards.** ⚠️ Its `tokens`/`leaders`/`adversary` sublists are *superseded drafts* — live data is in the files below. |
| [`data/tokens.json`](./data/tokens.json) · [`leaders.json`](./data/leaders.json) · [`adversaries.json`](./data/adversaries.json) | Live tokens (7), leaders (12), adversaries (22). |
| [`data/campaign.json`](./data/campaign.json) | 4 campaign encounters. |
| [`data/keywords.json`](./data/keywords.json) | Keyword definitions as data. |

## Tooling
| File | What it is |
|---|---|
| [`tools/audit-cards.ts`](./tools/audit-cards.ts) | Verifies every card's data against what the engine implements. **Run after any card/engine change.** |
| [`tools/soak.ts`](./tools/soak.ts) | Plays AI-vs-AI across all class matchups as a crash/hang test. |
| [`tools/cardart/`](./tools/cardart/) | Build-time card-art pipeline (Gemini image API → framed PNGs). Never called at runtime. |
| [`prototypes/battle-slice.html`](./prototypes/battle-slice.html) | The original reference board slice. |

## The non-negotiables (full text in `CLAUDE.md` §2)
Jesus is never a card. Players field only the faithful; villains are AI-only. Joke about the humans, never the holy. Reverent combat VFX. The Cross/Resurrection beat is received, not won. Free forever — no IAP, no gacha, no ads. No backend, no network, no runtime AI.
