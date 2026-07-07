# 06 — Decisions Log & Open Questions

*The reconciliation record. When older docs (GDD, architecture) show earlier thinking, this log + `CLAUDE.md` are what's actually true now. Newest decisions on top.*

## Locked decisions (canonical)

| # | Decision | Notes / supersedes |
|---|---|---|
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

## Open questions (need a human ruling or a build pass)

1. **Fill the last ~23 cards.** Priest, Shepherd, Patriarch are light (see counts in `docs/04-card-database.md`). Needs: more Sheep-synergy commons (Shepherd), heal/Endure bodies (Priest), Covenant/Heir commons (Patriarch), and 2–3 more Legendaries.
2. **Leaders + Hero Powers:** draft 2 per class (12 total). Suggested seeds — Prophet "Foresee 2"; Warrior "Rally: +1 attack this turn"; Priest "Restore 2"; Shepherd "Summon a 1/1 Sheep"; Patriarch "Summon a 1/1 Heir"; Disciple "Summon a 1/1 Disciple." Tune so none beats a 2-drop.
3. **Master art style-prompt + bake-off.** `docs/05-art-direction.md` has the master prompt; still need a 3–5 card style-frame test before batch production (illuminated-manuscript-modern vs painted-epic).
4. **Final game name.** Working title COVENANT. Alternatives to test: Testament, Canon, Ebenezer, Selah.
5. **Bible translation licensing** for the in-app Scroll Study reader (WEB/KJV are free; ESV/CSB need permission). Decide before building the reader.
6. **First mini-set** = "The Wisdom Books" (Job, Proverbs, Ecclesiastes, Song)? Greenlight or hold.
7. **Rotation names** (future): Canon / Apocrypha vs plain Standard / Legacy.

## Suggested build order (from `CLAUDE.md` §11)
1. `/engine` + `/data`: deterministic seeded rules engine driven by `cards.seed.json` + the effect-verb library; port the prototype's rules onto it.
2. Card-fill pass (open Q1) to reach 120.
3. Leaders/Hero Powers (open Q2).
4. Animation pass on the UI (attack arrows, summon/draw tweens, Fulfill burst, Scatter/Redeem spawns) — recommend the **Disciple** class first (Scatter swarm is the flashiest).
5. Campaign chapter scripting (the gospel arc).
