"""Remove baked-in margins / letterbox bars from card art (build-time).

The image model sometimes paints a white margin, a rounded "card" on white,
a thin frame line, or black letterbox bars around the illustration. Game
surfaces crop art by focal point, so those bars show through. This walks in
from each edge, drops rows/columns that are mostly near-white or near-black,
then insets a little more on any trimmed side to kill rounded corners and
frame lines. Writes WebP in place; pass --dry to only report.

Usage: python3 clean_borders.py [--dry] <file.webp> ...
"""
import subprocess, sys

SCALE = 4          # analyse a 1/4-size copy (fast, plenty precise)
BG_SHARE = 0.80    # a row/col is "border" if >= this share of pixels are bg
INSET = 0.025      # extra trim on trimmed sides (rounded corners / frame lines)

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
    row_bg = lambda y: sum(is_bg(*px(x, y)) for x in range(w)) / w >= BG_SHARE
    col_bg = lambda x: sum(is_bg(*px(x, y)) for y in range(h)) / h >= BG_SHARE
    t = 0
    while t < h // 3 and row_bg(t): t += 1
    b = h - 1
    while b > 2 * h // 3 and row_bg(b): b -= 1
    l = 0
    while l < w // 3 and col_bg(l): l += 1
    r = w - 1
    while r > 2 * w // 3 and col_bg(r): r -= 1
    return l, t, r, b

def main(argv):
    dry = "--dry" in argv
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
