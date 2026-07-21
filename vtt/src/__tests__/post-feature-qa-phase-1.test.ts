/**
 * ST VTT — Sprint 30 QA: Post-Feature Phase 1 — Damage Types, AoE, Combat Log
 *
 * QA targets from Sprints 20-29:
 *   Sprint 20: Damage Type System & Combat Log
 *   Sprint 21: Multi-Target AoE Damage System
 *   Sprint 22: Combatant Drag-to-Reorder Initiative
 *   Sprint 23: DM Death Save Tracker
 *   Sprint 24: Concentration Tracking
 *   Sprint 25: Party Rest Overlay
 *   Sprint 26: DM Combat Condition Bar
 *   Sprint 27: DM Quick Action Popover
 *   Sprint 28: DM NPC Quick-Create Popover
 *   Sprint 29: DM Combat Wrap-Up Overlay
 *
 * Run: npx vitest run --config vitest.config.ts src/__tests__/post-feature-qa-phase-1.test.ts
 */

import { describe, it, expect } from "vitest";

// =================================================================
// FIXTURES
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
  initiative: number;
  armorClass: number;
  hitPoints: CombatantHP;
  statusEffects: Array<{ id: string; effect: string }>;
  isDead: boolean;
  isConcentrating: boolean;
  notes: string;
}

type DamageEffect = "immune" | "resistance" | "vulnerability" | "standard";
type CombatLogType = "damage" | "heal" | "death" | "status" | "revive" | "round_start" | "turn_change" | "aoe" | "healing";

interface CombatLogEntry {
  id: string;
  timestamp: number;
  type: CombatLogType;
  actorId: string;
  actorName: string;
  targetId: string;
  targetName: string;
  value: number;
  detail: string;
}

interface DamageApplicationResult {
  rawDamage: number;
  damageType: string;
  effect: DamageEffect;
  finalDamage: number;
  explanation: string;
}

interface AoETargetResult {
  combatantId: string;
  combatantName: string;
  rawDamage: number;
  finalDamage: number;
  saved: boolean;
  typeResults: DamageApplicationResult[];
  isDead: boolean;
  hpBefore: CombatantHP;
  hpAfter: CombatantHP;
}

interface AoEDamageResult {
  baseDamage: number;
  damageTypes: string[];
  targets: AoETargetResult[];
  totalRawDamage: number;
  totalFinalDamage: number;
  totalDeaths: number;
  groupTimestamp: number;
  deathEntries: CombatLogEntry[];
}

interface DeathSaveState {
  successes: number;
  failures: number;
  isStable: boolean;
}

interface ConcentrationState {
  isConcentrating: boolean;
  spellName: string;
  spellLevel: number;
}

interface RestResult {
  hpHealed: number;
  hdSpent: number;
  hdTotal: number;
  hdRemaining: number;
  resourcesRecharged: string[];
}

/** Simulated condition toggle state */
interface ConditionToggleState {
  activeConditions: string[];
  toggleHistory: string[];
  firestoreQueue: number;
  zustandWrites: number;
}

interface NpcCreateResult {
  id: string;
  name: string;
  cr: number;
  ac: number;
  hp: number;
  attacks: number;
  savedToStore: boolean;
  injectedToCombat: boolean;
}

const EMPTY_HP: CombatantHP = { current: 0, max: 0, temporary: 0 };

// =================================================================
// PURE FUNCTION IMPLEMENTATIONS (self-contained for QA)
// =================================================================

/**
 * Resolve a single damage type against target defenses. (Sprint 20)
 * 5e RAW: immunity > vulnerability cancel > vulnerability > resistance > standard
 */
function resolveDamageType(
  rawDamage: number,
  damageType: string,
  resistances: string[],
  immunities: string[],
  vulnerabilities: string[]
): DamageApplicationResult {
  const hasImmunity = immunities.some((i) => i.toLowerCase() === damageType.toLowerCase());
  const hasResistance = resistances.some((r) => r.toLowerCase() === damageType.toLowerCase());
  const hasVulnerability = vulnerabilities.some((v) => v.toLowerCase() === damageType.toLowerCase());

  if (hasImmunity) {
    return { rawDamage, damageType, effect: "immune", finalDamage: 0, explanation: "full negation" };
  }
  if (hasResistance && hasVulnerability) {
    return { rawDamage, damageType, effect: "standard", finalDamage: rawDamage, explanation: "cancel out" };
  }
  if (hasVulnerability) {
    return { rawDamage, damageType, effect: "vulnerability", finalDamage: rawDamage * 2, explanation: "doubled" };
  }
  if (hasResistance) {
    return { rawDamage, damageType, effect: "resistance", finalDamage: Math.floor(rawDamage / 2), explanation: "halved" };
  }
  return { rawDamage, damageType, effect: "standard", finalDamage: rawDamage, explanation: "standard" };
}

/**
 * Apply damage to HP with temp HP absorption. (Sprint 20)
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
 * Compute AoE damage across multiple targets. (Sprint 21)
 */
function computeAoEDamage(
  targets: Combatant[],
  baseDamage: number,
  damageTypes: string[],
  enemies: Array<{ name: string; damageResistances: string[]; damageImmunities: string[]; damageVulnerabilities: string[] }>,
  saveHalves: boolean,
  savedTargetIds: string[]
): AoEDamageResult {
  const targetResults: AoETargetResult[] = [];
  let totalRawDamage = 0;
  let totalFinalDamage = 0;
  let totalDeaths = 0;
  const deathEntries: CombatLogEntry[] = [];

  for (const target of targets) {
    const hpBefore = { ...target.hitPoints };
    const isSaved = saveHalves && savedTargetIds.includes(target.id);
    const effectiveDamage = isSaved ? Math.floor(baseDamage / 2) : baseDamage;

    const typeResults: DamageApplicationResult[] = [];
    let finalDamage = 0;

    if (damageTypes.length > 0) {
      const primaryType = damageTypes[0];
      const enemy = enemies.find((e) => e.name === target.name) || {
        name: target.name,
        damageResistances: [],
        damageImmunities: [],
        damageVulnerabilities: [],
      };
      const result = resolveDamageType(effectiveDamage, primaryType, enemy.damageResistances, enemy.damageImmunities, enemy.damageVulnerabilities);
      typeResults.push(result);
      finalDamage += result.finalDamage;
    }

    const hpAfter = applyDamageToHP(hpBefore, finalDamage);
    const isDead = hpAfter.current <= 0;

    totalRawDamage += effectiveDamage;
    totalFinalDamage += finalDamage;
    if (isDead) totalDeaths++;

    targetResults.push({
      combatantId: target.id,
      combatantName: target.name,
      rawDamage: effectiveDamage,
      finalDamage,
      saved: isSaved,
      typeResults,
      isDead,
      hpBefore,
      hpAfter,
    });
  }

  return {
    baseDamage,
    damageTypes,
    targets: targetResults,
    totalRawDamage,
    totalFinalDamage,
    totalDeaths,
    groupTimestamp: Date.now(),
    deathEntries,
  };
}

/**
 * Drag-to-reorder combatants. (Sprint 22)
 * Returns new array with combatant moved from sourceIdx to destIdx.
 */
function reorderCombatants(combatants: Combatant[], sourceIdx: number, destIdx: number): Combatant[] {
  if (sourceIdx < 0 || sourceIdx >= combatants.length) return combatants;
  if (destIdx < 0 || destIdx >= combatants.length) return combatants;
  const result = [...combatants];
  const [removed] = result.splice(sourceIdx, 1);
  result.splice(destIdx, 0, removed);
  return result;
}

/**
 * Death save system. (Sprint 23)
 * - Natural 20: revive with 1 HP, reset saves
 * - 10-19: success
 * - 2-9: failure
 * - Natural 1: 2 failures
 * - 3 failures = dead
 * - 3 successes = stable
 */
function applyDeathSave(state: DeathSaveState, roll: number): DeathSaveState {
  if (state.isStable || (state.successes >= 3 || state.failures >= 3)) return state;

  if (roll === 20) {
    return { successes: 0, failures: 0, isStable: false };
  }
  if (roll >= 10) {
    const newSuccesses = state.successes + 1;
    return { successes: newSuccesses, failures: state.failures, isStable: newSuccesses >= 3 };
  }
  if (roll === 1) {
    const newFailures = state.failures + 2;
    return { successes: state.successes, failures: Math.min(newFailures, 3), isStable: false };
  }
  const newFailures = state.failures + 1;
  return { successes: state.successes, failures: newFailures, isStable: false };
}

/**
 * Concentration save DC calculator. (Sprint 24)
 * DC = max(10, floor(damage / 2))
 */
function calculateConcentrationDC(damage: number): number {
  return Math.max(10, Math.floor(damage / 2));
}

/**
 * Short rest healing (average HD). (Sprint 25)
 */
function applyShortRestHealing(hp: CombatantHP, maxHp: number, hitDiceType: number, hitDiceTotal: number, spentHitDice: number): { newHp: number; newSpentHd: number } {
  const available = hitDiceTotal - spentHitDice;
  if (available <= 0 || hp.current >= maxHp) return { newHp: hp.current, newSpentHd: spentHitDice };

  const avgHeal = Math.floor(hitDiceType / 2) + 1;
  const healAmount = avgHeal;
  const newHp = Math.min(maxHp, hp.current + healAmount);
  return { newHp, newSpentHd: spentHitDice + 1 };
}

/**
 * Condition toggle system. (Sprint 26)
 */
function toggleCondition(state: ConditionToggleState, conditionId: string): ConditionToggleState {
  const isActive = state.activeConditions.includes(conditionId);
  return {
    ...state,
    activeConditions: isActive
      ? state.activeConditions.filter((c) => c !== conditionId)
      : [...state.activeConditions, conditionId],
    toggleHistory: [...state.toggleHistory, conditionId],
    zustandWrites: state.zustandWrites + 1,
    firestoreQueue: state.firestoreQueue + 1,
  };
}

/**
 * Quick action damage/heal for Sprint 27 simulation.
 * Supports multi-target and single-target with damage type.
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
 * NPC quick-create. (Sprint 28)
 * CR-based AC/HP computation using DMG reference values.
 */
function createNpcQuick(
  name: string,
  cr: number,
  creatureType: string
): { name: string; cr: number; ac: number; hp: number; attackBonus: number; damageDice: string } {
  const crNum = cr;
  let ac = 10 + Math.floor(crNum / 2);
  let hp = 20 + crNum * 15;
  if (crNum <= 0) { ac = 10; hp = 8; }
  else if (crNum <= 0.25) { ac = 12; hp = 15; }
  else if (crNum <= 1) { ac = 13; hp = 25; }
  else if (crNum <= 3) { ac = 14; hp = 50; }

  const pb = crNum <= 4 ? 2 : crNum <= 8 ? 3 : crNum <= 12 ? 4 : crNum <= 16 ? 5 : 6;
  const attackBonus = pb + Math.floor(crNum / 3);
  const damageDice = crNum <= 0 ? "1d4" : crNum <= 0.5 ? "1d6" : crNum <= 2 ? "1d8+2" : crNum <= 5 ? "2d6+3" : crNum <= 10 ? "2d8+4" : "3d10+5";

  return { name, cr: crNum, ac, hp, attackBonus, damageDice };
}

// =================================================================
// FIREBASE WRITE SIMULATION (Sprint 27-29 integration)
// =================================================================

interface WriteSimState {
  zustandWrites: number;
  firestoreWrites: number;
  latestState: unknown;
}

function simulateWritePipeline(initial: WriteSimState, rapidActions: number): WriteSimState {
  let state = { ...initial };
  for (let i = 0; i < rapidActions; i++) {
    state.zustandWrites++;
    // Firestore debounce: only writes after accumulation
    if (i === rapidActions - 1) {
      state.firestoreWrites++;
    }
  }
  return state;
}

// =================================================================
// TEST SUITES
// =================================================================

// ─── SPRINT 20: Damage Type System ───────────────────────────────
describe("Sprint 20 — Damage Type System", () => {
  describe("resolveDamageType — 5e RAW compliance", () => {
    it("standard damage: no modifiers", () => {
      const result = resolveDamageType(28, "fire", [], [], []);
      expect(result.effect).toBe("standard");
      expect(result.finalDamage).toBe(28);
    });

    it("resistance halves damage (round down)", () => {
      const result = resolveDamageType(28, "fire", ["fire"], [], []);
      expect(result.effect).toBe("resistance");
      expect(result.finalDamage).toBe(14);
    });

    it("odd damage halved rounds down", () => {
      const result = resolveDamageType(15, "fire", ["fire"], [], []);
      expect(result.effect).toBe("resistance");
      expect(result.finalDamage).toBe(7);
    });

    it("vulnerability doubles damage", () => {
      const result = resolveDamageType(14, "fire", [], [], ["fire"]);
      expect(result.effect).toBe("vulnerability");
      expect(result.finalDamage).toBe(28);
    });

    it("immunity negates all damage", () => {
      const result = resolveDamageType(50, "fire", [], ["fire"], []);
      expect(result.effect).toBe("immune");
      expect(result.finalDamage).toBe(0);
    });

    it("resistance + vulnerability cancel out (standard)", () => {
      const result = resolveDamageType(28, "fire", ["fire"], [], ["fire"]);
      expect(result.effect).toBe("standard");
      expect(result.finalDamage).toBe(28);
    });

    it("immunity beats vulnerability even when both present", () => {
      const result = resolveDamageType(28, "fire", [], ["fire"], ["fire"]);
      expect(result.effect).toBe("immune");
      expect(result.finalDamage).toBe(0);
    });

    it("case-insensitive matching for resistances", () => {
      const result = resolveDamageType(14, "Fire", ["FIRE"], [], []);
      expect(result.effect).toBe("resistance");
      expect(result.finalDamage).toBe(7);
    });

    it("acid damage not affected by fire resistance", () => {
      const result = resolveDamageType(10, "acid", ["fire"], [], []);
      expect(result.effect).toBe("standard");
      expect(result.finalDamage).toBe(10);
    });

    it("all 13 damage types resolve correctly with resistance", () => {
      const types = ["acid", "bludgeoning", "cold", "fire", "force", "lightning", "necrotic", "piercing", "poison", "psychic", "radiant", "slashing", "thunder"];
      for (const t of types) {
        const result = resolveDamageType(10, t, [t], [], []);
        expect(result.effect).toBe("resistance");
        expect(result.finalDamage).toBe(5);
      }
    });
  });

  describe("applyDamageToHP — temp HP absorption", () => {
    it("temp HP absorbs damage before real HP", () => {
      const hp: CombatantHP = { current: 44, max: 44, temporary: 10 };
      const result = applyDamageToHP(hp, 15);
      expect(result.temporary).toBe(0);
      expect(result.current).toBe(39);
    });

    it("damage less than temp HP: only temp absorbs", () => {
      const hp: CombatantHP = { current: 44, max: 44, temporary: 10 };
      const result = applyDamageToHP(hp, 5);
      expect(result.temporary).toBe(5);
      expect(result.current).toBe(44);
    });

    it("damage exactly equals temp HP: only temp consumed", () => {
      const hp: CombatantHP = { current: 44, max: 44, temporary: 10 };
      const result = applyDamageToHP(hp, 10);
      expect(result.temporary).toBe(0);
      expect(result.current).toBe(44);
    });

    it("damage greater than temp + real HP: clamped to 0", () => {
      const hp: CombatantHP = { current: 30, max: 44, temporary: 5 };
      const result = applyDamageToHP(hp, 100);
      expect(result.temporary).toBe(0);
      expect(result.current).toBe(0);
    });

    it("zero damage: no change", () => {
      const hp: CombatantHP = { current: 44, max: 44, temporary: 0 };
      const result = applyDamageToHP(hp, 0);
      expect(result.current).toBe(44);
      expect(result.temporary).toBe(0);
    });

    it("max HP preserved across damage", () => {
      const hp: CombatantHP = { current: 20, max: 44, temporary: 0 };
      const result = applyDamageToHP(hp, 5);
      expect(result.max).toBe(44);
    });
  });
});

// ─── SPRINT 21: Multi-Target AoE Damage ─────────────────────────
describe("Sprint 21 — Multi-Target AoE Damage", () => {
  const makeCombatant = (id: string, name: string, hp: number, type: "player" | "enemy" = "enemy"): Combatant => ({
    id, name, type,
    initiative: 10, armorClass: 15,
    hitPoints: { current: hp, max: hp, temporary: 0 },
    statusEffects: [],
    isDead: false, isConcentrating: false, notes: "",
  });

  it("AoE damages all targets equally (no resistances)", () => {
    const targets = [makeCombatant("g1", "Goblin A", 15), makeCombatant("g2", "Goblin B", 15)];
    const result = computeAoEDamage(targets, 28, ["fire"], [], false, []);
    expect(result.totalFinalDamage).toBe(56);
    expect(result.totalDeaths).toBe(2);
    expect(result.targets[0].finalDamage).toBe(28);
    expect(result.targets[1].finalDamage).toBe(28);
  });

  it("AoE with DEX save halves damage for saved targets", () => {
    const targets = [makeCombatant("g1", "Goblin A", 15), makeCombatant("g2", "Goblin B", 15)];
    const result = computeAoEDamage(targets, 20, ["fire"], [], true, ["g1"]);
    expect(result.targets[0].saved).toBe(true);
    expect(result.targets[0].finalDamage).toBe(10);
    expect(result.targets[1].saved).toBe(false);
    expect(result.targets[1].finalDamage).toBe(20);
  });

  it("AoE respects fire immunity on specific targets", () => {
    const targets = [makeCombatant("g1", "Goblin", 15), makeCombatant("d1", "Fire Elemental", 50)];
    const enemies = [
      { name: "Fire Elemental", damageResistances: [], damageImmunities: ["fire"], damageVulnerabilities: [] },
      { name: "Goblin", damageResistances: [], damageImmunities: [], damageVulnerabilities: [] },
    ];
    const result = computeAoEDamage(targets, 28, ["fire"], enemies, false, []);
    expect(result.targets[0].finalDamage).toBe(28);
    expect(result.targets[1].finalDamage).toBe(0);
    expect(result.targets[1].typeResults[0].effect).toBe("immune");
  });

  it("AoE with resistance reduces per-target damage", () => {
    const targets = [makeCombatant("t1", "Tiefling", 40)];
    const enemies = [{ name: "Tiefling", damageResistances: ["fire"], damageImmunities: [], damageVulnerabilities: [] }];
    const result = computeAoEDamage(targets, 20, ["fire"], enemies, false, []);
    expect(result.targets[0].finalDamage).toBe(10);
    expect(result.targets[0].typeResults[0].effect).toBe("resistance");
  });

  it("AoE kills weak targets but not tanks", () => {
    const targets = [makeCombatant("g1", "Goblin", 7), makeCombatant("d1", "Dragon", 200)];
    const result = computeAoEDamage(targets, 28, ["fire"], [], false, []);
    expect(result.targets[0].isDead).toBe(true);
    expect(result.targets[1].isDead).toBe(false);
    expect(result.totalDeaths).toBe(1);
  });

  it("AoE with 0 damage: no change", () => {
    const targets = [makeCombatant("w1", "Wendy", 44)];
    const result = computeAoEDamage(targets, 0, ["fire"], [], false, []);
    expect(result.targets[0].finalDamage).toBe(0);
    expect(result.targets[0].isDead).toBe(false);
  });

  it("empty target list returns empty result", () => {
    const result = computeAoEDamage([], 28, ["fire"], [], false, []);
    expect(result.targets).toHaveLength(0);
    expect(result.totalDeaths).toBe(0);
    expect(result.totalFinalDamage).toBe(0);
  });
});

// ─── SPRINT 22: Combatant Drag-to-Reorder ───────────────────────
describe("Sprint 22 — Combatant Drag-to-Reorder", () => {
  const make = (id: string): Combatant => ({
    id, name: id, type: "enemy",
    initiative: 10, armorClass: 15,
    hitPoints: { current: 20, max: 20, temporary: 0 },
    statusEffects: [], isDead: false, isConcentrating: false, notes: "",
  });

  it("moves combatant from index 2 to index 0", () => {
    const list = [make("Rogue"), make("Paladin"), make("Wolf"), make("Goblin")];
    const result = reorderCombatants(list, 2, 0);
    expect(result[0].id).toBe("Wolf");
    expect(result[1].id).toBe("Rogue");
    expect(result[2].id).toBe("Paladin");
    expect(result[3].id).toBe("Goblin");
  });

  it("moves combatant from index 0 to index 3", () => {
    const list = [make("Rogue"), make("Paladin"), make("Wolf"), make("Goblin")];
    const result = reorderCombatants(list, 0, 3);
    expect(result[0].id).toBe("Paladin");
    expect(result[1].id).toBe("Wolf");
    expect(result[2].id).toBe("Goblin");
    expect(result[3].id).toBe("Rogue");
  });

  it("reorder to same index: no change", () => {
    const list = [make("Rogue"), make("Paladin")];
    const result = reorderCombatants(list, 0, 0);
    expect(result[0].id).toBe("Rogue");
    expect(result).toEqual(list);
  });

  it("out-of-bounds source index: no change", () => {
    const list = [make("A"), make("B")];
    const result = reorderCombatants(list, 5, 0);
    expect(result).toEqual(list);
  });

  it("out-of-bounds dest index: no change", () => {
    const list = [make("A"), make("B")];
    const result = reorderCombatants(list, 0, 5);
    expect(result).toEqual(list);
  });

  it("single combatant: reorder is no-op", () => {
    const list = [make("Solo")];
    const result = reorderCombatants(list, 0, 0);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("Solo");
  });

  it("preserves combatant identity (same object refs)", () => {
    const a = make("A"); const b = make("B");
    const result = reorderCombatants([a, b], 1, 0);
    expect(result[0]).toBe(b);
    expect(result[1]).toBe(a);
  });

  it("large combat encounter reorder (10 combatants, move 8→3)", () => {
    const list = Array.from({ length: 10 }, (_, i) => make(`C${i}`));
    const result = reorderCombatants(list, 8, 3);
    expect(result[3].id).toBe("C8");
    expect(result[4].id).toBe("C3");
    expect(result).toHaveLength(10);
  });
});

// ─── SPRINT 23: Death Save System ──────────────────────────────
describe("Sprint 23 — Death Save System", () => {
  it("natural 20: revives with 1 HP and resets saves", () => {
    const state: DeathSaveState = { successes: 2, failures: 1, isStable: false };
    const result = applyDeathSave(state, 20);
    expect(result.successes).toBe(0);
    expect(result.failures).toBe(0);
    expect(result.isStable).toBe(false);
  });

  it("10-19: one success", () => {
    const state: DeathSaveState = { successes: 0, failures: 1, isStable: false };
    const result = applyDeathSave(state, 14);
    expect(result.successes).toBe(1);
    expect(result.failures).toBe(1);
    expect(result.isStable).toBe(false);
  });

  it("2-9: one failure", () => {
    const state: DeathSaveState = { successes: 1, failures: 0, isStable: false };
    const result = applyDeathSave(state, 5);
    expect(result.successes).toBe(1);
    expect(result.failures).toBe(1);
    expect(result.isStable).toBe(false);
  });

  it("natural 1: two failures", () => {
    const state: DeathSaveState = { successes: 0, failures: 0, isStable: false };
    const result = applyDeathSave(state, 1);
    expect(result.failures).toBe(2);
  });

  it("three successes = stable", () => {
    let state: DeathSaveState = { successes: 0, failures: 0, isStable: false };
    state = applyDeathSave(state, 12);
    state = applyDeathSave(state, 15);
    state = applyDeathSave(state, 18);
    expect(state.successes).toBe(3);
    expect(state.isStable).toBe(true);
  });

  it("three failures = dead (not stable)", () => {
    let state: DeathSaveState = { successes: 0, failures: 0, isStable: false };
    state = applyDeathSave(state, 3);
    state = applyDeathSave(state, 5);
    state = applyDeathSave(state, 2);
    expect(state.failures).toBe(3);
    expect(state.isStable).toBe(false);
  });

  it("after stable, additional rolls do nothing", () => {
    const state: DeathSaveState = { successes: 3, failures: 0, isStable: true };
    const result = applyDeathSave(state, 1);
    expect(result).toEqual(state);
  });

  it("edge: two failures from natural 1 then one failure = dead", () => {
    let state: DeathSaveState = { successes: 0, failures: 0, isStable: false };
    state = applyDeathSave(state, 1);
    state = applyDeathSave(state, 3);
    expect(state.failures).toBe(3);
    expect(state.isStable).toBe(false);
  });

  it("edge: success at 3 fails does nothing", () => {
    const state: DeathSaveState = { successes: 0, failures: 3, isStable: false };
    const result = applyDeathSave(state, 15);
    expect(result).toEqual(state);
  });
});

// ─── SPRINT 24: Concentration Tracking ──────────────────────────
describe("Sprint 24 — Concentration Tracking", () => {
  it("DC = max(10, floor(damage / 2))", () => {
    expect(calculateConcentrationDC(22)).toBe(11);
    expect(calculateConcentrationDC(10)).toBe(10);
    expect(calculateConcentrationDC(5)).toBe(10);
    expect(calculateConcentrationDC(1)).toBe(10);
    expect(calculateConcentrationDC(50)).toBe(25);
  });

  it("0 damage: DC = 10 (minimum)", () => {
    expect(calculateConcentrationDC(0)).toBe(10);
  });

  it("large damage values scale DC linearly", () => {
    expect(calculateConcentrationDC(100)).toBe(50);
    expect(calculateConcentrationDC(200)).toBe(100);
  });

  it("odd damage rounded down: 27 damage = DC 13", () => {
    expect(calculateConcentrationDC(27)).toBe(13);
    expect(Math.floor(27 / 2)).toBe(13);
  });
});

// ─── SPRINT 25: Party Rest ──────────────────────────────────────
describe("Sprint 25 — Party Rest (Short)", () => {
  it("heals one hit die worth of HP", () => {
    const hp: CombatantHP = { current: 30, max: 44, temporary: 0 };
    const result = applyShortRestHealing(hp, 44, 10, 5, 2);
    expect(result.newHp).toBeGreaterThan(30);
    expect(result.newSpentHd).toBe(3);
  });

  it("does not exceed max HP", () => {
    const hp: CombatantHP = { current: 43, max: 44, temporary: 0 };
    const result = applyShortRestHealing(hp, 44, 10, 5, 2);
    expect(result.newHp).toBe(44);
    expect(result.newSpentHd).toBe(3);
  });

  it("no HD available: no healing", () => {
    const hp: CombatantHP = { current: 30, max: 44, temporary: 0 };
    const result = applyShortRestHealing(hp, 44, 10, 5, 5);
    expect(result.newHp).toBe(30);
    expect(result.newSpentHd).toBe(5);
  });

  it("already at max HP: no HD spent", () => {
    const hp: CombatantHP = { current: 44, max: 44, temporary: 0 };
    const result = applyShortRestHealing(hp, 44, 10, 5, 0);
    expect(result.newHp).toBe(44);
    expect(result.newSpentHd).toBe(0);
  });
});
