"""Store-cover key art (itch.io etc.) via Gemini 3 Pro Image.

Usage: python3 gen_cover.py <variant>   -> tools/cardart/covers/cover_<variant>.png
Composed for a 630x500 cover: subject in the lower two-thirds, calm sky above
for the wordmark (which is overlaid in HTML, never painted). Build-time only."""
import base64, json, sys, urllib.request
from pathlib import Path
import gen_art

OUT = Path(__file__).parent / "covers"
OUT.mkdir(exist_ok=True)

MASTER = (
    "Cinematic painterly digital illustration, premium fantasy trading-card-game key art "
    "and box-cover painting. Confident painterly brushwork, rich warm palette of gold, "
    "amber and deep shadow, dramatic rim lighting, volumetric light, drifting dust motes, "
    "epic scale and a sense of awe. Historically-plausible ancient Near-Eastern setting. "
    "The upper third of the image is calm luminous sky with soft clouds and nothing else. "
    "Absolutely NO text, NO letters, NO words, NO title, NO logo, NO lettering, NO "
    "watermark, NO frame, NO border anywhere. No gore, no blood."
)
VARIANTS = {
    "slinger": (
        "Low heroic camera angle in the Valley of Elah at golden hour. In the foreground, "
        "seen from behind and slightly to the side, a slight young shepherd boy in a simple "
        "rough tunic stands planted on a rocky rise, whirling a leather sling over his head, "
        "a small shepherd's bag at his hip. Far across the valley, towering colossal and "
        "dark against the blazing low sun, a giant armored warrior with a huge bronze helmet "
        "and an enormous spear, silhouetted, rim-lit in gold. A dry stream bed of smooth "
        "stones between them. The scale contrast is enormous: the boy is small, the giant "
        "fills the middle distance."
    ),
    "standoff": (
        "Dramatic symmetrical standoff composition. Bottom-left foreground: a young shepherd "
        "boy, small, in a simple tunic, holding a sling loosely at his side, looking up, "
        "lit warmly. Right side, looming from the middle ground up into the frame: a "
        "colossal armored giant in scale bronze armor and crested helmet, shadowed, a spear "
        "like a weaver's beam, his outline catching gold rim light. Between them a valley "
        "floor of pale stones and drifting dust. Two distant armies on the hillsides as tiny "
        "banners. Warm sunset sky above."
    ),
    "stone": (
        "Heroic close-medium shot from a low angle: a young shepherd boy kneels at a sparkling "
        "brook choosing one smooth stone, the stone catching a gleam of golden light in his "
        "open palm, his sling draped over his shoulder. Behind him and far above, enormous and "
        "out of focus in the hazy distance, the dark silhouette of a giant armored warrior "
        "with a great spear against a blazing golden sky. Shallow depth of field, the boy "
        "sharp, the giant softened by haze."
    ),
}

def render(prompt):
    """Gemini 3 Pro Image (Imagen 4 was retired on this account)."""
    url = ("https://generativelanguage.googleapis.com/v1beta/models/"
           f"gemini-3-pro-image:generateContent?key={gen_art.KEY}")
    body = {"contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"responseModalities": ["IMAGE"],
                                 "imageConfig": {"aspectRatio": "4:3", "imageSize": "2K"}}}
    req = urllib.request.Request(url, data=json.dumps(body).encode(),
                                 headers={"Content-Type": "application/json"})
    d = json.load(urllib.request.urlopen(req, timeout=300))
    for part in d["candidates"][0]["content"]["parts"]:
        if "inlineData" in part:
            return base64.b64decode(part["inlineData"]["data"])
    raise RuntimeError(f"no image returned: {json.dumps(d)[:400]}")

def ledger(tag, usd=0.134):
    l = gen_art._ledger_load(); l["images"] += 1; l["usd"] += usd
    l.setdefault("runs", []).append({"id": tag, "cls": "cover", "usd": usd}); gen_art._ledger_save(l)
    print(f"[ok] {tag}  ~${usd:.2f}   (${gen_art.budget_left(l):.2f} left)")

if __name__ == "__main__":
    v = sys.argv[1]
    (OUT / f"cover_{v}.png").write_bytes(render(f"{MASTER} {VARIANTS[v]}"))
    ledger(f"cover_{v}")
