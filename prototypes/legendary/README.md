# Legendary card-frame explorations (workshop, not yet shipped)

Exploration for a special **legendary** card treatment (Hearthstone legendaries have the
dragon that breaches the frame — we wanted our own). **None of these is wired into
the game yet** — this folder is a durable stash so we can pick the direction later.

Each `*.html` is **self-contained** (card art embedded as data-URIs) — just open it
in a browser. Each is produced by the matching `*_build.py` generator:
`python3 <name>_build.py` writes the `.html`; the `.png` is a saved render.

| File | What it is |
|---|---|
| `lion.html` / `lion_build.py` | The **heraldic gold lion emblem** — geometric, symmetric, 11 shapes, scales crisp from 300px to 28px. Built with the "canvas → bounding boxes → ASCII → box-check" method. |
| `legendary-concepts.html` | Three ways to use the lion as a breaching crest: **Lion Crest** (top medallion), **Throne of Lions** (twin guardians, 1 Kings 10), **Illuminated** (gilt corners). |
| `drape.html` / `drape_build.py` | The lion **draping the top-left corner** like Ysera's dragon (v1, rough — head/body disconnect flagged). |
| `sacred.html` / `sacred_build.py` | The **"Enshrined" jeweled frame** line — breastplate gems (Exodus 28) + shadow-box depth. This one evolved a lot (see below). Current render = the armor-plate border. |

## The `sacred` line — which look each iteration was

`sacred_build.py` still contains the code for every stage; regenerate a given look by
pointing `card()` at the right element:

1. **Winged mercy-seat crest** — `CREST` with `left_branch()` returning wings *(early)*.
2. **Intertwined olive wreath + stone of light** — the `CREST` / `left_branch()` wreath **(the one Mark liked "much closer")**.
3. **Wreath + vine wrapping down the sides** — `wrap_vine()` earlier amplitude.
4. **Tight continuous gold coil, full perimeter, over-under behind the rail** — `wrap_vine()` (current tuned params) + `.railtop`.
5. **Armor plates** — `plates()` (current `card()` output): riveted beveled gold segments + gem corner bosses.

**Open feedback when we paused:** the wrapping vine kept not landing (too loose /
lost its gold when the gradient defs were deleted with the wreath — fixed); the armor
plates were "still not there." Gems (breastplate) are a keeper across all versions.
Next time: probably revisit the **olive-wreath** version and/or make the plates
**overlap (lamellar)** with brushed-metal texture. All pure CSS/SVG — no raster asset.

## Regenerate / view
```bash
python3 sacred_build.py   # writes sacred.html (self-contained)
# then open sacred.html in a browser, or screenshot with the scratchpad shot script
```
