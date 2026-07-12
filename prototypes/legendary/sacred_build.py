#!/usr/bin/env python3
"""Legendary treatment: enshrine the card art in a jeweled sacred frame
   (breastplate stones + a winged mercy-seat crest). Reverent, no figure."""
import base64, pathlib, math

ART = pathlib.Path("/home/user/Underdogs/ui/assets/cards")
def dataurl(n): return "data:image/webp;base64," + base64.b64encode((ART / n).read_bytes()).decode()
daniel = dataurl("daniel.webp")
david  = dataurl("david_the_king.webp")

# ---- intertwined wreath crest (symmetric about x=80) ----
# Two olive branches rise from a knot at the bottom, arc up each side and cross
# at the top (intertwined), framing a stone of light. Draw the LEFT branch; the
# right is the same group mirrored with scale(-1,1).
CX, CY, RX, RY = 80, 44, 28, 33
LEAF = "M0,0 C-2.7,-3.4 -2.7,-9.5 0,-14 C2.7,-9.5 2.7,-3.4 0,0 Z"

def left_branch():
    # sample the ellipse from just past bottom-centre (a=97°) up to past the top
    # (a=268°) so the tip crosses the centre line — that overlap = intertwined.
    angs = [97 + i * (171 / 9) for i in range(10)]
    pts = [(CX + RX*math.cos(math.radians(a)), CY + RY*math.sin(math.radians(a))) for a in angs]
    stem = "M" + " L".join(f"{x:.1f},{y:.1f}" for x, y in pts)
    leaves, berries = [], []
    for i, (a, (x, y)) in enumerate(zip(angs, pts)):
        rad = math.degrees(math.atan2(y - CY, x - CX))          # outward
        tilt = 20 if i % 2 == 0 else -6
        leaves.append(f'<path d="{LEAF}" fill="url(#leaf)" stroke="#6b3f0c" stroke-width="0.7" '
                      f'transform="translate({x:.1f},{y:.1f}) rotate({rad+90+tilt:.0f})"/>')
        # a smaller inner leaf for fullness
        leaves.append(f'<path d="{LEAF}" fill="#c9871f" '
                      f'transform="translate({x:.1f},{y:.1f}) rotate({rad+90-24:.0f}) scale(0.72)"/>')
        if i in (2, 5, 8):
            berries.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="2.6" fill="url(#berry)" '
                           f'stroke="#6b3f0c" stroke-width="0.5"/>')
    return (f'<path d="{stem}" fill="none" stroke="url(#vine)" stroke-width="2.6" stroke-linecap="round"/>'
            + "".join(leaves) + "".join(berries))

CREST = f'''<svg class="crest" viewBox="0 0 160 96" aria-hidden="true">
  <defs>
    <linearGradient id="vine" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0%" stop-color="#8a5310"/><stop offset="100%" stop-color="#eab84f"/></linearGradient>
    <linearGradient id="leaf" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0%" stop-color="#c9871f"/><stop offset="100%" stop-color="#ffe9a8"/></linearGradient>
    <radialGradient id="glory" cx="42%" cy="34%" r="70%">
      <stop offset="0%" stop-color="#ffffff"/><stop offset="34%" stop-color="#fff3cf"/>
      <stop offset="70%" stop-color="#ffd97a"/><stop offset="100%" stop-color="#d69a2a"/></radialGradient>
    <radialGradient id="berry" cx="36%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#fff4cf"/><stop offset="55%" stop-color="#e0a52a"/>
      <stop offset="100%" stop-color="#7a5210"/></radialGradient>
    <linearGradient id="wg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffe9a8"/><stop offset="100%" stop-color="#8a5310"/></linearGradient>
  </defs>
  <g>{left_branch()}</g>
  <g transform="translate(160,0) scale(-1,1)">{left_branch()}</g>
  <!-- knot / ribbon where the branches tie at the bottom -->
  <path d="M74,74 C70,70 70,80 76,78 C72,82 80,84 80,79 C80,84 88,82 84,78 C90,80 90,70 86,74 C83,71 77,71 74,74 Z"
        fill="url(#wg)" stroke="#6b3f0c" stroke-width="1"/>
  <!-- stone of light in the wreath's heart -->
  <circle cx="80" cy="43" r="12" fill="#3a250d"/>
  <circle cx="80" cy="43" r="10.5" fill="url(#glory)"/>
  <circle cx="80" cy="43" r="10.5" fill="none" stroke="rgba(255,255,255,.6)" stroke-width="0.8"/>
  <path d="M80,35 L80,51 M72,43 L88,43 M75,38 L85,48 M85,38 L75,48" stroke="#fff" stroke-width="0.6" opacity=".5"/>
  <circle cx="76.5" cy="39.5" r="2.2" fill="#fff" opacity=".9"/>
</svg>'''

# ---- deterministic PRNG seeded from a string (so the "randomness" is reproducible) ----
def rng_from(s):
    h = 2166136261
    for ch in s:
        h = ((h ^ ord(ch)) * 16777619) & 0xffffffff
    st = h
    def r():
        nonlocal st
        st = (st + 0x6D2B79F5) & 0xffffffff
        t = st
        t = ((t ^ (t >> 15)) * (t | 1)) & 0xffffffff
        t = (t ^ (t + ((t ^ (t >> 7)) * (t | 61)))) & 0xffffffff
        return ((t ^ (t >> 14)) & 0xffffffff) / 4294967296
    return r

# ---- one vine coiling AROUND the golden rail: it centres on the rail, so with a
# matching rail redrawn on top it ducks behind the border and re-emerges (wrap).
# Half the loops of before, leaves lying ALONG the stem, organic jitter from "mark".
# ---- one continuous GOLD vine coiling TIGHT around the whole border. It hugs
# just inside the gold rail, oscillating so its outer crest ducks behind the
# rail (over-under) while the bright-gold inner arc stays visible. Full perimeter.
def wrap_vine():
    r = rng_from("mark")
    W, H, inset, rc = 220, 300, 5.5, 11
    L, T, R, B = inset, inset, W - inset, H - inset
    samples = []
    def addline(x0, y0, x1, y1, nx, ny):
        seglen = math.hypot(x1 - x0, y1 - y0); tx, ty = (x1 - x0) / seglen, (y1 - y0) / seglen
        d = 0.0
        while d <= seglen:
            samples.append((x0 + tx * d, y0 + ty * d, nx, ny)); d += 2.0
    def addarc(cx, cy, a0, a1):
        astep = math.degrees(2.0 / rc); a = a0
        while a <= a1:
            ar = math.radians(a)
            samples.append((cx + rc * math.cos(ar), cy + rc * math.sin(ar), math.cos(ar), math.sin(ar))); a += astep
    addline(L + rc, T, R - rc, T, 0, -1); addarc(R - rc, T + rc, -90, 0)
    addline(R, T + rc, R, B - rc, 1, 0);  addarc(R - rc, B - rc, 0, 90)
    addline(R - rc, B, L + rc, B, 0, 1);  addarc(L + rc, B - rc, 90, 180)
    addline(L, B - rc, L, T + rc, -1, 0); addarc(L + rc, T + rc, 180, 270)

    A, pitch, BASE = 6.0, 20.0, 4.5              # amplitude, tight pitch, push inside the rail
    ph = r() * 6.283
    pts = []; s = 0.0; prev = None
    for (x, y, nx, ny) in samples:
        if prev is not None:
            s += math.hypot(x - prev[0], y - prev[1])
        prev = (x, y)
        off = -BASE + A * math.sin(2 * math.pi * s / pitch + ph)   # +outward / -inward
        pts.append((x + nx * off, y + ny * off, off, nx, ny))
    path = "M" + " L".join(f"{p[0]:.1f},{p[1]:.1f}" for p in pts) + " Z"
    # small gold leaves at the inner crests, lying along the border
    leaves = []
    for i in range(2, len(pts) - 2):
        off = pts[i][2]
        if off < pts[i - 1][2] and off < pts[i + 1][2] and off < -7:    # inner crest
            px, py = pts[i][0], pts[i][1]
            base = math.degrees(math.atan2(pts[i + 1][1] - pts[i - 1][1], pts[i + 1][0] - pts[i - 1][0]))
            la = base + (90 if r() > 0.5 else -90) + (r() - 0.5) * 24
            sc = 0.55 + r() * 0.28
            fill = "url(#lgold)" if r() > 0.28 else "#e0a52a"
            leaves.append(f'<path d="{LEAF}" fill="{fill}" stroke="#7a4a10" stroke-width="0.35" '
                          f'transform="translate({px:.1f},{py:.1f}) rotate({la:.0f}) scale({sc:.2f})"/>')
    return (f'<path d="{path}" fill="none" stroke="#7a4a10" stroke-width="3.1" stroke-linejoin="round" opacity=".5"/>'
            f'<path d="{path}" fill="none" stroke="url(#vgold)" stroke-width="2.4" stroke-linejoin="round"/>'
            + "".join(leaves))

# ---- the border as overlapping riveted ARMOR PLATES around the perimeter ----
def plates():
    W, H = 220, 300
    EC = 9.0          # plate centre distance from the card edge
    L, Hp, GAP = 30.0, 13.0, 2.0
    CORNER = 30.0     # keep the corners clear for the corner plates
    parts = []

    def plate(cx, cy, rot, ln=L, hp=Hp):
        return (f'<g transform="translate({cx:.1f},{cy:.1f}) rotate({rot})">'
                f'<rect x="{-ln/2:.1f}" y="{-hp/2:.1f}" width="{ln:.1f}" height="{hp:.1f}" rx="3.2" '
                f'fill="url(#plate)" stroke="#241305" stroke-width="1.2"/>'
                f'<rect x="{-ln/2+2.2:.1f}" y="{-hp/2+1.4:.1f}" width="{ln-4.4:.1f}" height="1.8" rx="0.9" fill="#fff2cf" opacity=".55"/>'
                f'<circle cx="{-ln/2+4.2:.1f}" cy="0" r="2" fill="url(#rivet)" stroke="#241305" stroke-width="0.5"/>'
                f'<circle cx="{ln/2-4.2:.1f}" cy="0" r="2" fill="url(#rivet)" stroke="#241305" stroke-width="0.5"/>'
                f'</g>')

    def run(a, b, along, cross, rot):     # lay plates from a..b along one edge
        pos = a
        while pos <= b - L / 2:
            cx, cy = (pos, cross) if along == 'x' else (cross, pos)
            parts.append(plate(cx, cy, rot)); pos += L + GAP

    run(CORNER, W - CORNER, 'x', EC, 0)            # top
    run(CORNER, W - CORNER, 'x', H - EC, 0)        # bottom
    run(CORNER, H - CORNER, 'y', EC, 90)           # left
    run(CORNER, H - CORNER, 'y', W - EC, 90)       # right
    # beefier beveled corner plates (the gem bosses sit on these)
    for cx, cy in ((EC, EC), (W - EC, EC), (EC, H - EC), (W - EC, H - EC)):
        parts.append(f'<rect x="{cx-11:.1f}" y="{cy-11:.1f}" width="22" height="22" rx="5" '
                     f'fill="url(#plateC)" stroke="#241305" stroke-width="1.3"/>'
                     f'<rect x="{cx-8:.1f}" y="{cy-9:.1f}" width="16" height="2.2" rx="1" fill="#fff2cf" opacity=".5"/>')
    defs = ('<defs>'
            '<linearGradient id="plate" x1="0" y1="0" x2="0" y2="1">'
            '<stop offset="0%" stop-color="#ffeab0"/><stop offset="34%" stop-color="#e2ab3c"/>'
            '<stop offset="72%" stop-color="#a9721b"/><stop offset="100%" stop-color="#6f4610"/></linearGradient>'
            '<radialGradient id="plateC" cx="38%" cy="30%" r="75%">'
            '<stop offset="0%" stop-color="#fff0bf"/><stop offset="55%" stop-color="#cf9226"/>'
            '<stop offset="100%" stop-color="#6f4610"/></radialGradient>'
            '<radialGradient id="rivet" cx="34%" cy="28%" r="72%">'
            '<stop offset="0%" stop-color="#fff6d6"/><stop offset="55%" stop-color="#e6b34a"/>'
            '<stop offset="100%" stop-color="#5c360a"/></radialGradient></defs>')
    return f'<svg class="plates" viewBox="0 0 220 300" aria-hidden="true">{defs}{"".join(parts)}</svg>'

PLATES = plates()

def card(art, nm, tp, cost, atk, hp, rx):
    return f'''
  <div class="wrap">
    <div class="glow"></div>
    <div class="card leg">
      <div class="win"><div class="art" style="background-image:url('{art}')"></div></div>
      <div class="nm">{nm}</div><div class="tp">{tp}</div>
      <div class="rx">{rx}</div>
      <div class="molding"></div>
      <div class="sheen"></div>
    </div>
    {PLATES}
    <div class="cost">{cost}</div>
    <div class="atk">{atk}</div><div class="hp">{hp}</div>
    <span class="jewel sapphire tl"></span><span class="jewel emerald tr"></span>
    <span class="jewel amethyst bl"></span><span class="jewel ruby br"></span>
    <span class="jewel topaz sl"></span><span class="jewel topaz sr"></span>
    <span class="jewel diamond bc"></span>
  </div>'''

HTML = f'''<title>Legendary — jeweled sacred frame</title>
<style>
:root{{--gold-hi:#ffe9a8;--gold:#eab84f;--gold-deep:#c9871f;--gold-lo:#8a5310;
  --bronze:#6b3f0c;--ink:#e9dcc0;--muted:#b8a888;
  --sap-hi:#a9ccff;--sap:#2e6fd0;--sap-lo:#123a7a;
  --emr-hi:#8fe6b8;--emr:#28a06a;--emr-lo:#0f4a2c;
  --amy-hi:#d6bcff;--amy:#7a52c0;--amy-lo:#301e5a;
  --rby-hi:#ffa0aa;--rby:#c62f3f;--rby-lo:#560d14;
  --top-hi:#ffe6a6;--top:#e0a52a;--top-lo:#7a5210;
  --dia-hi:#ffffff;--dia:#eaf3ff;--dia-lo:#b8c6d6;
  color-scheme:dark}}
*{{box-sizing:border-box}} body{{margin:0}}
.stage{{min-height:100vh;padding:40px 24px 70px;color:var(--ink);
  font-family:'Iowan Old Style',Georgia,serif;
  background:radial-gradient(120% 90% at 50% -10%,#241a10,#0e0a06 60%,#070503)}}
h1{{text-align:center;font-size:26px;color:#ffd98a;margin:0 0 6px;text-wrap:balance}}
.lead{{text-align:center;color:var(--muted);max-width:62ch;margin:0 auto 52px;
  font-family:system-ui,sans-serif;font-size:14px;line-height:1.6}}
.row{{display:flex;gap:88px;justify-content:center;flex-wrap:wrap}}

.wrap{{position:relative;width:220px;height:300px;margin-top:30px;
  filter:drop-shadow(0 16px 26px rgba(0,0,0,.6))}}
.glow{{position:absolute;inset:-26px;border-radius:28px;
  background:radial-gradient(56% 50% at 50% 40%,rgba(255,180,70,.30),transparent 70%);
  animation:breathe 5s ease-in-out infinite}}
@keyframes breathe{{50%{{opacity:.62}}}}
.card{{position:absolute;inset:0;border-radius:16px;overflow:hidden;z-index:1;
  background:radial-gradient(120% 60% at 50% 100%,rgba(60,42,22,.5),transparent 70%),linear-gradient(180deg,#241a10,#160f07);
  box-shadow:0 0 0 4px #14100a}}
/* legendary: a heavier, warmer double-gold ring */
/* ornate carved molding — layered inset shadows = a shadow-box border */
.molding{{position:absolute;inset:0;border-radius:16px;z-index:3;pointer-events:none;
  box-shadow:
    inset 0 0 0 15px #170f06, inset 0 0 0 16px #6b3f0c, inset 0 0 0 17px rgba(255,232,170,.5),
    inset 0 3px 12px rgba(0,0,0,.5)}}
/* directional sheen across the gold band */
.sheen{{position:absolute;inset:0;border-radius:16px;padding:16px;z-index:4;pointer-events:none;
  background:linear-gradient(150deg,rgba(255,255,240,.32),transparent 44%,rgba(0,0,0,.32));
  -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;
  mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);mask-composite:exclude;
  mix-blend-mode:soft-light}}
.plates{{position:absolute;inset:0;width:220px;height:300px;z-index:2;pointer-events:none;
  filter:drop-shadow(0 2px 2px rgba(0,0,0,.5))}}
/* engraved inner line */
.rim{{position:absolute;inset:5px;border-radius:12px;z-index:3;pointer-events:none;
  box-shadow:inset 0 0 0 1px rgba(0,0,0,.6),inset 0 0 0 2px var(--gold-deep),inset 0 0 0 3px rgba(255,232,170,.5)}}
.win{{position:absolute;top:17px;left:17px;right:17px;height:138px;border-radius:6px;overflow:hidden;z-index:1;
  box-shadow:0 0 0 2px #4a2c08,0 0 0 3px rgba(255,224,150,.5),inset 0 -24px 24px rgba(0,0,0,.45)}}
.win .art{{position:absolute;inset:0;background-size:cover;background-position:center 22%}}
.cost{{position:absolute;top:7px;left:7px;width:34px;height:34px;border-radius:50%;z-index:4;display:grid;place-items:center;
  font-weight:800;font-size:18px;color:#3a2408;background:radial-gradient(circle at 35% 30%,#ffe6a6,#e6a33a 60%,#8a5410);
  box-shadow:0 0 0 2px #2a1c0c,0 0 0 3px rgba(255,220,150,.4)}}
.nm{{position:absolute;top:160px;left:14px;right:14px;text-align:center;z-index:4;
  font-weight:800;font-size:17px;color:#ffe9bd;text-shadow:0 1px 0 #000,0 2px 6px rgba(0,0,0,.8)}}
.tp{{position:absolute;top:182px;left:0;right:0;text-align:center;z-index:4;
  font-family:system-ui,sans-serif;font-size:9px;letter-spacing:1.2px;color:#c39a54}}
.rx{{position:absolute;top:204px;left:18px;right:18px;text-align:center;z-index:4;
  font-family:system-ui,sans-serif;font-size:11px;line-height:1.42;color:#e9dcc0}}
.atk,.hp{{position:absolute;bottom:2px;width:38px;height:38px;border-radius:50%;z-index:4;display:grid;place-items:center;
  font-weight:800;font-size:19px;color:#fff;box-shadow:0 0 0 2px #2a1c0c;text-shadow:0 1px 2px #000}}
.atk{{left:2px;background:radial-gradient(circle at 35% 30%,#ffd27a,#c8801f 62%,#5a3208)}}
.hp{{right:2px;background:radial-gradient(circle at 35% 30%,#ff9a86,#b52f22 62%,#4a0f0a)}}

/* ---- set gemstones (breastplate) ---- */
.jewel{{position:absolute;width:17px;height:17px;border-radius:50%;z-index:4;
  background:radial-gradient(circle at 34% 30%,#fff 0 6%,var(--gh) 20%,var(--gc) 56%,var(--gl) 100%);
  box-shadow:0 0 0 2px #3a2408,0 0 0 4px var(--gold-deep),0 0 0 5px rgba(0,0,0,.5),
    inset 0 -2px 3px rgba(0,0,0,.4),0 0 9px 0 var(--gc)}}
.jewel::after{{content:'';position:absolute;top:3px;left:4px;width:5px;height:5px;border-radius:50%;
  background:radial-gradient(circle,#fff,transparent 70%);animation:twinkle 3.2s ease-in-out infinite}}
@keyframes twinkle{{0%,100%{{opacity:.5;transform:scale(.8)}}50%{{opacity:1;transform:scale(1.15)}}}}
.sapphire{{--gh:var(--sap-hi);--gc:var(--sap);--gl:var(--sap-lo)}}
.emerald{{--gh:var(--emr-hi);--gc:var(--emr);--gl:var(--emr-lo)}}
.amethyst{{--gh:var(--amy-hi);--gc:var(--amy);--gl:var(--amy-lo)}}
.ruby{{--gh:var(--rby-hi);--gc:var(--rby);--gl:var(--rby-lo)}}
.topaz{{--gh:var(--top-hi);--gc:var(--top);--gl:var(--top-lo);width:13px;height:13px}}
.diamond{{--gh:var(--dia-hi);--gc:var(--dia);--gl:var(--dia-lo);width:19px;height:19px}}
.tl{{top:-6px;left:-6px}} .tr{{top:-6px;right:-6px}} .bl{{bottom:-6px;left:-6px}} .br{{bottom:-6px;right:-6px}}
.sl{{top:50%;left:-5px;transform:translateY(-50%)}} .sr{{top:50%;right:-5px;transform:translateY(-50%)}}
.bc{{bottom:-7px;left:50%;transform:translateX(-50%)}}

/* winged mercy-seat crest breaching the top */
.railtop{{position:absolute;inset:0;border-radius:16px;padding:5px;z-index:3;pointer-events:none;background:linear-gradient(150deg,#fff2cf,#f0a52e 40%,#7a4410);-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);mask-composite:exclude;box-shadow:inset 0 0 0 1px rgba(0,0,0,.55),inset 0 0 12px rgba(255,240,200,.12)}}
.vine{{position:absolute;inset:0;width:220px;height:300px;z-index:2;pointer-events:none;overflow:visible;
  filter:drop-shadow(0 2px 3px rgba(0,0,0,.5))}}
.crest{{position:absolute;top:-56px;left:50%;transform:translateX(-50%);width:150px;height:90px;z-index:5;
  pointer-events:none;filter:drop-shadow(0 3px 5px rgba(0,0,0,.6));animation:shine 4.2s ease-in-out infinite}}
@keyframes shine{{50%{{filter:drop-shadow(0 3px 7px rgba(0,0,0,.6)) brightness(1.1)}}}}
@media (prefers-reduced-motion:reduce){{.glow,.crest,.jewel::after{{animation:none}}}}

figcaption{{text-align:center;color:var(--muted);font-family:system-ui,sans-serif;font-size:11px;
  letter-spacing:1.5px;text-transform:uppercase;margin-top:26px}}
.foot{{max-width:64ch;margin:60px auto 0;font-family:system-ui,sans-serif;font-size:13px;line-height:1.6;
  color:var(--muted);text-align:center}}
</style>
<div class="stage">
  <h1>Legendary — Enshrined</h1>
  <p class="lead">The art you already have, set like a relic of the holy place: a heavier double-gold frame with an engraved inner line, the twelve-stone colors of the high priest's breastplate set at the corners, and an intertwined olive wreath — the crown of life — cresting the top, framing a stone of light. All gems, gold, and glow — nothing holy is depicted.</p>
  <div class="row">
    <figure style="margin:0">{card(daniel,"Daniel","EXILE · PROPHET · LEGENDARY",2,2,3,"Endure. Fulfill: survive an enemy turn while damaged.")}<figcaption>Daniel</figcaption></figure>
    <figure style="margin:0">{card(david,"David the King","KINGDOM · WARRIOR · LEGENDARY",5,6,6,"Giant-Slayer. Your other units have +1 attack.")}<figcaption>David the King</figcaption></figure>
  </div>
  <p class="foot">The intertwined olive wreath crowns the top, framing a stone of light; the breastplate stones ring the border. Dials left: wreath fuller or finer, stone warmer or cooler, and whether the little gems ride the corners (shown) or space evenly around the whole frame.</p>
</div>'''

out = pathlib.Path("/tmp/claude-0/-home-user-Underdogs/6dea9569-c97d-5f3a-974b-4f16138f0d8b/scratchpad/sacred.html")
out.write_text(HTML)
print("wrote", out, len(HTML))
