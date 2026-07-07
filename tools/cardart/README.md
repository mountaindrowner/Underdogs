# Card-art pipeline

Two-stage, data-driven card production for COVENANT:

1. **`gen_art.py`** — generates a card's *illustration* via the Gemini image API
   (`gemini-2.5-flash-image`). Rarity is **never** an input to the art (see the Laws /
   `docs/05-art-direction.md`). Reference images (hero character sheets, or a Fulfill
   card's early form) are passed in for character consistency. Every call is metered
   into `cost_ledger.json`.
2. **`build_card.py`** — composes the *full card frame* (parchment body, gold border,
   cost jewel, name banner, rarity layer, stat gems) as HTML/CSS around the illustration.
   The frame is data-driven from the card JSON; **rarity is a swappable style layer** —
   the gem color always changes and Common→Legendary add escalating frame accents, while
   the art window and stats never move.
3. **`render.js`** — screenshots the composed card to PNG via headless Chromium (Playwright).
4. **`batch.py`** — runs the whole `data/cards.seed.json` set through both stages.
   Idempotent: skips any illustration that already exists (never pays to regenerate),
   so re-runs only re-composite frames (free).

## Layout

```
ui/assets/cards/<id>.png          raw illustrations (the paid, non-regenerable assets)
ui/assets/cards/framed/<id>.png   composed full cards (regenerable for free from raw + frame)
ui/assets/refs/<hero>.png         hero character sheets (consistency anchors)
tools/cardart/cost_ledger.json    running spend, per image
```

## Running

Requires: `GEMINI_API_KEY` (billing-enabled), Node with `playwright` installed.

```bash
export GEMINI_API_KEY=...
# optional: point at a specific Chromium; else Playwright's default is used
export CHROMIUM_BIN=/path/to/chromium
# node needs to resolve a global playwright install:
NODE_PATH="$(npm root -g)" python3 tools/cardart/batch.py
```

Cost: ~$0.039 per illustration (1290 output tokens @ $30/1M). Framing/re-framing is free.

Single card: `import build_card` and call `build_card.build(card_dict, "path/to/art.png")`,
write the HTML, then `node render.js card.html out.png`.
