/** One-shot sound effects. Pools are built from the /assets/sfx library
 *  (grouped by folder), and each semantic key plays a random variant so
 *  repeated actions don't sound identical. Gated by the shared mute (the ♪
 *  toggle) and armed on the same first-gesture unlock as the music. */
import { music } from './audio.ts';
import type { GameEvent } from '../../engine/src/index.ts';

const files = import.meta.glob('../assets/sfx/**/*.mp3', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;

interface Entry { url: string; cat: string; name: string }
const all: Entry[] = Object.entries(files).map(([path, url]) => {
  const m = path.match(/assets\/sfx\/(.*)\/([^/]+)\.mp3$/i);
  return { url, cat: m ? m[1] : '', name: m ? m[2] : '' };
});

// semantic key -> which files qualify (docs/07 beats -> the SFX folders)
const KEYS: Record<string, (e: Entry) => boolean> = {
  play: (e) => e.cat === 'Cards/Play' && !/Turbo/i.test(e.name),
  select: (e) => e.cat === 'Cards/Select' && !/Turbo/i.test(e.name),
  draw: (e) => e.cat === 'Cards/Draw' && !/Big/i.test(e.name),
  shuffle: (e) => /Shuffle/i.test(e.name),
  discard: (e) => e.cat === 'Cards/Discard' && /Discard/i.test(e.name) && !/Turbo/i.test(e.name),
  mulligan: (e) => /Mulligan/i.test(e.name),
  damage: (e) => e.cat === 'Damage',
  buff: (e) => e.cat === 'Buff' && !/Heal/i.test(e.name),
  heal: (e) => /Heal/i.test(e.name),
  debuff: (e) => e.cat === 'Debuff',
  ui: (e) => e.cat === 'UI',
  beginTurn: (e) => /Begin_Turn/i.test(e.name),
  notify: (e) => e.cat === 'UI/Notifications' && !/Begin_Turn/i.test(e.name),
};

const pools: Record<string, string[]> = {};
for (const k of Object.keys(KEYS)) pools[k] = all.filter(KEYS[k]).map((e) => e.url);

class Sfx {
  private vol = 0.5;

  play(key: string) {
    if (typeof Audio === 'undefined' || music.isMuted()) return;
    const p = pools[key];
    if (!p || !p.length) return;
    const url = p[(Math.random() * p.length) | 0];
    try {
      const a = new Audio(url);
      a.volume = this.vol;
      a.play().catch(() => { /* pre-gesture / autoplay block: silent */ });
    } catch { /* ignore */ }
  }

  /** Map an animated engine event to its sound. */
  forEvent(e: GameEvent) {
    switch (e.t) {
      case 'cardPlayed': this.play('play'); break;
      case 'draw': this.play('draw'); break;
      case 'damage': case 'heroDamage': this.play('damage'); break;
      case 'heal': case 'heroHeal': this.play('heal'); break;
      case 'buff': this.play('buff'); break;
      case 'setAttack': case 'silence': this.play('debuff'); break;
      case 'fulfill': this.play('notify'); break;
      case 'foresee': case 'discover': this.play('notify'); break;
      case 'burnCard': this.play('discard'); break;
      case 'gameStart': this.play('shuffle'); break;
      case 'phase': if (e.phase === 'dawn') this.play('beginTurn'); break;
      default: break;
    }
  }
}

export const sfx = new Sfx();
