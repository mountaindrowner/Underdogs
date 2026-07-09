/**
 * The GameEvent stream — the CONTRACT between the deterministic rules engine
 * and the animation/UI layer (CLAUDE.md §12). Every state change the player
 * should *see* is emitted here in resolution order. The UI plays these back as
 * animations (lunge, impact flash, floating damage, death-fade, Fulfill burst,
 * Scatter spray, Redeem re-form, Endure shatter…) and then reflects the state.
 *
 * The engine never imports UI code; the UI never mutates state — it only reads
 * state and animates events. This is what keeps the board Hearthstone-alive.
 */
import type { PlayerId, Keyword, Phase } from './types.ts';

export type GameEvent =
  | { t: 'gameStart'; seed: number; first: PlayerId }
  | { t: 'phase'; phase: Phase; player: PlayerId; turn: number }
  | { t: 'provision'; player: PlayerId; current: number; max: number }
  | { t: 'draw'; player: PlayerId; defId: string; toHandSize: number }
  | { t: 'burnCard'; player: PlayerId; defId: string }          // over hand limit
  | { t: 'fatigue'; player: PlayerId; amount: number }
  | { t: 'cardPlayed'; player: PlayerId; defId: string }
  | { t: 'summon'; uid: number; defId: string; owner: PlayerId; position: number }
  | { t: 'attackDeclared'; attacker: number; target: number | 'hero'; targetOwner: PlayerId }
  | { t: 'damage'; targetUid: number; amount: number; sourceUid?: number }
  | { t: 'heroDamage'; player: PlayerId; amount: number; sourceUid?: number }
  | { t: 'heal'; targetUid: number; amount: number }
  | { t: 'heroHeal'; player: PlayerId; amount: number }
  | { t: 'endureShatter'; uid: number }                          // shield blocked the hit
  | { t: 'buff'; uid: number; attack: number; health: number }
  | { t: 'setAttack'; uid: number; attack: number }
  | { t: 'keyword'; uid: number; keyword: Keyword; gained: boolean }
  | { t: 'silence'; uid: number }
  | { t: 'death'; uid: number; defId: string; owner: PlayerId }  // fall + fade to light
  | { t: 'legacy'; uid: number; defId: string }                 // deathrattle firing
  | { t: 'redeem'; uid: number; defId: string }                 // Shepherd re-form
  | { t: 'scatter'; uid: number; defId: string }                // Disciple spray
  | { t: 'fulfill'; uid: number; fromDef: string; intoDef: string } // gold burst + morph
  | { t: 'heroPower'; player: PlayerId; name: string }
  | { t: 'foresee'; player: PlayerId; count: number }
  | { t: 'discover'; player: PlayerId; count: number }
  /** a unit's continuous aura bonuses changed (David's +1, Good Fold's Guard…) */
  | { t: 'auraUpdate'; uid: number; attack: number; health: number; keywords: Keyword[] }
  | { t: 'relicPlaced'; player: PlayerId; defId: string }        // standing relic set down
  | { t: 'returnToHand'; player: PlayerId; defId: string }       // Lost Sheep comes home
  | { t: 'shuffleIn'; player: PlayerId; defId: string }          // Jonah, three days later
  | { t: 'gameOver'; winner: PlayerId };

/** Collects events during an action, in resolution order. */
export class EventSink {
  readonly events: GameEvent[] = [];
  emit(e: GameEvent): void {
    this.events.push(e);
  }
}
