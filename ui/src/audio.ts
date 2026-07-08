/** Background music: a tiny crossfading player for the tavern tracks.
 *  - The Tavern's Best Brew  -> main menu theme (fades in)
 *  - The Tavern Hymn         -> alternate menu theme
 *  - The Tavern of the Lost  -> gameplay theme
 *  Two <audio> elements crossfade between tracks. Volume defaults to 30%,
 *  persisted with the mute state. Browsers block audio until a user gesture,
 *  so playback arms on mount and actually starts (fading in) on first input. */
import bestBrew from '../assets/audio/tavern-best-brew.mp3';
import hymn from '../assets/audio/tavern-hymn.mp3';
import ofTheLost from '../assets/audio/tavern-of-the-lost.mp3';

export const TRACK = { menuMain: bestBrew, menuAlt: hymn, battle: ofTheLost } as const;

const VOL_KEY = 'underdogs.music.vol';
const MUTE_KEY = 'underdogs.music.muted';
const clamp = (v: number) => Math.max(0, Math.min(1, v));

class Music {
  private a = typeof Audio !== 'undefined' ? new Audio() : null;
  private b = typeof Audio !== 'undefined' ? new Audio() : null;
  private cur = this.a;
  private idle = this.b;
  private curSrc = '';
  private wanted = '';
  private baseVol = 0.3;
  private muted = false;
  private unlocked = false;
  private fadeTok = new WeakMap<HTMLAudioElement, number>();

  constructor() {
    if (!this.a || !this.b) return;
    for (const el of [this.a, this.b]) {
      el.loop = true; el.preload = 'auto'; el.volume = 0;
      el.setAttribute('data-music', '');
      if (typeof document !== 'undefined' && document.body) document.body.appendChild(el);
    }
    try {
      const raw = localStorage.getItem(VOL_KEY); // null when unset -> keep 30% default
      if (raw != null) { const v = Number(raw); if (!Number.isNaN(v)) this.baseVol = clamp(v); }
      this.muted = localStorage.getItem(MUTE_KEY) === '1';
    } catch { /* ignore */ }
    const unlock = () => {
      if (this.unlocked) return;
      this.unlocked = true;
      if (this.wanted) this.start(this.wanted);
      for (const e of ['pointerdown', 'keydown', 'touchstart']) window.removeEventListener(e, unlock);
    };
    for (const e of ['pointerdown', 'keydown', 'touchstart']) window.addEventListener(e, unlock);
  }

  private targetVol() { return this.muted ? 0 : this.baseVol; }

  private fade(el: HTMLAudioElement, to: number, dur: number, pauseAfter = false) {
    const from = el.volume;
    const t0 = performance.now();
    const tok = (this.fadeTok.get(el) ?? 0) + 1;
    this.fadeTok.set(el, tok);
    const step = (now: number) => {
      if (this.fadeTok.get(el) !== tok) return; // superseded
      const t = Math.min(1, (now - t0) / dur);
      el.volume = clamp(from + (to - from) * t);
      if (t < 1) requestAnimationFrame(step);
      else if (pauseAfter && to === 0) el.pause();
    };
    requestAnimationFrame(step);
  }

  /** actually crossfade to a src (only once unlocked) */
  private start(src: string) {
    if (!this.cur || !this.idle) return;
    if (this.curSrc === src && !this.cur.paused) return;
    const incoming = this.idle;
    incoming.src = src;
    incoming.currentTime = 0;
    incoming.volume = 0;
    incoming.play().then(() => {
      this.fade(incoming, this.targetVol(), 2600);
      if (this.cur && this.curSrc && this.cur !== incoming) this.fade(this.cur, 0, 1800, true);
      this.idle = this.cur;
      this.cur = incoming;
      this.curSrc = src;
    }).catch(() => { this.unlocked = false; });
  }

  /** request a track; plays now if unlocked, else on the first user gesture */
  private play(src: string) {
    this.wanted = src;
    if (this.unlocked) this.start(src);
  }

  playMenu() {
    if (this.wanted === TRACK.menuMain || this.wanted === TRACK.menuAlt) return; // already on a menu theme
    this.play(Math.random() < 0.7 ? TRACK.menuMain : TRACK.menuAlt);
  }
  playBattle() { this.play(TRACK.battle); }

  isMuted() { return this.muted; }
  volume() { return this.baseVol; }

  toggleMute() {
    this.muted = !this.muted;
    try { localStorage.setItem(MUTE_KEY, this.muted ? '1' : '0'); } catch { /* ignore */ }
    if (this.cur) this.fade(this.cur, this.targetVol(), 300);
    return this.muted;
  }
  setVolume(v: number) {
    this.baseVol = clamp(v);
    try { localStorage.setItem(VOL_KEY, String(this.baseVol)); } catch { /* ignore */ }
    if (this.cur && !this.muted) this.cur.volume = this.baseVol;
  }
}

export const music = new Music();
