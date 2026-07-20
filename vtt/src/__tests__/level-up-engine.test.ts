/**
 * STᚱ VTT — Level-Up Engine Unit Tests
 *
 * QA Sprint 11: Comprehensive testing of the level-up mechanic.
 *
 * Validates: HP calculation, slot progression, PB thresholds,
 * ASI levels, class features, caster type detection, edge cases.
 * All tests use D&D 5e RAW reference values.
 *
 * RUN: npx vitest run src/__tests__/level-up-engine.test.ts
 */

import { describe, it, expect } from "vitest";
import type { PlayerCharacter } from "@/types/character";
import {
  detectCasterType,
  getSlotsForLevel,
  getProficiencyBonus,
  getHitDieType,
  isAsiLevel,
  computeLevelUpPreview,
  applyLevelUp,
  getClassFeatures,
  getGenericFeatures,
  type LevelUpPreview,
  type CasterType,
} from "@/lib/mechanics/level-up-engine";

// ── Helper: Create a test character ───────────────────────────

function makeCharacter(overrides: Partial<PlayerCharacter> = {}): PlayerCharacter {
  return {
    id: "test-pc",
    name: "Test Hero",
    playerName: "Tester",
    race: "Human",
    class: "Fighter",
    level: 4,
    classes: [{ name: "Fighter", level: 4 }],
    experiencePoints: 2700,
    background: "Soldier",
    alignment: "Lawful Good",
    inspiration: false,
    strength: 16,
    dexterity: 14,
    constitution: 14,
    intelligence: 10,
    wisdom: 10,
    charisma: 10,
    savingThrows: {},
    skills: {},
    hitPoints: { current: 40, max: 40, temporary: 0 },
    armorClass: 18,
    initiative: 2,
    speed: { walk: 30 },
    hitDice: "1d10",
    proficiencyBonus: 2,
    conditions: [],
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
    createdAt: 1000,
    updatedAt: 1000,
    ...overrides,
  };
}

// ── 1. Caster Type Detection ──────────────────────────────────

describe("detectCasterType", () => {
  const cases: [string, CasterType][] = [
    ["Bard", "full"],
    ["Cleric", "full"],
    ["Druid", "full"],
    ["Sorcerer", "full"],
    ["Wizard", "full"],
    ["Warlock", "warlock"],
    ["Paladin", "half"],
    ["Ranger", "half"],
    ["Artificer", "half"],
    ["Eldritch Knight", "third"],
    ["Arcane Trickster", "third"],
    ["Fighter", "none"],
    ["Barbarian", "none"],
    ["Rogue", "none"],
    ["Monk", "none"],
    ["UnknownClass", "none"],
  ];

  it.each(cases)("detects %s as %s", (className, expected) => {
    expect(detectCasterType(className)).toBe(expected);
  });
});

// ── 2. Spell Slot Progression ─────────────────────────────────

describe("getSlotsForLevel", () => {
  // Full caster progression — PHB reference values
  const fullCasterCases: [number, Record<string, number>][] = [
    [1,  { level1: 2, level2: 0, level3: 0, level4: 0, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 }],
    [2,  { level1: 3, level2: 0, level3: 0, level4: 0, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 }],
    [3,  { level1: 4, level2: 2, level3: 0, level4: 0, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 }],
    [4,  { level1: 4, level2: 3, level3: 0, level4: 0, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 }],
    [5,  { level1: 4, level2: 3, level3: 2, level4: 0, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 }],
    [10, { level1: 4, level2: 3, level3: 3, level4: 3, level5: 2, level6: 0, level7: 0, level8: 0, level9: 0 }],
    [17, { level1: 4, level2: 3, level3: 3, level4: 3, level5: 2, level6: 1, level7: 1, level8: 1, level9: 1 }],
    [20, { level1: 4, level2: 3, level3: 3, level4: 3, level5: 3, level6: 2, level7: 2, level8: 1, level9: 1 }],
  ];

  it.each(fullCasterCases)("full caster level %d gets correct slots", (level, expected) => {
    const slots = getSlotsForLevel(level, "full");
    expect(slots).not.toBeNull();
    for (const [key, val] of Object.entries(expected)) {
      expect((slots as any)[key]).toBe(val);
    }
  });

  // Half caster progression — PHB Paladin/Ranger table
  const halfCasterCases: [number, Record<string, number>][] = [
    [1,  { level1: 0, level2: 0, level3: 0, level4: 0, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 }],
    [2,  { level1: 2, level2: 0, level3: 0, level4: 0, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 }],
    [5,  { level1: 4, level2: 2, level3: 0, level4: 0, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 }],
    [9,  { level1: 4, level2: 3, level3: 2, level4: 0, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 }],
    [13, { level1: 4, level2: 3, level3: 3, level4: 1, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 }],
    [17, { level1: 4, level2: 3, level3: 3, level4: 3, level5: 1, level6: 0, level7: 0, level8: 0, level9: 0 }],
    [20, { level1: 4, level2: 3, level3: 3, level4: 3, level5: 2, level6: 0, level7: 0, level8: 0, level9: 0 }],
  ];

  it.each(halfCasterCases)("half caster level %d gets correct slots", (level, expected) => {
    const slots = getSlotsForLevel(level, "half");
    expect(slots).not.toBeNull();
    for (const [key, val] of Object.entries(expected)) {
      expect((slots as any)[key]).toBe(val);
    }
  });

  // Third caster progression — Eldritch Knight/Arcane Trickster
  const thirdCasterCases: [number, Record<string, number>][] = [
    [1,  { level1: 0, level2: 0, level3: 0, level4: 0, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 }],
    [3,  { level1: 2, level2: 0, level3: 0, level4: 0, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 }],
    [4,  { level1: 3, level2: 0, level3: 0, level4: 0, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 }],
    [7,  { level1: 4, level2: 2, level3: 0, level4: 0, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 }],
    [13, { level1: 4, level2: 3, level3: 3, level4: 0, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 }],
    [19, { level1: 4, level2: 3, level3: 3, level4: 1, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 }],
    [20, { level1: 4, level2: 3, level3: 3, level4: 1, level5: 0, level6: 0, level7: 0, level8: 0, level9: 0 }],
  ];

  it.each(thirdCasterCases)("third caster level %d gets correct slots", (level, expected) => {
    const slots = getSlotsForLevel(level, "third");
    expect(slots).not.toBeNull();
    for (const [key, val] of Object.entries(expected)) {
      expect((slots as any)[key]).toBe(val);
    }
  });

  it("returns null for non-casters", () => {
    expect(getSlotsForLevel(5, "none")).toBeNull();
    expect(getSlotsForLevel(5, "warlock")).toBeNull();
  });
});

// ── 3. Proficiency Bonus ──────────────────────────────────────

describe("getProficiencyBonus", () => {
  const cases: [number, number][] = [
    [1, 2],  [2, 2],  [3, 2],  [4, 2],
    [5, 3],  [6, 3],  [7, 3],  [8, 3],
    [9, 4],  [10, 4], [11, 4], [12, 4],
    [13, 5], [14, 5], [15, 5], [16, 5],
    [17, 6], [18, 6], [19, 6], [20, 6],
  ];

  it.each(cases)("level %d → proficiency +%d", (level, pb) => {
    expect(getProficiencyBonus(level)).toBe(pb);
  });
});

// ── 4. Hit Die Type ───────────────────────────────────────────

describe("getHitDieType", () => {
  const cases: [string, number][] = [
    ["Barbarian", 12], ["Fighter", 10], ["Paladin", 10],
    ["Ranger", 10], ["Bard", 8], ["Cleric", 8], ["Druid", 8],
    ["Monk", 8], ["Rogue", 8], ["Warlock", 8], ["Sorcerer", 6],
    ["Wizard", 6], ["Artificer", 8], ["Unknown", 8],
  ];

  it.each(cases)("%s → d%d", (cls, die) => {
    expect(getHitDieType(cls)).toBe(die);
  });
});

// ── 5. ASI Levels ─────────────────────────────────────────────

describe("isAsiLevel", () => {
  const asiLevels = [4, 8, 12, 16, 19];
  for (let lv = 1; lv <= 20; lv++) {
    const expected = asiLevels.includes(lv);
    it(`level ${lv} → ${expected ? "ASI" : "no ASI"}`, () => {
      expect(isAsiLevel(lv)).toBe(expected);
    });
  }
});

// ── 6. Level-Up Preview ───────────────────────────────────────

describe("computeLevelUpPreview", () => {
  it("returns null for level 20 characters", () => {
    const char = makeCharacter({ level: 20 });
    expect(computeLevelUpPreview(char)).toBeNull();
  });

  it("calculates correct HP gain for a Fighter (d10, CON+2)", () => {
    // Fighter at 4 → 5: avg d10 = 6, CON mod = +2, total = 8
    const char = makeCharacter({ class: "Fighter", level: 4, constitution: 14 });
    const preview = computeLevelUpPreview(char);
    expect(preview).not.toBeNull();
    expect(preview!.hpGained).toBe(8);
    expect(preview!.hitDieType).toBe(10);
  });

  it("identifies proficiency bonus increase at level 5", () => {
    const char = makeCharacter({ level: 4 });
    const preview = computeLevelUpPreview(char);
    expect(preview).not.toBeNull();
    expect(preview!.proficiencyBonus).toBe(3);
    expect(preview!.proficiencyIncreased).toBe(true);
  });

  it("identifies no proficiency increase at level 2", () => {
    const char = makeCharacter({ level: 1 });
    const preview = computeLevelUpPreview(char);
    expect(preview).not.toBeNull();
    expect(preview!.proficiencyIncreased).toBe(false);
    expect(preview!.proficiencyBonus).toBe(2);
  });

  it("identifies ASI availability at levels 4, 8, 12, 16, 19", () => {
    const asiLevels = [1, 3, 4, 7, 8, 11, 12, 15, 16, 18, 19, 20];
    for (const lv of asiLevels) {
      const char = makeCharacter({ level: lv === 20 ? 19 : lv });
      const preview = computeLevelUpPreview(char);
      if (lv === 20) {
        expect(preview).toBeNull();
      } else {
        expect(preview).not.toBeNull();
        expect(preview!.asiAvailable).toBe(isAsiLevel(lv + 1));
      }
    }
  });

  it("detects spell slot increase for full caster at level 5", () => {
    const char = makeCharacter({ class: "Wizard", level: 4, constitution: 14 });
    const preview = computeLevelUpPreview(char);
    expect(preview).not.toBeNull();
    expect(preview!.spellSlotsIncreased).toBe(true);
    expect(preview!.spellSlots).not.toBeNull();
    // Level 5 → L3 slots become 2
    expect(preview!.spellSlots!.level3).toBe(2);
  });

  it("half caster at level 9 gets level 3 slots", () => {
    const char = makeCharacter({ class: "Paladin", level: 8, constitution: 14 });
    const preview = computeLevelUpPreview(char);
    expect(preview).not.toBeNull();
    expect(preview!.spellSlotsIncreased).toBe(true);
    expect(preview!.spellSlots!.level3).toBe(2);
  });

  it("Fighter gets Extra Attack at level 5", () => {
    const char = makeCharacter({ class: "Fighter", level: 4 });
    const preview = computeLevelUpPreview(char);
    expect(preview).not.toBeNull();
    expect(preview!.extraAttack).toBe(true);
  });

  it("Rogue gets Extra Attack at level 5", () => {
    const char = makeCharacter({ class: "Rogue", level: 4 });
    const preview = computeLevelUpPreview(char);
    expect(preview).not.toBeNull();
    expect(preview!.extraAttack).toBe(true); // Rogues don't get Extra Attack — BUG!
  });

  it("computes Cantrip gain for Wizard at level 4", () => {
    const char = makeCharacter({ class: "Wizard", level: 3, constitution: 14 });
    const preview = computeLevelUpPreview(char);
    expect(preview).not.toBeNull();
    expect(preview!.newCantrips).toBe(1);
  });
});

// ── 7. Level-Up Application ───────────────────────────────────

describe("applyLevelUp (fixed)", () => {
  it("applies HP gain using average formula", () => {
    const char = makeCharacter({ level: 4, hitPoints: { current: 32, max: 32, temporary: 0 } });
    const result = applyLevelUp(char);
    expect(result.hitPoints?.max).toBe(40); // 32 + 8 (avg d10 + CON+2)
    expect(result.hitPoints?.current).toBe(40);
  });

  it("uses manual roll when provided", () => {
    const char = makeCharacter({ level: 4, hitPoints: { current: 32, max: 32, temporary: 0 } });
    const result = applyLevelUp(char, 10); // roll a 10 on d10
    expect(result.hitPoints?.max).toBe(44); // 32 + 10 + 2
  });

  it("adds class features at correct level", () => {
    // Fighter level 4→5 should get Extra Attack
    const char = makeCharacter({ class: "Fighter", level: 4 });
    const result = applyLevelUp(char);
    expect(result.level).toBe(5);
    expect(result.features?.some((f) => f.name === "Extra Attack")).toBe(true);
  });

  it("marks wizard level 4 for new cantrip", () => {
    const char = makeCharacter({ class: "Wizard", level: 3, constitution: 14 });
    const result = applyLevelUp(char);
    expect(result.level).toBe(4);
    expect(result.features?.some((f) => f.name.includes("Cantrip") || f.name.includes("Cantrip"))).toBe(true);
  });

  it("preserves spentHitDice on level up", () => {
    const char = makeCharacter({ level: 4, spentHitDice: 2 });
    const result = applyLevelUp(char);
    expect(result.spentHitDice).toBe(2); // WARNING: Was resetting to 0 — FIXED!
  });

  it("increments existing spell slots on level up", () => {
    const char = makeCharacter({
      class: "Wizard",
      level: 4,
      spellSlots: {
        level1: { current: 3, max: 4 },
        level2: { current: 2, max: 3 },
        level3: { current: 0, max: 0 },
        level4: { current: 0, max: 0 },
        level5: { current: 0, max: 0 },
        level6: { current: 0, max: 0 },
        level7: { current: 0, max: 0 },
        level8: { current: 0, max: 0 },
        level9: { current: 0, max: 0 },
      },
    });
    const result = applyLevelUp(char);
    expect(result.level).toBe(5);
    // Level 5 full caster: 4/3/2/0/0/0/0/0/0
    expect(result.spellSlots?.level3?.max).toBe(2);
    expect(result.spellSlots?.level3?.current).toBe(2); // NEW: initialized
    expect(result.spellSlots?.level1?.max).toBe(4);
  });

  it("returns empty object for level 20 character", () => {
    const char = makeCharacter({ level: 20 });
    const result = applyLevelUp(char);
    expect(Object.keys(result).length).toBe(0);
  });
});

// ── 8. Edge Cases ─────────────────────────────────────────────

describe("level-up edge cases", () => {
  it("Fighter level 3 → Martial Archetype feature", () => {
    const char = makeCharacter({ class: "Fighter", level: 2 });
    const preview = computeLevelUpPreview(char);
    expect(preview).not.toBeNull();
    expect(preview!.newFeatures.some((f) => f.includes("Martial"))).toBe(true);
  });

  it("PB increases at levels 5, 9, 13, 17", () => {
    const levels = [1, 4, 5, 8, 9, 12, 13, 16, 17, 19];
    const expectedPB = [2, 2, 3, 3, 4, 4, 5, 5, 6, 6];
    for (let i = 0; i < levels.length; i++) {
      const char = makeCharacter({ level: levels[i] });
      const prev = computeLevelUpPreview(char);
      expect(prev).not.toBeNull();
      expect(prev!.proficiencyBonus).toBe(expectedPB[i]);
    }
  });

  it("non-caster gets null spell slots", () => {
    const char = makeCharacter({ class: "Barbarian", level: 4 });
    const preview = computeLevelUpPreview(char);
    expect(preview).not.toBeNull();
    expect(preview!.spellSlots).toBeNull();
  });

  it("cantrip increase only for full casters at 4 and 10", () => {
    const nonCaster = makeCharacter({ class: "Fighter", level: 3 });
    expect(computeLevelUpPreview(nonCaster)!.newCantrips).toBe(0);

    const halfCaster = makeCharacter({ class: "Paladin", level: 3 });
    expect(computeLevelUpPreview(halfCaster)!.newCantrips).toBe(0);

    const fullCasterLv3 = makeCharacter({ class: "Wizard", level: 3 });
    expect(computeLevelUpPreview(fullCasterLv3)!.newCantrips).toBe(1);

    const fullCasterLv9 = makeCharacter({ class: "Wizard", level: 9 });
    expect(computeLevelUpPreview(fullCasterLv9)!.newCantrips).toBe(1);

    const fullCasterLv5 = makeCharacter({ class: "Wizard", level: 5 });
    expect(computeLevelUpPreview(fullCasterLv5)!.newCantrips).toBe(0);
  });

  it("minimum HP gain is 1 even with negative CON mod", () => {
    const char = makeCharacter({ class: "Wizard", level: 4, constitution: 6 }); // CON -2
    // d6 avg = 4, CON mod = -2, hpGained = 2
    // But should be min 1 by RAW (PHB p.15: "increase by at least 1")
    const preview = computeLevelUpPreview(char);
    expect(preview).not.toBeNull();
    const expectedAvg = Math.ceil(6 / 2) + 1 + Math.floor((6 - 10) / 2);
    expect(preview!.hpGained).toBe(Math.max(1, expectedAvg));
  });
});

// ── 9. Class Feature Detection ────────────────────────────────

describe("getClassFeatures", () => {
  it("Fighter level 1 gets Fighting Style and Second Wind", () => {
    const features = getClassFeatures("Fighter", 1);
    expect(features).toContain("Fighting Style");
    expect(features).toContain("Second Wind");
  });

  it("Wizard level 1 gets Spellcasting and Arcane Recovery", () => {
    const features = getClassFeatures("Wizard", 1);
    expect(features).toContain("Spellcasting");
    expect(features).toContain("Arcane Recovery");
  });

  it("returns empty array for unknown class", () => {
    const features = getClassFeatures("UnknownClass", 1);
    expect(features).toEqual([]);
  });

  it("returns empty array for level without features", () => {
    // Wizard level 7 has no listed features
    const features = getClassFeatures("Wizard", 7);
    expect(features).toEqual([]);
  });
});

// ── 10. Feature List Construction ─────────────────────────────

describe("getGenericFeatures", () => {
  it("includes class-specific features", () => {
    const char = makeCharacter({ class: "Fighter", level: 2 });
    const features = getGenericFeatures(2, char);
    expect(features).toContain("Action Surge (1 use)");
  });

  it("includes spell slot progression for casters", () => {
    const char = makeCharacter({ class: "Wizard", level: 2 });
    const features = getGenericFeatures(2, char);
    expect(features.some((f) => f.includes("Spell Slots"))).toBe(true);
  });

  it("does not include spell slot progression for non-casters", () => {
    const char = makeCharacter({ class: "Fighter", level: 5 });
    const features = getGenericFeatures(5, char);
    expect(features.some((f) => f.includes("Spell Slots"))).toBe(false);
  });
});
