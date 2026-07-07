# COVENANT

A digital collectible card game — Hearthstone-quality, skinned for Scripture. Adventure-epic, dry-witted, reverent at the core. Digital-only (iOS + web), free forever, solo-vs-AI first. The biblical story is taught *through mechanics* (see: the **Fulfill** transformation system), never through sermons.

> **Start here:** read [`CLAUDE.md`](./CLAUDE.md). It is the source of truth — the laws, the locked rules, and the conventions. Everything in `/docs` is supporting detail; where they disagree, `CLAUDE.md` and [`docs/06-decisions-log.md`](./docs/06-decisions-log.md) win.

## Documentation map
| File | What it is |
|---|---|
| [`CLAUDE.md`](./CLAUDE.md) | **The constitution.** Laws, rules canon, classes, keywords, balance rail, tech, how-to. |
| [`docs/01-game-design.md`](./docs/01-game-design.md) | Full GDD — vision, campaign, deep design. *(Some era-language predates the role-class pivot; CLAUDE.md is canon.)* |
| [`docs/02-set-architecture.md`](./docs/02-set-architecture.md) | Set structure, rarity, packs, economy, rotation — the Hearthstone teardown applied. |
| [`docs/03-class-system.md`](./docs/03-class-system.md) | Why classes are **roles** and eras are **tags**; the six classes in depth. |
| [`docs/04-card-database.md`](./docs/04-card-database.md) | **The master card list** — ~97 cards with class, tag, stats, rarity, text, flavor, and art seeds. |
| [`docs/05-art-direction.md`](./docs/05-art-direction.md) | Master style prompt, per-class palettes, card-frame spec, how to batch-generate consistently. |
| [`docs/06-decisions-log.md`](./docs/06-decisions-log.md) | **Locked decisions + open questions.** The reconciliation record. |

## Data contracts
| File | What it is |
|---|---|
| [`data/cards.schema.json`](./data/cards.schema.json) | JSON Schema every card must validate against. |
| [`data/cards.seed.json`](./data/cards.seed.json) | ~30 real cards as data — the concrete example to build the engine on. |
| [`data/keywords.json`](./data/keywords.json) | Keyword definitions as data. |

## Prototype
| File | What it is |
|---|---|
| [`prototypes/battle-slice.html`](./prototypes/battle-slice.html) | Playable Hearthstone-style board (open in a browser; best in landscape). The UI + rules reference for the real build. |

## Quickstart for Claude Code
1. Read `CLAUDE.md` end to end, then `docs/06-decisions-log.md`.
2. Skim `docs/04-card-database.md` for the card voice, and `data/cards.seed.json` for the data shape.
3. First task (per `CLAUDE.md` §11): stand up `/engine` + `/data` — load the seed cards, implement the effect-verb library, and drive the prototype's rules from data. Keep the engine deterministic (seeded) and unit-tested.

## The non-negotiables (full text in `CLAUDE.md` §2)
Jesus is never a card. Players field only the faithful; villains are AI-only. Joke about the humans, never the holy. Reverent combat VFX. The Cross/Resurrection beat is received, not won. Free forever — no IAP, no gacha, no ads.
