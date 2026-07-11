/** Static stat-budget audit against CLAUDE.md §7 (the balance rail).
 *
 *  Vanilla budget:  attack + health ≈ cost*2 + 1.
 *  A card should sit on the vanilla line with relevant text, OR slightly above
 *  vanilla in a specialized direction. Text (keywords/effects) is bought by
 *  giving up body — so a card that keeps a FULL body AND carries strong text
 *  is the classic over-budget flag. The Law: flag > ~1.5 over budget for
 *  human review.
 *
 *  What this tool trusts vs. doesn't:
 *   - TRUSTWORTHY: raw body vs budget for minions (pure arithmetic).
 *   - FUZZY: the value of card text. Valuing "buff all allies +2/+2" or a
 *     standing relic's aura in stat-points is genuinely hard and any single
 *     number is arguable. So text is reported as a coarse LIGHT/MEDIUM/HEAVY
 *     tag, never a fake-precise stat credit. The sim (tools/balance.ts) is the
 *     real arbiter of whether text-heavy cards are actually strong.
 *
 *  Reading it: OVER = body alone beats budget (undeniable). STATS+TEXT = full
 *  body AND heavy text (eyeball / sim it). DEAD = well under budget with little
 *  text (paying for nothing). Nothing here mutates card data.
 *  Run: node tools/card-balance.ts [over-threshold=1.5] */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const load = (f: string) => JSON.parse(readFileSync(join(root, 'data', f), 'utf8'));
const cards: any[] = load('cards.seed.json').cards;
const OVER = Number(process.argv[2] ?? 1.5);

/** coarse "how much is going on" score: keywords + effect ops, weighted a
 *  little for board-wide / removal ops. Only used to bucket LIGHT/MED/HEAVY. */
function textWeight(c: any): number {
  let w = (c.keywords ?? []).length;
  const eff = c.effects ?? {};
  for (const trig of Object.keys(eff)) {
    for (const op of eff[trig] ?? []) {
      w += 1;
      if (/all/i.test(op.target ?? '')) w += 0.5;          // board-wide reaches further
      if (op.verb === 'destroy' || op.verb === 'exile' || op.verb === 'transform' ||
          op.verb === 'delayedTransform') w += 1;
      if ((op.amount ?? 0) >= 3 || (op.count ?? 0) >= 2 || op.toFull) w += 0.5;
    }
  }
  if (c.fulfill) w += 1;
  return w;
}
const tag = (w: number) => (w === 0 ? 'none' : w <= 1.5 ? 'LIGHT' : w <= 3.5 ? 'MEDIUM' : 'HEAVY');

const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
function summarize(c: any): string {
  const kw = (c.keywords ?? []).join(', ');
  const eff = c.effects ?? {};
  const ops: string[] = [];
  for (const trig of Object.keys(eff))
    for (const op of eff[trig] ?? [])
      ops.push(`${trig}:${op.verb}${op.amount != null ? ` ${op.amount}` : ''}${op.attack != null || op.health != null ? ` ${op.attack ?? 0}/${op.health ?? 0}` : ''}${op.target ? `→${op.target}` : ''}`);
  if (c.fulfill) ops.push(`fulfill:${c.fulfill.condition}→${c.fulfill.into}`);
  return [kw, ...ops].filter(Boolean).join('; ') || '(vanilla)';
}

type Row = { c: any; budget: number; body: number; dev: number; w: number };
const minions: Row[] = [];
const spellsRelics: any[] = [];
for (const c of cards) {
  if (c.collectible === false) continue;
  const budget = (c.cost ?? 0) * 2 + 1;
  if (c.type === 'minion') {
    const body = (c.attack ?? 0) + (c.health ?? 0);
    minions.push({ c, budget, body, dev: body - budget, w: textWeight(c) });
  } else {
    spellsRelics.push(c);
  }
}

const fmtDev = (d: number) => (d >= 0 ? '+' : '') + d;
const rowLine = (r: Row) =>
  `  ${fmtDev(r.dev).padStart(3)} body ` +
  `${r.c.name} (${r.c.class} ${r.c.attack ?? 0}/${r.c.health ?? 0}, cost ${r.c.cost}, ${r.c.rarity}) ` +
  `[budget ${r.budget}, body ${r.body}, text ${tag(r.w)}]\n        ${summarize(r.c)}`;

console.log(`\nCARD BALANCE — static rail check (atk+hp vs cost*2+1)`);
console.log(`${minions.length} minions + ${spellsRelics.length} spells/relics collectible. Threshold ±${OVER}.\n`);

// 1) TRUSTWORTHY: raw body over budget
const over = minions.filter((r) => r.dev > OVER).sort((a, b) => b.dev - a.dev);
console.log(`━━ OVER budget on BODY ALONE (undeniable — text only makes it worse) — ${over.length}`);
for (const r of over) console.log(rowLine(r));
if (!over.length) console.log('  (none — no minion has raw stats over budget)');

// 2) Full body AND heavy text — the classic "stats + free abilities" flag
const statsPlus = minions.filter((r) => r.dev >= 0 && r.w >= 3.5 && r.dev <= OVER)
  .sort((a, b) => b.w - a.w || b.dev - a.dev);
console.log(`\n━━ FULL BODY + HEAVY TEXT (on/above vanilla AND doing a lot — eyeball / sim) — ${statsPlus.length}`);
for (const r of statsPlus) console.log(rowLine(r));
if (!statsPlus.length) console.log('  (none)');

// 3) DEAD: well under budget with little text = paying for nothing
const dead = minions.filter((r) => r.dev < -OVER && r.w <= 1.5).sort((a, b) => a.dev - b.dev);
console.log(`\n━━ UNDER budget with LIGHT text (candidate dead card) — ${dead.length}`);
for (const r of dead) console.log(rowLine(r));
if (!dead.length) console.log('  (none)');

// distribution
const devs = minions.map((r) => r.dev);
const mean = devs.reduce((s, n) => s + n, 0) / (devs.length || 1);
const onLine = minions.filter((r) => Math.abs(r.dev) <= OVER).length;
console.log(`\nMinion bodies: mean deviation ${mean.toFixed(2)} (negative = paying for text, expected). ` +
  `${onLine}/${minions.length} within ±${OVER} of the vanilla line.`);

// spells/relics: can't rail-check by body — list with text tag for eyeballing
console.log(`\n━━ SPELLS & RELICS (no body — not stat-checkable here; judge by text/sim) — ${spellsRelics.length}`);
for (const c of spellsRelics.sort((a, b) => (a.cost ?? 0) - (b.cost ?? 0))) {
  console.log(`  ${cap(c.type)} cost ${c.cost}  ${c.name} (${c.class}, ${c.rarity}, text ${tag(textWeight(c))})` +
    `\n        ${summarize(c)}`);
}
console.log('');
