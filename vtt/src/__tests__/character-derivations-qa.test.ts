/**
 * Sprint 14/41 — Deep Exploration QA Phase: Character Derivations Engine
 *
 * Rigorous QA on the MOST CRITICAL untested engine — used by EVERY character.
 * Tests ability modifiers, proficiency bonus, AC computation, initiative,
 * encumbrance, and full derivation pipeline for Arkla campaign characters.
 *
 * Characters used:
 *   - Wendy (Rogue 5, DEX 18, Studded Leather) — stealth-based melee
 *   - Kehrfuffle (Paladin 5, STR 16, Plate + Shield) — holy tank
 *   - Kaelen (Wizard 5, INT 18, no armor) — unarmored caster
 *   - Durin (Barbarian 3, CON 16, Unarmored Defense) — unarmored tank
 *
 * Strict Compliance: NO dice rollers, NO occult elements.
 */

import { describe, it, expect } from "vitest";
import {
  getAbilityMod,
  getProficiencyBonus,
  computeArmorClass,
  computeInitiative,
  computeSpeed,
  computeEncumbranceState,
  computeSpellcasting,
  computeAllDerivations,
} from "@/lib/mechanics/character-derivations";
import type { PlayerCharacter, Currency } from "@/types";

// ── Factory Helpers ──────────────────────────────────────────

const EMPTY_CURRENCY: Currency = { copper: 0, silver: 0, electrum: 0, gold: 0, platinum: 0 };

function makeChar(overrides: Partial<PlayerCharacter> = {}): PlayerCharacter {
  return {
    id: "test-pc",
    name: "Test Character",
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
    strength: 14,
    dexterity: 14,
    constitution: 14,
    intelligence: 10,
    wisdom: 10,
    charisma: 10,
    savingThrows: {},
    skills: {},
    hitPoints: { current: 44, max: 44, temporary: 0 },
    armorClass: 10,
    initiative: 0,
    speed: { walk: 30 },
    hitDice: "1d10",
    proficiencyBonus: 3,
    conditions: [],
    deathSaves: { successes: 0, failures: 0 },
    temporaryHitPoints: 0,
    traits: [],
    proficiencies: [],
    languages: ["Common"],
    features: [],
    equipment: [],
    inventory: [],
    currency: EMPTY_CURRENCY,
    appearance: "",
    backstory: "",
    allies: "",
    characterNotes: "",
    isHomebrew: false,
    preparedSpells: [],
    activeFeats: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  };
}

// ── Arkla Campaign Characters ────────────────────────────────

function createWendy(): PlayerCharacter {
  return makeChar({
    id: "wendy",
    name: "Wendy Quickfoot",
    playerName: "Alice",
    race: "Lightfoot Halfling",
    class: "Rogue",
    level: 5,
    classes: [{ name: "Rogue", level: 5 }],
    strength: 8,
    dexterity: 18,
    constitution: 14,
    intelligence: 12,
    wisdom: 10,
    charisma: 14,
    experiencePoints: 6500,
    hitPoints: { current: 38, max: 38, temporary: 0 },
    speed: { walk: 25 },
    hitDice: "1d8",
    equipment: [
      { slot: "armor", item: "Studded Leather", quantity: 1, weight: 13, notes: "" },
      { slot: "weapon", item: "Rapier", quantity: 1, weight: 2, notes: "" },
      { slot: "offhand", item: "Shortsword", quantity: 1, weight: 2, notes: "" },
    ],
    inventory: [
      { name: "Thieves' Tools", quantity: 1, weight: 1, description: "", isEquipped: false },
      { name: "Rations", quantity: 5, weight: 2, description: "", isEquipped: false },
    ],
    currency: { copper: 0, silver: 15, electrum: 0, gold: 85, platinum: 0 },
  });
}

function createKehrfuffle(): PlayerCharacter {
  return makeChar({
    id: "kehrfuffle",
    name: "Kehrfuffle Brightshield",
    playerName: "Bob",
    race: "Human",
    class: "Paladin",
    level: 5,
    classes: [{ name: "Paladin", level: 5 }],
    strength: 16,
    dexterity: 10,
    constitution: 14,
    intelligence: 8,
    wisdom: 12,
    charisma: 16,
    experiencePoints: 6500,
    hitPoints: { current: 44, max: 44, temporary: 0 },
    speed: { walk: 30 },
    hitDice: "1d10",
    equipment: [
      { slot: "armor", item: "Plate", quantity: 1, weight: 65, notes: "" },
      { slot: "offhand", item: "Shield", quantity: 1, weight: 6, notes: "" },
      { slot: "weapon", item: "Longsword +1", quantity: 1, weight: 3, notes: "+1 to AC" },
    ],
    inventory: [
      { name: "Holy Symbol", quantity: 1, weight: 1, description: "", isEquipped: true },
    ],
    currency: { copper: 0, silver: 0, electrum: 0, gold: 50, platinum: 0 },
  });
}

function createKaelen(): PlayerCharacter {
  return makeChar({
    id: "kaelen",
    name: "Kaelen Starweaver",
    playerName: "Charlie",
    race: "High Elf",
    class: "Wizard",
    level: 5,
    classes: [{ name: "Wizard", level: 5 }],
    strength: 8,
    dexterity: 14,
    constitution: 12,
    intelligence: 18,
    wisdom: 12,
    charisma: 10,
    hitPoints: { current: 32, max: 32, temporary: 0 },
    speed: { walk: 30 },
    hitDice: "1d6",
    equipment: [],
    inventory: [
      { name: "Spellbook", quantity: 1, weight: 3, description: "", isEquipped: false },
      { name: "Arcane Focus", quantity: 1, weight: 1, description: "", isEquipped: false },
    ],
    currency: { copper: 10, silver: 0, electrum: 0, gold: 100, platinum: 0 },
    features: [],
  });
}

function createDurin(): PlayerCharacter {
  return makeChar({
    id: "durin",
    name: "Durin Ironhide",
    playerName: "Diana",
    race: "Mountain Dwarf",
    class: "Barbarian",
    level: 3,
    classes: [{ name: "Barbarian", level: 3 }],
    strength: 16,
    dexterity: 14,
    constitution: 16,
    intelligence: 8,
    wisdom: 12,
    charisma: 8,
    hitPoints: { current: 35, max: 35, temporary: 0 },
    speed: { walk: 25 },
    hitDice: "1d12",
    equipment: [
      { slot: "weapon", item: "Greataxe", quantity: 1, weight: 7, notes: "" },
    ],
    features: [
      { name: "Unarmored Defense", description: "AC = 10 + DEX + CON", source: "Barbarian" },
    ],
    inventory: [],
    currency: EMPTY_CURRENCY,
  });
}


// ═══════════════════════════════════════════════════════════════
// ABILITY MODIFIERS & PROFICIENCY BONUS
// ═══════════════════════════════════════════════════════════════

describe("getAbilityMod", () => {
  // ── 5e RAW: Ability Modifier = floor((score - 10) / 2) ──
  test.each([
    [1, -5], [2, -4], [3, -4], [4, -3], [5, -3],
    [6, -2], [7, -2], [8, -1], [9, -1], [10, 0],
    [11, 0], [12, 1], [13, 1], [14, 2], [15, 2],
    [16, 3], [17, 3], [18, 4], [19, 4], [20, 5],
    [21, 5], [22, 6], [23, 6], [24, 7], [25, 7],
    [26, 8], [27, 8], [28, 9], [29, 9], [30, 10],
  ])("score %i yields modifier %i", (score, expected) => {
    expect(getAbilityMod(score)).toBe(expected);
  });

  it("handles edge case of score 0 (undefined behavior but no crash)", () => {
    expect(getAbilityMod(0)).toBe(-5);
  });
});

describe("getProficiencyBonus", () => {
  // ── 5e RAW: PB = ceil(1 + level / 4) ──
  test.each([
    [1, 2], [2, 2], [3, 2], [4, 2],
    [5, 3], [6, 3], [7, 3], [8, 3],
    [9, 4], [10, 4], [11, 4], [12, 4],
    [13, 5], [14, 5], [15, 5], [16, 5],
    [17, 6], [18, 6], [19, 6], [20, 6],
  ])("level %i yields PB %i", (level, expected) => {
    expect(getProficiencyBonus(level)).toBe(expected);
  });

  it("handles level 0 (edge case — no crash)", () => {
    expect(getProficiencyBonus(0)).toBe(1);
  });
});


// ═══════════════════════════════════════════════════════════════
// ARMOR CLASS (RAW 5e — PHB pg 14-15, 144-146)
// ═══════════════════════════════════════════════════════════════

describe("computeArmorClass", () => {
  describe("Unarmored (no equipment)", () => {
    it("Kaelen (Wizard, DEX 14, no armor) should have AC 12 (10 + 2 DEX)", () => {
      const kaelen = createKaelen();
      expect(computeArmorClass(kaelen)).toBe(12);
    });

    it("naked human with DEX 10 should have AC 10", () => {
      const human = makeChar({ dexterity: 10, equipment: [] });
      expect(computeArmorClass(human)).toBe(10);
    });

    it("naked human with DEX 20 should have AC 15 (10 + 5 DEX)", () => {
      const dex20 = makeChar({ dexterity: 20, equipment: [] });
      expect(computeArmorClass(dex20)).toBe(15);
    });
  });

  describe("Unarmored Defense (Barbarian)", () => {
    it("Durin (Barbarian 3, CON 16, DEX 14) should have AC 15 (10 + 2 DEX + 3 CON)", () => {
      const durin = createDurin();
      expect(computeArmorClass(durin)).toBe(15);
    });

    it("Barbarian with CON 18, DEX 18 should have AC 16 (10 + 4 + 4) — wait 10+4+4=18", () => {
      const barb = makeChar({
        class: "Barbarian",
        classes: [{ name: "Barbarian", level: 5 }],
        strength: 16, dexterity: 18, constitution: 18, speed: { walk: 30 },
      });
      expect(computeArmorClass(barb)).toBe(18); // 10 + 4 (DEX) + 4 (CON)
    });
  });

  describe("Light Armor", () => {
    it("Wendy (Rogue, DEX 18, Studded Leather) should have AC 16 (12 + 4 DEX)", () => {
      const wendy = createWendy();
      expect(computeArmorClass(wendy)).toBe(16);
    });

    it("Leather armor (AC 11) with DEX 12 should give AC 13", () => {
      const leather = makeChar({
        dexterity: 12, equipment: [{ slot: "armor", item: "Leather", quantity: 1, weight: 10, notes: "" }],
      });
      expect(computeArmorClass(leather)).toBe(13); // 11 + 1
    });

    it("Padded armor (AC 11) with DEX 20 should give AC 16 (11 + 5, capped at full dex)", () => {
      const padded = makeChar({
        dexterity: 20, equipment: [{ slot: "armor", item: "Padded", quantity: 1, weight: 8, notes: "" }],
      });
      expect(computeArmorClass(padded)).toBe(16); // 11 + 5
    });
  });

  describe("Medium Armor", () => {
    it("Half Plate (AC 15) with DEX 14 (+2 mod, cap +2) should give AC 17", () => {
      const halfPlate = makeChar({
        dexterity: 14, equipment: [{ slot: "armor", item: "Half Plate", quantity: 1, weight: 40, notes: "" }],
      });
      expect(computeArmorClass(halfPlate)).toBe(17); // 15 + 2
    });

    it("Breastplate (AC 14) with DEX 18 (+4 mod, cap +2) should give AC 16", () => {
      const breast = makeChar({
        dexterity: 18, equipment: [{ slot: "armor", item: "Breastplate", quantity: 1, weight: 20, notes: "" }],
      });
      expect(computeArmorClass(breast)).toBe(16); // 14 + 2
    });

    it("Chain Shirt (AC 13) with DEX 10 should give AC 13", () => {
      const chain = makeChar({
        dexterity: 10, equipment: [{ slot: "armor", item: "Chain Shirt", quantity: 1, weight: 20, notes: "" }],
      });
      expect(computeArmorClass(chain)).toBe(13); // 13 + 0
    });
  });

  describe("Heavy Armor", () => {
    it("Plate (AC 18) with shield should give AC 20", () => {
      const plate = makeChar({
        dexterity: 8, // irrelevant for heavy
        equipment: [
          { slot: "armor", item: "Plate", quantity: 1, weight: 65, notes: "" },
          { slot: "offhand", item: "Shield", quantity: 1, weight: 6, notes: "" },
        ],
      });
      expect(computeArmorClass(plate)).toBe(20); // 18 + 2
    });

    it("Chain Mail (AC 16) without shield should give AC 16", () => {
      const mail = makeChar({
        equipment: [{ slot: "armor", item: "Chain Mail", quantity: 1, weight: 55, notes: "" }],
      });
      expect(computeArmorClass(mail)).toBe(16);
    });
  });

  describe("Shield (standalone)", () => {
    it("Shield with no armor: AC 12 (10 + 0 DEX + 2 shield)", () => {
      const shield = makeChar({
        dexterity: 10, equipment: [{ slot: "offhand", item: "Shield", quantity: 1, weight: 6, notes: "" }],
      });
      expect(computeArmorClass(shield)).toBe(12);
    });
  });

  describe("Kehrfuffle (Paladin 5 — integrated test)", () => {
    it("Kehrfuffle with Plate + Shield + +1 magic bonus should have AC 21", () => {
      const kehrfuffle = createKehrfuffle();
      // Plate (18) + Shield (2) + +1 from weapon notes = 21
      expect(computeArmorClass(kehrfuffle)).toBe(21);
    });
  });

  describe("Magic items and AC bonuses", () => {
    it("+1 armor should add 1 AC", () => {
      const plusOne = makeChar({
        equipment: [{ slot: "armor", item: "Studded Leather +1", quantity: 1, weight: 13, notes: "" }],
        dexterity: 14,
      });
      // 12 (studded) + 2 (dex) + 1 (magic from item name) = 15
      expect(computeArmorClass(plusOne)).toBe(15);
    });

    it("Armor with +2 AC in notes should apply bonus", () => {
      const ring = makeChar({
        equipment: [
          { slot: "armor", item: "Leather", quantity: 1, weight: 10, notes: "+2 to AC" },
        ],
        dexterity: 14,
      });
      expect(computeArmorClass(ring)).toBe(15); // 11 + 2 + 2
    });

    it("Shield +1 in name should add 1 AC", () => {
      const shield = makeChar({
        dexterity: 10,
        equipment: [
          { slot: "armor", item: "Chain Mail", quantity: 1, weight: 55, notes: "" },
          { slot: "offhand", item: "Shield +1", quantity: 1, weight: 6, notes: "" },
        ],
      });
      expect(computeArmorClass(shield)).toBe(19); // 16 + 2 + 1
    });
  });

  describe("Edge cases", () => {
    it("No equipment, no class features → base AC 10", () => {
      const basic = makeChar({ dexterity: 10, equipment: [], features: [] });
      expect(computeArmorClass(basic)).toBe(10);
    });

    it("Multiple armor entries: uses last armor's base AC (fragile, document behavior)", () => {
      const doubleArmor = makeChar({
        dexterity: 14,
        equipment: [
          { slot: "armor", item: "Leather", quantity: 1, weight: 10, notes: "" },
          { slot: "armor", item: "Chain Shirt", quantity: 1, weight: 20, notes: "" },
        ],
      });
      // Last armor is Chain Shirt (AC 13 + min(DEX=2, cap=2) = 15)
      expect(computeArmorClass(doubleArmor)).toBe(15);
    });
  });
});


// ═══════════════════════════════════════════════════════════════
// INITIATIVE
// ═══════════════════════════════════════════════════════════════

describe("computeInitiative", () => {
  it("Wendy (DEX 18) should have initiative +4", () => {
    expect(computeInitiative(createWendy())).toBe(4);
  });

  it("Kehrfuffle (DEX 10) should have initiative +0", () => {
    expect(computeInitiative(createKehrfuffle())).toBe(0);
  });

  it("Kaelen (DEX 14) should have initiative +2", () => {
    expect(computeInitiative(createKaelen())).toBe(2);
  });

  it("DEX 20 should give initiative +5", () => {
    const maxDex = makeChar({ dexterity: 20 });
    expect(computeInitiative(maxDex)).toBe(5);
  });

  it("DEX 1 should give initiative -5", () => {
    const minDex = makeChar({ dexterity: 1 });
    expect(computeInitiative(minDex)).toBe(-5);
  });
});


// ═══════════════════════════════════════════════════════════════
// SPEED & ENCUMBRANCE
// ═══════════════════════════════════════════════════════════════

describe("computeSpeed", () => {
  it("Wendy's base speed is 25 (halfling)", () => {
    expect(computeSpeed(createWendy())).toBe(25);
  });

  it("Kehrfuffle's base speed is 30 (human)", () => {
    expect(computeSpeed(createKehrfuffle())).toBe(30);
  });

  it("Speed floor is 0 (cannot go negative)", () => {
    const slow = makeChar({ speed: { walk: 5 }, strength: 1, inventory: [{ name: "Anvil", quantity: 1, weight: 500, description: "", isEquipped: false }] });
    expect(computeSpeed(slow)).toBeGreaterThanOrEqual(0);
  });
});

describe("computeEncumbranceState", () => {
  it("Wendy (STR 8) should have carrying capacity 120 lb", () => {
    const state = computeEncumbranceState(createWendy());
    expect(state.carryingCapacity).toBe(120);
  });

  it("Wendy should be unencumbered at ~10 lb", () => {
    const state = computeEncumbranceState(createWendy());
    expect(state.encumbranceLevel).toBe("unencumbered");
    expect(state.speedReduction).toBe(0);
  });

  it("Kehrfuffle (STR 16) should have carrying capacity 240 lb", () => {
    const state = computeEncumbranceState(createKehrfuffle());
    expect(state.carryingCapacity).toBe(240);
  });

  it("Kehrfuffle should be unencumbered at ~72 lb (armor + weapons)", () => {
    const state = computeEncumbranceState(createKehrfuffle());
    expect(state.encumbranceLevel).toBe("unencumbered");
  });

  it("Overencumbered when weight exceeds capacity", () => {
    const overloaded = makeChar({
      strength: 10,
      inventory: [{ name: "Anvil", quantity: 1, weight: 200, description: "", isEquipped: false }],
      currency: EMPTY_CURRENCY,
    });
    const state = computeEncumbranceState(overloaded);
    expect(state.encumbranceLevel).toBe("overencumbered");
    expect(state.disadvantageOnChecks).toBe(true);
  });

  it("Heavily encumbered at >66% capacity", () => {
    const heavy = makeChar({
      strength: 10, // capacity = 150
      inventory: [{ name: "Heavy Load", quantity: 1, weight: 120, description: "", isEquipped: false }],
      currency: EMPTY_CURRENCY,
    });
    const state = computeEncumbranceState(heavy);
    expect(state.encumbranceLevel).toBe("heavily encumbered");
    expect(state.speedReduction).toBe(-20);
    expect(state.disadvantageOnChecks).toBe(true);
  });

  it("Lightly encumbered at >33% capacity", () => {
    const light = makeChar({
      strength: 10, // capacity = 150
      inventory: [{ name: "Light Load", quantity: 1, weight: 60, description: "", isEquipped: false }],
      currency: EMPTY_CURRENCY,
    });
    const state = computeEncumbranceState(light);
    expect(state.encumbranceLevel).toBe("lightly encumbered");
    expect(state.speedReduction).toBe(-10);
    expect(state.disadvantageOnChecks).toBe(false);
  });

  it("Coin weight contributes to encumbrance", () => {
    const loaded = makeChar({
      strength: 10,
      currency: { copper: 0, silver: 0, electrum: 0, gold: 1000, platinum: 0 },
    });
    const state = computeEncumbranceState(loaded);
    // 1000 gold × 0.02 lb = 20 lb
    expect(state.totalWeight).toBeGreaterThanOrEqual(20);
  });
});


// ═══════════════════════════════════════════════════════════════
// SPELLCASTING
// ═══════════════════════════════════════════════════════════════

describe("computeSpellcasting", () => {
  describe("Wizard (Kaelen, INT 18, Lv5)", () => {
    const wiz = computeSpellcasting(createKaelen());

    it("should detect full caster", () => {
      expect(wiz.casterType).toBe("full");
      expect(wiz.isCaster).toBe(true);
    });

    it("should use intelligence as spellcasting ability", () => {
      expect(wiz.spellcastingAbility).toBe("intelligence");
      expect(wiz.spellcastingMod).toBe(4); // INT 18 = +4
    });

    it("should compute spell save DC = 8 + 4 (INT) + 3 (PB) = 15", () => {
      expect(wiz.spellSaveDC).toBe(15);
    });

    it("should compute spell attack bonus = 4 (INT) + 3 (PB) = +7", () => {
      expect(wiz.spellAttackBonus).toBe(7);
    });
  });

  describe("Paladin (Kehrfuffle, CHA 16, Lv5)", () => {
    const pal = computeSpellcasting(createKehrfuffle());

    it("should detect half caster", () => {
      expect(pal.casterType).toBe("half");
      expect(pal.isCaster).toBe(true);
    });

    it("should use charisma as spellcasting ability", () => {
      expect(pal.spellcastingAbility).toBe("charisma");
      expect(pal.spellcastingMod).toBe(3); // CHA 16 = +3
    });

    it("should compute spell save DC = 8 + 3 (CHA) + 3 (PB) = 14", () => {
      expect(pal.spellSaveDC).toBe(14);
    });

    it("should compute spell attack bonus = 3 (CHA) + 3 (PB) = +6", () => {
      expect(pal.spellAttackBonus).toBe(6);
    });
  });

  describe("Non-caster (Fighter)", () => {
    it("should detect non-caster", () => {
      const fighter = makeChar({ class: "Fighter", classes: [{ name: "Fighter", level: 5 }] });
      const sc = computeSpellcasting(fighter);
      expect(sc.isCaster).toBe(false);
      expect(sc.casterType).toBeNull();
      expect(sc.spellSlots).toBeNull();
    });
  });

  describe("Rogue (Wendy — non-caster)", () => {
    const rog = computeSpellcasting(createWendy());
    it("should detect non-caster", () => {
      expect(rog.isCaster).toBe(false);
      expect(rog.casterType).toBeNull();
    });
  });

  describe("Barbarian (Durin — non-caster)", () => {
    const barb = computeSpellcasting(createDurin());
    it("should detect non-caster", () => {
      expect(barb.isCaster).toBe(false);
    });
  });
});


// ═══════════════════════════════════════════════════════════════
// FULL DERIVATION PIPELINE (computeAllDerivations)
// ═══════════════════════════════════════════════════════════════

describe("computeAllDerivations — full pipeline", () => {
  describe("Wendy (Rogue 5)", () => {
    const d = computeAllDerivations(createWendy());

    it("should correctly compute ability modifiers", () => {
      expect(d.abilityMods.strength).toBe(-1);
      expect(d.abilityMods.dexterity).toBe(4);
      expect(d.abilityMods.constitution).toBe(2);
    });

    it("should have PB +3 at level 5", () => {
      expect(d.proficiencyBonus).toBe(3);
    });

    it("should have AC 16 (Studded Leather 12 + DEX 4)", () => {
      expect(d.ac).toBe(16);
    });

    it("should have initiative +4 (DEX 18)", () => {
      expect(d.initiative).toBe(4);
    });

    it("should have walking speed 25", () => {
      expect(d.speed.walk).toBe(25);
    });

    it("should not be a caster", () => {
      expect(d.spellcasting.isCaster).toBe(false);
    });

    it("should have max HP 38", () => {
      expect(d.maxHp).toBe(38);
    });
  });

  describe("Kehrfuffle (Paladin 5)", () => {
    const d = computeAllDerivations(createKehrfuffle());

    it("should correctly compute ability modifiers", () => {
      expect(d.abilityMods.strength).toBe(3);
      expect(d.abilityMods.charisma).toBe(3);
    });

    it("should have AC 21 (Plate 18 + Shield 2 + +1)", () => {
      expect(d.ac).toBe(21);
    });

    it("should be a half-caster with CHA", () => {
      expect(d.spellcasting.isCaster).toBe(true);
      expect(d.spellcasting.casterType).toBe("half");
      expect(d.spellcasting.spellcastingAbility).toBe("charisma");
    });

    it("should have max HP 44", () => {
      expect(d.maxHp).toBe(44);
    });

    it("should have PB +3 at level 5", () => {
      expect(d.proficiencyBonus).toBe(3);
    });
  });

  describe("Kaelen (Wizard 5)", () => {
    const d = computeAllDerivations(createKaelen());

    it("should have AC 12 (base 10 + DEX 2, no armor)", () => {
      expect(d.ac).toBe(12);
    });

    it("should be a full caster with INT", () => {
      expect(d.spellcasting.isCaster).toBe(true);
      expect(d.spellcasting.casterType).toBe("full");
      expect(d.spellcasting.spellcastingAbility).toBe("intelligence");
    });

    it("should have max HP 32", () => {
      expect(d.maxHp).toBe(32);
    });
  });

  describe("Durin (Barbarian 3)", () => {
    const d = computeAllDerivations(createDurin());

    it("should have AC 15 (Unarmored Defense: 10 + DEX 2 + CON 3)", () => {
      expect(d.ac).toBe(15);
    });

    it("should not be a caster", () => {
      expect(d.spellcasting.isCaster).toBe(false);
    });

    it("should have PB +2 at level 3", () => {
      expect(d.proficiencyBonus).toBe(2);
    });
  });

  describe("Conditions integration", () => {
    it("should detect concentration condition", () => {
      const conc = makeChar({ conditions: ["concentration"] });
      const d = computeAllDerivations(conc);
      expect(d.isConcentrating).toBe(true);
    });

    it("should detect unconscious condition", () => {
      const unc = makeChar({ conditions: ["unconscious"] });
      const d = computeAllDerivations(unc);
      expect(d.isUnconscious).toBe(true);
    });
  });
});


// ═══════════════════════════════════════════════════════════════
// EDGE CASES & DEFENSIVE GUARDS
// ═══════════════════════════════════════════════════════════════

describe("Edge cases — defensive guards", () => {
  it("computeAllDerivations should not throw for minimum valid character", () => {
    const min = makeChar();
    expect(() => computeAllDerivations(min)).not.toThrow();
  });

  it("should handle empty equipment array", () => {
    const naked = makeChar({ equipment: [], dexterity: 10 });
    expect(computeArmorClass(naked)).toBe(10);
  });

  it("should handle empty inventory array", () => {
    const empty = makeChar({ inventory: [], currency: EMPTY_CURRENCY });
    const state = computeEncumbranceState(empty);
    expect(state.totalWeight).toBe(0);
  });

  it("should handle undefined conditions gracefully", () => {
    const noConditions = makeChar({ conditions: [] });
    const d = computeAllDerivations(noConditions);
    expect(d.conditionsActive).toEqual([]);
    expect(d.isConcentrating).toBe(false);
  });

  it("encumbrance speed floor should not go below 0", () => {
    const maxed = makeChar({
      strength: 8,
      inventory: [{ name: "Extreme Weight", quantity: 1, weight: 500, description: "", isEquipped: false }],
      currency: EMPTY_CURRENCY,
      speed: { walk: 25 },
    });
    const speed = computeSpeed(maxed);
    expect(speed).toBeGreaterThanOrEqual(0);
  });
});
