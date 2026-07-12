#!/usr/bin/env python3
"""Heraldic lion emblem — built by the plan (viewBox 100x100, symmetric x=50)."""
import math, base64, pathlib

def star(cx, cy, r_out, r_in, n, rot=0.0):
    pts = []
    for i in range(2 * n):
        r = r_out if i % 2 == 0 else r_in
        a = math.radians(rot - 90 + i * 180 / n)
        pts.append(f"{cx + r*math.cos(a):.2f},{cy + r*math.sin(a):.2f}")
    return "M" + " L".join(pts) + " Z"

mane_out = star(50, 50, 47, 31, 15, 0)
mane_in  = star(50, 50, 37, 28, 15, 12)   # half-step offset, interleaves

# ---- the emblem SVG (defs draw left; mirror with scale(-1,1) about x=50) ----
LION = f'''<svg class="lion" viewBox="0 0 100 100" role="img" aria-label="Heraldic lion emblem">
  <defs>
    <radialGradient id="mane" cx="42%" cy="34%" r="72%">
      <stop offset="0%" stop-color="var(--gold-hi)"/><stop offset="46%" stop-color="var(--gold)"/>
      <stop offset="82%" stop-color="var(--gold-deep)"/><stop offset="100%" stop-color="var(--gold-lo)"/>
    </radialGradient>
    <radialGradient id="face" cx="46%" cy="36%" r="70%">
      <stop offset="0%" stop-color="#f3d78f"/><stop offset="60%" stop-color="var(--face)"/>
      <stop offset="100%" stop-color="#b98a30"/>
    </radialGradient>
    <g id="ear"><path d="M42,34 C34.5,33.5 31,29.5 32.5,25 C34.5,22 39.5,22.8 43,27.5 C45,30.3 44.6,34 42,34 Z"
        fill="url(#face)" stroke="var(--bronze)" stroke-width="1.4"/>
      <path d="M41,31.5 C38,30.8 36.3,28 37.3,25.4 C39.3,26.4 40.8,28.6 41.2,30.6 Z" fill="#a9711f"/></g>
    <g id="brow"><path d="M33,47 C37,42 43,42 46.5,45.5 L45,48 C42,45 38,45 35,49 Z"
        fill="var(--gold-deep)" stroke="var(--bronze)" stroke-width="0.8"/></g>
    <g id="eye"><path d="M35.5,49.2 C38,46.6 43,46.6 45,49.2 C43,51.8 38,51.8 35.5,49.2 Z"
        fill="var(--dark)"/><circle cx="41.5" cy="48.4" r="1.1" fill="#ffe9b0"/></g>
  </defs>

  <path d="{mane_out}" fill="url(#mane)" stroke="var(--bronze)" stroke-width="1.1" stroke-linejoin="round"/>
  <path d="{mane_in}" fill="var(--gold-deep)" opacity="0.9" stroke-linejoin="round"/>

  <!-- face base -->
  <path d="M50,27 C40,26 33,31 31.5,42 C30.5,52 31.5,61 38,70 C43,77 50,80 50,80
           C50,80 57,77 62,70 C68.5,61 69.5,52 68.5,42 C67,31 60,26 50,27 Z"
        fill="url(#face)" stroke="var(--bronze)" stroke-width="1.6"/>

  <use href="#ear"/><use href="#ear" transform="translate(100,0) scale(-1,1)"/>
  <use href="#brow"/><use href="#brow" transform="translate(100,0) scale(-1,1)"/>
  <use href="#eye"/><use href="#eye" transform="translate(100,0) scale(-1,1)"/>

  <!-- nose (center heart) -->
  <path d="M50,54 C55,54 57.5,58 55.5,61 C53.5,64 50,64.5 50,64.5
           C50,64.5 46.5,64 44.5,61 C42.5,58 45,54 50,54 Z"
        fill="var(--dark)"/>
  <!-- muzzle lobes -->
  <path d="M50,64 C48,70 42,72 38,69.5 C35,67.5 36,64 39.5,63.2 C43,62.5 47,63.2 50,64
           C53,63.2 57,62.5 60.5,63.2 C64,64 65,67.5 62,69.5 C58,72 52,70 50,64 Z"
        fill="#d2a343" stroke="var(--bronze)" stroke-width="1"/>
  <!-- mouth -->
  <path d="M50,63 L50,68.5 M50,68.5 C47.5,70.5 45.5,70.5 44.5,69.5 M50,68.5 C52.5,70.5 54.5,70.5 55.5,69.5"
        fill="none" stroke="var(--dark)" stroke-width="1.6" stroke-linecap="round"/>
</svg>'''

# ---- embed Daniel art for the on-card context ----
ART = pathlib.Path("/home/user/Underdogs/ui/assets/cards")
def dataurl(n): return "data:image/webp;base64," + base64.b64encode((ART / n).read_bytes()).decode()
daniel = dataurl("daniel.webp")

HTML = f'''<title>The Lion — Legendary Emblem</title>
<style>
:root{{
  --gold-hi:#ffe9a8; --gold:#eab84f; --gold-deep:#c9871f; --gold-lo:#8a5310;
  --bronze:#6b3f0c; --dark:#3a250d; --face:#e4bd6b;
  --ink:#e9dcc0; --muted:#b8a888; --u:240px;
  color-scheme:dark;
}}
*{{box-sizing:border-box}}
body{{margin:0}}
.stage{{min-height:100vh;padding:40px 24px 64px;color:var(--ink);
  font-family:'Iowan Old Style',Georgia,'Times New Roman',serif;
  background:radial-gradient(120% 90% at 50% -10%,#241a10,#0e0a06 60%,#070503)}}
h1{{text-align:center;font-size:28px;letter-spacing:.4px;color:#ffd98a;margin:0 0 6px;
  text-wrap:balance;text-shadow:0 2px 12px rgba(0,0,0,.7)}}
.lead{{text-align:center;color:var(--muted);max-width:60ch;margin:0 auto 40px;
  font-family:system-ui,sans-serif;font-size:14px;line-height:1.6}}
.hero{{display:flex;gap:56px;align-items:center;justify-content:center;flex-wrap:wrap}}
.lion{{width:var(--u);height:var(--u);display:block;
  filter:drop-shadow(0 6px 14px rgba(0,0,0,.55))}}
.pedestal{{display:flex;flex-direction:column;align-items:center;gap:18px}}
.plate{{position:relative;padding:26px 30px;border-radius:18px;
  background:radial-gradient(70% 70% at 50% 30%,rgba(255,180,70,.10),transparent),#140e07;
  box-shadow:0 0 0 1px rgba(200,160,80,.25),inset 0 0 40px rgba(0,0,0,.5)}}
.sizes{{display:flex;gap:34px;align-items:flex-end}}
.sizes figure{{margin:0;text-align:center;color:var(--muted);font-family:system-ui,sans-serif;font-size:11px}}
.sizes .lion{{filter:drop-shadow(0 2px 4px rgba(0,0,0,.5))}}
.s96{{--u:96px}} .s48{{--u:48px}} .s28{{--u:28px}}
.caption{{font-family:system-ui,sans-serif;font-size:12px;letter-spacing:1.5px;text-transform:uppercase;
  color:#c39a54;margin-top:6px}}

/* on-card context */
.ctx{{display:flex;gap:60px;justify-content:center;align-items:flex-start;margin-top:64px;flex-wrap:wrap}}
.wrap{{position:relative;width:220px;height:300px;filter:drop-shadow(0 16px 26px rgba(0,0,0,.6))}}
.wrap .glow{{position:absolute;inset:-24px;border-radius:26px;
  background:radial-gradient(58% 52% at 50% 40%,rgba(255,170,60,.30),transparent 70%);
  animation:breathe 4.5s ease-in-out infinite}}
@keyframes breathe{{50%{{opacity:.6}}}}
.card{{position:absolute;inset:0;border-radius:16px;overflow:hidden;z-index:2;
  background:radial-gradient(120% 60% at 50% 100%,rgba(60,42,22,.5),transparent 70%),linear-gradient(180deg,#241a10,#160f07);
  box-shadow:0 0 0 4px #14100a}}
.card::after{{content:'';position:absolute;inset:0;border-radius:16px;padding:4px;pointer-events:none;
  background:linear-gradient(150deg,#ffe9a8,#f0a52e 42%,#8f5310);
  -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;
  mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);mask-composite:exclude}}
.win{{position:absolute;top:9px;left:9px;right:9px;height:150px;border-radius:9px;overflow:hidden;
  box-shadow:0 0 0 2px #7a4e12,0 0 0 3px rgba(255,224,150,.45),inset 0 -26px 26px rgba(0,0,0,.45)}}
.win .art{{position:absolute;inset:0;background:url('{daniel}') center 22%/cover}}
.cost{{position:absolute;top:6px;left:6px;width:34px;height:34px;border-radius:50%;z-index:5;display:grid;place-items:center;
  font-weight:800;font-size:18px;color:#3a2408;background:radial-gradient(circle at 35% 30%,#ffe6a6,#e6a33a 60%,#8a5410);
  box-shadow:0 0 0 2px #2a1c0c,0 0 0 3px rgba(255,220,150,.4)}}
.nm{{position:absolute;top:152px;left:14px;right:14px;text-align:center;z-index:4;
  font-weight:800;font-size:17px;color:#ffe9bd;text-shadow:0 1px 0 #000,0 2px 6px rgba(0,0,0,.8)}}
.tp{{position:absolute;top:174px;left:0;right:0;text-align:center;z-index:4;
  font-family:system-ui,sans-serif;font-size:9px;letter-spacing:1.2px;color:#c39a54}}
.rx{{position:absolute;top:198px;left:16px;right:16px;text-align:center;z-index:4;
  font-family:system-ui,sans-serif;font-size:11px;line-height:1.4;color:#e9dcc0}}
.atk,.hp{{position:absolute;bottom:2px;width:38px;height:38px;border-radius:50%;z-index:5;display:grid;place-items:center;
  font-weight:800;font-size:19px;color:#fff;box-shadow:0 0 0 2px #2a1c0c;text-shadow:0 1px 2px #000}}
.atk{{left:2px;background:radial-gradient(circle at 35% 30%,#ffd27a,#c8801f 62%,#5a3208)}}
.hp{{right:2px;background:radial-gradient(circle at 35% 30%,#ff9a86,#b52f22 62%,#4a0f0a)}}
.crest{{position:absolute;top:-52px;left:50%;transform:translateX(-50%);width:108px;height:108px;z-index:6;
  --u:108px;filter:drop-shadow(0 3px 5px rgba(0,0,0,.6));animation:glint 3.8s ease-in-out infinite}}
@keyframes glint{{50%{{filter:drop-shadow(0 3px 7px rgba(0,0,0,.6)) brightness(1.12)}}}}
@media (prefers-reduced-motion:reduce){{.glow,.crest{{animation:none}}}}
.foot{{max-width:70ch;margin:56px auto 0;font-family:system-ui,sans-serif;font-size:13px;line-height:1.6;
  color:var(--muted);text-align:center}}
</style>

<div class="stage">
  <h1>The Lion — Legendary Emblem</h1>
  <p class="lead">A heraldic gold lion mask, built geometrically (11 shapes, symmetric, one viewBox) so it stays crisp from a 300&nbsp;px chase-card crest down to a 28&nbsp;px board pip. Front-facing mask, not a realistic animal — that's what makes it read as an emblem.</p>

  <div class="hero">
    <div class="plate">{LION}</div>
    <div class="pedestal">
      <div class="sizes">
        <figure><div class="lion s96">{LION}</div>96</figure>
        <figure><div class="lion s48">{LION}</div>48</figure>
        <figure><div class="lion s28">{LION}</div>28</figure>
      </div>
      <div class="caption">scales without mush</div>
    </div>
  </div>

  <div class="ctx">
    <div class="wrap">
      <div class="glow"></div>
      <div class="lion crest">{LION}</div>
      <div class="card">
        <div class="cost">2</div>
        <div class="win"><div class="art"></div></div>
        <div class="nm">Daniel</div>
        <div class="tp">EXILE · PROPHET · LEGENDARY</div>
        <div class="rx">Endure. Fulfill: survive an enemy turn while damaged.</div>
        <div class="atk">2</div><div class="hp">3</div>
      </div>
    </div>
  </div>

  <p class="foot">Same emblem, dropped into the breaching frame slot. If the geometry reads right, the production version can stay pure SVG (infinitely crisp, themeable via the palette vars) — no raster asset needed.</p>
</div>'''

out = pathlib.Path("/tmp/claude-0/-home-user-Underdogs/6dea9569-c97d-5f3a-974b-4f16138f0d8b/scratchpad/lion.html")
out.write_text(HTML)
print("wrote", out, len(HTML), "bytes")
