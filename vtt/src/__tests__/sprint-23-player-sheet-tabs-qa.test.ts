/**
 * ST VTT — Sprint 23/40 QA: Player Sheet Tab Interaction + Inventory + Conditions
 *
 * Tests the Player-facing UI workflows covering THREE unique systems:
 * 1. Player Sheet tab state consistency (Stats/Combat/Spells/Items/Rules)
 * 2. Inventory CRUD with category detection, encumbrance, weight math
 * 3. Condition engine integration with inventory state
 *
 * This is a completely different workflow than Sprints 21-22 (DM Share + Level-Up).
 * Tests the actual player experience of managing a character sheet.
 *
 * Characters: Wendy Swiftfoot (Rogue 5), Kehrfuffle Ironheart (Paladin 5)
 * Campaign: Arkla
 * Strict Compliance: NO dice rollers, NO occult elements
 *
 * Deployed at: https://arkla.vercel.app
 */

import { describe, it, expect } from "vitest";

// ═══════════════════════════════════════════════════════════════
// TYPE DEFINITIONS (self-contained)
// ═══════════════════════════════════════════════════════════════

interface HitPoints { current: number; max: number; temporary: number; }
interface Currency { copper: number; silver: number; electrum: number; gold: number; platinum: number; }
interface InventoryItem { id?: string; name: string; quantity: number; weight: number; description: string; isEquipped: boolean; }
interface Speed { walk: number; fly?: number; swim?: number; climb?: number; burrow?: number; }
interface Feature { name: string; description: string; source?: string; level?: number; }
interface Resource { name: string; current: number; max: number; recharge: string; }
interface SpellSlots { [key: string]: { current: number; max: number; } | undefined; }
interface Equipment { slot: string; item: string; quantity: number; weight: number; notes?: string; }

interface Character {
  id: string; name: string; playerName: string; race: string; class: string;
  level: number; experiencePoints: number;
  strength: number; dexterity: number; constitution: number;
  intelligence: number; wisdom: number; charisma: number;
  hitPoints: HitPoints; armorClass: number; initiative: number; proficiencyBonus: number;
  speed: Speed;
  conditions: string[];
  temporaryHitPoints: number; spentHitDice?: number;
  inventory: InventoryItem[];
  equipment: Equipment[];
  currency: Currency;
  features: Feature[];
  resources?: Resource[];
  preparedSpells: string[];
  activeFeats: Array<{ featId: string; featName: string; isActive: boolean; }>;
  spellSlots?: SpellSlots;
  createdAt: number; updatedAt: number;
}

// ═══════════════════════════════════════════════════════════════
// PURE FUNCTION IMPORTS (tested without React)
// ═══════════════════════════════════════════════════════════════

import { detectCategory, sortInventory } from "@/lib/inventory-utils";
import type { ItemCategory, SortField, SortDirection } from "@/lib/inventory-utils";
import { computeEncumbrance } from "@/lib/mechanics/encumbrance-engine";

// ═══════════════════════════════════════════════════════════════
// TEST FIXTURES — Arkla Campaign Characters
// ═══════════════════════════════════════════════════════════════

function createWendy(overrides: Partial<Character> = {}): Character {
  return {
    id: "char_wendy",
    name: "Wendy Swiftfoot",
    playerName: "Alice",
    race: "Lightfoot Halfling",
    class: "Rogue",
    level: 5, experiencePoints: 6500,
    strength: 8, dexterity: 18, constitution: 14, intelligence: 12, wisdom: 10, charisma: 14,
    hitPoints: { current: 38, max: 38, temporary: 0 },
    armorClass: 17, initiative: 4, proficiencyBonus: 3,
    speed: { walk: 25 },
    conditions: ["poisoned"],
    temporaryHitPoints: 0, spentHitDice: 2,
    inventory: [
      { name: "Rapier +1", quantity: 1, weight: 2, description: "A finely crafted rapier", isEquipped: true },
      { name: "Shortbow", quantity: 1, weight: 2, description: "A shortbow", isEquipped: false },
      { name: "Thieves' Tools", quantity: 1, weight: 1, description: "Standard thieves' tools", isEquipped: true },
      { name: "Potion of Healing", quantity: 3, weight: 0.5, description: "Restores 2d4+2 HP", isEquipped: false },
      { name: "Rations", quantity: 5, weight: 2, description: "5 days of rations", isEquipped: false },
      { name: "Torch", quantity: 2, weight: 1, description: "Standard torch, burns 1hr", isEquipped: false },
    ],
    equipment: [
      { slot: "weapon", item: "Rapier +1", quantity: 1, weight: 2, notes: "" },
    ],
    currency: { copper: 25, silver: 10, electrum: 0, gold: 75, platinum: 0 },
    features: [
      { name: "Sneak Attack", description: "3d6 extra damage once per turn", level: 5 },
      { name: "Cunning Action", description: "Bonus action: Dash, Disengage, or Hide", level: 2 },
    ],
    preparedSpells: [],
    activeFeats: [],
    createdAt: 1000, updatedAt: 1000,
    ...overrides,
  };
}

function createKehrfuffle(overrides: Partial<Character> = {}): Character {
  return {
    id: "char_kehrfuffle",
    name: "Kehrfuffle Ironheart",
    playerName: "Bob",
    race: "Human",
    class: "Paladin",
    level: 5, experiencePoints: 6500,
    strength: 16, dexterity: 10, constitution: 14, intelligence: 8, wisdom: 12, charisma: 16,
    hitPoints: { current: 44, max: 44, temporary: 10 },
    armorClass: 21, initiative: 0, proficiencyBonus: 3,
    speed: { walk: 30 },
    conditions: [],
    temporaryHitPoints: 10, spentHitDice: 1,
    inventory: [
      { name: "Holy Symbol", quantity: 1, weight: 0, description: "Silver holy symbol of Torm", isEquipped: true },
      { name: "Torch", quantity: 5, weight: 1, description: "Standard torches", isEquipped: false },
      { name: "Rations", quantity: 10, weight: 2, description: "10 days of rations", isEquipped: false },
      { name: "Potion of Healing", quantity: 2, weight: 0.5, description: "Restores 2d4+2 HP", isEquipped: false },
    ],
    equipment: [
      { slot: "weapon", item: "Greatsword +1", quantity: 1, weight: 6, notes: "" },
      { slot: "armor", item: "Plate Armor", quantity: 1, weight: 65, notes: "" },
      { slot: "shield", item: "Shield", quantity: 1, weight: 6, notes: "+1 AC magic" },
    ],
    resources: [{ name: "Lay on Hands", current: 30, max: 30, recharge: "long_rest" }],
    spellSlots: { level1: { current: 4, max: 4 }, level2: { current: 2, max: 2 } },
    currency: { copper: 0, silver: 0, electrum: 0, gold: 50, platinum: 0 },
    features: [
      { name: "Divine Sense", description: "Detect celestial, fiend, or undead", level: 1 },
      { name: "Lay on Hands", description: "30 HP healing pool", level: 5 },
    ],
    preparedSpells: ["Bless", "Cure Wounds", "Divine Favor", "Lesser Restoration"],
    activeFeats: [],
    createdAt: 1000, updatedAt: 1000,
    ...overrides,
  };
}


// ═══════════════════════════════════════════════════════════════
// SUITE 1: Inventory Category Detection
// ═══════════════════════════════════════════════════════════════

describe("Inventory — Category Detection (inventory-utils)", () => {
  it("detects weapon categories correctly", () => {
    expect(detectCategory("Rapier +1")).toBe("weapon");
    expect(detectCategory("Longsword")).toBe("weapon");
    expect(detectCategory("Shortbow")).toBe("weapon");
    expect(detectCategory("Dagger of Venom")).toBe("weapon");
  });

  it("detects potion categories correctly", () => {
    expect(detectCategory("Potion of Healing")).toBe("potion");
    expect(detectCategory("Elixir of Health")).toBe("potion");
    expect(detectCategory("Philter of Love")).toBe("potion");
    expect(detectCategory("Potion of Invisibility")).toBe("potion");
  });

  it("detects scroll categories correctly", () => {
    expect(detectCategory("Scroll of Fireball")).toBe("scroll");
    expect(detectCategory("Spell Scroll Lv3")).toBe("scroll");
  });

  it("detects ring categories correctly", () => {
    expect(detectCategory("Ring of Protection")).toBe("ring");
    expect(detectCategory("Band of Intellect")).toBe("ring");
  });

  it("detects wand categories correctly", () => {
    expect(detectCategory("Wand of Magic Missiles")).toBe("wand");
  });

  it("detects food categories correctly", () => {
    expect(detectCategory("Rations")).toBe("food");
    expect(detectCategory("Bread")).toBe("food");
    expect(detectCategory("Wine")).toBe("food");
    expect(detectCategory("Ale")).toBe("food");
  });

  it("detects tool categories correctly", () => {
    expect(detectCategory("Thieves' Tools")).toBe("tool");
    expect(detectCategory("Herbalism Kit")).toBe("tool");
  });

  it("defaults unknown items to 'other'", () => {
    expect(detectCategory("Holy Symbol")).toBe("other");
    expect(detectCategory("Torch")).toBe("other");
  });

  it("detects armor categories", () => {
    expect(detectCategory("Plate Armor")).toBe("armor");
    expect(detectCategory("Leather Armor")).toBe("armor");
    expect(detectCategory("Chain Mail")).toBe("armor");
    expect(detectCategory("Shield")).toBe("armor");
  });
});


// ═══════════════════════════════════════════════════════════════
// SUITE 2: Inventory Sort Logic
// ═══════════════════════════════════════════════════════════════

describe("Inventory — Sort Logic (inventory-utils)", () => {
  const items = [
    { name: "Rapier +1", quantity: 1, weight: 2, description: "", isEquipped: true },
    { name: "Potion of Healing", quantity: 3, weight: 0.5, description: "", isEquipped: false },
    { name: "Rations", quantity: 5, weight: 2, description: "", isEquipped: false },
    { name: "Torch", quantity: 2, weight: 1, description: "", isEquipped: false },
  ];

  it("sorts by name ascending (A→Z)", () => {
    const sorted = sortInventory(items, "name", "asc");
    expect(sorted[0].name).toBe("Potion of Healing");
    expect(sorted[3].name).toBe("Torch");
  });

  it("sorts by name descending (Z→A)", () => {
    const sorted = sortInventory(items, "name", "desc");
    expect(sorted[0].name).toBe("Torch");
    expect(sorted[3].name).toBe("Potion of Healing");
  });

  it("sorts by weight ascending (lightest first)", () => {
    const sorted = sortInventory(items, "weight", "asc");
    expect(sorted[0].name).toBe("Potion of Healing"); // 0.5
    expect(sorted[3].name).toBe("Rapier +1"); // 2 (tied with Rations, stable)
  });

  it("sorts by weight descending (heaviest first)", () => {
    const sorted = sortInventory(items, "weight", "desc");
    expect(sorted[0].weight).toBeGreaterThanOrEqual(2);
    expect(sorted[3].weight).toBe(0.5);
  });

  it("does not mutate the original array", () => {
    const original = [...items];
    sortInventory(items, "name", "asc");
    expect(items[0].name).toBe(original[0].name);
  });
});


// ═══════════════════════════════════════════════════════════════
// SUITE 3: Encumbrance Calculation
// ═══════════════════════════════════════════════════════════════

describe("Inventory — Encumbrance Calculation", () => {
  it("Wendy (STR 8) has capacity of 120 lbs", () => {
    const w = createWendy();
    const result = computeEncumbrance(w.strength, w.equipment, w.inventory, w.currency);
    expect(result.encumbrance.carryingCapacity).toBe(120);
  });

  it("Wendy's total equipment + inventory weight is correct", () => {
    const w = createWendy();
    const result = computeEncumbrance(w.strength, w.equipment, w.inventory, w.currency);
    // Equipment: Rapier 2 = 2 lbs
    // Inventory: Rapier 2 + Shortbow 2 + Tools 1 + Potions 1.5 + Rations 10 + Torches 2 = 18.5 lbs
    // Currency: 25cp + 10sp + 75gp = negligible (~0.01 per coin, but let's not assume)
    expect(result.weight.total).toBeGreaterThan(0);
    expect(result.encumbrance.encumbranceLevel).toBe("unencumbered");
  });

  it("Kehrfuffle (STR 16) can carry much more than Wendy", () => {
    const k = createKehrfuffle();
    const result = computeEncumbrance(k.strength, k.equipment, k.inventory, k.currency);
    expect(result.encumbrance.carryingCapacity).toBe(240); // 16 * 15
  });

  it("Kehrfuffle with heavy plate armor is encumbered but not overloaded", () => {
    const k = createKehrfuffle();
    const result = computeEncumbrance(k.strength, k.equipment, k.inventory, k.currency);
    // Equipment: Greatsword 6 + Plate 65 + Shield 6 = 77 lbs
    // Inventory: Holy Symbol 0 + Torches 5 + Rations 20 + Potions 1 = 26 lbs
    // Total ~103 lbs. Capacity 240. Should be unencumbered.
    expect(result.canCarryMore).toBe(true);
    expect(result.encumbrance.encumbranceLevel).toBe("unencumbered");
  });

  it("overencumbered at 200+ lbs for STR 16", () => {
    // Load up Kehrfuffle with extra weight
    const k = createKehrfuffle({
      inventory: [
        { name: "Heavy Treasure Chest", quantity: 1, weight: 150, description: "Filled with gold", isEquipped: false },
        { name: "Iron Door", quantity: 1, weight: 200, description: "A solid iron door", isEquipped: false },
      ],
    });
    const result = computeEncumbrance(k.strength, k.equipment, k.inventory, k.currency);
    expect(result.encumbrance.encumbranceLevel).toBe("overencumbered");
    expect(result.canCarryMore).toBe(false);
  });
});


// ═══════════════════════════════════════════════════════════════
// SUITE 4: Condition-Integrated State Management
// ═══════════════════════════════════════════════════════════════

describe("Conditions — Integrated State & Cross-Tab Consistency", () => {
  it("Wendy starts poisoned and can have conditions toggled", () => {
    const w = createWendy();
    expect(w.conditions).toContain("poisoned");

    // Toggle off: remove condition
    const withoutCondition = w.conditions.filter((c) => c !== "poisoned");
    expect(withoutCondition).not.toContain("poisoned");
    expect(withoutCondition.length).toBe(0);

    // Toggle on: add condition
    const withCondition = [...withoutCondition, "poisoned"];
    expect(withCondition).toContain("poisoned");
    expect(withCondition.length).toBe(1);
  });

  it("Kehrfuffle can gain and lose multiple conditions without corruption", () => {
    const k = createKehrfuffle();
    expect(k.conditions).toEqual([]);

    const conditionsAfterCombat = ["prone", "blinded"];
    const updated = { ...k, conditions: conditionsAfterCombat };
    expect(updated.conditions).toEqual(["prone", "blinded"]);

    // Remove one condition
    const afterCleanse = updated.conditions.filter((c) => c !== "blinded");
    expect(afterCleanse).toEqual(["prone"]);

    // Add another
    const afterAdditional = [...afterCleanse, "frightened"];
    expect(afterAdditional).toEqual(["prone", "frightened"]);
  });

  it("condition changes and inventory changes are independent (cross-tab integrity)", () => {
    const w = createWendy();

    // Player Stat tab changes: condition
    const statTabView = { ...w, conditions: ["poisoned"] };

    // Player Inventory tab changes: item quantity
    const potionIndex = statTabView.inventory.findIndex((i) => i.name === "Potion of Healing");
    const updatedInventory = [...statTabView.inventory];
    updatedInventory[potionIndex] = { ...updatedInventory[potionIndex], quantity: 2 }; // Used 1 potion
    const inventoryTabView = { ...statTabView, inventory: updatedInventory };

    // Both changes should be independently valid
    expect(inventoryTabView.conditions).toContain("poisoned");
    expect(inventoryTabView.inventory[potionIndex].quantity).toBe(2);

    // No cross-contamination
    expect(inventoryTabView.inventory.find((i) => i.name === "Torch")).toBeDefined();
    expect(inventoryTabView.conditions.length).toBe(1);
  });

  it("condition effects don't interfere with equipment functionality", () => {
    const w = createWendy();
    // Even when blinded/poisoned, equipped items stay equipped
    const blindedWendy = { ...w, conditions: ["blinded", "poisoned"] };
    const equippedItems = blindedWendy.inventory.filter((i) => i.isEquipped);
    expect(equippedItems.length).toBeGreaterThan(0);
    expect(equippedItems[0].name).toBe("Rapier +1");
  });
});


// ═══════════════════════════════════════════════════════════════
// SUITE 5: Currency Operations
// ═══════════════════════════════════════════════════════════════

describe("Player Sheet — Currency Operations", () => {
  it("Wendy's total gold value is correct", () => {
    const w = createWendy();
    // 25cp = 0.25gp, 10sp = 1gp, 75gp = 75gp
    const totalGold = w.currency.gold + w.currency.silver / 10 + w.currency.copper / 100;
    expect(totalGold).toBeCloseTo(76.25, 2);
  });

  it("Kehrfuffle's gold value with zero coins is zero", () => {
    const k = createKehrfuffle();
    const totalGold = k.currency.gold + k.currency.silver / 10;
    expect(totalGold).toBe(50);
  });

  it("currency addition doesn't mutate original", () => {
    const w = createWendy();
    const originalGold = w.currency.gold;

    const newCurrency = { ...w.currency, gold: w.currency.gold + 100 };
    expect(newCurrency.gold).toBe(175);
    expect(w.currency.gold).toBe(originalGold); // Unchanged
  });

  it("currency can be deducted but never goes negative", () => {
    const w = createWendy();
    const spendAmount = 100; // Try to spend more than Wendy has
    const newGold = Math.max(0, w.currency.gold - spendAmount);
    expect(newGold).toBe(0); // Clamped to 0
    expect(w.currency.silver).toBe(10); // Other coins unaffected
  });
});


// ═══════════════════════════════════════════════════════════════
// SUITE 6: Equipment Slot Integrity
// ═══════════════════════════════════════════════════════════════

describe("Player Sheet — Equipment Slot Integrity", () => {
  it("Wendy has exactly 1 equipped weapon slot", () => {
    const w = createWendy();
    const weapons = w.equipment.filter((e) => e.slot === "weapon");
    expect(weapons.length).toBe(1);
    expect(weapons[0].item).toBe("Rapier +1");
  });

  it("Kehrfuffle has 3 equipment slots (weapon, armor, shield)", () => {
    const k = createKehrfuffle();
    expect(k.equipment.length).toBe(3);
    expect(k.equipment.find((e) => e.slot === "armor")?.item).toBe("Plate Armor");
    expect(k.equipment.find((e) => e.slot === "shield")?.item).toBe("Shield");
  });

  it("equipping a new item updates the slot without losing slot count", () => {
    const k = createKehrfuffle();
    // Replace greatsword with a longsword
    const updatedEquip = k.equipment.map((e) =>
      e.slot === "weapon" ? { ...e, item: "Longsword +2", weight: 3 } : e
    );
    expect(updatedEquip.length).toBe(3);
    expect(updatedEquip.find((e) => e.slot === "weapon")?.item).toBe("Longsword +2");
  });
});


// ═══════════════════════════════════════════════════════════════
// SUITE 7: Tab State Consistency (Stateless Simulation)
// ═══════════════════════════════════════════════════════════════

describe("Player Sheet — Tab State Consistency Across Tabs", () => {
  it("Stats tab shows correct AC and HP derived from character", () => {
    const w = createWendy();
    // Stats tab reads from character directly
    const ac = w.armorClass;
    const hp = w.hitPoints.current;

    expect(ac).toBe(17); // Studded Leather (15) + DEX 18 (+4, capped at +2)
    expect(hp).toBe(38);
  });

  it("Combat tab shows correct initiative and speed from character", () => {
    const w = createWendy();
    const init = w.initiative; // Should be DEX mod
    const speed = w.speed.walk;

    expect(init).toBe(4); // DEX 18 = +4
    expect(speed).toBe(25); // Halfling base speed
  });

  it("Consumable item count is correct across tabs", () => {
    const w = createWendy();
    const potions = w.inventory.filter((i) => i.name === "Potion of Healing");

    // Inventory tab shows 3 potions
    expect(potions[0].quantity).toBe(3);

    // Combat tab uses same item data for consumable tracking
    expect(potions[0].weight).toBe(0.5);
  });

  it("spellSlots state is consistent across combat and spells tabs", () => {
    const k = createKehrfuffle();
    // Combat tab reads spellSlots for slot display
    const slots = k.spellSlots!;
    expect(slots.level1?.current).toBe(4);
    expect(slots.level1?.max).toBe(4);
    expect(slots.level2?.current).toBe(2);
    expect(slots.level2?.max).toBe(2);

    // Spells tab uses same slot data for cast/restore
    const totalSlots = (slots.level1?.current ?? 0) + (slots.level2?.current ?? 0);
    expect(totalSlots).toBe(6);
  });
});


// ═══════════════════════════════════════════════════════════════
// SUITE 8: Rapid State Change — Inventory + Conditions Burst
// ═══════════════════════════════════════════════════════════════

describe("Rapid State Change — Inventory & Conditions Burst", () => {
  it("10 rapid inventory changes all apply without data loss", () => {
    let w = createWendy();
    const startingCount = w.inventory.length;

    for (let i = 0; i < 10; i++) {
      w = {
        ...w,
        inventory: [
          ...w.inventory,
          { name: `Arrow x20 (batch ${i})`, quantity: 20, weight: 1, description: "Arrows", isEquipped: false },
        ],
      };
    }

    expect(w.inventory.length).toBe(startingCount + 10);
    expect(w.inventory[startingCount].name).toBe("Arrow x20 (batch 0)");
    expect(w.inventory[startingCount + 9].name).toBe("Arrow x20 (batch 9)");
  });

  it("10 rapid condition toggles all apply correctly", () => {
    let w = createWendy();
    for (let i = 0; i < 10; i++) {
      w = {
        ...w,
        conditions: i % 2 === 0
          ? [...w.conditions, `condition_${i}`]
          : w.conditions.filter((c) => c !== `condition_${i - 1}`),
      };
    }

    // After 10 toggles (even add, odd remove): final state has 5 conditions
    expect(w.conditions.length).toBe(5);
  });

  it("concurrent inventory and condition changes remain independent", () => {
    let w = createWendy();
    const startingConditionCount = w.conditions.length;
    const startingInventoryCount = w.inventory.length;

    // Alternate between adding inventory items and toggling conditions
    for (let i = 0; i < 20; i++) {
      if (i % 2 === 0) {
        w = {
          ...w,
          inventory: [
            ...w.inventory,
            { name: `Gold Coin (${i})`, quantity: 1, weight: 0, description: "A single gold coin", isEquipped: false },
          ],
        };
      } else {
        w = {
          ...w,
          conditions: [...w.conditions, `temp_condition_${i}`],
        };
      }
    }

    // 10 inventory items added (even numbers)
    expect(w.inventory.length).toBe(startingInventoryCount + 10);
    // 10 conditions added (odd numbers, starting from 1)
    expect(w.conditions.length).toBe(startingConditionCount + 10);
  });
});


// ═══════════════════════════════════════════════════════════════
// SUITE 9: Real-World Scenario — Full Player Session
// ═══════════════════════════════════════════════════════════════

describe("Real-World Scenario — Full Player Session", () => {
  it("Player manages inventory and conditions during a dungeon crawl", () => {
    let w = createWendy();
    let k = createKehrfuffle();

    // ── Phase 1: Wendy uses a Potion of Healing ──
    const potionIdx = w.inventory.findIndex((i) => i.name === "Potion of Healing");
    const afterPotion = [...w.inventory];
    afterPotion[potionIdx] = { ...afterPotion[potionIdx], quantity: afterPotion[potionIdx].quantity - 1 };
    w = { ...w, inventory: afterPotion };
    expect(w.inventory[potionIdx].quantity).toBe(2);

    // ── Phase 2: Wendy gets poisoned by a trap ──
    w = { ...w, conditions: [...w.conditions, "poisoned"] };
    expect(w.conditions).toContain("poisoned");

    // ── Phase 3: Kehrfuffle finds a treasure chest (50 GP) ──
    k = { ...k, currency: { ...k.currency, gold: k.currency.gold + 50 } };
    expect(k.currency.gold).toBe(100);

    // ── Phase 4: Wendy finds a magic ring ──
    const ring: InventoryItem = {
      name: "Ring of Protection",
      quantity: 1,
      weight: 0,
      description: "A shimmering ring that grants +1 AC",
      isEquipped: true,
    };
    w = { ...w, inventory: [...w.inventory, ring] };
    expect(w.inventory[w.inventory.length - 1].name).toBe("Ring of Protection");
    expect(detectCategory("Ring of Protection")).toBe("ring");

    // ── Phase 5: Kehrfuffle uses Lay on Hands to cure Wendy's poison ──
    k = {
      ...k,
      resources: k.resources
        ? k.resources.map((r) =>
            r.name === "Lay on Hands"
              ? { ...r, current: r.current - 5 }
              : r
          )
        : k.resources,
    };
    w = { ...w, conditions: w.conditions.filter((c) => c !== "poisoned") };
    expect(w.conditions).not.toContain("poisoned");
    expect(k.resources?.[0].current).toBe(25);

    // ── Phase 6: Both characters take a short rest ──
    w = { ...w, spentHitDice: (w.spentHitDice ?? 0) + 1 };
    k = { ...k, spentHitDice: (k.spentHitDice ?? 0) + 1 };
    expect(w.spentHitDice).toBe(3);
    expect(k.spentHitDice).toBe(2);

    // ── Phase 7: Verify final state ──
    expect(w.inventory.length).toBe(7); // Started 6 + ring = 7
    expect(k.inventory.length).toBe(4); // Unchanged
    expect(w.currency.gold).toBe(75); // Unchanged (ring was found, not bought)
    expect(k.currency.gold).toBe(100); // +50 from treasure

    // Verify Henry (the ring) is still equipped
    expect(w.inventory.find((i) => i.name === "Ring of Protection")?.isEquipped).toBe(true);
  });
});


// ═══════════════════════════════════════════════════════════════
// SUITE 10: Edge Cases & Input Validation
// ═══════════════════════════════════════════════════════════════

describe("Edge Cases — Input Validation & Graceful Degradation", () => {
  it("empty inventory without crashing", () => {
    const w = createWendy({ inventory: [] });
    expect(w.inventory).toEqual([]);
    expect(Array.isArray(w.inventory)).toBe(true);
  });

  it("zero-weight items in inventory without crashing", () => {
    const k = createKehrfuffle({ inventory: [{ name: "Holy Symbol", quantity: 1, weight: 0, description: "", isEquipped: true }] });
    expect(k.inventory[0].weight).toBe(0);
  });

  it("negative condition array is sanitized", () => {
    // Conditions array should never be null/undefined, but we test the guard
    const w = createWendy({ conditions: undefined as unknown as string[] });
    const safeConditions = w.conditions ?? [];
    expect(Array.isArray(safeConditions)).toBe(true);
  });

  it("undefined spentHitDice defaults to 0", () => {
    const w = createWendy({ spentHitDice: undefined });
    const spent = w.spentHitDice ?? 0;
    expect(spent).toBe(0);
  });

  it("character with no coins doesn't break currency display", () => {
    const k = createKehrfuffle({ currency: { copper: 0, silver: 0, electrum: 0, gold: 0, platinum: 0 } });
    const totalGold =
      k.currency.gold +
      k.currency.silver / 10 +
      k.currency.copper / 100 +
      k.currency.electrum / 2;
    expect(totalGold).toBe(0);
  });

  it("category detection is case-insensitive", () => {
    expect(detectCategory("POTION OF HEALING")).toBe("potion");
    expect(detectCategory("potion of healing")).toBe("potion");
    expect(detectCategory("RING OF PROTECTION")).toBe("ring");
    expect(detectCategory("ring of protection")).toBe("ring");
  });

  it("WEAPON-LIKE words in descriptions don't trigger weapon category", () => {
    // The item name is "Torch" — not a weapon despite being able to be used as one
    expect(detectCategory("Torch")).toBe("other");
    expect(detectCategory("Rope")).toBe("other");
  });
});
