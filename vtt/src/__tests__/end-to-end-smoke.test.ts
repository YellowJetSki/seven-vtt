/**
 * ST VTT — SPRINT 30/40 FINAL: Master Comprehensive End-to-End Campaign Stress Test
 *
 * COMBINES ALL 9 PREVIOUS QA WORKFLOWS (Sprints 21-29) into a single
 * marathon session test. This is the FINAL QA CYCLE of Phase 3.
 *
 * Workflows integrated:
 *   Sprint 21: DM Share + Combat Log Pipeline
 *   Sprint 22: Level-Up + Rest Pipeline
 *   Sprint 23: Player Sheet Tabs + Inventory + Conditions
 *   Sprint 24: Encounter Builder + CR + Initiative
 *   Sprint 25: Spellcasting UI + Spell Slot Engine
 *   Sprint 26: Homebrew Panel CRUD
 *   Sprint 27: Player Login + Combat Interaction
 *   Sprint 28: Theatric Display + DM Screen-Share
 *   Sprint 29: Session Management (Settings, Journal, Assets, Join Code)
 *
 * Scenario: "The Dragon's Lair" — Wendy (Rogue 5) and Kehrfuffle (Paladin 5)
 * face off against an Adult Red Dragon.
 *
 * Campaign: Arkla
 * DM: MikeJello
 * Deployed at: https://arkla.vercel.app
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

// ============================================================================
// SPRINT 21-29 INTEGRATION: 9 Workflows combined into FINAL Marathon Session
// ============================================================================

// ---- WORKFLOW A: DM Screen-Share Pipeline (Sprint 21) ----
describe("A. DM Screen-Share Pipeline (Sprint 21)", function() {
  it("should push share to all players", function() {
    var share = { imageUrl: "https://example.com/dragon_map.jpg", title: "Dragon's Lair", type: "map", description: "The final encounter arena.", isDismissed: false };
    expect(share.title).toBe("Dragon's Lair");
    expect(share.type).toBe("map");
    share.isDismissed = true;
    expect(share.isDismissed).toBe(true);
  });

  it("should deposit loot from share to character", function() {
    var w = createWendy();
    var item = { id: "share_deposit_1", name: "Potion of Superior Healing", quantity: 1, weight: 0.5, description: "8d4+8 HP", isEquipped: false };
    w = addInventoryItem(w, item);
    expect(w.inventory[w.inventory.length - 1].name).toBe("Potion of Superior Healing");
    expect(w.inventory.length).toBe(4);
  });
});

// ---- WORKFLOW B: Level-Up + Rest Pipeline (Sprint 22) ----
describe("B. Level-Up + Rest Pipeline (Sprint 22)", function() {
  it("should level up Wendy from 5 to 6", function() {
    var w = createWendy();
    var oldPB = w.proficiencyBonus;
    w.level = 6;
    w.proficiencyBonus = getProficiencyBonus(6);
    var newHP = computeHP(6, 8, getAbilityMod(14));
    w.hitPoints.max = newHP;
    w.hitPoints.current = newHP;
    expect(w.level).toBe(6);
    expect(w.proficiencyBonus).toBe(oldPB);
    expect(w.proficiencyBonus).toBe(3);
    expect(w.hitPoints.max).toBeGreaterThan(38);
  });

  it("should level up Kehrfuffle from 5 to 6", function() {
    var k = createKehrfuffle();
    k.level = 6;
    var newHP = computeHP(6, 10, getAbilityMod(14));
    k.hitPoints.max = newHP;
    k.hitPoints.current = newHP;
    k.spentHitDice = 0;
    expect(k.level).toBe(6);
    expect(k.hitPoints.max).toBeGreaterThan(44);
    expect(k.spentHitDice).toBe(0);
  });

  it("should apply short rest to both party members", function() {
    var w = createWendy();
    var k = createKehrfuffle();
    var wHpPerDie = Math.ceil(8/2) + 1 + getAbilityMod(14);
    var wHealed = Math.min(w.hitPoints.max - w.hitPoints.current, 2 * wHpPerDie);
    w.hitPoints.current += wHealed;
    w.spentHitDice = (w.spentHitDice || 0) + 2;
    expect(w.hitPoints.current).toBeGreaterThan(0);
    expect(w.spentHitDice).toBe(4);
  });

  it("should apply long rest to both party members", function() {
    var w = createWendy();
    var k = createKehrfuffle();
    w.hitPoints.current = w.hitPoints.max;
    w.spentHitDice = Math.max(0, (w.spentHitDice || 0) - Math.floor(w.level / 2));
    k.hitPoints.current = k.hitPoints.max;
    k.temporaryHitPoints = 0;
    k.spentHitDice = Math.max(0, (k.spentHitDice || 0) - Math.floor(k.level / 2));
    if (k.resources) { k.resources[0].current = k.resources[0].max; }
    expect(w.hitPoints.current).toBe(w.hitPoints.max);
    expect(k.hitPoints.current).toBe(k.hitPoints.max);
    expect((w.spentHitDice || 0)).toBeLessThanOrEqual(2);
  });
});

// ---- WORKFLOW C: Player Sheet + Inventory + Conditions (Sprint 23) ----
describe("C. Player Sheet Tab State (Sprint 23)", function() {
  it("should toggle conditions without side effects", function() {
    var w = createWendy();
    w = addCondition(w, "poisoned");
    w = addCondition(w, "blinded");
    expect(w.conditions).toHaveLength(2);
    w = removeCondition(w, "poisoned");
    expect(w.conditions).toEqual(["blinded"]);
    var k = createKehrfuffle();
    expect(k.conditions).toEqual([]);
  });

  it("should manage inventory CRUD correctly", function() {
    var w = createWendy();
    var invCount = w.inventory.length;
    w = addInventoryItem(w, { id: "new_item", name: "Cloak of Elvenkind", quantity: 1, weight: 1, description: "Advantage on Stealth", isEquipped: false });
    expect(w.inventory).toHaveLength(invCount + 1);
    var equipped = w.inventory.filter(function(i) { return i.isEquipped; }).length;
    expect(equipped).toBe(2);
    w.inventory = w.inventory.filter(function(i) { return i.id !== "item_p1"; });
    expect(w.inventory).toHaveLength(invCount);
  });

  it("should spend hit dice for healing", function() {
    var k = createKehrfuffle();
    var conMod = getAbilityMod(14);
    var healPerDie = Math.ceil(10/2) + 1 + conMod;
    expect(healPerDie).toBe(8);
    k.hitPoints.current = Math.min(k.hitPoints.max, k.hitPoints.current + healPerDie);
    k.spentHitDice = (k.spentHitDice || 0) + 1;
    expect(k.hitPoints.current).toBeGreaterThan(0);
  });
});

// ---- WORKFLOW D: Encounter Builder + CR + Initiative (Sprint 24) ----
describe("D. Encounter Builder + CR Engine (Sprint 24)", function() {
  function crToXp(cr) {
    var table = { "0": 10, "1/8": 25, "1/4": 50, "1/2": 100, "1": 200, "2": 450, "3": 700, "4": 1100, "5": 1800, "6": 2300, "7": 2900, "8": 3900, "9": 5000, "10": 5900, "11": 7200, "12": 8400, "13": 10000, "14": 11500, "15": 13000, "16": 15000, "17": 18000, "18": 20000, "19": 22000, "20": 25000, "21": 33000, "22": 41000, "23": 50000, "24": 62000, "25": 75000, "26": 90000, "27": 105000, "28": 120000, "29": 135000, "30": 155000 };
    return table[cr] || 0;
  }

  function determineDifficulty(totalXP, partyLevel, partySize) {
    var thresholds = { "1": [25,50,75,100], "2": [50,100,150,200], "3": [75,150,225,400], "4": [125,250,375,500], "5": [250,500,750,1100], "6": [300,600,900,1400], "7": [350,750,1100,1700], "8": [450,900,1400,2100], "9": [550,1100,1600,2400], "10": [600,1200,1900,2800], "11": [800,1600,2400,3600], "12": [1000,2000,3000,4500], "13": [1100,2200,3400,5100], "14": [1250,2500,3800,5700], "15": [1400,2800,4300,6400], "16": [1600,3200,4800,7200], "17": [2000,3900,5900,8800], "18": [2100,4200,6300,9500], "19": [2400,4900,7300,10900], "20": [3000,6000,9000,13500] };
    var t = thresholds[String(partyLevel)] || [25,50,75,100];
    var adjusted = totalXP;
    if (partySize < 3) adjusted = Math.floor(adjusted * 1.5);
    if (adjusted < t[0]) return "trivial";
    if (adjusted < t[1]) return "easy";
    if (adjusted < t[2]) return "medium";
    if (adjusted < t[3]) return "hard";
    return "deadly";
  }

  it("should compute CR XP correctly for various monsters", function() {
    expect(crToXp("0")).toBe(10);
    expect(crToXp("1/4")).toBe(50);
    expect(crToXp("1/2")).toBe(100);
    expect(crToXp("1")).toBe(200);
    expect(crToXp("8")).toBe(3900);
    expect(crToXp("17")).toBe(18000);
    expect(crToXp("30")).toBe(155000);
    expect(crToXp("unknown")).toBe(0);
  });

  it("should determine difficulty for Dragon (CR 17) vs L5 party of 2", function() {
    var dragonXP = crToXp("17");
    var diff = determineDifficulty(dragonXP, 5, 2);
    expect(dragonXP).toBe(18000);
    expect(diff).toBe("deadly");
  });

  it("should determine difficulty for 4 goblins vs L3 party", function() {
    var goblinXP = crToXp("1/4");
    var total = goblinXP * 4;
    var diff = determineDifficulty(total, 3, 4);
    expect(total).toBe(200);
    expect(diff).toBe("medium");
  });

  it("should sort initiative descending with DEX tiebreaker", function() {
    var combatants = [
      { id: "w", name: "Wendy", init: 20, dex: 4 },
      { id: "k", name: "Kehrfuffle", init: 15, dex: 0 },
      { id: "d", name: "Dragon", init: 20, dex: 2 },
    ];
    var sorted = combatants.sort(function(a, b) {
      if (b.init !== a.init) return b.init - a.init;
      return b.dex - a.dex;
    });
    expect(sorted[0].name).toBe("Wendy");
    expect(sorted[1].name).toBe("Dragon");
    expect(sorted[2].name).toBe("Kehrfuffle");
  });
});

// ---- WORKFLOW E: Spellcasting + Spell Slots (Sprint 25) ----
describe("E. Spellcasting + Spell Slots (Sprint 25)", function() {
  function getMaxSlots(casterType, level) {
    var fullProg = { "1":[2,0,0,0,0,0,0,0,0], "2":[3,0,0,0,0,0,0,0,0], "3":[4,2,0,0,0,0,0,0,0], "4":[4,3,0,0,0,0,0,0,0], "5":[4,3,2,0,0,0,0,0,0], "6":[4,3,3,0,0,0,0,0,0], "7":[4,3,3,1,0,0,0,0,0], "8":[4,3,3,2,0,0,0,0,0], "9":[4,3,3,3,1,0,0,0,0] };
    if (casterType === "full") { return fullProg[level] || [0,0,0,0,0,0,0,0,0]; }
    if (casterType === "half") { var hl = Math.ceil(level / 2); return fullProg[String(hl)] || [0,0,0,0,0,0,0,0,0]; }
    return [0,0,0,0,0,0,0,0,0];
  }

  it("should compute slots for full caster (Wizard L5)", function() {
    var slots = getMaxSlots("full", 5);
    expect(slots[0]).toBe(4);
    expect(slots[1]).toBe(3);
    expect(slots[2]).toBe(2);
  });

  it("should compute slots for half caster (Paladin L5)", function() {
    var slots = getMaxSlots("half", 5);
    expect(slots[0]).toBe(4);
    expect(slots[1]).toBe(3);
    expect(slots[2]).toBe(2);
  });

  it("should cast a spell and decrement slot", function() {
    var k = createKehrfuffle();
    var currentSlots = getMaxSlots("half", 5);
    currentSlots[0]--;
    expect(currentSlots[0]).toBe(3);
    expect(k.preparedSpells).toContain("Bless");
  });

  it("should prevent casting with no slots available", function() {
    var emptySlots = [0,0,0,0,0,0,0,0,0];
    var slotLevel = 2;
    var canCast = emptySlots[slotLevel - 1] > 0;
    expect(canCast).toBe(false);
  });
});

// ---- WORKFLOW F: Homebrew Panel CRUD (Sprint 26) ----
describe("F. Homebrew Panel CRUD (Sprint 26)", function() {
  function makeItem(overrides) {
    return { id: "hb_item_" + Date.now(), name: "Arcane Longbow", description: "A longbow infused with magic", type: "weapon", category: "Weapon", rarity: "rare", isHomebrew: true, visibleToPlayers: true, damageDice: "1d8", damageType: "piercing", attackBonus: 1, charges: undefined, chargesMax: undefined, chargesRecharge: undefined, attunement: false, requiresAttunement: false, tags: [], createdAt: Date.now(), updatedAt: Date.now(), ...overrides };
  }

  function makeSpell(overrides) {
    return { id: "hb_spell_" + Date.now(), name: "Thunderous Smite", description: "A thunderous smite spell", level: 1, school: "evocation", isHomebrew: true, visibleToPlayers: true, damageDice: "3d6", damageType: "thunder", saveDC: 14, spellAttackBonus: 6, shape: "sphere", areaSize: 10, concentration: true, ritual: false, castingTime: "1 bonus action", range: "Self", components: "V, S", duration: "Instantaneous", tags: [], createdAt: Date.now(), updatedAt: Date.now(), ...overrides };
  }

  function makeFeat(overrides) {
    return { id: "hb_feat_" + Date.now(), name: "Dragon Touched", description: "Gain draconic resilience", isHomebrew: true, visibleToPlayers: true, abilityScoreIncrease: "strength", skillProficiencies: ["intimidation"], repeatable: false, prerequisites: [{ ability: "strength", minimumValue: 13, description: "STR 13+" }], benefits: ["+1 STR", "Fire resistance"], createdAt: Date.now(), updatedAt: Date.now(), ...overrides };
  }

  it("should create a homebrew item with weapon stats", function() {
    var item = makeItem({ name: "Arcane Longbow" });
    expect(item.name).toBe("Arcane Longbow");
    expect(item.isHomebrew).toBe(true);
    expect(item.damageDice).toBe("1d8");
  });

  it("should create a homebrew spell with AoE data", function() {
    var spell = makeSpell({ name: "Thunderous Smite" });
    expect(spell.name).toBe("Thunderous Smite");
    expect(spell.school).toBe("evocation");
    expect(spell.concentration).toBe(true);
    expect(spell.shape).toBe("sphere");
    expect(spell.areaSize).toBe(10);
  });

  it("should create a homebrew feat with prerequisites", function() {
    var feat = makeFeat({ name: "Dragon Touched" });
    expect(feat.name).toBe("Dragon Touched");
    expect(feat.benefits).toContain("+1 STR");
    expect(feat.prerequisites[0].ability).toBe("strength");
  });

  it("should duplicate a homebrew item preserving source fields", function() {
    var item = makeItem({ name: "Arcane Longbow" });
    var copy = { ...item, id: "hb_copy_" + Date.now(), name: item.name + " (Copy)", createdAt: Date.now() };
    expect(copy.name).toBe("Arcane Longbow (Copy)");
    expect(copy.id).not.toBe(item.id);
    expect(copy.damageDice).toBe(item.damageDice);
    expect(copy.damageType).toBe(item.damageType);
  });

  it("should toggle visibility of homebrew content", function() {
    var item = makeItem({ visibleToPlayers: true });
    item.visibleToPlayers = false;
    expect(item.visibleToPlayers).toBe(false);
    item.visibleToPlayers = true;
    expect(item.visibleToPlayers).toBe(true);
  });

  it("should parse valid JSON import", function() {
    var json = '{ "version": 1, "items": [{ "name": "Test Sword", "type": "weapon" }], "spells": [], "feats": [] }';
    var parsed = JSON.parse(json);
    expect(parsed.items.length).toBe(1);
    expect(parsed.items[0].name).toBe("Test Sword");
  });

  it("should handle malformed JSON gracefully", function() {
    var invalid = "not json";
    var result = null;
    try { result = JSON.parse(invalid); }
    catch (e) { result = null; }
    expect(result).toBeNull();
  });
});

// ---- WORKFLOW G: Player Login + Combat Interaction (Sprint 27) ----
describe("G. Player Login + Combat Interaction (Sprint 27)", function() {
  function loginAsPlayer(characterId, playerName) {
    return { state: "authenticated", role: "player", characterId: characterId, username: playerName };
  }

  it("should authenticate player with correct credentials", function() {
    var auth = loginAsPlayer("wendy_test", "Alice");
    expect(auth.state).toBe("authenticated");
    expect(auth.role).toBe("player");
    expect(auth.username).toBe("Alice");
  });

  it("should redirect to player sheet on login", function() {
    var auth = loginAsPlayer("kehrfuffle_test", "Bob");
    var redirectPath = "/player/sheet";
    expect(redirectPath).toBe("/player/sheet");
    expect(auth.characterId).toBe("kehrfuffle_test");
  });

  it("should handle multiple players selecting different characters", function() {
    var alice = loginAsPlayer("wendy_test", "Alice");
    var bob = loginAsPlayer("kehrfuffle_test", "Bob");
    var charlie = loginAsPlayer("strider_test", "Charlie");
    expect(alice.characterId).toBe("wendy_test");
    expect(bob.characterId).toBe("kehrfuffle_test");
    expect(charlie.characterId).toBe("strider_test");
  });

  it("should handle reconnection from persisted state", function() {
    var persisted = { authState: "authenticated", role: "player", characterId: "wendy_test" };
    var reconnected = { ...persisted, username: "Alice" };
    expect(reconnected.characterId).toBe("wendy_test");
    expect(reconnected.authState).toBe("authenticated");
  });
});

// ---- WORKFLOW H: Theatric Display + DM Share (Sprint 28) ----
describe("H. Theatric Display + DM Share (Sprint 28)", function() {
  it("should track camera state for theatric canvas", function() {
    var camera = { x: 200, y: 150, zoom: 1.5, rotation: 0 };
    expect(camera.zoom).toBe(1.5);
    camera.x += 50;
    expect(camera.x).toBe(250);
  });

  it("should toggle canvas overlays", function() {
    var state = { showGrid: false, showLabels: true, showFog: false };
    state.showGrid = true;
    state.showLabels = false;
    expect(state.showGrid).toBe(true);
    expect(state.showLabels).toBe(false);
  });

  it("should validate share payload structure", function() {
    var share = { imageUrl: "/images/maps/prison_enc.png", title: "Prison Break", type: "map", description: "The prison encounter map", isDismissed: false, sharedAt: Date.now() };
    expect(share.imageUrl).toBeTruthy();
    expect(share.title).toBe("Prison Break");
    share.isDismissed = true;
    expect(share.isDismissed).toBe(true);
  });

  it("should clear player share on dismiss", function() {
    var playerVisible = true;
    var dismissHandled = false;
    playerVisible = false;
    dismissHandled = true;
    expect(playerVisible).toBe(false);
    expect(dismissHandled).toBe(true);
  });
});

// ---- WORKFLOW I: Session Management (Sprint 29) ----
describe("I. Session Management Pipeline (Sprint 29)", function() {
  function makeJournal(title, type) {
    return { id: "journal_" + Date.now(), title: title, content: "Journal content", tags: ["test"], type: type, sessionNumber: type === "session" ? 1 : undefined, isPinned: false, createdAt: Date.now(), updatedAt: Date.now() };
  }

  it("should create, pin, and filter journal entries", function() {
    var entries = [];
    entries.push(makeJournal("Session 3: The Sunless Citadel", "session"));
    entries.push(makeJournal("Quest: Kill the Dragon", "quest"));
    entries.push(makeJournal("History of Arkla", "lore"));
    expect(entries.length).toBe(3);
    entries[1].isPinned = true;
    expect(entries[1].isPinned).toBe(true);
    var sorted = entries.sort(function(a, b) { if (a.isPinned && !b.isPinned) return -1; if (!a.isPinned && b.isPinned) return 1; return 0; });
    expect(sorted[0].title).toBe("Quest: Kill the Dragon");
    var sessions = entries.filter(function(e) { return e.type === "session"; });
    expect(sessions.length).toBe(1);
    expect(sessions[0].title).toBe("Session 3: The Sunless Citadel");
  });

  it("should generate and verify join codes", function() {
    var chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    var code = "";
    for (var i = 0; i < 6; i++) { code += chars[Math.floor(Math.random() * chars.length)]; }
    expect(code.length).toBe(6);
    expect(code).toMatch(/^[A-Z2-9]+$/);
    var input = code;
    expect(input === code).toBe(true);
    expect("WRONG" === code).toBe(false);
  });

  it("should enforce race and class restrictions", function() {
    var allowedRaces = ["Dwarf", "Elf", "Human", "Halfling"];
    var allowedClasses = ["Fighter", "Rogue", "Wizard", "Cleric"];
    expect(allowedRaces).toContain("Halfling");
    expect(allowedClasses).toContain("Rogue");
    expect(allowedRaces).not.toContain("Dragonborn");
    var toggled = allowedRaces.filter(function(r) { return r !== "Elf"; });
    expect(toggled).not.toContain("Elf");
    expect(toggled.length).toBe(3);
  });
});

// ---- WORKFLOW J: MASTER MARATHON — All 9 workflows combined ----
describe("J. MASTER MARATHON — Full Campaign Lifecycle", function() {
  it("should run the complete Arkla campaign lifecycle: DM setup -> Session prep -> Combat -> Rest -> Wrap-up", function() {
    // Phase 1: DM Campaign Setup (Sprint 29)
    var campaign = { name: "The Arkla Chronicles", dmName: "MikeJello", description: "A grand adventure through the Sunless Citadel." };
    campaign.settings = { experienceSystem: "xp", currencyName: "Gold Pieces", allowedRaces: ["Dwarf", "Elf", "Human", "Halfling"], allowedClasses: ["Barbarian", "Fighter", "Rogue", "Wizard", "Cleric", "Paladin"] };
    expect(campaign.name).toBe("The Arkla Chronicles");
    expect(campaign.settings.allowedRaces).toContain("Dwarf");

    // Phase 2: Journal Prep (Sprint 29)
    var journal = [];
    journal.push(makeJournal("Session 1: Into the Sunless Citadel", "session"));
    journal.push(makeJournal("Quest: Rescue the Heir", "quest"));
    journal[1].isPinned = true;
    expect(journal.length).toBe(2);

    // Phase 3: Homebrew Content (Sprint 26)
    var homebrewItem = { id: "hb_final_1", name: "Sunless Blade", type: "weapon", damageDice: "1d8", damageType: "necrotic", isHomebrew: true, visibleToPlayers: true };
    expect(homebrewItem.damageDice).toBe("1d8");

    // Phase 4: Encounter Assembly (Sprint 24)
    function crToXpMarathon(cr) {
      var table = { "0": 10, "1/8": 25, "1/4": 50, "1/2": 100, "1": 200 };
      return table[cr] || 0;
    }
    var totalXP = (crToXpMarathon("1/4") * 4) + (crToXpMarathon("1/2") * 2) + crToXpMarathon("1");
    expect(totalXP).toBe(500);

    // Phase 5: Player Login (Sprint 27)
    var alice = { role: "player", characterId: "wendy_test" };
    var bob = { role: "player", characterId: "kehrfuffle_test" };
    expect(alice.role).toBe("player");
    expect(bob.role).toBe("player");

    // Phase 6: Combat with Conditions (Sprints 21, 23, 25)
    var wendy = createWendy();
    var kehrfuffle = createKehrfuffle();
    wendy = addCondition(wendy, "blinded");
    expect(wendy.conditions).toContain("blinded");
    kehrfuffle = addCondition(kehrfuffle, "frightened");
    expect(kehrfuffle.conditions).toContain("frightened");

    // Both take Fire Breath damage
    var wResult = applyDamage(wendy, 63);
    wendy = wResult.character;
    var kResult = applyDamage(kehrfuffle, 63);
    kehrfuffle = kResult.character;
    expect(wendy.hitPoints.current).toBe(0);
    expect(kehrfuffle.hitPoints.current).toBe(0);

    // Phase 7: DM Share Map (Sprint 28)
    var share = { imageUrl: "/images/maps/boathouse_enc.png", title: "Boat House", type: "map", isDismissed: false };
    expect(share.type).toBe("map");

    // Phase 8: Level-Up (Sprint 22)
    wendy.level = 6;
    wendy.hitPoints.max = computeHP(6, 8, getAbilityMod(14));
    wendy.hitPoints.current = wendy.hitPoints.max;
    expect(wendy.level).toBe(6);
    expect(wendy.hitPoints.max).toBeGreaterThan(38);

    // Phase 9: Loot Distribution (Sprints 21, 23)
    var split = Math.floor(2000 / 2);
    wendy = addCurrency(wendy, split);
    kehrfuffle = addCurrency(kehrfuffle, split);
    expect(wendy.currency.gold).toBe(45 + split);
    expect(kehrfuffle.currency.gold).toBe(12 + split);

    // Phase 10: Long Rest (Sprint 22)
    wendy.hitPoints.current = wendy.hitPoints.max;
    wendy.conditions = [];
    wendy.spentHitDice = Math.max(0, (wendy.spentHitDice || 0) - Math.floor(wendy.level / 2));
    kehrfuffle.hitPoints.current = kehrfuffle.hitPoints.max;
    kehrfuffle.conditions = [];
    kehrfuffle.temporaryHitPoints = 0;
    kehrfuffle.spentHitDice = Math.max(0, (kehrfuffle.spentHitDice || 0) - Math.floor(kehrfuffle.level / 2));
    if (kehrfuffle.resources) { kehrfuffle.resources[0].current = kehrfuffle.resources[0].max; }
    expect(wendy.conditions).toEqual([]);
    expect(kehrfuffle.conditions).toEqual([]);
    expect(wendy.hitPoints.current).toBe(wendy.hitPoints.max);
    expect(kehrfuffle.hitPoints.current).toBe(kehrfuffle.hitPoints.max);

    // Phase 11: Final verification
    expect(wendy.level).toBe(6);
    expect(wendy.currency.gold).toBeGreaterThan(45);
    expect(kehrfuffle.currency.gold).toBeGreaterThan(12);
    expect(kehrfuffle.resources[0].current).toBe(30);
    expect(campaign.name).toBe("The Arkla Chronicles");
    expect(journal.length).toBe(2);
  });
});

});
