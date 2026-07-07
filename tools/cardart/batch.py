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

# consistency references
REF_FILE = {'shepherd_david': 'ref_david', 'david_the_shepherd': 'ref_david', 'david_the_king': 'ref_david'}
REF_FROM = {'abraham_father_of_nations': 'abram_the_called', 'paul_apostle': 'saul_of_tarsus'}
REUSE = {'david_the_king'}   # already generated & approved — don't spend again

def led():
    return json.loads((ROOT/'cost_ledger.json').read_text()) if (ROOT/'cost_ledger.json').exists() else {'usd':0,'images':0}

start = led()
failures = []

# Phase A — art (base forms first, then fulfilled forms that reference them)
order = [c for c in cards if c['id'] not in REF_FROM] + [c for c in cards if c['id'] in REF_FROM]
for c in order:
    cid = c['id']; art = OUT/f'{cid}.png'
    if art.exists():          # idempotent — never pay to regenerate existing art
        print(f'[skip] {cid} (art exists)'); continue
    refs = []
    if cid in REF_FILE and (REFS/f'{REF_FILE[cid]}.png').exists():
        refs = [REFS/f'{REF_FILE[cid]}.png']          # hero sheet in ui/assets/refs
    elif cid in REF_FROM and (OUT/f'{REF_FROM[cid]}.png').exists():
        refs = [OUT/f'{REF_FROM[cid]}.png']           # fulfilled form references its early form
    try:
        gen_art.generate(cid, c['art'], c['class'], refs=refs, aspect='4:3')
    except Exception as e:
        print(f'[FAIL art] {cid}: {e}'); failures.append(cid)

# Phase B — compose + render full cards
for c in cards:
    art = OUT/f"{c['id']}.png"
    if not art.exists():
        print(f'[skip render] {c["id"]} (no art)'); continue
    hp = BUILD/f"card_{c['id']}.html"
    hp.write_text(build_card.build(c, str(art)))
    op = FRAMED/f"{c['id']}.png"
    subprocess.run(['node', str(ROOT/'render.js'), str(hp), str(op)],
                   env={**os.environ, 'NODE_PATH': GP}, check=True)
    print(f'[card] {c["id"]}')

end = led()
print(f"\n=== BATCH DONE ===")
print(f"art generated this run: {end['images']-start['images']} images, "
      f"${end['usd']-start['usd']:.4f}")
print(f"ledger total: {end['images']} images, ${end['usd']:.4f} of $10  (${10-end['usd']:.4f} left)")
if failures: print("FAILURES:", failures)
