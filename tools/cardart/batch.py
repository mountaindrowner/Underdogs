#!/usr/bin/env python3
"""Batch: generate art + compose full cards for every card in cards.seed.json."""
import json, pathlib, subprocess, os, sys
import gen_art, build_card

ROOT = pathlib.Path(__file__).parent
SEED = json.loads((ROOT/'..'/'..'/'data'/'cards.seed.json').read_text())
cards = SEED if isinstance(SEED, list) else SEED.get('cards', SEED)
OUT = gen_art.OUT                     # ui/assets/cards  (raw illustrations)
REFS = OUT.parent / 'refs'            # ui/assets/refs   (hero character sheets)
FRAMED = OUT / 'framed'; FRAMED.mkdir(parents=True, exist_ok=True)
BUILD = ROOT / '.build'; BUILD.mkdir(exist_ok=True)   # transient html (gitignored)
GP = subprocess.check_output(['npm', 'root', '-g']).decode().strip()

byid = {c['id']: c for c in cards}

# --- consistency references ---------------------------------------------------
# David uses the pre-made character sheet (ui/assets/refs/ref_david.png)
REF_FILE = {'shepherd_david': 'ref_david', 'david_the_shepherd': 'ref_david',
            'david_the_king': 'ref_david'}
# Fulfilled forms reference their early form — auto-derived from each card's fulfill.into
REF_FROM = {}
for c in cards:
    f = c.get('fulfill') or {}
    if isinstance(f, dict) and f.get('into') in byid:
        REF_FROM[f['into']] = c['id']
# Multi-card heroes: variant cards reference an anchor so the same face carries
HERO = {'moses_signs_and_wonders': 'moses_of_midian',
        'moses_the_lawgiver': 'moses_of_midian',
        'samuel_raised_at_the_altar': 'samuel_the_seer',
        'jacob': 'jacob_the_herdsman',
        'joseph_lord_of_egypt': 'joseph_the_dreamer'}
for k, v in HERO.items():
    if k in byid and v in byid:
        REF_FROM.setdefault(k, v)

def led():
    return json.loads((ROOT/'cost_ledger.json').read_text()) if (ROOT/'cost_ledger.json').exists() else {'usd':0,'images':0}

start = led()
failures = []

# dependency order: a card's REF_FROM anchor is generated before it (handles chains)
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
    if cid in REF_FILE and (REFS/f'{REF_FILE[cid]}.png').exists():
        refs = [REFS/f'{REF_FILE[cid]}.png']
    elif cid in REF_FROM and (OUT/f'{REF_FROM[cid]}.png').exists():
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
print(f"\n=== BATCH DONE ===")
print(f"art generated this run: {end['images']-start['images']} images, "
      f"${end['usd']-start['usd']:.4f}")
print(f"ledger total: {end['images']} images, ${end['usd']:.4f} of $10  (${10-end['usd']:.4f} left)")
if failures: print("FAILURES:", failures)
