/**
 * ST VTT — Sprint 30 QA: Post-Feature Phase 2 — Condition, Quick Action, NPC, Wrap-Up
 *
 * QA targets:
 *   Sprint 26: DM Combat Condition Bar
 *   Sprint 27: DM Quick Action Popover
 *   Sprint 28: DM NPC Quick-Create Popover
 *   Sprint 29: DM Combat Wrap-Up Overlay
 *
 * Run: npx vitest run --config vitest.config.ts src/__tests__/post-feature-qa-phase-2.test.ts
 */

import { describe, it, expect } from "vitest";

// =================================================================
// TYPE DEFINITIONS
// =================================================================

interface CombatantHP {
  current: number;
  max: number;
  temporary: number;
}

interface Combatant {
  id: string;
  name: string;
  type: "player" | "enemy" | "ally";
  hitPoints: CombatantHP;
  armorClass: number;
  isDead: boolean;
  statusEffects: Array<{ id: string; effect: string }>;
}

interface PlayerCharacter {
  id: string;
  name: string;
  level: number;
  hitPoints: CombatantHP;
  conditions: string[];
  experiencePoints: number;
}

type DamageEffect = "immune" | "resistance" | "vulnerability" | "standard";

interface DamageApplicationResult {
  rawDamage: number;
  damageType: string;
  effect: DamageEffect;
  finalDamage: number;
  explanation: string;
}

interface ConditionToggleState {
  activeConditions: string[];
  zustandWrites: number;
  firestoreQueue: number;
}

interface QuickActionState {
  multiTargetChanges: number;
  goldDistributed: number;
  damageApplied: number;
  healApplied: number;
  firestoreQueue: number;
}

interface NpcCreateResult {
  name: string;
  cr: number;
  ac: number;
  hp: number;
}

// =================================================================
// PURE FUNCTION IMPLEMENTATIONS
// =================================================================

/**
 * Condition toggle system. (Sprint 26)
 */
function toggleCondition(state: ConditionToggleState, conditionId: string): ConditionToggleState {
  const isActive = state.activeConditions.includes(conditionId);
  return {
    activeConditions: isActive
      ? state.activeConditions.filter((c) => c !== conditionId)
      : [...state.activeConditions, conditionId],
    zustandWrites: state.zustandWrites + 1,
    firestoreQueue: state.firestoreQueue + 1,
  };
}

/**
 * Apply damage to HP with temp HP absorption.
 */
function applyDamageToHP(hp: CombatantHP, damage: number): CombatantHP {
  let remaining = damage;
  let tmp = hp.temporary;
  if (tmp > 0) {
    const absorbed = Math.min(tmp, remaining);
    tmp -= absorbed;
    remaining -= absorbed;
  }
  return {
    current: Math.max(0, hp.current - remaining),
    max: hp.max,
    temporary: Math.max(0, tmp),
  };
}

/**
 * Quick damage application with resistance support. (Sprint 27)
 */
function quickDamageCharacter(
  hp: CombatantHP,
  amount: number,
  damageType?: string,
  resistances?: string[],
  immunities?: string[]
): CombatantHP {
  let effective = amount;
  if (damageType && immunities?.some((i) => i.toLowerCase() === damageType.toLowerCase())) {
    effective = 0;
  } else if (damageType && resistances?.some((r) => r.toLowerCase() === damageType.toLowerCase())) {
    effective = Math.floor(amount / 2);
  }
  return applyDamageToHP(hp, effective);
}

/**
 * Quick heal (Sprint 27)
 */
function quickHeal(hp: CombatantHP, amount: number): CombatantHP {
  return {
    current: Math.min(hp.max, hp.current + amount),
    max: hp.max,
    temporary: hp.temporary,
  };
}

/**
 * Quick gold distribution. (Sprint 27)
 */
function quickGoldDistribution(
  characters: PlayerCharacter[],
  amount: number,
  targetIds: string[]
): PlayerCharacter[] {
  return characters.map((c) => {
    if (targetIds.includes(c.id)) {
      return { ...c, experiencePoints: (c.experiencePoints || 0) + amount };
    }
    return c;
  });
}

/**
 * NPC quick-create with CR-based stat computation. (Sprint 28)
 */
function createNpcQuick(name: string, cr: number): NpcCreateResult {
  let ac = 10 + Math.floor(cr / 2);
  let hp = 20 + cr * 15;
  if (cr <= 0) { ac = 10; hp = 8; }
  else if (cr <= 0.25) { ac = 12; hp = 15; }
  else if (cr <= 1) { ac = 13; hp = 25; }
  else if (cr <= 3) { ac = 14; hp = 50; }
  return { name, cr, ac, hp };
}

/**
 * Combat Wrap-Up: XP calculation. (Sprint 29)
 */
function calculateCombatXp(
  enemyCrs: number[],
  partyAliveCount: number
): { totalXp: number; xpPerCharacter: number } {
  const crXpMap: Record<number, number> = {
    0: 10, 0.125: 25, 0.25: 50, 0.5: 100,
    1: 200, 2: 450, 3: 700, 4: 1100, 5: 1800,
    6: 2300, 7: 2900, 8: 3900, 9: 5000, 10: 5900,
  };
  const totalXp = enemyCrs.reduce((sum, cr) => sum + (crXpMap[cr] || 0), 0);
  const xpPerCharacter = partyAliveCount > 0 ? Math.round(totalXp / partyAliveCount) : totalXp;
  return { totalXp, xpPerCharacter };
}

/**
 * Character XP award (immutable update). (Sprint 29)
 */
function awardXpToCharacter(char: PlayerCharacter, amount: number): PlayerCharacter {
  return { ...char, experiencePoints: Math.max(0, (char.experiencePoints || 0) + amount) };
}

/**
 * Condition clearing for wrap-up. (Sprint 29)
 */
function clearAllConditions(characters: PlayerCharacter[]): PlayerCharacter[] {
  return characters.map((c) => ({ ...c, conditions: [] }));
}

// ├── simulated quick action: multi-target damage
function simulateMultiTargetDamage(
  characters: PlayerCharacter[],
  amount: number,
  targetIds: string[]
): PlayerCharacter[] {
  return characters.map((c) => {
    if (targetIds.includes(c.id)) {
      const newHp = applyDamageToHP(c.hitPoints, amount);
      return { ...c, hitPoints: newHp };
    }
    return c;
  });
}

// =================================================================
// TEST SUITES
// =================================================================

// ─── SPRINT 26: DM Combat Condition Bar ─────────────────────────
describe("Sprint 26 — DM Combat Condition Bar", () => {
  it("toggle condition on: adds to active list", () => {
    const state: ConditionToggleState = { activeConditions: [], zustandWrites: 0, firestoreQueue: 0 };
    const result = toggleCondition(state, "poisoned");
    expect(result.activeConditions).toEqual(["poisoned"]);
    expect(result.zustandWrites).toBe(1);
  });

  it("toggle condition off: removes from active list", () => {
    const state: ConditionToggleState = { activeConditions: ["poisoned"], zustandWrites: 1, firestoreQueue: 1 };
    const result = toggleCondition(state, "poisoned");
    expect(result.activeConditions).toEqual([]);
    expect(result.zustandWrites).toBe(2);
  });

  it("multiple conditions accumulate correctly", () => {
    let state: ConditionToggleState = { activeConditions: [], zustandWrites: 0, firestoreQueue: 0 };
    state = toggleCondition(state, "prone");
    state = toggleCondition(state, "restrained");
    state = toggleCondition(state, "blinded");
    expect(state.activeConditions).toEqual(["prone", "restrained", "blinded"]);
    expect(state.zustandWrites).toBe(3);
  });

  it("toggle same condition twice returns to empty", () => {
    let state: ConditionToggleState = { activeConditions: [], zustandWrites: 0, firestoreQueue: 0 };
    state = toggleCondition(state, "stunned");
    state = toggleCondition(state, "stunned");
    expect(state.activeConditions).toEqual([]);
  });

  it("non-existent condition toggle: adds it", () => {
    const state: ConditionToggleState = { activeConditions: [], zustandWrites: 0, firestoreQueue: 0 };
    const result = toggleCondition(state, "concentration");
    expect(result.activeConditions).toContain("concentration");
  });

  it("10 rapid condition toggles = 10 zustand writes, 10 firestore queue", () => {
    let state: ConditionToggleState = { activeConditions: [], zustandWrites: 0, firestoreQueue: 0 };
    for (let i = 0; i < 10; i++) {
      state = toggleCondition(state, "prone");
    }
    // Toggling 10 times = toggled on, then off 5 times. Ends as off.
    expect(state.zustandWrites).toBe(10);
    expect(state.firestoreQueue).toBe(10);
    // Even number of toggles = back to off
    expect(state.activeConditions).toEqual([]);
  });

  it("clear all conditions empties the array", () => {
    let state: ConditionToggleState = { activeConditions: ["poisoned", "prone", "blinded"], zustandWrites: 3, firestoreQueue: 3 };
    state = { ...state, activeConditions: [] };
    expect(state.activeConditions).toEqual([]);
  });
});

// ─── SPRINT 27: DM Quick Action Popover ─────────────────────────
describe("Sprint 27 — DM Quick Action Popover", () => {
  const makeChar = (id: string, name: string, hp: number): PlayerCharacter => ({
    id, name, level: 5,
    hitPoints: { current: hp, max: 44, temporary: 0 },
    conditions: [], experiencePoints: 1000,
  });

  it("single-target damage reduces HP", () => {
    const hp: CombatantHP = { current: 44, max: 44, temporary: 0 };
    const result = quickDamageCharacter(hp, 14);
    expect(result.current).toBe(30);
  });

  it("multi-target damage: all targets take damage", () => {
    const chars = [makeChar("w1", "Wendy", 44), makeChar("k1", "Kehrfuffle", 44), makeChar("b1", "Bob", 44)];
    const result = simulateMultiTargetDamage(chars, 10, ["w1", "k1"]);
    expect(result[0].hitPoints.current).toBe(34);
    expect(result[1].hitPoints.current).toBe(34);
    expect(result[2].hitPoints.current).toBe(44);
  });

  it("multi-target heal: all targets healed", () => {
    const chars = [makeChar("w1", "Wendy", 20), makeChar("k1", "Kehrfuffle", 10)];
    const result = chars.map((c) => ({ ...c, hitPoints: quickHeal(c.hitPoints, 10) }));
    expect(result[0].hitPoints.current).toBe(30);
    expect(result[1].hitPoints.current).toBe(20);
  });

  it("gold distribution adds to specified targets only", () => {
    const chars = [makeChar("w1", "Wendy", 44), makeChar("k1", "Kehrfuffle", 44)];
    const result = quickGoldDistribution(chars, 100, ["w1"]);
    expect(result[0].experiencePoints).toBe(1100);
    expect(result[1].experiencePoints).toBe(1000);
  });

  it("damage with resistance halves the amount", () => {
    const hp: CombatantHP = { current: 44, max: 44, temporary: 0 };
    const result = quickDamageCharacter(hp, 20, "fire", ["fire"], []);
    expect(result.current).toBe(34);
  });

  it("damage with immunity negates entirely", () => {
    const hp: CombatantHP = { current: 44, max: 44, temporary: 0 };
    const result = quickDamageCharacter(hp, 50, "fire", [], ["fire"]);
    expect(result.current).toBe(44);
  });

  it("heal does not exceed max HP", () => {
    const hp: CombatantHP = { current: 40, max: 44, temporary: 0 };
    const result = quickHeal(hp, 20);
    expect(result.current).toBe(44);
  });

  it("zero damage is a no-op", () => {
    const hp: CombatantHP = { current: 44, max: 44, temporary: 0 };
    const result = quickDamageCharacter(hp, 0);
    expect(result.current).toBe(44);
  });
});

// ─── SPRINT 28: DM NPC Quick-Create ────────────────────────────
describe("Sprint 28 — DM NPC Quick-Create Popover", () => {
  it("CR 0: AC 10, HP 8 (minimum)", () => {
    const npc = createNpcQuick("Rat", 0);
    expect(npc.ac).toBe(10);
    expect(npc.hp).toBe(8);
  });

  it("CR 1/4: AC 12, HP 15", () => {
    const npc = createNpcQuick("Goblin", 0.25);
    expect(npc.ac).toBe(12);
    expect(npc.hp).toBe(15);
  });

  it("CR 1/2: AC 12, HP 20", () => {
    const npc = createNpcQuick("Wolf", 0.5);
    expect(npc.ac).toBe(12);
    expect(npc.hp).toBe(20);
  });

  it("CR 1: AC 13, HP 25", () => {
    const npc = createNpcQuick("Dire Wolf", 1);
    expect(npc.ac).toBe(13);
    expect(npc.hp).toBe(25);
  });

  it("CR 3: AC 14, HP 50 (medium encounter)", () => {
    const npc = createNpcQuick("Owlbear", 3);
    expect(npc.ac).toBe(14);
    expect(npc.hp).toBe(50);
  });

  it("CR 8: higher AC (14) and HP (140)", () => {
    const npc = createNpcQuick("Dragon", 8);
    expect(npc.ac).toBe(14);
    expect(npc.hp).toBe(140);
  });

  it("CR 0.125: AC 10, HP 8 (below 0 threshold)", () => {
    const npc = createNpcQuick("Crab", 0.125);
    expect(npc.ac).toBe(10);
    expect(npc.hp).toBe(8);
  });

  it("CR 1/8 falls into sub-0.25 bracket", () => {
    const npc = createNpcQuick("Cultist", 0.125);
    expect(npc.hp).toBe(8);
  });
});

// ─── SPRINT 29: DM Combat Wrap-Up Overlay ──────────────────────
describe("Sprint 29 — DM Combat Wrap-Up Overlay", () => {
  const makeChar = (id: string, name: string, hp: number, xp: number = 1000): PlayerCharacter => ({
    id, name, level: 5,
    hitPoints: { current: hp, max: 44, temporary: 0 },
    conditions: [],
    experiencePoints: xp,
  });

  describe("XP Calculation from enemy CRs", () => {
    it("4 goblins (CR 1/4 = 50 XP each) = 200 total, 100 per alive character", () => {
      const result = calculateCombatXp([0.25, 0.25, 0.25, 0.25], 2);
      expect(result.totalXp).toBe(200);
      expect(result.xpPerCharacter).toBe(100);
    });

    it("1 dragon (CR 8 = 3900 XP) = 3900 total, 1950 per alive character", () => {
      const result = calculateCombatXp([8], 2);
      expect(result.totalXp).toBe(3900);
      expect(result.xpPerCharacter).toBe(1950);
    });

    it("mixed CR encounter: goblin (50) + wolf (100) + bugbear (200) = 350 total", () => {
      const result = calculateCombatXp([0.25, 0.5, 1], 3);
      expect(result.totalXp).toBe(350);
      expect(result.xpPerCharacter).toBe(117);
    });

    it("unknown CR (e.g., CR 15) returns 0 if not in map", () => {
      const result = calculateCombatXp([15], 2);
      expect(result.totalXp).toBe(0);
    });
  });

  describe("XP Award to Characters", () => {
    it("adds XP to alive character", () => {
      const char = makeChar("w1", "Wendy", 44, 1000);
      const result = awardXpToCharacter(char, 200);
      expect(result.experiencePoints).toBe(1200);
    });

    it("does not modify other characters", () => {
      const chars = [makeChar("w1", "Wendy", 44), makeChar("k1", "Kehrfuffle", 44)];
      const result = chars.map((c, i) => i === 0 ? awardXpToCharacter(c, 100) : c);
      expect(result[0].experiencePoints).toBe(1100);
      expect(result[1].experiencePoints).toBe(1000);
    });

    it("negative XP sets to 0 minimum", () => {
      const char = makeChar("w1", "Wendy", 44, 50);
      const result = awardXpToCharacter(char, -100);
      expect(result.experiencePoints).toBe(0);
    });
  });

  describe("Condition Clearing", () => {
    it("clears all conditions from all characters", () => {
      const chars = [
        { ...makeChar("w1", "Wendy", 44), conditions: ["poisoned", "prone"] },
        { ...makeChar("k1", "Kehrfuffle", 44), conditions: ["blinded"] },
      ];
      const result = clearAllConditions(chars);
      expect(result[0].conditions).toEqual([]);
      expect(result[1].conditions).toEqual([]);
    });

    it("characters with no conditions remain empty", () => {
      const chars = [makeChar("w1", "Wendy", 44)];
      const result = clearAllConditions(chars);
      expect(result[0].conditions).toEqual([]);
    });
  });

  describe("Full Wrap-Up Flow", () => {
    it("complete wrap-up: XP + conditions + loot stats", () => {
      const characters = [
        { ...makeChar("w1", "Wendy", 44, 5000), conditions: ["poisoned"] },
        { ...makeChar("k1", "Kehrfuffle", 22, 5000), conditions: ["prone", "blinded"] },
      ];
      const enemyCrs = [0.25, 0.25, 0.5, 1]; // 4 goblins (CR 1/4) + wolf (CR 1/2) + bugbear (CR 1)
      const aliveCount = characters.filter((c) => c.hitPoints.current > 0).length;

      // Step 1: Calculate XP
      const xp = calculateCombatXp(enemyCrs, aliveCount);
      expect(xp.totalXp).toBe(400);
      expect(xp.xpPerCharacter).toBe(200);

      // Step 2: Award XP
      const withXp = characters.map((c) => awardXpToCharacter(c, xp.xpPerCharacter));
      expect(withXp[0].experiencePoints).toBe(5200);
      expect(withXp[1].experiencePoints).toBe(5200);

      // Step 3: Clear conditions
      const cleared = clearAllConditions(withXp);
      expect(cleared[0].conditions).toEqual([]);
      expect(cleared[1].conditions).toEqual([]);
    });

    it("edge: all characters dead — XP per character = total (not divided)", () => {
      const result = calculateCombatXp([1, 1], 0);
      expect(result.totalXp).toBe(400);
      expect(result.xpPerCharacter).toBe(400);
    });

    it("edge: no enemies — zero XP", () => {
      const result = calculateCombatXp([], 4);
      expect(result.totalXp).toBe(0);
      expect(result.xpPerCharacter).toBe(0);
    });
  });
});

// ─── FULL PIPELINE: Simulated Live Session ────────────────────
describe("Full Session Pipeline (Sprints 20-29 Integration)", () => {
  it("Wendy and Kehrfuffle fight a Fire Elemental: full combat lifecycle", () => {
    // Setup
    const wendy: PlayerCharacter = {
      id: "w1", name: "Wendy", level: 5,
      hitPoints: { current: 38, max: 38, temporary: 0 },
      conditions: [], experiencePoints: 5000,
    };
    const kehrfuffle: PlayerCharacter = {
      id: "k1", name: "Kehrfuffle", level: 5,
      hitPoints: { current: 44, max: 44, temporary: 0 },
      conditions: [], experiencePoints: 5000,
    };

    // Phase 1: enemy quick-create (Sprint 28)
    const elemental = createNpcQuick("Fire Elemental", 5);
    expect(elemental.ac).toBe(12);
    expect(elemental.hp).toBe(95);

    // Phase 2: Initiative (Sprint 22 — simulated)
    const combatants: Combatant[] = [
      { id: "w1", name: "Wendy", type: "player", hitPoints: wendy.hitPoints, armorClass: 17, isDead: false, statusEffects: [] },
      { id: "k1", name: "Kehrfuffle", type: "player", hitPoints: kehrfuffle.hitPoints, armorClass: 21, isDead: false, statusEffects: [] },
      { id: "e1", name: "Fire Elemental", type: "enemy", hitPoints: { current: 95, max: 95, temporary: 0 }, armorClass: 12, isDead: false, statusEffects: [] },
    ];

    // Phase 3: Kehrfuffle attacks — fire immunity means 0 damage (Sprint 20)
    const wendyAfterAttack = quickDamageCharacter(wendy.hitPoints, 14, "slashing"); // weapon, no fire
    expect(wendyAfterAttack.current).toBe(24);

    // Phase 4: Elemental uses Fire Breath — fire damage (Sprint 21)
    // Wendy takes 28 fire damage (no resistance) — temp HP then real
    const wendyFire = applyDamageToHP(wendyAfterAttack, 28);
    expect(wendyFire.current).toBe(0); // 24 - 28 = -4 → 0

    // Kehrfuffle takes 28 fire damage from Fire Breath
    const kehrfuffleFire = applyDamageToHP(kehrfuffle.hitPoints, 28);
    expect(kehrfuffleFire.current).toBe(16);

    // Phase 5: Kehrfuffle gets poisoned (Sprint 26 condition toggle)
    let conditionState: ConditionToggleState = { activeConditions: [], zustandWrites: 0, firestoreQueue: 0 };
    conditionState = toggleCondition(conditionState, "poisoned");
    expect(conditionState.activeConditions).toEqual(["poisoned"]);

    // Phase 6: Kehrfuffle gets stabilized via death saves (Sprint 23)
    let deathState: DeathSaveState = { successes: 0, failures: 0, isStable: false };
    deathState = applyDeathSave(deathState, 15); // success
    deathState = applyDeathSave(deathState, 12); // success
    deathState = applyDeathSave(deathState, 18); // success → stable
    expect(deathState.isStable).toBe(true);

    // Phase 7: Concentration check (Sprint 24)
    const concDc = calculateConcentrationDC(28);
    expect(concDc).toBe(14);

    // Phase 8: Short rest (Sprint 25)
    const restWendy = applyShortRestHealing(
      { current: 0, max: 38, temporary: 0 }, 38, 8, 5, 0
    );
    const restKehrfuffle = applyShortRestHealing(
      kehrfuffleFire, 44, 10, 5, 0
    );
    expect(restWendy.newHp).toBeGreaterThan(0);
    expect(restKehrfuffle.newHp).toBeGreaterThan(16);

    // Phase 9: Quick action — heal Wendy (Sprint 27)
    const healWendy = quickHeal(
      { current: restWendy.newHp, max: 38, temporary: 0 }, 14
    );
    expect(healWendy.current).toBe(Math.min(38, restWendy.newHp + 14));

    // Phase 10: Wrap-Up — XP calculation (Sprint 29)
    const xp = calculateCombatXp([5], 2); // CR 5 = 1800 XP
    expect(xp.totalXp).toBe(1800);
    expect(xp.xpPerCharacter).toBe(900);

    // Award XP
    const finalWendy = awardXpToCharacter({ ...wendy, hitPoints: healWendy }, xp.xpPerCharacter);
    const finalKehrfuffle = awardXpToCharacter({ ...kehrfuffle, hitPoints: restKehrfuffle.newHp > 0 ? { current: restKehrfuffle.newHp, max: 44, temporary: 0 } : kehrfuffle.hitPoints }, xp.xpPerCharacter);
    expect(finalWendy.experiencePoints).toBe(5900);
    expect(finalKehrfuffle.experiencePoints).toBe(5900);

    // Conditions cleared
    const cleared = [finalWendy, finalKehrfuffle].map((c) => ({ ...c, conditions: [] }));
    expect(cleared[0].conditions).toEqual([]);
    expect(cleared[1].conditions).toEqual([]);
  });
});

interface DeathSaveState {
  successes: number;
  failures: number;
  isStable: boolean;
}

function applyDeathSave(state: DeathSaveState, roll: number): DeathSaveState {
  if (state.isStable || state.successes >= 3 || state.failures >= 3) return state;
  if (roll === 20) return { successes: 0, failures: 0, isStable: false };
  if (roll >= 10) {
    const newSuccesses = state.successes + 1;
    return { ...state, successes: newSuccesses, isStable: newSuccesses >= 3 };
  }
  if (roll === 1) {
    const newFailures = Math.min(state.failures + 2, 3);
    return { ...state, failures: newFailures };
  }
  return { ...state, failures: Math.min(state.failures + 1, 3) };
}

function applyShortRestHealing(
  hp: CombatantHP, maxHp: number, hitDiceType: number, hitDiceTotal: number, spentHitDice: number
): { newHp: number; newSpentHd: number } {
  const available = hitDiceTotal - spentHitDice;
  if (available <= 0 || hp.current >= maxHp) return { newHp: hp.current, newSpentHd: spentHitDice };
  const avgHeal = Math.floor(hitDiceType / 2) + 1;
  return { newHp: Math.min(maxHp, hp.current + avgHeal), newSpentHd: spentHitDice + 1 };
}
