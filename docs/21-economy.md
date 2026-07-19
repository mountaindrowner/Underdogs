# 21 — Economy, Currency & Progression

*How a player goes from a simple starter deck to a deep collection — in a single-player, offline, free-forever game (with a possible multiplayer future). Design north star (from docs/16 research): **Runeterra's "buy the cards you want, not random packs" was the genre's most-loved economy; Marvel Snap's stingy acquisition was its fatal flaw.** We're free, so we out-generous everyone. Currency exists to pace discovery and fuel dopamine, NEVER to gate fun behind grind or a wallet.*

---

## 0. First principles
1. **No real money is required, ever** (free forever). Optional support/cosmetics only — never power.
2. **You can always get the specific card you want** (crafting), so a bad-luck streak never blocks a deck.
3. **Packs are the dopamine; crafting is the safety net.** Two currencies, two feelings: packs = surprise & delight, dust = agency & certainty.
4. **Offline-first:** all balances/quests resolve on-device; nothing needs a server. (Multiplayer later can sync, but the economy works fully offline.)
5. **The reward cadence is frequent and visible** — every session ends with progress you can see.

---

## 1. The two currencies

### 🪙 Talents (soft currency — earned, spent on Packs)
*Named for the parable (Matthew 25) — "well done, good and faithful servant." Also literally a unit of biblical money.*
- Earned by **playing**: winning matches, completing chapters, daily/weekly challenges, first-win-of-the-day bonus, Saga/roguelike milestones.
- Spent on **Packs** (and cosmetics later).
- The steady heartbeat currency — you always leave a session with more.

### ✦ Fragments (crafting currency — the certainty layer)
*"Broken pieces gathered up" (John 6:12 — nothing wasted). Runeterra's Shards / HS's Dust.*
- Gained by **disenchanting duplicates or unwanted cards**, and as a trickle from quests.
- Spent to **craft any specific card you want** — the anti-bad-luck guarantee.
- Every card has a Fragment cost by rarity (craft) and a smaller disenchant value (recycle).

*(Two currencies, deliberately: Talents keep packs exciting; Fragments guarantee you're never stuck. Neither buys power with money.)*

---

## 2. The New Player On-Ramp (simple deck → deep collection)

The most important 30 minutes. Path:
1. **Free starter deck** for a chosen class — a complete, playable, *winning* deck out of the box (the free-deck-beats-legendaries promise means the starter is genuinely good, not a trap).
2. **"The First Fruits" — a guided opening stretch:** the first several wins/chapters hand out **guaranteed, curated packs** (not random) that visibly complete the player's first archetype. New players should feel their deck *snap into focus*, not drown in random commons.
3. **A second class deck** gifted after finishing the tutorial saga chapter — so they taste variety early.
4. **Duplicate protection** (see §5) means every early pack is nearly all *new* cards — the Snap "stuck in Series 1" misery never happens.
5. By ~2 hours in: two viable decks, a pile of Fragments, and a clear "next card I want." That's the hook set.

---

## 3. Packs — the dopamine engine

### Pack contents
- A **Storehouse Pack** = **5 cards**, guaranteed **≥1 Rare-or-better** (HS standard; reliably exciting).
- **Rarity odds** (tunable): Common ~70%, Rare ~22%, Epic ~6%, Legendary ~2%, with a **pity timer**: guaranteed Legendary within N packs (Runeterra/HS both do this — removes the "100 packs no legendary" rage).
- **Duplicate protection:** packs prefer cards you don't own; you can't get a 3rd copy of a card (deck max is 2) until you own all others of that rarity — dupes auto-convert to Fragments.

### Pack *types* (variety = anticipation, per Snap's "seasonal surprise" lesson)
- **Storehouse Pack** — the standard, all-sets.
- **Set Packs** — focused on one set (Promised Land / Cloud of Witnesses) for players chasing a specific archetype.
- **Golden/Blessed Pack** — rare premium pack (earned, e.g. weekly) with better odds + a guaranteed foil.

### The pack-opening EXPERIENCE (the high-graphics dopamine moment — brief for Claude Code)
This is where we out-class everyone; Shadowverse gets praised specifically for pack-opening most games neglect. Design it as a **ritual**, not a list reveal:
1. **The Storehouse:** a sealed pack sits on a tooled-leather surface (the menu's material language) — a wax-sealed scroll-case or a small cedar chest. Tap to break the seal (satisfying wax-crack / latch sound + haptic).
2. **Cards fly out face-down**, fanned. Tap each to flip — **the flip is the moment.** A card's **back-glow telegraphs rarity before it turns** (the Hearthstone trick): a faint amber shimmer = something good; a rising gold beam + held breath = Legendary incoming.
3. **Rarity-scaled payoff on flip:** Common = soft chime; Rare = blue spark; Epic = purple burst + card tilts in 3D; **Legendary = the screen dims, a gold pillar of light, a swelling choir stinger, the card turns slowly with animated foil, dust motes.** Escalating spectacle — the doc/11 audio + doc/07 juice systems drive it.
4. **"New!" ribbons** on cards you didn't own; **dupe cards visibly shatter into Fragments** (a small satisfying stream into your Fragment counter — even dupes feel like a reward, not a letdown — the anti-Snap).
5. **Foil/Blessed cards** (cosmetic rare variant) get an extra flourish — animated art, a shimmer sweep.
6. **A "reveal all" fast-path** for players who've seen it 500 times (respect the veteran; never force the animation).

*The felt goal: every pack should make you lean in on the flip. The back-glow tease is 80% of the dopamine — build that first.*

---

## 4. Earning Talents — the reward cadence

### Always-on
- **First Win of the Day** — a chunky Talents bonus (the classic daily magnet; brings people back).
- **Per-match** — small Talents for a win, a tiny amount for a loss (never punish playing).
- **Win streaks** — escalating bonus (soft cap), rewards engagement without demanding it.

### 🗓 Daily Challenges ("Daily Bread" — Matthew 6:11, "give us this day…")
- **2–3 per day**, refreshing daily; can bank a few if you miss days (Snap lesson: refresh often, forgive absence).
- Thematic, teach variety: *"Win a match playing 3+ Shepherd cards," "Trigger 2 Fulfills," "Deal 10 damage with spells," "Win while below 10 HP" (the underdog bonus).*
- Reward: Talents + a Fragment trickle. **Re-roll one you dislike** (Hearthstone quest re-roll — a beloved QoL).

### 📅 Weekly / longer
- **Weekly Trials** (from docs/17) — a harder themed run for a big Talents + a Blessed Pack.
- **Milestones** — completing Saga chapters, roguelike bosses, class-mastery levels each grant one-time pack/Fragment payouts (the long tail).

### The generosity dial
Because we're free, tune the faucet **generous**: a normal daily session (first win + 2 quests) should reliably earn **~most of a pack per day**, so a casual player gets a pack every 1–2 days without spending a cent. This is the anti-Snap posture and our biggest word-of-mouth lever.

---

## 5. Crafting & duplicate protection (the certainty layer)

- **Craft** any card for Fragments by rarity (e.g. Common 40 / Rare 100 / Epic 400 / Legendary 1600 — HS-like ratios, tunable). Disenchant for ~1/4 of craft cost.
- **Duplicate protection:** you never *need* more than 2 of a card; excess auto-shatters to Fragments. Owning "3+ of a rarity complete" shifts packs to un-owned cards. This single feature is what makes a free economy feel abundant instead of a slot machine.
- **A "wishlist"**: mark cards you want; a UI nudge shows Fragments-to-next-wishlist-craft — turns grinding into goal-chasing.

---

## 6. What money *can* buy (optional, never power)
Free forever means monetization is **support, not pay-to-win**. Ethical options only, if ever:
- **Cosmetics:** foils, animated card backs, board skins, alternate hero portraits, the "Blessed" art variants.
- **A "Support the Devs" / tip** or a one-time "Patron" unlock (a cosmetic badge, a thank-you board).
- **Convenience-neutral pack bundles** are the *dangerous* line — if ever added, they must never outpace what free play grants (or we become Snap). Default stance: **cosmetics only.**
- Anthropic/Underdogs promise language: *"You can earn every card by playing. Money only buys sparkle."*

---

## 7. Multiplayer-future compatibility
The economy is built so PvP can bolt on without a redesign:
- Currencies, packs, crafting, dupe-protection are all standard PvP-ready systems.
- Only additions later: ranked rewards (more Talents), a cosmetic ladder, seasonal resets. No economy rework needed.
- Keep everything **server-authoritative-ready** (balances validated locally now, sync-able later) so a future online mode can't be cheated.

---

## 8. Numbers to hand Claude Code (starting values — all tunable)
| Thing | Starting value |
|---|---|
| Pack size | 5 cards, ≥1 Rare+ |
| Pack cost | ~100 Talents |
| Legendary pity | guaranteed by 20 packs |
| First Win of Day | ~50 Talents |
| Match win / loss | ~10 / ~2 Talents |
| Daily quests | 2–3/day, ~40–60 Talents each, +Fragment trickle |
| Craft costs | C40 / R100 / E400 / L1600 Fragments |
| Disenchant | ~1/4 of craft |
| Starter | 1 full class deck free; 2nd after tutorial |
| Generosity target | ~1 pack/day for a casual daily player, free |

## 9. Build priority
1. Currencies + earning + a basic pack open (functional).
2. **Duplicate protection + crafting** (the trust-builders — do early, they define the feel).
3. Daily Bread quests + First Win of Day (the retention loop).
4. **The high-graphics pack-opening ritual** (§3) — the dopamine set-piece; craft it here as a reference, then port (docs/14 loop).
5. Cosmetics/foils, weekly trials, milestone payouts (the long tail).

*Bottom line: packs for the thrill, Fragments for the guarantee, Daily Bread for the habit, duplicate-protection for the trust — and because it's all free, generosity itself becomes the marketing.*

---

## 10. Implementation status (v0.4.0) — what shipped, and the locked decisions

Built as `ui/src/economy.ts` (pure, DI-injected card universe, node-testable; persisted
LCG so pack rolls never touch `Math.random()`), `ui/src/Storehouse.tsx` (wallet, Daily
Bread, the full seal→fan→flip ritual with rarity back-glow), and lockdown wiring in
the Armory/forge. Tests: `engine/test/economy.test.ts`. Decisions locked in interview:

- **Full lockdown.** Ownership is real — unowned cards are dimmed in the collection and
  unusable in the forge. The Free Play class presets stay playable as *loaner* war-bands.
  Existing saves start the economy fresh (Choose Your Calling on first menu visit).
- **Ritual built through stage 4** of §9 (currencies, dupe protection + crafting, Daily
  Bread + First Win, and the pack-opening set-piece). Stage 5 (foils/weeklies/milestones)
  deferred. **The set-piece itself is the full §3 cinematic** (D-46, `ui/src/PackRitual.tsx`):
  ray from heaven → the pack falls and lands → seal-break → quake with light in the cracks →
  burst → one-by-one reveal ranked worst-to-best, back-glow rarity tease, holographic tilt
  on rare+, the legendary held-breath moment. Tunable without grinding via the **Pack Lab**
  (`?pack=1` — simulated packs, forced finishes, replay, dev Talent faucet).
- **Soft daily taper** instead of a hard cap: wins pay full rate for the first
  ~10 wins/day, then a 2-Talent trickle. Losses always pay a little.
- **Pity as implemented:** first Legendary within **10** packs, then within every **20**
  (supersedes both the "~40-pack" CLAUDE.md wording and this doc's earlier "by 20").
- **First Fruits as implemented:** the first **3** packs draw only starter-class +
  neutral cards (the "curated" §2 stretch, done via filtering rather than fixed lists).
- **Deferred:** Scroll Study, wishlist, pack *types* (Set/Blessed packs), foils,
  weekly trials, win streaks, any money features (none planned — free forever).