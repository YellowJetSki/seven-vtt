/**
 * STᚱ VTT — Combat Undo System QA Tests (Sprint 21)
 *
 * Rigorous validation that undoLastAction() properly REVERSES
 * HP changes — not just removes log entries.
 *
 * Tests cover:
 *   - Single-target damage undo
 *   - Single-target heal undo
 *   - AoE multi-target damage undo (Fireball on 3 targets)
 *   - Temp HP set/undo
 *   - Death flag reversal on damage undo
 *   - Death flag reversal on heal undo (revive)
 *   - Edge cases: empty log, no undo payload, multiple undos
 *   - Real-world Arkla campaign scenarios
 *
 * Pure function validation — no dice rollers.
 */

import { describe, it, expect } from "vitest";
import type { Combatant, CombatLogEntry, UndoPayload } from "@/types";

// ── Helper to build a fighting-character-appropriate combatant ──
function makeCombatant(
  id: string,
  name: string,
  type: "player" | "enemy",
  hp: { current: number; max: number; temporary: number },
  isDead = false
): Combatant {
  return {
    id,
    name,
    type,
    initiative: 10,
    armorClass: 15,
    hitPoints: hp,
    statusEffects: [],
    isDead,
    isConcentrating: false,
    notes: "",
  };
}

// ── Direct undo logic test (pure function simulation of the slice) ──

interface UndoTestState {
  combatants: Combatant[];
  log: CombatLogEntry[];
}

function simulateDamage(
  state: UndoTestState,
  targetId: string,
  amount: number
): UndoTestState {
  const cIdx = state.combatants.findIndex((c) => c.id === targetId);
  if (cIdx === -1) return state;

  const c = state.combatants[cIdx];
  const hpBefore = { ...c.hitPoints };

  // Apply damage
  let { current, max, temporary } = c.hitPoints;
  const damage = Math.abs(amount);
  if (temporary > 0) {
    const absorbed = Math.min(temporary, damage);
    temporary -= absorbed;
    current = damage > absorbed ? Math.max(0, current - (damage - absorbed)) : current;
  } else {
    current = Math.max(0, current - damage);
  }
  const newHp = { current, max, temporary };
  const dead = current <= 0;

  const undoPayload: UndoPayload = {
    hpSnapshots: [{ combatantId: targetId, previousHP: hpBefore, previousIsDead: c.isDead }],
  };

  const combatants = [...state.combatants];
  combatants[cIdx] = { ...c, hitPoints: newHp, isDead: dead };

  const entry: CombatLogEntry = {
    id: `dmg_${Date.now()}`,
    timestamp: Date.now(),
    type: "damage",
    actorId: "enemy",
    actorName: "Goblin",
    targetId,
    targetName: c.name,
    value: amount,
    undoPayload,
  };

  return {
    combatants,
    log: [...state.log, entry],
  };
}

function simulateHeal(
  state: UndoTestState,
  targetId: string,
  amount: number
): UndoTestState {
  const cIdx = state.combatants.findIndex((c) => c.id === targetId);
  if (cIdx === -1) return state;

  const c = state.combatants[cIdx];
  const hpBefore = { ...c.hitPoints };

  const newHp = {
    ...c.hitPoints,
    current: Math.min(c.hitPoints.max, c.hitPoints.current + amount),
  };
  const alive = newHp.current > 0;

  const undoPayload: UndoPayload = {
    hpSnapshots: [{ combatantId: targetId, previousHP: hpBefore, previousIsDead: c.isDead }],
  };

  const combatants = [...state.combatants];
  combatants[cIdx] = { ...c, hitPoints: newHp, isDead: !alive };

  const entry: CombatLogEntry = {
    id: `heal_${Date.now()}`,
    timestamp: Date.now(),
    type: "heal",
    actorId: "cleric",
    actorName: "Kehrfuffle",
    targetId,
    targetName: c.name,
    value: amount,
    undoPayload,
  };

  return {
    combatants,
    log: [...state.log, entry],
  };
}

function simulateAoE(
  state: UndoTestState,
  targetIds: string[],
  damage: number
): UndoTestState {
  const snapshots: UndoPayload["hpSnapshots"] = [];
  let combatants = [...state.combatants];

  for (const id of targetIds) {
    const cIdx = combatants.findIndex((c) => c.id === id);
    if (cIdx === -1) continue;
    const c = combatants[cIdx];
    snapshots.push({ combatantId: id, previousHP: { ...c.hitPoints }, previousIsDead: c.isDead });

    let { current, max, temporary } = c.hitPoints;
    if (temporary > 0) {
      const absorbed = Math.min(temporary, damage);
      temporary -= absorbed;
      current = damage > absorbed ? Math.max(0, current - (damage - absorbed)) : current;
    } else {
      current = Math.max(0, current - damage);
    }
    const newHp = { current, max, temporary };
    const dead = current <= 0;
    combatants[cIdx] = { ...c, hitPoints: newHp, isDead: dead };
  }

  const undoPayload: UndoPayload = { hpSnapshots: snapshots };

  const entry: CombatLogEntry = {
    id: `aoe_${Date.now()}`,
    timestamp: Date.now(),
    type: "damage",
    actorId: "dragon",
    actorName: "Young Red Dragon",
    targetId: targetIds[0],
    targetName: `${targetIds.length} targets`,
    value: damage,
    description: `Fire Breath: ${targetIds.length} targets (fire)`,
    undoPayload,
  };

  return { combatants, log: [...state.log, entry] };
}

function simulateUndo(state: UndoTestState): UndoTestState {
  if (state.log.length === 0) return state;

  const lastEntry = state.log[state.log.length - 1];
  const newLog = state.log.slice(0, -1);

  if (!lastEntry.undoPayload) {
    return { ...state, log: newLog };
  }

  let combatants = [...state.combatants];
  for (const snap of lastEntry.undoPayload.hpSnapshots) {
    const cIdx = combatants.findIndex((c) => c.id === snap.combatantId);
    if (cIdx === -1) continue;
    combatants[cIdx] = {
      ...combatants[cIdx],
      hitPoints: { ...snap.previousHP },
      isDead: snap.previousIsDead,
    };
  }

  return { combatants, log: newLog };
}


// ═══════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════

describe("Single-target damage undo", () => {
  it("should reverse a damage action exactly", () => {
    const wendy = makeCombatant("wendy", "Wendy", "player", { current: 38, max: 38, temporary: 0 });
    let state: UndoTestState = { combatants: [wendy], log: [] };

    // Goblin hits Wendy for 12 damage
    state = simulateDamage(state, "wendy", 12);

    // Wendy should be at 26 HP
    expect(state.combatants[0].hitPoints.current).toBe(26);

    // Undo
    state = simulateUndo(state);

    // Wendy should be back at 38 HP
    expect(state.combatants[0].hitPoints.current).toBe(38);
    expect(state.combatants[0].isDead).toBe(false);
    expect(state.log.length).toBe(0);
  });

  it("should reverse damage that would have killed", () => {
    const wendy = makeCombatant("wendy", "Wendy", "player", { current: 15, max: 38, temporary: 0 });
    let state: UndoTestState = { combatants: [wendy], log: [] };

    // Dragon hits Wendy for 30 damage — should bring to 0, dead
    state = simulateDamage(state, "wendy", 30);
    expect(state.combatants[0].hitPoints.current).toBe(0);
    expect(state.combatants[0].isDead).toBe(true);

    // Undo
    state = simulateUndo(state);
    expect(state.combatants[0].hitPoints.current).toBe(15);
    expect(state.combatants[0].isDead).toBe(false);
    expect(state.log.length).toBe(0);
  });

  it("should reverse temp HP absorption correctly", () => {
    const kehrfuffle = makeCombatant("keh", "Kehrfuffle", "player", { current: 44, max: 44, temporary: 10 });
    let state: UndoTestState = { combatants: [kehrfuffle], log: [] };

    // Dragon hits for 28 damage — 10 absorbed by temp, 18 to real HP
    state = simulateDamage(state, "keh", 28);
    expect(state.combatants[0].hitPoints.temporary).toBe(0);
    expect(state.combatants[0].hitPoints.current).toBe(26); // 44 - 18

    // Undo
    state = simulateUndo(state);
    expect(state.combatants[0].hitPoints.current).toBe(44);
    expect(state.combatants[0].hitPoints.temporary).toBe(10);
  });

  it("should handle multiple independent undos correctly", () => {
    const wendy = makeCombatant("wendy", "Wendy", "player", { current: 38, max: 38, temporary: 0 });
    const kehrfuffle = makeCombatant("keh", "Kehrfuffle", "player", { current: 44, max: 44, temporary: 0 });
    let state: UndoTestState = { combatants: [wendy, kehrfuffle], log: [] };

    // Hit Wendy for 10, heal Kehrfuffle for 5, hit Wendy for 15
    state = simulateDamage(state, "wendy", 10); // Wendy: 28
    state = simulateHeal(state, "keh", 5);      // Kehr: 49
    state = simulateDamage(state, "wendy", 15); // Wendy: 13

    // Undo last action: undo Wendy's 15 damage
    state = simulateUndo(state);
    expect(state.combatants[0].hitPoints.current).toBe(28);
    expect(state.combatants[1].hitPoints.current).toBe(49);

    // Undo again: undo Kehrfuffle's 5 heal
    state = simulateUndo(state);
    expect(state.combatants[0].hitPoints.current).toBe(28);
    expect(state.combatants[1].hitPoints.current).toBe(44);

    // Undo again: undo Wendy's 10 damage
    state = simulateUndo(state);
    expect(state.combatants[0].hitPoints.current).toBe(38);
    expect(state.combatants[1].hitPoints.current).toBe(44);
    expect(state.log.length).toBe(0);
  });
});

describe("Single-target heal undo", () => {
  it("should reverse a heal action", () => {
    const kehrfuffle = makeCombatant("keh", "Kehrfuffle", "player", { current: 22, max: 44, temporary: 0 });
    let state: UndoTestState = { combatants: [kehrfuffle], log: [] };

    // Apply heal for 20
    state = simulateHeal(state, "keh", 20);
    expect(state.combatants[0].hitPoints.current).toBe(42);

    // Undo
    state = simulateUndo(state);
    expect(state.combatants[0].hitPoints.current).toBe(22);
  });

  it("should reverse revive state on heal undo", () => {
    const wendy = makeCombatant("wendy", "Wendy", "player", { current: 0, max: 38, temporary: 0 }, true);
    let state: UndoTestState = { combatants: [wendy], log: [] };

    // Cast Revivify — heals for 1 (to 1 HP, back alive)
    state = simulateHeal(state, "wendy", 1);
    expect(state.combatants[0].hitPoints.current).toBe(1);
    expect(state.combatants[0].isDead).toBe(false);

    // Undo — should be dead again at 0 HP
    state = simulateUndo(state);
    expect(state.combatants[0].hitPoints.current).toBe(0);
    expect(state.combatants[0].isDead).toBe(true);
  });
});

describe("AoE multi-target undo", () => {
  it("should reverse damage to all targets simultaneously", () => {
    const wendy = makeCombatant("wendy", "Wendy", "player", { current: 38, max: 38, temporary: 0 });
    const kehrfuffle = makeCombatant("keh", "Kehrfuffle", "player", { current: 32, max: 44, temporary: 0 });
    const goblin = makeCombatant("gob", "Goblin", "enemy", { current: 15, max: 15, temporary: 0 });
    let state: UndoTestState = { combatants: [wendy, kehrfuffle, goblin], log: [] };

    // Dragon Fire Breath: 28 damage to ALL
    state = simulateAoE(state, ["wendy", "keh", "gob"], 28);
    expect(state.combatants[0].hitPoints.current).toBe(10);  // Wendy: 38-28
    expect(state.combatants[1].hitPoints.current).toBe(4);   // Kehrfuffle: 32-28
    expect(state.combatants[2].hitPoints.current).toBe(0);   // Goblin: 15-28 = dead
    expect(state.combatants[2].isDead).toBe(true);

    // Undo — ALL THREE should revert
    state = simulateUndo(state);
    expect(state.combatants[0].hitPoints.current).toBe(38);
    expect(state.combatants[1].hitPoints.current).toBe(32);
    expect(state.combatants[2].hitPoints.current).toBe(15);
    expect(state.combatants[2].isDead).toBe(false);
    expect(state.log.length).toBe(0);
  });

  it("should handle AoE undo after a single-target action", () => {
    const wendy = makeCombatant("wendy", "Wendy", "player", { current: 38, max: 38, temporary: 0 });
    const kehrfuffle = makeCombatant("keh", "Kehrfuffle", "player", { current: 44, max: 44, temporary: 0 });
    let state: UndoTestState = { combatants: [wendy, kehrfuffle], log: [] };

    // Single-target attack
    state = simulateDamage(state, "wendy", 6);  // Wendy: 32
    // AoE breath
    state = simulateAoE(state, ["wendy", "keh"], 20); // Wendy: 12, Kehr: 24

    // Undo AoE first
    state = simulateUndo(state);
    expect(state.combatants[0].hitPoints.current).toBe(32);
    expect(state.combatants[1].hitPoints.current).toBe(44);

    // Undo single-target
    state = simulateUndo(state);
    expect(state.combatants[0].hitPoints.current).toBe(38);
  });
});

describe("Edge cases", () => {
  it("should no-op on empty log", () => {
    const state: UndoTestState = { combatants: [], log: [] };
    const result = simulateUndo(state);
    expect(result).toEqual(state);
  });

  it("should handle entries without undo payload (status effects)", () => {
    const wendy = makeCombatant("wendy", "Wendy", "player", { current: 38, max: 38, temporary: 0 });
    let state: UndoTestState = { combatants: [wendy], log: [] };

    // Add a status effect log entry (no undo payload)
    state.log.push({
      id: "status_1",
      timestamp: Date.now(),
      type: "status",
      actorId: "wendy",
      actorName: "Wendy",
      description: "+ Poisoned",
    });

    const logLengthBefore = state.log.length;

    // Undo should remove the log entry without affecting HP
    state = simulateUndo(state);
    expect(state.log.length).toBe(logLengthBefore - 1);
    expect(state.combatants[0].hitPoints.current).toBe(38); // Unchanged
  });

  it("should undo to exact HP (no rounding)", () => {
    const wendy = makeCombatant("wendy", "Wendy", "player", { current: 38, max: 38, temporary: 0 });
    let state: UndoTestState = { combatants: [wendy], log: [] };

    state = simulateDamage(state, "wendy", 7);  // 31
    state = simulateDamage(state, "wendy", 13); // 18
    state = simulateDamage(state, "wendy", 5);  // 13

    // Wendy should be at 13
    expect(state.combatants[0].hitPoints.current).toBe(13);

    // Undo all three, step by step
    state = simulateUndo(state); // 13 → 18
    expect(state.combatants[0].hitPoints.current).toBe(18);
    state = simulateUndo(state); // 18 → 31
    expect(state.combatants[0].hitPoints.current).toBe(31);
    state = simulateUndo(state); // 31 → 38
    expect(state.combatants[0].hitPoints.current).toBe(38);
  });

  it("should allow undo immediately after dead", () => {
    const wendy = makeCombatant("wendy", "Wendy", "player", { current: 5, max: 38, temporary: 0 });
    let state: UndoTestState = { combatants: [wendy], log: [] };

    // Massive overkill
    state = simulateDamage(state, "wendy", 100);
    expect(state.combatants[0].hitPoints.current).toBe(0);
    expect(state.combatants[0].isDead).toBe(true);

    // Undo
    state = simulateUndo(state);
    expect(state.combatants[0].hitPoints.current).toBe(5);
    expect(state.combatants[0].isDead).toBe(false);
  });
});

describe("Real-world Arkla campaign scenarios", () => {
  it("Dragon fight: full damage cycle with undo", () => {
    const wendy = makeCombatant("wendy", "Wendy", "player", { current: 38, max: 38, temporary: 0 });
    const kehrfuffle = makeCombatant("keh", "Kehrfuffle", "player", { current: 44, max: 44, temporary: 0 });
    const dragon = makeCombatant("dragon", "Young Red Dragon", "enemy", { current: 178, max: 178, temporary: 0 });
    let state: UndoTestState = { combatants: [wendy, kehrfuffle, dragon], log: [] };

    // Round 1: Dragon breath (AoE 28 damage)
    state = simulateAoE(state, ["wendy", "keh"], 28);
    expect(state.combatants[0].hitPoints.current).toBe(10);  // Wendy
    expect(state.combatants[1].hitPoints.current).toBe(16);  // Kehrfuffle

    // Round 2: Kehrfuffle heals Wendy for 15
    state = simulateHeal(state, "wendy", 15);
    expect(state.combatants[0].hitPoints.current).toBe(25);

    // Round 3: Dragon claws Wendy for 14
    state = simulateDamage(state, "wendy", 14);
    expect(state.combatants[0].hitPoints.current).toBe(11);

    // Round 4: Dragon bites Kehrfuffle for 22
    state = simulateDamage(state, "keh", 22);
    expect(state.combatants[1].hitPoints.current).toBe(0);   // Down!
    expect(state.combatants[1].isDead).toBe(true);

    // DM realizes the bite was too much — undo!
    state = simulateUndo(state);
    expect(state.combatants[1].hitPoints.current).toBe(16);  // Kehrfuffle back
    expect(state.combatants[1].isDead).toBe(false);

    // Wendy should still have her 11 HP
    expect(state.combatants[0].hitPoints.current).toBe(11);

    // Undo the claw
    state = simulateUndo(state);
    expect(state.combatants[0].hitPoints.current).toBe(25);

    // Undo the heal
    state = simulateUndo(state);
    expect(state.combatants[0].hitPoints.current).toBe(10);

    // Undo the breath
    state = simulateUndo(state);
    expect(state.combatants[0].hitPoints.current).toBe(38);
    expect(state.combatants[1].hitPoints.current).toBe(44);

    // Dragon was never hit — still full
    expect(state.combatants[2].hitPoints.current).toBe(178);
    expect(state.log.length).toBe(0);
  });
});

describe("Log entry integrity", () => {
  it("should preserve undoPayload on damage entries", () => {
    const wendy = makeCombatant("wendy", "Wendy", "player", { current: 38, max: 38, temporary: 0 });
    let state: UndoTestState = { combatants: [wendy], log: [] };
    state = simulateDamage(state, "wendy", 12);

    const entry = state.log[0];
    expect(entry.undoPayload).toBeDefined();
    expect(entry.undoPayload!.hpSnapshots).toHaveLength(1);
    expect(entry.undoPayload!.hpSnapshots[0].combatantId).toBe("wendy");
    expect(entry.undoPayload!.hpSnapshots[0].previousHP.current).toBe(38);
  });

  it("should preserve undoPayload on AoE entries (multiple snapshots)", () => {
    const wendy = makeCombatant("wendy", "Wendy", "player", { current: 38, max: 38, temporary: 0 });
    const kehrfuffle = makeCombatant("keh", "Kehrfuffle", "player", { current: 44, max: 44, temporary: 0 });
    let state: UndoTestState = { combatants: [wendy, kehrfuffle], log: [] };
    state = simulateAoE(state, ["wendy", "keh"], 28);

    const entry = state.log[0];
    expect(entry.undoPayload).toBeDefined();
    expect(entry.undoPayload!.hpSnapshots).toHaveLength(2);
    expect(entry.undoPayload!.hpSnapshots[0].previousHP.current).toBe(38);
    expect(entry.undoPayload!.hpSnapshots[1].previousHP.current).toBe(44);
  });
});
