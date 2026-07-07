#!/usr/bin/env python3
"""Generate art + compose the 12 Leaders (hero avatars) from data/leaders.json.
Run with CARDART_OUT pointed at ui/assets/leaders so art lands there, e.g.:
  CARDART_OUT=$PWD/ui/assets/leaders NODE_PATH="$(npm root -g)" python3 tools/cardart/batch_leaders.py
"""
import json, pathlib, subprocess, os
import gen_art, build_card

ROOT = pathlib.Path(__file__).parent
LEADERS = json.loads((ROOT/'..'/'..'/'data'/'leaders.json').read_text())['leaders']
OUT = gen_art.OUT                                   # ui/assets/leaders (via CARDART_OUT)
CARDS = (ROOT/'..'/'..'/'ui'/'assets'/'cards').resolve()
REFS  = (ROOT/'..'/'..'/'ui'/'assets'/'refs').resolve()
FRAMED = OUT/'framed'; FRAMED.mkdir(parents=True, exist_ok=True)
BUILD = ROOT/'.build'; BUILD.mkdir(exist_ok=True)
GP = subprocess.check_output(['npm','root','-g']).decode().strip()

def ref_path(r):
    for base in (CARDS, REFS):
        p = base/f'{r}.png'
        if p.exists(): return p
    return None

# Phase A — art (reference the hero's existing card art for a consistent face)
for L in LEADERS:
    art = OUT/f"{L['id']}.png"
    if art.exists():
        continue
    rp = ref_path(L.get('ref',''))
    gen_art.generate(L['id'], L['art'], L['class'], refs=[rp] if rp else [], aspect='4:3')

# Phase B — compose leader frames
env = {**os.environ, 'NODE_PATH': GP}
env.setdefault('CHROMIUM_BIN', '/opt/pw-browsers/chromium-1194/chrome-linux/chrome')
for L in LEADERS:
    art = OUT/f"{L['id']}.png"
    if not art.exists(): continue
    hp = BUILD/f"lead_{L['id']}.html"; hp.write_text(build_card.build(L, str(art.resolve())))
    subprocess.run(['node', str(ROOT/'render.js'), str(hp.resolve()), str(FRAMED/f"{L['id']}.png")],
                   env=env, check=True)
print("leaders done:", len(LEADERS))
