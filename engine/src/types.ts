/**
 * Core engine types. Cards are DATA (CardDef, loaded from /data JSON);
 * runtime state (units, players, game) is separate and fully serializable.
 */

export type Klass =
  | 'prophet' | 'warrior' | 'priest' | 'shepherd' | 'patriarch' | 'disciple'
  | 'neutral' | 'adversary';

export type Tag =
  | 'genesis' | 'exodus' | 'judges' | 'kingdom' | 'exile' | 'apostles' | '';

export type CardType = 'minion' | 'spell' | 'relic' | 'leader';

export type Keyword =
  | 'guard' | 'swift' | 'endure' | 'giant_slayer' | 'redeem' | 'scatter';

/** Triggers that a card's `effects` map can key on. */
export type Trigger =
  | 'arrival'   // battlecry, on play
  | 'legacy'    // deathrattle, on death
  | 'redeem'    // Shepherd: when a small ally / Sheep dies
  | 'covenant'  // Patriarch: start of your turn
  | 'scatter'   // Disciple: on death, summon Disciple
  | 'aura';     // continuous while in play

/** The effect-verb vocabulary (CLAUDE.md §8). Adding a card should reuse these. */
export type Verb =
  | 'deal' | 'healHero' | 'healUnit' | 'heal' | 'summon' | 'draw' | 'drawType'
  | 'buff' | 'giveKeyword' | 'foresee' | 'discover' | 'destroy' | 'setAttack'
  | 'returnFromDiscard' | 'transform' | 'exile' | 'costReduce' | 'silence';

/** A targeting selector resolved at effect time. */
export type TargetSpec =
  | 'self' | 'target' | 'allAllies' | 'allEnemies' | 'allUnits'
  | 'randomAlly' | 'randomEnemy' | 'ownHero' | 'enemyHero'
  | 'strongestEnemy' | 'weakestEnemy';

export interface EffectOp {
  verb: Verb;
  target?: TargetSpec;
  amount?: number;
  attack?: number;
  health?: number;
  keyword?: Keyword;
  token?: string;     // def id to summon
  count?: number;
  type?: CardType;    // for drawType
  tag?: Tag;          // for drawType/costReduce filters
  value?: number;     // generic (foresee X, costReduce amount)
  into?: string;      // transform target def id
}

export interface FulfillSpec {
  condition: string;  // e.g. 'slay_giant', 'control_allies', 'survive_damage'
  value?: number;
  into: string;       // def id to transform into
}

/** Static card definition — the shape loaded from /data/*.json. */
export interface CardDef {
  id: string;
  name: string;
  class: Klass;
  tag?: Tag;
  type: CardType;
  cost?: number;
  attack?: number;
  health?: number;
  rarity?: string;
  collectible?: boolean;
  keywords?: Keyword[];
  text?: string;
  effects?: Partial<Record<Trigger, EffectOp[]>>;
  fulfill?: FulfillSpec;
  boss?: boolean;
  hero_power?: { name: string; cost: number; text: string };
}

/** A minion on the board (or a summoned token). */
export interface UnitInstance {
  uid: number;          // unique per game
  defId: string;
  name: string;
  owner: PlayerId;
  attack: number;
  health: number;       // current
  maxHealth: number;
  keywords: Keyword[];
  effects: Partial<Record<Trigger, EffectOp[]>>;
  fulfill?: FulfillSpec;
  /** false while summoning-sick (can't attack yet), unless Swift. */
  ready: boolean;
  attacksThisTurn: number;
  /** Endure shield available (prevents the next instance of damage). */
  endure: boolean;
  /** continuous attack bonus from auras; recomputed on board changes. */
  auraAtk: number;
  /** bookkeeping for Fulfill conditions */
  survivedDamage?: boolean;
  slewGiant?: boolean;
}

export type PlayerId = 0 | 1;

export interface HeroPower {
  name: string;
  cost: number;
  effects: EffectOp[];
  usedThisTurn: boolean;
}

export interface PlayerState {
  id: PlayerId;
  heroHp: number;
  heroMaxHp: number;
  provision: number;      // current, spendable this turn
  provisionMax: number;   // grows +1/turn to cap 10
  deck: CardDef[];        // draw from the front
  hand: CardDef[];
  board: UnitInstance[];
  discard: CardDef[];
  exiled: CardDef[];
  fatigue: number;        // escalating self-damage counter
  heroPower?: HeroPower;
  leaderId?: string;
}

export type Phase = 'mulligan' | 'dawn' | 'main' | 'dusk' | 'over';

export interface GameState {
  players: [PlayerState, PlayerState];
  active: PlayerId;
  turn: number;
  phase: Phase;
  rngState: number;
  nextUid: number;
  winner: PlayerId | null;
  /** Config knobs (tunable per playtest — CLAUDE.md §3). */
  rules: RuleConfig;
}

export interface RuleConfig {
  heroHp: number;         // 30
  boardLimit: number;     // 7
  handLimit: number;      // 10
  provisionCap: number;   // 10
  startingHand: number;   // 3 (second player +1)
}

export const DEFAULT_RULES: RuleConfig = {
  heroHp: 30,
  boardLimit: 7,
  handLimit: 10,
  provisionCap: 10,
  startingHand: 3,
};

/** Player inputs the engine accepts. */
export type Action =
  | { type: 'MULLIGAN'; keep: number[] }                                  // indices of opening hand to keep
  | { type: 'PLAY_CARD'; handIndex: number; targetUid?: number; position?: number }
  | { type: 'ATTACK'; attackerUid: number; targetUid: number | 'hero' }
  | { type: 'HERO_POWER'; targetUid?: number }
  | { type: 'END_TURN' };
