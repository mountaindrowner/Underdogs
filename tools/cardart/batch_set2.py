#!/usr/bin/env python3
"""Batch for the Set 2 legendaries: generate art + compose frames for every
card in cards.set2.json. Like batch.py, a Fulfilled form references its early
form (auto-derived from fulfill.into) so the same face carries through the
transform, and generation runs in dependency order (early form before its
fulfilled form). Idempotent: skips any illustration that already exists."""
import json, pathlib, subprocess, os
import gen_art, build_card

ROOT = pathlib.Path(__file__).parent
DATA = json.loads((ROOT/'..'/'..'/'data'/'cards.set2.json').read_text())
cards = DATA['cards'] if isinstance(DATA, dict) else DATA
OUT = gen_art.OUT                     # ui/assets/cards  (raw illustrations)
FRAMED = OUT/'framed'; FRAMED.mkdir(parents=True, exist_ok=True)
BUILD = ROOT/'.build'; BUILD.mkdir(exist_ok=True)
GP = subprocess.check_output(['npm', 'root', '-g']).decode().strip()

byid = {c['id']: c for c in cards}

# Fulfilled forms reference their early form — auto-derived from each card's fulfill.into
REF_FROM = {}
for c in cards:
    f = c.get('fulfill') or {}
    if isinstance(f, dict) and f.get('into') in byid:
        REF_FROM[f['into']] = c['id']

def led():
    p = ROOT/'cost_ledger.json'
    return json.loads(p.read_text()) if p.exists() else {'usd': 0, 'images': 0}

start = led()
failures = []

# dependency order: a card's REF_FROM anchor is generated before it
_seen, order = set(), []
def _visit(cid):
    if cid in _seen or cid not in byid: return
    dep = REF_FROM.get(cid)
    if dep: _visit(dep)
    _seen.add(cid); order.append(byid[cid])
for c in cards: _visit(c['id'])

# Phase A — generate art
for c in order:
    cid = c['id']; art = OUT/f'{cid}.png'
    if art.exists():          # idempotent — never pay to regenerate existing art
        continue
    refs = []
    if cid in REF_FROM and (OUT/f'{REF_FROM[cid]}.png').exists():
        refs = [OUT/f'{REF_FROM[cid]}.png']
    try:
        gen_art.generate(cid, c['art'], c['class'], refs=refs, aspect='4:3')
    except Exception as e:
        print(f'[FAIL art] {cid}: {e}'); failures.append(cid)

# Phase B — compose + render full cards
env = {**os.environ, 'NODE_PATH': GP}
env.setdefault('CHROMIUM_BIN', '/opt/pw-browsers/chromium-1194/chrome-linux/chrome')
for c in cards:
    art = OUT/f"{c['id']}.png"
    if not art.exists():
        print(f'[skip render] {c["id"]} (no art)'); continue
    hp = BUILD/f"card_{c['id']}.html"
    hp.write_text(build_card.build(c, str(art.resolve())))
    op = FRAMED/f"{c['id']}.png"
    subprocess.run(['node', str(ROOT/'render.js'), str(hp.resolve()), str(op)],
                   env=env, check=True)

end = led()
print(f"\n=== SET 2 BATCH DONE ===")
print(f"art generated this run: {end['images']-start['images']} images, "
      f"est ${end['usd']-start['usd']:.4f}")
bl = gen_art.budget_left(end)
print(f"ledger total: {end['images']} images, est ${end['usd']:.4f} all-time"
      + (f"  (${bl:.4f} left of ${end['budget_usd']:.2f} funded)" if bl is not None else ""))
if failures: print("FAILURES:", failures)
