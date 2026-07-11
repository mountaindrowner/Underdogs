# 06 — Decisions Log & Open Questions

*The reconciliation record. When older docs (GDD, architecture) show earlier thinking, this log + `CLAUDE.md` are what's actually true now. Newest decisions on top.*

> **For "what is built vs. not built right now," see [`../STATUS.md`](../STATUS.md).** This log records *decisions*; STATUS records *state*.

## Locked decisions (canonical)

| # | Decision | Notes / supersedes |
|---|---|---|
| D-30 | **Game-feel arc: haptics + physical dynamism.** `ui/src/haptics.ts` maps game events to `navigator.vibrate` patterns (no-op where unsupported; real iOS haptics come with Capacitor). Combat is physical: directional lunge (attacker travels into its measured target), impact sparks/ring, damage-scaled table shake + sized floats, death dissolve-to-light with rising motes (Law 4), summon bloom, Endure shatter shards, hurt vignette, hover-only board parallax. All gated by `prefers-reduced-motion`. The AI also gained **lethal awareness** at every difficulty (open face + board ≥ foe HP → go face; 1 regression test). | Fulfils CLAUDE.md §12's "exceed the prototype." Feel beats verified live via a MutationObserver-instrumented Playwright run (9/9 core beats observed). |
| D-29 | **Foresee & Discover are interactive** (were cosmetic no-ops). The engine pauses on a `PendingChoice` for the human (`interactivePlayer`) and resolves via a `RESOLVE_CHOICE` action; the AI/headless auto-resolves inline so the reducer stays fully-resolving and deterministic (AI-vs-AI + lookahead unaffected). Foresee = reveal top X, keep/bottom; Discover (Solomon) = reveal N, keep K. Ops after the choice (Elisha's heal) resume on resolution. | Closes decisions-log open-Q1. 6 regression tests; overlay screenshot-verified. `foresee`/`discover` in CLAUDE.md §8 are no longer starred no-ops. |
| D-28 | **Fail-safe status doc: [`STATUS.md`](../STATUS.md) at the repo root.** It is the single source of truth for what's built / stubbed / missing, how to verify, and the known footguns. Rule: any commit that changes project state updates STATUS.md in the same commit. | Prevents "we forgot what we built." README + CLAUDE.md §11 point to it. |
| D-27 | **Card data is enforced by an audit: `tools/audit-cards.ts`.** It walks every definition and fails if the data uses a trigger/verb/target/keyword/condition the engine doesn't implement. Its constant Sets ARE the contract of engine capability. `tools/soak.ts` plays AI-vs-AI across all 36 class matchups as a crash test. | Run both after any card or engine change. Caught 133 silent no-ops on first run (incl. King David's aura, all standing relics, Saul→Paul). |
| D-26 | **Effect system built out to execute all authored card text.** Auras gained health + granted-keywords + conditions; standing relics get a real zone; new triggers (startOfTurn, endOfTurn, onDeath+replaceDeath, raise, generic listeners, passive); explicit-target aliases with side validation; a graveyard powering Raise/returnFromDiscard; Fulfill conditions incl. automatic Saul→Paul. New verbs documented in CLAUDE.md §8. | Turned the card JSON from ~26% executable to 100% (167 defs, 3 deferred). 23 regression tests. |
| D-25 | **Front-end shell + game loop built** — Title → Main Menu (on the "coat of many colours" robe) → Story / Free Play / Decks; mulligan → match-start "doors" transition → battle → result. Responsive: desktop fills the screen, mobile-landscape gets a compact layout. Tooltips on every control. | Vite + React 19. Procedural CSS/SVG backdrops (no image files) for menus; AI-painted WebP for card art. |
| D-24 | **"The Armory" (Decks screen) + "The Sparring Pit" (Free Play setup).** Six deterministic preset decks (one per class), a full collection gallery, and a deck forge enforcing format legality (30 cards / max 2 copies / 1 Legendary / class+neutral). Free Play lets you choose a war-band and an **AI difficulty** (Novice/Faithful/Valiant — a deterministic margin on the 1-ply AI, no RNG). | Deck ownership/economy is NOT modelled yet — the whole collection is available (see STATUS "What's NOT built"). |
| D-23 | **Audio is in:** 3 crossfaded tavern tracks + ~80 one-shot SFX mapped to engine events, mute + volume, persisted. Assets optimised (art PNG→WebP ~16×; audio re-encoded). | Music/SFX gated behind one mute; armed on first user gesture (autoplay policy). |
| D-22 | **Rules engine in `/engine`** — pure TypeScript, zero runtime deps, deterministic (seeded), runs on Node 22 native TS (no build). `applyAction(state, action) → { state, events }` is a pure reducer that emits a typed **GameEvent stream** = the animation contract (UI replays events, never mutates state). Cards are data → effect-verb interpreter. | Delivers CLAUDE.md §11 "first engineering task." Animation pipeline is first-class per §12. See `engine/README.md`. |
| D-21 | **Game name is UNDERDOGS.** Working title "COVENANT" is retired. The tone is comedic-underdog (David vs. Goliath); the card back reads UNDERDOGS with the deadpan tagline "Giants sold separately." **Note:** *Covenant* remains the Patriarch **keyword** and appears in card names (Covenant of Stars, Covenant Renewed) — that is a mechanic, unrelated to the product title; do NOT blanket-rename it. | Resolves open-Q "final game name." Repo was already named Underdogs. |
| D-20 | **Rarity is a frame-only style layer, never art or power.** The rarity gem color is the primary signal (Common grey / Rare blue / Epic purple / Legendary gold); Common→Legendary add *escalating* frame accents (trim ring, art/banner glow, Legendary name flourish) while the **art window, stats, cost, and banner stay identical in size & position**. Art quality is never gated by rarity. The gold frame signals "collectible chase / build-around," not strength. | Reaffirms D-19 & CLAUDE.md §7 in the frame language. See `docs/05-art-direction.md` §Rarity. Implemented in the card compositor. |
| D-19 | **Workflow: image API generates the illustration; the card frame is composed in code** (HTML/CSS → PNG) so every card is pixel-consistent and data-driven from the schema. | Frame is not baked into the generated art (keeps text crisp, recolorable, rarity-swappable). |
| D-18 | **Animation is a first-class requirement** with a defined vocabulary (CLAUDE.md §12; `docs/07-animation-and-feel.md`). Optional: a subtle CSS light-sweep **shimmer on Legendary frames only**, `prefers-reduced-motion`-gated. | Attack arrows, lunge/impact/shake, summon/death, keyword beats. |
| D-17 | **Card art via the Gemini image API (Nano Banana family), build-time batch script.** Free-tier (~500/day) or ~$0.03–0.04/img. Not OpenAI (weaker character consistency; no API free tier). Never called at runtime. | Supersedes any "OpenAI/ChatGPT image API" assumption. A ChatGPT subscription does **not** grant API access; irrelevant here. |
| D-16 | **Offline-first, single-player. No backend, no accounts, no cloud sync.** All state saved on-device. | Removes Supabase/Firebase/servers from scope. Web hosting deferred/optional. |
| D-15 | **No online, no PvP, no runtime AI.** | Determinism keeps future PvP *possible* but it is out of scope; build no netcode. AI opponent is a heuristic, not an LLM. |
| D-14 | **Classes are roles, eras are tags.** Six role-classes (Prophet, Warrior, Priest, Shepherd, Patriarch, Disciple); the six eras become cross-cutting Tags. | Supersedes the era-as-class model in docs 01–02. |
| D-13 | **Decks are single-class + Neutral** (Hearthstone model). | Supersedes the "2 Eras / Runeterra 2-region" rule in the GDD. Tags are synergy labels, not deck restrictions. |
| D-12 | **Warrior** is the class name for the combat role (King/dynasty and Judges/underdog are themes inside it, not separate classes for now). | "King" remains a possible future 7th class. |
| D-11 | Each class has **Leaders** (hero portraits) granting **Hero Powers** (2 Provision, 1×/turn, weaker than a 2-drop). | From the architecture doc; confirmed under the role model. |
| D-10 | **Signature mechanic = Fulfill** (Legendary transformation). Saul→Paul is the one automatic/unearned Fulfill (grace). | Replaced an earlier Faith/suffering meter, which was "too on-the-nose." |
| D-9 | **Single resource = Provision** (1→10, +1/turn, refills). No second resource. | Faith-as-resource dropped. |
| D-8 | **Hero HP = 30** (Hearthstone parity). | Earlier GDD said 25. 30 is current; tunable in playtest. |
| D-7 | **Board limit 7, hand limit 10.** | Earlier GDD said board 6; 7 is current (Hearthstone parity + the prototype). |
| D-6 | **Strictly alternating turns**, no reactive/stack/instants. | Pokémon-simple constraint; firm for v1. |
| D-5 | **Six classes** (not the full Hearthstone eleven); justified by named-hero depth. | Started at 5 eras, split to 6, then re-axised to 6 roles. |
| D-4 | **Set 1 target ≈ 120 collectible** + Adversary pool (~24) tracked separately. | Hearthstone expansion is ~135–145; we sit just under, correct for solo-first. |
| D-3 | **Free forever** — Talents currency, packs with pity + dupe protection, Fragments crafting, Scroll Study bonus. No IAP/gacha/ads. | |
| D-2 | **Tone:** epic on the board, Hearthstone-humor in the margins; "joke about the humans, never the holy." | |
| D-1 | **The Laws** (Jesus never a card; faithful-only for players; reverent VFX; received-not-won Cross beat). | Inviolable. See `CLAUDE.md` §2. |

## Resolved since the first build pass
- ~~Interactive Foresee / Discover.~~ **Done (D-29) — real choice overlay + engine pause/resume.**
- ~~Q1 Fill the last ~23 cards.~~ **Done — 126 collectible cards, all classes 17–21.**
- ~~Q2 Leaders + Hero Powers.~~ **Done — 12 leaders with hero powers (`data/leaders.json`).**
- ~~Q4 Final game name.~~ **UNDERDOGS (D-21).**
- Engine, effect system, front-end shell, decks/armory, free-play, audio, animation baseline: **built (D-22..D-26).**

## Open questions (need a human ruling or a build pass)

1. **Economy model** (CLAUDE.md §10): collection ownership, packs (pity + dupe protection), Talents, Fragments. None built — the Armory shows everything unlocked. Decide the unlock/ownership model before it means anything to win.
2. **The sacred interlude** (Law 5): the received-not-won Cross/Resurrection beat. Not built. Must be a non-combat encounter type, un-gamified. Needs a design + a human sign-off on presentation.
3. **Bible translation licensing** for the Scroll Study reader (WEB/KJV free; ESV/CSB need permission). Decide before building the reader.
4. **Master art style-prompt + bake-off.** Card art exists, but no locked style-frame test on record (`docs/05-art-direction.md` has the master prompt). Revisit if regenerating.
5. **The 4 deferred adversary mechanics** (audit DEFERRED set): Serpent token, attack-prevention, relic-cost tax, spell immunity. Each is one small engine capability.
6. **First mini-set** = "The Wisdom Books"? And **rotation names** (Canon/Apocrypha vs Standard/Legacy). Future; greenlight or hold.
7. **iOS/Capacitor wrapper** — deferred until the web build is content-complete.

## Suggested build order (updated — see STATUS "Suggested next moves")
1. Economy v1 (Q1) — ownership + packs + Talents, so winning matters.
2. The sacred interlude (Q2) — the Cross/Resurrection beat as a non-combat encounter.
3. Settings screen + retire the remaining SOON stubs (Packs, Settings, Path of the Faithful).
4. iOS/Capacitor wrapper once content-complete.
5. The 4 deferred adversary mechanics (Q5).
