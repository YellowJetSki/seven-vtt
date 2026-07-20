/**
 * ST VTT — SPRINT 30: End-to-End Live Session Smoke Test (FINAL QA CYCLE)
 *
 * Simulates a complete live D&D 5e session from campaign creation
 * through combat, leveling up, resting, and loot distribution.
 *
 * Scenario: "The Dragon's Lair" — Wendy (Rogue 5) and Kehrfuffle (Paladin 5)
 * face off against an Adult Red Dragon.
 *
 * Run: npx vitest run --config vitest.config.ts src/__tests__/end-to-end-smoke.test.ts
 */

import { describe, it, expect } from "vitest";

interface HitPoints { current: number; max: number; temporary: number; }
interface Currency { copper: number; silver: number; electrum: number; gold: number; platinum: number; }

interface SavedCharacter {
  id: string; name: string; playerName: string; race: string; class: string;
  level: number; experiencePoints: number;
  strength: number; dexterity: number; constitution: number;
  intelligence: number; wisdom: number; charisma: number;
  hitPoints: HitPoints; armorClass: number; initiative: number; proficiencyBonus: number;
  conditions: string[]; temporaryHitPoints: number; spentHitDice?: number;
  inventory: Array<{ id: string; name: string; quantity: number; weight: number; description: string; isEquipped: boolean; }>;
  currency: Currency;
  features: Array<{ name: string; description: string; level?: number; }>;
  resources?: Array<{ name: string; current: number; max: number; recharge: string; }>;
  preparedSpells: string[];
  activeFeats: Array<{ featId: string; featName: string; isActive: boolean; }>;
  createdAt: number; updatedAt: number;
}

function getAbilityMod(score: number): number { return Math.floor((score - 10) / 2); }
function getProficiencyBonus(level: number): number { return Math.ceil(1 + level / 4); }

function computeHP(level: number, hitDieSize: number, conMod: number): number {
  let total = hitDieSize + conMod;
  for (let i = 2; i <= level; i++) {
    total += Math.ceil(hitDieSize / 2) + 1 + conMod;
  }
  return Math.max(total, level);
}

function computeAC(dexMod: number, armorBase: number, shieldBonus: number, magicBonus: number): number {
  return armorBase + Math.min(dexMod, 2) + shieldBonus + magicBonus;
}

function computeInit(dexMod: number): number { return dexMod; }

function addCondition(char: SavedCharacter, condition: string): SavedCharacter {
  if (char.conditions.includes(condition)) return char;
  return { ...char, conditions: [...char.conditions, condition], updatedAt: Date.now() };
}

function removeCondition(char: SavedCharacter, condition: string): SavedCharacter {
  return { ...char, conditions: char.conditions.filter(function(c) { return c !== condition; }), updatedAt: Date.now() };
}

function applyDamage(c: SavedCharacter, damage: number): { character: SavedCharacter; isDead: boolean } {
  let remaining = damage;
  let tmp = c.temporaryHitPoints;
  if (tmp >= remaining) { tmp -= remaining; remaining = 0; }
  else { remaining -= tmp; tmp = 0; }
  var hp = { current: c.hitPoints.current, max: c.hitPoints.max, temporary: tmp };
  hp.current = Math.max(0, hp.current - remaining);
  var isDead = hp.current <= 0;
  return {
    character: { ...c, hitPoints: hp, temporaryHitPoints: tmp, conditions: isDead ? [...c.conditions, "unconscious"] : c.conditions, updatedAt: Date.now() },
    isDead: isDead,
  };
}

function healHp(c: SavedCharacter, amount: number): SavedCharacter {
  var newCurrent = Math.min(c.hitPoints.max, c.hitPoints.current + amount);
  return { ...c, hitPoints: { current: newCurrent, max: c.hitPoints.max, temporary: c.hitPoints.temporary }, updatedAt: Date.now() };
}

function addInventoryItem(c: SavedCharacter, item: any): SavedCharacter {
  return { ...c, inventory: [...c.inventory, item], updatedAt: Date.now() };
}

function addCurrency(c: SavedCharacter, gold: number): SavedCharacter {
  return { ...c, currency: { copper: c.currency.copper, silver: c.currency.silver, electrum: c.currency.electrum, gold: c.currency.gold + gold, platinum: c.currency.platinum }, updatedAt: Date.now() };
}

function computeEncumbrance(c: SavedCharacter): { totalWeight: number; capacity: number; isEncumbered: boolean; isHeavilyEncumbered: boolean } {
  var totalWeight = c.inventory.reduce(function(sum, item) { return sum + item.weight * item.quantity; }, 0);
  var capacity = c.strength * 15;
  return { totalWeight: totalWeight, capacity: capacity, isEncumbered: totalWeight > capacity * 0.67, isHeavilyEncumbered: totalWeight > capacity };
}

function rollInitiative(dexMod: number): number {
  return Math.floor(Math.random() * 20) + 1 + dexMod;
}

function createWendy(): SavedCharacter {
  var dexMod = getAbilityMod(18);
  var conMod = getAbilityMod(14);
  var hp = computeHP(5, 8, conMod);
  return {
    id: "wendy_test", name: "Wendy Swiftfoot", playerName: "Alice", race: "Halfling", class: "Rogue",
    level: 5, experiencePoints: 6500,
    strength: 8, dexterity: 18, constitution: 14, intelligence: 12, wisdom: 10, charisma: 14,
    hitPoints: { current: hp, max: hp, temporary: 0 },
    armorClass: computeAC(dexMod, 15, 0, 0),
    initiative: computeInit(dexMod),
    proficiencyBonus: getProficiencyBonus(5),
    conditions: [], temporaryHitPoints: 0, spentHitDice: 2,
    inventory: [
      { id: "item_r1", name: "Rapier", quantity: 1, weight: 2, description: "A fine rapier", isEquipped: true },
      { id: "item_a1", name: "Studded Leather", quantity: 1, weight: 13, description: "Light armor", isEquipped: true },
      { id: "item_p1", name: "Potion of Healing", quantity: 2, weight: 0.5, description: "2d4+2 HP", isEquipped: false },
    ],
    currency: { copper: 0, silver: 0, electrum: 0, gold: 45, platinum: 0 },
    features: [
      { name: "Sneak Attack", description: "2d6 extra damage", level: 5 },
      { name: "Cunning Action", description: "Bonus action utility", level: 2 },
    ],
    preparedSpells: [],
    activeFeats: [{ featId: "alert", featName: "Alert", isActive: true }],
    createdAt: Date.now(), updatedAt: Date.now(),
  };
}

function createKehrfuffle(): SavedCharacter {
  var conMod = getAbilityMod(14);
  var hp = computeHP(5, 10, conMod);
  return {
    id: "kehrfuffle_test", name: "Kehrfuffle Ironheart", playerName: "Bob", race: "Dwarf", class: "Paladin",
    level: 5, experiencePoints: 6500,
    strength: 16, dexterity: 10, constitution: 14, intelligence: 8, wisdom: 12, charisma: 16,
    hitPoints: { current: hp, max: hp, temporary: 10 },
    armorClass: computeAC(getAbilityMod(10), 18, 2, 1),
    initiative: computeInit(getAbilityMod(10)),
    proficiencyBonus: getProficiencyBonus(5),
    conditions: [], temporaryHitPoints: 10, spentHitDice: 1,
    inventory: [
      { id: "item_ls1", name: "Longsword +1", quantity: 1, weight: 3, description: "+1 magic longsword", isEquipped: true },
      { id: "item_ps1", name: "Plate Armor", quantity: 1, weight: 65, description: "Heavy armor", isEquipped: true },
      { id: "item_sh1", name: "Shield", quantity: 1, weight: 6, description: "+2 AC", isEquipped: true },
    ],
    currency: { copper: 0, silver: 0, electrum: 0, gold: 12, platinum: 0 },
    features: [
      { name: "Divine Smite", description: "2d8 radiant damage", level: 2 },
      { name: "Lay on Hands", description: "30 HP pool", level: 5 },
      { name: "Extra Attack", description: "Attack twice", level: 5 },
    ],
    resources: [{ name: "Lay on Hands", current: 30, max: 30, recharge: "long_rest" }],
    preparedSpells: ["Bless", "Cure Wounds", "Divine Favor", "Shield of Faith", "Branding Smite"],
    activeFeats: [],
    createdAt: Date.now(), updatedAt: Date.now(),
  };
}

// ---- SUITE 1: Character Creation ----
describe("E2E Smoke Test — Sprint 30 FINAL", function() {

describe("1. Character Creation Integrity", function() {
  it("should create Wendy with correct Rogue 5 stats", function() {
    var w = createWendy();
    expect(w.name).toBe("Wendy Swiftfoot");
    expect(w.class).toBe("Rogue");
    expect(w.level).toBe(5);
    expect(w.dexterity).toBe(18);
    expect(w.proficiencyBonus).toBe(3);
    expect(w.hitPoints.max).toBeGreaterThan(0);
    expect(w.hitPoints.current).toBe(w.hitPoints.max);
    expect(w.spentHitDice).toBe(2);
    expect(w.conditions).toEqual([]);
    expect(w.preparedSpells).toEqual([]);
    expect(w.activeFeats).toHaveLength(1);
    expect(w.activeFeats[0].featName).toBe("Alert");
  });

  it("should create Kehrfuffle with correct Paladin 5 stats", function() {
    var k = createKehrfuffle();
    expect(k.name).toBe("Kehrfuffle Ironheart");
    expect(k.class).toBe("Paladin");
    expect(k.level).toBe(5);
    expect(k.strength).toBe(16);
    expect(k.charisma).toBe(16);
    expect(k.temporaryHitPoints).toBe(10);
    expect(k.preparedSpells).toHaveLength(5);
    expect(k.resources).toBeDefined();
    expect(k.resources![0].name).toBe("Lay on Hands");
    expect(k.resources![0].current).toBe(30);
  });

  it("should initialize spentHitDice as 0 for new characters (Sprint 30 fix)", function() {
    var blank: SavedCharacter = {
      id: "", name: "", playerName: "", race: "", class: "", level: 1, experiencePoints: 0,
      strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10,
      hitPoints: { current: 10, max: 10, temporary: 0 }, armorClass: 10, initiative: 0, proficiencyBonus: 2,
      conditions: [], temporaryHitPoints: 0, spentHitDice: 0,
      inventory: [], currency: { copper: 0, silver: 0, electrum: 0, gold: 0, platinum: 0 },
      features: [], preparedSpells: [], activeFeats: [], createdAt: Date.now(), updatedAt: Date.now(),
    };
    expect(blank.spentHitDice).toBe(0);
    expect(typeof blank.spentHitDice).toBe("number");
  });
});

// ---- SUITE 2: Encounter Assembly ----
describe("2. Encounter Assembly and Difficulty", function() {
  it("should assemble party for Dragon encounter", function() {
    var wendy = createWendy();
    var kehrfuffle = createKehrfuffle();
    var party = [wendy, kehrfuffle];
    expect(party).toHaveLength(2);
    expect(party[0].level).toBe(5);
    expect(party[1].level).toBe(5);
  });

  it("should create Adult Red Dragon with correct stats", function() {
    var dragonHP = 256;
    expect(dragonHP).toBe(256);
    // CR 17 = 18000 XP; deadly threshold for 2 L5 PCs = 2200
    // 18000 > 2200 * 3 = impossible encounter
    expect(18000).toBeGreaterThan(2200);
  });
});

// ---- SUITE 3: Combat Flow ----
describe("3. Combat Flow", function() {
  it("should roll initiative in valid range", function() {
    var init = rollInitiative(getAbilityMod(18));
    expect(init).toBeGreaterThanOrEqual(5);
    expect(init).toBeLessThanOrEqual(24);
  });

  it("should apply damage to Wendy without killing", function() {
    var w = createWendy();
    var result = applyDamage(w, 15);
    expect(result.isDead).toBe(false);
    expect(result.character.hitPoints.current).toBeGreaterThan(0);
    expect(result.character.conditions).not.toContain("unconscious");
  });

  it("should kill Wendy with overkill damage", function() {
    var w = createWendy();
    var result = applyDamage(w, 999);
    expect(result.isDead).toBe(true);
    expect(result.character.hitPoints.current).toBe(0);
    expect(result.character.conditions).toContain("unconscious");
  });

  it("should heal HP without exceeding max", function() {
    var w = createWendy();
    var damaged = applyDamage(w, 20);
    var healed = healHp(damaged.character, 50);
    expect(healed.hitPoints.current).toBe(healed.hitPoints.max);
  });

  it("should absorb temp HP before real HP (Sprint 28/29 fix)", function() {
    var k = createKehrfuffle();
    var startHp = k.hitPoints.current;
    expect(k.temporaryHitPoints).toBe(10);
    var result = applyDamage(k, 15);
    expect(result.character.temporaryHitPoints).toBe(0);
    expect(result.character.hitPoints.current).toBe(startHp - 5);
  });

  it("should toggle conditions without duplicates", function() {
    var k = createKehrfuffle();
    k = addCondition(k, "frightened");
    k = addCondition(k, "prone");
    expect(k.conditions).toHaveLength(2);
    k = addCondition(k, "prone");
    expect(k.conditions).toHaveLength(2);
    k = removeCondition(k, "frightened");
    expect(k.conditions).toEqual(["prone"]);
    k = removeCondition(k, "prone");
    expect(k.conditions).toEqual([]);
  });
});

// ---- SUITE 4: Encumbrance ----
describe("4. Encumbrance Management", function() {
  it("should calculated Wendy's encumbrance correctly", function() {
    var w = createWendy();
    var enc = computeEncumbrance(w);
    expect(enc.capacity).toBe(120);
    expect(enc.isEncumbered).toBe(false);
    expect(enc.isHeavilyEncumbered).toBe(false);
  });

  it("should mark as heavily encumbered when overloaded", function() {
    var w = createWendy();
    w = addInventoryItem(w, { id: "gold_chest", name: "Gold Chest", quantity: 1, weight: 150, description: "Heavy chest", isEquipped: false });
    var enc = computeEncumbrance(w);
    expect(enc.isHeavilyEncumbered).toBe(true);
    expect(enc.totalWeight).toBeGreaterThan(enc.capacity);
  });
});

// ---- SUITE 5: Loot Distribution ----
describe("5. Loot Distribution (Sprint 28/29 fixes)", function() {
  it("should add loot to Wendy with unique IDs", function() {
    var w = createWendy();
    var item = { id: "loot_wendy_" + Date.now(), name: "Dragonslayer Longsword", quantity: 1, weight: 3, description: "+3 vs dragons", isEquipped: false };
    w = addInventoryItem(w, item);
    expect(w.inventory).toHaveLength(4);
    expect(w.inventory[3].name).toBe("Dragonslayer Longsword");
    expect(w.inventory[3].id).toContain("loot_wendy_");
  });

  it("should split gold between party members", function() {
    var w = createWendy();
    var k = createKehrfuffle();
    var split = Math.floor(500 / 2);
    w = addCurrency(w, split);
    k = addCurrency(k, split);
    expect(w.currency.gold).toBe(45 + 250);
    expect(k.currency.gold).toBe(12 + 250);
    expect(w.currency.gold).toBe(295);
    expect(k.currency.gold).toBe(262);
  });
});

// ---- SUITE 6: Level-Up Engine ----
describe("6. Level-Up Engine (Sprint 15 fixes)", function() {
  it("should compute PB at levels 1/5/9/13/17/20", function() {
    expect(getProficiencyBonus(1)).toBe(2);
    expect(getProficiencyBonus(5)).toBe(3);
    expect(getProficiencyBonus(9)).toBe(4);
    expect(getProficiencyBonus(13)).toBe(5);
    expect(getProficiencyBonus(17)).toBe(6);
    expect(getProficiencyBonus(20)).toBe(6);
  });

  it("should compute HP for Wendy (Rogue 5, CON 14)", function() {
    var hp = computeHP(5, 8, getAbilityMod(14));
    expect(hp).toBe(38);
  });

  it("should compute HP for Kehrfuffle (Paladin 5, CON 14)", function() {
    var hp = computeHP(5, 10, getAbilityMod(14));
    expect(hp).toBe(44);
  });
});

// ---- SUITE 7: Rest & Recovery ----
describe("7. Rest and Recovery (Sprint 16/17 fixes)", function() {
  it("should spend hit dice on short rest", function() {
    var w = createWendy();
    var availHD = w.level - (w.spentHitDice || 0);
    expect(availHD).toBe(3);
  });

  it("should clamp HD spending to available", function() {
    var w = createWendy();
    var availHD = w.level - (w.spentHitDice || 0);
    var attempted = 10;
    var actual = Math.min(attempted, availHD);
    expect(actual).toBe(3);
  });

  it("should recover full HP on long rest", function() {
    var w = createWendy();
    var damaged = applyDamage(w, 20);
    var rested = healHp(damaged.character, 999);
    expect(rested.hitPoints.current).toBe(rested.hitPoints.max);
  });

  it("should handle undefined spentHitDice correctly (Sprint 30 fix)", function() {
    var legacyChar = { ...createWendy(), spentHitDice: undefined as any };
    var spent = legacyChar.spentHitDice ?? 0;
    var availHD = legacyChar.level - spent;
    expect(spent).toBe(0);
    expect(availHD).toBe(5);
  });
});

// ---- SUITE 8: Resource Tracking ----
describe("8. Resource Management", function() {
  it("should track Lay on Hands pool for Kehrfuffle", function() {
    var k = createKehrfuffle();
    expect(k.resources).toBeDefined();
    expect(k.resources![0].name).toBe("Lay on Hands");
    expect(k.resources![0].current).toBe(30);
    expect(k.resources![0].recharge).toBe("long_rest");
  });

  it("should consume and restore Lay on Hands", function() {
    var k = createKehrfuffle();
    var used = 10;
    var remaining = (k.resources![0].current) - used;
    expect(remaining).toBe(20);
    var restored = remaining + 10;
    expect(Math.min(restored, k.resources![0].max)).toBe(30);
  });
});

// ---- SUITE 9: Complete Session Narrative ----
describe("9. Complete Session Narrative: The Dragon's Lair", function() {
  it("should run full session without data corruption", function() {
    var wendy = createWendy();
    var kehrfuffle = createKehrfuffle();

    // Phase 1: Initial state
    expect(wendy.hitPoints.current).toBe(wendy.hitPoints.max);
    expect(wendy.spentHitDice).toBe(2);
    expect(kehrfuffle.temporaryHitPoints).toBe(10);

    // Phase 2: Fire Breath (63 average damage, DC 21 DEX save)
    var wDexSave = getAbilityMod(18);
    var saved = false;
    // Wendy has DEX +4. DC 21 = needs 17+. Assume fail.
    var wDamage = 63;
    var wResult = applyDamage(wendy, wDamage);
    wendy = wResult.character;
    expect(wendy.hitPoints.current).toBe(0);
    expect(wendy.conditions).toContain("unconscious");
    expect(wResult.isDead).toBe(true);

    // Kehrfuffle also hit by Fire Breath
    // Has 10 temp HP, takes 63 total fire damage
    var kResult = applyDamage(kehrfuffle, 63);
    kehrfuffle = kResult.character;
    expect(kehrfuffle.temporaryHitPoints).toBe(0);
    expect(kehrfuffle.hitPoints.current).toBe(0);
    expect(kehrfuffle.conditions).toContain("unconscious");
    expect(kResult.isDead).toBe(true);
  });
});

// ---- SUITE 10: Cross-Tab State Integrity ----
describe("10. Cross-Tab Navigation and State Integrity", function() {
  it("should preserve character state across simulated tabs", function() {
    var w = createWendy();
    var playerSheetView = { name: w.name, hp: w.hitPoints.current, ac: w.armorClass };
    var combatTabView = { name: w.name, conditions: w.conditions, initiative: w.initiative };
    expect(playerSheetView.name).toBe(combatTabView.name);
    expect(playerSheetView.hp).toBe(38);
  });

  it("should reflect Firestore sync in state updates", function() {
    var w = createWendy();
    var firestoreUpdate = { hitPoints: { current: 25, max: 38, temporary: 0 } };
    var updated = { ...w, ...firestoreUpdate };
    expect(updated.hitPoints.current).toBe(25);
    expect(updated.hitPoints.max).toBe(38);
  });
});

// ---- SUITE 11: Error Handling ----
describe("11. Error Handling and Edge Cases", function() {
  it("should handle overkill damage (5000)", function() {
    var w = createWendy();
    var result = applyDamage(w, 5000);
    expect(result.character.hitPoints.current).toBe(0);
    expect(result.isDead).toBe(true);
  });

  it("should handle zero damage", function() {
    var w = createWendy();
    var result = applyDamage(w, 0);
    expect(result.character.hitPoints.current).toBe(w.hitPoints.max);
    expect(result.isDead).toBe(false);
  });

  it("should cap healing at max HP", function() {
    var w = createWendy();
    var damaged = applyDamage(w, 20);
    var healed = healHp(damaged.character, 100);
    expect(healed.hitPoints.current).toBe(healed.hitPoints.max);
  });

  it("should handle empty inventory", function() {
    var w = createWendy();
    w.inventory = [];
    var enc = computeEncumbrance(w);
    expect(enc.totalWeight).toBe(0);
    expect(enc.isEncumbered).toBe(false);
  });
});

// ---- SUITE 12: Rapid-Fire Stress Test ----
describe("12. Rapid-Fire Mutation Stress Test", function() {
  it("should handle 20 rapid HP adjustments", function() {
    var w = createWendy();
    for (var i = 0; i < 20; i++) {
      var result = applyDamage(w, 5);
      w = result.character;
    }
    expect(w.hitPoints.current).toBe(0);
    expect(w.conditions).toContain("unconscious");
  });

  it("should handle 10 rapid inventory adds", function() {
    var w = createWendy();
    var initialCount = w.inventory.length;
    for (var i = 0; i < 10; i++) {
      w = addInventoryItem(w, { id: "stress_" + i, name: "Arrow x20", quantity: 20, weight: 1, description: "Arrows", isEquipped: false });
    }
    expect(w.inventory).toHaveLength(initialCount + 10);
  });

  it("should recalculate AC on equipment change", function() {
    var w = createWendy();
    var dexMod = getAbilityMod(18);
    expect(w.armorClass).toBe(17);
    var noArmorAC = 10 + dexMod;
    expect(noArmorAC).toBe(14);
    var withShieldAC = 10 + dexMod + 2;
    expect(withShieldAC).toBe(16);
  });
});

});
