"""Remove baked-in margins / letterbox bars from card art (build-time).

The image model sometimes paints a white margin, a rounded "card" on white,
a thin frame line, or black letterbox bars around the illustration. Game
surfaces crop art by focal point, so those bars show through. This walks in
from each edge, drops rows/columns that are mostly near-white or near-black,
then insets a little more on any trimmed side to kill rounded corners and
frame lines. Writes WebP in place; pass --dry to only report.

Usage: python3 clean_borders.py [--dry] [--any-colour] <file.webp> ...
Always eyeball --dry proposals drawn on the art before applying.
"""
import subprocess, sys

SCALE = 4          # analyse a 1/4-size copy (fast, plenty precise)
BG_SHARE = 0.80    # a row/col is "border" if >= this share of pixels are bg
INSET = 0.035
ANY_COLOUR = False   # --any-colour: also uniform margins of any colour. Dark scenes
                     # false-positive (night = 'margin'), so review every proposal.      # extra trim on trimmed sides (rounded corners / frame lines)

def pixels(path):
    out = subprocess.run(["convert", path, "-resize", f"{100 // SCALE}%", "ppm:-"],
                         capture_output=True, check=True).stdout
    # P6\n<w> <h>\n255\n<data>
    parts = out.split(b"\n", 3)
    w, h = map(int, parts[1].split())
    return w, h, parts[3]

def is_bg(r, g, b):
    lo, hi = min(r, g, b), max(r, g, b)
    return (lo > 215 and hi - lo < 30) or (lo > 190 and hi - lo < 50) or hi < 38   # white, parchment, black

def bbox(w, h, data):
    px = lambda x, y: data[3 * (y * w + x): 3 * (y * w + x) + 3]
    # (a) a margin of ANY uniform colour: rows/cols matching the corner colour,
    #     accepted only when the band frames at least 3 sides (a sky touches one)
    k = max(2, w // 60)
    corners = [px(x, y) for x in (k, w - 1 - k) for y in (k, h - 1 - k)]
    cc = tuple(sorted(c[i] for c in corners)[len(corners) // 2] for i in range(3))
    near = lambda p: sum((p[i] - cc[i]) ** 2 for i in range(3)) < 30 ** 2
    def run(get_line, length, limit):
        n = 0
        while n < limit and sum(near(p) or is_bg(*p) for p in get_line(n)) / length >= BG_SHARE: n += 1
        return n
    rows = lambda y: [px(x, y) for x in range(w)]
    cols = lambda x: [px(x, y) for y in range(h)]
    t = run(lambda i: rows(i), w, h // 3)
    b = run(lambda i: rows(h - 1 - i), w, h // 3)
    l = run(lambda i: cols(i), h, w // 3)
    r = run(lambda i: cols(w - 1 - i), h, w // 3)
    corner_is_bg = is_bg(*cc)
    sides = sum(n > 0 for n in (t, b, l, r))
    if not ANY_COLOUR or (sides < 3 and not corner_is_bg):
        # (b) classic white/black/parchment edges only (letterbox bars etc.)
        t = run(lambda i: [p for p in rows(i) if is_bg(*p)] or [None], 1, 0) if False else 0
        def run_bg(get_line, length, limit):
            n = 0
            while n < limit and sum(is_bg(*p) for p in get_line(n)) / length >= BG_SHARE: n += 1
            return n
        t = run_bg(lambda i: rows(i), w, h // 3); b = run_bg(lambda i: rows(h - 1 - i), w, h // 3)
        l = run_bg(lambda i: cols(i), h, w // 3); r = run_bg(lambda i: cols(w - 1 - i), h, w // 3)
    return l, t, w - 1 - r, h - 1 - b

def main(argv):
    global ANY_COLOUR
    dry = "--dry" in argv
    ANY_COLOUR = "--any-colour" in argv
    for path in [a for a in argv if not a.startswith("--")]:
        W, H = map(int, subprocess.run(["identify", "-format", "%w %h", path],
                                       capture_output=True, text=True, check=True).stdout.split())
        w, h, data = pixels(path)
        l, t, r, b = bbox(w, h, data)
        x0, y0, x1, y1 = l * SCALE, t * SCALE, (r + 1) * SCALE, (b + 1) * SCALE
        x1, y1 = min(x1, W), min(y1, H)
        trimmed = (x0 > 0, y0 > 0, x1 < W, y1 < H)
        if not any(trimmed):
            print(f"[keep] {path}"); continue
        iw, ih = x1 - x0, y1 - y0
        dx, dy = int(iw * INSET), int(ih * INSET)
        x0 += dx if trimmed[0] or trimmed[2] else 0; x1 -= dx if trimmed[0] or trimmed[2] else 0
        y0 += dy if trimmed[1] or trimmed[3] else 0; y1 -= dy if trimmed[1] or trimmed[3] else 0
        geo = f"{x1 - x0}x{y1 - y0}+{x0}+{y0}"
        print(f"[trim] {path}  {W}x{H} -> {geo}  (aspect {(x1 - x0) / (y1 - y0):.2f})")
        if not dry:
            subprocess.run(["convert", path, "-crop", geo, "+repage", "-quality", "90", path], check=True)

if __name__ == "__main__":
    main(sys.argv[1:])
