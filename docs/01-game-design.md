# COVENANT — Game Design Document v0.1

> ⚠️ **CANON NOTE (read `/CLAUDE.md` and `docs/06-decisions-log.md` first).** This document predates the role-class pivot. Where it says classes/factions are the six *eras*, treat those as **Tags** now; classes are the six **roles** (Prophet, Warrior, Priest, Shepherd, Patriarch, Disciple). Also updated since: Hero HP 30 (not 25), board limit 7 (not 6), decks are single-class + Neutral (not two-era). Everything else here stands.

*Working title. A digital card game for Christian nerds. Adventure-epic, never cheesy.*

---

## 1. Vision

**One-liner:** A Runeterra-quality digital card game where the heroes of Scripture fight, grow, and transform — and the game quietly teaches the real stories behind them.

**Audience:** Christian gamers ("Christian nerds") who love Hearthstone/Runeterra/MTG and are tired of Christian games that feel like off-brand VBS merch. Secondary: curious non-believers who'd never open a Bible but will absolutely grind a card game.

**Design pillars:**
1. **Epic on the board, funny in the margins.** The battlefield and art direction compete with secular TCGs dead seriously. The *writing* — flavor text, card names, quests, AI barks — has a dry, self-aware Hearthstone wit. The Bible is already full of talking donkeys, roof-holes, and prophets sulking about plants; we play the real details straight and let them be as funny as they already are. The humor is a personality layer, not a costume — it never becomes the pun-slathered "Prayer Power-Up!" cringe that sinks other Christian games.
2. **The stories teach themselves.** Discipleship happens through mechanics that mirror the actual narratives (Saul becomes Paul; Joseph goes to the pit before the palace) — not through sermon pop-ups. Humor makes the stories *stick*; you remember the card that made you laugh, then you remember its verse.
3. **Pokémon-simple, Runeterra-deep.** A 10-year-old can play in 5 minutes; a Spike can theorycraft for months.
4. **Reverence by design.** Players field only the faithful. Villains exist as opposition, never as player tools. Jesus is never a stat block.
5. **Free, forever.** No IAP, no gacha psychology. Progression is earned — including through Scripture itself.

**Session target:** 8–15 minutes (Hearthstone pace).
**Platforms:** iOS + web. Solo vs AI at launch; online PvP later.
**Timeline:** Long-burn hobby project. No deadline pressure; quality gates only.

---

## 2. Core Rules Spec

### 2.1 Objective
Reduce the enemy hero from **25 HP to 0**. Hero HP is the only win condition.

### 2.2 Resource — Provision
- Single resource. Start at 1, +1 max per turn, cap **10**. Refills every turn.
- Everything (units, spells, relics) costs Provision. No second resource in v1.
- *Naming note: "Provision" is thematic without preaching. Never rendered as coins or mana crystals — visual is a row of oil-lamp flames or bread/grain marks (art TBD).*

### 2.3 Turn structure (strictly alternating)
1. **Dawn** — untap/ready all your units, gain Provision, trigger start-of-turn effects, draw 1.
2. **Main** — play cards and attack in any order.
3. **Dusk** — end-of-turn effects, pass.

No reactive plays on the opponent's turn (no stack, no burst spells). All defense is set up in advance via keywords and stats. This is the "Pokémon simplicity" constraint and it is non-negotiable for v1.

### 2.4 Combat
- Open-attack model: any ready unit may attack any enemy unit or the enemy hero.
- **Guard** units must be attacked first.
- Units deal simultaneous damage; heroes do not strike back.
- Units cannot attack the turn they're played unless **Swift**.
- Board limit: **6 units** per side.

### 2.5 Deck rules
- **30 cards**, max **2 copies** of any card, max **1 copy** of each Legendary.
- Decks draw from up to **2 Eras** (factions) plus Neutral cards — Runeterra's two-region rule, proven for deckbuilding depth without chaos.
- Opening hand: 3 cards + mulligan (redraw any, once). Second player draws 4.
- Empty deck: take 1 fatigue damage per missed draw, escalating.

### 2.6 Randomness policy (light)
- Allowed: shuffled deck, **Foresee** (look at top X, reorder/bottom), **Discover** (choose 1 of 3) — player agency, not slot machines.
- Restricted: "random enemy" targeting only on small effects (≤2 damage).
- Banned: random card generation from outside the deck, RNG transformations, coin-flip win conditions.

---

## 3. Signature Mechanic — FULFILL (Transformation)

**This is the game's identity.** Legendary heroes enter play in their *early-story* form carrying a visible **Fulfill condition**. Meet it, and the card transforms — new art, new name, upgraded stats and ability. Runeterra champions × Pokémon evolution × the actual arc of the biblical narrative.

The player *enacts* the story to unlock the payoff. That's the discipleship engine, and it never says a preachy word.

| Early form | Fulfill condition | Fulfilled form |
|---|---|---|
| **Abram, the Called** (2 · 2/2) | Start your turn controlling 3+ other allies | **Abraham, Father of Nations** (4/4) — Arrival: summon two 1/1 Heirs |
| **Jacob** (3 · 2/4) | Survive combat against a unit with more attack | **Israel** (4/6) — your allies cost 1 less *(wrestled and prevailed)* |
| **Joseph the Dreamer** (3 · 2/3) | *If Joseph would die, exile him instead; returns 2 turns later as…* | **Joseph, Lord of Egypt** (5/5) — Arrival: draw 2 *(pit → prison → palace)* |
| **Moses, Shepherd of Midian** (3 · 2/4) | Play 3 spells | **Moses, the Deliverer** (4/6) — your spells cost 1 less |
| **Shepherd David** (1 · 2/1) | Destroy a unit with 4+ attack | **David, the King** (4/4) — your other units +1 attack |
| **Gideon** (3 · 3/2) | Win combat while you control fewer units than the enemy | **Gideon, Mighty of Valor** (5/4, Swift) — Arrival: deal 1 to all enemies |
| **Esther** (3 · 2/4) | Start your turn after your hero took damage | **Queen Esther** (3/5) — Arrival: destroy the weakest enemy unit *(for such a time as this)* |
| **Simon the Fisherman** (2 · 2/2) | Survive damage | **Peter, the Rock** (3/4, **Guard**) *(on this rock)* |
| **Saul of Tarsus** (3 · 3/2 — Arrival: your other allies −1 attack this turn) | *Automatic at the start of your next turn* | **Paul, Apostle** (3/4) — On transform: draw 2 *(letters)* |

**Design note on Saul→Paul:** every other Fulfill is earned by the player. Saul's is *automatic and unearned* — the Damascus road is grace, not works. The one place the mechanics make a theological statement, and it's made silently. Protect this.

**Elijah** doesn't transform — he *ascends*: instead of dying, he's exiled and adds the **Mantle of Elijah** relic to your hand (double portion for whoever wears it next). Different arc, different mechanic.

Rule constraints: transformation heals the unit to its new max HP, removes damage, keeps position, does not re-trigger summoning sickness. Max 3 Legendaries per deck keeps Fulfill moments special.

---

## 4. Card Types

| Type | Notes |
|---|---|
| **Hero (unit)** | Named biblical figures + generic Neutral roles (Watchman, Scribe, Shepherd). Stats: cost / attack / health. |
| **Spell** | One-shot effects. The rare/epic tier of spells are **Miracles** — bigger, splashier, era-defining (Parting of the Sea, Pentecost). Miracles are a rarity flavor, *not* a separate resource. |
| **Relic** | Persistent artifacts, two kinds: **equipped** (attach to a unit: Sword of Goliath, Mantle of Elijah) and **standing** (global: The Tabernacle, Bronze Serpent). |
| *(Set 2+)* Locations | Jericho, the Upper Room — deferred. |

### Keywords (v1 — keep it to seven)
- **Guard** — enemies must attack this unit first.
- **Swift** — can attack the turn it's played.
- **Endure** — the first damage this unit takes is prevented (Daniel, Shadrach/Meshach/Abednego).
- **Arrival:** — effect when played (battlecry).
- **Legacy:** — effect when this dies (deathrattle). *Named for what the faithful leave behind.*
- **Foresee X** — look at the top X cards; reorder or bottom them (prophets).
- **Fulfill:** — transformation condition (Legendaries only).

---

## 5. Factions — The Five Eras

Set 1 = **120 cards**: 5 eras × 20 + 20 Neutral. Each era has a distinct mechanical identity and a distinct visual language (art direction doc TBD).

### 🜃 I. BEGINNINGS — *Genesis & the Patriarchs*
**Identity:** Covenant promises = delayed, compounding payoffs. Blessings (+1/+1 growth), Heir tokens, generational value. The "ramp/value" era.
**Playstyle:** Slow start, inevitable late game. You are planting things that multiply.
**Visual:** Starfields, altars of uncut stone, tents, wells, oaks of Mamre.

### 🜁 II. DELIVERANCE — *Exodus & the Wilderness*
**Identity:** The spell era. Big Miracles, mass effects, cost manipulation, protection (Pillar of Cloud). Moses makes spells cheap; Aaron and Miriam reward casting them.
**Playstyle:** Control/combo. Survive, then one turn the sea parts.
**Visual:** Split water, fire and cloud, desert monolith scale, bronze and acacia.

### 🜂 III. KINGDOM — *Judges & Kings*
**Identity:** The warrior era. Combat statlines, equipped Relics (weapons), attack buffs, giant-slaying (punishes big enemies). Warriors do warrior things — curated, never gratuitous: stylized clash-and-light on impact, defeated units *fall* and fade, no gore, no death cries.
**Playstyle:** Aggro/midrange tempo.
**Visual:** Sling and spear, city gates, lion country, oil and crown.

### 🜄 IV. THE EXILES — *Prophets & Exile*
**Identity:** Endurance and prophecy. Endure shields, Foresee card-selection, fire-from-heaven burn, graveyard recursion (Dry Bones), out-lasting. Jonah gets shuffled back into your deck instead of dying. The "control" era.
**Playstyle:** Attrition. Survive the furnace; the fourth man is in the fire.
**Visual:** Babylon blue-and-gold, furnaces, lions, broken walls rebuilt, scrolls.

### 🜔 V. THE WAY — *Apostles & the Early Church*
**Identity:** Multiplication. Disciple tokens that swarm and grow; persecution converts into growth (Stephen's Legacy summons a Disciple — the church scatters and spreads); healing; card draw (good news travels).
**Playstyle:** Wide boards, buff finishers (Pentecost).
**Visual:** Oil lamps, upper rooms, Roman roads, fishing nets, tongues of fire.

**Neutral (20):** bridging roles — Ruth (the outsider welcomed in; buffs when allies die), Boaz, Watchman (1 · 0/2 Guard), Scribe, Physician, Musician, Craftsman. Cheap glue for every deck.

---

## 6. Set 1 Card Skeleton (v0.1 — ~70 speced, ~50 slots open)

*Format: Name (cost · atk/hp) — text. ⭐ = Legendary. Every card carries its passage reference in the footer (e.g., "1 Samuel 17") — reference only, no quotation, no commentary on the card itself.*

### BEGINNINGS (Genesis)
| Card | Text |
|---|---|
| ⭐ Abram, the Called (2 · 2/2) | Fulfill: start your turn with 3+ other allies → **Abraham** (4/4), Arrival: summon two 1/1 Heirs |
| ⭐ Jacob (3 · 2/4) | Fulfill: survive combat vs a stronger unit → **Israel** (4/6), your allies cost 1 less |
| ⭐ Joseph the Dreamer (3 · 2/3) | Would die → exiled instead; returns in 2 turns as **Joseph, Lord of Egypt** (5/5), Arrival: draw 2 |
| Sarah (2 · 1/3) | At your turn's end, if you control a Legendary, gain +1/+1 |
| Noah, Ark-Builder (4 · 2/5) | Arrival: summon two 1/1 Doves |
| Enoch (1 · 1/2) | At the start of your third turn with Enoch in play, exile him and draw 2 |
| Melchizedek (3 · 2/4) | Arrival: restore 3 HP to your hero |
| Rebekah at the Well (2 · 1/3) | Arrival: give an ally +0/+2 |
| Eliezer the Steward (2 · 2/2) | Arrival: Foresee 2 |
| Covenant of Stars (spell · 3) | Summon three 1/1 Heirs |
| Blessing of the Firstborn (spell · 2) | Give an ally +2/+2 |
| Well of Beersheba (spell · 1) | Restore 3 HP to your hero |
| Jacob's Ladder (spell · 4, Miracle) | Draw 3 |
| The Birthright (relic · 2, equip) | +1/+1; Legacy: draw a card |
| *Tokens:* Heir (1/1), Dove (1/1) | |

### DELIVERANCE (Exodus)
| Card | Text |
|---|---|
| ⭐ Moses, Shepherd of Midian (3 · 2/4) | Fulfill: play 3 spells → **Moses, the Deliverer** (4/6), your spells cost 1 less |
| Aaron (2 · 1/4) | Arrival: draw a spell from your deck |
| Miriam (2 · 2/2) | After you play a spell, give an ally +1/+0 |
| Joshua & Caleb (4 · 4/4) | Swift |
| Bezalel (3 · 2/3) | Your Relics cost 1 less |
| Jethro (2 · 1/3) | Arrival: your next card this turn costs 1 less |
| Zipporah (2 · 2/3) | — *(clean statline)* |
| Manna from Heaven (spell · 2) | Draw 2 |
| Water from the Rock (spell · 1) | Restore 4 HP to your hero |
| Pillar of Cloud (spell · 2) | Your units take 1 less damage until your next turn |
| Parting of the Sea (spell · 6, Miracle) | Destroy all enemy units with 3 or less attack |
| Ten Plagues (spell · 7, Miracle) | Deal 1 to all enemies, three times *(Legacy triggers fire between waves)* |
| Bronze Serpent (relic · 3, standing) | At the start of your turn, restore 2 HP to your hero |
| The Tabernacle (relic · 5, standing) | At your turn's end, give a random ally +1/+1 |

### KINGDOM (Judges & Kings)
| Card | Text |
|---|---|
| ⭐ Shepherd David (1 · 2/1) | Fulfill: destroy a unit with 4+ attack → **David, the King** (4/4), your other units +1 attack |
| ⭐ Gideon (3 · 3/2) | Fulfill: win combat while outnumbered → **Gideon, Mighty of Valor** (5/4, Swift), Arrival: deal 1 to all enemies |
| ⭐ Solomon (5 · 3/5) | Arrival: Discover a card (choose 1 of 3 from your deck) |
| Deborah the Judge (3 · 2/3) | Your other units have +1 attack |
| Samson (4 · 5/3) | Legacy: deal 2 damage to all enemy units |
| Jonathan (2 · 2/2) | Swift. Has +1/+1 while you control David |
| Benaiah (3 · 3/3) | Endure |
| The Three Mighty Men (5 · 4/4) | Guard. Arrival: +1/+1 for each enemy unit |
| Josiah, the Boy King (2 · 1/3) | Arrival: draw a spell from your deck |
| Sling and Stone (spell · 1) | Deal 2 to a unit. If it has 5+ attack, destroy it instead |
| Anointing Oil (spell · 2) | Give an ally +2/+2 and Swift |
| Trumpets at Jericho (spell · 5, Miracle) | Destroy the enemy unit with the highest health |
| Sword of Goliath (relic · 3, equip) | +3/+0 *(the enemy's weapon, turned)* |

### THE EXILES (Prophets & Exile)
| Card | Text |
|---|---|
| ⭐ Elijah (5 · 4/4) | Arrival: deal 3 to the strongest enemy unit. Instead of dying, Elijah is exiled and adds **Mantle of Elijah** to your hand |
| ⭐ Esther (3 · 2/4) | Fulfill: start your turn after your hero took damage → **Queen Esther** (3/5), Arrival: destroy the weakest enemy unit |
| ⭐ Daniel (2 · 2/3) | Endure. Fulfill: survive an enemy turn while damaged → **Daniel, the Beloved** (3/5, Endure), Arrival: Foresee 3 |
| Elisha (3 · 2/4) | Arrival: restore 4 HP to your hero |
| Shadrach, Meshach & Abednego (4 · 3/5) | Guard. Takes no damage from spells |
| Jeremiah (2 · 1/4) | At your turn's end, if an ally died this turn, draw a card |
| Isaiah (3 · 2/3) | Arrival: Foresee 3 |
| Ezekiel (4 · 3/4) | Arrival: return a unit from your discard to your hand |
| Nehemiah (3 · 1/5) | Guard |
| Jonah (2 · 2/3) | If Jonah would die, shuffle him into your deck instead |
| Widow of Zarephath (2 · 0/3) | At the start of your turn, restore 1 HP to your hero |
| Fire from Heaven (spell · 4) | Deal 4 damage to an enemy unit |
| Handwriting on the Wall (spell · 3) | Set an enemy unit's attack to 1 |
| Valley of Dry Bones (spell · 6, Miracle) | Return your strongest fallen unit to the field |
| Mantle of Elijah (relic token, equip) | +2/+2; Arrival: draw a card |

### THE WAY (Apostles)
| Card | Text |
|---|---|
| ⭐ Simon the Fisherman (2 · 2/2) | Fulfill: survive damage → **Peter, the Rock** (3/4, Guard) |
| ⭐ Saul of Tarsus (3 · 3/2) | Arrival: your other allies −1 attack this turn. At the start of your next turn, transforms → **Paul, Apostle** (3/4), draw 2 |
| John (2 · 1/3) | Legacy: draw a card |
| Stephen (2 · 2/2) | Legacy: summon a 1/1 Disciple |
| Barnabas (3 · 2/4) | Arrival: give an ally +2/+2 |
| Philip (2 · 2/2) | Swift. Arrival: Foresee 2 |
| Priscilla & Aquila (3 · 3/3) | Your Disciples have +1/+1 |
| Lydia (2 · 1/3) | Arrival: a card in your hand costs 1 less |
| Dorcas (1 · 0/3) | Legacy: return Dorcas to your hand *(once per game)* |
| Luke, the Physician (3 · 2/4) | Arrival: restore 3 HP to an ally |
| The Upper Room (spell · 2) | Summon two 1/1 Disciples |
| Breaking of Bread (spell · 2) | Restore 2 HP to all allies and your hero |
| Prison Doors Open (spell · 3) | Return an ally from your discard to your hand |
| Pentecost (spell · 5, Miracle) | Summon three 1/1 Disciples with Swift |
| Great Commission (spell · 6, Miracle) | Your Disciples get +2/+2 |
| *Token:* Disciple (1/1) | |

### NEUTRAL (selection)
| Card | Text |
|---|---|
| Ruth (1 · 1/1) | Gains +1/+1 whenever an allied unit dies |
| Boaz (3 · 2/4) | Guard. Has +1/+1 while you control Ruth |
| Watchman (1 · 0/2) | Guard |
| Shepherd (1 · 1/1) | — |
| Scribe (2 · 1/2) | Arrival: Foresee 1 |
| Musician (2 · 1/3) | At your turn's end, give a random ally +1/+0 |
| Craftsman (2 · 2/2) | Arrival: draw a Relic from your deck |

*Remaining ~50 slots: fill during balance passes; every era needs a clean 1-drop, a 7+ finisher, and one more Legendary.*

---

## 6.5 Voice & Flavor Bible

The tone target is **Hearthstone's dry, fourth-wall-aware wit** — ported to material that's already funnier than most fantasy settings. The rule that keeps it from going tacky:

> **Joke about the humans. Never about the holy.** You can rib Peter for sinking, Jonah for sulking, and the disciples for missing the point for the eighth time. You never wink at God, the Cross, the Spirit, or the grace moments. The faithful are *lovably human*, never contemptible.

### Where humor lives (and where it doesn't)
| Carries humor | Stays reverent |
|---|---|
| Flavor text (primary vehicle) | God, Jesus, Holy Spirit — never referenced flippantly |
| Neutral & minor-character cards | The Cross / Resurrection campaign interlude |
| Token & spell *names* | Fulfill grace beats (esp. Saul → Paul) |
| Quest / achievement names | Miracles themselves (the *reaction* to them can be funny) |
| AI opponent voice barks | Any card's actual passage reference (always clean) |

**Names stay straight.** Heroes get their real names, reverently. Humor goes in flavor text and *token/spell/quest* names — same split Hearthstone uses (the card is "Sylvanas," the joke is in the flavor line). No pun-names on the faithful. This is the single most important anti-cringe rule.

### The register — worked examples

*Genre self-awareness:*
- **Shepherd David** (1·2/1) — *"Yes, he's a 1-drop. Yes, he beats your 6-drop. That's the whole story."*
- **Goliath** (6·7/6) — *"On paper, unbeatable. Mind your head."*
- **Watchman** (1·0/2, Guard) — *"It's a living. Mostly standing."*
- **Shepherd** (1·1/1 vanilla) — *"A perfectly fine 1/1. Somebody has to be."*
- **Zipporah** (2·2/3 vanilla) — *"No text box. Married into a very eventful family. She'll be fine."*

*Real-but-absurd biblical detail, played straight:*
- **Eutychus** (1·0/2) — *"Fell asleep during a sermon and out a third-story window. Got raised. The sermon continued. Acts 20."*
- **Balaam's Donkey** (2·1/4, Guard) — *"Saw the angel before the prophet did. Nobody ever listens to the donkey."*
- **Shamgar** (2·3/1) — *"Killed 600 with an oxgoad. Gets exactly one verse. Absolute legend. Judges 3:31."*
- **Jonah** (2·2/3) — *"Furious about a plant. We'll get to that."*
- **The Four Friends** (2·1/2, Arrival: draw) — *"The door was full. They took the roof. Mark 2 respects the hustle."*
- **Methuselah** (token 0/9) — *"969 years. Doesn't do anything. Just refuses to die."*

*Lovably-human heroes:*
- **Simon the Fisherman** (2·2/2) — *"Ready to walk on water. Also ready to immediately need rescuing. Both true."*
- **Martha** (2·1/4) — *"Somebody has to do the dishes while everyone has their moment."*
- **Thomas** (2·2/2, Foresee) — *"He'll believe it when he sees it. To be fair, he did."*

*Spells & tokens (name is the joke):*
- **Upper Room** (spell) — *"Room for everyone. BYO fish."*
- **Heir** / **Dove** / **Disciple** — tokens stay clean; the parent card carries any wit.
- Relic **Sword of Goliath** — *"Nine feet of enemy craftsmanship, now yours. Warranty void."*

*Quests & achievements:*
- *"For Such a Time As This"* — complete 3 Fulfills.
- *"Wrestled and Prevailed"* — transform Jacob into Israel.
- *"Read the Room"* — win a game holding Upper Room.
- *"Big Fish Energy"* — return Jonah to your deck 3 times in one game.

*AI Adversary barks (personality, light menace, never blasphemy):*
- Goliath, entering: *"Send me your best."* — on death: *"…oh, come ON."*
- Pharaoh, on your big turn: *"I'll let them go. Later. Probably."*
- Serpent: *"Did He really say that?"* *(the one villain line that lands with a chill, not a laugh — used sparingly)*

### Writing rules for flavor text
1. One or two lines, max. If it needs a third line it's a sermon, cut it.
2. Punch up or sideways (genre, tropes, the character's own foibles) — never down at Scripture.
3. When in doubt, just cite the weird real detail deadpan. The text does the work.
4. Every flavor line still ends with the clean passage ref. The joke and the source coexist; that's the whole trick.

---

## 7. The Adversary System (villains) & Campaign

**Players never own villain cards.** Pharaoh, Goliath, Jezebel, Haman, Herod, Rome — these exist only as **Adversary decks** the AI pilots in campaign and skirmish. They're mechanically real (Goliath is a 6 · 7/6 the AI drops on curve, and your Shepherd David answer is *the* moment of the tutorial) but never collectible. Opposition, not identity.

**Campaign = the gospel arc, told by playing through it.** Solo chapters walk the storyline:

1. **East of Eden** — tutorial vs the Serpent's brood; establishes what's broken.
2. **Out of Egypt** — Deliverance era vs Pharaoh's host.
3. **Giants in the Land** — Kingdom era vs the Philistines; Goliath boss fight, David's Fulfill scripted to land.
4. **By the Rivers of Babylon** — Exiles era vs Babylon; the furnace fight where your units burn unless Shadrach/Meshach/Abednego hold the line.
5. **The Silent Years → The Hinge** — non-combat interlude. The Cross and the empty tomb are told, not fought: no boss battle against Rome for the tomb, no stat-block Savior, no player action "wins" it. It is received. This is where the actual gospel is presented, in-fiction, reverently, once — and it's the emotional climax of the campaign precisely because the game *stops being a game* for two minutes.
6. **The Way Forward** — The Way era vs persecution; Saul appears as an *enemy* mini-boss in one mission, then joins your collection transformed. The player literally receives their former enemy as their new Legendary. That's the whole message, delivered by a rewards screen.

**Jesus policy (design law):**
- Never a collectible card, never a stat block, never targetable, never spent.
- Present in campaign narrative and referenced by prophecy/miracle framing.
- Principle, written on the wall of the design doc: *the game points to Him; He is not a resource the player deploys.*
- Any future exception (e.g., a narrative-only card back or campaign vignette) requires a dedicated review pass, not a patch note.

**Combat presentation guardrails:** stylized light-clash impacts, units fall and fade to light/dust, no blood, no gore, no death screams. Named faithful heroes "fall," they are never mocked or desecrated by enemy VFX.

---

## 8. Economy & Progression

**Free. No IAP, no ads, no gacha psychology.** (Revisit only if hosting costs demand it, and never with loot mechanics.)

- **Currency: Talents.** Earned by wins, daily quests, campaign chapters, and achievements. Spent on packs.
- **Packs:** 5 cards. Duplicate protection until your playset (2×, 1× Legendary) is complete; surplus auto-converts to Talents. Legendary pity timer (guaranteed within N packs).
- **Starter:** one preconstructed 30-card deck (Kingdom/Neutral core). Campaign chapters award era starter cores so every player reaches viable deckbuilding across all five eras without grinding.
- **Scroll Study (the big idea):** every card links to its actual passage. Optional daily loop: read the passage in-app (clean text, no commentary), answer 2–3 comprehension questions, earn bonus Talents. Caps per day so it's a bonus, not a Bible-as-slot-machine. Framing matters: it's presented as *lore* — "read the source material" — which is exactly what Runeterra players do voluntarily on the wiki, except our lore is Scripture. Never gates content; only accelerates it.
- Achievements tied to Fulfill moments ("Wrestled and Prevailed: transform Jacob") drive players back to the stories.

---

## 9. Technical Architecture

- **Rules engine:** pure TypeScript, zero UI dependencies, fully deterministic given a seed. Every card is data (JSON) + effect functions from a small verb library (damage, heal, summon, draw, buff, transform, exile, foresee). Enables: headless AI-vs-AI balance simulation, unit tests per card, future server-authoritative PvP without a rewrite.
- **UI:** React (DOM/CSS, not canvas — card games are UI, and DOM gives free accessibility, text rendering, and animation). Wrapped with **Capacitor** for iOS — same pipeline shape as Super Dude.
- **AI opponent:** heuristic v1 (curve-out + trade evaluation like the prototype), upgrade to 1-ply lookahead scoring later. Deterministic engine makes this cheap.
- **Content pipeline:** cards live in `cards.json` with schema validation; Claude Code-friendly (CLAUDE.md defines the effect-verb library and balance rails: stat budget ≈ cost×2+1 split across atk/hp/text).
- **Art pipeline:** Nano Banana character-sheet per hero (front, 3/4, action pose) for consistency → Scenario batch for card frames/variants. Art slots: portrait 4:3 for card, full splash for Fulfill transformation moments.

## 10. Roadmap

| Phase | Deliverable |
|---|---|
| **v0.2 — Engine slice** | TS rules engine + Fulfill mechanic; Kingdom vs Philistine-AI matchup, 30 cards; ugly UI is fine |
| **v0.3 — Feel** | Full combat presentation pass (guardrails above), transformation moment VFX, sound direction |
| **Alpha** | All 5 eras (120 cards), deckbuilder, collection, Talents + packs + Scroll Study loop, web build |
| **Beta** | Campaign chapters 1–6, iOS via Capacitor, balance sim harness |
| **Later** | Online PvP, Set 2 (Locations, Wisdom-literature era?), spectate/streamer tools |

## 11. Open Questions (parked)
- Real name. COVENANT is strong but common; alternatives to test: *TESTAMENT, CANON, EBENEZER, SELAH, THE SCROLL WARS (no)*.
- Art direction: illuminated-manuscript-meets-modern (prototype) vs painted epic realism — needs a style-frame bake-off before any batch production.
- Deck size 30 locked? (40 if games run too samey in playtest.)
- Scroll Study translation licensing (ESV/CSB require permission; WEB/KJV are free — decide before building the reader).
- Whether Fulfilled Legendaries should have alternate-art splash unlocks as achievement rewards (probably yes, free hype).
