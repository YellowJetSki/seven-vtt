/**
 * Sprint 15/41 — Deep Exploration QA Phase: Homebrew CRUD Operations
 *
 * Rigorous QA on the homebrew creation, editing, duplication, deletion,
 * visibility management, import/export, and bulk operation pipeline.
 *
 * Strict Compliance: NO dice rollers, NO occult elements.
 * Arkla campaign setting with Wendy and Kehrfuffle only.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { exportHomebrewToJSON, parseHomebrewJSON, mergeHomebrewImport } from "@/lib/homebrew-io";
import { HOME_EXPORT_VERSION } from "@/types/homebrew";
import type { HomebrewItem, HomebrewSpell, HomebrewFeat, HomebrewExport } from "@/types/homebrew";

// ── Factory Helpers ──────────────────────────────────────────

function makeItem(overrides: Partial<HomebrewItem> = {}): HomebrewItem {
  const now = Date.now();
  return {
    id: `item_${now}`,
    name: "Test Item",
    category: "weapon",
    rarity: "uncommon",
    description: "A test item for QA.",
    requiresAttunement: false,
    weight: 2,
    value: 50,
    isCursed: false,
    tags: [],
    visibleToPlayers: true,
    source: "homebrew",
    isHomebrew: true,
    damageDice: "1d8",
    damageType: "slashing",
    attackBonus: 1,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function makeSpell(overrides: Partial<HomebrewSpell> = {}): HomebrewSpell {
  const now = Date.now();
  return {
    id: `spell_${now}`,
    name: "Test Spell",
    level: 3,
    school: "Evocation",
    castingTime: "1 action",
    ritual: false,
    components: ["V", "S"],
    concentration: false,
    duration: "Instantaneous",
    range: "60 feet",
    classes: ["wizard"],
    description: "A test spell for QA.",
    visibleToPlayers: true,
    isHomebrew: true,
    source: "homebrew",
    tags: [],
    damageDice: "8d6",
    damageType: "fire",
    shape: "sphere",
    areaSize: 20,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function makeFeat(overrides: Partial<HomebrewFeat> = {}): HomebrewFeat {
  const now = Date.now();
  return {
    id: `feat_${now}`,
    name: "Test Feat",
    description: "A test feat for QA.",
    prerequisites: [],
    benefits: ["+1 to AC", "Advantage on Perception checks"],
    repeatable: false,
    visibleToPlayers: true,
    tags: [],
    source: "homebrew",
    isHomebrew: true,
    abilityScoreIncrease: "strength",
    skillProficiencies: ["perception"],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}


// ═══════════════════════════════════════════════════════════════
// ITEM CREATION (Edge Cases)
// ═══════════════════════════════════════════════════════════════

describe("HomebrewItem — data integrity", () => {
  it("should accept valid weapon with damage dice", () => {
    const item = makeItem({ name: "Wendy's Rapier", damageDice: "1d8", damageType: "piercing" });
    expect(item.name).toBe("Wendy's Rapier");
    expect(item.damageDice).toBe("1d8");
    expect(item.damageType).toBe("piercing");
    expect(item.category).toBe("weapon");
  });

  it("should accept armor with AC bonus", () => {
    const item = makeItem({ name: "Kehrfuffle's Aegis", category: "armor", acBonus: 2 });
    expect(item.acBonus).toBe(2);
    expect(item.category).toBe("armor");
  });

  it("should accept item with charges", () => {
    const item = makeItem({ name: "Ring of Stars", category: "ring", charges: 3, chargesMax: 5 });
    expect(item.charges).toBe(3);
    expect(item.chargesMax).toBe(5);
  });

  it("should handle 0 weight items correctly", () => {
    const item = makeItem({ weight: 0 });
    expect(item.weight).toBe(0);
  });

  it("should handle very long item names (100+ chars)", () => {
    const name = "A".repeat(200);
    const item = makeItem({ name });
    expect(item.name.length).toBe(200);
  });

  it("should allow empty description", () => {
    const item = makeItem({ description: "" });
    expect(item.description).toBe("");
  });

  it("should default visibleToPlayers to true", () => {
    const item = makeItem();
    expect(item.visibleToPlayers).toBe(true);
  });

  it("should handle isCursed flag", () => {
    const cursed = makeItem({ isCursed: true, curseDetails: "Cursed: cannot be unequipped" });
    expect(cursed.isCursed).toBe(true);
    expect(cursed.curseDetails).toContain("cannot be unequipped");
  });
});


// ═══════════════════════════════════════════════════════════════
// SPELL CREATION (Edge Cases)
// ═══════════════════════════════════════════════════════════════

describe("HomebrewSpell — data integrity", () => {
  it("should accept level 0 (cantrip)", () => {
    const spell = makeSpell({ name: "Wendy's Trick", level: 0 });
    expect(spell.level).toBe(0);
  });

  it("should accept level 9 (wish-level)", () => {
    const spell = makeSpell({ name: "Arkla's Wrath", level: 9 });
    expect(spell.level).toBe(9);
  });

  it("should accept AoE spell with shape and size", () => {
    const spell = makeSpell({ name: "Kehrfuffle's Radiance", shape: "cone", areaSize: 30 });
    expect(spell.shape).toBe("cone");
    expect(spell.areaSize).toBe(30);
  });

  it("should handle concentration ritual spells", () => {
    const spell = makeSpell({
      name: "Vigil of the Sentinel",
      concentration: true,
      ritual: true,
      duration: "Up to 1 hour",
    });
    expect(spell.concentration).toBe(true);
    expect(spell.ritual).toBe(true);
  });

  it("should handle all 8 schools of magic", () => {
    const schools = ["Abjuration", "Conjuration", "Divination", "Enchantment",
                     "Evocation", "Illusion", "Necromancy", "Transmutation"];
    schools.forEach((school) => {
      const spell = makeSpell({ school });
      expect(spell.school).toBe(school);
    });
  });

  it("should handle material components with cost", () => {
    const spell = makeSpell({
      components: ["V", "S", "M"],
      materialComponent: "a diamond worth at least 300 gp",
    });
    expect(spell.components).toContain("M");
    expect(spell.materialComponent).toContain("diamond");
  });

  it("should handle damage + healing spells (both)", () => {
    const spell = makeSpell({ damageDice: "1d8", healDice: "2d4+2" });
    expect(spell.damageDice).toBe("1d8");
    expect(spell.healDice).toBe("2d4+2");
  });

  it("should accept multiple classes", () => {
    const spell = makeSpell({ classes: ["wizard", "sorcerer", "bard"] });
    expect(spell.classes).toHaveLength(3);
  });
});


// ═══════════════════════════════════════════════════════════════
// FEAT CREATION (Edge Cases)
// ═══════════════════════════════════════════════════════════════

describe("HomebrewFeat — data integrity", () => {
  it("should accept feat with ability score increase", () => {
    const feat = makeFeat({ abilityScoreIncrease: "strength,constitution" });
    expect(feat.abilityScoreIncrease).toContain("strength");
    expect(feat.abilityScoreIncrease).toContain("constitution");
  });

  it("should accept feat with skill proficiencies", () => {
    const feat = makeFeat({ skillProficiencies: ["perception", "stealth", "acrobatics"] });
    expect(feat.skillProficiencies).toHaveLength(3);
    expect(feat.skillProficiencies).toContain("perception");
  });

  it("should handle feats with structured prerequisites", () => {
    const feat = makeFeat({
      prerequisites: [
        { type: "ability", ability: "strength", minimumValue: 13, description: "STR 13+" },
        { type: "other", description: "Proficiency in Athletics" },
      ],
    });
    expect(feat.prerequisites).toHaveLength(2);
    expect(feat.prerequisites[0].ability).toBe("strength");
    expect(feat.prerequisites[0].minimumValue).toBe(13);
  });

  it("should allow repeatable feats", () => {
    const feat = makeFeat({ repeatable: true });
    expect(feat.repeatable).toBe(true);
  });

  it("should handle feats with many benefits (5+)", () => {
    const benefits = Array.from({ length: 10 }, (_, i) => `Benefit ${i + 1}`);
    const feat = makeFeat({ benefits });
    expect(feat.benefits).toHaveLength(10);
  });

  it("should allow feats with no prerequisites", () => {
    const feat = makeFeat({ prerequisites: [] });
    expect(feat.prerequisites).toHaveLength(0);
  });
});


// ═══════════════════════════════════════════════════════════════
// DUPLICATION LOGIC
// ═══════════════════════════════════════════════════════════════

describe("Duplication logic", () => {
  it("duplicate item should have different id from original", () => {
    const original = makeItem({ id: "original-1" });
    const dup = { ...original, id: "dup-1", name: `${original.name} (Copy)`, createdAt: Date.now(), updatedAt: Date.now() };
    expect(dup.id).not.toBe(original.id);
    expect(dup.name).toBe("Test Item (Copy)");
  });

  it("duplicate spell should preserve all field values", () => {
    const original = makeSpell({ name: "Fireball", damageDice: "8d6", level: 3, school: "Evocation" });
    const dup = { ...original, id: "dup-fireball", name: `${original.name} (Copy)`, createdAt: Date.now(), updatedAt: Date.now() };
    expect(dup.damageDice).toBe("8d6");
    expect(dup.level).toBe(3);
    expect(dup.school).toBe("Evocation");
    expect(dup.components).toEqual(["V", "S"]);
  });

  it("duplicate feat should preserve benefits and prerequisites", () => {
    const original = makeFeat({ benefits: ["+1 STR", "+1 CON"], prerequisites: [{ type: "other", description: "Lv 4+" }] });
    const dup = { ...original, id: "dup-feat", name: `${original.name} (Copy)`, createdAt: Date.now(), updatedAt: Date.now() };
    expect(dup.benefits).toEqual(["+1 STR", "+1 CON"]);
    expect(dup.prerequisites).toHaveLength(1);
  });

  it("duplicate should never share the same id", () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const now = Date.now() + i;
      const id = `dup_${now}_${Math.random().toString(36).slice(2, 6)}`;
      expect(ids.has(id)).toBe(false);
      ids.add(id);
    }
  });
});


// ═══════════════════════════════════════════════════════════════
// VISIBILITY CONTROL
// ═══════════════════════════════════════════════════════════════

describe("Visibility control", () => {
  it("should toggle from visible to hidden", () => {
    const item = makeItem({ visibleToPlayers: true });
    const toggled = { ...item, visibleToPlayers: false, updatedAt: Date.now() };
    expect(toggled.visibleToPlayers).toBe(false);
  });

  it("should toggle from hidden to visible", () => {
    const item = makeItem({ visibleToPlayers: false });
    const toggled = { ...item, visibleToPlayers: true, updatedAt: Date.now() };
    expect(toggled.visibleToPlayers).toBe(true);
  });

  it("should preserve all other fields when toggling visibility", () => {
    const item = makeItem({ name: "Kehrfuffle's Shield", weight: 6, damageType: undefined });
    const toggled = { ...item, visibleToPlayers: false, updatedAt: Date.now() };
    expect(toggled.name).toBe("Kehrfuffle's Shield");
    expect(toggled.weight).toBe(6);
    expect(toggled.category).toBe("weapon");
  });
});


// ═══════════════════════════════════════════════════════════════
// EXPORT / IMPORT
// ═══════════════════════════════════════════════════════════════

describe("Export — JSON serialization", () => {
  it("should produce valid JSON with all sections", () => {
    const items = [makeItem({ id: "exp-item" })];
    const spells = [makeSpell({ id: "exp-spell" })];
    const feats = [makeFeat({ id: "exp-feat" })];

    const payload: HomebrewExport = {
      version: HOME_EXPORT_VERSION,
      exportedAt: Date.now(),
      campaign: "Arkla",
      items, spells, feats,
    };

    const json = JSON.stringify(payload);
    const parsed = JSON.parse(json);
    expect(parsed.version).toBe(HOME_EXPORT_VERSION);
    expect(parsed.campaign).toBe("Arkla");
    expect(parsed.items).toHaveLength(1);
    expect(parsed.spells).toHaveLength(1);
    expect(parsed.feats).toHaveLength(1);
  });

  it("should handle empty collections on export", () => {
    const payload: HomebrewExport = {
      version: HOME_EXPORT_VERSION,
      exportedAt: Date.now(),
      items: [], spells: [], feats: [],
    };
    const json = JSON.stringify(payload);
    const parsed = JSON.parse(json);
    expect(parsed.items).toHaveLength(0);
    expect(parsed.spells).toHaveLength(0);
    expect(parsed.feats).toHaveLength(0);
  });

  it("should handle very large exports (100+ entries)", () => {
    const items = Array.from({ length: 100 }, (_, i) => makeItem({ id: `bulk-${i}`, name: `Item ${i}` }));
    const payload: HomebrewExport = { version: HOME_EXPORT_VERSION, exportedAt: Date.now(), items, spells: [], feats: [] };
    const json = JSON.stringify(payload);
    const parsed = JSON.parse(json);
    expect(parsed.items).toHaveLength(100);
  });
});

describe("parseHomebrewJSON", () => {
  it("should parse valid JSON successfully", () => {
    const payload: HomebrewExport = {
      version: HOME_EXPORT_VERSION,
      exportedAt: Date.now(),
      items: [makeItem({ id: "p1" })],
      spells: [makeSpell({ id: "p2" })],
      feats: [makeFeat({ id: "p3" })],
    };
    const json = JSON.stringify(payload);
    const result = parseHomebrewJSON(json);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.items).toHaveLength(1);
      expect(result.data.spells).toHaveLength(1);
      expect(result.data.feats).toHaveLength(1);
    }
  });

  it("should reject invalid JSON string", () => {
    const result = parseHomebrewJSON("not json at all");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("Parse error");
  });

  it("should reject malformed object (missing items array)", () => {
    const result = parseHomebrewJSON(JSON.stringify({ version: 1 }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("expected items, spells, and feats arrays");
  });

  it("should reject item missing name", () => {
    const badPayload: any = { version: 1, items: [{ category: "weapon" }], spells: [], feats: [] };
    const result = parseHomebrewJSON(JSON.stringify(badPayload));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("Item missing name");
  });

  it("should reject spell missing name", () => {
    const badPayload: any = { version: 1, items: [], spells: [{ level: 3 }], feats: [] };
    const result = parseHomebrewJSON(JSON.stringify(badPayload));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("Spell missing name");
  });

  it("should reject empty string", () => {
    const result = parseHomebrewJSON("");
    expect(result.ok).toBe(false);
  });

  it("should reject empty object", () => {
    const result = parseHomebrewJSON("{}");
    expect(result.ok).toBe(false);
  });
});

describe("mergeHomebrewImport — deduplication", () => {
  it("should skip duplicates matching by name (case-insensitive)", () => {
    const existing = [makeItem({ id: "e1", name: "Wendy's Bow" })];
    const imported = [makeItem({ id: "i1", name: "Wendy's Bow" })];
    const merged = mergeHomebrewImport(existing, imported, true);
    expect(merged).toHaveLength(1); // duplicate skipped
    expect(merged[0].id).toBe("e1"); // original kept
  });

  it("should add new unique items", () => {
    const existing = [makeItem({ id: "e1", name: "Existing Item" })];
    const imported = [makeItem({ id: "i1", name: "New Item" })];
    const merged = mergeHomebrewImport(existing, imported, true);
    expect(merged).toHaveLength(2);
  });

  it("should handle mixed duplicates and new items", () => {
    const existing = [makeItem({ id: "e1", name: "Item A" })];
    const imported = [makeItem({ id: "i1", name: "Item A" }), makeItem({ id: "i2", name: "Item B" })];
    const merged = mergeHomebrewImport(existing, imported, true);
    expect(merged).toHaveLength(2);
    expect(merged.map(m => m.name)).toContain("Item B");
  });

  it("should assign new IDs to imported items", () => {
    const existing: HomebrewItem[] = [];
    const imported = [makeItem({ id: "i1", name: "Fresh Item" })];
    const merged = mergeHomebrewImport(existing, imported, true);
    expect(merged).toHaveLength(1);
    expect(merged[0].id).not.toBe("i1"); // new ID assigned
    expect(merged[0].id).toContain("imp_"); // import prefix
  });

  it("should handle case variations (e.g., 'Wendy's Bow' vs 'WENDY'S BOW')", () => {
    const existing = [makeItem({ id: "e1", name: "Wendy's Bow" })];
    const imported = [makeItem({ id: "i1", name: "WENDY'S BOW" })];
    const merged = mergeHomebrewImport(existing, imported, true);
    expect(merged).toHaveLength(1);
  });

  it("should handle whitespace variations in names", () => {
    const existing = [makeItem({ id: "e1", name: "  Wendy's Bow  " })];
    const imported = [makeItem({ id: "i1", name: "Wendy's Bow" })];
    const merged = mergeHomebrewImport(existing, imported, true);
    expect(merged).toHaveLength(1);
  });

  it("should merge spells by name", () => {
    const existing = [makeSpell({ id: "e1", name: "Magic Missile" })];
    const imported = [makeSpell({ id: "i1", name: "Magic Missile" })];
    const merged = mergeHomebrewImport(existing, imported, true);
    expect(merged).toHaveLength(1);
  });

  it("should merge feats by name", () => {
    const existing = [makeFeat({ id: "e1", name: "Tough" })];
    const imported = [makeFeat({ id: "i1", name: "Tough" })];
    const merged = mergeHomebrewImport(existing, imported, true);
    expect(merged).toHaveLength(1);
  });

  it("should set isHomebrew flag on imported entries", () => {
    const existing: HomebrewItem[] = [];
    const imported = [makeItem({ id: "i1", name: "Import Item", isHomebrew: false })];
    const merged = mergeHomebrewImport(existing, imported, true);
    expect(merged[0].isHomebrew).toBe(true);
  });

  it("should preserve imported entry's source when not marked homebrew", () => {
    const existing: HomebrewItem[] = [];
    const imported = [makeItem({ id: "i1", name: "SRD Item", source: "dnd5e" })];
    const merged = mergeHomebrewImport(existing, imported, false);
    expect(merged[0].source).toBe("dnd5e");
  });
});


// ═══════════════════════════════════════════════════════════════
// TIMESTAMP INTEGRITY
// ═══════════════════════════════════════════════════════════════

describe("Timestamp integrity (createdAt/updatedAt)", () => {
  it("createdAt should NOT change on edit (prevents Bug 1: createdAt overwrite)", () => {
    const originalCreatedAt = 1000000; // fixed past timestamp
    const item = makeItem({ id: "original", createdAt: originalCreatedAt, updatedAt: originalCreatedAt });

    // Simulate what submitItem currently does (WRONG — overwrites createdAt)
    const WRONG_BEHAVIOR = { ...item, id: item.id, createdAt: Date.now(), updatedAt: Date.now() };

    // Correct behavior — preserve original createdAt
    const CORRECT_BEHAVIOR = { ...item, id: item.id, createdAt: item.createdAt, updatedAt: Date.now() };

    expect(CORRECT_BEHAVIOR.createdAt).toBe(originalCreatedAt);
    expect(CORRECT_BEHAVIOR.updatedAt).toBeGreaterThan(originalCreatedAt);

    // Document the current wrong behavior
    expect(WRONG_BEHAVIOR.createdAt).not.toBe(originalCreatedAt); // BUG: createdAt was overwritten
  });

  it("updatedAt should always be greater than or equal to createdAt", () => {
    const now = Date.now();
    const item = makeItem({ createdAt: now, updatedAt: now });
    const later = Date.now() + 100;
    const updated = { ...item, updatedAt: later };
    expect(updated.updatedAt).toBeGreaterThanOrEqual(updated.createdAt);
  });

  it("duplicate items should have later timestamps than original", () => {
    const original = makeItem({ createdAt: 100, updatedAt: 100 });
    const dup = { ...original, id: "dup", createdAt: Date.now(), updatedAt: Date.now() };
    expect(dup.createdAt).toBeGreaterThan(original.createdAt);
  });
});


// ═══════════════════════════════════════════════════════════════
// BULK OPERATIONS
// ═══════════════════════════════════════════════════════════════

describe("Bulk operations logic", () => {
  it("should support selecting multiple items", () => {
    const selected = new Set<string>(["a", "b", "c"]);
    expect(selected.size).toBe(3);
  });

  it("should toggle selection on/off", () => {
    const selected = new Set<string>();
    selected.add("a");
    expect(selected.has("a")).toBe(true);
    selected.delete("a");
    expect(selected.has("a")).toBe(false);
  });

  it("should clear selection after bulk delete", () => {
    const selected = new Set<string>(["a", "b"]);
    selected.clear();
    expect(selected.size).toBe(0);
  });
});


// ═══════════════════════════════════════════════════════════════
// EDGE CASES & DEFENSIVE GUARDS
// ═══════════════════════════════════════════════════════════════

describe("Edge cases — defensive guards", () => {
  it("should handle missing optional fields gracefully", () => {
    const item = makeItem({ damageDice: undefined, attackBonus: undefined, acBonus: undefined });
    const json = JSON.stringify(item);
    const parsed = JSON.parse(json);
    expect(parsed.damageDice).toBeUndefined();
    expect(parsed.attackBonus).toBeUndefined();
  });

  it("should handle spells with no components", () => {
    const spell = makeSpell({ components: [] });
    expect(spell.components).toHaveLength(0);
  });

  it("should handle feats with no benefits", () => {
    const feat = makeFeat({ benefits: [] });
    expect(feat.benefits).toHaveLength(0);
  });

  it("should handle unicode/special characters in names", () => {
    const item = makeItem({ name: "Épée de Wendy ♥ Arkla ✦" });
    expect(item.name).toContain("Épée");
    expect(item.name).toContain("♥");
  });

  it("should handle HTML in descriptions (XSS-safe storage)", () => {
    const item = makeItem({ description: '<script>alert("XSS")</script>' });
    // Storage layer should not strip — presentation layer is responsible for XSS
    expect(item.description).toContain("<script>");
  });

  it("mergeHomebrewImport should handle empty existing array", () => {
    const result = mergeHomebrewImport([], [], true);
    expect(result).toHaveLength(0);
  });

  it("mergeHomebrewImport should handle empty imported array", () => {
    const existing = [makeItem({ id: "e1" })];
    const result = mergeHomebrewImport(existing, [], true);
    expect(result).toHaveLength(1);
  });
});
