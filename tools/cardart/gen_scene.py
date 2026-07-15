#!/usr/bin/env python3
"""Menu/title "living painting" scenes.
  base   : Imagen 4 Ultra 2K cinematic backdrop  -> ui/assets/scenes/<id>.png
  overlay: a glowing element on PURE BLACK (flash-image), luminance-keyed to a
           transparent PNG -> ui/assets/scenes/overlays/<id>.png (RGBA)
Usage:
  python3 gen_scene.py base <id>       # e.g. base reeds
  python3 gen_scene.py overlay <id>    # e.g. overlay fireflies
"""
import os, sys, json, base64, urllib.request, pathlib
from PIL import Image, ImageChops
import gen_art  # ledger + KEY

ROOT = pathlib.Path(__file__).parent
OUT  = (ROOT/'..'/'..'/'ui'/'assets'/'scenes').resolve(); OUT.mkdir(parents=True, exist_ok=True)
OVR  = (OUT/'overlays'); OVR.mkdir(parents=True, exist_ok=True)

# --- cinematic menu key-art (we WANT depth/atmosphere here, unlike the flat mats) ---
SCENE_MASTER = (
    "Cinematic painterly digital illustration — lavish key-art menu backdrop for a "
    "premium Scripture fantasy trading-card game. Rich atmospheric depth with a clear "
    "foreground, midground and hazy distance (built for parallax). Warm rim lighting, "
    "soft volumetric light rays, drifting particles, deep cinematic shadow, gold-leaf "
    "accents, confident painterly brushwork, awe and reverence. Historically-plausible "
    "ancient Near-Eastern setting. Keep the upper-middle calm and uncluttered (open sky "
    "or haze). Absolutely NO text, NO letters, NO words, NO title, NO lettering, NO "
    "watermark anywhere. No UI, no card frames, no modern objects, no visible face of "
    "God, no gore. Full-bleed 16:9, edge to edge.")

SCENES = {
    "reeds": ("Baby Moses's woven papyrus basket adrift among tall Nile reeds and lotus "
              "at golden dawn; low mist over still water, a heron standing, dragonflies and "
              "fireflies, distant palms and hazy pyramids on the horizon, warm shafts of "
              "light slanting through the reeds. Green-gold, tranquil, expectant."),
    "coat": ("EXTREME CLOSE-UP of the fabric of Joseph's coat of many colours, the rich "
             "cloth filling the ENTIRE frame edge to edge as a full-bleed background "
             "texture — a luxurious hand-woven textile of bold jewel-toned vertical "
             "stripes (crimson, sapphire, gold, emerald, violet, saffron), lustrous silk "
             "sheen, ornate gold-thread embroidery and small inlaid gemstones along the "
             "seams, deep soft folds and drape catching warm raking light with pooled "
             "shadow between the folds. NO landscape, NO horizon, NO sky, NO person, NO "
             "object — ONLY the sumptuous cloth itself, seen up close, soft shallow "
             "depth-of-field. Warm, opulent, tactile."),
    "elah": ("The Valley of Elah at sunrise from a high vantage: golden hills, a stony "
             "brook winding below, scattered terebinth trees, two distant war-camps facing "
             "off, mist in the low ground, a lone sling-stone glinting in the foreground. "
             "Tense, epic, the calm before a duel."),
    "redsea": ("The parted Red Sea: two towering glassy walls of held-back turquoise water "
               "framing a dry seabed corridor that runs to a bright horizon, spray and mist "
               "catching light, a pillar of cloud-fire in the distance, shells and coral on "
               "the wet sand. Awe, suspended power."),
}

# --- glowing overlay elements, generated on PURE BLACK for luminance keying ---
OVERLAY_MASTER = (
    "on a PURE SOLID BLACK background, nothing else in the frame, no scenery, no ground, "
    "no horizon — only the glowing subject floating in black, so it can be composited. "
    "Soft painterly glow, warm light, high contrast against the black. 16:9.")
OVERLAYS = {
    "fireflies": "a scattering of ~40 small warm-golden glowing fireflies and drifting light motes of varying size",
    "embers": "a rising drift of orange-gold embers and sparks with soft glow",
    "godrays": "a few soft diagonal shafts of warm volumetric light",
    "spray": "a fine mist of pale blue-white water spray and droplets catching light",
    "mist": "soft drifting low fog and mist, wispy and translucent, pale warm-white",
    "bokeh": "a scattering of large soft heavily-blurred out-of-focus warm-golden glowing "
             "bokeh circles and light orbs of widely varying size, dreamy depth-of-field, "
             "the biggest orbs near the edges",
}

def _imagen(prompt, size="2K"):
    url = ("https://generativelanguage.googleapis.com/v1beta/models/"
           f"imagen-4.0-ultra-generate-001:predict?key={gen_art.KEY}")
    body = {"instances": [{"prompt": prompt}],
            "parameters": {"sampleCount": 1, "aspectRatio": "16:9", "sampleImageSize": size}}
    req = urllib.request.Request(url, data=json.dumps(body).encode(), headers={"Content-Type": "application/json"})
    d = json.load(urllib.request.urlopen(req, timeout=240))
    p = d["predictions"][0]
    return base64.b64decode(p["bytesBase64Encoded"])

def _ledger(tag, usd=0.06):
    l = gen_art._ledger_load(); l["images"] += 1; l["usd"] += usd
    l.setdefault("runs", []).append({"id": tag, "cls": "scene", "usd": usd}); gen_art._ledger_save(l)
    bl = gen_art.budget_left(l)
    print(f"[ok] {tag}  ~${usd:.3f}" + (f"   (${bl:.4f} left of ${l['budget_usd']:.2f})" if bl is not None else ""))

def base(sid):
    raw = _imagen(f"{SCENE_MASTER} {SCENES[sid]}")
    (OUT/f"{sid}.png").write_bytes(raw); _ledger(f"scene_{sid}")

def overlay(oid):
    # flash-image is fine (and cheaper) for a glow-on-black sprite
    gen_art.generate(f"_ovr_{oid}", OVERLAYS[oid], cls="neutral",
                     style=OVERLAY_MASTER, tail="", aspect="16:9")
    src = gen_art.OUT/f"_ovr_{oid}.png"          # gen_art writes to ui/assets/cards by default
    im = Image.open(src).convert("RGB")
    # luminance key: alpha = max(r,g,b) so black -> transparent, glow -> opaque
    # (additive-style compositing — perfect for embers/fireflies/light on black)
    r, g, b = im.split()
    alpha = ImageChops.lighter(ImageChops.lighter(r, g), b)
    out = Image.merge("RGBA", (r, g, b, alpha))
    out.save(OVR/f"{oid}.png"); src.unlink(missing_ok=True)
    print(f"[key] overlays/{oid}.png  ({im.size[0]}x{im.size[1]} RGBA)")

if __name__ == "__main__":
    mode, ident = sys.argv[1], sys.argv[2]
    (base if mode == "base" else overlay)(ident)
