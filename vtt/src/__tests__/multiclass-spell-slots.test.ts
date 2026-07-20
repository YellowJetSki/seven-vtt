/**
 * STᚱ VTT — Multi-Class Spell Slot Engine Tests
 *
 * Comprehensive validation of PHB 164 multi-class spellcasting rules,
 * Warlock Pact Magic, and single-class fallback behavior.
 *
 * Strict Compliance: NO dice rollers, NO occult elements.
 * Arkla campaign setting only (Wendy, Kehrfuffle).
 */

import { describe, it, expect } from "vitest";
import {
  getContributionType,
  computeEffectiveLevels,
  computeEffectiveLevelsForType,
  computeEffectiveCasterLevel,
  buildClassEntries,
  computePactMagicSlots,
  buildMulticlassSlots,
  determineSpellcastingAbility,
  computeMulticlassSpellcasting,
  castSpellFromMulticlassPool,
  restorePactMagicSlots,
  restoreAllMulticlassSlots,
  getCasterLevelBreakdown,
  type ExtendedCasterType,
} from "@/lib/mechanics/multiclass-spell-slots";
import { getCasterType, getMaxSlots } from "@/types";

// ── Standard ability scores for Wendy (Rogue 5) and Kehrfuffle (Paladin 5) ──

const WENDY_ABILITIES = {
  strength: 8,
  dexterity: 17,
  constitution: 14,
  intelligence: 12,
  wisdom: 10,
  charisma: 14,
};

const KEHRFUFFLE_ABILITIES = {
  strength: 18,
  dexterity: 10,
  constitution: 16,
  intelligence: 8,
  wisdom: 12,
  charisma: 16,
};

// ═══════════════════════════════════════════════════════════════
// CONTRIBUTION TYPE DETECTION
// ═══════════════════════════════════════════════════════════════

describe("getContributionType — PHB 164 classification", () => {
  it("should classify full casters correctly", () => {
    expect(getContributionType("Wizard")).toBe("full");
    expect(getContributionType("Cleric")).toBe("full");
    expect(getContributionType("Druid")).toBe("full");
    expect(getContributionType("Sorcerer")).toBe("full");
    expect(getContributionType("Bard")).toBe("full");
  });

  it("should classify half casters correctly", () => {
    expect(getContributionType("Paladin")).toBe("half");
    expect(getContributionType("Ranger")).toBe("half");
    expect(getContributionType("Artificer")).toBe("half");
  });

  it("should classify third casters correctly", () => {
    expect(getContributionType("Eldritch Knight")).toBe("third");
    expect(getContributionType("Arcane Trickster")).toBe("third");
  });

  it("should classify Warlock as pact magic", () => {
    expect(getContributionType("Warlock")).toBe("pact");
  });

  it("should classify non-casters as none", () => {
    expect(getContributionType("Fighter")).toBe("none");
    expect(getContributionType("Barbarian")).toBe("none");
    expect(getContributionType("Monk")).toBe("none");
    expect(getContributionType("Rogue")).toBe("none");
  });

  it("should be case-insensitive", () => {
    expect(getContributionType("wizard")).toBe("full");
    expect(getContributionType("WARLOCK")).toBe("pact");
    expect(getContributionType("PaLaDiN")).toBe("half");
  });
});


// ═══════════════════════════════════════════════════════════════
// EFFECTIVE LEVEL COMPUTATION
// ═══════════════════════════════════════════════════════════════

describe("computeEffectiveLevels — PHB 164 rounding rules", () => {
  it("full casters contribute 1:1", () => {
    expect(computeEffectiveLevels("Wizard", 1)).toBe(1);
    expect(computeEffectiveLevels("Wizard", 5)).toBe(5);
    expect(computeEffectiveLevels("Wizard", 20)).toBe(20);
  });

  it("half casters contribute 1:2 (round down)", () => {
    expect(computeEffectiveLevels("Paladin", 1)).toBe(0); // floor(1/2)
    expect(computeEffectiveLevels("Paladin", 2)).toBe(1); // floor(2/2)
    expect(computeEffectiveLevels("Paladin", 5)).toBe(2); // floor(5/2)
    expect(computeEffectiveLevels("Paladin", 20)).toBe(10); // floor(20/2)
  });

  it("third casters contribute 1:3 (round down, minimum subclass level 3)", () => {
    expect(computeEffectiveLevels("Eldritch Knight", 1)).toBe(0); // floor(0/3)
    expect(computeEffectiveLevels("Eldritch Knight", 3)).toBe(0); // floor(1/3) — Lv3 unlocks subclass
    expect(computeEffectiveLevels("Eldritch Knight", 5)).toBe(1); // floor(3/3)
    expect(computeEffectiveLevels("Eldritch Knight", 6)).toBe(1); // floor(4/3)
    expect(computeEffectiveLevels("Eldritch Knight", 7)).toBe(1); // floor(5/3)
    expect(computeEffectiveLevels("Eldritch Knight", 8)).toBe(2); // floor(6/3)
    expect(computeEffectiveLevels("Eldritch Knight", 20)).toBe(6); // floor(18/3)
  });

  it("Warlock contributes 0 to pool", () => {
    expect(computeEffectiveLevels("Warlock", 1)).toBe(0);
    expect(computeEffectiveLevels("Warlock", 20)).toBe(0);
  });

  it("non-casters contribute 0", () => {
    expect(computeEffectiveLevels("Fighter", 1)).toBe(0);
    expect(computeEffectiveLevels("Barbarian", 20)).toBe(0);
  });

  it("level 0 contributes 0", () => {
    expect(computeEffectiveLevels("Wizard", 0)).toBe(0);
    expect(computeEffectiveLevels("Paladin", 0)).toBe(0);
  });
});


// ═══════════════════════════════════════════════════════════════
// EFFECTIVE CASTER LEVEL
// ═══════════════════════════════════════════════════════════════

describe("computeEffectiveCasterLevel — PHB 164 consolidation", () => {
  it("single full caster = class level", () => {
    const entries = buildClassEntries([{ name: "Wizard", level: 5 }]);
    expect(computeEffectiveCasterLevel(entries)).toBe(5);
  });

  it("single half caster = floor(level/2)", () => {
    const entries = buildClassEntries([{ name: "Paladin", level: 6 }]);
    expect(computeEffectiveCasterLevel(entries)).toBe(3);
  });

  it("Wizard 3 + Paladin 2 = 4 effective (3 + 1)", () => {
    const entries = buildClassEntries([
      { name: "Wizard", level: 3 },
      { name: "Paladin", level: 2 },
    ]);
    expect(computeEffectiveCasterLevel(entries)).toBe(4);
  });

  it("Cleric 5 + Druid 3 = 8 effective (5 + 3)", () => {
    const entries = buildClassEntries([
      { name: "Cleric", level: 5 },
      { name: "Druid", level: 3 },
    ]);
    expect(computeEffectiveCasterLevel(entries)).toBe(8);
  });

  it("Warlock levels do NOT contribute to pool", () => {
    const entries = buildClassEntries([
      { name: "Warlock", level: 5 },
      { name: "Wizard", level: 3 },
    ]);
    // Wizard 3 contributes 3, Warlock contributes 0
    expect(computeEffectiveCasterLevel(entries)).toBe(3);
  });

  it("Fighter 5 contributes 0", () => {
    const entries = buildClassEntries([{ name: "Fighter", level: 5 }]);
    expect(computeEffectiveCasterLevel(entries)).toBe(0);
  });

  it("effective level capped at 20", () => {
    const entries = buildClassEntries([{ name: "Wizard", level: 30 }]); // shouldn't happen but defensive
    expect(computeEffectiveCasterLevel(entries)).toBe(20);
  });

  it("empty class list = 0", () => {
    expect(computeEffectiveCasterLevel([])).toBe(0);
  });
});


// ═══════════════════════════════════════════════════════════════
// PACT MAGIC (WARLOCK)
// ═══════════════════════════════════════════════════════════════

describe("computePactMagicSlots — Warlock slot progression", () => {
  it("Warlock 1 = 1x Lv1 slot", () => {
    const slots = computePactMagicSlots(1);
    expect(slots.hasPactMagic).toBe(true);
    expect(slots.slotLevel).toBe(1);
    expect(slots.max).toBe(1);
    expect(slots.current).toBe(1);
  });

  it("Warlock 2-10 = 2x slots", () => {
    const slots = computePactMagicSlots(2);
    expect(slots.max).toBe(2);

    const slots9 = computePactMagicSlots(9);
    expect(slots9.max).toBe(2);
    expect(slots9.slotLevel).toBe(5); // Lv9 = 5th level slots
  });

  it("Warlock 11-16 = 3x slots", () => {
    const slots = computePactMagicSlots(11);
    expect(slots.max).toBe(3);
    expect(slots.slotLevel).toBe(5); // Still 5th level
  });

  it("Warlock 17+ = 4x slots", () => {
    const slots = computePactMagicSlots(17);
    expect(slots.max).toBe(4);
    expect(slots.slotLevel).toBe(5);
  });

  it("slot level increases at 1/3/5/7/9", () => {
    expect(computePactMagicSlots(1).slotLevel).toBe(1);
    expect(computePactMagicSlots(3).slotLevel).toBe(2);
    expect(computePactMagicSlots(5).slotLevel).toBe(3);
    expect(computePactMagicSlots(7).slotLevel).toBe(4);
    expect(computePactMagicSlots(9).slotLevel).toBe(5);
    expect(computePactMagicSlots(20).slotLevel).toBe(5); // Caps at Lv5
  });

  it("no Warlock levels = no pact magic", () => {
    const slots = computePactMagicSlots(0);
    expect(slots.hasPactMagic).toBe(false);
    expect(slots.max).toBe(0);
    expect(slots.current).toBe(0);
  });
});


// ═══════════════════════════════════════════════════════════════
// MULTICLASS SLOT TABLE (PHB 165)
// ═══════════════════════════════════════════════════════════════

describe("buildMulticlassSlots — Multiclass Spellcaster table", () => {
  it("effective level 0 = all zero slots", () => {
    const slots = buildMulticlassSlots(0);
    for (let lvl = 1; lvl <= 9; lvl++) {
      expect(slots[`level${lvl}` as keyof typeof slots].max).toBe(0);
    }
  });

  it("effective level 1 = 2x Lv1 slots", () => {
    const slots = buildMulticlassSlots(1);
    expect(slots.level1.max).toBe(2);
    expect(slots.level1.current).toBe(2);
    expect(slots.level2.max).toBe(0);
  });

  it("effective level 3 = 4x Lv1 + 2x Lv2", () => {
    const slots = buildMulticlassSlots(3);
    expect(slots.level1.max).toBe(4);
    expect(slots.level2.max).toBe(2);
    expect(slots.level3.max).toBe(0);
  });

  it("effective level 5 = 4x Lv1 + 3x Lv2 + 2x Lv3", () => {
    const slots = buildMulticlassSlots(5);
    expect(slots.level1.max).toBe(4);
    expect(slots.level2.max).toBe(3);
    expect(slots.level3.max).toBe(2);
  });

  it("effective level 20 = full 9th-level slots", () => {
    const slots = buildMulticlassSlots(20);
    expect(slots.level9.max).toBe(1);
    expect(slots.level9.current).toBe(1);
    expect(slots.level1.max).toBe(4);
  });
});


// ═══════════════════════════════════════════════════════════════
// SPELLCASTING ABILITY DETERMINATION
// ═══════════════════════════════════════════════════════════════

describe("determineSpellcastingAbility — ability score priority", () => {
  it("Wizard uses Intelligence", () => {
    const entries = buildClassEntries([{ name: "Wizard", level: 5 }]);
    const mod = determineSpellcastingAbility(entries, WENDY_ABILITIES);
    expect(mod).toBe(Math.floor((12 - 10) / 2)); // Wendy INT=12 → +1
  });

  it("Paladin uses Charisma", () => {
    const entries = buildClassEntries([{ name: "Paladin", level: 5 }]);
    const mod = determineSpellcastingAbility(entries, KEHRFUFFLE_ABILITIES);
    expect(mod).toBe(Math.floor((16 - 10) / 2)); // Kehrfuffle CHA=16 → +3
  });

  it("Cleric uses Wisdom", () => {
    const entries = buildClassEntries([{ name: "Cleric", level: 5 }]);
    const mod = determineSpellcastingAbility(entries, KEHRFUFFLE_ABILITIES);
    expect(mod).toBe(Math.floor((12 - 10) / 2)); // Kehrfuffle WIS=12 → +1
  });

  it("Warlock uses Charisma", () => {
    const entries = buildClassEntries([{ name: "Warlock", level: 3 }]);
    const mod = determineSpellcastingAbility(entries, WENDY_ABILITIES);
    expect(mod).toBe(Math.floor((14 - 10) / 2)); // Wendy CHA=14 → +2
  });

  it("non-casters return 0", () => {
    const entries = buildClassEntries([{ name: "Fighter", level: 5 }]);
    expect(determineSpellcastingAbility(entries, WENDY_ABILITIES)).toBe(0);
  });
});


// ═══════════════════════════════════════════════════════════════
// COMPLETE MULTICLASS COMPUTATION
// ═══════════════════════════════════════════════════════════════

describe("computeMulticlassSpellcasting — full integration", () => {
  it("Wizard 5 (single class) produces correct full-caster slots", () => {
    const state = computeMulticlassSpellcasting(
      [{ name: "Wizard", level: 5 }],
      { strength: 10, dexterity: 10, constitution: 10, intelligence: 16, wisdom: 10, charisma: 10 },
      3
    );
    expect(state.isCaster).toBe(true);
    expect(state.effectiveCasterLevel).toBe(5);
    expect(state.multiclassSlots.level3.max).toBe(2); // 3rd level slots at CL5
    expect(state.multiclassSlots.level3.current).toBe(2);
    expect(state.spellSaveDC).toBe(8 + 3 + 3); // 8 + INT+3 + PB+3 = 14
    expect(state.spellAttackBonus).toBe(3 + 3); // INT+3 + PB+3 = +6
    expect(state.pactSlots.hasPactMagic).toBe(false);
  });

  it("Wizard 3 + Paladin 2 = effective CL 4", () => {
    const state = computeMulticlassSpellcasting(
      [{ name: "Wizard", level: 3 }, { name: "Paladin", level: 2 }],
      { strength: 10, dexterity: 10, constitution: 10, intelligence: 16, wisdom: 10, charisma: 14 },
      3
    );
    expect(state.isCaster).toBe(true);
    expect(state.effectiveCasterLevel).toBe(4);
    // Effective CL 4 = 4x Lv1 + 3x Lv2
    expect(state.multiclassSlots.level1.max).toBe(4);
    expect(state.multiclassSlots.level2.max).toBe(3);
    expect(state.multiclassSlots.level3.max).toBe(0);
  });

  it("Paladin 6 (single half-caster) = effective CL 3", () => {
    const state = computeMulticlassSpellcasting(
      [{ name: "Paladin", level: 6 }],
      KEHRFUFFLE_ABILITIES,
      3
    );
    expect(state.isCaster).toBe(true);
    expect(state.effectiveCasterLevel).toBe(3);
    expect(state.multiclassSlots.level1.max).toBe(4);
    expect(state.multiclassSlots.level2.max).toBe(2);
  });

  it("Warlock 5 + Wizard 3 = pact magic + effective CL 3", () => {
    const state = computeMulticlassSpellcasting(
      [{ name: "Warlock", level: 5 }, { name: "Wizard", level: 3 }],
      { strength: 10, dexterity: 10, constitution: 10, intelligence: 16, wisdom: 10, charisma: 16 },
      3
    );
    // Wizard 3 → CL 3, Warlock contributes 0
    expect(state.isCaster).toBe(true);
    expect(state.effectiveCasterLevel).toBe(3);

    // Multi-class slots: CL 3 → 4x Lv1 + 2x Lv2
    expect(state.multiclassSlots.level1.max).toBe(4);
    expect(state.multiclassSlots.level2.max).toBe(2);

    // Pact Magic: Warlock 5 → 2x Lv3 slots
    expect(state.pactSlots.hasPactMagic).toBe(true);
    expect(state.pactSlots.slotLevel).toBe(3);
    expect(state.pactSlots.max).toBe(2);

    // Spellcasting ability comes from Wizard (highest priority full caster)
    expect(state.spellcastingAbilityMod).toBe(Math.floor((16 - 10) / 2)); // INT=16 → +3
    expect(state.spellSaveDC).toBe(14);
  });

  it("Fighter 5 (single non-caster) — no spellcasting", () => {
    const state = computeMulticlassSpellcasting(
      [{ name: "Fighter", level: 5 }],
      { strength: 18, dexterity: 14, constitution: 16, intelligence: 8, wisdom: 10, charisma: 12 },
      3
    );
    expect(state.isCaster).toBe(false);
    expect(state.effectiveCasterLevel).toBe(0);
    expect(state.multiclassSlots.level1.max).toBe(0);
    expect(state.pactSlots.hasPactMagic).toBe(false);
    expect(state.spellSaveDC).toBe(8); // 8 + 0 mod + 3 pb = 11 (but 0 ability mod)
    expect(state.spellAttackBonus).toBe(0);
  });

  it("Cleric 5 + Druid 3 + Paladin 2 = effective CL 9 (5+3+1)", () => {
    const state = computeMulticlassSpellcasting(
      [
        { name: "Cleric", level: 5 },
        { name: "Druid", level: 3 },
        { name: "Paladin", level: 2 }, // floor(2/2)=1
      ],
      { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 18, charisma: 10 },
      4 // PB at Lv10 character total = +4
    );
    expect(state.effectiveCasterLevel).toBe(9);
    // CL 9 = 4x Lv1, 3x Lv2, 3x Lv3, 3x Lv4, 1x Lv5
    expect(state.multiclassSlots.level1.max).toBe(4);
    expect(state.multiclassSlots.level5.max).toBe(1);
  });
});


// ═══════════════════════════════════════════════════════════════
// CAST & RESTORE OPERATIONS
// ═══════════════════════════════════════════════════════════════

describe("castSpellFromMulticlassPool — spell slot consumption", () => {
  it("should consume a multi-class slot on cast", () => {
    const state = computeMulticlassSpellcasting(
      [{ name: "Wizard", level: 5 }],
      { strength: 10, dexterity: 10, constitution: 10, intelligence: 16, wisdom: 10, charisma: 10 },
      3
    );
    expect(state.multiclassSlots.level3.current).toBe(2);

    const result = castSpellFromMulticlassPool(state, 3, false);
    expect(result.success).toBe(true);
    expect(result.state.multiclassSlots.level3.current).toBe(1);
  });

  it("should consume a pact magic slot on cast with isPactMagic=true", () => {
    const state = computeMulticlassSpellcasting(
      [{ name: "Warlock", level: 5 }],
      { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 16 },
      3
    );
    expect(state.pactSlots.current).toBe(2);

    const result = castSpellFromMulticlassPool(state, 3, true);
    expect(result.success).toBe(true);
    expect(result.state.pactSlots.current).toBe(1);
  });

  it("should fail when no slots remaining", () => {
    const state = computeMulticlassSpellcasting(
      [{ name: "Wizard", level: 1 }],
      { strength: 10, dexterity: 10, constitution: 10, intelligence: 16, wisdom: 10, charisma: 10 },
      2
    );

    // Wizard 1 has 2 Lv1 slots — cast twice
    const r1 = castSpellFromMulticlassPool(state, 1, false);
    expect(r1.success).toBe(true);
    const r2 = castSpellFromMulticlassPool(r1.state, 1, false);
    expect(r2.success).toBe(true);
    const r3 = castSpellFromMulticlassPool(r2.state, 1, false);
    expect(r3.success).toBe(false);
    expect(r3.error).toContain("No level 1 spell slots remaining");
  });

  it("should fail for wrong pact slot level", () => {
    const state = computeMulticlassSpellcasting(
      [{ name: "Warlock", level: 1 }],
      { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 16 },
      2
    );
    // Warlock 1 has Lv1 slots — trying to cast Lv2 pact slot should fail
    const result = castSpellFromMulticlassPool(state, 2, true);
    expect(result.success).toBe(false);
    expect(result.error).toContain("Pact Magic slots are level 1");
  });
});

describe("restorePactMagicSlots — Warlock short rest", () => {
  it("should restore pact slots to max", () => {
    const state = computeMulticlassSpellcasting(
      [{ name: "Warlock", level: 5 }],
      { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 16 },
      3
    );

    // Cast both pact slots
    const r1 = castSpellFromMulticlassPool(state, 3, true);
    const r2 = castSpellFromMulticlassPool(r1.state, 3, true);
    expect(r2.state.pactSlots.current).toBe(0);

    // Short rest restore
    const restored = restorePactMagicSlots(r2.state);
    expect(restored.pactSlots.current).toBe(2);
  });

  it("should be no-op for non-Warlocks", () => {
    const state = computeMulticlassSpellcasting(
      [{ name: "Wizard", level: 5 }],
      { strength: 10, dexterity: 10, constitution: 10, intelligence: 16, wisdom: 10, charisma: 10 },
      3
    );
    const restored = restorePactMagicSlots(state);
    expect(restored.pactSlots.hasPactMagic).toBe(false);
  });
});

describe("restoreAllMulticlassSlots — long rest", () => {
  it("should restore all multi-class slots to max", () => {
    const state = computeMulticlassSpellcasting(
      [{ name: "Wizard", level: 5 }],
      { strength: 10, dexterity: 10, constitution: 10, intelligence: 16, wisdom: 10, charisma: 10 },
      3
    );

    // Cast all Lv3 slots
    const r1 = castSpellFromMulticlassPool(state, 3, false);
    const r2 = castSpellFromMulticlassPool(r1.state, 3, false);
    expect(r2.state.multiclassSlots.level3.current).toBe(0);

    // Long rest restore
    const restored = restoreAllMulticlassSlots(r2.state);
    expect(restored.multiclassSlots.level3.current).toBe(2);
  });
});


// ═══════════════════════════════════════════════════════════════
// getCasterLevelBreakdown
// ═══════════════════════════════════════════════════════════════

describe("getCasterLevelBreakdown", () => {
  it("should produce readable breakdown for multi-class", () => {
    const entries = buildClassEntries([
      { name: "Wizard", level: 3 },
      { name: "Paladin", level: 2 },
    ]);
    const breakdown = getCasterLevelBreakdown(entries);
    expect(breakdown.length).toBe(2);
    expect(breakdown[0]).toContain("Wizard 3 → 3 effective levels");
    expect(breakdown[1]).toContain("Paladin 2 → 1 effective level");
  });

  it("should show pact magic details for Warlock", () => {
    const entries = buildClassEntries([
      { name: "Warlock", level: 5 },
    ]);
    const breakdown = getCasterLevelBreakdown(entries);
    expect(breakdown.length).toBe(1);
    expect(breakdown[0]).toContain("Pact Magic");
    expect(breakdown[0]).toContain("2x Lv3");
  });
});


// ═══════════════════════════════════════════════════════════════
// BACKWARD COMPATIBILITY — getCasterType FIX
// ═══════════════════════════════════════════════════════════════

describe("getCasterType — backward compatibility fix", () => {
  it("should now return 'none' for non-casters (was 'half')", () => {
    expect(getCasterType("Fighter")).toBe("none");
    expect(getCasterType("Barbarian")).toBe("none");
    expect(getCasterType("Monk")).toBe("none");
    expect(getCasterType("Rogue")).toBe("none");
  });

  it("should return 'pact' for Warlock (was 'half')", () => {
    expect(getCasterType("Warlock")).toBe("pact");
  });

  it("should still return correct caster types", () => {
    expect(getCasterType("Wizard")).toBe("full");
    expect(getCasterType("Paladin")).toBe("half");
    expect(getCasterType("Eldritch Knight")).toBe("third");
  });
});


// ═══════════════════════════════════════════════════════════════
// REAL-WORLD ARKLA CAMPAIGN SCENARIOS
// ═══════════════════════════════════════════════════════════════

describe("Real-world Arkla campaign scenarios", () => {
  it("Kehrfuffle the Paladin 5 — single half-caster", () => {
    const state = computeMulticlassSpellcasting(
      [{ name: "Paladin", level: 5 }],
      KEHRFUFFLE_ABILITIES,
      3
    );
    expect(state.isCaster).toBe(true);
    // Paladin 5 → effective CL floor(5/2)=2
    expect(state.effectiveCasterLevel).toBe(2);
    // CL 2 → 3x Lv1
    expect(state.multiclassSlots.level1.max).toBe(3);
    expect(state.multiclassSlots.level2.max).toBe(0);

    // Spellcasting: Paladin uses CHA
    expect(state.spellcastingAbilityMod).toBe(Math.floor((16 - 10) / 2)); // +3
    expect(state.spellSaveDC).toBe(14); // 8 + 3 + 3
    expect(state.spellAttackBonus).toBe(6); // 3 + 3

    // No pact magic
    expect(state.pactSlots.hasPactMagic).toBe(false);
  });

  it("Wendy the Rogue 5 — non-caster (was incorrectly marked as half-caster)", () => {
    const state = computeMulticlassSpellcasting(
      [{ name: "Rogue", level: 5 }],
      WENDY_ABILITIES,
      3
    );
    expect(state.isCaster).toBe(false);
    expect(state.effectiveCasterLevel).toBe(0);
  });

  it("Wizard 5 + Warlock 3 combo — both pools active", () => {
    const state = computeMulticlassSpellcasting(
      [
        { name: "Wizard", level: 5 },
        { name: "Warlock", level: 3 },
      ],
      { strength: 8, dexterity: 14, constitution: 14, intelligence: 18, wisdom: 10, charisma: 14 },
      3
    );

    // Wizard 5 → CL 5
    expect(state.effectiveCasterLevel).toBe(5);

    // Multi-class slots: CL5 → 4x Lv1, 3x Lv2, 2x Lv3
    expect(state.multiclassSlots.level3.max).toBe(2);

    // Pact: Warlock 3 → 2x Lv2
    expect(state.pactSlots.hasPactMagic).toBe(true);
    expect(state.pactSlots.slotLevel).toBe(2);
    expect(state.pactSlots.max).toBe(2);

    // Cast from multi-class pool: Lv3 slot
    const mcCast = castSpellFromMulticlassPool(state, 3, false);
    expect(mcCast.success).toBe(true);
    expect(mcCast.state.multiclassSlots.level3.current).toBe(1);

    // Cast from pact: Lv2 slot
    const pactCast = castSpellFromMulticlassPool(mcCast.state, 2, true);
    expect(pactCast.success).toBe(true);
    expect(pactCast.state.pactSlots.current).toBe(1);

    // Short rest → restore pact slots only
    const afterRest = restorePactMagicSlots(pactCast.state);
    expect(afterRest.pactSlots.current).toBe(2); // Restored
    expect(afterRest.multiclassSlots.level3.current).toBe(1); // NOT restored (long rest only)
  });
});
