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
    "framing the field like a luxury playmat. The field is split across the middle by "
    "a themed HORIZONTAL seam running left to right into a TOP territory and a BOTTOM "
    "territory (not a left/right split); each half is broad, flat and open where a "
    "single row of cards will be laid. Slightly muted warm color so bright cards read "
    "on top; painterly brushwork, tactile relief, gold-leaf accents, soft even "
    "lighting. Historically-plausible ancient Near-Eastern theme. No people, no text, "
    "no card frames, no UI, no modern objects, no visible face of God, no gore. "
    "Full-bleed, edge to edge.")

TAIL = ("Flat top-down mat artwork filling the whole 16:9 frame; a horizontal seam "
        "splits a top half and a bottom half, each open for one row of cards. "
        "No table, no perspective, no visible mat edges.")

BOARDS = {
    "elah": ("The Valley of Elah worked into the mat: a flat expanse of pale cracked "
             "sun-baked earth and sand strewn with smooth round brook-stones, a shallow "
             "stone-lined brook running left-to-right across the central seam that "
             "divides the field. The top half bears the darker ground and bronze-and-"
             "scarlet standards of the Philistine camp; the bottom half the packed dirt, "
             "tent-stakes and pale banners of the Israelite side. Dry grass tufts and "
             "scattered rocks; the gilded border tooled with slings, shields and "
             "terebinth leaves."),
    "eden": ("East of Eden worked into the mat: a lush living surface of deep mossy "
             "greens and rich dark soil, curling vines, ferns and fallen golden fruit "
             "laid flat across the field, a winding stream running left-to-right along "
             "the central seam dividing a top garden terrace from a bottom one, a still "
             "mirror-pool to one side. Dew-bright, fertile, warm. The gilded border "
             "tooled with vines, fruit and coiled serpent motifs."),
    "redsea": ("The Red Sea Crossing worked into the mat: the exposed dry seabed floor "
               "of wet rippled sand, coral, shells and starfish laid flat, a pale sandy "
               "path running left-to-right along the central seam; the TOP and BOTTOM "
               "edges of the mat are sculpted into cresting walls of held-back turquoise "
               "water that form the ornamental border, sunlight glinting through them. "
               "Deep sea-blue and dawn-gold, awe and suspended power."),
    "babylon": ("By the Rivers of Babylon worked into the mat: a surface of dark glazed "
                "indigo brick and inlaid ziggurat tilework, a broad slow river of lamp-"
                "amber reflections running left-to-right along the central seam dividing "
                "a top terrace from a bottom one, silent harps and trailing willow fronds "
                "laid across the field. Violet shadow with warm amber accents, melancholy "
                "and grand. The gilded border tooled with lions, palms and tiered-tower "
                "motifs."),
}

def one(bid):
    gen_art.generate(f"board_{bid}", BOARDS[bid], cls="neutral",
                     style=BOARD_MASTER, tail=TAIL, aspect="16:9")

if __name__ == "__main__":
    want = sys.argv[1:] or list(BOARDS)
    for bid in want:
        if bid not in BOARDS:
            print(f"[skip] unknown board '{bid}' (have: {', '.join(BOARDS)})"); continue
        out = gen_art.OUT / f"board_{bid}.png"
        if out.exists() and len(sys.argv) <= 1:   # bare run is idempotent
            print(f"[skip] board_{bid} exists"); continue
        one(bid)
    l = gen_art._ledger_load(); bl = gen_art.budget_left(l)
    print(f"\nboards done. ledger: {l['images']} imgs, est ${l['usd']:.4f}"
          + (f"  (${bl:.4f} left of ${l['budget_usd']:.2f})" if bl is not None else ""))
