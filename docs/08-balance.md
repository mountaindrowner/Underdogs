# 08 — Balance

*How the game measures its own balance, what the numbers currently say, and the
proposed changes (pending human sign-off — nothing here has been applied to card
data). Regenerate the numbers any time with the two tools in `/tools`; they read
data and never mutate it.*

> **Guardrail:** balance changes to card canon require Mark's sign-off (CLAUDE.md
> §7 says flag over-budget cards "for human review"). This doc *proposes*; it does
> not decide. Part A is fact (reproducible sim output). Part B is proposals.

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

## Part A — What the numbers say (measured)

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

## Part B — Proposals (PENDING SIGN-OFF — nothing applied)

<!-- Filled from the balance-proposal agent pass. Each item: change, rationale,
     rail check, Law check. Grouped by finding. Await Mark's ruling before any
     edit to data/*.json. -->

_To be filled._
