#!/usr/bin/env python3
"""Generate the battle-board backdrops — wide 16:9 painted playmats with the
tactile, dimensional depth of a Hearthstone board. One per scene (Elah, Eden,
Red Sea, Babylon). Writes raw PNG to ui/assets/boards/; convert to WebP after.

Usage:
    python3 gen_board.py            # all four (skips any that already exist)
    python3 gen_board.py elah       # just one (regenerates it)
"""
import os, sys, pathlib

ROOT = pathlib.Path(__file__).parent
# redirect the shared generator's output to ui/assets/boards BEFORE importing it
os.environ["CARDART_OUT"] = str((ROOT/'..'/'..'/'ui'/'assets'/'boards').resolve())
import gen_art  # noqa: E402

# --- board house style: a themed TCG battle-mat, scene worked INTO the surface -
BOARD_MASTER = (
    "A flat, straight-down top view (orthographic) of the PRINTED ARTWORK of a themed "
    "trading-card-game battle mat — the mat's surface design filling the entire frame "
    "edge to edge, like a texture or print file. Do NOT depict the mat as a physical "
    "object on a table: NO table, NO floor, NO room, NO tilt, NO perspective, NO "
    "vanishing point, NO drop shadow, NO rounded corners or visible outer mat edges — "
    "ONLY the mat's own surface art, seen perfectly flat from directly overhead. The "
    "themed scene is tooled and painted into the surface (worked leather, woven cloth, "
    "inlaid stone, hammered metal); there is NO sky and NO horizon. A rich decorative "
    "ornamental border of carved, gilded relief runs around all four inner edges, "
    "framing the field like a luxury playmat. One themed seam runs straight across "
    "the middle from left edge to right edge, dividing the field into two equal "
    "horizontal halves — an upper field and a lower field (a single horizontal split "
    "across the image; never a vertical split, never a diagonal split, never a "
    "quartered grid); each half is broad, flat and open where a single row of cards "
    "will be laid. The two open halves are plain, flat, unmarked ground — do NOT draw "
    "any card slots, placeholder rectangles, framed boxes, inset pictures, tiles or a "
    "printed board-game track on them; they are simply open surface. "
    "Slightly muted warm color so bright cards read on top; painterly "
    "brushwork, tactile relief, gold-leaf accents, soft even lighting. Historically-"
    "plausible ancient Near-Eastern theme. No people, no card frames, no UI, no modern "
    "objects, no visible face of God, no gore. Absolutely NO text, NO letters, NO "
    "words, NO numbers, NO labels and NO writing anywhere in the image. Full-bleed, "
    "edge to edge.")

TAIL = ("Flat top-down mat artwork filling the whole 16:9 frame; one horizontal seam "
        "across the middle, the upper and lower halves each open for a row of cards. "
        "No table, no perspective, no visible mat edges, and no lettering of any kind.")

BOARDS = {
    "elah": ("The Valley of Elah worked into the mat: a flat expanse of pale cracked "
             "sun-baked earth and sand strewn with smooth round brook-stones, a shallow "
             "stone-lined brook running left-to-right across the central seam that "
             "divides the field. The upper half bears the darker reddish ground, dark "
             "tents, bronze round shields and red war-banners (each bearing a pagan "
             "fish/Dagon or trident emblem, never a menorah, never a star) of the "
             "Philistine camp; the lower half the packed pale dirt, cream tents and "
             "cream banners (each bearing a seven-branched menorah lampstand emblem) "
             "of the Israelite side. "
             "Dry grass tufts and scattered rocks; the gilded border tooled with slings, "
             "shields and terebinth leaves."),
    "eden": ("East of Eden worked into the mat: a lush living surface of deep mossy "
             "greens and rich dark soil, curling vines, ferns and fallen golden fruit "
             "laid flat across the field, a winding stream running left-to-right along "
             "the central seam dividing an upper garden terrace from a lower one, a "
             "still mirror-pool to one side. Dew-bright, fertile, warm. The gilded "
             "border tooled with vines, fruit and coiled serpent motifs."),
    "redsea": ("The Red Sea Crossing worked into the mat: the exposed dry seabed floor "
               "of wet rippled sand, coral, shells and starfish laid flat, a pale sandy "
               "path running left-to-right along the central seam; the upper and lower "
               "edges of the mat are sculpted into cresting walls of held-back turquoise "
               "water that form the ornamental border, sunlight glinting through them. "
               "Deep sea-blue and dawn-gold, awe and suspended power."),
    "babylon": ("By the Rivers of Babylon worked into the mat: a surface of dark glazed "
                "indigo brick and inlaid ziggurat tilework, a broad flat band of dark "
                "still water threaded with thin amber lamp-light glints running left-to-"
                "right along the central seam dividing an upper terrace from a lower one, "
                "silent harps and trailing willow fronds laid flat across the field. NO "
                "sun, NO sunset, NO horizon, NO sky, NO glowing light source — only the "
                "flat overhead mat surface. Violet shadow with warm amber accents, "
                "melancholy and grand. The gilded border tooled with lions, palms and "
                "tiered-tower motifs."),
}

# --- HD path: Imagen 4 renders these at 2K (~2816x1536) vs flash-image's 1MP. ----
IMAGEN_MODEL = "imagen-4.0-ultra-generate-001"
IMAGEN_USD = 0.06  # ledger estimate for a 2K ultra render

def generate_imagen(bid, size="2K"):
    """Render one board via Imagen 4 Ultra at 2K and write board_<id>.png."""
    import json, base64, urllib.request, urllib.error
    prompt = f"{BOARD_MASTER} {BOARDS[bid]} {TAIL}"
    url = (f"https://generativelanguage.googleapis.com/v1beta/models/"
           f"{IMAGEN_MODEL}:predict?key={gen_art.KEY}")
    body = {"instances": [{"prompt": prompt}],
            "parameters": {"sampleCount": 1, "aspectRatio": "16:9", "sampleImageSize": size}}
    req = urllib.request.Request(url, data=json.dumps(body).encode(),
                                 headers={"Content-Type": "application/json"})
    d = json.load(urllib.request.urlopen(req, timeout=240))
    preds = d.get("predictions", [])
    if not preds or "bytesBase64Encoded" not in preds[0]:
        raise RuntimeError(f"{bid}: Imagen returned no image ({list((preds or [{}])[0].keys())})")
    out = gen_art.OUT / f"board_{bid}.png"
    out.write_bytes(base64.b64decode(preds[0]["bytesBase64Encoded"]))
    l = gen_art._ledger_load()
    l["images"] += 1; l["usd"] += IMAGEN_USD
    l.setdefault("runs", []).append({"id": f"board_{bid}", "cls": "board",
                                     "model": IMAGEN_MODEL, "usd": IMAGEN_USD})
    gen_art._ledger_save(l)
    bl = gen_art.budget_left(l)
    print(f"[ok] board_{bid:12s} {IMAGEN_MODEL} {size}  ~${IMAGEN_USD:.3f}"
          + (f"   (${bl:.4f} left of ${l['budget_usd']:.2f})" if bl is not None else ""))
    return out

def one(bid, hd=True):
    if hd: generate_imagen(bid)
    else: gen_art.generate(f"board_{bid}", BOARDS[bid], cls="neutral",
                           style=BOARD_MASTER, tail=TAIL, aspect="16:9")

if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    lofi = "--lofi" in sys.argv[1:]        # use the 1MP flash-image path instead
    want = args or list(BOARDS)
    for bid in want:
        if bid not in BOARDS:
            print(f"[skip] unknown board '{bid}' (have: {', '.join(BOARDS)})"); continue
        one(bid, hd=not lofi)
    l = gen_art._ledger_load(); bl = gen_art.budget_left(l)
    print(f"\nboards done. ledger: {l['images']} imgs, est ${l['usd']:.4f}"
          + (f"  (${bl:.4f} left of ${l['budget_usd']:.2f})" if bl is not None else ""))
