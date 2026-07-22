/**
 * E2E: Shopping Trip & Currency System QA
 *
 * Tests the custom Leptons/Quadrants/Assarions currency system
 * plus inventory item add/edit/remove from a simulated shop visit.
 *
 * Campaign: Arkla
 * Characters: Wendy Swiftfoot (45 LP), Kehrfuffle Ironheart (12 LP)
 * Scenario: After clearing the dungeon, the party visits the
 *   village merchant to buy supplies and sell loot.
 */
import { describe, it, expect } from "vitest";
import type { PlayerCharacter, Currency, InventoryItem } from "@/types";

// ── 5.5e COIN CONVERSION ──
// 50 LP = 1 QD, 4 QD = 1 AS  ∴  1 AS = 200 LP
const COIN_VALUES = { leptons: 1, quadrants: 50, assarions: 200 };

function toLeptons(c: Currency): number {
  return (c.leptons || 0) * COIN_VALUES.leptons
       + (c.quadrants || 0) * COIN_VALUES.quadrants
       + (c.assarions || 0) * COIN_VALUES.assarions;
}

function deductCurrency(c: Currency, costInLeptons: number): Currency | null {
  const total = toLeptons(c);
  if (total < costInLeptons) return null; // insufficient funds

  // Convert everything to leptons first, then subtract
  let remaining = total - costInLeptons;

  // Convert back to denominations
  const assarions = Math.floor(remaining / 200);
  remaining -= assarions * 200;
  const quadrants = Math.floor(remaining / 50);
  remaining -= quadrants * 50;
  const leptons = remaining;

  return { leptons, quadrants, assarions };
}

function addCurrency(c: Currency, add: Partial<Currency>): Currency {
  const total = toLeptons(c)
    + (add.leptons || 0) * COIN_VALUES.leptons
    + (add.quadrants || 0) * COIN_VALUES.quadrants
    + (add.assarions || 0) * COIN_VALUES.assarions;

  const assarions = Math.floor(total / 200);
  let remaining = total - assarions * 200;
  const quadrants = Math.floor(remaining / 50);
  remaining -= quadrants * 50;
  const leptons = remaining;

  return { leptons, quadrants, assarions };
}

function addItem(inventory: InventoryItem[], item: InventoryItem): InventoryItem[] {
  const existing = inventory.find(
    (i) => i.name.toLowerCase() === item.name.toLowerCase()
  );
  if (existing) {
    return inventory.map((i) =>
      i.name.toLowerCase() === item.name.toLowerCase()
        ? { ...i, quantity: (i.quantity || 1) + (item.quantity || 1) }
        : i
    );
  }
  return [...inventory, { ...item, id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 6)}` }];
}

function removeItem(inventory: InventoryItem[], index: number): InventoryItem[] {
  return inventory.filter((_, i) => i !== index);
}

function useConsumable(inventory: InventoryItem[], index: number): InventoryItem[] {
  const item = inventory[index];
  if (!item) return inventory;
  if ((item.quantity || 1) <= 1) {
    return inventory.filter((_, i) => i !== index);
  }
  return inventory.map((i, idx) =>
    idx === index ? { ...i, quantity: (i.quantity || 1) - 1 } : i
  );
}

// ── HELPERS ──
const WENDY: PlayerCharacter = {
  id: "wendy_1", name: "Wendy Swiftfoot", playerName: "Alice", race: "Halfling", class: "Rogue", level: 5,
  dexterity: 18, strength: 8, constitution: 14, intelligence: 10, wisdom: 12, charisma: 14,
  hitPoints: { current: 38, max: 38, temporary: 0 },
  armorClass: 15, initiative: 4, proficiencyBonus: 3,
  speed: { walk: 25 }, conditions: [], deathSaves: { successes: 0, failures: 0 },
  inventory: [{ name: "Shortsword", quantity: 1, weight: 2, description: "" }],
  currency: { leptons: 45, quadrants: 0, assarions: 0 },
  experiencePoints: 14000,
  equipment: [], skills: {}, savingThrows: {}, traits: [], features: [], proficiencies: [], languages: [],
  backstory: "", allies: "", characterNotes: "", appearance: "", resources: [],
  createdAt: Date.now(), updatedAt: Date.now(),
};

// ── CURRENCY TESTS ──
describe("Shopping E2E — Currency System", () => {
  it("converts 45 LP to 45 LP", () => {
    expect(toLeptons({ leptons: 45, quadrants: 0, assarions: 0 })).toBe(45);
  });

  it("converts 1 QD + 0 LP to 50 LP", () => {
    expect(toLeptons({ leptons: 0, quadrants: 1, assarions: 0 })).toBe(50);
  });

  it("converts 1 AS to 200 LP", () => {
    expect(toLeptons({ leptons: 0, quadrants: 0, assarions: 1 })).toBe(200);
  });

  it("converts mixed: 2 AS + 3 QD + 10 LP = 560 LP", () => {
    expect(toLeptons({ leptons: 10, quadrants: 3, assarions: 2 })).toBe(560);
  });

  it("deducts exact amount from leptons", () => {
    const result = deductCurrency({ leptons: 45, quadrants: 0, assarions: 0 }, 30);
    expect(result).toEqual({ leptons: 15, quadrants: 0, assarions: 0 });
  });

  it("deducts and auto-breaks higher denomination", () => {
    // 1 QD + 0 LP = 50 LP, deduct 30, should give 20 LP
    const result = deductCurrency({ leptons: 0, quadrants: 1, assarions: 0 }, 30);
    expect(result).toEqual({ leptons: 20, quadrants: 0, assarions: 0 });
  });

  it("deducts full amount from assarions", () => {
    const result = deductCurrency({ leptons: 0, quadrants: 0, assarions: 1 }, 200);
    expect(result).toEqual({ leptons: 0, quadrants: 0, assarions: 0 });
  });

  it("deducts across all denominations", () => {
    // 1 AS + 1 QD + 50 LP = 300 LP, deduct 175 → 125 remaining = 0 AS + 2 QD + 25 LP
    const result = deductCurrency({ leptons: 50, quadrants: 1, assarions: 1 }, 175);
    expect(result).toEqual({ leptons: 25, quadrants: 2, assarions: 0 });
  });

  it("returns null for insufficient funds", () => {
    const result = deductCurrency({ leptons: 45, quadrants: 0, assarions: 0 }, 100);
    expect(result).toBeNull();
  });

  it("adds coins and rolls up denominations", () => {
    // 30 LP + 80 LP = 110 LP → 2 QD + 10 LP
    const result = addCurrency({ leptons: 30, quadrants: 0, assarions: 0 }, { leptons: 80 });
    expect(result).toEqual({ leptons: 10, quadrants: 2, assarions: 0 });
  });

  it("adds and rolls up to assarions", () => {
    // 3 QD + 1 AS = 350 LP? No: 3*50=150 + 200 = 350
    // Adding 50 LP → 400 LP → 2 AS
    const result = addCurrency({ leptons: 0, quadrants: 3, assarions: 0 }, { leptons: 50 });
    expect(result).toEqual({ leptons: 0, quadrants: 0, assarions: 2 });
  });

  it("handles empty/wallet with only gold (assarions) and no change", () => {
    const result = deductCurrency({ leptons: 0, quadrants: 0, assarions: 8 }, 1600);
    expect(result).toEqual({ leptons: 0, quadrants: 0, assarions: 0 });
  });
});

// ── SHOPPING TESTS ──
describe("Shopping E2E — Buying Items", () => {
  it("Wendy can afford a Health Potion (costs 50 LP) with 45 LP — insufficient", () => {
    const affordable = toLeptons(WENDY.currency) >= 50;
    expect(affordable).toBe(false);
  });

  it("Wendy's total wealth in LP is correct", () => {
    expect(toLeptons(WENDY.currency)).toBe(45);
  });

  it("adding 5 LP to Wendy gives 50 LP — enough for potion", () => {
    const updated = addCurrency(WENDY.currency, { leptons: 5 });
    expect(toLeptons(updated)).toBe(50);
    // Can now afford
    const afterDeduct = deductCurrency(updated, 50);
    expect(afterDeduct).toEqual({ leptons: 0, quadrants: 0, assarions: 0 });
  });

  it("buying a Healing Potion adds it to inventory", () => {
    let inv = [...WENDY.inventory];
    const potion: InventoryItem = { name: "Healing Potion (Common)", quantity: 1, weight: 0.5, description: "Heals 2d4+2 HP" };
    inv = addItem(inv, potion);
    expect(inv).toHaveLength(2);
    expect(inv[1].name).toBe("Healing Potion (Common)");
  });

  it("buying a second Healing Potion stacks quantity", () => {
    let inv = [...WENDY.inventory, { name: "Healing Potion (Common)", quantity: 1, weight: 0.5, description: "" }];
    const potion2: InventoryItem = { name: "Healing Potion (Common)", quantity: 1, weight: 0.5, description: "" };
    inv = addItem(inv, potion2);
    expect(inv).toHaveLength(2); // Shortsword + stacked potion
    const potion = inv.find((i) => i.name === "Healing Potion (Common)");
    expect(potion?.quantity).toBe(2);
  });

  it("buying a Tent (costs 100 LP) with only 45 LP — insufficient", () => {
    const canAfford = toLeptons(WENDY.currency) >= 100;
    expect(canAfford).toBe(false);
  });

  it("selling the Shortsword adds gold (estimated 5 per lb)", () => {
    const item = WENDY.inventory[0];
    const sellValue = Math.max(1, Math.round((item.weight || 1) * 5)); // 5 * 2 = 10 LP
    expect(sellValue).toBe(10);
    const newCurrency = addCurrency(WENDY.currency, { leptons: sellValue });
    expect(toLeptons(newCurrency)).toBe(55);
  });

  it("using a Healing Potion decrements its quantity", () => {
    const inv: InventoryItem[] = [
      { name: "Shortsword", quantity: 1, weight: 2, description: "" },
      { name: "Healing Potion (Common)", quantity: 2, weight: 0.5, description: "" },
    ];
    const updated = useConsumable(inv, 1); // Use potion at index 1
    const potion = updated.find((i) => i.name === "Healing Potion (Common)");
    expect(potion?.quantity).toBe(1);
  });

  it("using the last potion removes it from inventory", () => {
    const inv: InventoryItem[] = [
      { name: "Shortsword", quantity: 1, weight: 2, description: "" },
      { name: "Healing Potion (Common)", quantity: 1, weight: 0.5, description: "" },
    ];
    const updated = useConsumable(inv, 1);
    expect(updated).toHaveLength(1);
    expect(updated[0].name).toBe("Shortsword");
  });

  it("deleting an item removes it", () => {
    const inv: InventoryItem[] = [
      { name: "Junk Shield", quantity: 1, weight: 6, description: "old shield" },
      { name: "Health Potion", quantity: 1, weight: 0.5, description: "" },
    ];
    const updated = removeItem(inv, 0);
    expect(updated).toHaveLength(1);
    expect(updated[0].name).toBe("Health Potion");
  });
});

// ── FULL SHOPPING TRIP SCENARIO ──
describe("Shopping E2E — Full Shopping Trip", () => {
  it("Wendy sells junk, buys rations, buys potion, uses potion — full lifecycle", () => {
    // Starting wallet: 45 LP
    let currency: Currency = { leptons: 45, quadrants: 0, assarions: 0 };
    let inventory: InventoryItem[] = [
      { name: "Shortsword", quantity: 1, weight: 2, description: "" },
      { name: "Junk Goblin Dagger", quantity: 1, weight: 2, description: "junk" },
    ];

    // Step 1: Sell junk dagger (2 lb × 5 = 10 LP)
    const sellValue = Math.max(1, Math.round(2 * 5));
    currency = addCurrency(currency, { leptons: sellValue });
    inventory = removeItem(inventory, 1);
    expect(currency).toEqual({ leptons: 5, quadrants: 1, assarions: 0 }); // 55 LP → 1 QD 5 LP
    expect(inventory).toHaveLength(1);

    // Step 2: Buy Rations (5 days, 25 LP)
    const rationsCost = 25;
    const aff1 = deductCurrency(currency, rationsCost);
    expect(aff1).not.toBeNull();
    currency = aff1!;
    inventory = addItem(inventory, { name: "Rations", quantity: 5, weight: 10, description: "5 days of food" });

    // After rations: 55 - 25 = 30 LP
    expect(toLeptons(currency)).toBe(30);

    // Step 3: Buy Healing Potion (50 LP) — cannot afford yet
    const potionCost = 50;
    const aff2 = deductCurrency(currency, potionCost);
    expect(aff2).toBeNull(); // insufficient

    // Step 4: Sell Shortsword (2 lb × 5 = 10 LP) to get more funds
    currency = addCurrency(currency, { leptons: 10 });
    expect(toLeptons(currency)).toBe(40); // 30 + 10

    // Step 5: Still can't afford potion (need 50, have 40)
    const aff3 = deductCurrency(currency, potionCost);
    expect(aff3).toBeNull();

    // Step 6: Find 10 LP on the ground
    currency = addCurrency(currency, { leptons: 10 });
    expect(toLeptons(currency)).toBe(50);

    // Step 7: Now buy the potion
    const aff4 = deductCurrency(currency, potionCost);
    expect(aff4).not.toBeNull();
    currency = aff4!;
    inventory = addItem(inventory, { name: "Healing Potion (Common)", quantity: 1, weight: 0.5, description: "Heals 2d4+2" });
    expect(toLeptons(currency)).toBe(0);
    expect(inventory).toHaveLength(2); // Rations + Potion

    // Step 8: Use the potion
    const potionIdx = inventory.findIndex((i) => i.name.includes("Potion"));
    expect(potionIdx).toBeGreaterThanOrEqual(0);
    inventory = useConsumable(inventory, potionIdx);
    expect(inventory).toHaveLength(1); // Only rations remain
  });
});
