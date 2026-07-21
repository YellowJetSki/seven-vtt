/**
 * STᚱ VTT — Cycle 46: Uncovered Engine Test Sweep
 *
 * Covers 3 engines with ZERO prior test coverage:
 *   1. spell-point-engine.ts — DMG pg. 288 spell points variant
 *   2. damage-type-engine.ts — 5e damage type resistance/immunity/vulnerability
 *   3. initiative-engine.ts — d20 + DEX initiative roll & tiebreaker
 *
 * Reference: D&D 5e DMG pg. 82-83, 288-289
 */

import { describe, it, expect } from "vitest";

// ─── Module 1: Spell Point Engine (DMG 288-289) ───

import {
  slotsToSpellPoints,
  spendSpellPoints,
  restoreSpellPoints,
  getMaxSpellPoints,
  getMaxSlotLevelForSpellPoints,
  getAvailableSpellLevelsFromPoints,
  estimateSpellCasts,
  getUpcastCost,
  convertSlotsToSpellPoints,
  createSlotWithPoints,
  SPELL_POINT_COSTS,
  SPELL_POINTS_BY_LEVEL,
  type SpellPointState,
} from "@/lib/mechanics/spell-point-engine";

describe("Spell Point Engine (DMG 288-289)", () => {
  // ── Cost Table (DMG 289) ──
  describe("SPELL_POINT_COSTS", () => {
    it("has correct costs for all 9 levels", () => {
      expect(SPELL_POINT_COSTS[1]).toBe(2);
      expect(SPELL_POINT_COSTS[2]).toBe(3);
      expect(SPELL_POINT_COSTS[3]).toBe(5);
      expect(SPELL_POINT_COSTS[4]).toBe(6);
      expect(SPELL_POINT_COSTS[5]).toBe(7);
      expect(SPELL_POINT_COSTS[6]).toBe(9);
      expect(SPELL_POINT_COSTS[7]).toBe(10);
      expect(SPELL_POINT_COSTS[8]).toBe(11);
      expect(SPELL_POINT_COSTS[9]).toBe(13);
    });

    it("has increasing costs (higher level = more expensive)", () => {
      for (let i = 2; i <= 9; i++) {
        expect(SPELL_POINT_COSTS[i]).toBeGreaterThan(SPELL_POINT_COSTS[i - 1]);
      }
    });
  });

  // ── Max Points by Level ──
  describe("getMaxSpellPoints", () => {
    it("returns correct max points for level 1", () => {
      expect(getMaxSpellPoints(1)).toBe(4);
    });
    it("returns correct max points for level 5", () => {
      expect(getMaxSpellPoints(5)).toBe(27);
    });
    it("returns correct max points for level 20", () => {
      expect(getMaxSpellPoints(20)).toBe(133);
    });
    it("clamps to valid range", () => {
      expect(getMaxSpellPoints(0)).toBe(0);
      expect(getMaxSpellPoints(21)).toBe(133);
    });
    it("all 20 levels have defined values", () => {
      for (let lvl = 1; lvl <= 20; lvl++) {
        expect(SPELL_POINTS_BY_LEVEL[lvl]).toBeDefined();
        const [points] = SPELL_POINTS_BY_LEVEL[lvl];
        expect(points).toBeGreaterThan(0);
      }
    });
  });

  // ── Max Slot Level ──
  describe("getMaxSlotLevelForSpellPoints", () => {
    it("Lv1 can only cast level 1", () => {
      expect(getMaxSlotLevelForSpellPoints(1)).toBe(1);
    });
    it("Lv5 can cast level 3", () => {
      expect(getMaxSlotLevelForSpellPoints(5)).toBe(3);
    });
    it("Lv20 can cast level 9", () => {
      expect(getMaxSlotLevelForSpellPoints(20)).toBe(9);
    });
  });

  // ── Slots → Points Conversion ──
  describe("slotsToSpellPoints", () => {
    it("converts full Lv5 Wizard slots (4/3/2) to 27 SP", () => {
      const slots = {
        level1: { current: 4, max: 4 },
        level2: { current: 3, max: 3 },
        level3: { current: 2, max: 2 },
        level4: { current: 0, max: 0 },
        level5: { current: 0, max: 0 },
        level6: { current: 0, max: 0 },
        level7: { current: 0, max: 0 },
        level8: { current: 0, max: 0 },
        level9: { current: 0, max: 0 },
      } as any;
      const state = slotsToSpellPoints(slots, 5);
      expect(state.current).toBe(27);
      expect(state.max).toBe(27);
      expect(state.maxSlotLevel).toBeGreaterThanOrEqual(3);
    });

    it("handles null slots by using level table", () => {
      const state = slotsToSpellPoints(null, 5);
      expect(state.max).toBe(27);
      expect(state.enabled).toBe(true);
    });

    it("handles level 1 with zero slots gracefully", () => {
      const state = slotsToSpellPoints(null, 1);
      expect(state.max).toBe(4);
    });
  });

  // ── Spend Spell Points ──
  describe("spendSpellPoints", () => {
    const fullState: SpellPointState = { current: 27, max: 27, maxSlotLevel: 3, enabled: true };

    it("casts a level 3 spell (5 SP)", () => {
      const result = spendSpellPoints(fullState, 3);
      expect(result.success).toBe(true);
      expect(result.cost).toBe(5);
      expect(result.updatedState.current).toBe(22);
    });

    it("rejects cast when insufficient points", () => {
      const lowState: SpellPointState = { current: 3, max: 27, maxSlotLevel: 3, enabled: true };
      const result = spendSpellPoints(lowState, 3);
      expect(result.success).toBe(false);
      expect(result.error).toContain("Not enough");
    });

    it("rejects cast above max slot level", () => {
      const result = spendSpellPoints(fullState, 5);
      expect(result.success).toBe(false);
      expect(result.error).toContain("max: level 3");
    });

    it("rejects invalid spell level (0 or 10+)", () => {
      expect(spendSpellPoints(fullState, 0).success).toBe(false);
      expect(spendSpellPoints(fullState, 10).success).toBe(false);
    });

    it("rejects when spell points disabled", () => {
      const disabled: SpellPointState = { current: 27, max: 27, maxSlotLevel: 3, enabled: false };
      expect(spendSpellPoints(disabled, 1).success).toBe(false);
    });
  });

  // ── Restore Spell Points ──
  describe("restoreSpellPoints", () => {
    const partialState: SpellPointState = { current: 15, max: 27, maxSlotLevel: 3, enabled: true };

    it("restores to full when no amount specified", () => {
      const result = restoreSpellPoints(partialState);
      expect(result.updatedState.current).toBe(27);
      expect(result.restored).toBe(12);
    });

    it("restores specific amount", () => {
      const result = restoreSpellPoints(partialState, 5);
      expect(result.updatedState.current).toBe(20);
      expect(result.restored).toBe(5);
    });

    it("does not exceed max", () => {
      const result = restoreSpellPoints(partialState, 100);
      expect(result.updatedState.current).toBe(27);
    });
  });

  // ── Available Levels ──
  describe("getAvailableSpellLevelsFromPoints", () => {
    it("returns all levels up to maxSlotLevel", () => {
      const state: SpellPointState = { current: 27, max: 27, maxSlotLevel: 5, enabled: true };
      const available = getAvailableSpellLevelsFromPoints(state);
      expect(available).toHaveLength(5);
      expect(available[0].level).toBe(1);
      expect(available[4].level).toBe(5);
    });

    it("marks levels as uncastable when insufficient points", () => {
      const state: SpellPointState = { current: 4, max: 27, maxSlotLevel: 5, enabled: true };
      const available = getAvailableSpellLevelsFromPoints(state);
      expect(available[0].canCast).toBe(true); // Lv1 costs 2
      expect(available[1].canCast).toBe(true); // Lv2 costs 3
      expect(available[2].canCast).toBe(false); // Lv3 costs 5
    });
  });

  describe("getUpcastCost", () => {
    it("pays target level cost when upcasting", () => {
      expect(getUpcastCost(1, 3)).toBe(5); // Pay L3 cost
    });
    it("pays base cost when same level", () => {
      expect(getUpcastCost(1, 1)).toBe(2);
    });
  });

  describe("createSlotWithPoints", () => {
    it("creates a slot at valid level", () => {
      const state: SpellPointState = { current: 27, max: 27, maxSlotLevel: 3, enabled: true };
      const result = createSlotWithPoints(state, 3);
      expect(result.success).toBe(true);
      expect(result.createdLevel).toBe(3);
    });
    it("rejects invalid levels", () => {
      const state: SpellPointState = { current: 27, max: 27, maxSlotLevel: 3, enabled: true };
      expect(createSlotWithPoints(state, 0).success).toBe(false);
      expect(createSlotWithPoints(state, 10).success).toBe(false);
    });
  });
});

// ─── Module 2: Damage Type Engine ───

import {
  resolveDamageType,
  applyDamageTypes,
  getDamageEffectColor,
  getDamageEffectLabel,
  formatDamageType,
  DAMAGE_TYPES,
} from "@/lib/combat/damage-type-engine";

describe("Damage Type Engine", () => {
  // ── All 13 damage types covered ──
  describe("DAMAGE_TYPES", () => {
    it("has 13 standard 5e damage types", () => {
      expect(DAMAGE_TYPES).toHaveLength(13);
      expect(DAMAGE_TYPES).toContain("fire");
      expect(DAMAGE_TYPES).toContain("piercing");
      expect(DAMAGE_TYPES).toContain("psychic");
    });
  });

  // ── resolveDamageType ──
  describe("resolveDamageType — all 5 outcomes", () => {
    it("immunity => 0 damage", () => {
      const r = resolveDamageType(28, "fire", [], ["fire"], []);
      expect(r.effect).toBe("immune");
      expect(r.finalDamage).toBe(0);
    });

    it("resistance => half damage (rounded down)", () => {
      const r = resolveDamageType(15, "fire", ["fire"], [], []);
      expect(r.effect).toBe("resistance");
      expect(r.finalDamage).toBe(7); // floor(15/2)
    });

    it("vulnerability => double damage", () => {
      const r = resolveDamageType(10, "fire", [], [], ["fire"]);
      expect(r.effect).toBe("vulnerability");
      expect(r.finalDamage).toBe(20);
    });

    it("standard => unchanged damage", () => {
      const r = resolveDamageType(10, "fire", [], [], []);
      expect(r.effect).toBe("standard");
      expect(r.finalDamage).toBe(10);
    });

    it("resistance + vulnerability cancel out (standard)", () => {
      const r = resolveDamageType(10, "fire", ["fire"], [], ["fire"]);
      expect(r.effect).toBe("standard");
      expect(r.finalDamage).toBe(10);
    });

    it("immunity beats vulnerability", () => {
      const r = resolveDamageType(28, "fire", [], ["fire"], ["fire"]);
      expect(r.effect).toBe("immune");
      expect(r.finalDamage).toBe(0);
    });

    it("case-insensitive matching", () => {
      const r = resolveDamageType(10, "Fire", [], ["FIRE"], []);
      expect(r.effect).toBe("immune");
    });

    it("non-matching resistance has no effect", () => {
      const r = resolveDamageType(10, "fire", ["cold"], [], []);
      expect(r.effect).toBe("standard");
    });
  });

  // ── applyDamageTypes ──
  describe("applyDamageTypes", () => {
    it("single damage type resolves correctly", () => {
      const result = applyDamageTypes(20, ["fire"], [], ["fire"], []);
      expect(result.results).toHaveLength(1);
      expect(result.totalFinalDamage).toBe(0);
    });

    it("multiple damage types include secondary at ~30%", () => {
      const result = applyDamageTypes(20, ["fire", "poison"], [], [], []);
      expect(result.results).toHaveLength(2);
      expect(result.totalFinalDamage).toBeGreaterThan(20); // 20 + 6 = 26
    });

    it("empty damage types returns zero", () => {
      const result = applyDamageTypes(20, [], [], [], []);
      expect(result.results).toHaveLength(0);
      expect(result.totalFinalDamage).toBe(0);
    });
  });

  // ── Display utilities ──
  describe("getDamageEffectColor", () => {
    it("returns color config for all 4 effects", () => {
      expect(getDamageEffectColor("immune").text).toBeTruthy();
      expect(getDamageEffectColor("resistance").text).toBeTruthy();
      expect(getDamageEffectColor("vulnerability").text).toBeTruthy();
      expect(getDamageEffectColor("standard").text).toBeTruthy();
    });
  });

  describe("getDamageEffectLabel", () => {
    it("returns readable labels", () => {
      expect(getDamageEffectLabel("immune")).toBe("Immune");
      expect(getDamageEffectLabel("vulnerability")).toBe("Vulnerable");
    });
  });

  describe("formatDamageType", () => {
    it("capitalizes first letter", () => {
      expect(formatDamageType("fire")).toBe("Fire");
      expect(formatDamageType("bludgeoning")).toBe("Bludgeoning");
    });
  });
});

// ─── Module 3: Initiative Engine ───

import {
  getDexModifier,
  sortByInitiative,
  buildCombatantFromToken,
  buildCombatantsFromTokens,
  getInitiativeRange,
  generateCombatantId,
} from "@/lib/combat/initiative-engine";

import type { Combatant } from "@/types";

describe("Initiative Engine", () => {
  // ── DEX Modifier ──
  describe("getDexModifier", () => {
    it("DEX 10 => +0", () => expect(getDexModifier(10)).toBe(0));
    it("DEX 14 => +2", () => expect(getDexModifier(14)).toBe(2));
    it("DEX 20 => +5", () => expect(getDexModifier(20)).toBe(5));
    it("DEX 1 => -5", () => expect(getDexModifier(1)).toBe(-5));
    it("DEX 30 => +10", () => expect(getDexModifier(30)).toBe(10));
  });

  // ── Initiative Range ──
  describe("getInitiativeRange", () => {
    it("DEX 10 => range 1-20, avg 10.5", () => {
      const range = getInitiativeRange(10);
      expect(range.min).toBe(1);
      expect(range.max).toBe(20);
      expect(range.avg).toBe(10.5);
    });
    it("DEX 14 => range 3-22, avg 12.5", () => {
      const range = getInitiativeRange(14);
      expect(range.min).toBe(3);
      expect(range.max).toBe(22);
      expect(range.avg).toBe(12.5);
    });
  });

  // ── Sort by Initiative (5e RAW Tiebreaker) ──
  describe("sortByInitiative — 5e RAW tiebreaker", () => {
    const makeCombatant = (
      id: string,
      name: string,
      init: number,
      dexMod: number = 0
    ): Combatant => {
      const c: Combatant = {
        id,
        name,
        type: "enemy",
        initiative: init,
        armorClass: 10,
        hitPoints: { current: 10, max: 10, temporary: 0 },
        statusEffects: [],
        isDead: false,
        isConcentrating: false,
        notes: "",
      };
      (c as any).dexMod = dexMod;
      return c;
    };

    it("sorts by initiative descending", () => {
      const combatants = [
        makeCombatant("a", "Goblin", 10),
        makeCombatant("b", "Dragon", 20),
        makeCombatant("c", "Wizard", 15),
      ];
      const sorted = sortByInitiative(combatants);
      expect(sorted[0].name).toBe("Dragon");
      expect(sorted[1].name).toBe("Wizard");
      expect(sorted[2].name).toBe("Goblin");
    });

    it("breaks ties by DEX modifier", () => {
      const combatants = [
        makeCombatant("a", "Alice", 15, 3),
        makeCombatant("b", "Bob", 15, 5),
      ];
      const sorted = sortByInitiative(combatants);
      expect(sorted[0].name).toBe("Bob");
      expect(sorted[1].name).toBe("Alice");
    });

    it("alphabetical when init and DEX tie", () => {
      const combatants = [
        makeCombatant("b", "Zara", 15, 2),
        makeCombatant("a", "Able", 15, 2),
      ];
      const sorted = sortByInitiative(combatants);
      expect(sorted[0].name).toBe("Able");
      expect(sorted[1].name).toBe("Zara");
    });

    it("does not mutate the original array", () => {
      const original = [makeCombatant("a", "B", 15), makeCombatant("b", "A", 20)];
      const sorted = sortByInitiative(original);
      expect(original[0].name).toBe("B");
      expect(sorted[0].name).toBe("A");
    });

    it("handles empty array", () => {
      expect(sortByInitiative([])).toHaveLength(0);
    });

    it("handles single combatant", () => {
      const single = [makeCombatant("a", "Solo", 15)];
      expect(sortByInitiative(single)).toHaveLength(1);
    });
  });

  // ── buildCombatantFromToken ──
  describe("buildCombatantFromToken", () => {
    it("builds a valid combatant with initiative", () => {
      const { combatant } = buildCombatantFromToken(
        { id: "t1", name: "Goblin", type: "enemy", hp: { current: 10, max: 10 }, armorClass: 15 },
        12
      );
      expect(combatant.name).toBe("Goblin");
      expect(combatant.type).toBe("enemy");
      expect(combatant.armorClass).toBe(15);
      expect(combatant.hitPoints.max).toBe(10);
      expect(combatant.initiative).toBeGreaterThanOrEqual(2); // DEX 12 = +1, min roll 1
      expect(combatant.initiative).toBeLessThanOrEqual(21); // max roll 20 + 1
    });

    it("falls back to AC 10 / HP 10 when not provided", () => {
      const { combatant } = buildCombatantFromToken(
        { id: "t2", name: "Unknown", type: "enemy" },
        10
      );
      expect(combatant.armorClass).toBe(10);
      expect(combatant.hitPoints.max).toBe(10);
    });
  });

  // ── buildCombatantsFromTokens ──
  describe("buildCombatantsFromTokens", () => {
    it("builds multiple combatants sorted by initiative", () => {
      const tokens = [
        { id: "t1", name: "Slow", type: "enemy" as const, dexScore: 8 },
        { id: "t2", name: "Fast", type: "enemy" as const, dexScore: 16 },
      ];
      const { combatants, rollResults } = buildCombatantsFromTokens(tokens);
      expect(combatants).toHaveLength(2);
      expect(rollResults).toHaveLength(2);
      // Fast should have higher initiative on average
      expect(combatants[0].initiative).toBeGreaterThanOrEqual(combatants[1].initiative);
    });

    it("handles empty token list", () => {
      const { combatants, rollResults } = buildCombatantsFromTokens([]);
      expect(combatants).toHaveLength(0);
      expect(rollResults).toHaveLength(0);
    });
  });

  // ── generateCombatantId ──
  describe("generateCombatantId", () => {
    it("produces unique IDs", () => {
      const ids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        ids.add(generateCombatantId());
      }
      expect(ids.size).toBe(100);
    });

    it("starts with cmb_ prefix", () => {
      expect(generateCombatantId()).toMatch(/^cmb_/);
    });
  });
});
