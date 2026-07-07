#!/usr/bin/env python3
"""Generic batch: generate art + compose frames for a data file.
Usage:  CARDART_OUT=<dir> NODE_PATH="$(npm root -g)" \
          python3 batch_group.py <file.json> <listKey> [--force=id1,id2]
Idempotent (skips existing art) unless an id is in --force. With --force set,
only the forced ids are (re)generated and re-rendered."""
import sys, json, pathlib, subprocess, os
import gen_art, build_card

ROOT = pathlib.Path(__file__).parent
data = json.loads((ROOT/'..'/'..'/'data'/sys.argv[1]).read_text())
items = [c for c in data[sys.argv[2]] if isinstance(c, dict) and c.get('id')]
force = set()
for a in sys.argv[3:]:
    if a.startswith('--force='):
        force = set(a.split('=', 1)[1].split(','))

OUT = gen_art.OUT; FRAMED = OUT/'framed'; FRAMED.mkdir(parents=True, exist_ok=True)
BUILD = ROOT/'.build'; BUILD.mkdir(exist_ok=True)
CARDS = (ROOT/'..'/'..'/'ui'/'assets'/'cards').resolve()
REFS  = (ROOT/'..'/'..'/'ui'/'assets'/'refs').resolve()
GP = subprocess.check_output(['npm','root','-g']).decode().strip()

def refpath(r):
    if not r: return None
    for b in (CARDS, REFS):
        p = b/f'{r}.png'
        if p.exists(): return p
    return None

targets = [c for c in items if c['id'] in force] if force else items

for c in targets:
    art = OUT/f"{c['id']}.png"
    if art.exists() and c['id'] not in force:
        continue
    rp = refpath(c.get('ref', ''))
    gen_art.generate(c['id'], c['art'], c.get('class', 'neutral'), refs=[rp] if rp else [], aspect='4:3')

env = {**os.environ, 'NODE_PATH': GP}
env.setdefault('CHROMIUM_BIN', '/opt/pw-browsers/chromium-1194/chrome-linux/chrome')
for c in targets:
    art = OUT/f"{c['id']}.png"
    if not art.exists(): continue
    hp = BUILD/f"x_{c['id']}.html"; hp.write_text(build_card.build(c, str(art.resolve())))
    subprocess.run(['node', str(ROOT/'render.js'), str(hp.resolve()), str(FRAMED/f"{c['id']}.png")],
                   env=env, check=True)
print(f"{sys.argv[2]}: {len(targets)} processed")
