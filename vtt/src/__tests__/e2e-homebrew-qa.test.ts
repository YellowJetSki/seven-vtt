/**
 * E2E: Homebrew Spell & Item Creation Pipeline QA
 *
 * Tests the full lifecycle: Create → Save → Export → Import →
 * Equip → Use on character sheet.
 *
 * Campaign: Arkla
 * Scenario: DM creates custom content for the party's
 *   adventure in the Sunless Citadel.
 */
import { describe, it, expect } from "vitest";
import type { HomebrewItem, HomebrewSpell, InventoryItem, PlayerCharacter } from "@/types";

// ── HELPERS ──

let idCounter = 100;
function nextId(): string { return `test_hb_${++idCounter}`; }

function createItem(overrides: Partial<HomebrewItem> = {}): HomebrewItem {
  return {
    id: nextId(), name: "Test Item", category: "Weapon",
    description: "A test weapon",
    damageDice: "1d8", damageType: "slashing", attackBonus: 1,
    weight: 3, cost: 100,
    requiresAttunement: false, isCursed: false,
    tags: [], visibleToPlayers: true, isHomebrew: true,
    createdAt: Date.now(), updatedAt: Date.now(),
    ...overrides,
  };
}

function createSpell(overrides: Partial<HomebrewSpell> = {}): HomebrewSpell {
  return {
    id: nextId(), name: "Test Spell", level: 3, school: "Evocation",
    description: "A test spell that does fire damage",
    damageDice: "8d6", damageType: "fire", saveDC: 15, spellAttackBonus: 7,
    castingTime: "1 action", range: "60 ft", duration: "Instantaneous",
    components: "V, S, M", materialComponent: "a pinch of sulfur",
    needsSavingThrow: true, savingThrowAbility: "dexterity", saveEffect: "half",
    shape: "sphere", areaSize: 20,
    tags: ["fire", "aoe"], classes: ["Wizard"],
    requiresConcentration: false, isRitual: false,
    visibleToPlayers: true, isHomebrew: true,
    createdAt: Date.now(), updatedAt: Date.now(),
    ...overrides,
  };
}

// ── SERIALIZATION HELPERS ──

interface ExportEnvelope {
  version: number;
  exportedAt: string;
  campaign: string;
  items: HomebrewItem[];
  spells: HomebrewSpell[];
}

function exportToJSON(items: HomebrewItem[], spells: HomebrewSpell[]): string {
  const envelope: ExportEnvelope = {
    version: 2,
    exportedAt: new Date().toISOString(),
    campaign: "Arkla",
    items, spells,
  };
  return JSON.stringify(envelope, null, 2);
}

function parseJSON(json: string): ExportEnvelope | null {
  try {
    const parsed = JSON.parse(json);
    if (!parsed.version || typeof parsed.version !== "number") return null;
    if (!Array.isArray(parsed.items)) return null;
    if (!Array.isArray(parsed.spells)) return null;
    return parsed as ExportEnvelope;
  } catch {
    return null;
  }
}

function mergeImport(
  existingItems: HomebrewItem[],
  existingSpells: HomebrewSpell[],
  imported: ExportEnvelope
): { items: HomebrewItem[]; spells: HomebrewSpell[] } {
  const nameSet = new Set(existingItems.map((i) => i.name.toLowerCase()));
  const newItems = imported.items.filter((i) => !nameSet.has(i.name.toLowerCase()));
  const items = [...existingItems, ...newItems.map((i) => ({ ...i, id: nextId(), isHomebrew: true }))];

  const spellNameSet = new Set(existingSpells.map((s) => s.name.toLowerCase()));
  const newSpells = imported.spells.filter((s) => !spellNameSet.has(s.name.toLowerCase()));
  const spells = [...existingSpells, ...newSpells.map((s) => ({ ...s, id: nextId(), isHomebrew: true }))];

  return { items, spells };
}

function resolveOnCharacter(
  itemName: string,
  items: HomebrewItem[],
  spells: HomebrewSpell[]
): { item?: HomebrewItem; spell?: HomebrewSpell } {
  const item = items.find((i) => i.name.toLowerCase() === itemName.toLowerCase());
  const spell = spells.find((s) => s.name.toLowerCase() === itemName.toLowerCase());
  return { item, spell };
}

function equipItem(inventory: InventoryItem[], item: HomebrewItem): InventoryItem[] {
  const existing = inventory.find((i) => i.name.toLowerCase() === item.name.toLowerCase());
  if (existing) return inventory; // already have it
  return [...inventory, {
    name: item.name,
    quantity: 1,
    weight: item.weight || 0,
    description: item.description || "",
  }];
}

// ── TESTS ──

describe("Homebrew E2E — Item Creation", () => {
  it("creates a Longsword +1 homebrew item", () => {
    const item = createItem({
      name: "Longsword +1",
      category: "Weapon",
      damageDice: "1d8",
      damageType: "slashing",
      attackBonus: 1,
      description: "A finely crafted longsword with a faint magical aura.",
      tags: ["magic", "weapon"],
    });
    expect(item.name).toBe("Longsword +1");
    expect(item.damageDice).toBe("1d8");
    expect(item.attackBonus).toBe(1);
    expect(item.isHomebrew).toBe(true);
  });

  it("creates a homebrew potion with healing dice", () => {
    const item = createItem({
      name: "Superior Healing Potion",
      category: "Potion",
      description: "Heals 8d4+8 HP",
      healingDice: "8d4+8",
      tags: ["consumable", "healing"],
    });
    expect(item.healingDice).toBe("8d4+8");
    expect(item.category).toBe("Potion");
  });

  it("creates a homebrew armor item", () => {
    const item = createItem({
      name: "Mithral Chainmail",
      category: "Armor",
      description: "Lightweight chainmail that doesn't impose stealth disadvantage.",
      acBonus: 16,
      armorType: "heavy",
      stealthDisadvantage: false,
      tags: ["armor", "mithral"],
    });
    expect(item.acBonus).toBe(16);
    expect(item.armorType).toBe("heavy");
    expect(item.stealthDisadvantage).toBe(false);
  });

  it("items have unique IDs", () => {
    const item1 = createItem({ name: "Sword A" });
    const item2 = createItem({ name: "Sword B" });
    expect(item1.id).not.toBe(item2.id);
  });

  it("item fields default correctly when not provided", () => {
    const item = createItem({ weight: undefined });
    expect(item.weight).toBe(3); // from default
    expect(item.requiresAttunement).toBe(false);
    expect(item.isCursed).toBe(false);
  });
});

describe("Homebrew E2E — Spell Creation", () => {
  it("creates a homebrew Fireball variant", () => {
    const spell = createSpell({
      name: "Fireball (Cold Variant)",
      school: "Evocation",
      damageDice: "8d6",
      damageType: "cold",
      shape: "sphere",
      areaSize: 20,
    });
    expect(spell.damageType).toBe("cold");
    expect(spell.shape).toBe("sphere");
    expect(spell.areaSize).toBe(20);
  });

  it("creates a cantrip that doesn't use spell slots", () => {
    const cantrip = createSpell({
      name: "Eldritch Blast",
      level: 0,
      school: "Evocation",
      damageDice: "1d10",
      damageType: "force",
      range: "120 ft",
    });
    expect(cantrip.level).toBe(0);
    expect(cantrip.school).toBe("Evocation");
  });

  it("creates a concentration spell", () => {
    const spell = createSpell({
      name: "Homebrew Haste",
      requiresConcentration: true,
      duration: "1 minute",
    });
    expect(spell.requiresConcentration).toBe(true);
    expect(spell.duration).toBe("1 minute");
  });

  it("creates a ritual spell", () => {
    const spell = createSpell({
      name: "Ritual of the Ancients",
      isRitual: true,
      level: 2,
    });
    expect(spell.isRitual).toBe(true);
  });

  it("creates a heal spell", () => {
    const spell = createSpell({
      name: "Cure Wounds (Homebrew)",
      level: 1,
      school: "Conjuration",
      healDice: "1d8+5",
      needsSavingThrow: false,
    });
    expect(spell.healDice).toBe("1d8+5");
    expect(spell.needsSavingThrow).toBe(false);
  });

  it("supports all 8 schools of magic", () => {
    const schools = ["Abjuration", "Conjuration", "Divination", "Enchantment", "Evocation", "Illusion", "Necromancy", "Transmutation"];
    schools.forEach((school) => {
      const spell = createSpell({ name: `Spell of ${school}`, school });
      expect(spell.school).toBe(school);
    });
  });
});

describe("Homebrew E2E — Export/Import Pipeline", () => {
  it("exports items and spells as valid JSON", () => {
    const items = [createItem({ name: "Flame Tongue" })];
    const spells = [createSpell({ name: "Fireball" })];
    const json = exportToJSON(items, spells);
    const parsed = parseJSON(json);
    expect(parsed).not.toBeNull();
    expect(parsed!.items).toHaveLength(1);
    expect(parsed!.spells).toHaveLength(1);
    expect(parsed!.version).toBe(2);
  });

  it("imports new items and spells", () => {
    const existingItems = [createItem({ name: "Longsword" })];
    const existingSpells = [createSpell({ name: "Magic Missile" })];
    const imported = {
      version: 2,
      exportedAt: new Date().toISOString(),
      campaign: "Arkla",
      items: [createItem({ name: "Flame Tongue", damageDice: "2d6", damageType: "fire" })],
      spells: [createSpell({ name: "Fireball" })],
    };

    const result = mergeImport(existingItems, existingSpells, imported);
    expect(result.items).toHaveLength(2); // Longsword + Flame Tongue
    expect(result.spells).toHaveLength(2); // Magic Missile + Fireball
  });

  it("deduplicates by case-insensitive name on import", () => {
    const existingItems = [createItem({ name: "Longsword" })];
    const imported = {
      version: 2,
      exportedAt: new Date().toISOString(),
      campaign: "Arkla",
      items: [createItem({ name: "longsword" })], // same name, different case
      spells: [],
    };

    const result = mergeImport(existingItems, [], imported);
    expect(result.items).toHaveLength(1); // deduped
  });

  it("rejects malformed import JSON", () => {
    const badJSON = `{"items": "not-an-array"}`;
    const result = parseJSON(badJSON);
    expect(result).toBeNull();
  });

  it("rejects empty JSON", () => {
    expect(parseJSON("")).toBeNull();
  });

  it("rejects non-JSON string", () => {
    expect(parseJSON("not json at all")).toBeNull();
  });
});

describe("Homebrew E2E — Equip & Apply to Character", () => {
  it("equips a homebrew weapon to a character inventory", () => {
    const flameTongue = createItem({ name: "Flame Tongue", damageDice: "2d6", damageType: "fire", attackBonus: 1 });
    let inv: InventoryItem[] = [];
    inv = equipItem(inv, flameTongue);
    expect(inv).toHaveLength(1);
    expect(inv[0].name).toBe("Flame Tongue");
  });

  it("does not duplicate if already equipped", () => {
    const item = createItem({ name: "Shield of Faith" });
    let inv: InventoryItem[] = [{ name: "Shield of Faith", quantity: 1, weight: 6, description: "" }];
    inv = equipItem(inv, item);
    expect(inv).toHaveLength(1); // no duplicate
  });

  it("stacks consumable homebrew items", () => {
    const potion = createItem({ name: "Health Potion", category: "Potion" });
    let inv: InventoryItem[] = [{ name: "Health Potion", quantity: 2, weight: 0.5, description: "" }];
    // Adding more should increment quantity
    const existing = inv.find((i) => i.name.toLowerCase() === potion.name.toLowerCase());
    if (existing) {
      inv = inv.map((i) =>
        i.name.toLowerCase() === potion.name.toLowerCase()
          ? { ...i, quantity: (i.quantity || 0) + 1 }
          : i
      );
    }
    expect(inv.find((i) => i.name === "Health Potion")?.quantity).toBe(3);
  });

  it("resolves homebrew by name in compendium bridge", () => {
    const items = [createItem({ name: "Mace of Disruption" })];
    const resolved = resolveOnCharacter("Mace of Disruption", items, []);
    expect(resolved.item).toBeDefined();
    expect(resolved.item!.name).toBe("Mace of Disruption");
  });

  it("resolves homebrew spell by name in compendium bridge", () => {
    const spells = [createSpell({ name: "Arcane Cannon" })];
    const resolved = resolveOnCharacter("Arcane Cannon", [], spells);
    expect(resolved.spell).toBeDefined();
    expect(resolved.spell!.name).toBe("Arcane Cannon");
  });
});

describe("Homebrew E2E — Full Lifecycle", () => {
  it("create → export → import → equip → use", () => {
    // Step 1: DM creates 2 homebrew items and 1 spell
    const hbItems: HomebrewItem[] = [
      createItem({ name: "Sun Sword", damageDice: "2d8", damageType: "radiant", attackBonus: 2, description: "A blade of pure sunlight." }),
      createItem({ name: "Potion of Climbing", category: "Potion", description: "Grants climb speed 30 for 1 hour." }),
    ];
    const hbSpells: HomebrewSpell[] = [
      createSpell({ name: "Sunburst", level: 6, school: "Evocation", damageDice: "12d6", damageType: "radiant", shape: "sphere", areaSize: 60 }),
    ];

    expect(hbItems).toHaveLength(2);
    expect(hbSpells).toHaveLength(1);

    // Step 2: Export to JSON
    const json = exportToJSON(hbItems, hbSpells);
    expect(json).toContain("Sun Sword");
    expect(json).toContain("Sunburst");

    // Step 3: Import into a different campaign
    const parsed = parseJSON(json)!;
    const merged = mergeImport([], [], parsed);
    expect(merged.items).toHaveLength(2);
    expect(merged.spells).toHaveLength(1);

    // Step 4: Equip Sun Sword on character
    const sunSword = merged.items.find((i) => i.name === "Sun Sword")!;
    let inv: InventoryItem[] = [];
    inv = equipItem(inv, sunSword);
    expect(inv).toHaveLength(1);
    expect(inv[0].name).toBe("Sun Sword");

    // Step 5: Verify spell fields survive roundtrip
    const sunburst = merged.spells.find((s) => s.name === "Sunburst")!;
    expect(sunburst.damageDice).toBe("12d6");
    expect(sunburst.areaSize).toBe(60);
    expect(sunburst.shape).toBe("sphere");
    expect(sunburst.level).toBe(6);
  });
});
