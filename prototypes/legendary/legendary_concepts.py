#!/usr/bin/env python3
# Builds a self-contained legendary-frame concepts page (embeds real card art).
import base64, pathlib
ART = pathlib.Path("/home/user/Underdogs/ui/assets/cards")
def dataurl(name):
    b = (ART / name).read_bytes()
    return "data:image/webp;base64," + base64.b64encode(b).decode()

daniel   = dataurl("daniel.webp")
davidk   = dataurl("david_the_king.webp")
elijah   = dataurl("elijah.webp")
aaron    = dataurl("aaron_high_priest.webp")

# ---- reusable SVG: a heraldic lion-face medallion (sunburst mane) -----------
def petals(n):
    out = []
    for i in range(n):
        a = i * (360 / n)
        long = (i % 2 == 0)
        r2 = 46 if long else 38
        out.append(f'<use href="#petal" transform="rotate({a}) scale(1,{1 if long else 0.8})"/>')
    return "".join(out)

LION_DEFS = f'''
<svg width="0" height="0" style="position:absolute" aria-hidden="true">
<defs>
  <radialGradient id="gold" cx="38%" cy="30%" r="75%">
    <stop offset="0%" stop-color="#fff4cf"/><stop offset="42%" stop-color="#f2c25a"/>
    <stop offset="78%" stop-color="#c9871f"/><stop offset="100%" stop-color="#7c4a0f"/>
  </radialGradient>
  <linearGradient id="goldEdge" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#ffe9a8"/><stop offset="45%" stop-color="#e6a733"/>
    <stop offset="100%" stop-color="#8a5310"/>
  </linearGradient>
  <path id="petal" d="M0,-30 C7,-40 7,-64 0,-92 C-7,-64 -7,-40 0,-30 Z"
        fill="url(#goldEdge)" stroke="#6b3f0c" stroke-width="1.2"/>
  <!-- LION MEDALLION -->
  <g id="lion">
    <circle r="96" fill="none"/>
    <g>{petals(22)}</g>
    <circle r="58" fill="url(#gold)" stroke="#6b3f0c" stroke-width="3"/>
    <circle r="58" fill="none" stroke="#fff2c8" stroke-width="1" opacity=".5"/>
    <!-- ears -->
    <path d="M-40,-30 q-10,-22 8,-24 q4,14 -8,24 Z" fill="url(#gold)" stroke="#6b3f0c" stroke-width="2"/>
    <path d="M40,-30 q10,-22 -8,-24 q-4,14 8,24 Z" fill="url(#gold)" stroke="#6b3f0c" stroke-width="2"/>
    <!-- brow / eyes -->
    <ellipse cx="-18" cy="-10" rx="9" ry="6" fill="#3a250d"/>
    <ellipse cx="18" cy="-10" rx="9" ry="6" fill="#3a250d"/>
    <circle cx="-16" cy="-11" r="2.2" fill="#ffe9b0"/>
    <circle cx="20" cy="-11" r="2.2" fill="#ffe9b0"/>
    <!-- muzzle -->
    <path d="M0,-2 C22,-2 26,20 12,30 C6,36 -6,36 -12,30 C-26,20 -22,-2 0,-2 Z"
          fill="#e9be6e" stroke="#6b3f0c" stroke-width="2"/>
    <path d="M-11,10 h22" stroke="#6b3f0c" stroke-width="1" opacity=".5"/>
    <path d="M0,10 L-8,4 M0,10 L8,4" stroke="#6b3f0c" stroke-width="1.4" fill="none"/>
    <path d="M-9,14 q9,7 18,0" stroke="#3a250d" stroke-width="2.4" fill="none" stroke-linecap="round"/>
    <path d="M0,10 L0,20" stroke="#3a250d" stroke-width="1.6"/>
    <path d="M-7,15 q7,5 14,0" fill="#7c4a0f"/>
  </g>
  <!-- CORNER FLOURISH (acanthus scroll) -->
  <path id="flourish" d="M4,4 C46,6 70,20 78,50 C80,26 66,10 40,6
       C58,2 78,10 92,30 C86,8 62,-2 30,2 C20,3 10,3 4,4 Z"
       fill="url(#goldEdge)" stroke="#6b3f0c" stroke-width="1.3"/>
</defs>
</svg>'''

def card(art, name, sub, cost, atk, hp, rules, cls_extra="", ornament=""):
    return f'''
    <div class="wrap {cls_extra}">
      <div class="glow"></div>
      {ornament}
      <div class="card">
        <div class="cost">{cost}</div>
        <div class="window"><div class="art" style="background-image:url('{art}')"></div></div>
        <div class="plate"><div class="cname">{name}</div><div class="ctype">{sub}</div></div>
        <div class="rules">{rules}</div>
        <div class="atk">{atk}</div><div class="hp">{hp}</div>
        <div class="gem"></div>
      </div>
    </div>'''

# ornament HTML snippets ------------------------------------------------------
CREST = '''<svg class="orn crest" viewBox="-100 -100 200 200"><use href="#lion"/></svg>'''
THRONE = '''
  <svg class="orn throneL" viewBox="-100 -100 200 200"><use href="#lion"/></svg>
  <svg class="orn throneR" viewBox="-100 -100 200 200"><use href="#lion"/></svg>'''
ILLUM = '''
  <svg class="orn fl tl" viewBox="0 0 96 56"><use href="#flourish"/></svg>
  <svg class="orn fl tr" viewBox="0 0 96 56"><use href="#flourish"/></svg>
  <svg class="orn fl bl" viewBox="0 0 96 56"><use href="#flourish"/></svg>
  <svg class="orn fl br" viewBox="0 0 96 56"><use href="#flourish"/></svg>
  <svg class="orn illumBoss" viewBox="-100 -100 200 200"><use href="#lion"/></svg>'''

cards = [
  ("<span>Today</span> — plain gold frame", card(daniel, "Daniel", "Exile · Prophet · Legendary", 2, 2, 3,
        "Endure. Fulfill: survive an enemy turn while damaged.", "plain")),
  ("<b>A · Lion Crest</b> — medallion breaches the top", card(daniel, "Daniel", "Exile · Prophet · Legendary", 2, 2, 3,
        "Endure. Fulfill: survive an enemy turn while damaged.", "conceptA", CREST)),
  ("<b>B · Throne of Lions</b> — twin guardians (1 Kings 10)", card(davidk, "David the King", "Kingdom · Warrior · Legendary", 5, 6, 6,
        "Giant-Slayer. Your other units have +1 attack.", "conceptB", THRONE)),
  ("<b>C · Illuminated</b> — gilt corners breach outward", card(elijah, "Elijah", "Kingdom · Prophet · Legendary", 5, 4, 4,
        "Arrival: deal 3 to the strongest enemy. Legacy: leave the Mantle.", "conceptC", ILLUM)),
]

body = "".join(f'<figure>{c}<figcaption>{label}</figcaption></figure>' for label,c in cards)

HTML = f'''<!doctype html><html><head><meta charset="utf-8"><title>Legendary frame concepts</title>
<style>
:root{{color-scheme:dark}}
*{{box-sizing:border-box}}
body{{margin:0;font-family:'Segoe UI',system-ui,sans-serif;color:#e7dcc4;
  background:radial-gradient(120% 90% at 50% -10%,#241a10,#0e0a06 60%,#070503);min-height:100vh;padding:34px 20px 60px}}
h1{{font-family:Georgia,serif;font-weight:800;text-align:center;font-size:26px;letter-spacing:.5px;
  margin:0 0 4px;color:#ffd98a;text-shadow:0 2px 10px rgba(0,0,0,.7)}}
.sub{{text-align:center;color:#b8a888;max-width:640px;margin:0 auto 30px;font-size:14px;line-height:1.5}}
.row{{display:flex;gap:40px;justify-content:center;align-items:flex-start;flex-wrap:wrap;max-width:1200px;margin:0 auto}}
figure{{margin:0;text-align:center;width:236px}}
figcaption{{margin-top:26px;font-size:12.5px;color:#c8b790;line-height:1.4}}
figcaption b{{color:#ffd98a}} figcaption span{{color:#8c7f68}}

/* wrapper allows ornaments to breach the card rectangle */
.wrap{{position:relative;width:220px;height:300px;margin:34px auto 0;filter:drop-shadow(0 16px 26px rgba(0,0,0,.6))}}
.glow{{position:absolute;inset:-24px;border-radius:26px;z-index:0;pointer-events:none;
  background:radial-gradient(60% 55% at 50% 42%,rgba(255,170,60,.28),transparent 70%);opacity:0}}
.conceptA .glow,.conceptB .glow,.conceptC .glow{{opacity:1;animation:breathe 4.5s ease-in-out infinite}}
@keyframes breathe{{50%{{opacity:.62}}}}

.card{{position:absolute;inset:0;border-radius:16px;overflow:hidden;z-index:2;
  background:radial-gradient(120% 60% at 50% 100%,rgba(60,42,22,.5),transparent 70%),linear-gradient(180deg,#241a10,#160f07);
  box-shadow:0 0 0 4px #14100a}}
/* gold metal ring */
.card::after{{content:'';position:absolute;inset:0;border-radius:16px;padding:4px;pointer-events:none;
  background:linear-gradient(150deg,#ffe9a8,#f0a52e 42%,#8f5310);
  -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;
  mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);mask-composite:exclude;
  box-shadow:inset 0 0 0 1px rgba(0,0,0,.5),inset 0 0 12px rgba(255,255,255,.08)}}
.window{{position:absolute;top:9px;left:9px;right:9px;height:150px;border-radius:9px;overflow:hidden;z-index:1;
  box-shadow:0 0 0 2px #7a4e12,0 0 0 3px rgba(255,224,150,.45),inset 0 -26px 26px rgba(0,0,0,.45)}}
.art{{position:absolute;inset:0;background-size:cover;background-position:center 22%}}
.cost{{position:absolute;top:6px;left:6px;width:34px;height:34px;border-radius:50%;z-index:5;display:grid;place-items:center;
  font:800 18px Georgia;color:#3a2408;background:radial-gradient(circle at 35% 30%,#ffe6a6,#e6a33a 60%,#8a5410);
  box-shadow:0 0 0 2px #2a1c0c,0 0 0 3px rgba(255,220,150,.4),0 2px 5px rgba(0,0,0,.6)}}
.plate{{position:absolute;top:150px;left:14px;right:14px;z-index:4;text-align:center}}
.cname{{font:800 17px Georgia;color:#ffe9bd;text-shadow:0 1px 0 #000,0 2px 6px rgba(0,0,0,.8);letter-spacing:.3px}}
.ctype{{font-size:9px;letter-spacing:1.2px;text-transform:uppercase;color:#c39a54;margin-top:2px}}
.rules{{position:absolute;top:196px;left:16px;right:16px;bottom:16px;z-index:4;font-size:11.5px;line-height:1.42;
  color:#e9dcc0;text-align:center}}
.atk{{position:absolute;left:2px;bottom:2px;width:38px;height:38px;border-radius:50%;z-index:5;display:grid;place-items:center;
  font:800 19px Georgia;color:#fff;background:radial-gradient(circle at 35% 30%,#ffd27a,#c8801f 62%,#5a3208);
  box-shadow:0 0 0 2px #2a1c0c,0 2px 5px rgba(0,0,0,.6);text-shadow:0 1px 2px #000}}
.hp{{position:absolute;right:2px;bottom:2px;width:38px;height:38px;border-radius:50%;z-index:5;display:grid;place-items:center;
  font:800 19px Georgia;color:#fff;background:radial-gradient(circle at 35% 30%,#ff9a86,#b52f22 62%,#4a0f0a);
  box-shadow:0 0 0 2px #2a1c0c,0 2px 5px rgba(0,0,0,.6);text-shadow:0 1px 2px #000}}
.gem{{position:absolute;bottom:5px;left:50%;transform:translateX(-50%) rotate(45deg);width:15px;height:15px;z-index:5;
  background:linear-gradient(135deg,#ffe9a8,#e0902a);box-shadow:0 0 0 2px #2a1c0c,0 0 8px rgba(255,180,80,.7)}}

/* ---- ornaments (breach the card rectangle) ---- */
.orn{{position:absolute;z-index:6;pointer-events:none;filter:drop-shadow(0 3px 4px rgba(0,0,0,.55))}}
.crest{{width:104px;height:104px;top:-52px;left:50%;transform:translateX(-50%)}}
.throneL{{width:70px;height:70px;bottom:-16px;left:-24px;transform:rotate(-8deg)}}
.throneR{{width:70px;height:70px;bottom:-16px;right:-24px;transform:rotate(8deg) scaleX(-1)}}
.illumBoss{{width:60px;height:60px;top:-30px;left:50%;transform:translateX(-50%)}}
.fl{{width:74px;height:44px}}
.tl{{top:-14px;left:-14px}} .tr{{top:-14px;right:-14px;transform:scaleX(-1)}}
.bl{{bottom:-14px;left:-14px;transform:scaleY(-1)}} .br{{bottom:-14px;right:-14px;transform:scale(-1,-1)}}

/* gentle gold shimmer so it feels alive */
.conceptA .crest,.conceptB .throneL,.conceptB .throneR,.conceptC .illumBoss{{animation:glint 3.6s ease-in-out infinite}}
@keyframes glint{{0%,100%{{filter:drop-shadow(0 3px 4px rgba(0,0,0,.55)) brightness(1)}}50%{{filter:drop-shadow(0 3px 6px rgba(0,0,0,.55)) brightness(1.15)}}}}
.note{{max-width:1040px;margin:44px auto 0;padding:18px 22px;border:1px solid rgba(200,160,80,.25);border-radius:12px;
  background:rgba(30,22,12,.5);font-size:13px;line-height:1.6;color:#cbbb98}}
.note b{{color:#ffd98a}}
</style></head><body>
{LION_DEFS}
<h1>Legendary Frame — Lion Concepts</h1>
<div class="sub">Only Legendaries get this. The ornament <b>breaches the card rectangle</b> so the card reads as too big to be contained — the same trick Hearthstone uses with its dragon, done with a lion (Daniel's den, David's lion, Benaiah's pit, Solomon's throne).</div>
<div class="row">{body}</div>
<div class="note">
<b>A · Lion Crest</b> — a single regal lion medallion sits astride the top border, mane breaching upward; reads as a crown/sunburst. Boldest, most "chase-card." &nbsp;·&nbsp;
<b>B · Throne of Lions</b> — twin lion guardians flank the base, like the twelve lions on Solomon's throne (1 Kings 10:20); heraldic and grounded. &nbsp;·&nbsp;
<b>C · Illuminated</b> — gilt acanthus scrollwork breaches all four corners like an illuminated Bible page, with a small lion boss; the most "sacred manuscript" feel. <br><br>
The lion here is a stylized placeholder built in SVG. In production the lion (and filigree) would be a generated transparent-PNG asset dropped into this same breaching frame slot — the CSS system is what matters. All gold, animated shimmer + glow, reverent (no depicted holy figure). Pick a direction (or mix) and I'll build it into the real card component.
</div>
</body></html>'''

out = pathlib.Path("/tmp/claude-0/-home-user-Underdogs/6dea9569-c97d-5f3a-974b-4f16138f0d8b/scratchpad/legendary-concepts.html")
out.write_text(HTML)
print("wrote", out, len(HTML), "bytes")
