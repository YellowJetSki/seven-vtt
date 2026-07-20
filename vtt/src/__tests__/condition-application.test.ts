/**
 * STᚱ VTT — Condition Application Engine Unit Tests
 *
 * QA Sprint 14: Comprehensive validation of 5e condition-to-stats pipeline.
 *
 * Tests validate:
 *   1. computeConditionModifiers — all 16 conditions' mechanical effects
 *   2. applyConditionSpeed — speed modifications from conditions
 *   3. applyConditionsToDerivations — full integration
 *   4. getConditionStyle — color/icon mapping
 *   5. getConditionDetails — detail retrieval
 *   6. Edge cases (empty, unknown, conflicting, multiple)
 *   7. Cross-session state integrity
 *   8. Error hardening
 */

import { describe, it, expect } from "vitest";
import {
  computeConditionModifiers,
  applyConditionSpeed,
  applyConditionsToDerivations,
  getConditionStyle,
  getConditionDetails,
  getAllConditionDetails,
  type ConditionModifiers,
} from "@/lib/mechanics/condition-application";
import type { PlayerCharacter } from "@/types/character";
import type { CharacterDerivations } from "@/lib/mechanics/character-derivations";

/**
 * Helper to create a minimal CharacterDerivations for integration tests.
 */
function makeBaseDerivations(overrides?: Partial<CharacterDerivations>): CharacterDerivations {
  return {
    abilityMods: { strength: 3, dexterity: 2, constitution: 2, intelligence: 0, wisdom: 1, charisma: -1 },
    proficiencyBonus: 3,
    ac: 17,
    acBreakdown: "10 + 2 (DEX) + 5 (Chain Mail)",
    initiative: 2,
    speed: { walk: 30 },
    encumbrance: {
      totalWeight: 0,
      carryingCapacity: 240,
      encumbranceLevel: "unencumbered",
      speedReduction: 0,
      disadvantageOnChecks: false,
    },
    spellcasting: {
      casterType: null,
      isCaster: false,
      spellSlots: null,
      spellSaveDC: 10,
      spellAttackBonus: 3,
      spellcastingAbility: "intelligence",
      spellcastingMod: 0,
    },
    hitDieType: "1d10",
    maxHp: 44,
    isDead: false,
    isUnconscious: false,
    isConcentrating: false,
    conditionsActive: [],
    ...overrides,
  };
}

// ═══════════════════════════════════════════════════════════════
// 1. computeConditionModifiers — Core Mechanics
// ═══════════════════════════════════════════════════════════════

describe("computeConditionModifiers", () => {
  // ── No conditions ──
  it("returns default (no-effect) modifiers for empty condition list", () => {
    const result = computeConditionModifiers([]);
    expect(result.speedMultiplier).toBe(1);
    expect(result.attackRollMod).toBe("normal");
    expect(result.canTakeActions).toBe(true);
    expect(result.canTakeReactions).toBe(true);
    expect(result.canConcentrate).toBe(true);
    expect(result.isUnconscious).toBe(false);
    expect(result.effectSummary).toEqual([]);
  });

  // ── Blinded ──
  it("Blinded: disadvantage on attack rolls", () => {
    const result = computeConditionModifiers(["blinded"]);
    expect(result.attackRollMod).toBe("disadvantage");
    expect(result.abilityCheckMod).toBe("normal");
    expect(result.canTakeActions).toBe(true);
    expect(result.speedMultiplier).toBe(1);
  });

  // ── Charmed ──
  it("Charmed: no mechanical penalties to own actions", () => {
    const result = computeConditionModifiers(["charmed"]);
    expect(result.attackRollMod).toBe("normal");
    expect(result.canTakeActions).toBe(true);
    expect(result.canTakeReactions).toBe(true);
  });

  // ── Deafened ──
  it("Deafened: no combat penalties", () => {
    const result = computeConditionModifiers(["deafened"]);
    expect(result.attackRollMod).toBe("normal");
    expect(result.canTakeActions).toBe(true);
    expect(result.effectSummary.filter((e) => e.includes("deafened") || e.includes("hear")).length).toBe(0);
  });

  // ── Exhaustion ──
  it("Exhaustion: halves speed, disadvantage on ability checks", () => {
    const result = computeConditionModifiers(["exhaustion"]);
    expect(result.speedMultiplier).toBe(0.5);
    expect(result.abilityCheckMod).toBe("disadvantage");
    // Should also affect saves and attacks per description
    expect(result.savingThrowMod).toBe("disadvantage");
    expect(result.attackRollMod).toBe("disadvantage");
  });

  // ── Frightened ──
  it("Frightened: disadvantage on ability checks and attack rolls", () => {
    const result = computeConditionModifiers(["frightened"]);
    expect(result.abilityCheckMod).toBe("disadvantage");
    expect(result.attackRollMod).toBe("disadvantage");
    expect(result.canTakeActions).toBe(true);
  });

  // ── Grappled ──
  it("Grappled: speed becomes 0", () => {
    const result = computeConditionModifiers(["grappled"]);
    expect(result.speedOverride).toBe(0);
    expect(result.canTakeActions).toBe(true);
    expect(result.canTakeReactions).toBe(true);
  });

  // ── Incapacitated ──
  it("Incapacitated: cannot take actions, bonus actions, or reactions", () => {
    const result = computeConditionModifiers(["incapacitated"]);
    expect(result.canTakeActions).toBe(false);
    expect(result.canTakeBonusActions).toBe(false);
    expect(result.canTakeReactions).toBe(false);
    expect(result.canConcentrate).toBe(false);
    expect(result.speedMultiplier).toBe(1);
  });

  // ── Invisible ──
  it("Invisible: advantage on attack rolls", () => {
    const result = computeConditionModifiers(["invisible"]);
    expect(result.attackRollMod).toBe("advantage");
    expect(result.canTakeActions).toBe(true);
  });

  // ── Paralyzed ──
  it("Paralyzed: incapacitated, speed 0, auto-fail STR/DEX saves", () => {
    const result = computeConditionModifiers(["paralyzed"]);
    expect(result.canTakeActions).toBe(false);
    expect(result.canTakeReactions).toBe(false);
    expect(result.speedOverride).toBe(0);
    expect(result.autoFailSaves).toContain("strength");
    expect(result.autoFailSaves).toContain("dexterity");
    expect(result.canConcentrate).toBe(false);
  });

  // ── Petrified ──
  it("Petrified: speed 0, cannot act, cannot speak", () => {
    const result = computeConditionModifiers(["petrified"]);
    expect(result.speedOverride).toBe(0);
    expect(result.canTakeActions).toBe(false);
    expect(result.canTakeReactions).toBe(false);
    expect(result.canSpeak).toBe(false);
    expect(result.canConcentrate).toBe(false);
  });

  // ── Poisoned ──
  it("Poisoned: disadvantage on attack rolls and ability checks", () => {
    const result = computeConditionModifiers(["poisoned"]);
    expect(result.attackRollMod).toBe("disadvantage");
    expect(result.abilityCheckMod).toBe("disadvantage");
    expect(result.savingThrowMod).toBe("normal");
  });

  // ── Prone ──
  it("Prone: halves speed, disadvantage on attack rolls", () => {
    const result = computeConditionModifiers(["prone"]);
    expect(result.speedMultiplier).toBe(0.5);
    expect(result.attackRollMod).toBe("disadvantage");
  });

  // ── Restrained ──
  it("Restrained: speed 0, disadvantage on attack rolls", () => {
    const result = computeConditionModifiers(["restrained"]);
    expect(result.speedOverride).toBe(0);
    expect(result.attackRollMod).toBe("disadvantage");
    // DEX saves should have disadvantage
    expect(result.savingThrowMod).toBe("disadvantage");
  });

  // ── Stunned ──
  it("Stunned: speed 0, cannot act, auto-fail STR/DEX saves", () => {
    const result = computeConditionModifiers(["stunned"]);
    expect(result.canTakeActions).toBe(false);
    expect(result.canTakeReactions).toBe(false);
    expect(result.speedOverride).toBe(0);
    expect(result.isStunned).toBe(true);
    expect(result.autoFailSaves).toContain("strength");
    expect(result.autoFailSaves).toContain("dexterity");
    expect(result.canConcentrate).toBe(false);
    expect(result.canSpeak).toBe(false);
  });

  // ── Unconscious ──
  it("Unconscious: speed 0, cannot act, auto-fail STR/DEX saves", () => {
    const result = computeConditionModifiers(["unconscious"]);
    expect(result.canTakeActions).toBe(false);
    expect(result.canTakeReactions).toBe(false);
    expect(result.speedOverride).toBe(0);
    expect(result.isUnconscious).toBe(true);
    expect(result.autoFailSaves).toContain("strength");
    expect(result.autoFailSaves).toContain("dexterity");
    expect(result.canConcentrate).toBe(false);
    expect(result.canSpeak).toBe(false);
  });

  // ── Concentration ──
  it("Concentrating: no mechanical penalties to actions/movement", () => {
    const result = computeConditionModifiers(["concentration"]);
    expect(result.canTakeActions).toBe(true);
    expect(result.canTakeReactions).toBe(true);
    expect(result.speedMultiplier).toBe(1);
    expect(result.attackRollMod).toBe("normal");
  });
});

// ═══════════════════════════════════════════════════════════════
// 2. Combined/Multiple Conditions
// ═══════════════════════════════════════════════════════════════

describe("combined conditions (multiple concurrent)", () => {
  // ── Prone + Restrained ──
  it("Prone + Restrained: speed override (0 from Restrained), no double-penalty", () => {
    const result = computeConditionModifiers(["prone", "restrained"]);
    // Restrained sets speed to 0 (override), Prone halves speed
    // Override takes priority
    expect(result.speedOverride).toBe(0);
    // Attack rolls: disadvantage from both (still disadvantage, not doubled)
    expect(result.attackRollMod).toBe("disadvantage");
  });

  // ── Paralyzed + Unconscious ──
  it("Paralyzed + Unconscious: extreme case — fully incapacitated", () => {
    const result = computeConditionModifiers(["paralyzed", "unconscious"]);
    expect(result.canTakeActions).toBe(false);
    expect(result.canTakeReactions).toBe(false);
    expect(result.speedOverride).toBe(0);
    expect(result.autoFailSaves).toContain("strength");
    expect(result.autoFailSaves).toContain("dexterity");
    expect(result.canConcentrate).toBe(false);
    expect(result.isUnconscious).toBe(true);
  });

  // ── Blinded + Invisible (cancel each other's attack effects) ──
  it("Blinded + Invisible: attack advantage and disadvantage cancel to normal", () => {
    const result = computeConditionModifiers(["blinded", "invisible"]);
    // Blinded: disadvantage; Invisible: advantage → they cancel
    expect(result.attackRollMod).toBe("normal");
  });

  // ── Poisoned + Exhaustion ──
  it("Poisoned + Exhaustion: disadvantage compounded on attacks/checks", () => {
    const result = computeConditionModifiers(["poisoned", "exhaustion"]);
    expect(result.attackRollMod).toBe("disadvantage");
    expect(result.abilityCheckMod).toBe("disadvantage");
    // Speed halved once (not doubled)
    expect(result.speedMultiplier).toBe(0.5);
  });

  // ── All paralyzing conditions at once ──
  it("All incapacitating conditions: all flags set correctly", () => {
    const result = computeConditionModifiers([
      "incapacitated", "paralyzed", "petrified", "stunned", "unconscious",
    ]);
    expect(result.canTakeActions).toBe(false);
    expect(result.canTakeBonusActions).toBe(false);
    expect(result.canTakeReactions).toBe(false);
    expect(result.canConcentrate).toBe(false);
    expect(result.canSpeak).toBe(false);
    expect(result.speedOverride).toBe(0);
    expect(result.isUnconscious).toBe(true);
    expect(result.isPetrified).toBe(true);
    expect(result.isParalyzed).toBe(true);
    expect(result.isStunned).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════
// 3. Edge Cases — Input Validation
// ═══════════════════════════════════════════════════════════════

describe("edge cases — input validation", () => {
  // ── Empty array ──
  it("empty array returns default modifiers", () => {
    const result = computeConditionModifiers([]);
    expect(result.speedMultiplier).toBe(1);
    expect(result.attackRollMod).toBe("normal");
    expect(result.canTakeActions).toBe(true);
    expect(result.effectSummary).toEqual([]);
  });

  // ── Unknown condition IDs are silently ignored ──
  it("unknown condition IDs are silently ignored", () => {
    const result = computeConditionModifiers(["blinded", "not_a_condition", "xyz"]);
    // Blinded still applies; unknown ones ignored
    expect(result.attackRollMod).toBe("disadvantage");
  });

  // ── Null/undefined input (should not crash) ──
  it("handles undefined gracefully", () => {
    const result = computeConditionModifiers(undefined as unknown as string[]);
    expect(result.speedMultiplier).toBe(1);
    expect(result.attackRollMod).toBe("normal");
  });

  // ── Numeric condition IDs are treated as unknown ──
  it("non-string entries are filtered out", () => {
    const result = computeConditionModifiers(["prone", 123 as unknown as string]);
    expect(result.speedMultiplier).toBe(0.5);
  });

  // ── Case sensitivity — uppercase should be handled ──
  it("case-insensitive: uppercase condition IDs are treated as unknown", () => {
    // Note: condition IDs are lowercase ("blinded" not "Blinded")
    // This test documents the current behavior — case-sensitive
    const result = computeConditionModifiers(["BLINDED", "prone"]);
    // "BLINDED" is unknown (case-sensitive), "prone" works
    expect(result.speedMultiplier).toBe(0.5);
    expect(result.attackRollMod).toBe("normal"); // only prone applies
    // If Blinded worked, attackRollMod would be "disadvantage"
  });

  // ── Duplicate condition IDs ──
  it("duplicate condition IDs don't double-penalize", () => {
    const result = computeConditionModifiers(["poisoned", "poisoned", "poisoned"]);
    // Disadvantage once, not tripled
    expect(result.attackRollMod).toBe("disadvantage");
    expect(result.effectSummary.filter((e) => e.includes("Disadvantage")).length).toBe(2);
    // Should have "Disadvantage on attack rolls" and "Disadvantage on ability checks"
  });
});

// ═══════════════════════════════════════════════════════════════
// 4. applyConditionSpeed
// ═══════════════════════════════════════════════════════════════

describe("applyConditionSpeed", () => {
  const baseSpeed = { walk: 30, fly: 60, swim: 20, climb: 20, burrow: 10 };

  // ── No modifiers ──
  it("no modifiers: speed unchanged", () => {
    const mods = computeConditionModifiers([]);
    const result = applyConditionSpeed(baseSpeed, mods);
    expect(result.walk).toBe(30);
    expect(result.fly).toBe(60);
    expect(result.notes).toEqual([]);
  });

  // ── Halved speed ──
  it("exhaustion halves all speeds", () => {
    const mods = computeConditionModifiers(["exhaustion"]);
    const result = applyConditionSpeed(baseSpeed, mods);
    expect(result.walk).toBe(15); // 30 / 2
    expect(result.fly).toBe(30);  // 60 / 2
    expect(result.swim).toBe(10); // 20 / 2
  });

  // ── Speed override (0) ──
  it("grappled sets speed to 0", () => {
    const mods = computeConditionModifiers(["grappled"]);
    const result = applyConditionSpeed(baseSpeed, mods);
    expect(result.walk).toBe(0);
    expect(result.fly).toBe(0);
    expect(result.swim).toBe(0);
  });

  // ── Missing speed types ──
  it("missing speed types are undefined in result", () => {
    const mods = computeConditionModifiers([]);
    const result = applyConditionSpeed({ walk: 25 }, mods);
    expect(result.walk).toBe(25);
    expect(result.fly).toBeUndefined();
    expect(result.swim).toBeUndefined();
  });

  // ── Default walk of 30 when not provided ──
  it("empty speed defaults walk to 30", () => {
    const mods = computeConditionModifiers(["exhaustion"]);
    const result = applyConditionSpeed(undefined, mods);
    expect(result.walk).toBe(15);
  });

  // ── Very fast speed ──
  it("high speed is halved correctly", () => {
    const mods = computeConditionModifiers(["exhaustion"]);
    const result = applyConditionSpeed({ walk: 120 }, mods);
    expect(result.walk).toBe(60);
  });

  // ── Edge: speed 0 with override 0 ──
  it("speed override 0 from multiple sources still returns 0", () => {
    const mods = computeConditionModifiers(["grappled", "restrained", "paralyzed"]);
    const result = applyConditionSpeed({ walk: 30 }, mods);
    expect(result.walk).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════
// 5. applyConditionsToDerivations — Full Integration
// ═══════════════════════════════════════════════════════════════

describe("applyConditionsToDerivations (full integration)", () => {
  // ── Minimal character ──
  const createMinChar = (conditions: string[]): PlayerCharacter => ({
    id: "test-pc",
    name: "Test",
    playerName: "Tester",
    race: "Human",
    class: "Fighter",
    subClass: "",
    level: 5,
    classes: [{ name: "Fighter", level: 5 }],
    experiencePoints: 6500,
    background: "Soldier",
    alignment: "Lawful Good",
    inspiration: false,
    strength: 16, dexterity: 14, constitution: 15, intelligence: 10, wisdom: 12, charisma: 8,
    savingThrows: { strength: { proficient: true, bonus: 3 } },
    skills: {},
    hitPoints: { current: 44, max: 44, temporary: 0 },
    armorClass: 17,
    initiative: 2,
    speed: { walk: 30 },
    hitDice: "1d10",
    proficiencyBonus: 3,
    conditions: conditions,
    deathSaves: { successes: 0, failures: 0 },
    temporaryHitPoints: 0,
    traits: [],
    proficiencies: [],
    languages: ["Common"],
    features: [],
    equipment: [],
    inventory: [],
    currency: { copper: 0, silver: 0, electrum: 0, gold: 0, platinum: 0 },
    appearance: "",
    backstory: "",
    allies: "",
    characterNotes: "",
    isHomebrew: false,
    preparedSpells: [],
    activeFeats: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  // ── Clean character (no conditions) ──
  it("no conditions: no modification to derivations", () => {
    const char = createMinChar([]);
    const base = makeBaseDerivations();

    const result = applyConditionsToDerivations(char, base);
    expect(result.conditionModifiers.canTakeActions).toBe(true);
    expect(result.conditionModifiers.attackRollMod).toBe("normal");
    expect(result.modifiedSpeed.walk).toBe(30);
    expect(result.conditionSummaries).toEqual([]);
  });

  // ── Exhaustion ──
  it("exhaustion halves speed and causes disadvantages", () => {
    const char = createMinChar(["exhaustion"]);
    const base = makeBaseDerivations();

    const result = applyConditionsToDerivations(char, base);
    expect(result.modifiedSpeed.walk).toBe(15);
    expect(result.conditionSummaries.length).toBeGreaterThan(0);
  });

  // ── Fully incapacitated ──
  it("unconscious: fully incapacitated with zero speed", () => {
    const char = createMinChar(["unconscious"]);
    const base = makeBaseDerivations();

    const result = applyConditionsToDerivations(char, base);
    expect(result.conditionModifiers.canTakeActions).toBe(false);
    expect(result.conditionModifiers.canTakeReactions).toBe(false);
    expect(result.conditionModifiers.isUnconscious).toBe(true);
    expect(result.modifiedSpeed.walk).toBe(0);
  });

  // ── Multiple conditions: blinded + poisoned + prone ──
  it("blinded + poisoned + prone: all attack penalties stack to disadvantage", () => {
    const char = createMinChar(["blinded", "poisoned", "prone"]);
    const base = makeBaseDerivations();

    const result = applyConditionsToDerivations(char, base);
    // All three cause disadvantage on attacks → still "disadvantage"
    expect(result.conditionModifiers.attackRollMod).toBe("disadvantage");
    // Blinded = disadvantage attacks + Exhaustion = disadvantage checks
    // Poisoned = disadvantage attacks + checks
    // Prone = disadvantage attacks
    expect(result.conditionModifiers.abilityCheckMod).toBe("disadvantage"); // from poisoned
    expect(result.modifiedSpeed.walk).toBe(15); // prone halves speed
  });
});

// ═══════════════════════════════════════════════════════════════
// 6. getConditionStyle — Visual Consistency
// ═══════════════════════════════════════════════════════════════

describe("getConditionStyle", () => {
  it("returns known style for each official condition", () => {
    const known = ["Blinded", "Charmed", "Deafened", "Exhaustion", "Frightened",
      "Grappled", "Incapacitated", "Invisible", "Paralyzed", "Petrified",
      "Poisoned", "Prone", "Restrained", "Stunned", "Unconscious", "Concentrating"];
    for (const name of known) {
      const style = getConditionStyle(name);
      expect(style.bg).toBeTruthy();
      expect(style.text).toBeTruthy();
      expect(style.border).toBeTruthy();
      expect(style.icon).toBeTruthy();
      expect(style.icon.length).toBeGreaterThan(0);
    }
  });

  it("returns fallback style for unknown condition", () => {
    const style = getConditionStyle("RandomCondition");
    expect(style.icon).toBe("❓");
    expect(style.bg).toContain("surface");
  });

  it("returns correct icon for known conditions", () => {
    expect(getConditionStyle("Blinded").icon).toBe("👁️");
    expect(getConditionStyle("Petrified").icon).toBe("🗿");
    expect(getConditionStyle("Unconscious").icon).toBe("💤");
    expect(getConditionStyle("Concentrating").icon).toBe("🧘");
  });

  it("returns valid Tailwind classes", () => {
    const style = getConditionStyle("Poisoned");
    expect(style.bg).toMatch(/^bg-/);
    expect(style.text).toMatch(/^text-/);
    expect(style.border).toMatch(/^border-/);
  });
});

// ═══════════════════════════════════════════════════════════════
// 7. getConditionDetails — Detail Retrieval
// ═══════════════════════════════════════════════════════════════

describe("getConditionDetails", () => {
  it("returns detail for valid condition ID", () => {
    const detail = getConditionDetails("blinded");
    expect(detail).not.toBeNull();
    expect(detail!.name).toBe("Blinded");
    expect(detail!.effects.length).toBeGreaterThan(0);
    expect(detail!.icon).toBeTruthy();
  });

  it("returns null for invalid condition ID", () => {
    const detail = getConditionDetails("not_real" as any);
    expect(detail).toBeNull();
  });

  it("all 16 official conditions have effects", () => {
    const ids = ["blinded", "charmed", "deafened", "exhaustion", "frightened",
      "grappled", "incapacitated", "invisible", "paralyzed", "petrified",
      "poisoned", "prone", "restrained", "stunned", "unconscious", "concentration"] as const;
    for (const id of ids) {
      const detail = getConditionDetails(id);
      expect(detail).not.toBeNull();
      expect(detail!.effects.length).toBeGreaterThan(0);
    }
  });

  it("effect list is non-empty for all conditions", () => {
    const all = getAllConditionDetails();
    expect(all.length).toBe(16);
    for (const detail of all) {
      expect(detail.effects.length).toBeGreaterThan(0);
      expect(detail.icon.length).toBeGreaterThan(0);
    }
  });
});

// ═══════════════════════════════════════════════════════════════
// 8. getAllConditionDetails — Full Catalog
// ═══════════════════════════════════════════════════════════════

describe("getAllConditionDetails", () => {
  it("returns all 16 official conditions", () => {
    const all = getAllConditionDetails();
    expect(all.length).toBe(16);
  });

  it("no null entries in the full list", () => {
    const all = getAllConditionDetails();
    for (const detail of all) {
      expect(detail).not.toBeNull();
    }
  });

  it("all entries have unique IDs", () => {
    const all = getAllConditionDetails();
    const ids = all.map((d) => d.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(all.length);
  });

  it("all entries have meaningful descriptions", () => {
    const all = getAllConditionDetails();
    for (const detail of all) {
      expect(detail.description.length).toBeGreaterThan(10);
    }
  });

  it("conditions are sorted consistently", () => {
    const all = getAllConditionDetails();
    // We don't enforce a specific order, but it should be stable
    const first = getAllConditionDetails();
    expect(first.map((d) => d.id)).toEqual(all.map((d) => d.id));
  });
});

// ═══════════════════════════════════════════════════════════════
// 9. ConditionModifier Default State Verification
// ═══════════════════════════════════════════════════════════════

describe("ConditionModifier default state", () => {
  it("default (empty) has all capabilities enabled", () => {
    const result = computeConditionModifiers([]);
    expect(result.canTakeActions).toBe(true);
    expect(result.canTakeBonusActions).toBe(true);
    expect(result.canTakeReactions).toBe(true);
    expect(result.canConcentrate).toBe(true);
    expect(result.canSpeak).toBe(true);
  });

  it("default (empty) has no penalties", () => {
    const result = computeConditionModifiers([]);
    expect(result.attackRollMod).toBe("normal");
    expect(result.savingThrowMod).toBe("normal");
    expect(result.abilityCheckMod).toBe("normal");
    expect(result.speedMultiplier).toBe(1);
    expect(result.speedOverride).toBeNull();
    expect(result.autoFailSaves).toEqual([]);
  });

  it("default (empty) has no special states", () => {
    const result = computeConditionModifiers([]);
    expect(result.isUnconscious).toBe(false);
    expect(result.isPetrified).toBe(false);
    expect(result.isParalyzed).toBe(false);
    expect(result.isStunned).toBe(false);
    expect(result.effectSummary).toEqual([]);
  });
});

// ═══════════════════════════════════════════════════════════════
// 10. Explicit Error Handling Contracts
// ═══════════════════════════════════════════════════════════════

describe("error handling contracts", () => {
  it("computeConditionModifiers does not throw for any input", () => {
    expect(() => computeConditionModifiers([])).not.toThrow();
    expect(() => computeConditionModifiers(["blinded"])).not.toThrow();
    expect(() => computeConditionModifiers(undefined as any)).not.toThrow();
    expect(() => computeConditionModifiers(null as any)).not.toThrow();
  });

  it("applyConditionSpeed does not throw for missing speed types", () => {
    const mods = computeConditionModifiers(["exhaustion"]);
    expect(() => applyConditionSpeed(undefined, mods)).not.toThrow();
    expect(() => applyConditionSpeed(undefined as any, mods)).not.toThrow();
  });

  it("getConditionStyle does not throw for any string", () => {
    expect(() => getConditionStyle("")).not.toThrow();
    expect(() => getConditionStyle("Nonexistent!@#$")).not.toThrow();
    expect(() => getConditionStyle(undefined as any)).not.toThrow();
  });

  it("getConditionDetails does not throw for any input", () => {
    expect(() => getConditionDetails(undefined as any)).not.toThrow();
    expect(() => getConditionDetails(null as any)).not.toThrow();
    expect(() => getConditionDetails("bad" as any)).not.toThrow();
  });
});
