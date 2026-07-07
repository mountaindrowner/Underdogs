# COVENANT — Set Architecture & Systems (Hearthstone Teardown → Our Design)

> ⚠️ **CANON NOTE (read `/CLAUDE.md` and `docs/06-decisions-log.md` first).** This document predates the role-class pivot. Where it says classes/factions are the six *eras*, treat those as **Tags** now; classes are the six **roles** (Prophet, Warrior, Priest, Shepherd, Patriarch, Disciple). Also updated since: Hero HP 30 (not 25), board limit 7 (not 6), decks are single-class + Neutral (not two-era). Everything else here stands.

*Companion to the GDD. This is the "how the game is organized and balanced" spec, reverse-engineered from Hearthstone's proven systems and mapped onto our five eras.*

---

## 0. What we're taking from Hearthstone (and what we're changing)

| Hearthstone system | What it does | COVENANT version |
|---|---|---|
| **Classes** (10–11) | Identity, deckbuilding lanes, replayability | **Five Eras** as our "classes" (fewer = tighter identity, which HS itself says is the goal) |
| **Class identity doc** (fantasy / excels / struggles) | Prevents "does this card fit?" debates | Written per era below — the rulebook for every future card |
| **Hero Powers** | Class identity + a play when you draw badly | **Leaders** (NEW — see §4). The gap we didn't have. |
| **Vanilla stat curve** (cost×2+1) | Invisible balance rail under every card | Adopted exactly (§2). Provision×2+1. |
| **Depth > complexity** | Design philosophy | Adopted as card-writing law (§6) |
| **Core Set** (free, refreshed yearly) | Onboarding + a fair floor, not power creep | **The Foundation** — free starter pool every player owns (§1) |
| **Expansions** (~135 cards, themed) | The content engine | Our numbered sets, era-anchored (§1) |
| **Mini-sets** (~35 cards, mid-cycle) | Keeps things fresh between expansions | Adopted (§1) |
| **Rarity split** (~3C/3R/2E/1L per class) | Collection texture + pack excitement | Adopted, tuned (§3) |
| **Pack rules** (5 cards, ≥1 rare, pity timers, dupe protection) | Fair-feeling F2P collection | Adopted (§5) |
| **Standard / Wild rotation** | Long-term meta freshness | Deferred model, designed now (§7) |
| Real-money packs, arena entry, cosmetics-for-cash | Monetization | **Cut.** Free, forever. Talents only. |

The philosophy in one line, borrowed and kept: **make simple cards that combine into deep decisions, give every era a fantasy it owns, and never sell power.**

---

## 1. Set Architecture

### The Foundation (our "Core Set")
Every player owns this from install. ~**60 cards**, spread across all five eras + neutral, at a deliberately *fair* power level. Hearthstone's insight: the free set isn't weak, it's a **progression floor** — collectible cards are side-grades and specialists, not strict upgrades. That's "path of progression, not power creep." Our Foundation includes at least one clean 1-drop, a mid-curve body, and a finisher per era so a brand-new player can build a real 30-card deck in any era on day one.

### Expansions (our content engine)
Each numbered set = **~120 collectible cards**, built around a theme and 1–2 new keywords, following Hearthstone's ~135-card cadence scaled slightly down for a solo-first game.

- **Set 1 — "Promised Land"** (the 120 in the GDD): establishes all five eras. Ships with the Foundation.
- **Set 2 — "Kings & Prophets"** (future): deepens Kingdom + Exiles, adds **Locations** (Jericho, the Upper Room), one new keyword.
- **Set 3 — "Acts"** (future): The Way expansion, mission/journey mechanics.

### Mini-sets (mid-cycle refresh)
~**35 cards** dropped halfway between expansions, themed tighter (e.g., *"The Wisdom Books"* — Job, Proverbs, Ecclesiastes, Song of Songs as a Neutral-heavy micro-set). Cheap to produce, keeps the collection loop alive between big sets. Hearthstone replaced paid single-player "adventures" with these; we follow suit.

### Set watermark
Every card carries a faint **era sigil** watermark behind its text (Hearthstone marks every expansion this way — it's how players read a card's age/set at a glance). Our sigils are the five alchemical-style era marks already in the GDD (🜃🜁🜂🜄🜔).

---

## 2. The Balance Rail (steal this exactly)

**Baseline vanilla stat budget:** `attack + health = (Provision cost × 2) + 1`

| Cost | Vanilla body | "Yeti-equivalent" |
|---|---|---|
| 1 | 2/1 or 1/2 | 3 stats |
| 2 | 3/2 or 2/3 | 5 stats |
| 3 | 4/3 or 3/4 | 7 stats |
| 4 | 5/4 or **4/5** | 9 stats *(the Yeti line)* |
| 5 | 6/5 or 5/6 | 11 stats |
| 6 | 7/6 or 6/7 | 13 stats |
| 7 | 8/7 or 7/8 | 15 stats |

**Keyword / text costs** (subtract from the stat budget to pay for text):
- **Guard** ≈ +1 value → a 3-cost Guard is a 3/4 minus ~1, so **1/5 or 2/4**.
- **Endure** (first damage prevented) ≈ +1.
- **Swift** ≈ +1 on aggressive statlines.
- **Arrival:** / **Legacy:** — priced by effect size, not flat. A "draw a card" ≈ 1.5–2 stats. "Deal 2 to a unit" ≈ 2–3 stats.
- **Fulfill:** — the early form is *under-statted* (paying for future upside); the fulfilled form is *over-statted* (the payoff). Net across the transformation ≈ fair-plus, because you earned it.

**Design targets, not laws.** Playable cards are usually *slightly* above vanilla in a specialized direction, or on-curve with relevant text. Pure-vanilla cards exist mainly to set the curve and fill Foundation slots — Hearthstone keeps a few precisely so the math stays legible. Claude Code enforces this rail in `CLAUDE.md`: any card more than ~1.5 stats over budget gets flagged for review.

---

## 3. Rarity Distribution

Hearthstone's per-class texture is roughly **3 Common / 3 Rare / 2 Epic / 1 Legendary**, plus neutrals. Ours, per era, per Set 1 (120 cards, 5 eras × ~20 + ~20 neutral):

| Rarity | Per era (~20) | Role | Collection feel |
|---|---|---|---|
| **Common** | 8 | Curve-fillers, the glue | You'll have playsets fast |
| **Rare** | 6 | Archetype enablers | The "oh nice" pulls |
| **Epic** | 4 | Splashy build-arounds (most **Miracles** live here) | Occasional, exciting |
| **Legendary** | 2–3 | The named heroes with **Fulfill** | The chase; 1-copy max |

Neutral (~20): mostly Common/Rare glue, 1–2 Legendaries (Ruth as a marquee neutral Legendary is perfect — the outsider grafted in).

**Rarity ≠ power** (critical, and Hearthstone-true): a Common can be a staple; a Legendary is *build-around*, not *strictly-better*. Rarity signals **complexity and swinginess**, not raw strength. This protects the F2P promise — a free Foundation deck must be able to beat a full-Legendary deck.

---

## 4. Leaders (the Hero Power system) — NEW, needs your ruling

**The gap:** Hearthstone gives every class a Hero Power for identity and for turns when your draw is dead. We have nothing equivalent. Here's the proposed fill, and it also *sharpens deckbuilding*.

**Proposal — the Leader replaces "pick any 2 eras":**
You choose a **Leader** for your deck (this is your "class"). The Leader:
1. **Locks your primary Era** (always fully available), and lets you **splash one second Era** (Runeterra's 2-region rule — kept).
2. Grants a **Hero Power**: a repeatable ability, cost **2 Provision**, once per turn, deliberately weaker than a 2-drop (Brode's rule, so it never dominates a turn — it's the *floor*, not the plan).
3. Gives the deck a face, a voice, and a campaign anchor.

Each era offers **2–3 Leaders**, so identity has variety without class-bleed chaos.

### Draft Leader roster & Hero Powers

**🜃 Beginnings**
- **Abraham** — *Multiply:* Summon a 1/1 Heir. *(go-wide, covenant increase)*
- **Sarah** — *Laughter of Promise:* Give a friendly unit +1/+1. *(slow snowball)*

**🜁 Deliverance**
- **Moses** — *Staff & Sea:* Deal 1 damage. *(the reach/removal era)*
- **Aaron** — *Manna:* Restore 2 health to your hero. *(wilderness sustain)*

**🜂 Kingdom**
- **David** — *Rally:* Give a friendly unit +1 attack this turn. *(aggressive tempo)*
- **Solomon** — *Discern:* Foresee 2. *(value/control king)*

**🜄 The Exiles**
- **Daniel** — *Endure:* Give a friendly unit "first damage prevented." *(attrition/protection)*
- **Elijah** — *Fire:* Deal 1 damage to a unit (not hero). *(prophetic burn/control)*

**🜔 The Way**
- **Peter** — *Go and Tell:* Summon a 1/1 Disciple. *(swarm/multiply — mechanically like Abraham but Disciples have their own synergy web, so it plays differently)*
- **Paul** — *Encourage:* Draw a card, then a card in hand costs 1 less. *(engine/tempo; tuned carefully — may be too strong, flag for playtest)*

**Why this is better than "any 2 eras":** it gives each deck a stated fantasy and a fallback play, it makes the campaign's boss/ally moments legible (you *fight* Leaders, then *unlock* them), and it mirrors exactly why Hearthstone feels like Hearthstone. **Cost:** it's more restrictive than the freewheeling 2-region model in the GDD. **Your call:** adopt Leaders (recommended), or keep pure 2-era freedom and skip Hero Powers entirely?

---

## 5. Pack & Economy Math (finalized)

Straight port of Hearthstone's fair-feeling F2P collection, minus the cash:

- **Pack = 5 cards.** Guaranteed **≥1 Rare or better** every pack.
- **Legendary pity:** guaranteed **within your first 10 packs** of a new set, and a rolling ~40-pack safety net after.
- **Duplicate protection:** you won't open a **3rd** copy of any Common/Rare/Epic until you have 2 of everything at that rarity in the set; you won't open a **2nd** copy of a Legendary until you own them all. Surplus auto-melts to Talents.
- **Talents (currency):** from wins, daily quests, campaign chapters, achievements, and the **Scroll Study** loop (read the card's real passage + 3 questions → capped daily bonus). No purchase path. No ads.
- **Crafting:** dust-equivalent ("Fragments") from melting dupes lets you target-craft any card — so a determined free player completes a set without RNG mercy. Rarity sets craft cost.

**F2P completion math (target):** a daily-quest + a few games player should complete each new 120-card Set within ~6–8 weeks without spending, because there's nothing to spend. The economy's only job is pacing the dopamine, never gating power.

---

## 6. Card-Writing Law (depth over complexity)

Pinned above the writers' room (and in `CLAUDE.md`):

1. **Highest depth-to-complexity ratio wins.** If a card needs 4 lines to explain, it had better create a genuinely new decision. Prefer simple cards that combine (Whirlwind + Acolyte of Pain is the model: each trivial, together a puzzle).
2. **Every era-card must pass the identity test** (§ below). If a card could slot into any era, it belongs in Neutral or it's redesigned.
3. **Vanilla is allowed and useful.** Not every card is a build-around. Clean bodies set the curve and teach value.
4. **Power progression, not power creep.** New sets add *new angles*, not strictly-bigger numbers. A Set 3 card should enable a deck, not obsolete a Set 1 card.
5. **The flavor rule still governs** (from GDD §6.5): joke about the humans, never the holy; humor in flavor/names, reverence in the sacred core.

---

## 7. Era Identity — the rulebook (fantasy / excels at / struggles with)

Hearthstone's June-2019 framework, applied. This is the single most useful thing to steal: it settles every "does this card belong here?" argument before it starts.

**🜃 BEGINNINGS — Genesis & Patriarchs**
- *Fantasy:* planting a promise that compounds into an inevitable future.
- *Excels at:* going wide (Heir tokens), permanent +1/+1 growth, late-game inevitability, ramp.
- *Struggles with:* early tempo, direct removal, reach. Slow to start; punishable by aggro.

**🜁 DELIVERANCE — Exodus & Wilderness**
- *Fantasy:* survive the impossible, then the sea parts.
- *Excels at:* spells and Miracles, mass effects, protection, cost reduction, comeback swings.
- *Struggles with:* sticky board presence, proactive early pressure. Reactive by nature.

**🜂 KINGDOM — Judges & Kings**
- *Fantasy:* the shepherd who becomes the king; the giant who falls.
- *Excels at:* combat stats, weapons/Relics, attack buffs, tempo, punishing big enemies (giant-slaying).
- *Struggles with:* card advantage, healing, going long. Runs out of gas.

**🜄 THE EXILES — Prophets & Exile**
- *Fantasy:* the fourth man in the fire; outlast the empire.
- *Excels at:* Endure/protection, Foresee/card-selection, targeted burn, recursion (Dry Bones), attrition.
- *Struggles with:* raw speed, wide boards. Wins slowly, by not losing.

**🜔 THE WAY — Apostles & Early Church**
- *Fantasy:* a scattered spark becomes a wildfire.
- *Excels at:* Disciple swarm + buffs, healing, card draw, converting loss into growth (persecution → multiplication).
- *Struggles with:* individually big threats, single-target removal. Dies to board wipes if overcommitted.

Each pairing (primary + splash) should produce a *legible archetype*: Kingdom/Beginnings = "grow then swing," Exiles/Deliverance = "control fortress," Way/Kingdom = "buffed aggro," etc. If a two-era pair has no obvious gameplan, that's a design gap to fill.

---

## 8. Rotation Model (design now, ship later)

Hearthstone keeps its meta fresh with **Standard** (recent sets only) vs **Wild** (everything). We don't need this at launch (solo, few sets) but we design toward it so we're not trapped later:

- **Canon format** (= Standard): the Foundation + the most recent ~2–3 sets. The balanced, curated ladder.
- **Apocrypha format** (= Wild): every card ever, anything goes, for the enfranchised who want chaos.
- Naming keeps the wit reverent-adjacent without being flippant (Canon = the received books; Apocrypha = the extended shelf). Flag if that reads wrong to you — easy to rename.

---

## 9. Decisions for you

1. **Leaders + Hero Powers — yes?** (Recommended. Replaces "any 2 eras" with "1 Leader locks primary era + 1 splash." More identity, more replay, slightly less freedom.)
2. **Leader → does it *hard-lock* the primary era, or just grant the Hero Power while keeping free 2-era choice?** (Hard-lock is more Hearthstone; soft is more Runeterra.)
3. **Foundation size** — 60 free cards feels right; confirm you want the free floor that generous (I think yes; it's the whole F2P-fairness promise).
4. **Rotation names** — Canon / Apocrypha, or keep it plain (Standard / Legacy)?
5. **Mini-set greenlight** — is "The Wisdom Books" the right first mini-set theme, or save Job/Proverbs for a full set?
