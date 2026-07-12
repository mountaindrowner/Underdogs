# 18 — Legendary Expansion: 30 New Legendaries ("Cloud of Witnesses" set)

*Design-only spec per the Claude Code brief. Distribution: Priest 5 · Prophet 5 · Patriarch 5 · Warrior 4 · Shepherd 3 · Disciple 3 · Neutral 5. **15 of 30 use Fulfill** (both halves designed). All verbs/targets/triggers from the closed vocabulary; anything new is in the "New Capabilities Requested" list at the end. Rail: attack+health ≈ (cost×2)+1; text ≈ −1/point. Priority: lift PRIEST / PROPHET / PATRIARCH; flavor-not-power for WARRIOR / SHEPHERD.*

Format per card: stats · text · [Fulfill] · verbs · RAIL · archetype/fairness · LAW · flavor · art.

---

## ✚ PRIEST (5) — proactive protect/heal/raise tools a human can pilot

**1. Joshua, the High Priest** — Priest · Exile · minion · 3c · **2/4 · Endure**
Fulfill: `survive_damage` → **Joshua, Clothed in White** — 3c · **4/6 · Endure**; *Your other units have +0/+1.*
Verbs: auraBuff(+0/+1, allAllies, scope other). Triggers: aura.
RAIL: early = 6 body +1 Endure vs budget 7 → under (pay-now-for-upside ✓). Fulfilled deliberately over.
Archetype: earned protector-wall. Fair: must take a hit in a class that hates taking hits; until then a modest 3-drop.
LAW ✓ faithful; joke lands on the prosecution, not the Judge; ref clean.
Flavor: *"The prosecution had a whole case prepared. Then came the wardrobe change. — Zechariah 3."*
Art: a priest in soiled robes standing in a court of light as clean garments descend · defiant hope.

**2. Jehoiada, the Kingmaker** — Priest · Kingdom · minion · 4c · **2/5**
*Arrival: give an ally Guard and Endure.* ("Hide the heir.")
Verbs: giveKeyword(guard), giveKeyword(endure), target ally. RAIL: 7 body +2 text = 9 vs 9 ✓.
Archetype: protect-the-payoff enabler. Fair: zero board swing on play; needs a unit worth guarding.
LAW ✓. Flavor: *"Hid the rightful king in the temple for six years. Patience is a weapon. — 2 Kings 11."*
Art: an old priest drawing a curtain over a small crowned child, temple shadows.

**3. Bezalel, Spirit-Gifted** — Priest · Exodus · minion · 5c · **3/5**
*Arrival: draw 2 Relics from your deck. Your Relics cost (1) less.*
Verbs: drawType(relic ×2), costReduce(filter: relic). RAIL: 8 + ~2 draw + ~1 aura = 11 vs 11 ✓.
Archetype: engine/tutor for Priest's standing-relic package (Bronze Serpent, Tabernacle). Fair: needs a relic deck; value, not tempo; deck-only (light-RNG ✓).
LAW ✓ (deadpan real detail, no joke on the Spirit). Flavor: *"The first person Scripture calls 'filled with the Spirit of God.' His ministry: craftsmanship. — Exodus 31."*
Art: an artisan at a workbench, tabernacle fittings glowing softly, wood shavings like gold.

**4. Hezekiah, the Sick King** — Priest · Kingdom · minion · 4c · **3/5 · Guard**
Fulfill: `hero_damaged` → **Hezekiah, Granted Fifteen Years** — 4c · **4/7 · Guard**; *At the start of your turn, restore 2 to your hero.*
Verbs: startOfTurn healHero(2). RAIL: early 8+1 = 9 vs 9 ✓ (on-curve; the transform is the payoff). Fulfilled over by design.
Archetype: the sustain engine Priest lacks. Fair: trigger requires your hero already hurt; no offensive pressure.
LAW ✓ (jokes his politics, not the healing). Flavor: *"Told to set his house in order. Filed an appeal instead. — 2 Kings 20."* Fulfilled: *"Got fifteen more years and immediately showed Babylon the treasury. — 2 Kings 20."*
Art: a king turned to the wall in prayer, dawn entering the chamber.

**5. Nehemiah, Rebuilder of the Walls** — Priest · Exile · minion · 7c · **4/6**
*Arrival: Raise two fallen allies; give them Guard.*
Verbs: returnFromDiscard(×2, toField), giveKeyword(guard). RAIL: 10 + ~4 double-raise + ~1 grant = 15 vs 15 ✓ (scales with graveyard = build-around).
Archetype: the resurrection-engine finisher (the "N'Zoth slot"). Fair: does nothing early; needs deaths first; returns defenders, not attackers. The greedy tempo AI can't pilot it — a human can.
LAW ✓ (Raise = the game's existing revive keyword; no resurrection-of-Christ reference). Flavor: *"Surveyed the ruins at night, said 'let us rise and build,' and half the city grabbed trowels. — Nehemiah 2."*
Art: a governor on a night ride among broken walls, torch aloft.

## 🕮 PROPHET (5) — reach, ramp, and spell engines for the 40% class

**6. Miriam, Sister at the Riverbank** — Prophet · Exodus · minion · 2c · **1/3**
*Arrival: Foresee 2.* Fulfill: `cast_spells(2)` → **Miriam, Prophetess of the Song** — 2c · **3/4**; *At the end of your turn, restore 1 to all allies.*
Verbs: foresee(2); endOfTurn healUnit(1, allAllies). RAIL: early 4 + ~1 = 5 vs 5, under-power for a legendary ✓.
Archetype: cheap Fulfill engine rewarding the spell class for casting. Fair: payoff is sustain, not tempo.
LAW ✓. Flavor: *"Posted lookout over a floating basket. Best babysitting in recorded history. — Exodus 2."* Fulfilled: *"Grabbed a tambourine and led the first singalong. — Exodus 15."*
Art: a girl half-hidden in reeds watching a basket drift, dawn teal.

**7. John the Baptist** — Prophet · Apostles · minion · 4c · **3/4**
*Arrival: Foresee 3. The next unit you play costs (2) less.* ("Prepare the way.")
Verbs: foresee(3), discountHand(amount 2, count 1). RAIL: 7 + 1 + 1.5 = 9.5 vs 9 → +0.5, justified: discount requires the follow-up in hand (sequencing tax).
Archetype: herald/ramp bridge to Prophet's expensive turns. Fair: no immediate board impact.
LAW ✓ — the card depicts John in the wilderness only; the One he heralds is never shown or named on-card.
Flavor: *"Camel hair. Locusts. Wild honey. Zero indoor voice. — Matthew 3."*
Art: a wild-haired preacher mid-proclamation at the Jordan's edge, crowds on the far bank.

**8. Huldah the Prophetess** — Prophet · Kingdom · minion · 5c · **3/5**
*Arrival: Discover a spell from your deck; it costs (2) less.*
Verbs: discoverFromDeck(spell), discountHand. RAIL: 8 + 1.5 + 1 = 10.5 vs 11 ✓.
Archetype: Discover/value engine; enables the big spell turn. Fair: deck-only, tempo-neutral on play.
LAW ✓. Flavor: *"Five officials, including the high priest, went to ask her if the scroll was real. It was. — 2 Kings 22."*
Art: a seated scholar-prophetess authenticating a scroll before anxious officials, lamplight.

**9. Habakkuk, on the Watchtower** — Prophet · Exile · minion · 2c · **1/3**
*At the end of your turn, Foresee 1.* Fulfill: `cast_spells(3)` → **Habakkuk, the Answered** — 2c · **3/5**; *Your spells cost (1) less.*
Verbs: endOfTurn foresee(1); costReduce(spell). RAIL: early 4+1 = 5 vs 5 ✓. Fulfilled = the earned class engine.
Archetype: the spell-cost lord, gated behind patience. Fair: a 1/3 that does nothing aggressive; must live through 3 casts.
LAW ✓. Flavor: *"Climbed the tower, filed his complaint, and waited for the reply. — Habakkuk 2."* Fulfilled: *"'The righteous shall live by faith.' Worth the wait. — Habakkuk 2."*
Art: a cloaked prophet atop a night watchtower, city below, stars.

**10. Joel, Herald of the Day** ⚠FACE — Prophet · Exile · minion · 6c · **4/5**
*Arrival: deal 3 to the enemy hero and restore 3 to your hero.* ("I will restore the years the locust has eaten.")
Verbs: deal(3, **enemyHero** — NEW capability), healHero(3). RAIL: 9 + 2.5 + 1 = 12.5 vs 13 ✓.
Archetype: the burst-reach closer Prophet lacks. Fair: one-shot, modest body, 6c — no repeatable burn.
LAW ✓. Flavor: *"The locusts took everything. He promised it back with interest. — Joel 2."*
Art: a prophet at dawn over a stripped field turning green at the edges.

## ⭑ PATRIARCH (5) — payoffs that reward the slow build

**11. Judah, the Pledge** — Patriarch · Genesis · minion · 3c · **2/4 · Guard**
Fulfill: `survive_damage` → **Judah, the Lion's Line** — 3c · **4/6 · Guard**; *Covenant: give your other units +1/+0.*
Verbs: covenant buff(+1/+0, allAllies other). RAIL: early 6+1 = 7 vs 7 ✓.
Archetype: taunt that grows into a tribal-lord engine. Fair: must tank a hit first; plain guard until then.
LAW ✓ — card is about Judah and the tribal line (Gen 49 blessing); art uses a lion *banner*, never a lion-as-Christ figure.
Flavor: *"'Let me remain as your slave in place of the boy.' Growth arc of the millennium. — Genesis 44."* Fulfilled: *"The scepter shall not depart. — Genesis 49."*
Art: a rough brother stepping in front of the youngest, palace hall, guarded stance.

**12. Leah, the Unloved** — Patriarch · Genesis · minion · 2c · **1/3**
*Legacy: summon a 1/1 Heir.* Fulfill: `control_allies(3)` → **Leah, Mother of Kings** — 2c · **2/4**; *Covenant: summon a 1/1 Heir.*
Verbs: legacy summon(heir); covenant summon(heir). RAIL: early 4+1 = 5 vs 5 ✓.
Archetype: the token engine the Covenant/wide decks want. Fair: engine not tempo; fulfilled needs an existing board.
LAW ✓. Flavor: *"The other sister got the poem. She got the dynasty. — Genesis 29."* Fulfilled: *"Judah and Levi were hers: the crown and the priesthood. — Genesis 35."*
Art: a veiled woman with steady eyes, small sons at her skirts, tent dawn.

**13. Rebekah, at the Well** — Patriarch · Genesis · minion · 3c · **2/4**
*Arrival: Discover a unit from your deck.*
Verbs: discoverFromDeck(unit). RAIL: 6 + 1.5 = 7.5 vs 7 → +0.5, fine for deck-only consistency.
Archetype: tutor/consistency for a synergy class. Fair: tempo-neutral, deck-only.
LAW ✓. Flavor: *"Watered ten camels voluntarily — roughly 250 gallons — then said yes to everything. — Genesis 24."*
Art: a young woman hauling a jar at a stone well, camels kneeling in a queue, dusk gold.

**14. Seth, the Appointed** — Patriarch · Genesis · minion · 1c · **1/2**
*Covenant: gain +1/+1.*
Verbs: covenant buff(self). RAIL: 3 + ~1 = 4 vs 3 → +1, justified: dies to any ping; scales only with time; the classic telegraphed must-answer 1-drop.
Archetype: 1-cost snowball build-around. Fair: fragile and slow; strongest in the ramp class the AI plays worst.
LAW ✓ (reference, no joke on the LORD). Flavor: *"Third son. And then people began to call on the name of the LORD. Slow starts count. — Genesis 4."*
Art: a young man tending a small first altar at the edge of Eden's wilds, big sky.

**15. Ephraim & Manasseh, the Crossed Blessing** — Patriarch · Genesis · minion · 7c · **5/5**
*Arrival: give your other units +2/+2.*
Verbs: buff(+2/+2, allAllies other). RAIL: 10 + ~4 (board-scaled) ≈ 14–15 vs 15 ✓.
Archetype: the go-wide ramp finisher Patriarch's 43% needs. Fair: dead without a board; 7c.
LAW ✓. Flavor: *"Jacob crossed his hands on purpose. Joseph objected. Jacob had been the younger brother too. — Genesis 48."*
Art: an old patriarch's crossed hands on two boys' heads, Joseph protesting mid-frame.

## ⚔ WARRIOR (4) — flavor and variance, zero net power

**16. Gideon, Threshing in Secret** — Warrior · Judges · minion · 3c · **1/4**
(no text — he's hiding) Fulfill: `outnumbered_win` → **Gideon, Mighty Man of Valor** — 3c · **4/5**; *Your units have +1 attack while the enemy has more units than you.*
Verbs: auraBuff(+1/+0, allAllies, condition: outnumbered). RAIL: early 5 vs 7 = 2 under (the price of the story ✓).
Archetype: underdog-aura build-around — the aura **turns off when you're winning**, which is why it can't raise Warrior's 74%.
LAW ✓ (angel reference clean). Flavor: *"Threshing wheat in a winepress, which is not where wheat goes. The angel called him a mighty warrior anyway. — Judges 6."* Fulfilled: *"Three hundred men, torches, jars, and a lot of shouting. — Judges 7."*
Art: a nervous farmer threshing grain in a sunken winepress, glancing over his shoulder.

**17. Barak, the Reluctant** — Warrior · Judges · minion · 4c · **5/5**
*Can't attack while it's your only unit.* Fulfill: `control_allies(2)` → **Barak, Lightning of Kedesh** — 4c · **5/5 · Swift**.
RAIL: body 10 vs 9, −1 for a real downside = 9 ✓. Fulfilled adds Swift (his name means lightning — real detail, not a pun).
Archetype: statline-with-a-catch; mechanically *is* Judges 4. Fair: the downside is live vs a board-clearing AI; the fulfill merely removes the babysitting clause.
LAW ✓ (ribs Barak, honors Deborah). Flavor: *"'If you go with me, I will go.' The prophetess went. The credit, famously, did not. — Judges 4."*
Art: a general checking over his shoulder for Deborah before charging, storm over Tabor.

**18. Jael, of the Tent** ⚠target — Warrior · Judges · minion · 3c · **2/3**
*Arrival: destroy a damaged enemy unit.*
Verbs: destroy(target: **damagedEnemy** — new selector, trivial). RAIL: 5 + 2.5 conditional removal = 7.5 vs 7 ✓.
Archetype: removal-with-setup (the Execute slot). Fair: needs prior damage — combo, not standalone tempo.
LAW ✓ (Judges 5 itself blesses her; wit stays dry, VFX reverent). Flavor: *"Milk, a rug, and the most decisive use of camping equipment in Scripture. — Judges 5."*
Art: a woman at a tent door offering a bowl of milk, mallet just visible at her belt.

**19. Caleb, of Another Spirit** — Warrior · Exodus · minion · 5c · **3/5 · Endure**
Fulfill: `hero_damaged` → **Caleb, Give Me This Mountain** — 5c · **5/7**; *Giant-Slayer.*
RAIL: early 8+1 = 9 vs 11 = 2 under ✓. Fulfilled: the payoff body + the class keyword.
Archetype: late-bloomer beatstick; teaches the 85-year-old who asked for the hill with giants on it. Fair: needs your hero hurt — which aggressive Warrior actively avoids; anti-synergy with the class's winning gameplan (deliberate).
LAW ✓. Flavor: *"Forty years of walking in circles. Attitude: intact. — Numbers 14."* Fulfilled: *"Eighty-five years old. Requested the mountain with the giants on it. On purpose. — Joshua 14."*
Art: a silver-bearded warrior pointing up at a fortified hill, grinning.

## 🐑 SHEPHERD (3) — cool, fair, no curve-push

**20. Jesse of Bethlehem** — Shepherd · Kingdom · minion · 3c · **2/3**
*Arrival: summon a 1/1 Sheep.* Fulfill: `control_allies(3)` → **Jesse, Father of the Anointed** — 3c · **3/5**; *At the start of your turn, summon a 1/1 Sheep.*
Verbs: summon(sheep); startOfTurn summon(sheep). RAIL: early 5+1 = 6 vs 7, under ✓.
Archetype: tribal token engine. Fair: value engine the tempo AI ignores; no burst.
LAW ✓. Flavor: *"Eight sons. Seven had great résumés. — 1 Samuel 16."* Fulfilled: *"Bethlehem's whole thing started here. Ask Ruth. — Ruth 4."*
Art: a sturdy farmer counting sons filing past a gate, one conspicuously missing.

**21. Mephibosheth, at the Table** — Shepherd · Kingdom · minion · 3c · **1/5**
*While you control a David, this has +2/+0 and Guard.* ("A seat at the king's table.")
Verbs: auraBuff(self, condition: control_david — Jonathan precedent), grantKeyword(guard). RAIL: 6 + ~1 conditional = 7 vs 7 ✓.
Archetype: kindness-of-David synergy piece; redemption theology as mechanics. Fair: dead text without a David; enabled it's a fair 3/5 Guard.
LAW ✓. Flavor: *"Lame in both feet, summoned to the palace, expecting the worst. Got a permanent dinner invitation. — 2 Samuel 9."*
Art: a man with a crutch seated at a royal table, dumbfounded, warm hall.

**22. Nathan's Ewe Lamb** — Shepherd · Kingdom · minion · 1c · **1/1**
*Legacy: give your units +1/+0.*
Verbs: legacy buff(allAllies). RAIL: 2 + 1.5 = 3.5 vs 3 ✓ for a legendary 1-drop (opponent picks the timing).
Archetype: sacrifice-for-value; teaches the parable that convicted a king. Fair: tiny, telegraphed.
LAW ✓ (parable figures are fair game; the "you monster" lands on the rich man of the parable). Flavor: *"It ate from his plate and slept in his arms. You monster. — 2 Samuel 12."*
Art: a small lamb curled by a poor man's fire, one bowl, one cup.

## 🔥 DISCIPLE (3) — healthy class, light touch

**23. Mary of Magdala** — Disciple · Apostles · minion · 2c · **1/3 · Endure**
Fulfill: `survive_damage` → **Mary, the Devoted** — 2c · **3/4**; *At the end of your turn, give another random friendly Disciple +1/+1.* ("She provided for them out of her own means.")
Verbs: endOfTurn buff(randomAlly, tribe: disciple). RAIL: early 4+1 = 5 vs 5 ✓.
Archetype: swarm-support engine. Fair: buffs tokens one at a time; needs the tribe.
LAW ✓ — the arc used is **Luke 8** (deliverance → devoted patron), deliberately *not* Easter morning; no resurrection reference on-card.
Flavor: *"Seven demons. Then none. She never went home. — Luke 8."* Fulfilled: *"Bankrolled the whole mission out of her own purse. — Luke 8."*
Art: a resolute woman with a coin purse among the traveling company, dawn road.

**24. James & John, Sons of Thunder** — Disciple · Apostles · minion · 4c · **3/3 · Swift**
*Scatter: summon two 1/1 Disciples.* (parameterized Scatter — Stephen precedent ✓)
RAIL: 6 + 1 Swift + 2 double-scatter = 9 vs 9 ✓.
Archetype: aggressive swarm legendary. Fair: fragile; death-value is just tokens.
LAW ✓ (the joke is the denied request — ribs them, not the Lord's answer). Flavor: *"Asked permission to call down fire on a village. Request denied. Nickname approved. — Luke 9."*
Art: two storm-faced fishermen brothers mid-argument, clouds boiling behind them.

**25. John Mark, the Deserter** — Disciple · Apostles · minion · 2c · **1/3**
*The first time this would die, return it to your hand instead.* (he ran)
Fulfill: `survive_damage` → **Mark, Useful for Ministry** — 2c · **3/4**; *Legacy: draw 2 cards.* (he wrote a Gospel)
Verbs: onDeath(replaceDeath, returnToHand — Lost Sheep precedent); legacy draw(2). RAIL: early 4+1 = 5 vs 5 ✓.
Archetype: the redemption-arc card, literally. Fair: early form flees (tempo loss); must take a hit and live to grow up.
LAW ✓. Flavor: *"Left the mission trip early. Paul kept receipts. — Acts 13."* Fulfilled: *"'Get Mark. He is useful to me.' Redemption arcs make the best résumés. — 2 Timothy 4."*
Art: a young man speed-walking away from a docked ship, sandals in hand.

## ◆ NEUTRAL (5)

**26. Esther, in the Palace** — Neutral · Exile · minion · 3c · **2/4**
*Arrival: Foresee 1.* (Mordecai's intel) Fulfill: `hero_damaged` → **Queen Esther, For Such a Time** — 3c · **4/6 · Guard**; *Legacy: give your units +2/+2.* (Purim)
RAIL: early 6 + .5 = 6.5 vs 7, under ✓.
Archetype: crisis-answer legendary; pairs narratively with Mordecai (same trigger — the same edict transforms them both).
Fair: modest until your hero is hurt.
LAW ✓. Flavor: *"New name, new address, old secret. — Esther 2."* Fulfilled: *"'If I perish, I perish.' Spoiler: she didn't. — Esther 4."*
Art: a queen at the throne-room threshold, scepter extending toward her, breath held.

**27. Mordecai, at the King's Gate** — Neutral · Exile · minion · 3c · **2/4 · Guard**
Fulfill: `hero_damaged` → **Mordecai the Great** — 3c · **4/5 · Guard**; *Your other units have +1/+0.*
RAIL: early 6+1 = 7 vs 7 ✓.
Archetype: guard that becomes a lord; the Esther twin. Fair: vanilla guard until the crisis.
LAW ✓ (fulfilled flavor ribs Haman, a villain). Flavor: *"Refused to bow. Sat at the gate. Overheard everything. — Esther 3."* Fulfilled: *"Second to the king — wearing the robe Haman ordered for himself. — Esther 10."*
Art: a bearded man seated immovably at a palace gate as officials sweep past.

**28. Rahab, of the Scarlet Cord** — Neutral · Exodus · minion · 2c · **2/2 · Endure**
Fulfill: `survive_damage` → **Rahab, Grafted In** — 2c · **3/4 · Endure**; *Legacy: draw a card.* (check the genealogy)
RAIL: early 4+1 = 5 vs 5 ✓.
Archetype: cheap resilient Fulfill for any deck. Fair: must survive the hit — her house standing while the walls fall, as mechanics.
LAW ✓ (Hebrews 11 hero). Flavor: *"Wrong address, right window. — Joshua 2."* Fulfilled: *"Innkeeper of Jericho; great-great-grandmother of David. Check the genealogy. — Matthew 1."*
Art: a woman tying a scarlet cord at a window in a city wall, dust of a marching army below.

**29. The Shunammite Woman** ⚠filter — Neutral · Kingdom · minion · 3c · **2/4**
*Your Prophet cards cost (1) less.* ("She built the prophet a room.")
Verbs: costReduce(filter: class=Prophet — config extension). RAIL: 6 + 2 = 8 vs 7 → +1, justified: dead text in five of six classes; exists precisely to lift Prophet from the neutral pool.
Archetype: class-enabler from neutral (the fix-the-meta slot). Fair: deckbuilding-conditional.
LAW ✓. Flavor: *"Built the prophet a rooftop room: bed, table, chair, lamp. Five-star hospitality, ninth century BC. — 2 Kings 4."*
Art: a well-to-do woman showing a furnished rooftop room, pride and welcome.

**30. Cornelius the Centurion** — Neutral · Apostles · minion · 4c · **3/4**
*Arrival: restore 3 to your hero and draw a card.*
Verbs: healHero(3), draw(1). RAIL: 7 + 1 + 1.5 = 9.5 vs 9 ✓.
Archetype: fair midrange sustain+value for any deck (a small Priest-flavored neutral). Fair: on-rail, no swing.
LAW ✓ (the angel reference is the literal Acts 10 scene). Flavor: *"A Roman officer so generous even the angels took notes. — Acts 10."*
Art: a centurion distributing bread at his door, soldiers queueing awkwardly behind.

---

# DESIGN MEMO

**Class plan.**
- **Priest (27% → up):** proactive tools a *human* pilots — Jehoiada makes protection a tempo play; Hezekiah is the sustain engine; Bezalel turns the existing standing-relic package into a real archetype; Nehemiah is the marquee late-game the class utterly lacks. None of it is stats — it's plans. (Per the brief: we're fixing playability, not chasing the AI's 27%, which is partly an AI artifact.)
- **Prophet (40% → up):** JtB bridges tempo into big turns; Huldah/Habakkuk make the spell plan consistent and cheap; **Joel gives the class its first reach/closer** (the flagged face-damage card). Miriam adds a cheap Fulfill engine.
- **Patriarch (43% → up):** the ramp deck finally gets payoffs — Leah and Jesse-style token engines, Seth's snowball, Rebekah's consistency, and Ephraim & Manasseh as the go-wide finisher.
- **Warrior (74%, hold):** all four are variance/flavor — Gideon's aura *turns off when you're ahead*, Barak has a real downside, Jael needs setup, Caleb anti-synergizes with the class's aggressive plan (wants your hero damaged). Cool, not stronger.
- **Shepherd (60%, hold):** engines and synergy pieces (Jesse, Mephibosheth), plus a 1-drop parable. No curve push.
- **Disciple (54%):** light touch — one swarm engine, one aggressive duo, one redemption arc.
- **Neutral:** Esther/Mordecai as paired crisis legendaries, Rahab as the everyone-deck Fulfill, the Shunammite deliberately lifting Prophet from the neutral slot, Cornelius as fair sustain.

**Fulfill count: 15/30**, all earned (conditions from the approved list only; no new auto-transforms — Saul→Paul remains the sole grace card). Cost curve: 1c×2 · 2c×6 · 3c×10 · 4c×6 · 5c×3 · 6c×1 · 7c×2 (3-slot is dense by design — legendaries as early build-around anchors, per "conditional, not big").

**Free-deck promise check:** every card here is conditional, engine, or under-statted with an earn-gate. Nothing is a fair-cost stat pile; an all-legendary deck built from this set is a pile of unassembled engines — exactly what a curve-out starter deck beats.

# NEW CAPABILITIES REQUESTED (human sign-off)
1. **Hero-targeting for spells/Arrivals ("face")** — needed by **Joel (#10)** only. Already planned to land with this set per the brief.
2. **`damagedEnemy` target selector** — needed by **Jael (#18)**. Trivial: mirror of existing `damagedAlly`.
3. **`costReduce` class filter** — needed by **The Shunammite Woman (#29)**. Config-level extension of existing cost-aura filters (tag filters already exist).
4. **`control_esther` condition value** — optional nicety if we ever want Esther/Mordecai cross-synergy; **not used** in the current specs (kept to the existing `control_david` precedent only). Listed for awareness, no work required.

Everything else reuses the closed vocabulary verbatim.
