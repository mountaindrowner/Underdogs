/**
 * UNDERDOGS rules engine — public API.
 *
 * Deterministic (seeded), UI-dependency-free, and event-emitting so the React
 * animation layer can replay combat beats. See engine/README.md for the
 * architecture and the GameEvent animation contract.
 */
export * from './types.ts';
export * from './events.ts';
export { makeRng, rngFromState, type Rng } from './rng.ts';
export { createGame, applyAction, registerDefs, effAttack, type GameConfig } from './engine.ts';
export { flattenCards, collectDefs, makeRegistry, buildDeck } from './cards.ts';
// Node-only disk loader lives in ./cards.node.ts (kept out of the browser bundle).
export { applyEffect, runTrigger, resolveTargets, type Ctx, type Target } from './effects.ts';
