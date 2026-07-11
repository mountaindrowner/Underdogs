/** Haptic feedback: short vibration patterns mapped to the same game beats the
 *  SFX follow, so hits *thump* in the hand on supporting devices. Uses the
 *  Vibration API — works on Android browsers; iOS Safari has no vibrate(), so
 *  every call is a graceful no-op there (a Capacitor Haptics bridge can slot in
 *  behind this same interface for the iOS app later). */
import type { GameEvent } from '../../engine/src/index.ts';

class Haptics {
  private supported = typeof navigator !== 'undefined' && 'vibrate' in navigator;
  enabled = true; // future Settings toggle

  private buzz(pattern: number | number[]) {
    if (!this.supported || !this.enabled) return;
    try { navigator.vibrate(pattern); } catch { /* ignore */ }
  }

  /** picking a card up / selecting an attacker */
  tap() { this.buzz(8); }
  /** a card lands on the board */
  play() { this.buzz(14); }
  /** damage lands — thump scales with the blow */
  hit(amount: number) { this.buzz(amount >= 6 ? [32, 40, 30] : amount >= 3 ? 22 : 10); }
  /** a unit falls */
  death() { this.buzz([14, 30, 22]); }
  /** Fulfill — the earned transformation */
  fulfill() { this.buzz([12, 40, 12, 40, 30]); }
  victory() { this.buzz([22, 60, 22, 60, 44]); }
  defeat() { this.buzz(70); }

  /** Map an animated engine event to a pulse (mirrors sfx.forEvent). */
  forEvent(e: GameEvent) {
    switch (e.t) {
      case 'cardPlayed': this.play(); break;
      case 'damage': this.hit(e.amount); break;
      case 'heroDamage': this.hit(e.amount + 1); break;   // face hits feel heavier
      case 'death': this.death(); break;
      case 'fulfill': this.fulfill(); break;
      case 'endureShatter': this.buzz(18); break;
      case 'gameOver': e.winner === 0 ? this.victory() : this.defeat(); break;
      default: break;
    }
  }
}

export const haptics = new Haptics();
