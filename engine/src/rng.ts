/**
 * Deterministic, seedable PRNG (mulberry32). The whole engine draws all
 * randomness from here so a game is fully reproducible from its seed —
 * enabling headless AI-vs-AI balance sims and replay. Never use Math.random.
 */
export interface Rng {
  /** Raw state, so it can be serialized into GameState and resumed. */
  state: number;
  /** Next float in [0, 1). */
  next(): number;
  /** Integer in [0, n). */
  int(n: number): number;
  /** In-place Fisher–Yates shuffle (deterministic). Returns the same array. */
  shuffle<T>(arr: T[]): T[];
}

export function makeRng(seed: number): Rng {
  const rng: Rng = {
    state: seed >>> 0,
    next() {
      // mulberry32
      this.state = (this.state + 0x6d2b79f5) >>> 0;
      let t = this.state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
    int(n) {
      return Math.floor(this.next() * n);
    },
    shuffle(arr) {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = this.int(i + 1);
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    },
  };
  return rng;
}

/** Rebuild an Rng from a serialized state value (for resuming a game). */
export function rngFromState(state: number): Rng {
  const r = makeRng(0);
  r.state = state >>> 0;
  return r;
}
