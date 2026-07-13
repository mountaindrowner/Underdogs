# 19 — Design Brief / Handoff Prompt: The Neutral Expansion

*A self-contained prompt to hand a fresh "master designer" session so it can craft a new set of **neutral** cards for UNDERDOGS. Everything it needs is below — the laws, the locked rules, the exact engine vocabulary, the current neutral pool, the gaps, the competitive-health guardrails, and the deliverable format. Copy everything under the line into the new session.*

---

You are designing a new set of **Neutral cards** for **UNDERDOGS** (codename COVENANT), a single-player, offline, free-forever, Scripture-themed digital collectible card game — "a Hearthstone-quality TCG skinned for Scripture" for Christian nerds who love Hearthstone / Runeterra / Magic. Adventure-epic tone with dry, self-aware humor. The signature idea: teach the biblical story *through mechanics*, never by preaching.

Your job: propose a **neutral expansion** that adds bulk, options, and deck-diversity so the game reads as a **competitive** TCG — while protecting class identity and overall balance. Deliverable format is at the very bottom. Design only; do not write engine code.

## 1. The Laws (inviolable — never break these in a card, its text, flavor, or art prompt)

1. **Jesus is never a card.** Not collectible, not a stat block, not a target, not a resource. He appears only in campaign narrative / prophecy framing. Neutrals will never depict or represent Him.
2. **Players field only the faithful.** Villains (Goliath, Pharaoh, Jezebel, the Serpent, Haman, Herod…) are **AI-only "Adversary" cards** — never collectible, never in a player set. A neutral card is one of the *faithful* or a neutral *object/parable* — never a villain.
3. **Joke about the humans, never the holy.** Humor lives in card names, flavor text, and quips — ribbing Peter for sinking, Jonah for sulking. It never touches God, the Cross, the Resurrection, the Holy Spirit, or grace moments. The faithful are *lovably human*, never contemptible. **No puns on the faithful's names.** When in doubt, state the real, weird biblical detail deadpan — that's the humor.
4. **Reverent presentation.** No blood, gore, or death screams in art prompts; defeated units fade to light/dust.
5. **Broad-evangelical safe.** No denominational hobby-horses. Passage references on cards are reference-only (book + chapter); never editorialize doctrine.

If a concept would require breaking a Law, drop it — don't reframe around it.

## 2. Locked game rules (canon — design within these)

| Rule | Value |
|---|---|
| Win condition | Reduce enemy hero to **0 HP** (the only win condition) |
| Hero HP | **30** |
| Resource | **Provision** — starts 1, +1 max/turn, cap **10**, refills each turn |
| Turn structure | **Strictly alternating. No reactive plays, no stack, no instants, no "in response."** All defense is pre-set via keywords/stats. Everything a card does happens on *your* turn. |
| Turn phases | Dawn (ready units, +Provision, start-triggers, draw 1) → Main (play/attack any order) → Dusk (end-triggers, pass) |
| Board limit | **7** units per side |
| Hand limit | **10** (excess draws burn) |
| Deck | **30 cards**, max **2 copies** of any card, max **1** of each Legendary |
| Deckbuilding | **One Class + Neutral cards** (Hearthstone model). Neutrals go in *every* class — that is exactly why they matter and why they're dangerous (see §7 guardrails). |
| Randomness | **Light only.** Allowed: shuffle, Foresee, Discover. **Banned:** RNG card generation from *outside* the deck, random transforms, coin-flip win conditions. |

**Design consequence of "no reactive plays":** there is no counterspell, no combat trick, no instant-speed removal. All interaction is **proactive, on your own turn** (Arrival effects, attacks, pre-set Guard/Endure). This makes efficient proactive answers *scarce and precious* — a key competitive lever for neutrals, but one that must be costed honestly (see §7).

## 3. Classes & Tags — what neutrals must NOT step on

Six classes, each with a **signature mechanic that is theirs**. Neutrals must not become a better engine for these than the class itself:

| Class | Signature (do NOT build neutral payoffs for these) |
|---|---|
| 🕮 Prophet | **Foresee** + burn (reach/removal) |
| ⚔ Warrior | **Relics** (equip weapons) + Giant-Slayer |
| ✚ Priest | **Endure** + heal + **Raise** |
| 🐑 Shepherd | **Redeem** (small ally returns / becomes a Sheep) |
| ⭑ Patriarch | **Covenant** (start-of-turn trigger) + ramp |
| 🔥 Disciple | **Scatter** (dies → summon a Disciple) + swarm |

**Tags** (`Genesis · Exodus · Judges · Kingdom · Exile · Apostles`) are cross-cutting era-tribes. **Neutrals are canonically untagged.** A neutral may *reference* a tag/tribe in its text as a light enabler (e.g. "your Exile cards cost (1) less") **only if** it opens a new archetype rather than homogenizing decks — use at most 1–2 such cards, and prefer to leave that space to class cards.

Neutrals *may* carry the core keywords (Guard, Swift, Endure, Arrival, Legacy) — those belong to everyone. Neutrals **must not** be the payoff engine for a class keyword (Redeem, Covenant, Scatter, Raise, Foresee-burn packages, Relic-equip synergy).

## 4. Keyword vocabulary (complete — do not invent new keywords)

- **Guard** — enemies must attack this unit first.
- **Swift** — may attack the turn it's played.
- **Endure** — the first instance of damage this unit would take is prevented (a one-shot shield).
- **Arrival:** — effect when played (battlecry).
- **Legacy:** — effect when this dies (deathrattle). *What the faithful leave behind.*
- **Foresee X** — look at the top X of your deck; reorder or bottom them. *(Prophet-flavored — use sparingly on neutrals.)*
- **Discover** — choose 1 of 3 (from your deck unless stated).
- **Fulfill:** — a Legendary transformation condition (see §6).
- Class keywords (Redeem, Covenant, Scatter, Raise) and **Giant-Slayer** — leave to their classes.

Inventing a new keyword requires human sign-off — instead, list any wished-for keyword in your "New Capabilities Requested" section rather than using it.

## 5. Engine vocabulary you may use (the closed, executable palette)

Every card must be expressible with the JSON below or it can't run. This is the **contract** enforced by `tools/audit-cards.ts`. Reuse these; anything outside them goes in "New Capabilities Requested."

**Triggers (effect keys):** `arrival`, `legacy`, `redeem`, `covenant`, `scatter`, `aura`, `startOfTurn`, `endOfTurn`, `onDeath` (+`replaceDeath`), `raise` (ally-death listener), `trigger` (generic listener via `on`), `passive`.

**Effect verbs:** `deal`, `heal`, `healUnit`, `healHero`, `buff` (+attack/+health, honors `filter:{tribe}` and `scope:'other'`), `setAttack`, `giveKeyword`, `silence`, `destroy`, `exile`, `summon` (a token id), `draw`, `drawType` (`cardType`: minion/relic/spell), `transform`, `foresee`, `discover`, `discoverFromDeck`, `returnToHand`, `shuffleIntoDeck`, `returnFromDiscard` (supports `count`, `withKeyword`, `toField`), `delayedTransform`, `conditionalDeal`, `gainForEachSheep`, `onHealBonus`, `discountHand`, `auraBuff` (continuous; `grantToTarget` grants an aura), `costReduce` (a real cost-aura in `aura`; accepts `filter:{cardType|class|tribe}`), `gainProvision` (+N Provision to spend this turn), `cannotAttackAlone`.

**Target selectors:** `self`, `allAllies`, `allEnemies`, `allUnits`, `randomAlly`, `randomEnemy`, `ownHero`, `enemyHero`, `strongestEnemy`, `weakestEnemy`, `mostHealthEnemy`, `cheapestEnemy`, `allEnemiesWithoutGuard`, `damagedAlly`, `damagedEnemy`, `target` / `enemy` / `ally` / `anyUnit` / `anyCharacter` / `anyFriendlyOrHero` (these four are **player-chosen** at play time), `friendlySheep`, `friendlyDisciple(s)`, `friendlyHeirs`, `lastFallenAlly`, `strongestFallenAlly`, `alliesDiedThisTurn`, `allHand`.

**Fulfill conditions (Legendaries):** `control_allies` (value N), `slay_giant`, `survive_damage`, `survive_stronger`, `survive_damaged_turn`, `hero_damaged`, `cast_spells` (value N), `outnumbered_win`, `auto_next_turn` (the single grace transform — reserved). A neutral Legendary *may* use Fulfill, but it's not required.

**Determinism rule:** the engine is seed-deterministic. No `Date.now()`/`Math.random()` semantics; randomness only via shuffle/Foresee/Discover. No generating cards from outside the deck.

## 6. FULFILL (only if a neutral Legendary uses it)

A Fulfill legendary enters in an early form with a visible condition; meeting it transforms the card (new name/art/stats/ability), mirroring a real arc. Rules: transformation heals to new max HP, clears damage, keeps board position, doesn't re-apply summoning sickness; early form is *under-statted*, fulfilled form *over-statted*. If you use it, design **both halves** and point `fulfill.into` at the fulfilled id.

## 7. Balance rail + the neutral-specific guardrails (read twice)

**Vanilla stat budget:** `attack + health ≈ (cost × 2) + 1` → 1-cost≈3, 2≈5, 3≈7, 4≈9, 5≈11, 6≈13, 7≈15. Each keyword / relevant line costs ≈ **−1 stat** off the vanilla body ("draw a card" ≈ −1.5/−2; "deal 2 to a unit" ≈ −2/−3). Flag any card >~1.5 stats over budget.

**Rarity = complexity/swing, NOT power.** A Common can be a staple; a Legendary is *build-around*, not strictly-better. A free starter deck must be able to beat an all-Legendary deck.

**The neutral paradox (the most important guardrail):** because neutrals go in *every* deck, a neutral that is simply *efficient and unconditional* becomes an **auto-include** that every deck runs — which **homogenizes** the meta and *reduces* diversity. That is the opposite of the goal. So:

- **Prefer conditional / build-around / flexible cards over raw stat-stick staples.** A neutral should ask a question ("do I want this in *this* deck?"), not answer every deck's question.
- **Class tools should stay best-in-slot.** A neutral answer/heal/draw should be slightly *worse rate* than the class card that does the same thing, or come with a condition, so it fills gaps for classes that *lack* the tool without dethroning classes that *own* it.
- **No strictly-better-than-an-existing-card designs.** Diversify, don't power-creep.
- **Lean the flexible power toward slower/defensive strategies.** Current AI-vs-AI sims show tempo classes (Warrior/Shepherd) high and control classes (Priest/Prophet) low — partly a greedy-AI artifact, but it means the game *needs* better tools for grind/control decks. Neutral healing, Guards, card-advantage, anti-swarm, and top-end finishers help control decks catch up; avoid piling on cheap aggressive enablers.

## 8. The CURRENT neutral pool (21 collectibles — do not duplicate; fill the gaps)

| Cost | Name | Stats | Rarity | Text |
|---|---|---|---|---|
| 0 | The Widow's Mite | spell | Epic | Give an ally +1/+1; if it's your only card, give +2/+2 (approx) |
| 1 | Gatekeeper | 0/3 | Common | Guard. |
| 1 | Ruth | 1/1 | Rare | Whenever another ally dies, gain +1/+1. |
| 1 | Scarlet Cord | 0/2 relic | Rare | +0/+2; Legacy: draw a card. |
| 1 | Shepherd | 1/1 | Common | Vanilla. |
| 1 | Watchman | 0/2 | Common | Guard. |
| 2 | Craftsman | 2/2 | Common | Arrival: draw a Relic from your deck. |
| 2 | Cupbearer | 1/3 | Common | Arrival: draw a card. |
| 2 | Melchizedek's Blessing | spell | Rare | Restore 4 to your hero; draw a card. |
| 2 | Musician | 1/3 | Common | End of turn: give a random ally +1/+0. |
| 2 | Onesimus | 2/2 | Common | Legacy: return Onesimus to your hand. |
| 2 | Rahab, of the Scarlet Cord | 2/2 | Legendary | Endure. Fulfill: survive damage. |
| 2 | Scribe | 1/2 | Common | Arrival: Foresee 1. |
| 3 | Boaz | 2/4 | Common | Guard. +1/+1 while you control Ruth. |
| 3 | Esther, in the Palace | 2/4 | Legendary | Arrival: Foresee 1. Fulfill: hero damaged. |
| 3 | Mordecai, at the King's Gate | 2/4 | Legendary | Guard. Fulfill: hero damaged. |
| 3 | Physician | 2/3 | Common | Arrival: restore 3 to an ally. |
| 3 | The Shunammite Woman | 2/4 | Legendary | Your Prophet cards cost (1) less. |
| 4 | Cornelius the Centurion | 3/4 | Legendary | Arrival: restore 3 to your hero and draw a card. |
| 4 | Naaman the Healed | 4/4 | Rare | Arrival: restore 4 to your hero. |
| 5 | Job | 3/6 | Legendary | When Job takes damage, at the start of your next turn restore him and draw. |

**Spread today:** 10 Common / 4 Rare / **1 Epic** / 6 Legendary. Curve: 0×1, 1×5, 2×7, 3×5, 4×2, 5×1 — **nothing at 6 or 7**, thin at 4–5. Types: 18 minions, 1 relic, 2 spells.

**Identified gaps to fill:**
1. **Top-end (cost 6–7):** currently *zero*. Every deck wants a couple of neutral finishers/haymakers. Highest priority.
2. **The 4–5 slot:** only 3 cards. Midrange bodies with relevant text.
3. **Epics:** only 1 — the swingy, build-around middle rarity is nearly empty.
4. **Proactive answers/interaction:** no neutral hard removal, no neutral AoE, no neutral silence-body. Costed *honestly* and slightly worse than class removal (see §7). This is what makes decks able to fight, i.e. "competitive."
5. **Card-advantage engines:** a couple more, rate-limited.
6. **Defensive Guards across the curve** (only 1-drops guard today) — helps control vs aggro.
7. **A neutral relic or two** (only 1 today) and maybe 1 more neutral spell.
8. **Niche build-around Legendaries** — the "cool but not auto-include" slots (see §9 for suggested spaces).

## 9. The design brief — what to make

Propose **~24–28 new neutral collectibles**. Target rarity spread (fills the epic hole, adds a few niche legendaries): **~10 Common · ~8 Rare · ~5 Epic · ~4 Legendary.** Weight the curve to the gaps: several cards at **cost 4–7** (with 2–3 genuine top-end finishers), plus flexible 2–3 drops and a couple of 1-drops.

Cover these **roles** (mix, don't silo):

- **Flexible bodies / fair filler** across the curve — vanilla-ish stats with a small relevant twist, so smaller decks have on-curve options. (Commons/Rares.)
- **Defensive tools** — Guards at 3/4/5, an Endure body or two, a heal-on-a-body — tilted to help control decks survive aggro.
- **Proactive answers** — e.g. an Arrival that deals damage or destroys a *conditional* target (`damagedEnemy`, `strongestEnemy`, `cheapestEnemy`), or a body that silences on arrival. Cost them a touch above class removal.
- **Card advantage** — a rate-limited draw engine or a Legacy that refuels; a Discover body for flexibility.
- **Top-end finishers** — 1–3 big bodies at 6–7 with a payoff (a Guard wall, an Arrival swing, a board-wide buff) that any deck can slot as a curve-topper.
- **A neutral relic and/or spell** — broaden the type mix.
- **Niche build-around Legendaries (pick ~4 from spaces like):** a **highlander** payoff (rewards a singleton deck), a **go-wide** payoff (rewards a full board — but not a Disciple/Shepherd clone), a **control finisher** / attrition payoff (rewards a long game / fatigue), an **anti-aggro** bulwark, a **spell-count** or **relic-count** payoff, a **hand-size** or **overdraw** payoff, or a **self-damage/sacrifice** engine. Each should shine in *one* archetype and be mediocre elsewhere — that's what makes them diversify rather than homogenize.

**Theme space for neutrals:** the *everyman* faithful and biblical *objects/parables* not tied to a class hero — artisans, servants, minor judges/kings/prophets-as-laypeople, widows, foreigners grafted in (Ruth/Rahab/Naaman/Cornelius are the template), parable figures (the Sower, the Good Samaritan-as-mechanic-not-name-if-sensitive, the talents, the lamp, the mustard seed, the lost coin, the pearl, the wineskins), and holy *objects* (the Ark-as-relic-if-reverent, jars, scrolls, the plumb line, the measuring reed, oil, bread). Keep villains out (Adversary pool only). Respect Law 3 on names and flavor.

**Voice:** rules text terse and unambiguous. Flavor 1–2 lines, dry/deadpan, **ending on a book + chapter reference** (e.g. "— Ruth 2"). Match the established voice in `docs/04-card-database.md`.

## 10. Deliverable

Return **two things**:

**A) A JSON array** of the new neutral cards, each object matching the card schema used in `data/cards.set2.json` / validated by `data/cards.schema.json`. Fill **every** field:

```json
{
  "id": "snake_case_unique_id",
  "name": "Display Name",
  "class": "neutral",
  "tag": null,
  "type": "minion" | "spell" | "relic",
  "cost": 0,
  "attack": 0,            // minions/relics
  "health": 0,            // minions; relics use durability if applicable
  "rarity": "common" | "rare" | "epic" | "legendary",
  "keywords": ["guard"],  // from §4 only
  "text": "Rules text, terse.",
  "effects": { "arrival": [ { "verb": "draw", "amount": 1 } ] },  // §5 vocabulary only
  "flavor": "One or two dry lines. — Book 0",
  "art": "A single-figure or single-object scene prompt (see Law 4)."
}
```

**B) A short design memo** that:
- Groups the cards by **role** (filler / defensive / answers / card-advantage / top-end / niche legendaries) and explains what each niche legendary's home archetype is.
- Includes a **rail self-check**: for each card, note stat budget vs `(cost×2)+1` and flag anything >~1.5 over.
- Lists any **"New Capabilities Requested"** — verbs/keywords/targets/fulfill conditions your best designs wanted but that aren't in §4–§5. Describe each precisely so an engineer can scope it. (Prefer to design *within* the existing vocabulary; only request what genuinely unlocks a great card.)
- Notes any card that references a **tag/tribe** and argues why it *diversifies* rather than homogenizes (§3, §7).
- Confirms every card passes the **Laws** (§1) and the **neutral paradox** guardrails (§7).

Design tight, flavorful, and competitively honest. Bulk *and* options — but every neutral should make some decks better and leave others cold, never make all decks the same.
