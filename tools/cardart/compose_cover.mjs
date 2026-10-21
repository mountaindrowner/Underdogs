// Composes the itch.io/store cover (docs/22 Codex style) from the cover key art,
// the real card markup + stylesheet, and the class crests. Needs ui/dist served on
// localhost:4173 with tools/cardart/covers/cover_standoff.png copied to dist/_cover/art.jpg;
// writes dist/_cover/hs.html, which is then screenshotted at 1260x1000 and 630x500.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
const root = '/home/user/Underdogs';
const assets = readdirSync(`${root}/ui/dist/assets`);
const css = assets.find((f) => /^index-.*\.css$/.test(f));
const art = (id) => '/assets/' + assets.find((f) => f.startsWith(id + '-') && f.endsWith('.webp'));
const font = (p) => '/assets/' + assets.find((f) => f.startsWith(p));
const gsrc = readFileSync(`${root}/ui/src/codex/glyphs.ts`, 'utf8');
const glyph = (k) => JSON.parse(gsrc.match(new RegExp(`\\n  ${k}: ("(?:[^"\\\\]|\\\\.)*")`))[1]);
const defs = {};
for (const f of ['cards.seed.json', 'cards.set2.json', 'cards.neutral-expansion.json']) {
  const d = JSON.parse(readFileSync(`${root}/data/${f}`, 'utf8'));
  for (const c of (Array.isArray(d) ? d : d.cards)) defs[c.id] = c;
}
const LBL = { prophet: 'Prophet', warrior: 'Warrior', priest: 'Priest', shepherd: 'Shepherd', patriarch: 'Patriarch', disciple: 'Disciple', neutral: 'Neutral' };
const card = (id, cls) => {
  const c = defs[id]; const line = [c.tag && c.tag[0].toUpperCase() + c.tag.slice(1), LBL[c.class]].filter(Boolean).join(' · ');
  return `<div class="slot ${cls}"><div class="bigcard r-${c.rarity}">
    <div class="bcWindow"><div class="bcArt" style="background-image:url(${art(id)})"></div></div>
    <div class="bcCost">${c.cost}</div><div class="bcRarity">${c.rarity}</div>
    <div class="bcNameplate"><div class="bcName">${c.name}</div><div class="bcType">${line}</div></div>
    <div class="bcPanel"><div class="bcText">${c.text}</div><div class="bcFlavor">${c.flavor ?? ''}</div></div>
    ${c.type === 'minion' ? `<div class="bcAtk">${c.attack}</div><div class="bcHp">${c.health}</div>` : ''}
    <div class="bcGem"></div></div></div>`;
};
const PIG = { prophet: '#5b2a6b', warrior: '#a5301c', priest: '#2c5596', shepherd: '#2d6a4c', patriarch: '#6b4a16', disciple: '#b25a1e' };
const crest = (k) => `<span class="crest" style="--field:${PIG[k]};width:58px;height:58px"><svg class="glyph" viewBox="0 0 512 512" width="36" height="36">${glyph(k)}</svg></span>`;
const motes = Array.from({ length: 46 }, (_, i) => {
  const x = (i * 137.5) % 100, y = (i * 61.8) % 100, s = 2 + (i % 4) * 1.6, o = .35 + (i % 5) * .12;
  return `<i style="left:${x}%;top:${y}%;width:${s}px;height:${s}px;opacity:${o}"></i>`;
}).join('');
const RIB = [['#8a3a2c',1.3],['#a9843f',.8],['#5f6b38',1.1],['#3c6154',.7],['#334769',1.2],['#584158',.9],['#9c5636',1]];

const html = `<!doctype html><meta charset="utf-8">
<link rel="stylesheet" href="/assets/${css}">
<style>
html,body{margin:0;width:1260px;height:1000px;overflow:hidden;background:#140805;touch-action:auto;user-select:auto}
.cv{position:relative;width:1260px;height:1000px;overflow:hidden;
  background:radial-gradient(90% 80% at 50% 42%,#6a2e1c 0%,#43190f 45%,#220a05 100%)}
/* tooled leather grain + blind-stamped lattice on the book board */
.cv::before{content:'';position:absolute;inset:0;opacity:.5;mix-blend-mode:overlay;background-image:var(--grain);background-size:240px}
.lattice{position:absolute;inset:0;opacity:.12;background:
  repeating-linear-gradient(45deg,#000 0 2px,transparent 2px 46px),repeating-linear-gradient(-45deg,#000 0 2px,transparent 2px 46px)}
.gilt{position:absolute;inset:18px;border:3px solid #c99a3a;box-shadow:inset 0 0 0 2px #3a170e,inset 0 0 0 5px rgba(201,154,58,.55)}
.gilt::after{content:'';position:absolute;inset:14px;border:1.5px solid rgba(243,218,146,.4)}
.fl{position:absolute;width:64px;height:64px;background:var(--corner) center/contain no-repeat;filter:brightness(1.5) saturate(1.2)}
.fl.tl{top:30px;left:30px}.fl.tr{top:30px;right:30px;transform:scaleX(-1)}.fl.bl{bottom:30px;left:30px;transform:scaleY(-1)}.fl.br{bottom:30px;right:30px;transform:scale(-1,-1)}
/* the illuminated miniature: the key painting under a gilt arch */
.mini{position:absolute;left:118px;right:118px;top:120px;height:590px;border-radius:300px 300px 6px 6px/150px 150px 6px 6px;overflow:hidden;
  border:8px solid transparent;border-image:none;box-shadow:0 0 0 3px #3a170e,0 0 0 10px #d2a347,0 0 0 12px #6b4a14,0 0 0 13px rgba(0,0,0,.5),0 24px 60px rgba(0,0,0,.7)}
.mini img{position:absolute;left:-40px;top:-110px;width:1110px}
.mini::after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(40,18,4,.0) 50%,rgba(30,12,4,.55) 100%),radial-gradient(120% 90% at 50% 40%,transparent 55%,rgba(20,8,2,.5))}
/* light pouring from the top of the arch */
.rays{position:absolute;left:50%;top:60px;width:900px;height:900px;transform:translateX(-50%);pointer-events:none;mix-blend-mode:screen;opacity:.55;
  background:conic-gradient(from 160deg at 50% 0%,transparent 0deg,rgba(255,226,160,.35) 6deg,transparent 12deg,transparent 18deg,rgba(255,226,160,.25) 22deg,transparent 28deg,transparent 33deg,rgba(255,226,160,.3) 38deg,transparent 44deg);
  -webkit-mask:linear-gradient(180deg,#000,transparent 75%);mask:linear-gradient(180deg,#000,transparent 75%)}
.motes i{position:absolute;border-radius:50%;background:radial-gradient(circle,#fff3c8,rgba(255,200,110,0) 70%);box-shadow:0 0 8px 2px rgba(255,200,110,.6)}
/* crests set into the frame like jewels */
.jewels{position:absolute;top:300px;display:flex;flex-direction:column;gap:46px}
.jewels.l{left:86px}.jewels.r{right:86px}
.jewels .crest{box-shadow:0 0 0 2px #3a170e,0 0 0 5px #d2a347,0 0 0 6px #6b4a14,0 6px 14px rgba(0,0,0,.6),0 0 22px rgba(255,210,120,.25)}
/* the title plaque: a leaf of vellum, ink lettering, opened by the illuminated U */
.plaque{position:absolute;top:44px;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:6px;padding:16px 40px 18px 22px;
  background-color:var(--vellum);background-image:var(--grain),radial-gradient(120% 120% at 50% 40%,transparent 55%,rgba(120,85,35,.35));background-size:240px,100%;
  box-shadow:0 0 0 3px #3a170e,0 0 0 9px #d2a347,0 0 0 11px #6b4a14,0 20px 44px rgba(0,0,0,.75)}
.plaque::before{content:'';position:absolute;inset:7px;border:1.5px solid rgba(165,48,28,.45);pointer-events:none}
.plaque .dropCap{width:118px;height:118px;font-size:96px}
.wm{font-family:'Fell SC';font-size:100px;line-height:.8;letter-spacing:.04em;color:#2a1a0e;padding-top:14px}
/* the swallowtail ribbon under the plaque */
.rib{position:absolute;top:212px;left:50%;transform:translateX(-50%);padding:9px 74px 11px;font-family:'Fell SC';font-size:28px;letter-spacing:.24em;color:#fbe9d2;
  background:linear-gradient(90deg,#7e2213,#a5301c 30%,#b8402a 50%,#a5301c 70%,#7e2213);
  clip-path:polygon(0 0,100% 0,95% 50%,100% 100%,0 100%,5% 50%);filter:drop-shadow(0 6px 10px rgba(0,0,0,.6));text-shadow:0 1px 0 rgba(0,0,0,.4)}
.tribes{position:absolute;top:202px;left:50%;transform:translateX(-50%);display:flex;width:520px;height:7px;box-shadow:0 2px 6px rgba(0,0,0,.6)}
.tribes span{flex-grow:var(--w)}
/* the fan of real game cards bursting out over the frame */
.fan{position:absolute;left:0;right:0;bottom:0;height:420px}
.slot{position:absolute;bottom:-76px;left:50%;transform-origin:50% 120%}
.slot .bigcard{transform:scale(1.0);transform-origin:50% 100%;box-shadow:0 26px 50px rgba(0,0,0,.75)}
.s1{transform:translateX(-50%) translateX(-372px) translateY(58px) rotate(-15deg)}
.s2{transform:translateX(-50%) translateX(-190px) translateY(14px) rotate(-7deg)}
.s3{transform:translateX(-50%) translateY(-34px) scale(1.12);z-index:3}
.s4{transform:translateX(-50%) translateX(190px) translateY(14px) rotate(7deg)}
.s5{transform:translateX(-50%) translateX(372px) translateY(58px) rotate(15deg)}
.s3 .bigcard{box-shadow:0 0 0 2px rgba(255,214,120,.9),0 0 50px 10px rgba(255,190,90,.55),0 30px 60px rgba(0,0,0,.8)}
.halo{position:absolute;left:50%;bottom:120px;width:560px;height:420px;transform:translateX(-50%);border-radius:50%;
  background:radial-gradient(closest-side,rgba(255,206,120,.5),rgba(255,170,70,.15) 60%,transparent);mix-blend-mode:screen}
.tag{position:absolute;bottom:46px;right:60px;font-family:'Fell';font-style:italic;font-size:26px;color:#f6e3bd;text-shadow:0 2px 8px #000;z-index:9}
.free{position:absolute;bottom:46px;left:60px;font-family:'Fell SC';font-size:22px;letter-spacing:.16em;color:#f6e3bd;text-shadow:0 2px 8px #000;z-index:9}
</style>
<div class="cv">
  <div class="lattice"></div>
  <div class="mini"><img src="art.jpg"></div>
  <div class="rays"></div>
  <div class="gilt"></div>
  <i class="fl tl"></i><i class="fl tr"></i><i class="fl bl"></i><i class="fl br"></i>
  <div class="jewels l">${crest('prophet')}${crest('warrior')}${crest('priest')}</div>
  <div class="jewels r">${crest('shepherd')}${crest('patriarch')}${crest('disciple')}</div>
  <div class="motes">${motes}</div>
  <div class="plaque"><span class="dropCap" style="--field:#1f3a78">U</span><span class="wm">NDERDOGS</span></div>
  <div class="rib">A Scripture Card Game</div>
  <div class="halo"></div>
  <div class="fan">${card('esther_in_the_palace','s1')}${card('elijah','s2')}${card('jael_of_the_tent','s4')}${card('peter_the_rock','s5')}${card('shepherd_david','s3')}</div>
</div>`;
writeFileSync(`${root}/ui/dist/_cover/hs.html`, html);
console.log('wrote hs.html; css', css);
