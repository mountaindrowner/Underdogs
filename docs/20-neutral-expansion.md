# 20 — Neutral Expansion (26 cards) — Design Memo

*Response to the brief in `19-neutral-set-prompt.md`. 26 collectibles: **10 Common · 8 Rare · 5 Epic · 3 Legendary**. Curve deliberately weighted to the gaps — **5 cards at 6–7** (the top-end hole), **8 at 4–5** (thin midrange), the epic slot filled. All neutral/untagged. JSON: `data/cards.neutral-expansion.json`.*

## Competitive-theory grounding (HS neutral doctrine)
- **Vanilla sets the curve but isn't *wanted*** (Chillwind Yeti is "the king of vanilla value," yet pure vanillas are "tolerated, not desired"). → Only **3 truly textless** cards (Village Elder, Stonemason, Caravan Master) as clean curve anchors / small-deck filler; everyone else gets **one small reason to want them**.
- **Distribution > total** (Yeti's 4/5 beats a 5/4 or 2/7 at equal stats; health trades up and dodges removal). → Defensive cards lean **health-heavy** (Night Watch 2/5, Almsgiver 1/4, Generous Host 2/5) to help the control decks the sims say are behind.
- **"Overstat + a leash" is what sees play** (4-mana 7/7 Eerie Statue). → Eleventh-Hour Laborer (3c **5/4**, can't attack unless you played another card) is our Statue.
- **Conditional neutral removal is correct** (Black Knight kills only Guards). → The Plumb Line destroys only a **damaged** enemy — a real answer that isn't an auto-include.
- **Top-end must affect the board *now*** (Cairne fell off for lacking immediate impact). → Every 6–7 drop does something on arrival or provides an aura, never just a vanilla pile.

## By role

**Fair filler / curve anchors (Commons).** Village Elder (2c 3/2), Stonemason (4c 4/5 — our Yeti), Caravan Master (3c 3/4), Threshing Hand (1c 2/1), Lamp-Bearer (1c 1/2). Textless or near — the on-curve options small decks need. Stonemason is intentionally the defensive Yeti stat-line.

**Defensive tools (tilted to lift control vs aggro).** Night Watch (3c 2/5 Guard), Master Builder (5c 4/6 Guard, Rare), Generous Host (4c 2/5 Guard + heal 3), The Faithful Remnant (6c 4/8 Guard + heal all others 1, Epic), The Cornerstone (7c 5/9 Guard, +0/+1 aura, Epic). Fills the "Guards only at 1-drop" gap across 3/4/5/6/7. Health-heavy by doctrine.

**Sustain / anti-aggro.** Almsgiver (2c 1/4, heal 2), The Widow's Jar (2c relic — heal 2/turn for 3 turns then breaks; rate-limited so it's not a permanent value engine), Jar of Flour & Oil (5c 3/7 — empty-hand payoff: heal 3 + draw). These give grindy decks a spine without handing aggro cheap enablers.

**Proactive answers (conditional, costed above class removal).** The Plumb Line (3c spell, destroy a *damaged* enemy — combo/setup, not standalone), The Measuring Reed (6c 6/6, Arrival deal 3 + heal 3 — a fair tempo swing on a body). No unconditional hard removal; both need a board state or pay full body cost.

**Card advantage (rate-limited).** Gleaner (2c 2/3, draw if hand empty), Steward of Talents (4c 3/4, draw on Arrival *and* Legacy — value over two triggers, fair rate), The Sower (3c 2/3, Foresee 2 — dig, not raw cards). Refuel for attrition decks, none explosive.

**Buff/tempo bodies.** The Potter (3c 3/3, +0/+2 to an ally), Foreign Convert (2c 2/2, +1/+0 to another). Small board-shaping, on-rail.

**Top-end finishers (6–7, the priority hole).** The Cornerstone & The Faithful Remnant (defensive walls), The Measuring Reed (tempo swing), Barzillai the Aged (7c 6/8, heal 5 + draw 2 — the control curve-topper), The Great Cloud of Witnesses (7c legendary, go-wide payoff).

**Niche build-around Legendaries (each shines in ONE archetype, mediocre elsewhere — the anti-homogenizer):**
- **Barzillai the Aged** (7c) — *control/attrition finisher.* A stabilizing haymaker (heal 5, draw 2, 6/8 body) that's dead weight in aggro. Home: grindy Priest/Prophet.
- **The Lone Pilgrim** (5c) — *highlander payoff.* Draw 3 if your deck has **no duplicates** (singleton). Rewards a whole deckbuilding restriction; useless in a normal 2-of deck. Home: highlander brews across any class.
- **The Great Cloud of Witnesses** (7c) — *go-wide payoff*, but **not** a Disciple/Shepherd token-clone: it buffs your *other* units +1/+1 **per other faithful unit** (a wide-board multiplier, needs bodies already down — anti-synergy with swarm's own cheap enablers, so it rewards *tall* wide boards, not token spam). Home: Patriarch ramp / any midrange that flooded.

## Rail self-check
Bodies sit on `(cost×2)+1` unless text pays for it. Flags from the audit:
- **Under budget (text pays for it):** The Sower −2 (Foresee 2), Steward of Talents −2 (draw twice), Zealous Defender −2 (Swift, aggressive statline), Generous Host −2 (Guard + heal 3), The Great Cloud −3 (huge conditional Arrival). All intended.
- **Over budget (has a leash):** Eleventh-Hour Laborer **+2** (5/4 at 3c) — gated by "can't attack unless you played another card this turn." The Eerie-Statue pattern; the drawback is real in the empty-hand turns aggro wants.
- Everything else within ±1. Nothing unflagged over budget.

## Neutral-paradox compliance (§7)
- **Only 3 pure vanillas** — the rest ask a question ("is my hand empty?", "do I run singletons?", "is there a damaged enemy?", "do I have a wide board?"). Few universal auto-includes by design.
- **Class tools stay best-in-slot:** neutral healing is on bodies/rate-limited (worse than Priest's efficient heals); neutral removal is *conditional* (worse than Prophet burn); neutral draw is slow (worse than class engines). Neutrals fill gaps for classes that *lack* a tool without dethroning classes that *own* it.
- **Power leans slow/defensive** (Guards, heals, attrition, top-end) per the sim guidance that control is behind — no cheap aggressive enablers added.
- **No strictly-better-than-existing** designs; each new card diversifies a slot rather than replacing a card.

## Tag/tribe references
**None.** Every card is fully untagged and references no era-tribe, keeping neutral space clean and leaving archetype-enabling to class cards (per §3).

## Laws check (§1)
All 26 are faithful persons or reverent objects/parables (elders, artisans, servants, widows, converts, the jar of oil, the plumb line, the cornerstone, the measuring reed). No villains, no Jesus-as-card (the Cornerstone/Cloud reference *the faithful's* framing via Psalm/Hebrews, never depicting Him), humor ribs the humans only (the eleventh-hour laborer annoying everyone; the zealous defender who "drew first, asked questions never"), art prompts are single-figure/object and reverent. ✓

## New Capabilities Requested
Small, precise — three of these mirror already-flagged Set-2 needs:
1. **`condition:"empty_hand"`** — evaluate "you have no cards in hand" for Arrival/endOfTurn gating (Gleaner, Jar of Flour & Oil). Simple state check.
2. **`condition:"singleton_deck"`** — true if the deck contains no duplicate card ids (The Lone Pilgrim / highlander). Computed once at play.
3. **`passive:"requiresOtherPlay"`** — a unit can't attack unless another card was played by you this turn (Eleventh-Hour Laborer). Turn-scoped flag.
4. **`perOtherAlly` multiplier** on `buff` — scale a buff by count of other allies (The Great Cloud). Mirrors the existing `perEnemyUnit`/`gainForEachSheep` patterns.
5. **`target:"damagedEnemy"`** — already requested for Set 2 (Jael); reused by The Plumb Line. No new work if that landed.
6. **`passive:"breakAfterTurns"` (amount N)** + **`toHand`/`diedThisTurn`** flags on `returnFromDiscard** — expiring standing relic (Widow's Jar) and a hand-return redeemer (Kinsman-Redeemer). `returnFromDiscard` already supports `toField`; adding `toHand` + a `diedThisTurn` filter is a small extension.

Everything else uses the closed vocabulary verbatim.

---

## Integration audit (cross-referenced vs Set 1 + Set 2 — post-design pass)
Ran the 26 against the full library (120 Set 1 + 30 Set 2 legendaries). Findings & resolutions:
- **Duplicate IDs:** none. **Exact name collisions:** none.
- **Fixed — name overlaps that read as confusing:**
  - `The Widow's Jar` → **The Jar of Oil** (avoids clash with existing *The Widow's Mite*).
  - `Steward of Talents` → **The Faithful Servant** (avoids clash with existing *Eliezer the Steward*).
- **Fixed — effect crowding:** hero-heal appeared on 9 neutrals across the pool (auto-include risk per the neutral paradox). Reworked **The Measuring Reed** from *deal 3 + heal 3* to *deal 3 + draw 1*, dropping healers to 8 with a cleaner curve spread (Almsgiver 2 / Generous Host 4 / Jar of Oil 2 / Jar of Flour & Oil 5 / Barzillai 7 + existing Naaman/Melchizedek/Cornelius).
- **Reviewed, kept (harmless shared-word flags):** Caravan Master~Terah's Caravan, Threshing Hand~Gideon Threshing, Foreign Convert~Eager Convert, Zealous Defender~Phinehas the Zealous, Plumb Line~Lion's Line, Great Cloud~Great Commission/Mordecai the Great. Distinct cards/roles; "faithful/great/line/convert" are common biblical vocabulary.
- **Combined neutral pool health:** 47 total (21 existing + 26 new). Curve `{0:1,1:7,2:12,3:11,4:6,5:5,6:2,7:3}` — top-end hole filled. Rarity `{common:20,rare:12,epic:6,legendary:9}`. Draw (9) and Guard (9) spread across the curve, not stacked — healthy.
