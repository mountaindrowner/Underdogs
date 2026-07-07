#!/usr/bin/env python3
"""Data-driven COVENANT card compositor: card JSON + art PNG -> full-card HTML.
Reproducible for every card. Frame per docs/05-art-direction.md."""
import base64, json, pathlib, html, sys

ROOT = pathlib.Path(__file__).parent
OUT  = ROOT / "out"

CLASS_ACCENT = {  # (deep, bright) border/plate tones per class palette
    "warrior":  ("#7d2018", "#c8452e"),   # bronze & scarlet
    "prophet":  ("#1f3a63", "#e8781f"),   # storm-blue & fire-orange
    "priest":   ("#8a7423", "#3f6fa8"),   # white-gold & incense-blue
    "shepherd": ("#2f6b3c", "#cbb98a"),   # dawn-green & wool-cream
    "patriarch":("#2b2a63", "#c9a86a"),   # starfield-indigo & desert-tan
    "disciple": ("#8a2a12", "#e0a02a"),   # flame-red & amber
    "neutral":  ("#5a4a2c", "#b9975a"),
    "adversary":("#171a20", "#3c4654"),   # cold iron & slate — clearly "other"
}
RARITY = {"common":"#c9c9c9","rare":"#3f7fd6","epic":"#9b4fd0","legendary":"#f0912b",
          "token":"#c9c9c9","adversary":"#8f3b34"}
TAG_SIGIL = {"genesis":"✶","exodus":"𐤀","judges":"⚖","kingdom":"♛",
             "exile":"⛓","apostles":"✝","":""}

def data_uri(p):
    return "data:image/png;base64," + base64.b64encode(pathlib.Path(p).read_bytes()).decode()

def build(card, art_png):
    deep, bright = CLASS_ACCENT.get(card["class"], CLASS_ACCENT["neutral"])
    rar = RARITY.get(card.get("rarity","common"), "#c9c9c9")
    sigil = TAG_SIGIL.get(card.get("tag") or "", "")
    is_minion = card.get("type") == "minion"
    is_leader = card.get("type") == "leader"
    is_adversary = card.get("class") == "adversary"
    legendary = card.get("rarity") == "legendary"
    art = data_uri(art_png)
    name = html.escape(card.get("name") or "")
    text = html.escape(card.get("text") or "")
    flavor = html.escape(card.get("flavor") or "")
    if is_leader:
        tag_lbl = "HERO POWER"
    elif is_adversary:
        tag_lbl = "BOSS" if card.get("boss") else "ADVERSARY"
    else:
        tag_lbl = (card.get("tag") or "").capitalize()

    T = """<!doctype html><html><head><meta charset=utf-8><style>
:root{--deep:@DEEP@;--bright:@BRIGHT@;--gold:#f4cf6a;--gold2:#a9791f;
       --parch:#efe2c0;--ink:#33240f;--rar:@RAR@;
  --noise:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='90' height='90'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  --wear:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='w'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.012 0.02' numOctaves='3' seed='7' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23w)'/%3E%3C/svg%3E");}
*{margin:0;box-sizing:border-box}
body{background:#1b1b1b;display:flex;padding:40px}
/* ---- outer gold frame: chunky, uneven, carved ---- */
.card{position:relative;width:500px;height:722px;font-family:'Palatino Linotype',Georgia,serif;
  border-radius:44px 37px 41px 47px;
  background:
    radial-gradient(68% 48% at 27% 12%, rgba(255,255,255,.38), transparent 55%),
    radial-gradient(85% 72% at 80% 93%, rgba(58,37,9,.6), transparent 60%),
    radial-gradient(120% 92% at 50% -12%, #ffedb0, var(--gold) 30%, var(--gold2) 66%, #493206 100%);
  box-shadow:
    0 28px 58px rgba(0,0,0,.78),
    inset 0 3px 3px rgba(255,250,220,.9),      /* top edge highlight */
    inset 0 -9px 14px rgba(40,25,5,.92),        /* bottom edge shade */
    inset 0 0 0 4px #38260b;                     /* dark outer edge */
  padding:23px 21px 25px;}
.card::after{content:'';position:absolute;inset:0;border-radius:inherit;pointer-events:none;
  background:var(--wear);background-size:300px;opacity:.10;mix-blend-mode:multiply;}
/* red inner frame: deep, uneven, worn, dark crease at the gold seam */
.bezel{position:absolute;inset:16px;border-radius:32px 26px 29px 34px;overflow:hidden;
  background:
    radial-gradient(72% 52% at 30% 16%, rgba(255,255,255,.13), transparent 60%),
    radial-gradient(88% 76% at 76% 92%, rgba(0,0,0,.46), transparent 62%),
    linear-gradient(158deg,var(--bright),var(--deep) 74%);
  border:3px solid #1c0b04;                      /* dark crease where gold meets red */
  box-shadow:
    inset 0 0 0 2px rgba(255,224,150,.28),
    inset 0 5px 7px rgba(255,255,255,.12),
    inset 0 -16px 30px rgba(0,0,0,.66),          /* deep bottom recess */
    inset 0 0 66px rgba(0,0,0,.52);}
.bezel::before{content:'';position:absolute;inset:0;background:var(--grain,var(--noise));
  background-size:160px;opacity:.15;mix-blend-mode:overlay;pointer-events:none;}
.bezel::after{content:'';position:absolute;inset:0;background:var(--wear);background-size:280px;
  opacity:.16;mix-blend-mode:multiply;pointer-events:none;}
/* ---- carved arched (cathedral) art window ---- */
.art{position:absolute;left:37px;right:37px;top:44px;height:320px;
  border-radius:120px 120px 20px 20px / 86px 86px 20px 20px;
  background:#000 center/cover no-repeat url('@ART@');
  box-shadow:
    inset 0 0 0 4px #201305,                     /* inner dark groove */
    inset 0 0 0 9px var(--gold2),                /* gold band */
    inset 0 0 0 13px #150c04,                     /* outer dark rim */
    inset 0 12px 26px rgba(0,0,0,.62),            /* recessed top shadow */
    inset 0 3px 4px rgba(255,255,255,.16),        /* rim catch-light */
    0 8px 18px rgba(0,0,0,.6);}
/* ---- mana gem: modest size, strong jewel, dark socket ---- */
.cost{position:absolute;left:1px;top:1px;width:84px;height:84px;transform:rotate(45deg);
  border-radius:20px;z-index:8;                        /* above the rarity trim ring — no line cuts it */
  background:radial-gradient(circle at 42% 34%,#eac467,#6b4310 78%,#3a2406);  /* gold socket (base) */
  border:3px solid #2a1806;
  box-shadow:0 5px 12px rgba(0,0,0,.72),
    inset 0 2px 3px rgba(255,228,155,.85),inset 0 -5px 9px rgba(0,0,0,.6);}
.cost::before{content:'';position:absolute;inset:8px;border-radius:13px;    /* vivid blue jewel, ON TOP of socket */
  background:
    linear-gradient(135deg,rgba(255,255,255,.8),transparent 40%),
    radial-gradient(circle at 33% 26%,#8ad0ff,#1f80f6 38%,#0b49c6 68%,#062a88);
  box-shadow:
    inset 0 4px 9px rgba(255,255,255,.95),
    inset 0 -9px 15px rgba(3,14,72,.9),
    inset 0 0 0 1px rgba(160,210,255,.75),           /* bright facet edge */
    0 1px 3px rgba(0,0,0,.5);}
.cost span{position:absolute;inset:0;z-index:2;display:flex;align-items:center;justify-content:center;
  transform:rotate(-45deg);font-size:44px;font-weight:800;color:#fff;
  text-shadow:0 2px 0 #052a72,0 0 7px rgba(0,0,0,.85);}
/* ==== TITLE BANNER — reusable raised ribbon plaque ====================
   Recolor per card type by overriding --bnr-hi / --bnr-lo / --bnr-tab.
   Shape, gold trim, bevel, texture and shadow stay constant.
   .plate = antique-gold trim base; .pface = burgundy face on top.       */
.plate{position:absolute;left:18px;right:18px;top:343px;height:52px;z-index:6;
  --bnr-hi:#8a352e;--bnr-lo:#4a1815;--bnr-tab:#360f0c;   /* deep burgundy default */
  display:flex;align-items:center;justify-content:center;
  background:linear-gradient(180deg,#f6da8c,#bd8f36 52%,#6d4d13);      /* gold trim base */
  clip-path:polygon(6% 18%,11% 5%,50% 0,89% 5%,94% 18%,100% 50%,94% 82%,89% 95%,50% 100%,11% 95%,6% 82%,0 50%);
  filter:drop-shadow(0 10px 9px rgba(0,0,0,.6));}                       /* cast shadow beneath */
.pface{position:absolute;inset:3px;z-index:2;                          /* burgundy plaque face */
  background:
    linear-gradient(180deg,rgba(255,228,182,.16),rgba(0,0,0,.05) 45%,rgba(0,0,0,.28)),
    linear-gradient(180deg,var(--bnr-hi),var(--bnr-lo));
  clip-path:polygon(6% 18%,11% 5%,50% 0,89% 5%,94% 18%,100% 50%,94% 82%,89% 95%,50% 100%,11% 95%,6% 82%,0 50%);
  box-shadow:
    inset 0 2px 0 rgba(246,218,140,.85),           /* top gold trim line */
    inset 0 -2px 0 rgba(196,146,58,.7),             /* bottom gold trim line */
    inset 0 5px 6px rgba(255,216,168,.26),          /* inner top highlight (bevel) */
    inset 0 -9px 13px rgba(0,0,0,.5);}              /* inner bottom shade */
.pface::after{content:'';position:absolute;inset:0;background:var(--wear);background-size:140px;
  opacity:.18;mix-blend-mode:multiply;              /* subtle leather/parchment grain */
  clip-path:polygon(6% 18%,11% 5%,50% 0,89% 5%,94% 18%,100% 50%,94% 82%,89% 95%,50% 100%,11% 95%,6% 82%,0 50%);}
.tab{position:absolute;top:9px;width:36px;height:34px;z-index:1;        /* folded ribbon ends */
  background:linear-gradient(180deg,var(--bnr-lo),var(--bnr-tab));
  box-shadow:0 6px 7px rgba(0,0,0,.55);}
.tabL{left:-16px;clip-path:polygon(0 0,100% 16%,80% 50%,100% 84%,0 100%);
  border-left:2px solid rgba(246,218,140,.55);}
.tabR{right:-16px;clip-path:polygon(100% 0,0 16%,20% 50%,0 84%,100% 100%);
  border-right:2px solid rgba(246,218,140,.55);}
.plate b{position:relative;z-index:3;font-size:27px;color:#fff6df;letter-spacing:.3px;font-weight:700;
  -webkit-text-stroke:.6px rgba(48,12,8,.55);
  text-shadow:0 2px 2px rgba(0,0,0,.85),0 0 5px rgba(0,0,0,.5);white-space:nowrap;}
/* legendary-only name flourish (crown flanking the title) */
.fl{position:relative;z-index:3;display:none;}
.r-legendary .fl{display:inline-block;width:26px;margin:0 6px;text-align:center;
  font-size:23px;color:#ffe79a;text-shadow:0 1px 2px rgba(0,0,0,.85),0 0 8px rgba(255,201,92,.85);}
.r-legendary .fl-l::before,.r-legendary .fl-r::before{content:'♛';}
/* ==== RARITY STYLE LAYER — additive only; art window & stats never move ====
   Common: plain. Rare/Epic/Legendary escalate gem, trim ring, art & banner glow. */
/* leaders: no cost gem, no stat gems (hero avatar, not a stat card) */
.leader .cost{display:none;}
.r-common{--acc:transparent;--accs:transparent;}
.r-rare{--acc:#5a93e6;--accs:rgba(90,147,230,.55);}
.r-epic{--acc:#a962da;--accs:rgba(169,98,218,.6);}
.r-legendary{--acc:#f2ba4e;--accs:rgba(242,186,78,.6);}
/* secondary trim ring, seated in the uniform gold border (never crosses art/text) */
.orn{position:absolute;inset:8px;border-radius:39px 33px 36px 41px;pointer-events:none;z-index:1;}
.r-rare .orn{box-shadow:0 0 0 2px var(--acc),0 0 6px 1px var(--accs);}
.r-epic .orn{box-shadow:0 0 0 2px var(--acc),0 0 8px 2px var(--accs);}
.r-legendary .orn{box-shadow:0 0 0 2px var(--acc),0 0 11px 2px var(--accs);}
/* accent trim + glow hugging the art window (drawn on the frame, not over the art) */
.art::after{content:'';position:absolute;inset:0;border-radius:inherit;pointer-events:none;
  box-shadow:0 0 0 2px var(--acc,transparent),0 0 14px 3px var(--accs,transparent);}
/* banner accent glow, escalating */
.r-rare .plate,.r-epic .plate{filter:drop-shadow(0 10px 9px rgba(0,0,0,.6)) drop-shadow(0 0 4px var(--accs));}
.r-legendary .plate{filter:drop-shadow(0 10px 9px rgba(0,0,0,.6)) drop-shadow(0 0 7px var(--accs));}
.rarity{position:absolute;top:404px;left:50%;transform:translateX(-50%);z-index:6;
  display:flex;align-items:center;gap:8px;}
.dot{width:15px;height:15px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff,var(--rar));
  box-shadow:0 0 0 2px #2a1c07,0 1px 4px rgba(0,0,0,.5),0 0 6px var(--rar);}
.tag{font-size:13px;letter-spacing:2px;text-transform:uppercase;color:#f0e2bd;
  text-shadow:0 1px 2px #000;font-weight:700;}
/* ---- text box: parchment, stained edges, deep inner shadow ---- */
.box{position:absolute;left:31px;right:31px;top:428px;bottom:98px;border-radius:16px 16px 14px 14px;
  overflow:hidden;
  background:radial-gradient(120% 100% at 50% 0%,#f9f0d4,#e6d2a0 66%,#cfb87f 100%);
  box-shadow:
    inset 0 0 0 3px var(--gold2),
    inset 0 0 0 5px #241606,
    inset 0 8px 16px rgba(100,66,16,.55),          /* soft inner shadow */
    inset 0 0 48px rgba(110,64,18,.46);            /* stained edges */
  padding:16px 20px;text-align:center;display:flex;flex-direction:column;justify-content:center;}
.box::before{content:'';position:absolute;inset:0;background:var(--wear);background-size:230px;
  opacity:.14;mix-blend-mode:multiply;pointer-events:none;}
.sigil{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
  font-size:200px;color:rgba(90,60,20,.06);pointer-events:none;}
.rules{position:relative;font-size:28px;line-height:1.24;color:var(--ink);font-weight:600;}
.flav{position:relative;margin-top:9px;font-size:14px;font-style:italic;color:#6b5327;line-height:1.26;}
/* ---- stats: seated fantasy medallions, not buttons ---- */
.att,.hp{position:absolute;bottom:0;width:100px;height:100px;z-index:7;
  align-items:center;justify-content:center;font-size:47px;font-weight:800;color:#fff;
  border:4px solid #150c03;                        /* thick dark rim */
  text-shadow:0 2px 0 rgba(0,0,0,.72),0 0 7px rgba(0,0,0,.6);display:@STAT@;}
.att{left:0;
  background:
    radial-gradient(circle at 50% 128%, rgba(0,0,0,.55), transparent 52%),
    radial-gradient(circle at 40% 32%,#ffe6a0,#d3961f 46%,#7a4a0b 82%,#472b06);
  border-radius:54% 46% 50% 16% / 50% 50% 52% 18%; /* organic badge, pointed inner corner */
  box-shadow:
    inset 0 4px 6px rgba(255,255,255,.55),
    inset 0 -14px 20px rgba(0,0,0,.68),
    0 10px 18px rgba(0,0,0,.78),
    0 0 0 3px var(--gold2), 0 0 0 7px #241606;}     /* gold + dark seat rings */
.hp{right:0;
  background:
    radial-gradient(circle at 50% 128%, rgba(0,0,0,.55), transparent 52%),
    radial-gradient(circle at 40% 32%,#ff9d8b,#c8271d 46%,#6a0f09 82%,#3c0604);
  border-radius:46% 54% 16% 50% / 50% 50% 18% 52%;
  box-shadow:
    inset 0 4px 6px rgba(255,255,255,.45),
    inset 0 -14px 20px rgba(0,0,0,.68),
    0 10px 18px rgba(0,0,0,.78),
    0 0 0 3px var(--gold2), 0 0 0 7px #241606;}
</style></head><body>
<div class="card @RARCLASS@" id=card>
  <div class=bezel></div>
  <div class=orn></div>
  <div class=art></div>
  <div class=cost><span>@COST@</span></div>
  <div class=plate><i class="tab tabL"></i><i class="tab tabR"></i><span class=pface></span><span class="fl fl-l"></span><b>@NAME@</b><span class="fl fl-r"></span></div>
  <div class=rarity><span class=dot></span><span class=tag>@TAG@</span></div>
  <div class=box>
    <div class=sigil>@SIGIL@</div>
    <div class=rules>@TEXT@</div>
    <div class=flav>@FLAV@</div>
  </div>
  <div class=att>@ATT@</div>
  <div class=hp>@HP@</div>
</div></body></html>"""
    repl = {
        "@DEEP@": deep, "@BRIGHT@": bright, "@RAR@": rar, "@ART@": art,
        "@RARCLASS@": "r-" + card.get("rarity", "common") + (" leader" if is_leader else ""),
        "@STAT@": "flex" if is_minion else "none",
        "@COST@": str(card.get("cost","")),
        "@NAME@": name, "@TAG@": tag_lbl, "@SIGIL@": sigil,
        "@TEXT@": text, "@FLAV@": flavor,
        "@ATT@": str(card.get("attack","")) if is_minion else "",
        "@HP@":  str(card.get("health","")) if is_minion else "",
    }
    for k, v in repl.items():
        T = T.replace(k, v)
    return T

if __name__ == "__main__":
    card = json.loads(pathlib.Path(sys.argv[1]).read_text())
    art  = sys.argv[2]
    out  = sys.argv[3]
    pathlib.Path(out).write_text(build(card, art))
    print("wrote", out)
