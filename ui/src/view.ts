/** The animation view-model. The board is reconstructed purely from the
 *  engine's GameEvent stream — the UI holds NO engine state. Each event is one
 *  "beat": transient flags (lunge, damage float, hit flash) live for one beat,
 *  then are cleared; dead units fade during their beat and are removed next. */
import type { GameEvent, PlayerId, CardDef } from '../../engine/src/index.ts';

export interface VUnit {
  uid: number; defId: string; name: string; owner: PlayerId;
  attack: number; health: number; maxHealth: number; keywords: string[];
  // transient (one beat):
  enter?: boolean; dead?: boolean; lunge?: number; fulfilling?: boolean;
  dmg?: number; heal?: number; hit?: boolean; buffed?: boolean; endure?: boolean;
}
export interface HeroV { hp: number; maxHp: number; dmg?: number; heal?: number; shake?: boolean; }
export interface Prov { cur: number; max: number; }

export interface View {
  heroes: [HeroV, HeroV];
  boards: [VUnit[], VUnit[]];
  prov: [Prov, Prov];
  active: PlayerId; turn: number; phase: string;
  banner?: string; over: PlayerId | null;
}

export function initialView(hp0: number, hp1: number = hp0): View {
  return {
    heroes: [{ hp: hp0, maxHp: hp0 }, { hp: hp1, maxHp: hp1 }],
    boards: [[], []],
    prov: [{ cur: 0, max: 0 }, { cur: 0, max: 0 }],
    active: 0, turn: 0, phase: 'dawn', over: null,
  };
}

function find(v: View, uid: number): VUnit | undefined {
  return v.boards[0].find((u) => u.uid === uid) ?? v.boards[1].find((u) => u.uid === uid);
}

/** Clear one-beat transient flags and remove units that finished their death fade. */
export function clearTransient(v: View): View {
  const scrub = (u: VUnit): VUnit => ({
    ...u, enter: false, lunge: 0, fulfilling: false, hit: false, buffed: false,
    endure: false, dmg: undefined, heal: undefined,
  });
  return {
    ...v,
    heroes: [{ ...v.heroes[0], dmg: undefined, heal: undefined, shake: false },
             { ...v.heroes[1], dmg: undefined, heal: undefined, shake: false }],
    boards: [v.boards[0].filter((u) => !u.dead).map(scrub),
             v.boards[1].filter((u) => !u.dead).map(scrub)],
  };
}

export function applyEvent(v: View, e: GameEvent, reg: Map<string, CardDef>): View {
  const nv: View = { ...v, heroes: [{ ...v.heroes[0] }, { ...v.heroes[1] }],
    boards: [[...v.boards[0]], [...v.boards[1]]], prov: [{ ...v.prov[0] }, { ...v.prov[1] }] };
  const upd = (uid: number, f: (u: VUnit) => VUnit) => {
    for (const b of [0, 1] as const) {
      const i = nv.boards[b].findIndex((u) => u.uid === uid);
      if (i >= 0) { nv.boards[b] = [...nv.boards[b]]; nv.boards[b][i] = f(nv.boards[b][i]); return; }
    }
  };
  switch (e.t) {
    case 'phase':
      nv.active = e.player; nv.turn = e.turn; nv.phase = e.phase;
      if (e.phase === 'dawn') nv.banner = `Player ${e.player + 1} — Turn ${e.turn}`;
      break;
    case 'provision':
      nv.prov[e.player] = { cur: e.current, max: e.max }; break;
    case 'summon': {
      const def = reg.get(e.defId);
      const u: VUnit = {
        uid: e.uid, defId: e.defId, name: def?.name ?? e.defId, owner: e.owner,
        attack: def?.attack ?? 0, health: def?.health ?? 1, maxHealth: def?.health ?? 1,
        keywords: [...(def?.keywords ?? [])], enter: true,
      };
      const b = nv.boards[e.owner] = [...nv.boards[e.owner]];
      b.splice(Math.min(e.position, b.length), 0, u);
      break;
    }
    case 'attackDeclared':
      upd(e.attacker, (u) => ({ ...u, lunge: u.owner === 0 ? -1 : 1 })); break;
    case 'damage':
      upd(e.targetUid, (u) => ({ ...u, health: u.health - e.amount, dmg: e.amount, hit: true })); break;
    case 'heroDamage':
      nv.heroes[e.player] = { ...nv.heroes[e.player], hp: nv.heroes[e.player].hp - e.amount, dmg: e.amount, shake: true };
      break;
    case 'heal':
      upd(e.targetUid, (u) => ({ ...u, health: Math.min(u.maxHealth, u.health + e.amount), heal: e.amount })); break;
    case 'heroHeal':
      nv.heroes[e.player] = { ...nv.heroes[e.player], hp: nv.heroes[e.player].hp + e.amount, heal: e.amount }; break;
    case 'endureShatter':
      upd(e.uid, (u) => ({ ...u, endure: true })); break;
    case 'buff':
      upd(e.uid, (u) => ({ ...u, attack: u.attack + e.attack, maxHealth: u.maxHealth + e.health, health: u.health + e.health, buffed: true })); break;
    case 'setAttack':
      upd(e.uid, (u) => ({ ...u, attack: e.attack, buffed: true })); break;
    case 'keyword':
      upd(e.uid, (u) => ({ ...u, keywords: e.gained ? [...new Set([...u.keywords, e.keyword])] : u.keywords.filter((k) => k !== e.keyword) })); break;
    case 'silence':
      upd(e.uid, (u) => ({ ...u, keywords: [] })); break;
    case 'death':
      upd(e.uid, (u) => ({ ...u, dead: true })); break;
    case 'fulfill': {
      const def = reg.get(e.intoDef);
      upd(e.uid, (u) => ({ ...u, defId: e.intoDef, name: def?.name ?? u.name,
        attack: def?.attack ?? u.attack, maxHealth: def?.health ?? u.maxHealth,
        health: def?.health ?? u.maxHealth, keywords: [...(def?.keywords ?? [])], fulfilling: true }));
      break;
    }
    case 'gameOver':
      nv.over = e.winner; nv.banner = `Player ${e.winner + 1} wins`; break;
  }
  return nv;
}
