#!/usr/bin/env python3
"""COVENANT card-art generator (build-time). Meters spend into a ledger."""
import os, json, base64, urllib.request, urllib.error, sys, pathlib, time

KEY   = os.environ["GEMINI_API_KEY"]
MODEL = "gemini-2.5-flash-image"
ROOT  = pathlib.Path(__file__).parent
OUT   = pathlib.Path(os.environ.get("CARDART_OUT",
                                    ROOT / ".." / ".." / "ui" / "assets" / "cards")).resolve()
OUT.mkdir(parents=True, exist_ok=True)
LEDGER= ROOT / "cost_ledger.json"

# --- pricing (gemini-2.5-flash-image, standard tier) ---
IMG_TOK_RATE  = 30.0 / 1_000_000   # $30 / 1M output tokens
TEXT_IN_RATE  = 0.30 / 1_000_000   # $0.30 / 1M input tokens

# --- house style (comedic-for-humans; Law 3: joke about the humans, never the holy) ---
MASTER = ("Painterly digital trading-card illustration in a warm, expressive, semi-comedic "
          "epic-fantasy style — bold rim lighting, rich saturated color, confident thick "
          "brushwork, cinematic shadow, gold-leaf accent details, slightly caricatured but "
          "dignified faces. Historically-plausible ancient Near-Eastern / first-century dress "
          "and setting. Single dramatic focal figure, mid-shot, dynamic but grounded. "
          "No text, no card frame, no modern objects, no visible face of God, no gore, no halos.")

PALETTE = {
    "prophet":  "signature color storm-blue and fire-orange",
    "warrior":  "signature color bronze and scarlet",
    "priest":   "signature color white-gold and incense-blue",
    "shepherd": "signature color dawn-green and wool-cream",
    "patriarch":"signature color starfield-indigo and desert-tan",
    "disciple": "signature color flame-red and amber",
    "neutral":  "muted earthy palette",
}

def _ledger_load():
    if LEDGER.exists(): return json.loads(LEDGER.read_text())
    return {"images": 0, "usd": 0.0, "runs": []}

def _ledger_save(l): LEDGER.write_text(json.dumps(l, indent=2))

def generate(card_id, seed_line, cls="neutral", refs=None, aspect="4:3"):
    refs = refs or []
    prompt = f"{MASTER} {seed_line} {PALETTE.get(cls,'')}. Card-portrait framing, room at the edges."
    parts = [{"text": prompt}]
    for rp in refs:
        b = pathlib.Path(rp).read_bytes()
        parts.append({"inlineData": {"mimeType": "image/png",
                                     "data": base64.b64encode(b).decode()}})
    body = {"contents": [{"parts": parts}],
            "generationConfig": {"imageConfig": {"aspectRatio": aspect}}}
    data = json.dumps(body).encode()
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={KEY}"
    attempt = 0
    while True:
        req = urllib.request.Request(url, data=json.dumps(body).encode(),
                                     headers={"Content-Type": "application/json"})
        try:
            d = json.load(urllib.request.urlopen(req, timeout=180))
        except urllib.error.HTTPError as e:
            # fallback: some builds reject imageConfig — retry without aspect
            if e.code == 400 and "imageConfig" in json.dumps(body):
                body.pop("generationConfig", None); continue
            # transient server / rate errors — retry with backoff
            if e.code in (429, 500, 502, 503, 504) and attempt < 5:
                attempt += 1; time.sleep(2 ** attempt); continue
            print("HTTP", e.code, e.read().decode()[:300]); raise
        except urllib.error.URLError:
            if attempt < 5:
                attempt += 1; time.sleep(2 ** attempt); continue
            raise
        # got 200 — the image model sometimes returns text instead of an image; retry if so
        parts = d.get("candidates", [{}])[0].get("content", {}).get("parts", [])
        if any("inlineData" in p for p in parts):
            break
        if attempt < 5:
            attempt += 1; time.sleep(1 + attempt); continue
        print(f"[warn] {card_id}: no image after retries"); break
    out_path = OUT / f"{card_id}.png"
    for p in d["candidates"][0]["content"]["parts"]:
        if "inlineData" in p:
            out_path.write_bytes(base64.b64decode(p["inlineData"]["data"]))
    um = d.get("usageMetadata", {})
    img_tok = sum(x["tokenCount"] for x in um.get("candidatesTokensDetails", [])
                  if x.get("modality") == "IMAGE")
    txt_tok = um.get("promptTokenCount", 0)
    cost = img_tok * IMG_TOK_RATE + txt_tok * TEXT_IN_RATE
    l = _ledger_load()
    l["images"] += 1; l["usd"] += cost
    l["runs"].append({"id": card_id, "cls": cls, "img_tok": img_tok, "usd": round(cost, 5),
                      "refs": [os.path.basename(r) for r in refs]})
    _ledger_save(l)
    print(f"[ok] {card_id:28s} {img_tok} img-tok  ${cost:.4f}   "
          f"(run total: {l['images']} imgs, ${l['usd']:.4f})")
    return out_path

if __name__ == "__main__":
    # ---- next small batch: David consistency set ----
    BATCH = [
        # 1) reference character-sheet FIRST (the consistency anchor)
        dict(card_id="ref_david", cls="shepherd",
             seed_line=("Character reference sheet, three views (front, three-quarter, action pose) "
                        "of the SAME young shepherd: early-teens, olive skin, dark tousled hair, "
                        "earnest hopeful face, simple undyed wool tunic and shepherd's satchel, "
                        "a leather sling at his belt. Neutral flat studio background, consistent "
                        "features across all three views."),
             aspect="16:9"),
    ]
    # 2) two David CARDS referencing the sheet (must read as the same person)
    CARDS = [
        dict(card_id="david_shepherd_boy", cls="shepherd",
             seed_line=("The same young shepherd from the reference, grinning with nervous courage, "
                        "swinging an oversized sling overhead, small against golden desert hills, "
                        "one lamb watching. Underdog energy, comedic determination."),
             ref="ref_david"),
        dict(card_id="david_the_king", cls="warrior",
             seed_line=("The SAME person years later, now David the King: same face matured, "
                        "bearded, crowned, bronze-and-scarlet royal armor over royal robes, harp "
                        "slung at his back, commanding and weary-wise. An elevated echo of his "
                        "shepherd-boy self."),
             ref="ref_david"),
    ]

    for item in BATCH:
        generate(**item)
    ref_path = OUT / "ref_david.png"
    for c in CARDS:
        r = c.pop("ref", None)
        generate(refs=[ref_path] if r else None, **c)

    l = _ledger_load()
    print(f"\n=== LEDGER ===  {l['images']} images  ${l['usd']:.4f} spent of $10.00  "
          f"(${10 - l['usd']:.4f} left)")
