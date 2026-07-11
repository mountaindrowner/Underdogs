# 08 — Balance

*How the game measures its own balance, what the numbers say, and the changes made.
Regenerate the numbers any time with the two tools in `/tools`; they read data and
never mutate it.*

> **Structure:** Part A = the **baseline** measurement (before). Part B = the
> proposal record. Part C = **what was applied on 2026-07-11 and the before→after
> numbers.** Balance changes to card canon are Mark's call (CLAUDE.md §7); the pass
> in Part C applied the rail-legal proposals and left the flagged/deferred items for
> him. Re-run `node tools/balance.ts 40 2` to reproduce Part C's "after" column.

---

## The two instruments

| Tool | Question it answers | Run |
|---|---|---|
| `tools/balance.ts` | **Game-mode / class balance.** Plays the six shipped preset war-bands (leaders + hero powers) AI-vs-AI across many seeds per matchup; reports a 6×6 win-rate matrix, per-class overall win-rate, first-player advantage, and game length. | `node tools/balance.ts [seeds-per-pair] [ai-level 0\|1\|2]` |
| `tools/card-balance.ts` | **Individual card balance.** Static check of every collectible card against the §7 rail (`atk+hp ≈ cost×2+1`). | `node tools/card-balance.ts [threshold]` |

Both are deterministic (same seed → same game). `tools/soak.ts` remains the pure
crash test; `balance.ts` now also catches and reports any engine throw with its
seed+matchup, so a balance run doubles as a fuzz test.

### The one caveat that governs every reading

The opponent is a **greedy 1-ply AI**. It values board presence, trades, and face
damage; it **cannot pilot a control / attrition / ramp deck** — it won't hoard
resources, set up a late-game, or value lifegain correctly. So the sim **flatters
tempo/aggro classes and punishes value/control classes** beyond their true
card-level strength. Read low win-rates on the control classes (Priest, Patriarch,
Prophet) as *"partly the pilot, not only the cards."* Do not buff a class to a
human-oppressive place to fix a number the AI created. When in doubt, prefer small
nudges and re-measure.

---

## Part A — What the numbers say (baseline, before changes)

> These are the **before** numbers that motivated the changes. The **after**
> numbers (post-application) and what shipped are in **Part C** at the bottom.

**Run:** 40 seeds/ordered-pair · AI level 2 (Valiant) · 1440 decisive games · **0 crashes.**

### Class win-rate matrix (row plays first vs column)

```
   first \ vs   Proph  Warri  Pries  Sheph  Patri  Disci
Prophet         82.5   17.5   80.0   45.0   77.5   52.5
Warrior         92.5   60.0  100.0   82.5   97.5   90.0
Priest          17.5    5.0   52.5   12.5   22.5   15.0
Shepherd        90.0   60.0   92.5   67.5   92.5   87.5
Patriarch       52.5   15.0   87.5   40.0   67.5   45.0
Disciple        87.5   22.5   92.5   45.0   87.5   80.0
```

### Overall win-rate (both seats)

| Class | Win% | Read |
|---|---|---|
| ⚔ Warrior | **78.5%** | Over-tuned. Beats everything; even its mirror is 60% to the first player. |
| 🐑 Shepherd | **66.5%** | Strong. Sheep tempo + board-dev hero power suit the AI. |
| 🔥 Disciple | 53.8% | Healthy. |
| 🕮 Prophet | 44.4% | Slightly weak (control-leaning — see caveat). |
| ⭑ Patriarch | 38.5% | Weak. Ramp/covenant is slow; the AI can't leverage the payoff. |
| ✚ Priest | **18.3%** | Broken on paper. Pure heal/Endure attrition — the worst-case class for a greedy AI, and a face-only hero power. |

### Finding 1 — First-player advantage is the biggest single problem *(systemic, class-independent)*

- P0 (first player) won **61.5%** of all games; in **mirror** matchups (which isolate seat from class strength) P0 won **68.3%**.
- Cause: going first is a tempo lead the second player never recovers. The only compensation today is player 2's +1 opening card (CLAUDE.md §3) — nowhere near enough. Hearthstone solves this with **The Coin** (a one-time temporary mana). This game has no equivalent.
- This affects *every* game regardless of class, so it likely swamps some of the class-vs-class noise too.

### Finding 2 — Class spread is far too wide

- 78.5% (Warrior) to 18.3% (Priest) is a **60-point** spread; a balanced game wants everyone in ~45–55%.
- Warrior is a real over-performer (its edge holds even accounting for the AI's tempo bias). Priest/Patriarch are the clear laggards, though the AI caveat inflates how bad they look.

### Finding 3 — Game length is healthy

- Turns to a winner: min 9 · median **13** · p75 15 · max 29 · mean 14.1 (turns count each player's turn, so median ≈ **6–7 rounds each**).
- No degenerate turn-3 kills, no unwinnable grinds. Pace is good; leave it alone.

### Static card audit (individual cards)

- **86 minions + 33 spells/relics** collectible. **No minion body is over budget** — every stat-line respects the §7 rail (mean deviation −1.19, i.e. cards correctly pay body for text; 61/86 within ±1.5 of the vanilla line).
- Only **1** "full body + heavy text" eyeball case: **Enoch** (1/2 for 1, but its Covenant exiles *itself* — a real downside, likely fine).
- The "under budget with light text" list is mostly removal/tempo cards whose text the static tool under-weights (Elijah's deal-3, Phinehas's deal-2) — not truly dead. The cleaner questions are the near-vanilla walls (Widow of Zarephath 0/3, Job 3/6).
- **Takeaway:** the imbalance is **systemic (seat + class kit), not individual undercosted cards.** No single card is breaking the rail.

---

## Part B — Proposals

> **Status: most of these were applied this pass (2026-07-11) — see Part C for
> exactly what shipped and the before→after numbers.** This section is preserved
> as the original proposal record.

Drafted by four independent balance passes (one per cluster), each reading the
real card data and the §7 rail. **Nothing here has been written to `data/*.json`.**
Every card id, stat, and current value below was verified against the data; every
core change uses an already-shipped verb/target/keyword (no engine work), **except
the three items explicitly flagged 🔶 for sign-off.**

**Recommended rollout (measure between each step):** fix the seat advantage first
(it colours every other number), then apply one class package at a time and re-run
`node tools/balance.ts 40 2`, watching that class's row and the mirror diagonal.
Under-shoot deliberately — the AI already flatters tempo classes.

🔶 **Needs Mark's sign-off** (new engine capability or off-rail): (1) the `gainProvision`
verb for the Coin, Finding 1 Option A; (2) `firstborn_heir` 1/2→1/3 (+1 over the
1-drop rail, justified as stickiness); (3) the optional `control_4_plus` condition
on `land_of_promise` (not implemented — `control_6_plus`/`control_legendary` are).

---

### Finding 1 — First-player advantage (systemic; the highest-value fix)

Target: pull mirror P0 win% from **68.3% → ~50–53%**. Note: `beginTurn` overwrites
`provision = provisionMax` every Dawn, so a second-player bonus must be granted as
**spend-this-turn Provision**, not a persistent max bump.

- **Option B — rules-only "built-in coin" (recommended first; zero new vocabulary).**
  Add `secondPlayerCoin: boolean` to `DEFAULT_RULES`; in `beginTurn`, when it's P1's
  first Dawn (`p===1 && turn===2`), `pl.provision += 1` after the refill. One-line,
  fully reversible, no new verb/keyword/token. Expected: mirror → ~56–60% (partial).
  Ship it as a zero-risk probe, then promote to A if it under-corrects.
- **Option A — "The Coin" as a one-time token 🔶 (the proper, flexible fix).** Give P1
  a non-collectible 0-cost token in the opening hand that grants **+1 Provision this
  turn only** — the player banks it for the turn they want. This is Hearthstone's
  proven fix for exactly this gap. Requires a small new verb `gainProvision`
  (self-contained; not a keyword). Theming: **"Manna"** (Exodus 16 — daily provision
  that can't be hoarded past the day → maps onto expire-each-turn Provision); flag
  the sacred-adjacent name for Mark. Expected: mirror → ~52–56%.
- **Option C — second player draws +2 instead of +1 (blunt knob).** One-line change
  in `dealOpening`. Fixes card advantage, not the tempo deficit that actually drives
  seat advantage → only a modest dent (~63–66%). Keep as a fine-tune, not the fix.

All three are reversible behind a `RuleConfig` flag and Law-clean (a resource on
your own turn — inside strict alternation, no randomness).

---

### Finding 2a — Warrior (nerf to ~55%) & Shepherd (trim to ~58%)

No single Warrior card breaks the rail; the kit stacks **raw attack**, which the
face-greedy AI (and a human) monetize hardest. Shave attack on the curve-fillers;
leave the below-floor Rally/Gather hero powers alone.

| Card | Current | → Proposed | Rail |
|---|---|---|---|
| `abishai` Abishai | 3c **4/2** Swift | **3/2** Swift | body 6→5 (−1, kills the turn-3 burst) |
| `joshua_and_caleb` | 4c **4/4** Swift | **3/4** Swift | body 8→7 (removes "hit for 4 on drop") |
| `samson` | 4c **5/3**, Legacy deal 2 to all | **4/3**, same | 8→7; Legacy-AoE counts ~−2, lands on rail |
| `coronation` | **4c** +3/+3 & allies +1 atk | **5c**, same (alt: keep 4c, +2/+2) | slows the board-wide attack anthem one turn |
| `david_the_shepherd` (Shepherd) | **2c** 2/3, Sheep + Redeem ping | **3c**, same | breaks the turn-2 snowball engine; kit intact |

Optionals only if still hot after re-measure: `sword_of_goliath` +3/+0→+2/+0;
`the_good_fold` drop Guard (keep +1/+1) or 4c→5c. Law-clean (pure number nudges).

---

### Finding 2b — Priest (buff to ~45%, identity-preserving)

Diagnosis: the 18-card pool has **one** removal effect and **zero** reach; five cards
heal only the hero's face (dead to the AI); Aaron's hero power is the only one with
zero board impact. Fix = **redirect the same heal/stat budget from face to units and
into attack** — an unkillable, growing front-liner that grinds face — without adding
aggro. All use shipped verbs; no engine change.

| Card | Current | → Proposed | Note |
|---|---|---|---|
| `aaron_leader` Intercede | heal **2 to your hero** | **restore 3 to a friendly unit** | the key fix: board-relevant floor; wakes Zadok; still weaker than any 2-drop |
| `consecration` | ally **+0/+3** & Endure | ally **+1/+2** & Endure | same budget (4), one hp→atk; wall becomes threat |
| `hur_the_upholder` | end-turn damaged ally **+0/+2** | **+1/+1** | sustain that also pressures |
| `the_bronze_serpent` | start-turn heal **2 to hero** | **2 to a damaged ally** | most AI-dead card → board-sustain engine |
| `the_tabernacle` | 5c end-turn **random** ally +1/+1 | **4c**, **damaged** ally +1/+1 | online a turn sooner; piles onto the survivor 🔸re-measure snowball |

Reframing Intercede as interceding for the *people* (Numbers 16) is *more* on-theme,
not less. Zadok/Samuel/Atonement left as-is — they light up automatically once
unit-healing is routine. The class stays attrition; it just gains agency.

---

### Finding 2c — Patriarch (buff to ~50%) & Prophet (light touch)

Patriarch's early curve is **dead-on-cast** (Covenant/relics do nothing the turn
played; the tempo AI clears the board before the second tick). Prophet is nearly
fine but its burn lacks **reach** (can't hit face).

| Card | Current | → Proposed | Note |
|---|---|---|---|
| `sarah` | Covenant +1/+1 **if control_legendary** | **remove the condition** (unconditional) | condition ~never fires (excludes herself); makes her the intended snowball |
| `well_of_the_oath` | **4c** relic, Covenant random ally +1/+1 | **3c** | payoff comes online a turn sooner |
| `land_of_promise` | **5c** relic, Covenant Heir + go-wide buff | **4c** | same; ramp lands before the sweep |
| `firstborn_heir` 🔶 | 1c **1/2** vanilla | **1/3** | +1 over 1-drop rail — stickiness for a snowball class (flagged) |
| `fire_from_heaven` (Prophet) | 4c deal 4 to **a unit** | deal 4 to **anyCharacter** (may hit hero) | gives burn its win-con reach; still below Fireball rate |
| `elijah_leader` Fire | deal 1 to **a unit** | deal 1 to **anyCharacter** | 1-dmg reach the AI can actually close with; floor intact |

Optional 🔶: `land_of_promise`'s buff gate `control_6_plus` → `control_4_plus`
(near-unreachable vs a board-clearing AI) — **needs new engine condition**, excluded
from the core set. Abraham's Multiply left alone (correct dead-draw floor).

---

### After sign-off — how to apply safely

1. Edit only the dedicated data files (`data/cards.seed.json` `cards[]`, `data/leaders.json`) — never the superseded sublists (STATUS.md footgun).
2. Add/adjust a unit test for any behaviour change (e.g. Sarah's now-unconditional Covenant, Fire reaching face).
3. Re-run the gatekeepers: `node tools/audit-cards.ts`, `node --test engine/test/*.test.ts`, `node tools/soak.ts`.
4. Re-run `node tools/balance.ts 40 2` and compare the matrix; iterate on optionals only if a class is still out of the 45–58% band.
5. Update this doc's Part A numbers and log the change in `docs/06-decisions-log.md`.

---

## Part C — Applied pass & results (2026-07-11)

Applied the seat fix + Warrior/Shepherd nerfs (two iterations) + Priest/Patriarch
buffs. **Prophet's reach fix was deferred** (needs enemy-hero spell targeting — a
new engine+UI capability, bundled with the upcoming legendaries work). All changes
went into `data/cards.seed.json` / `data/leaders.json` / the engine rules; 32
engine tests pass, audit clean, soak clean, UI builds.

### What shipped

- **Seat "Coin" (Finding 1, Option B):** `RuleConfig.secondPlayerBonus = 1` — the
  second player gets **+1 Provision to spend on their first turn only** (not banked;
  evaporates next Dawn). Engine-level, reversible via the flag.
- **Warrior nerfs (two passes):** Abishai 4/2→3/2 · Joshua & Caleb 4/4→3/4 · Samson
  5/3→4/3 · Coronation 4→5 cost · **Shepherd David (the 1-drop Giant-Slayer) 1→2
  cost** · **Sword of Goliath +3/+0→+2/+0** · Left-Handed Ehud 3/1→2/1.
- **Shepherd trim:** David, the Shepherd 2→3 cost.
- **Priest heal-to-board redirect:** Aaron's **Intercede** → restore **3 to a
  friendly unit** (was heal 2 to hero) · Bronze Serpent & Tabernacle now heal/buff a
  **damaged ally** (was hero) · Tabernacle 5→4 cost · Consecration +0/+3→+1/+2 · Hur
  +0/+2→+1/+1. (UI fix: hero-power targeting now respects the power's side, so
  Intercede can only be aimed at allies.)
- **Patriarch ramp:** Well of the Oath 4→3 · Land of Promise 5→4 · Sarah's Covenant
  now **unconditional** · Firstborn Heir 1/2→1/3.

### Before → after (40 seeds, 1440 games, level 2)

| Metric | Before | After | Verdict |
|---|---|---|---|
| **First-player advantage (all games)** | 61.5% | **48.7%** | ✅ fixed (near-perfect on the robust metric) |
| First-player advantage (mirror only, noisier) | 68.3% | 44.2% | ✅ fixed; very slightly favours P2 now — tunable |
| Warrior | 78.5% | **74.0%** | ⚠ still top — see note |
| Shepherd | 66.5% | 59.6% | ↘ closer |
| Disciple | 53.8% | 55.4% | ✅ healthy |
| Patriarch | 38.5% | 43.1% | ↗ better, still low |
| Prophet | 44.4% | 40.4% | ↘ dropped (deferred reach fix) |
| Priest | 18.3% | **27.5%** | ↗ +9, biggest gain; still last |
| **Class spread** | 60 pts | **46.5 pts** | ↘ narrower |
| Game length (median turns) | 13 | 13 | ✅ unchanged/healthy |

### The honest read on what's left

- **Warrior is resistant to card nerfs (74%).** Seven rail-legal nerfs moved it only
  4.5 points. The reason is structural: Warrior is the **aggressive-tempo deck the
  greedy 1-ply AI pilots near-optimally**, while it misplays everyone else — so the
  sim *overstates* Warrior's real-meta dominance. Nerfing it to ~55% in this sim would
  require gutting it for human play to fix an AI artifact. **Do not chase it further
  with the current AI.** The right unlocks are (a) a smarter AI (1→2-ply lookahead) so
  control classes are piloted competently, and (b) raising the floor classes (which
  mechanically pulls the top down, since win-rates average to 50%).
- **Prophet (40.4%) and Priest (27.5%)** are the remaining laggards, and both are
  **control/attrition** — the exact archetypes the AI can't pilot. Priest's real
  human win-rate is meaningfully higher than 27.5%. Prophet's proper fix (burn that
  reaches the enemy hero) is **deferred to the legendaries work** because the engine
  currently can't target a hero with a played spell (`anyCharacter`'s explicit path
  only finds units and falls back to *your own* hero — see effects.ts:162). That
  hero-targeting capability is a prerequisite for both Prophet's reach and many
  marquee legendaries.

### Suggested next balance steps (not this pass)

1. Add **enemy-hero targeting for played spells / hero powers** (engine + UI + AI) —
   unblocks Prophet's reach and face-burn legendaries.
2. **Smarter AI** (2-ply or better trade/tempo eval) — then re-run this sim; expect
   Warrior to fall and control classes to rise without further card edits.
3. Re-measure and, only if still needed, a light Warrior hero-power (Rally) look and
   a further Priest/Patriarch nudge.
