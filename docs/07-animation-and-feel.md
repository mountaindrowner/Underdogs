# 07 — Animation & Game Feel

*The board must feel alive — Hearthstone-grade juice. This is a first-class requirement, not polish to defer. Reverent at the sacred core, punchy everywhere else: juice the combat, hush the holy.*

## Tech approach
- CSS transforms + keyframes for most motion; a tween layer (**Framer Motion** for React, or **GSAP**) for orchestrated sequences.
- Lightweight particles/impact via CSS or a tiny canvas overlay — avoid heavy engines.
- Target 60fps on a mid-range phone. Always honor `prefers-reduced-motion` (swap to instant states).
- Keep animations interruptible and driven by engine events, so they never block input longer than needed.

## Required animation vocabulary

**Cards & hand**
- Hover/select: card lifts and enlarges (the prototype does this).
- Play: card lifts from hand, arcs to the board slot, settles with a soft landing squash; Provision crystals drain to match cost.
- Draw: card slides from the deck pile into the hand with a slight fan reflow.

**Combat**
- Attack: attacker lifts and **lunges** into its target along a real vector; **impact flash** at contact.
- **Targeting arrow:** while a unit is selected (or a targeted spell/Hero Power is held), draw a curved arrow from source to cursor/target — the signature Hearthstone read.
- Damage: **floating damage numbers**; brief **screen-shake** scaled to damage (tiny for 1–2, meatier for big hits); hit unit flashes red.
- Death: unit **falls and fades to light/dust** — never blood or gore (Law 4).

**Keyword beats (each needs a legible signature)**
- **Fulfill:** gold radial burst + the card visibly morphs name/art/stats. The set's hero moment — make it feel earned.
- **Scatter:** the dying unit sprays outward into new Disciple tokens.
- **Redeem:** a fallen small unit re-forms in place, or a Sheep pops in with a bounce.
- **Endure:** a shield shimmer around the unit that **shatters** on the hit it blocks.
- **Guard:** a steady ward-glow so the player reads "attack me first."
- **Foresee / Discover:** cards fan up for inspection with a soft light.

**Hero Power & Miracles**
- A weightier, distinct flourish. Holy effects = light from above / radiance / fire — **never a depicted face or figure of God** (Laws 1 & 4).

**Flow**
- Turn transitions: clean "Your Turn / Adversary's Turn" banners.
- Victory/Defeat: dignified banners, not slapstick.
- **Campaign sacred interlude:** deliberately quiet and un-gamified — no combat juice, no score. It is received, not won (Law 5).

## Feel checklist (definition of done for the animation pass)
- [ ] Every attack has vector-lunge + impact + damage float.
- [ ] Targeting arrow renders for units, targeted spells, and Hero Power.
- [ ] Each keyword above has a distinct, readable animation.
- [ ] Fulfill feels like the highlight of a match.
- [ ] Reduced-motion path exists and is tested.
- [ ] Nothing juicy intrudes on the sacred interlude.
