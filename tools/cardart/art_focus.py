"""Find each illustration's focal point (build-time) -> ui/src/artFocus.json.

Every card painting is landscape, but most game surfaces show it through a
portrait window, so only a slice is visible. A vision model reports where the
main character's face (or, if there is none, the main subject) sits; the game
positions art so that point lands in view (ui/src/data.ts artStyle).

Output: { "<id>": [fx, fy, aspect] } with fx/fy in 0..1 of the image.
Usage: python3 art_focus.py            (all art; reuses cached entries)
       python3 art_focus.py --redo id1 id2 ...
"""
import base64, json, subprocess, sys, urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import gen_art

ROOT = Path(__file__).resolve().parents[2]
DIRS = ["cards", "leaders", "adversaries", "tokens"]
OUT = ROOT / "ui" / "src" / "artFocus.json"
MODEL = "gemini-2.5-flash"
PROMPT = (
    "This is a painted illustration for a trading card. Detect the HEAD (face and hair) of "
    "the main character: the most prominent figure the picture is about (largest / most "
    "central / best lit person; if a person and a creature, the person). If there is no "
    "person or creature, box the main object. Return JSON: "
    '{"box_2d": [ymin, xmin, ymax, xmax]} with coordinates normalised to 0-1000.'
)

def size(p):
    w, h = subprocess.run(["identify", "-format", "%w %h", str(p)], capture_output=True,
                          text=True, check=True).stdout.split()
    return int(w), int(h)

def ask(path):
    img = base64.b64encode(path.read_bytes()).decode()
    body = {"contents": [{"parts": [{"inlineData": {"mimeType": "image/webp", "data": img}},
                                    {"text": PROMPT}]}],
            "generationConfig": {"responseMimeType": "application/json", "temperature": 0, "thinkingConfig": {"thinkingBudget": 0}}}
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={gen_art.KEY}"
    for attempt in range(3):
        try:
            req = urllib.request.Request(url, data=json.dumps(body).encode(),
                                         headers={"Content-Type": "application/json"})
            d = json.load(urllib.request.urlopen(req, timeout=120))
            j = json.loads(d["candidates"][0]["content"]["parts"][0]["text"])
            if isinstance(j, list): j = j[0]
            y0, x0, y1, x1 = [float(v) / 1000 for v in j["box_2d"]]
            x, y = (x0 + x1) / 2, (y0 + y1) / 2
            return round(min(max(x, 0), 1), 3), round(min(max(y, 0), 1), 3)
        except Exception as e:     # noqa: BLE001 — retry, then fall back to centre
            err = e
    print(f"[warn] {path.name}: {err}; using centre")
    return 0.5, 0.45

def main(argv):
    cache = json.loads(OUT.read_text()) if OUT.exists() else {}
    redo = set(argv[1:]) if argv[:1] == ["--redo"] else set()
    files = [p for d in DIRS for p in sorted((ROOT / "ui" / "assets" / d).glob("*.webp"))]
    keep = set(cache.get('_overrides', []))     # hand-corrected entries: never re-ask
    todo = [p for p in files if (p.stem not in cache or p.stem in redo) and p.stem not in keep]
    def work(p):
        w, h = size(p)
        fx, fy = ask(p)
        return p.stem, [fx, fy, round(w / h, 3)]
    with ThreadPoolExecutor(8) as ex:
        for i, (k, v) in enumerate(ex.map(work, todo), 1):
            cache[k] = v
            if i % 25 == 0: print(f"  {i}/{len(todo)}")
    # keep aspect current for cached entries too (art may have been re-trimmed)
    for p in files:
        if p.stem in cache:
            w, h = size(p); cache[p.stem][2] = round(w / h, 3)
    OUT.write_text(json.dumps(dict(sorted(cache.items())), separators=(",", ":")) + "\n")
    print(f"wrote {OUT.relative_to(ROOT)}: {len(cache)} entries ({len(todo)} asked)")

if __name__ == "__main__":
    main(sys.argv)
