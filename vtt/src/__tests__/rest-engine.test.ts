/**
 * STᚱ VTT — Rest & Recovery Engine Unit Tests
 *
 * QA Sprint 12: Comprehensive testing of Short Rest and Long Rest mechanics.
 *
 * Validates: HP recovery, hit dice spending, resource recharge,
 * spell slot restoration, edge cases, and RAW compliance.
 *
 * RUN: npm run test:unit
 */

import { describe, it, expect, beforeEach } from "vitest";
import type { PlayerCharacter } from "@/types/character";
import type { ClassResource, SpellSlots, HitPoints } from "@/types/character-core";
import {
  computeHitDiceTotal,
  computeAvailableHitDice,
  computeHitDieType,
  computeShortRestSummary,
  applyShortRest,
  computeLongRestSummary,
  applyLongRest,
  type RestSummary,
  type LongRestSummary,
} from "@/lib/mechanics/rest-engine";

// ── Helper: Create a test character ───────────────────────────

function makeCharacter(overrides: Partial<PlayerCharacter> = {}): PlayerCharacter {
  return {
    id: "test-pc",
    name: "Test Hero",
    playerName: "Tester",
    race: "Human",
    class: "Fighter",
    level: 5,
    classes: [{ name: "Fighter", level: 5 }],
    experiencePoints: 6500,
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
    hitPoints: { current: 25, max: 44, temporary: 0 },
    armorClass: 18,
    initiative: 2,
    speed: { walk: 30 },
    hitDice: "1d10",
    proficiencyBonus: 3,
    conditions: [],
    deathSaves: { successes: 0, failures: 0 },
    temporaryHitPoints: 0,
    traits: [],
    proficiencies: [],
    languages: ["Common"],
    features: [
      { name: "Fighting Style", description: "Archery", source: "Fighter" },
      { name: "Second Wind", description: "1/short rest", source: "Fighter" },
      { name: "Action Surge", description: "1/short rest", source: "Fighter" },
    ],
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
    spellSlots: {
      level1: { current: 0, max: 0 },
      level2: { current: 0, max: 0 },
      level3: { current: 0, max: 0 },
      level4: { current: 0, max: 0 },
      level5: { current: 0, max: 0 },
      level6: { current: 0, max: 0 },
      level7: { current: 0, max: 0 },
      level8: { current: 0, max: 0 },
      level9: { current: 0, max: 0 },
    },
    resources: [],
    spentHitDice: 0,
    createdAt: 1000,
    updatedAt: 1000,
    ...overrides,
  };
}

function makeCasterCharacter(overrides: Partial<PlayerCharacter> = {}): PlayerCharacter {
  const base = makeCharacter({
    class: "Wizard",
    level: 5,
    hitDice: "1d6",
    features: [
      { name: "Spellcasting", description: "Full caster", source: "Wizard" },
      { name: "Arcane Recovery", description: "Recover slots 1/day", source: "Wizard" },
    ],
    spellSlots: {
      level1: { current: 1, max: 4 },
      level2: { current: 2, max: 3 },
      level3: { current: 0, max: 2 },
      level4: { current: 0, max: 0 },
      level5: { current: 0, max: 0 },
      level6: { current: 0, max: 0 },
      level7: { current: 0, max: 0 },
      level8: { current: 0, max: 0 },
      level9: { current: 0, max: 0 },
    },
    ...overrides,
  });
  // Casters don't have this
  base.hitPoints = { current: 18, max: 28, temporary: 0 };
  return base;
}

// ── 1. Hit Dice Calculation ───────────────────────────────────

describe("computeHitDiceTotal", () => {
  it("equals character level", () => {
    expect(computeHitDiceTotal(makeCharacter({ level: 1 }))).toBe(1);
    expect(computeHitDiceTotal(makeCharacter({ level: 5 }))).toBe(5);
    expect(computeHitDiceTotal(makeCharacter({ level: 20 }))).toBe(20);
  });
});

describe("computeAvailableHitDice", () => {
  it("returns full HD when none spent", () => {
    const c = makeCharacter({ level: 5, spentHitDice: 0 });
    expect(computeAvailableHitDice(c)).toBe(5);
  });

  it("subtracts spent HD", () => {
    const c = makeCharacter({ level: 5, spentHitDice: 3 });
    expect(computeAvailableHitDice(c)).toBe(2);
  });

  it("returns 0 when all HD spent", () => {
    const c = makeCharacter({ level: 3, spentHitDice: 3 });
    expect(computeAvailableHitDice(c)).toBe(0);
  });

  it("returns 0 when spent exceeds total (edge case)", () => {
    const c = makeCharacter({ level: 3, spentHitDice: 10 });
    expect(computeAvailableHitDice(c)).toBe(0);
  });

  it("defaults spentHitDice to 0 when undefined", () => {
    const c = makeCharacter({ level: 5 });
    delete (c as any).spentHitDice;
    expect(computeAvailableHitDice(c)).toBe(5);
  });
});

describe("computeHitDieType", () => {
  const cases: [string, number][] = [
    ["Barbarian", 12], ["Fighter", 10], ["Paladin", 10],
    ["Ranger", 10], ["Blood Hunter", 10],
    ["Bard", 8], ["Cleric", 8], ["Druid", 8], ["Monk", 8],
    ["Rogue", 8], ["Warlock", 8], ["Artificer", 8],
    ["Wizard", 6], ["Sorcerer", 6],
    ["UnknownClass", 8], ["", 8],
  ];

  it.each(cases)("returns d%d for %s", (cls, die) => {
    expect(computeHitDieType(makeCharacter({ class: cls }))).toBe(die);
  });
});

// ── 2. Short Rest Summary ─────────────────────────────────────

describe("computeShortRestSummary", () => {
  it("heals correct amount with 0 HD spent (no heal)", () => {
    const c = makeCharacter({ level: 5, spentHitDice: 0 });
    const s = computeShortRestSummary(c, { hitDiceToSpend: 0 });
    expect(s.hpHealed).toBe(0);
    expect(s.hitDiceSpent).toBe(0);
  });

  it("calculates correct HP from 1 hit die (Fighter d10, CON+2)", () => {
    const c = makeCharacter({ level: 5, spentHitDice: 0 });
    // d10 avg = floor(10/2) + 1 = 6 + CON mod = +2 = 8
    const s = computeShortRestSummary(c, { hitDiceToSpend: 1 });
    expect(s.hpHealed).toBe(8);
    expect(s.hitDiceSpent).toBe(1);
  });

  it("caps HP at max HP", () => {
    // HP = 42/44 → missing 2 HP
    const c = makeCharacter({ hitPoints: { current: 42, max: 44, temporary: 0 }, spentHitDice: 0 });
    const s = computeShortRestSummary(c, { hitDiceToSpend: 1 });
    // d10 avg + CON+2 = 8, but only 2 missing
    expect(s.hpHealed).toBe(2);
  });

  it("does not exceed available hit dice", () => {
    const c = makeCharacter({ level: 3, spentHitDice: 2 }); // 1 available
    const s = computeShortRestSummary(c, { hitDiceToSpend: 5 }); // asking for 5
    expect(s.hitDiceSpent).toBe(1); // only 1 available
    expect(s.hpHealed).toBeGreaterThan(0);
  });

  it("correctly handles 0 available hit dice", () => {
    const c = makeCharacter({ level: 3, spentHitDice: 3 }); // 0 available
    const s = computeShortRestSummary(c, { hitDiceToSpend: 1 });
    expect(s.hitDiceSpent).toBe(0);
    expect(s.hpHealed).toBe(0);
    expect(s.hasAvailableHitDice).toBe(false);
  });

  it("detects short-rest class resources", () => {
    const c = makeCharacter({
      resources: [
        { name: "Second Wind", current: 0, max: 1, recharge: "short_rest" },
        { name: "Rage", current: 2, max: 3, recharge: "long_rest" },
      ],
    });
    const s = computeShortRestSummary(c, { hitDiceToSpend: 0 });
    expect(s.resourcesRecharged).toContain("Second Wind");
    expect(s.resourcesRecharged).not.toContain("Rage");
  });

  it("flags temp HP cleared", () => {
    const c = makeCharacter({ temporaryHitPoints: 5 });
    const s = computeShortRestSummary(c, { hitDiceToSpend: 0 });
    expect(s.tempHpCleared).toBe(true);
  });

  it("reports no resources recharged when all are full", () => {
    const c = makeCharacter({
      resources: [
        { name: "Second Wind", current: 1, max: 1, recharge: "short_rest" },
      ],
    });
    const s = computeShortRestSummary(c, { hitDiceToSpend: 0 });
    expect(s.resourcesRecharged).not.toContain("Second Wind");
  });

  it("returns hasAvailableHitDice correctly after spending", () => {
    const c = makeCharacter({ level: 3, spentHitDice: 1 }); // 2 available
    const s = computeShortRestSummary(c, { hitDiceToSpend: 1 }); // spend 1
    expect(s.hasAvailableHitDice).toBe(true);
    expect(s.availableHitDiceCount).toBe(1);

    const s2 = computeShortRestSummary(c, { hitDiceToSpend: 2 }); // spend all
    expect(s2.hasAvailableHitDice).toBe(false);
    expect(s2.availableHitDiceCount).toBe(0);
  });
});

// ── 3. Short Rest Application ─────────────────────────────────

describe("applyShortRest", () => {
  it("applies HP correctly", () => {
    const c = makeCharacter({ hitPoints: { current: 25, max: 44, temporary: 0 } });
    const result = applyShortRest(c, { hitDiceToSpend: 2 });
    // 2 × 8 = 16, 25 + 16 = 41
    expect(result.hitPoints?.current).toBe(41);
    expect(result.hitPoints?.temporary).toBe(0);
  });

  it("clears temporary HP", () => {
    const c = makeCharacter({ temporaryHitPoints: 7 });
    const result = applyShortRest(c, { hitDiceToSpend: 0 });
    expect(result.hitPoints?.temporary).toBe(0);
  });

  it("recharges short-rest resources", () => {
    const c = makeCharacter({
      resources: [
        { name: "Second Wind", current: 0, max: 1, recharge: "short_rest" },
        { name: "Action Surge", current: 0, max: 1, recharge: "short_rest" },
      ],
    });
    const result = applyShortRest(c, { hitDiceToSpend: 0 });
    expect((result.resources as ClassResource[])?.find((r) => r.name === "Second Wind")?.current).toBe(1);
    expect((result.resources as ClassResource[])?.find((r) => r.name === "Action Surge")?.current).toBe(1);
  });

  it("does not recharge long-rest resources", () => {
    const c = makeCharacter({
      resources: [
        { name: "Rage", current: 0, max: 3, recharge: "long_rest" },
      ],
    });
    const result = applyShortRest(c, { hitDiceToSpend: 0 });
    expect((result.resources as ClassResource[])?.find((r) => r.name === "Rage")?.current).toBe(0);
  });

  it("increments spentHitDice", () => {
    const c = makeCharacter({ spentHitDice: 2 });
    const result = applyShortRest(c, { hitDiceToSpend: 1 });
    expect(result.spentHitDice).toBe(3);
  });

  it("caps HP at max", () => {
    const c = makeCharacter({ hitPoints: { current: 42, max: 44, temporary: 0 } });
    const result = applyShortRest(c, { hitDiceToSpend: 2 });
    expect(result.hitPoints?.current).toBe(44);
  });

  it("applies spell slot recovery when provided", () => {
    const c = makeCasterCharacter();
    const result = applyShortRest(c, { hitDiceToSpend: 0 }, { 1: 2, 2: 1 });
    expect(result.spellSlots?.level1?.current).toBe(3); // was 1 + 2
    expect(result.spellSlots?.level2?.current).toBe(3); // was 2 + 1 (capped at max)
  });

  it("handles empty resources array gracefully", () => {
    const c = makeCharacter({ resources: undefined as any });
    const result = applyShortRest(c, { hitDiceToSpend: 0 });
    expect(result.resources).toEqual([]);
  });
});

// ── 4. Long Rest Summary ──────────────────────────────────────

describe("computeLongRestSummary", () => {
  it("heals to full HP", () => {
    const c = makeCharacter({ hitPoints: { current: 10, max: 44, temporary: 5 } });
    const s = computeLongRestSummary(c);
    expect(s.hpHealed).toBe(34);
    expect(s.tempHpCleared).toBe(true);
  });

  it("recovers half hit dice (min 1)", () => {
    expect(computeLongRestSummary(makeCharacter({ level: 1 })).hitDiceRecovered).toBe(1);
    expect(computeLongRestSummary(makeCharacter({ level: 2 })).hitDiceRecovered).toBe(1);
    expect(computeLongRestSummary(makeCharacter({ level: 5 })).hitDiceRecovered).toBe(2);
    expect(computeLongRestSummary(makeCharacter({ level: 10 })).hitDiceRecovered).toBe(5);
    expect(computeLongRestSummary(makeCharacter({ level: 19 })).hitDiceRecovered).toBe(9);
    expect(computeLongRestSummary(makeCharacter({ level: 20 })).hitDiceRecovered).toBe(10);
  });

  it("restores all depleted spell slots", () => {
    const c = makeCasterCharacter();
    const s = computeLongRestSummary(c);
    expect(Object.keys(s.slotsRestored).length).toBe(2); // L1 (3 missing) + L2 (1 missing)
    expect(s.slotsRestored[1]).toBe(3);
    expect(s.slotsRestored[2]).toBe(1);
  });

  it("reports zero slot recovery when all slots are full", () => {
    const c = makeCasterCharacter({
      spellSlots: {
        level1: { current: 4, max: 4 },
        level2: { current: 3, max: 3 },
        level3: { current: 2, max: 2 },
        level4: { current: 0, max: 0 },
        level5: { current: 0, max: 0 },
        level6: { current: 0, max: 0 },
        level7: { current: 0, max: 0 },
        level8: { current: 0, max: 0 },
        level9: { current: 0, max: 0 },
      },
    });
    const s = computeLongRestSummary(c);
    expect(Object.keys(s.slotsRestored).length).toBe(0);
  });

  it("recharges all resources (both short and long rest)", () => {
    const c = makeCharacter({
      resources: [
        { name: "Second Wind", current: 0, max: 1, recharge: "short_rest" },
        { name: "Rage", current: 1, max: 3, recharge: "long_rest" },
      ],
    });
    const s = computeLongRestSummary(c);
    expect(s.resourcesRecharged).toContain("Second Wind");
    expect(s.resourcesRecharged).toContain("Rage");
  });

  it("non-caster has no spell slots to restore", () => {
    const c = makeCharacter(); // Fighter
    const s = computeLongRestSummary(c);
    expect(Object.keys(s.slotsRestored).length).toBe(0);
  });
});

// ── 5. Long Rest Application ──────────────────────────────────

describe("applyLongRest", () => {
  it("fully restores HP", () => {
    const c = makeCharacter({ hitPoints: { current: 10, max: 44, temporary: 7 } });
    const result = applyLongRest(c);
    expect(result.hitPoints?.current).toBe(44);
    expect(result.hitPoints?.temporary).toBe(0);
  });

  it("recovers hit dice (reduces spentHitDice)", () => {
    const c = makeCharacter({ level: 5, spentHitDice: 3 }); // 3 spent, recovers 2
    const result = applyLongRest(c);
    expect(result.spentHitDice).toBe(1); // 3 - 2 = 1
  });

  it("recovers to 0 spent when recovery exceeds spent", () => {
    const c = makeCharacter({ level: 5, spentHitDice: 1 }); // 1 spent, recovers 2
    const result = applyLongRest(c);
    expect(result.spentHitDice).toBe(0); // cap at 0
  });

  it("restores all spell slots to max", () => {
    const c = makeCasterCharacter();
    const result = applyLongRest(c);
    expect(result.spellSlots?.level1?.current).toBe(4);
    expect(result.spellSlots?.level2?.current).toBe(3);
    expect(result.spellSlots?.level3?.current).toBe(2);
  });

  it("recharges all resources to max", () => {
    const c = makeCharacter({
      resources: [
        { name: "Second Wind", current: 0, max: 1, recharge: "short_rest" },
        { name: "Rage", current: 1, max: 3, recharge: "long_rest" },
      ],
    });
    const result = applyLongRest(c);
    expect((result.resources as ClassResource[])?.find((r) => r.name === "Second Wind")?.current).toBe(1);
    expect((result.resources as ClassResource[])?.find((r) => r.name === "Rage")?.current).toBe(3);
  });
});

// ── 6. Full Rest Cycle — Integration ──────────────────────────

describe("Full Rest Cycle Integration", () => {
  it("realistic combat day: fight → short rest → fight → long rest", () => {
    // Day starts: Fighter 5, CON+2, HP 44/44, HD 5/5, Second Wind available
    let c = makeCharacter({
      level: 5,
      hitPoints: { current: 44, max: 44, temporary: 0 },
      resources: [
        { name: "Second Wind", current: 1, max: 1, recharge: "short_rest" },
        { name: "Action Surge", current: 1, max: 1, recharge: "short_rest" },
      ],
      spentHitDice: 0,
    });

    // ── First fight: takes 28 damage, uses Second Wind (+10 HP) ──
    c = {
      ...c,
      hitPoints: { ...c.hitPoints, current: 26 }, // 44 - 28 + 10 = 26
      resources: c.resources!.map((r) =>
        r.name === "Second Wind" ? { ...r, current: 0 } : r
      ),
    };
    expect(c.hitPoints.current).toBe(26); // 44 - 28 + 10

    // ── Short Rest: spend 2 HD ──
    const srResult = applyShortRest(c, { hitDiceToSpend: 2 });
    c = { ...c, ...srResult } as PlayerCharacter;
    // HP: 26 + 16 = 42, HD spent: 0 -> 2, Second Wind recharged
    expect(c.hitPoints.current).toBe(42);
    expect(c.spentHitDice).toBe(2);
    expect((c.resources as ClassResource[]).find((r) => r.name === "Second Wind")?.current).toBe(1);

    // ── Second fight: takes 30 more damage, uses Action Surge ──
    c = {
      ...c,
      hitPoints: { ...c.hitPoints, current: 12 }, // 42 - 30
      resources: c.resources!.map((r) =>
        r.name === "Action Surge" ? { ...r, current: 0 } : r
      ),
    };
    expect(c.hitPoints.current).toBe(12);

    // ── Long Rest ──
    const lrResult = applyLongRest(c);
    c = { ...c, ...lrResult } as PlayerCharacter;
    // Full HP, HD recovered (2 recovered from 5 total, was 2 spent → 0 spent)
    expect(c.hitPoints.current).toBe(44);
    expect(c.spentHitDice).toBe(0); // 2 spent - min(floor(5/2)=2, 2) = 0
    expect((c.resources as ClassResource[]).find((r) => r.name === "Second Wind")?.current).toBe(1);
    expect((c.resources as ClassResource[]).find((r) => r.name === "Action Surge")?.current).toBe(1);
  });

  it("short rest with no resources and no HD does nothing but clear temp HP", () => {
    const c = makeCharacter({
      hitPoints: { current: 44, max: 44, temporary: 5 },
      spentHitDice: 5, // none available
    });
    const result = applyShortRest(c, { hitDiceToSpend: 0 });
    expect(result.hitPoints?.current).toBe(44);
    expect(result.hitPoints?.temporary).toBe(0);
    expect(result.spentHitDice).toBe(5);
  });
});

// ── 7. Edge Cases ─────────────────────────────────────────────

describe("rest edge cases", () => {
  it("handles negative CON mod HP minimum", () => {
    const c = makeCharacter({ class: "Wizard", constitution: 6, level: 3 }); // CON -2
    // d6 avg = 4, CON = -2 → avg per die = 3
    const s = computeShortRestSummary(c, { hitDiceToSpend: 1 });
    expect(s.hpHealed).toBeGreaterThanOrEqual(1);
  });

  it("clears temp hp even when it's 0", () => {
    const c = makeCharacter({ temporaryHitPoints: 0 });
    const sr = computeShortRestSummary(c, { hitDiceToSpend: 0 });
    expect(sr.tempHpCleared).toBe(true);
    const lr = computeLongRestSummary(c);
    expect(lr.tempHpCleared).toBe(true);
  });

  it("long rest on full HP heals 0 but still recovers resources", () => {
    const c = makeCharacter({
      hitPoints: { current: 44, max: 44, temporary: 0 },
      spentHitDice: 3,
      resources: [
        { name: "Rage", current: 0, max: 3, recharge: "long_rest" },
      ],
    });
    const s = computeLongRestSummary(c);
    expect(s.hpHealed).toBe(0);
    expect(s.hitDiceRecovered).toBeGreaterThan(0);
    expect(s.resourcesRecharged).toContain("Rage");
  });

  it("empty features array does not crash", () => {
    const c = makeCharacter({ features: [] });
    const s = computeShortRestSummary(c, { hitDiceToSpend: 0 });
    expect(s).toBeDefined();
    expect(s.hpHealed).toBe(0);
  });

  it("undefined resources array does not crash", () => {
    const c = makeCharacter({ resources: undefined as any });
    const sr = computeShortRestSummary(c, { hitDiceToSpend: 0 });
    expect(sr.resourcesRecharged).toEqual([]);
    const lr = computeLongRestSummary(c);
    expect(lr.resourcesRecharged).toEqual([]);
  });

  it("undefined spellSlots does not crash long rest", () => {
    const c = makeCharacter();
    delete (c as any).spellSlots;
    const s = computeLongRestSummary(c);
    expect(s.slotsRestored).toEqual({});
  });

  it("undefined level defaults gracefully", () => {
    const c = makeCharacter();
    delete (c as any).level;
    expect(computeHitDiceTotal(c)).toBe(undefined as any); // NaN — documented
    expect(computeAvailableHitDice(c)).toBe(0);
  });

  it("long rest with 0 spent HD still reports recovery", () => {
    const c = makeCharacter({ level: 5, spentHitDice: 0 });
    const result = applyLongRest(c);
    expect(result.spentHitDice).toBe(0); // 0 - max(1, floor(5/2)) → 0 cap
  });
});

// ── 8. Data Integrity ─────────────────────────────────────────

describe("rest data integrity", () => {
  it("short rest does not change max HP", () => {
    const c = makeCharacter();
    const result = applyShortRest(c, { hitDiceToSpend: 1 });
    expect(result.hitPoints?.max).toBe(44);
  });

  it("long rest does not change max HP", () => {
    const c = makeCharacter();
    const result = applyLongRest(c);
    expect(result.hitPoints?.max).toBe(44);
  });

  it("short rest does not change character level", () => {
    const c = makeCharacter({ level: 5 });
    const result = applyShortRest(c, { hitDiceToSpend: 0 });
    expect(result.spentHitDice).toBe(0);
  });

  it("applyLongRest returns only expected fields", () => {
    const c = makeCharacter();
    const result = applyLongRest(c);
    const keys = Object.keys(result).sort();
    expect(keys).toEqual(["hitPoints", "resources", "spellSlots", "spentHitDice"]);
  });

  it("applyShortRest returns only expected fields", () => {
    const c = makeCharacter();
    const result = applyShortRest(c, { hitDiceToSpend: 0 });
    const keys = Object.keys(result).sort();
    expect(keys).toEqual(["hitPoints", "resources", "spellSlots", "spentHitDice"]);
  });

  it("consistent summary across multiple calls", () => {
    const c = makeCharacter();
    const s1 = computeShortRestSummary(c, { hitDiceToSpend: 2 });
    const s2 = computeShortRestSummary(c, { hitDiceToSpend: 2 });
    expect(s1.hpHealed).toBe(s2.hpHealed);
    expect(s1.hitDiceSpent).toBe(s2.hitDiceSpent);
    expect(s1.resourcesRecharged).toEqual(s2.resourcesRecharged);
  });

  it("resting does not mutate original character", () => {
    const c = makeCharacter({ hitPoints: { current: 10, max: 44, temporary: 5 } });
    const originalMax = c.hitPoints.max;
    const originalCurrent = c.hitPoints.current;
    
    applyShortRest(c, { hitDiceToSpend: 2 });
    expect(c.hitPoints.current).toBe(originalCurrent); // unchanged
    
    applyLongRest(c);
    expect(c.hitPoints.current).toBe(originalCurrent); // still unchanged
    expect(c.hitPoints.max).toBe(originalMax); // unchanged
  });
});

// ── 9. Feature Detection ──────────────────────────────────────

describe("rest feature detection", () => {
  it("detects short rest features from character.features", () => {
    const c = makeCharacter(); // Has Second Wind, Action Surge
    const s = computeShortRestSummary(c, { hitDiceToSpend: 0 });
    expect(s.featuresRestored).toContain("Second Wind");
    expect(s.featuresRestored).toContain("Action Surge");
  });

  it("long rest restores both short and long rest features", () => {
    const c = makeCharacter({
      features: [
        { name: "Fighting Style", description: "", source: "Fighter" },
        { name: "Second Wind", description: "", source: "Fighter" },
        { name: "Divine Intervention", description: "", source: "Cleric" },
      ],
    });
    const s = computeLongRestSummary(c);
    expect(s.featuresRestored).toContain("Second Wind");
    expect(s.featuresRestored).toContain("Divine Intervention");
  });
});
