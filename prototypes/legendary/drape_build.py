#!/usr/bin/env python3
"""Lion draped over the card frame (Ysera-style), reusing the heraldic head."""
import math, base64, pathlib

def star(cx, cy, r_out, r_in, n, rot=0.0):
    pts = []
    for i in range(2 * n):
        r = r_out if i % 2 == 0 else r_in
        a = math.radians(rot - 90 + i * 180 / n)
        pts.append(f"{cx + r*math.cos(a):.2f},{cy + r*math.sin(a):.2f}")
    return "M" + " L".join(pts) + " Z"

mane_out = star(50, 50, 47, 31, 15, 0)
mane_in  = star(50, 50, 37, 28, 15, 12)

# ---- the proven heraldic lion HEAD as a reusable symbol (0..100) ----
HEAD = f'''<symbol id="head" viewBox="0 0 100 100">
  <path d="{mane_out}" fill="url(#mane)" stroke="var(--bronze)" stroke-width="1.1" stroke-linejoin="round"/>
  <path d="{mane_in}" fill="var(--gold-deep)" opacity="0.9" stroke-linejoin="round"/>
  <path d="M50,27 C40,26 33,31 31.5,42 C30.5,52 31.5,61 38,70 C43,77 50,80 50,80
           C50,80 57,77 62,70 C68.5,61 69.5,52 68.5,42 C67,31 60,26 50,27 Z"
        fill="url(#face)" stroke="var(--bronze)" stroke-width="1.6"/>
  <use href="#ear"/><use href="#ear" transform="translate(100,0) scale(-1,1)"/>
  <use href="#brow"/><use href="#brow" transform="translate(100,0) scale(-1,1)"/>
  <use href="#eye"/><use href="#eye" transform="translate(100,0) scale(-1,1)"/>
  <path d="M50,54 C55,54 57.5,58 55.5,61 C53.5,64 50,64.5 50,64.5
           C50,64.5 46.5,64 44.5,61 C42.5,58 45,54 50,54 Z" fill="var(--dark)"/>
  <path d="M50,64 C48,70 42,72 38,69.5 C35,67.5 36,64 39.5,63.2 C43,62.5 47,63.2 50,64
           C53,63.2 57,62.5 60.5,63.2 C64,64 65,67.5 62,69.5 C58,72 52,70 50,64 Z"
        fill="#d2a343" stroke="var(--bronze)" stroke-width="1"/>
  <path d="M50,63 L50,68.5 M50,68.5 C47.5,70.5 45.5,70.5 44.5,69.5 M50,68.5 C52.5,70.5 54.5,70.5 55.5,69.5"
        fill="none" stroke="var(--dark)" stroke-width="1.6" stroke-linecap="round"/>
</symbol>'''

DEFS = f'''<svg width="0" height="0" style="position:absolute"><defs>
  <radialGradient id="mane" cx="42%" cy="34%" r="72%">
    <stop offset="0%" stop-color="var(--gold-hi)"/><stop offset="46%" stop-color="var(--gold)"/>
    <stop offset="82%" stop-color="var(--gold-deep)"/><stop offset="100%" stop-color="var(--gold-lo)"/>
  </radialGradient>
  <radialGradient id="face" cx="46%" cy="36%" r="70%">
    <stop offset="0%" stop-color="#f3d78f"/><stop offset="60%" stop-color="var(--face)"/>
    <stop offset="100%" stop-color="#b98a30"/></radialGradient>
  <linearGradient id="bodyGrad" x1="0" y1="0" x2="1" y2="0.4">
    <stop offset="0%" stop-color="var(--gold)"/><stop offset="55%" stop-color="var(--gold-deep)"/>
    <stop offset="100%" stop-color="var(--gold-lo)"/></linearGradient>
  <g id="ear"><path d="M42,34 C34.5,33.5 31,29.5 32.5,25 C34.5,22 39.5,22.8 43,27.5 C45,30.3 44.6,34 42,34 Z"
      fill="url(#face)" stroke="var(--bronze)" stroke-width="1.4"/>
    <path d="M41,31.5 C38,30.8 36.3,28 37.3,25.4 C39.3,26.4 40.8,28.6 41.2,30.6 Z" fill="#a9711f"/></g>
  <g id="brow"><path d="M33,47 C37,42 43,42 46.5,45.5 L45,48 C42,45 38,45 35,49 Z"
      fill="var(--gold-deep)" stroke="var(--bronze)" stroke-width="0.8"/></g>
  <g id="eye"><path d="M35.5,49.2 C38,46.6 43,46.6 45,49.2 C43,51.8 38,51.8 35.5,49.2 Z" fill="var(--dark)"/>
    <circle cx="41.5" cy="48.4" r="1.1" fill="#ffe9b0"/></g>
  {HEAD}
</defs></svg>'''

# ---- the draping ornament (viewBox 240x160; card top edge ~ y58, corners x16..224) ----
# body/back: maned spine sweeping from behind the head, over the top, to the right haunch
BODY = '''M86,66
  C104,44 118,34 134,31 L140,24 L146,32 C160,32 176,36 190,46
  C202,54 208,63 206,74
  C201,70 193,64 182,61 C165,56 150,55 138,57 C118,60 102,64 92,74 Z'''
# a few mane tufts along the back (one path)
TUFTS = '''M120,36 l6,-12 l6,11 z M140,31 l5,-13 l6,12 z M162,34 l5,-12 l6,12 z M182,42 l4,-11 l7,10 z'''
# tail: from the haunch, sweeps right past the edge and curls down into a tuft
TAIL = '''M200,64 C216,60 232,66 234,82 C235,94 226,104 214,104
  C222,100 226,92 222,86 C218,80 210,80 205,86
  C210,78 214,70 200,64 Z'''
TAILTUFT = '''M214,100 c-6,4 -10,12 -8,20 c4,-6 6,-8 10,-9 c-3,6 -3,12 0,18
  c3,-7 6,-9 10,-11 c-4,-3 -6,-10 -12,-18 z'''
# forepaws draping over the top edge onto the art
PAW = '''M0,0 C-9,0 -13,7 -12,15 C-11,22 -5,26 3,26 C11,26 16,21 15,14 C14,6 9,0 0,0 Z
  M-8,20 v7 M0,22 v8 M8,20 v7'''

ORN = f'''<svg class="orn" viewBox="0 0 240 160" aria-hidden="true">
  <path d="{BODY}" fill="url(#bodyGrad)" stroke="var(--bronze)" stroke-width="1.4" stroke-linejoin="round"/>
  <path d="{TUFTS}" fill="var(--gold)" stroke="var(--bronze)" stroke-width="1" stroke-linejoin="round"/>
  <path d="{TAIL}" fill="url(#bodyGrad)" stroke="var(--bronze)" stroke-width="1.4" stroke-linejoin="round"/>
  <path d="{TAILTUFT}" fill="var(--gold-deep)" stroke="var(--bronze)" stroke-width="1"/>
  <g stroke="var(--bronze)" stroke-width="1.2" stroke-linecap="round">
    <path d="{PAW}" fill="url(#face)" transform="translate(56,104)"/>
    <path d="{PAW}" fill="url(#face)" transform="translate(78,108) scale(0.92)"/>
  </g>
  <use href="#head" x="4" y="18" width="92" height="92"/>
</svg>'''

ART = pathlib.Path("/home/user/Underdogs/ui/assets/cards")
def dataurl(n): return "data:image/webp;base64," + base64.b64encode((ART / n).read_bytes()).decode()
daniel = dataurl("daniel.webp")

HTML = f'''<title>Lion draped legendary frame</title>
<style>
:root{{--gold-hi:#ffe9a8;--gold:#eab84f;--gold-deep:#c9871f;--gold-lo:#8a5310;
  --bronze:#6b3f0c;--dark:#3a250d;--face:#e4bd6b;--ink:#e9dcc0;--muted:#b8a888;color-scheme:dark}}
*{{box-sizing:border-box}} body{{margin:0}}
.stage{{min-height:100vh;padding:40px 24px 64px;color:var(--ink);
  font-family:'Iowan Old Style',Georgia,serif;
  background:radial-gradient(120% 90% at 50% -10%,#241a10,#0e0a06 60%,#070503)}}
h1{{text-align:center;font-size:26px;color:#ffd98a;margin:0 0 6px;text-wrap:balance}}
.lead{{text-align:center;color:var(--muted);max-width:60ch;margin:0 auto 44px;
  font-family:system-ui,sans-serif;font-size:14px;line-height:1.6}}
.row{{display:flex;gap:70px;justify-content:center;align-items:flex-start;flex-wrap:wrap}}
.wrap{{position:relative;width:220px;height:300px;filter:drop-shadow(0 16px 26px rgba(0,0,0,.6))}}
.glow{{position:absolute;inset:-26px;border-radius:26px;
  background:radial-gradient(56% 46% at 50% 34%,rgba(255,170,60,.30),transparent 70%);
  animation:breathe 4.6s ease-in-out infinite}}
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
.cost{{position:absolute;top:6px;left:6px;width:34px;height:34px;border-radius:50%;z-index:7;display:grid;place-items:center;
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
/* the draping ornament overlays the top and breaches the frame */
.orn{{position:absolute;top:-46px;left:-28px;width:276px;height:184px;z-index:6;pointer-events:none;
  filter:drop-shadow(0 4px 5px rgba(0,0,0,.55));animation:glint 4s ease-in-out infinite}}
@keyframes glint{{50%{{filter:drop-shadow(0 4px 7px rgba(0,0,0,.55)) brightness(1.1)}}}}
@media (prefers-reduced-motion:reduce){{.glow,.orn{{animation:none}}}}
.solo{{width:300px;height:200px}} .solo .orn{{position:static;width:300px;height:200px;filter:drop-shadow(0 4px 6px rgba(0,0,0,.5))}}
.foot{{max-width:66ch;margin:52px auto 0;font-family:system-ui,sans-serif;font-size:13px;line-height:1.6;color:var(--muted);text-align:center}}
figcaption{{text-align:center;color:var(--muted);font-family:system-ui,sans-serif;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;margin-top:14px}}
</style>
{DEFS}
<div class="stage">
  <h1>Legendary Frame — the Lion Drapes the Corner</h1>
  <p class="lead">Same heraldic lion, now posed like Ysera's dragon: head hooked over the top-left corner, paws hanging onto the art, the maned body sweeping across the top and the tail curling past the right edge. It breaks the rectangle on three sides.</p>
  <div class="row">
    <figure style="margin:0"><div class="solo">{ORN}</div><figcaption>the ornament alone</figcaption></figure>
    <figure style="margin:0">
      <div class="wrap">
        <div class="glow"></div>
        <div class="card">
          <div class="cost">2</div>
          <div class="win"><div class="art"></div></div>
          <div class="nm">Daniel</div><div class="tp">EXILE · PROPHET · LEGENDARY</div>
          <div class="rx">Endure. Fulfill: survive an enemy turn while damaged.</div>
          <div class="atk">2</div><div class="hp">3</div>
        </div>
        {ORN}
      </div>
      <figcaption>on the card</figcaption>
    </figure>
  </div>
  <p class="foot">v1 — workshop pass. The body/tail is stylized ornamental gold (not literal anatomy), so it drapes like the dragon without needing perfect legs. Tell me: head left or right, tail longer, mane fuller, or should the body wrap further down the side?</p>
</div>'''

out = pathlib.Path("/tmp/claude-0/-home-user-Underdogs/6dea9569-c97d-5f3a-974b-4f16138f0d8b/scratchpad/drape.html")
out.write_text(HTML)
print("wrote", out, len(HTML))
