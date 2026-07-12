# STATUS — where UNDERDOGS actually is

> **Read this before starting any work.** `CLAUDE.md` is the *constitution* (laws + canon that never change). This file is the *state of the union* — what is built, what is half-built, what is not built, and the traps that will bite you. When this file and reality disagree, **fix this file in the same commit.** A stale STATUS is worse than none.
>
> Last verified: **2026-07-11** (after the game-feel arc + a measured balance pass). Re-verify by running the commands in [§ How to verify](#how-to-verify) — if the numbers below don't match, update them.

---

## 30-second summary

UNDERDOGS is a **playable single-player Scripture TCG**. You can boot it, pick a war-band, forge a deck, and play a full match against a heuristic AI to a win/loss, on desktop or mobile-landscape. The **rules engine is real, deterministic, tested, and data-driven**: 168 card definitions all execute what their text says (verified by an audit), including interactive **Foresee** and **Discover**. The **campaign has 4 combat chapters**. The **economy (packs/Talents), Scroll Study, Settings, and iOS wrapper are NOT built yet.** No backend, no network, everything on-device — by design.

**Green across the board:** 32 engine tests pass · card audit clean (168 defs, 3 deferred) · AI-vs-AI soak clean (36 matchups) · `vite build` succeeds.

---

## Keeping the docs honest (do this every change — it's cheap)

Minimal but non-negotiable. Match the change to the file(s), touch **only** those, in the **same commit**:

| If you changed… | Update |
|---|---|
| Anything the player can now do / can't yet do | **STATUS.md** (the What-works / What's-not / footguns lists) |
| An engine capability (verb, trigger, target, keyword, condition) | the matching Set in **`tools/audit-cards.ts`** + **CLAUDE.md §8** verb list |
| A rule of canon, a Law, a locked number | **CLAUDE.md** (and log the *why* in **docs/06-decisions-log.md**) |
| A design decision or resolved open question | **docs/06-decisions-log.md** (new D-## on top; strike the resolved Q) |
| Run/verify commands, counts, file map | **README.md** + **STATUS.md** |

Rule of thumb: **if a fact in a doc is now false, fixing it is part of the change, not a follow-up.** When counts change, re-run [§ How to verify](#how-to-verify) and update the numbers here. Don't gold-plate — a one-line edit that keeps a fact true beats a paragraph.

---

## How to verify

Run these from the repo root. If any fails or the counts differ, **something regressed or this doc is stale — reconcile before building.**

```bash
# 1. Engine unit + effect tests  → expect: # pass 32, # fail 0
node --test engine/test/*.test.ts

# 2. Card-data audit  → expect: "all 168 definitions check out (3 deferred)"
node tools/audit-cards.ts

# 3. AI-vs-AI soak (all class matchups, full games)  → expect: "SOAK OK: 36 games … no crashes"
node tools/soak.ts 1

# 3b. Balance sims (optional — measure, don't gate). See docs/08-balance.md.
node tools/balance.ts 40 2     # class win-rate matrix + first-player advantage + game length
node tools/card-balance.ts     # static §7 stat-budget audit of every card

# 4. UI production build  → expect: "✓ built"
cd ui && npm run build

# 5. Play it locally
cd ui && npm run dev          # then open the printed localhost URL
```

**The two gatekeepers to run after ANY change to cards or the engine:** `audit-cards.ts` (catches data the engine can't execute) and the engine tests. After UI changes, `npm run build` + a Playwright screenshot pass (see the scratchpad scripts used in prior sessions).

---

## Repo map (what's actually here)

The `CLAUDE.md` §8 "repo shape to grow into" lists `/campaign` and `/ai` as top-level dirs. **They do not exist as top-level dirs** — that content lives inside `data/` and `ui/src/`. Actual layout:

```
/engine/src      Deterministic rules engine (TS, zero UI deps, Node-native TS)
  types.ts         CardDef, UnitInstance, GameState, EffectOp, all enums
  engine.ts        createGame / applyAction reducer, turn loop, combat, auras, relics
  effects.ts       effect-verb interpreter + targeting (the Ctx the engine passes in)
  events.ts        GameEvent union — the animation contract
  cards.ts         collectDefs / makeRegistry / buildDeck (browser-safe)
  cards.node.ts    disk loader (node:fs) — tests + tools only
  rng.ts           seeded PRNG (determinism)
  index.ts         public API barrel
/engine/test     engine.test.ts (mechanics) · effects.test.ts (real-card regressions)
/data            cards.seed.json (126 cards) · leaders.json (12) · tokens.json (7) ·
                 adversaries.json (22) · campaign.json (4 chapters) ·
                 cards.schema.json · keywords.json
/ui/src          React 19 + Vite app
  App.tsx          router + the Battle screen (the big one)
  useMatch.ts      match controller (engine ↔ animated view)
  view.ts          event-sourced view-model (UI holds NO engine state)
  ai.ts            opponent heuristic (1-ply eval) + difficulty
  decks.ts         6 preset decks + custom-deck storage + legality
  campaign.ts      encounter → MatchConfig; SANDBOX; progress
  data.ts          loads /data JSON, maps defId → art URL
  FreePlay.tsx     "The Sparring Pit" setup (war-band + difficulty)
  Decks.tsx        "The Armory" (browse / collection / forge)
  CardPreview.tsx  full-size card reader
  title/           Title.tsx, MainMenu.tsx, scenes.tsx (procedural CSS/SVG backdrops)
  board/           Board.tsx + boards.ts (in-game diorama, dim, behind cards)
  audio.ts sfx.ts  music crossfader + one-shot SFX
  styles.css       ~everything (single stylesheet)
/ui/assets         cards|leaders|adversaries|tokens|backs (WebP + PNG originals),
                   audio (3 mp3), sfx (~80 mp3), fonts
/ui/dist           BUILT OUTPUT, git-ignored but FORCE-ADDED so githack can serve it
/tools           audit-cards.ts (data↔engine check) · soak.ts (AI-vs-AI) ·
                 cardart/ (Python art-gen pipeline; build-time only)
/prototypes      battle-slice.html (the original reference slice)
/docs            01–08 design docs (01 GDD predates the role-class pivot — CLAUDE.md wins)
```

---

## What WORKS (built + verified)

### Rules engine — the core is done
- `createGame(cfg) → {state, events}` and `applyAction(state, action) → {state, events}`, a **pure, seeded, deterministic** reducer. Same seed + actions → identical state & events (tested).
- Turn structure: Dawn (ready, +Provision, start triggers, draw) → Main → Dusk (end triggers). Provision 1→10. Fatigue. Board limit 7, hand limit 10, 30-card decks, mulligan.
- Combat: attacks, Guard redirection, counter-damage, Giant-Slayer, Jael's "finisher" (executes damaged), win at 0 HP.
- **Every implemented effect verb** (source of truth = the `VERBS`/`TRIGGERS`/`TARGETS` sets in `tools/audit-cards.ts`): deal, heal(Unit/Hero), buff, setAttack, giveKeyword, silence, destroy, exile, summon, draw, drawType, transform, foresee, discover, returnToHand, shuffleIntoDeck, delayedTransform, conditionalDeal, gainForEachSheep, discoverFromDeck, onHealBonus, discountHand, returnFromDiscard, auraBuff.
- **Triggers:** arrival, legacy, redeem, covenant, scatter, aura, startOfTurn, endOfTurn, onDeath (+replaceDeath), raise, trigger (listeners), passive.
- **Auras** (attack + health + granted keywords, with conditions & tribe filters), **standing relics** (persist, tick, render as chips), the **graveyard** (fallen-ally records powering Raise / returnFromDiscard), **Fulfill** transformations incl. the automatic Saul→Paul grace beat.
- **Keyword vocabulary is closed** (guard, swift, endure, giant_slayer, redeem, scatter + marker labels foresee/covenant/raise + executes_damaged). Do not invent new keywords without human sign-off (Law-adjacent; CLAUDE.md §5).

### Content
- **126 collectible cards** (schema-valid), **12 leaders** w/ hero powers, **8 tokens** (incl. the Loaf of Bread), **22 adversaries** (all with authored effects now). All art present as WebP.
- Every definition passes the audit — its text is actually executed (or is one of 3 tracked deferrals).

### UI / game shell — a full loop
- Title → Main Menu → **Story** (4 chapters, progress-gated) / **Free Play** (war-band + AI difficulty) / **Decks** (browse, collection gallery, forge custom decks).
- A match: mulligan on the battlefield → **match-start "doors" transition** → play cards (tap-or-drag), attack, hero power, End Turn → victory/defeat.
- **Interactive Foresee** (reveal the top X; tap to bottom, the rest stay on top in order) and **Discover** (reveal N, keep K into hand) via a choice overlay. The human pauses for the choice; the AI auto-resolves inline (determinism preserved).
- Event-sourced animation & game feel: **directional lunge** (attacker travels into its actual target, DOM-measured), impact sparks + ring, **damage-scaled table shake** (impact-1/2/3) and sized damage floats, death **dissolve-to-light + rising motes** (Law 4), summon bloom, Endure shield-shatter shards, low-HP hurt vignette, Fulfill burst, aura stat glow, subtle **board parallax** on hover devices. All gated by `prefers-reduced-motion`.
- **Haptics** (`ui/src/haptics.ts`): `navigator.vibrate` patterns per event (play/hit/death/fulfill/victory). No-op where unsupported (iOS Safari — real iOS haptics arrive with the Capacitor wrapper).
- **Responsive:** desktop fills the screen with scaled pieces; mobile-landscape has a dedicated compact layout.
- **Tooltips** on every in-game control (hover on desktop, press-hold on touch).
- 3 music tracks (crossfaded) + ~80 SFX, mute + volume, persisted.
- AI opponent: 1-ply evaluation with 3 difficulty levels (deterministic; Novice/Faithful/Valiant) + **lethal awareness** at every level: when the face is open and its board adds up to the kill, it goes face (verified: it closes out a passive player ~turn 10).

### Persistence (localStorage — the whole save system)
| Key | Holds |
|---|---|
| `underdogs.campaign.done` | cleared chapter ids |
| `underdogs.decks.custom` | forged decks |
| `underdogs.freeplay.sel` | last war-band + difficulty |
| `underdogs.music.muted` / `.vol` | audio prefs |
| `underdogs.board` | chosen in-game board finish |

---

## What's PARTIAL or STUBBED

- **Main-menu SOON stubs:** **Packs**, **Settings**, **Path of the Faithful** show a "coming soon" toast — not built.
- **In-game board scenes** (`board/`) are intentionally dim/desaturated behind the cards; they are functional but low-fidelity procedural art (a known aesthetic trade-off vs. the AI-painted cards).
- **4 deferred adversary abilities** (tracked in `tools/audit-cards.ts` DEFERRED set): Pharaoh's Magician (needs a Serpent token), Pharaoh the Hardened (attack-prevention), Sanballat & Tobiah (relic-cost tax), Leviathan (spell immunity). They play as vanilla bodies until built.

---

## What's NOT built (missing goals vs. the canon)

Measured against `CLAUDE.md` and the design docs:

1. **Economy** (CLAUDE.md §10): Talents currency, packs (5 cards, pity, dupe protection), Fragments crafting, achievements. None exist. "Packs" is a stub. The Armory currently shows the **full collection unlocked** — there is no ownership/unlock model.
2. **Scroll Study loop** (§10): read a card's passage + 3 questions → capped daily Talent bonus. Not built.
3. **The sacred interlude** (Law 5, §11): the non-combat Cross/Resurrection beat. Campaign is 4 **combat** chapters only; the received-not-won interlude does not exist yet. **When built, it must not be gamified (Law 5).**
4. **iOS / Capacitor wrapper** (§8): none. Web/Vite only. No mobile build, no App Store scaffolding.
5. **Settings screen:** volume lives in the top-bar control; there's no settings surface for reduced-motion, board default, reset-save, etc.
6. **Campaign depth:** only 4 encounters; no boss scripting beyond pre-placed units, no narrative interlude cards, no per-chapter reward.
7. **Deckbuilding ownership rules:** the forge enforces format legality (30/2-copies/1-legendary/class+neutral) but not *collection ownership* (because there's no collection economy yet).
8. **Hosting / distribution:** dev-local only. `ui/dist` is force-committed so raw.githack can serve a preview, but there's no real deploy pipeline or CI.

---

## Known footguns (read before you touch these)

- **`ui/dist` is git-ignored but force-added.** After a UI change you must `cd ui && npm run build && git add -f ui/dist` or the githack preview goes stale. The build output has content-hashed filenames, so stale `dist/assets/*` accumulate — occasionally prune.
- **`data/cards.seed.json` contains SUPERSEDED sublists.** Its top-level `tokens` / `leaders` / `adversary` arrays are **early drafts**. The live data is in the separate `data/tokens.json`, `leaders.json`, `adversaries.json`. `collectDefs()` loads the separate files; the seed's `cards` array is the only live part of that file. (This already bit us once — `mantle_of_elijah` lived only in the seed's token draft and had to be moved into `tokens.json`.) **When adding tokens/leaders/adversaries, edit the dedicated file, not the seed sublists.**
- **The audit's constant Sets are the contract.** `tools/audit-cards.ts` hard-codes what the engine supports (VERBS, TRIGGERS, TARGETS, CONDITIONS, KEYWORDS, OP_FIELDS…). If you add an engine capability, **add it to the audit too**, or the audit lies. If you add card data using an unsupported field, the audit fails loudly — that's the point.
- **Class icons are emoji** (`ui/src/decks.ts` CLASS_META) — some glyphs (⚔ / ✚ / ✦) render as thin monochrome text on some platforms; the emoji-presentation variants (🛡️ ✨ ⭐) were chosen for color consistency. Keep that in mind if you re-theme.
- **Determinism is sacred.** `Date.now()` / `Math.random()` must never enter the engine or the AI (the AI's "randomness" is a hash of game state). Breaking this breaks replays and future PvP possibility (CLAUDE.md §8).
- **Stray artifact:** `covenant-handover 2.zip` (75 KB) is committed at the repo root — it's the original handoff bundle, now redundant with `/docs`. Safe to delete; left in place pending an explicit OK (it's not mine to remove unilaterally).

---

## The invariants that must never break (pointers, not restatements)

- **The Laws** — `CLAUDE.md` §2. Jesus is never a card. Players field only the faithful (villains are AI-only, in `data/adversaries.json`). Joke about humans, never the holy. Reverent VFX (fade to light, no gore). The Cross beat is received, not won. Broad-evangelical safe.
- **Fulfill is the identity** — `CLAUDE.md` §6. Saul→Paul stays automatic/unearned. Guard it.
- **Balance rail** — `CLAUDE.md` §7. `attack + health ≈ cost×2 + 1`; rarity signals complexity, not power; a free starter must be able to beat an all-Legendary deck.
- **No backend / network / runtime AI** — `CLAUDE.md` §8, decisions D-15/D-16.

---

## Suggested next moves (not commitments — for whoever picks this up)

Ranked by "makes the game more complete per its own canon":
0b. **Set 2 legendaries — STAGED, not wired (`data/cards.set2.json` + `docs/18-legendary-set-2.md`).** 30 collectible legendaries + 15 Fulfilled forms ("Cloud of Witnesses"), rail- and Law-checked, skewed to lift Priest/Prophet/Patriarch. **NOT loaded** (`ui/src/data.ts`/audit untouched) because ~a dozen cards need new engine capabilities first — the flagged big three: **(1) `deal`→`enemyHero`** (face targeting, Joel — also unblocks Prophet's balance reach + face-burn generally); **(2) `damagedEnemy`** target selector (Jael, trivial mirror of `damagedAlly`); **(3) `costReduce`/`discountHand` filters** (`cardType`/`class`, Bezalel/Shunammite/JtB). Plus smaller ones the JSON uses: `returnFromDiscard count`+`raisedUnits` target (Nehemiah), `discoverFromDeck thenDiscount` (Huldah), `buff filter:{tribe}` (Mary), `auraBuff condition:control_david`+`grantKeyword` on self (Mephibosheth), `cannotAttackAlone` passive (Barak). Then: add each new capability to the engine AND `tools/audit-cards.ts` sets, generate art for 45 cards, load the file, `audit`/`test`/`soak`, and re-run `balance.ts`. **Frame-look explorations for legendaries are stashed in `prototypes/legendary/` (not chosen yet).**
0. **Balance pass — APPLIED (`docs/08-balance.md` Part C).** Shipped the **Loaf of Bread** (a 0-cost "gain 1 Provision" token the 2nd player starts with — our Coin; `gainProvision` verb; fixed the seat advantage 61.5%→48.3%), Warrior/Shepherd nerfs, and Priest/Patriarch buffs; class spread narrowed 60→46 pts. **Still open:** Warrior stays high (74% — an AI-pilot artifact, don't chase with the current AI), and Prophet's reach fix is **deferred** because the engine can't target the enemy hero with a played spell. Next balance unlocks: (a) enemy-hero spell/hero-power targeting, (b) a smarter (2-ply) AI, then re-measure.
1. **Economy v1** — collection ownership + packs + Talents, so the Armory means something and there's a reason to win.
2. **The sacred interlude** — the received-not-won Cross/Resurrection beat (Law 5), likely as a special non-combat encounter type.
3. **Settings screen** + the 3 remaining SOON stubs (Packs, Settings, Path of the Faithful).
4. **iOS/Capacitor wrapper** once the web build is content-complete.
5. The 4 deferred adversary mechanics (each needs one small engine capability).

---

*Keeping this honest is the whole point. If you ship a feature or find a lie in here, edit STATUS.md in the same commit.*
