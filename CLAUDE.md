# CLAUDE.md — COVENANT

> **This file is the source of truth.** Where any other document disagrees with this file or with `docs/06-decisions-log.md`, **these two win.** The `/docs` folder holds deep design detail; this file holds the locked canon, the laws, and the conventions you build by. Read this fully before writing code or cards.

---

## 1. What we're building

**COVENANT** is a digital collectible card game — a Hearthstone-quality TCG skinned for Scripture. Audience: "Christian nerds" who love Hearthstone / Runeterra / Magic and are tired of tacky Christian games. Adventure-epic tone with dry, self-aware humor. **Single-player, offline-first** (iOS + web). **No PvP, no online multiplayer, no runtime AI, no backend** — the game runs entirely on-device. **Free forever — no in-app purchases, no gacha, no ads.**

**The thesis:** the game teaches the biblical story *through mechanics*, not sermons. The signature mechanic (Fulfill) makes players *enact* the actual narrative arcs to earn their payoff. Discipleship by design, never by preaching.

---

## 2. THE LAWS (inviolable — never break these, in code, cards, art, or copy)

1. **Jesus is never a card.** Never a collectible, never a stat block, never a target, never a resource the player spends or deploys. He is present only in campaign *narrative* and by prophecy/miracle framing. The game points to Him; it never fields Him. Any proposed exception requires explicit human sign-off — never ship it on your own judgment.
2. **Players field only the faithful.** Villains (Goliath, Pharaoh, Jezebel, the Serpent, Haman, Herod…) are **AI-only** — the "Adversary pool." They are mechanically real opponents but never collectible or playable by the human.
3. **Joke about the humans, never about the holy.** Humor lives in flavor text, card/spell/quest names, and AI barks — ribbing Peter for sinking, Jonah for sulking. It never touches God, the Cross, the Resurrection, the Holy Spirit, or the grace moments (esp. Saul→Paul). The faithful are *lovably human*, never contemptible. No puns on the faithful's names. When in doubt, state the real, weird biblical detail deadpan — that's the humor.
4. **Reverent combat presentation.** Stylized light-clash impacts; defeated units *fall and fade to light/dust*. No blood, no gore, no death screams. Named heroes are never mocked or desecrated by enemy VFX.
5. **The sacred core stays reverent.** The campaign's Cross/Resurrection beat is a **non-combat interlude** — nothing the player "wins," it is received. Do not gamify it.
6. **Broad-evangelical safe.** No denominational hobby-horses. Passage references on cards are reference-only (book + chapter); never editorialize doctrine on a card.

If a task would require breaking a Law, stop and flag it. Do not "reframe" your way around a Law.

---

## 3. Locked game rules (canon)

| Rule | Value |
|---|---|
| Win condition | Reduce enemy hero to **0 HP** (only win condition) |
| Hero HP | **30** *(tunable in playtest; earlier drafts said 25)* |
| Resource | **Provision** — starts 1, +1 max per turn, cap **10**, refills each turn |
| Turn structure | **Strictly alternating.** No reactive plays, no stack, no instants. All defense is pre-set via keywords/stats. |
| Turn phases | Dawn (ready units, +Provision, start-triggers, draw 1) → Main (play/attack any order) → Dusk (end-triggers, pass) |
| Board limit | **7** units per side |
| Hand limit | **10** (excess draws are burned) |
| Deck | **30 cards**, max **2 copies** of any card, max **1** of each Legendary |
| Deckbuilding | **One Class + Neutral cards** (Hearthstone model). Era **Tags** are labels for synergy payoffs, *not* a deckbuilding restriction. |
| Opening hand | 3 cards + one full mulligan; second player draws 4 |
| Fatigue | Empty deck → escalating self-damage per missed draw |
| Randomness | **Light only.** Allowed: shuffle, Foresee, Discover. Banned: RNG card generation from outside the deck, random transforms, coin-flip win-cons. |

---

## 4. Classes (roles) & Tags (eras)

**Class = your deck's identity** (like Warrior/Mage). Six classes, each with a signature mechanic:

| Class | Fantasy | Signature mechanic | Plays like |
|---|---|---|---|
| 🕮 **Prophet** | foresight & judgment | **Foresee** + burn | Mage |
| ⚔ **Warrior** | the battle & the blade | **Relics** (equip weapons) + giant-slaying | Warrior/Hunter |
| ✚ **Priest** | heal, protect, raise | **Endure** + heal + **Raise** | Priest |
| 🐑 **Shepherd** | not one lost | **Redeem** (small ally returns / becomes a Sheep) | Paladin |
| ⭑ **Patriarch** | the compounding promise | **Covenant** (start-of-turn trigger) + ramp | Druid |
| 🔥 **Disciple** | a spark becomes wildfire | **Scatter** (dies → summon a Disciple) + swarm | Zoo Warlock |

**Tag = era, a cross-cutting tribe** (like Murloc/Dragon): `Genesis · Exodus · Judges · Kingdom · Exile · Apostles`. Neutrals are untagged. Tags enable payoffs like *"Your Exodus cards cost (1) less"* and keep story-teams synergistic across classes.

**Multi-class icons:** iconic figures appear as *different cards* in different classes — David (Shepherd boy / Warrior king), Moses (Prophet / Shepherd / Patriarch), Samuel (Prophet / Priest), Jacob (Shepherd / Patriarch). Same soul, different callings. This is a feature (collection + teaching), not a bug.

**Leaders & Hero Powers:** each class has one or more **Leaders** (the hero portrait you pick, = your class). A Leader grants a **Hero Power**: repeatable, costs **2 Provision**, once per turn, deliberately *weaker than any 2-drop* (it's the floor for dead-draw turns, never the plan).

---

## 5. Keywords (the complete vocabulary — do not invent new ones without human sign-off)

**Core (any class):**
- **Guard** — enemies must attack this unit first.
- **Swift** — may attack the turn it's played.
- **Endure** — the first damage this unit would take each time is prevented (a shield; consumed on use).
- **Arrival:** — effect when played (battlecry).
- **Legacy:** — effect when this dies (deathrattle). *What the faithful leave behind.*
- **Foresee X** — look at the top X of your deck; reorder or bottom them.
- **Discover** — choose 1 of 3 (from your deck, unless stated).
- **Fulfill:** — transformation condition (Legendaries; see §6).

**Class signatures:**
- **Redeem** (Shepherd) — when this small ally dies, return it / summon a Sheep.
- **Covenant** (Patriarch) — triggers at the start of each of your turns.
- **Scatter** (Disciple) — when this dies, summon a 1/1 Disciple.
- **Raise** (Priest) — return / revive a fallen ally (as specified).
- **Relic** (Warrior + others) — a card type: **equip** (attach to a unit) or **standing** (global). Not a keyword per se; see card types.

**Giant-Slayer** (Warrior, card-specific) — destroys 4+ attack units it strikes and takes no counter-damage.

---

## 6. FULFILL — the signature mechanic (protect this)

Legendary heroes enter in an *early-story* form with a visible **Fulfill condition**. Meeting it transforms the card — new name, art, stats, ability — mirroring the real biblical arc. The player *enacts the story* to earn the payoff. **This is the game's identity and its discipleship engine. Guard it.**

Rules:
- Transformation heals to the new max HP, clears damage, keeps board position, does **not** re-apply summoning sickness.
- Early form is *under-statted* (paying for upside); fulfilled form is *over-statted* (the earned payoff).
- **Saul of Tarsus → Paul is the one automatic, unearned Fulfill** (grace, not works). This is a deliberate theological statement made silently through mechanics. Never "fix" it to require a condition.

Examples: Abram→Abraham (control 3+ allies), Jacob→Israel (survive a stronger unit), Shepherd David→David the King (slay a giant), Simon→Peter (survive damage), Gideon→Mighty of Valor (win while outnumbered).

---

## 7. Balance rail (enforce on every card)

**Vanilla stat budget:** `attack + health ≈ (cost × 2) + 1`.
(1-cost≈3 stats, 2≈5, 3≈7, 4≈9, 5≈11, 6≈13, 7≈15.)

- Each keyword / relevant text costs roughly **−1 stat** off the vanilla body (Guard, Endure, Swift ≈ 1 each; "draw a card" ≈ 1.5–2; "deal 2 to a unit" ≈ 2–3).
- Playable cards sit *slightly* above vanilla in a specialized direction, or on-curve with relevant text.
- **Flag any card more than ~1.5 stats over budget** for human review.
- **Rarity signals complexity/swing, NOT power.** A Common may be a staple; a Legendary is build-around, not strictly-better. A free starter deck must be able to beat an all-Legendary deck.

Per-class rarity spread per set (Hearthstone-shaped): ~8 Common / ~5 Rare / ~3 Epic / ~2–3 Legendary, plus shared Neutrals.

---

## 8. Tech stack & architecture

- **Rules engine:** pure **TypeScript**, zero UI deps, **fully deterministic given a seed**. Enables headless AI-vs-AI balance sims and per-card unit tests. (Determinism keeps a hypothetical future PvP *possible*, but **PvP / online is explicitly out of scope** — do not build netcode, servers, or accounts.)
- **Storage: local, on-device only.** Collection, Talents, packs, deck lists, and campaign progress persist locally (web: IndexedDB; iOS: Capacitor Preferences/filesystem). **No backend, no accounts, no cloud sync** for v1.
- **Cards are data:** every card is a JSON object (`/data/cards.*.json`, schema in `/data/cards.schema.json`) + effect references drawn from a small **effect-verb library**. Adding a card should not require new engine code unless it needs a genuinely new verb.
- **Effect verbs (starter set):** `deal`, `healHero`, `healUnit`, `summon`, `draw`, `drawType`, `buff` (+a/+h), `giveKeyword`, `foresee`, `discover`, `destroy`, `setAttack`, `returnFromDiscard`, `transform`, `exile`, `costReduce`. Extend deliberately; document any new verb here.
- **Effect verbs (added for Set 1 content):** `auraBuff` (continuous in `aura`; with `grantToTarget` grants an aura), `returnToHand`, `shuffleIntoDeck`, `delayedTransform` (Joseph), `conditionalDeal`, `gainForEachSheep`, `discoverFromDeck`, `onHealBonus` (passive), `discountHand` (Israel/Terah cost auras). Triggers beyond the core five: `startOfTurn`, `endOfTurn`, `onDeath` (+`replaceDeath`), `raise` (ally-death listener), `trigger` (generic listener via `on`), `passive`. **`node tools/audit-cards.ts` verifies every card's data against what the engine implements — run it whenever cards or the engine change; `node tools/soak.ts` plays AI-vs-AI across every class matchup as a crash test.**
- **UI:** **React** (DOM/CSS, not canvas — a card game is UI; DOM gives free text rendering, accessibility, animation). Mirror the layout in `/prototypes/battle-slice.html`. **Animation is a first-class requirement** — see §12 and `docs/07-animation-and-feel.md`.
- **iOS:** **Capacitor** wrapper around the web build. **Web hosting is optional/deferred**; dev runs locally.
- **AI opponent:** heuristic v1 (curve-out + trade evaluation, as in the prototype) → 1-ply lookahead later. **Not an LLM** — a deterministic in-engine heuristic.
- **Art generation (build-time only):** a script in `/tools` reads each card's `art` prompt, prepends the master style prompt (`docs/05-art-direction.md`), passes a per-hero character-sheet reference for consistency, calls the **Gemini image API (Nano Banana family)**, and writes `<card_id>.png` to `/ui/assets/cards`. Google AI Studio's free tier (~500 img/day) covers the whole set; ~$0.03–0.04/image if paid. **This is a build tool, never called at game runtime.**

**Repo shape (as built — see `STATUS.md` for the annotated map):**
```
/engine/src  TypeScript rules engine (deterministic, seeded) + /engine/test
/data        cards.seed.json (cards) + tokens/leaders/adversaries/campaign json, schema, keywords
/ui/src      React + Vite app; opponent AI is ui/src/ai.ts, campaign wiring ui/src/campaign.ts
/ui/assets   generated card art (WebP), audio, sfx, fonts   /ui/dist  built output (force-added)
/tools       audit-cards.ts (data↔engine check), soak.ts (AI-vs-AI), cardart/ (art pipeline)
/docs        design docs (this repo)
/prototypes  reference HTML slice
```
*(Earlier drafts of this section named top-level `/ai` and `/campaign` dirs; those never materialised — that logic lives in `ui/src/`. `data/cards.json` is actually `cards.seed.json`.)*

---

## 9. How to add a card (the loop)

1. Write it as JSON against `/data/cards.schema.json`. Fill **every** field: id, name, class, tag, type, cost, attack/health (minions), rarity, keywords, text, effects, flavor, art.
2. **Check the balance rail (§7).** Note stat budget in a comment if it deviates.
3. **Check the Laws (§2)** — especially: is this a villain? (→ Adversary pool, non-collectible). Does the flavor joke about the holy? (→ rewrite). Is the passage ref clean?
4. Reuse existing effect verbs; only add a verb if truly new (and document it in §8).
5. Add a unit test for any non-trivial effect. Engine stays deterministic.
6. Keep the class's identity (§4) intact — if a card could go in any class, it's probably Neutral.

**Voice for text & flavor:** rules text is terse and unambiguous. Flavor is 1–2 lines, dry, ends on the passage ref. See `docs/04-card-database.md` for the established voice — match it exactly.

---

## 10. Economy (canon)

Free. Currency = **Talents** (from wins, quests, campaign, achievements, and the Scroll Study loop). Packs = 5 cards, guaranteed ≥1 Rare+, Legendary within first 10 packs of a set, ~40-pack pity after; duplicate protection; surplus melts to **Fragments** for targeted crafting. **Scroll Study:** read a card's real passage in-app + 3 comprehension questions → capped daily Talent bonus; framed as "read the lore," never gates content. No IAP, no ads, no loot-box psychology.

---

## 11. Current status & what's next

> **The living, detailed status is [`STATUS.md`](./STATUS.md)** — what's built, what's stubbed, what's missing, how to verify, and the footguns. Keep it current; this section is the summary.

- **Built & verified:** the deterministic seeded **rules engine** (`/engine`) + effect-verb interpreter driving all content from data; **126 collectible cards + 12 leaders + 22 adversaries + 8 tokens**, every definition audited to actually execute its text; a full **front-end game loop** (Title → Menu → Story / Free Play / Decks → mulligan → match → result) on desktop and mobile-landscape; **The Armory** (browse/collection/forge) and **The Sparring Pit** (war-band + AI difficulty); interactive **Foresee/Discover** choices; music + SFX + haptics; the game-feel layer (directional lunge, damage-scaled shake, floats, summon bloom, dissolve-to-light deaths, Endure shatter, Fulfill burst, aura glow, board parallax — all `prefers-reduced-motion`-gated); AI with lethal awareness at every difficulty. Gatekeepers: `node --test engine/test/*.test.ts` (29 pass), `node tools/audit-cards.ts` (clean), `node tools/soak.ts` (AI-vs-AI, no crashes).
- **Not built yet (the real gaps):** the **economy** (Talents/packs/Fragments/ownership — "Packs" is a stub, the whole collection is unlocked); **Scroll Study**; the **sacred Cross/Resurrection interlude** (Law 5 — campaign is 4 combat chapters only); **Settings** screen; **iOS/Capacitor** wrapper. See `STATUS.md` and `docs/06-decisions-log.md`.
- **Working discipline:** after any card or engine change, run the audit + tests; after UI changes, build and screenshot-verify. Never let `Date.now()`/`Math.random()` into the engine or AI (determinism). Edit the dedicated `data/{tokens,leaders,adversaries}.json` files — **not** the superseded sublists inside `cards.seed.json`. **No backend, no network, everything local.**
- **Doc discipline (every change):** if a change makes a fact in a doc false, fixing it is part of that change, not a follow-up — see the "Keeping the docs honest" table at the top of `STATUS.md` for which file to touch. Keep edits minimal.

---

## 12. Animation & game feel (first-class requirement)

The board must feel *alive*, Hearthstone-grade. Use CSS transforms/keyframes + a tween layer (Framer Motion or GSAP). Keep 60fps; respect `prefers-reduced-motion`. The prototype already shows the baseline (lunge, summon, death-fade, Fulfill burst) — the real build should exceed it. Required animation vocabulary:

- **Card play:** hand card lifts, arcs to the board, settles with a soft impact; mana/Provision crystals drain.
- **Attack:** attacker **lifts and lunges** into the target with a directional strike; **impact flash** + brief screen-shake scaled to damage; **floating damage numbers**; a **targeting arrow** while a unit/attack is selected.
- **Summon:** unit fades/scales in with a light bloom.
- **Death:** unit falls and **fades to light/dust** (never gore — see Law 4).
- **Keyword beats:** **Fulfill** = gold burst + name/stat morph; **Scatter** = the dying unit sprays into new Disciple tokens; **Redeem** = a fallen small unit re-forms / a Sheep pops in; **Endure** = shield shimmer that shatters on the hit it blocks; **Guard** = a standing ward glow.
- **Hero Power / Miracle:** a distinct, weightier flourish (light from above for holy effects — never a depicted face).
- **Turn transitions & victory/defeat:** clean banners; the campaign's sacred interlude is quiet and un-gamified (Law 5).

Feel rule: reverent at the sacred core, punchy everywhere else. Juice the combat; hush the holy.

Build in the spirit of the thing: epic on the board, funny in the margins, reverent at the core.
