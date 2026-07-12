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
  | 'guard' | 'swift' | 'endure' | 'giant_slayer' | 'redeem' | 'scatter'
  // marker keywords (class flavor labels; no standalone rules of their own)
  | 'foresee' | 'covenant' | 'raise'
  // Jael's Tent Peg: destroys already-damaged units it strikes
  | 'executes_damaged';

/** Triggers that a card's `effects` map can key on. */
export type Trigger =
  | 'arrival'      // battlecry, on play
  | 'legacy'       // deathrattle, on death
  | 'redeem'       // Shepherd: on death (ops with op.trigger are listeners instead)
  | 'covenant'     // Patriarch: start of your turn
  | 'scatter'      // Disciple: on death, summon Disciple (extra ops)
  | 'aura'         // continuous while in play
  | 'startOfTurn'  // start of your turn (non-Patriarch phrasing)
  | 'endOfTurn'    // end of your turn
  | 'onDeath'      // death replacement (Jonah, Elijah, Joseph)
  | 'raise'        // Priest: listener — when an ally dies, restore it
  | 'trigger'      // generic listener; ops carry `on` (ally_death, self_damaged)
  | 'passive';     // static modifiers (Zadok: heals restore +1)

/** The effect-verb vocabulary (CLAUDE.md §8). Adding a card should reuse these. */
export type Verb =
  | 'deal' | 'healHero' | 'healUnit' | 'heal' | 'summon' | 'draw' | 'drawType'
  | 'buff' | 'giveKeyword' | 'foresee' | 'discover' | 'destroy' | 'setAttack'
  | 'returnFromDiscard' | 'transform' | 'exile' | 'costReduce' | 'silence'
  | 'auraBuff'          // in aura: continuous; in arrival with grantToTarget: grants an aura
  | 'returnToHand' | 'shuffleIntoDeck' | 'delayedTransform'
  | 'conditionalDeal' | 'gainForEachSheep' | 'discoverFromDeck'
  | 'onHealBonus' | 'discountHand'
  | 'gainProvision';    // +N Provision to spend this turn (the Loaf of Bread token)

/** A targeting selector resolved at effect time. */
export type TargetSpec =
  | 'self' | 'target' | 'allAllies' | 'allEnemies' | 'allUnits'
  | 'randomAlly' | 'randomEnemy' | 'ownHero' | 'enemyHero'
  | 'strongestEnemy' | 'weakestEnemy'
  // explicit-target aliases (the player picks; the side is validated)
  | 'enemy' | 'ally' | 'anyUnit' | 'anyCharacter' | 'anyFriendlyOrHero'
  // computed selectors
  | 'damagedAlly' | 'mostHealthEnemy' | 'cheapestEnemy' | 'allEnemiesWithoutGuard'
  // tribes
  | 'friendlySheep' | 'friendlyDisciple' | 'friendlyDisciples' | 'friendlyHeirs'
  // graveyard selectors (returnFromDiscard)
  | 'lastFallenAlly' | 'strongestFallenAlly' | 'alliesDiedThisTurn'
  // cost auras
  | 'allHand';

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
  // ---- modifiers ----
  scope?: 'other' | 'all';          // aura: exclude the source ("your OTHER units")
  condition?: string;               // fewer_units_than_enemy, control_david, target_is_priest…
  grantToTarget?: boolean;          // auraBuff in arrival: the TARGET carries the aura
  grantKeyword?: Keyword;           // aura: matching units also get this keyword
  refreshEachTurn?: boolean;        // aura giveKeyword: re-arm at the start of your turn
  perEnemyUnit?: boolean;           // buff: multiply by enemy unit count
  ifLastCard?: { attack?: number; health?: number }; // Widow's Mite: bigger if hand is empty
  thisTurn?: boolean;               // buff: temporary, wears off at your next dawn
  toFull?: boolean;                 // heal: restore to max
  toField?: boolean;                // returnFromDiscard: to the board (else to hand)
  withKeyword?: Keyword;            // summon/returnFromDiscard: unit arrives with this
  oncePerTurn?: boolean;            // raise listener throttle
  oncePerGame?: boolean;            // Dorcas: once per game
  replaceDeath?: boolean;           // onDeath: this op replaces going to the discard
  onTurn?: number;                  // covenant: only on the Nth tick (Enoch)
  random?: boolean;                 // drawType: random matching card instead of first
  cardType?: CardType;              // alias of `type` used by some data
  keep?: number;                    // discoverFromDeck: how many are kept
  delayTurns?: number;              // delayedTransform: turns until return (Joseph)
  drawIfLegendary?: boolean;        // foresee rider (Thomas)
  trigger?: string;                 // op-level listener filter (friendlySheepDies)
  on?: string;                      // `trigger` trigger: ally_death, self_damaged
  delayToNextTurn?: boolean;        // queue the op for your next dawn (Job)
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
  hero_power?: { name: string; cost: number; text: string; effects?: EffectOp[] };
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
  /** continuous health bonus from auras; recomputed on board changes. */
  auraHp: number;
  /** keywords granted by auras (revoked when the aura leaves). */
  auraKw: Keyword[];
  /** temporary attack (thisTurn buffs); cleared at the owner's next dawn. */
  tempAtk: number;
  /** how many of the owner's turns this unit has begun (covenant onTurn). */
  covenantTicks: number;
  /** global turn counter when this unit entered play (auto_next_turn). */
  enteredTurn: number;
  /** ops queued for the owner's next dawn (delayToNextTurn). */
  pending?: EffectOp[];
  /** raise-listener throttle: the turn it last fired. */
  raiseUsedTurn?: number;
  /** bookkeeping for Fulfill conditions */
  survivedDamage?: boolean;
  slewGiant?: boolean;
  survivedStronger?: boolean;
  survivedDamagedTurn?: boolean;
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
  /** standing relics: persistent, non-attackable; their auras/turn triggers run. */
  relics: UnitInstance[];
  discard: CardDef[];
  exiled: CardDef[];
  /** friendly minions that died on the board (Raise / returnFromDiscard pool). */
  fallen: { defId: string; turn: number }[];
  /** units returning after a delay (Joseph, Lord of Egypt). */
  delayed: { into: string; remaining: number }[];
  /** oncePerGame effect gates already consumed (defId:trigger keys). */
  usedOnce: string[];
  /** discount on the next card(s) this turn (Terah's Caravan). */
  nextCardDiscount: number;
  fatigue: number;        // escalating self-damage counter
  heroPower?: HeroPower;
  leaderId?: string;
}

export type Phase = 'mulligan' | 'dawn' | 'main' | 'dusk' | 'over';

/** A mid-resolution player decision (Foresee reorder / Discover pick). While
 *  one is pending, the interactive player's normal actions are blocked; they
 *  send a RESOLVE_CHOICE action to continue. Non-interactive players (the AI)
 *  never pause — their choices auto-resolve inline, so the engine stays a pure,
 *  fully-resolving reducer for lookahead and AI-vs-AI. */
export interface PendingChoice {
  kind: 'foresee' | 'discover';
  player: PlayerId;
  /** the revealed cards, in current order — always the top `cardIds.length`
   *  cards of that player's deck (they stay in the deck until resolved). */
  cardIds: string[];
  /** discover: how many of the revealed cards to keep (0 for foresee). */
  pick: number;
  /** ops still to run after the choice resolves (e.g. Elisha's heal). */
  resume: EffectOp[];
  sourceUid?: number;
  targetUid?: number;
}

export interface GameState {
  players: [PlayerState, PlayerState];
  active: PlayerId;
  turn: number;
  phase: Phase;
  rngState: number;
  nextUid: number;
  winner: PlayerId | null;
  /** an open Foresee/Discover awaiting the interactive player (else null). */
  pending: PendingChoice | null;
  /** which player pauses for interactive choices (the human); null = auto-resolve
   *  all choices inline (tests, AI-vs-AI). Set by the UI to 0. */
  interactivePlayer: PlayerId | null;
  /** Config knobs (tunable per playtest — CLAUDE.md §3). */
  rules: RuleConfig;
}

export interface RuleConfig {
  heroHp: number;         // 30
  boardLimit: number;     // 7
  handLimit: number;      // 10
  provisionCap: number;   // 10
  startingHand: number;   // 3 (second player +1)
  secondPlayerBonus: number; // # of Loaf of Bread tokens the 2nd player starts with (each = +1 Provision for a turn); 0 disables
}

export const DEFAULT_RULES: RuleConfig = {
  heroHp: 30,
  boardLimit: 7,
  handLimit: 10,
  provisionCap: 10,
  startingHand: 3,
  secondPlayerBonus: 1,
};

/** Player inputs the engine accepts. */
export type Action =
  | { type: 'MULLIGAN'; keep: number[] }                                  // indices of opening hand to keep
  | { type: 'PLAY_CARD'; handIndex: number; targetUid?: number; position?: number }
  | { type: 'ATTACK'; attackerUid: number; targetUid: number | 'hero' }
  | { type: 'HERO_POWER'; targetUid?: number }
  // resolve an open Foresee/Discover. Indices are into PendingChoice.cardIds.
  //  Foresee: `keep` = indices to place on top (in the given order); `bottom` =
  //  indices sent to the bottom. Discover: `picked` = indices taken into hand.
  | { type: 'RESOLVE_CHOICE'; keep?: number[]; bottom?: number[]; picked?: number[] }
  | { type: 'END_TURN' };
