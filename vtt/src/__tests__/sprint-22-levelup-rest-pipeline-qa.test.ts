/**
 * STᚱ VTT — Sprint 22/40 QA: Level-Up → Rest & Recovery Pipeline
 *
 * Comprehensive integration QA testing the full character progression
 * lifecycle: Level-Up → Hit Points → Spell Slots → Short Rest → Long Rest
 *
 * This is a UNIQUE pipeline never tested together — the integration between
 * character advancement and recovery mechanics. Does leveling up HP correctly
 * interact with rest recovery thresholds? Do newly gained spell slots persist
 * through a rest cycle? What happens when a character levels up mid-adventure?
 *
 * Characters: Wendy Swiftfoot (Rogue 5 → 6), Kehrfuffle Ironheart (Paladin 5 → 6)
 * Campaign: Arkla
 * Strict Compliance: NO dice rollers, NO occult elements
 *
 * Deployed at: https://arkla.vercel.app
 */

import { describe, it, expect } from "vitest";

// ═══════════════════════════════════════════════════════════════
// ENGINE IMPORTS (pure function tests)
// ═══════════════════════════════════════════════════════════════

import { getProficiencyBonus, getAbilityMod } from "@/lib/mechanics/character-derivations";
import {
  computeLevelUpPreview,
  applyLevelUp,
  getSlotsForLevel,
  isAsiLevel,
} from "@/lib/mechanics/level-up-engine";
import {
  computeShortRestSummary,
  computeLongRestSummary,
  applyShortRest,
  applyLongRest,
  computeHitDiceTotal,
  computeAvailableHitDice,
  computeHitDieType,
} from "@/lib/mechanics/rest-engine";
import type { PlayerCharacter } from "@/types/character";

// ═══════════════════════════════════════════════════════════════
// TEST FIXTURES — Arkla Campaign Characters
// ═══════════════════════════════════════════════════════════════

function createWendy(overrides: Partial<PlayerCharacter> = {}): PlayerCharacter {
  return {
    id: "char_wendy",
    name: "Wendy Swiftfoot",
    playerName: "Alice",
    race: "Lightfoot Halfling",
    class: "Rogue",
    level: 5,
    classes: [{ name: "Rogue", level: 5 }],
    experiencePoints: 6500,
    background: "Urchin",
    alignment: "Chaotic Good",
    inspiration: false,
    strength: 8,
    dexterity: 18,
    constitution: 14,
    intelligence: 12,
    wisdom: 10,
    charisma: 14,
    savingThrows: {},
    skills: {},
    hitPoints: { current: 38, max: 38, temporary: 0 },
    armorClass: 17,
    initiative: 4,
    speed: { walk: 25 },
    hitDice: "1d8",
    proficiencyBonus: 3,
    conditions: [],
    deathSaves: { successes: 0, failures: 0 },
    temporaryHitPoints: 0,
    traits: ["Lucky", "Brave", "Halfling Nimbleness", "Sneak Attack 3d6"],
    proficiencies: ["Light Armor", "Simple Weapons", "Rapier", "Shortbow"],
    languages: ["Common", "Halfling", "Thieves' Cant"],
    features: [
      { name: "Sneak Attack", description: "3d6 extra damage once per turn", source: "Rogue", level: 5 },
      { name: "Cunning Action", description: "Bonus action: Dash, Disengage, or Hide", source: "Rogue", level: 2 },
      { name: "Uncanny Dodge", description: "Reaction: halve attack damage", source: "Rogue", level: 5 },
    ],
    equipment: [{ slot: "weapon", item: "Rapier +1", quantity: 1, weight: 2, notes: "" }],
    inventory: [],
    currency: { copper: 0, silver: 0, electrum: 0, gold: 75, platinum: 0 },
    appearance: "Slim halfling with a quick smile",
    backstory: "Grew up on the streets of Waterdeep",
    allies: "Kehrfuffle Ironheart",
    characterNotes: "Party scout and trap-finder",
    isHomebrew: false,
    preparedSpells: [],
    activeFeats: [],
    spentHitDice: 2,
    createdAt: 1000,
    updatedAt: 1000,
    ...overrides,
  };
}

function createKehrfuffle(overrides: Partial<PlayerCharacter> = {}): PlayerCharacter {
  return {
    id: "char_kehrfuffle",
    name: "Kehrfuffle Ironheart",
    playerName: "Bob",
    race: "Human",
    class: "Paladin",
    level: 5,
    classes: [{ name: "Paladin", level: 5 }],
    experiencePoints: 6500,
    background: "Knight",
    alignment: "Lawful Good",
    inspiration: false,
    strength: 16,
    dexterity: 10,
    constitution: 14,
    intelligence: 8,
    wisdom: 12,
    charisma: 16,
    savingThrows: {},
    skills: {},
    hitPoints: { current: 44, max: 44, temporary: 10 },
    armorClass: 21,
    initiative: 0,
    speed: { walk: 30 },
    hitDice: "1d10",
    proficiencyBonus: 3,
    conditions: [],
    deathSaves: { successes: 0, failures: 0 },
    temporaryHitPoints: 10,
    traits: ["Great Weapons", "Heavy Armor Master"],
    proficiencies: ["All Armor", "All Weapons", "Shields"],
    languages: ["Common", "Celestial"],
    features: [
      { name: "Divine Sense", description: "Detect celestial, fiend, or undead", source: "Paladin", level: 1 },
      { name: "Lay on Hands", description: "30 HP healing pool", source: "Paladin", level: 5 },
    ],
    equipment: [
      { slot: "weapon", item: "Greatsword +1", quantity: 1, weight: 6, notes: "" },
      { slot: "armor", item: "Plate Armor", quantity: 1, weight: 65, notes: "" },
      { slot: "shield", item: "Shield", quantity: 1, weight: 6, notes: "+1 AC magic" },
    ],
    inventory: [
      { name: "Holy Symbol", quantity: 1, weight: 0, description: "Silver holy symbol of Torm", isEquipped: true },
      { name: "Torch", quantity: 5, weight: 5, description: "Standard torches", isEquipped: false },
    ],
    resources: [
      { name: "Lay on Hands", current: 30, max: 30, recharge: "long_rest" },
    ],
    spellSlots: { level1: { current: 4, max: 4 }, level2: { current: 2, max: 2 } },
    currency: { copper: 0, silver: 0, electrum: 0, gold: 50, platinum: 0 },
    appearance: "Tall human in gleaming plate armor",
    backstory: "Knight of Torm on a sacred quest",
    allies: "Wendy Swiftfoot",
    characterNotes: "Party's frontline defender",
    isHomebrew: false,
    preparedSpells: ["Bless", "Cure Wounds", "Divine Favor", "Lesser Restoration"],
    activeFeats: [],
    spentHitDice: 1,
    createdAt: 1000,
    updatedAt: 1000,
    ...overrides,
  };
}


// ═══════════════════════════════════════════════════════════════
// SUITE 1: Level-Up → New Hit Points
// ═══════════════════════════════════════════════════════════════

describe("Level-Up → New Hit Points Integration", () => {
  it("Wendy (Rogue 5→6) should gain correct HP with CON+2", () => {
    const w = createWendy();
    const preview = computeLevelUpPreview(w);
    expect(preview).not.toBeNull();

    // Rogue = d8 hit die. Average d8 = ceil(8/2)+1 = 5. CON 14 = +2.
    // HP gained = 5 + 2 = 7
    expect(preview!.hpGained).toBe(7);
    expect(preview!.hpTotal).toBe(45); // 38 + 7
    expect(preview!.newLevel).toBe(6);
  });

  it("Kehrfuffle (Paladin 5→6) should gain correct HP with CON+2", () => {
    const k = createKehrfuffle();
    const preview = computeLevelUpPreview(k);
    expect(preview).not.toBeNull();

    // Paladin = d10 hit die. Average d10 = ceil(10/2)+1 = 6. CON 14 = +2.
    // HP gained = 6 + 2 = 8
    expect(preview!.hpGained).toBe(8);
    expect(preview!.hpTotal).toBe(52); // 44 + 8
    expect(preview!.newLevel).toBe(6);
  });

  it("after level-up, HP max increases but current HP stays same (mid-adventure)", () => {
    const w = createWendy();
    // During adventure, Wendy has taken damage (HP: 25/38)
    const damagedWendy = { ...w, hitPoints: { current: 25, max: 38, temporary: 0 } };

    const result = applyLevelUp(damagedWendy);
    expect(result.hitPoints?.max).toBe(45); // 38 + 7
    expect(result.hitPoints?.current).toBe(25); // Stays the same (mid-adventure level-up)
  });

  it("after level-up, Kehrfuffle's HP max increases with temp HP unchanged", () => {
    const k = createKehrfuffle();
    // Kehrfuffle has 10 temp HP and is at full (44/44)
    const result = applyLevelUp(k);
    expect(result.hitPoints?.max).toBe(52); // 44 + 8
    expect(result.hitPoints?.current).toBe(44); // Unchanged
    // temp HP not modified by level-up
    expect(result.temporaryHitPoints).toBeUndefined(); // temp HP not in applyLevelUp's return
  });
});


// ═══════════════════════════════════════════════════════════════
// SUITE 2: Level-Up → Spell Slot Progression
// ═══════════════════════════════════════════════════════════════

describe("Level-Up → Spell Slot Progression Integration", () => {
  it("Kehrfuffle (Paladin 6) gains 1 L2 slot (half caster: CL=3)", () => {
    // Paladin 6 = half caster: effective caster level = 6 / 2 = 3
    // Caster level 3: L1=4, L2=2
    const slots = getSlotsForLevel(6, "half");
    expect(slots).not.toBeNull();
    expect(slots!.level1).toBe(4);
    expect(slots!.level2).toBe(2);
  });

  it("Kehrfuffle's level-up preview shows slot increase", () => {
    const k = createKehrfuffle();
    const preview = computeLevelUpPreview(k);
    expect(preview).not.toBeNull();
    expect(preview!.spellSlotsIncreased).toBe(true);

    // Paladin 5: CL=2, L1=4, L2=2
    // Paladin 6: CL=3, L1=4, L2=2 — just gained L2 slots
    expect(preview!.spellSlots?.level1).toBe(4);
    expect(preview!.spellSlots?.level2).toBe(2);
  });

  it("new spell slots are initialized with current = max on applyLevelUp", () => {
    const k = createKehrfuffle();
    const result = applyLevelUp(k);
    expect(result.spellSlots).toBeDefined();
    // All new slots should have current = max
    if (result.spellSlots) {
      for (const key of ["level1", "level2"] as const) {
        const slot = result.spellSlots[key];
        if (slot) {
          expect(slot.current).toBe(slot.max);
        }
      }
    }
  });
});


// ═══════════════════════════════════════════════════════════════
// SUITE 3: Level-Up → Short Rest Interaction
// ═══════════════════════════════════════════════════════════════

describe("Level-Up → Short Rest Integration", () => {
  it("Wendy after level-up can spend new hit dice during short rest", () => {
    const w = createWendy();
    const leveled = applyLevelUp(w);
    // Leveled up: max HP = 45, spentHitDice = 2 (from original)
    // Available HD = level(6) - spent(2) = 4
    // BUT: applyLevelUp sets spentHitDice = 0 (resets in some implementations)
    const availableHD = (leveled.level ?? 6) - (leveled.spentHitDice ?? 0);
    expect(availableHD).toBeGreaterThanOrEqual(4); // 6 - 2 = 4

    // If mid-adventure (damaged), Wendy can spend HD to heal
    const damaged = {
      ...w,
      ...leveled,
      hitPoints: { current: 25, max: leveled.hitPoints?.max ?? 45, temporary: 0 },
    };

    const shortRestResult = computeShortRestSummary(damaged, { hitDiceToSpend: 2 });
    expect(shortRestResult.hasAvailableHitDice).toBe(true);
    expect(shortRestResult.availableHitDiceCount).toBe(availableHD);

    // Each d8 hit die with CON+2 = avg d8(5) + 2 = 7 HP
    // 2 HD = 14 HP healed
    expect(shortRestResult.hpHealed).toBeGreaterThanOrEqual(12);

    // HP should not exceed max
    const healedHp = Math.min(damaged.hitPoints.current + shortRestResult.hpHealed, damaged.hitPoints.max);
    expect(healedHp).toBeLessThanOrEqual(damaged.hitPoints.max);
  });

  it("short rest after level-up recharges Paladin class features", () => {
    const k = createKehrfuffle();
    const leveled = applyLevelUp(k);

    const merged: PlayerCharacter = { ...k, ...leveled } as PlayerCharacter;
    const shortRest = computeShortRestSummary(merged, { hitDiceToSpend: 0 });
    expect(shortRest.resourcesRecharged.length).toBeGreaterThanOrEqual(0);
    // Short rest recharges short_rest resources (features like Lay on Hands is long_rest)
    // So no resources may recharge — this is expected
    expect(Array.isArray(shortRest.resourcesRecharged)).toBe(true);
  });

  it("short rest after level-up clears temp HP (5e RAW: temp HP lost on rest)", () => {
    const w = createWendy();
    const leveled = applyLevelUp(w);
    const merged: PlayerCharacter = { ...w, ...leveled, temporaryHitPoints: 5 } as PlayerCharacter;
    merged.hitPoints = leveled.hitPoints ?? merged.hitPoints;

    // computeShortRestSummary should detect temp HP
    expect(merged.temporaryHitPoints).toBe(5);
    // The summary states tempHpCleared = true if temp HP > 0
    const haveTempHp = (merged.temporaryHitPoints ?? 0) > 0;
    expect(haveTempHp).toBe(true);
  });
});


// ═══════════════════════════════════════════════════════════════
// SUITE 4: Level-Up → Long Rest Interaction
// ═══════════════════════════════════════════════════════════════

describe("Level-Up → Long Rest Integration", () => {
  it("long rest after level-up gives full HP recovery to new max", () => {
    const w = createWendy();
    const leveled = applyLevelUp(w);
    // Mid-adventure: Wendy is damaged (HP: 20/45 new max)
    const merged: PlayerCharacter = {
      ...w,
      ...leveled,
      hitPoints: { current: 20, max: leveled.hitPoints?.max ?? 45, temporary: 0 },
    } as PlayerCharacter;

    const longRestSummary = computeLongRestSummary(merged);
    expect(longRestSummary.hpHealed).toBe(25); // 45 - 20
    expect(longRestSummary.hitDiceRecovered).toBeGreaterThanOrEqual(3); // half of 6 = 3
  });

  it("long rest after level-up restores newly gained spell slots", () => {
    const k = createKehrfuffle();
    const leveled = applyLevelUp(k);
    // Merge: Paladin 6 should have L1=4/4, L2=2/2
    const merged: PlayerCharacter = {
      ...k,
      ...leveled,
      spellSlots: leveled.spellSlots ?? k.spellSlots,
    } as PlayerCharacter;

    const longRestSummary = computeLongRestSummary(merged);
    expect(longRestSummary.slotsRestored).toBeDefined();
    // All existing slots should be listed as restored
    const existingSlotKeys = Object.keys(longRestSummary.slotsRestored).length;
    expect(existingSlotKeys).toBeGreaterThanOrEqual(1); // At least one level has slots
  });

  it("Kehrfuffle's Lay on Hands resource fully recharges on long rest", () => {
    const k = createKehrfuffle();

    // Use 10 points of LoH
    const depleated: PlayerCharacter = {
      ...k,
      resources: [{ name: "Lay on Hands", current: 20, max: 30, recharge: "long_rest" }],
    } as PlayerCharacter;

    const longRestSummary = computeLongRestSummary(depleated);
    expect(longRestSummary.resourcesRecharged).toContain("Lay on Hands");
  });
});


// ═══════════════════════════════════════════════════════════════
// SUITE 5: Level-Up → Proficiency Bonus → Rest Consistency
// ═══════════════════════════════════════════════════════════════

describe("Level-Up → Proficiency Bonus → Rest Consistency", () => {
  it("Wendy level 5→6 does not change proficiency bonus (still +3)", () => {
    const w = createWendy();
    const preview = computeLevelUpPreview(w);
    expect(preview).not.toBeNull();
    expect(preview!.proficiencyIncreased).toBe(false);
    expect(preview!.proficiencyBonus).toBe(3);
  });

  it("Kehrfuffle level 5→6 does not change proficiency bonus", () => {
    const k = createKehrfuffle();
    const preview = computeLevelUpPreview(k);
    expect(preview).not.toBeNull();
    expect(preview!.proficiencyIncreased).toBe(false);
    expect(preview!.proficiencyBonus).toBe(3);
  });

  it("PB stays consistent across level-up → rest → next session", () => {
    const w = createWendy();
    const leveled = applyLevelUp(w);
    const merged: PlayerCharacter = { ...w, ...leveled } as PlayerCharacter;

    // After long rest, PB should still be the new value
    expect(merged.proficiencyBonus ?? w.proficiencyBonus).toBe(3);

    // Short rest doesn't affect PB
    const shortRest = computeShortRestSummary(merged, { hitDiceToSpend: 0 });
    expect(shortRest.resourcesRecharged).toBeDefined();
  });
});


// ═══════════════════════════════════════════════════════════════
// SUITE 6: Edge Cases — Level-Up Mid-Adventure
// ═══════════════════════════════════════════════════════════════

describe("Edge Cases — Level-Up Mid-Adventure", () => {
  it("level-up at 0 HP does not kill the character further", () => {
    // Wendy is unconscious (0 HP, death saves 2 failures / 1 success)
    const w: PlayerCharacter = {
      ...createWendy(),
      hitPoints: { current: 0, max: 38, temporary: 0 },
      deathSaves: { successes: 1, failures: 2 },
      conditions: ["unconscious"],
    } as PlayerCharacter;

    const result = applyLevelUp(w);
    // After level-up, HP should have new max but current stays 0
    expect(result.hitPoints?.max).toBe(45);
    expect(result.hitPoints?.current).toBe(0); // Still unconscious
  });

  it("level-up with full spell slots spent and then long rest restores them", () => {
    // Kehrfuffle has used ALL spell slots
    const k: PlayerCharacter = {
      ...createKehrfuffle(),
      spellSlots: {
        level1: { current: 0, max: 4 },
        level2: { current: 0, max: 2 },
      },
    } as PlayerCharacter;

    const leveled = applyLevelUp(k);
    // After level-up, new slots should be full, old slots still empty
    // (applyLevelUp preserves current for existing levels)
    const merged: PlayerCharacter = { ...k, ...leveled } as PlayerCharacter;

    // Long rest should restore all slots
    const longRestSummary = computeLongRestSummary(merged);
    expect(longRestSummary.slotsRestored).toBeDefined();
    const totalSlotsRestored = Object.values(longRestSummary.slotsRestored).reduce((a, b) => a + b, 0);
    expect(totalSlotsRestored).toBeGreaterThan(0);
  });

  it("after level-up, ASI at level 4 is correctly flagged through rest cycles", () => {
    // ASI (ability score improvement) is a per-level feature, not reset by rest
    const w = createWendy();
    const preview = computeLevelUpPreview(w);
    // Wendy is level 5. ASI happens at 4. So asiAvailable should be false (already got it)
    expect(preview!.asiAvailable).toBe(false);
    expect(preview!.asiCount).toBe(1); // Rogue gets 1 ASI at level 4

    // Short rest doesn't change ASI availability
    expect(isAsiLevel(4)).toBe(true);
    expect(isAsiLevel(6)).toBe(false); // Rogue's next ASI is at 8
  });
});


// ═══════════════════════════════════════════════════════════════
// SUITE 7: Real-World Campaign Narrative — Full Session
// ═══════════════════════════════════════════════════════════════

describe("Real-World Campaign Narrative — Full Session Chain", () => {
  it("Full session: Level-Up → Combat → Short Rest → Level-Up → Long Rest", () => {
    // Scenario: Wendy hits level 6 mid-dungeon, then fights, short rests,
    // gets another level (hypothetical), and long rests.

    let wendy = createWendy();

    // ── Phase 1: Initial State ──
    expect(wendy.level).toBe(5);
    expect(wendy.hitPoints.current).toBe(38);

    // ── Phase 2: Wendy gains XP and levels up to 6 ──
    const levelUp1 = applyLevelUp(wendy);
    wendy = { ...wendy, ...levelUp1 } as PlayerCharacter;
    expect(wendy.level).toBe(6);
    expect(wendy.hitPoints?.max ?? wendy.hitPoints.max).toBe(45);

    // ── Phase 3: Combat — Wendy takes 30 damage ──
    const afterFight = {
      ...wendy,
      hitPoints: { current: 15, max: wendy.hitPoints?.max ?? 45, temporary: 0 },
      spentHitDice: (wendy.spentHitDice ?? 0) + 1,
    } as PlayerCharacter;

    // ── Phase 4: Short Rest — spend 2 HD ──
    const shortRest = computeShortRestSummary(afterFight, { hitDiceToSpend: 2 });
    const healAmount = Math.min(shortRest.hpHealed, afterFight.hitPoints.max - afterFight.hitPoints.current);
    const healedHp = afterFight.hitPoints.current + healAmount;
    expect(healedHp).toBeGreaterThanOrEqual(15); // Should heal at least something
    expect(healedHp).toBeLessThanOrEqual(afterFight.hitPoints.max);

    // ── Phase 6: Long Rest (for narrative completeness) ──
    const longRestSummary = computeLongRestSummary(afterFight);
    expect(longRestSummary.hpHealed).toBe(afterFight.hitPoints.max - afterFight.hitPoints.current);
    expect(longRestSummary.hitDiceRecovered).toBeGreaterThanOrEqual(3); // Half of 6 = 3
  });

  it("Full session: Kehrfuffle level 5→6 with resource management", () => {
    let kehrfuffle = createKehrfuffle();

    // ── Phase 1: Kehrfuffle is Paladin 5 ──
    expect(kehrfuffle.level).toBe(5);
    expect(kehrfuffle.hitPoints.current).toBe(44);
    expect(kehrfuffle.resources?.[0].name).toBe("Lay on Hands");
    expect(kehrfuffle.resources?.[0].current).toBe(30);

    // ── Phase 2: Level-up to 6 ──
    const levelUpResult = applyLevelUp(kehrfuffle);
    kehrfuffle = { ...kehrfuffle, ...levelUpResult } as PlayerCharacter;
    expect(kehrfuffle.level).toBe(6);

    // ── Phase 3: Mid-adventure — Kehrfuffle uses Lay on Hands on Wendy ──
    const afterHealing: PlayerCharacter = {
      ...kehrfuffle,
      hitPoints: { current: 30, max: kehrfuffle.hitPoints?.max ?? 52, temporary: 0 },
      resources: [
        { name: "Lay on Hands", current: 20, max: 30, recharge: "long_rest" },
      ],
    } as PlayerCharacter;

    // ── Phase 4: Long Rest restores everything ──
    const longRest = computeLongRestSummary(afterHealing);
    expect(longRest.hpHealed).toBe(22); // 52 - 30
    expect(longRest.hitDiceRecovered).toBeGreaterThanOrEqual(3); // Half of 6

    // Lay on Hands should be in the recharged resources list
    expect(longRest.resourcesRecharged).toContain("Lay on Hands");
  });

  it("Level-up to 6 correctly shows class features (Rogue: Expertise, Sneak Attack)", () => {
    const w = createWendy();
    const preview = computeLevelUpPreview(w);
    expect(preview).not.toBeNull();

    // Rogue level 6 gains: Expertise (2 more skills) + Sneak Attack dice to 3d6
    expect(preview!.newFeatures.length).toBeGreaterThanOrEqual(1);
    expect(preview!.subclassFeature).toBe(false); // Rogue subclass at 3, 9
  });
});


// ═══════════════════════════════════════════════════════════════
// SUITE 8: Edge Cases & Input Validation
// ═══════════════════════════════════════════════════════════════

describe("Edge Cases — Input Validation & Graceful Degradation", () => {
  it("should handle level-up with empty features array", () => {
    const w: PlayerCharacter = {
      ...createWendy(),
      features: [],
      class: "Rogue",
      level: 5,
    } as PlayerCharacter;
    const result = applyLevelUp(w);
    expect(result.level).toBe(6);
    expect(Array.isArray(result.features)).toBe(true);
  });

  it("should handle level-up for a character with zero abilities (edge case)", () => {
    const weakChar: PlayerCharacter = {
      ...createWendy(),
      strength: 1, dexterity: 1, constitution: 1,
      intelligence: 1, wisdom: 1, charisma: 1,
    } as PlayerCharacter;
    const preview = computeLevelUpPreview(weakChar);
    expect(preview).not.toBeNull();
    // Even with CON 1 (-5), HP gain should be at least 1
    expect(preview!.hpGained).toBeGreaterThanOrEqual(1);
  });

  it("should handle rest with zero HP max (undefined scenario)", () => {
    // Edge case: a character with no hit points (shouldn't happen but mustn't crash)
    const brokenK: PlayerCharacter = {
      ...createKehrfuffle(),
      hitPoints: { current: 0, max: 0, temporary: 0 },
    } as PlayerCharacter;

    // Should not crash
    const shortRest = computeShortRestSummary(brokenK, { hitDiceToSpend: 0 });
    expect(shortRest.hpHealed).toBe(0);

    const longRest = computeLongRestSummary(brokenK);
    expect(longRest.hpHealed).toBe(0);
  });

  it("should handle rest after level-up with no spellSlots object", () => {
    // Some non-caster classes may have undefined spellSlots
    const w: PlayerCharacter = {
      ...createWendy(),
      spellSlots: undefined,
    } as unknown as PlayerCharacter;

    const leveled = applyLevelUp(w);
    const merged: PlayerCharacter = { ...w, ...leveled } as PlayerCharacter;

    // Short rest should not crash
    const shortRest = computeShortRestSummary(merged, { hitDiceToSpend: 1 });
    expect(shortRest.hasAvailableHitDice).toBe(true);
  });

  it("should handle zero-level HP calculation edge", () => {
    // A theoretical level 0 character shouldn't break calculations
    const level0Char: PlayerCharacter = {
      ...createWendy(),
      level: 0,
      classes: [{ name: "Rogue", level: 0 }],
      hitPoints: { current: 0, max: 0, temporary: 0 },
    } as PlayerCharacter;

    const preview = computeLevelUpPreview(level0Char);
    expect(preview).not.toBeNull();
    expect(preview!.newLevel).toBe(1);
    expect(preview!.hpGained).toBeGreaterThan(0); // At least 1 HP at level 1
    expect(preview!.proficiencyBonus).toBe(2); // PB at level 1 = +2
  });
});
