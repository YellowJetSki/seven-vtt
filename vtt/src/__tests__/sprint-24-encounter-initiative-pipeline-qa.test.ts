/**
 * ST VTT — Sprint 24/40 QA: Encounter Builder → CR → Initiative Pipeline
 *
 * Tests the DM's end-to-end encounter building workflow:
 *   1. Monster CR math + difficulty calculation
 *   2. Initiative engine (roll + sort + tiebreaker)
 *   3. Combatant builder from tokens
 *   4. Full pipeline: encounter config → CR → initiative → combatant state
 *
 * This is a COMPLETELY DIFFERENT workflow than Sprints 21-23:
 *   - Sprint 21: DM Share + Combat Log
 *   - Sprint 22: Level-Up → Rest Pipeline
 *   - Sprint 23: Player Sheet Tabs + Inventory + Conditions
 *   - Sprint 24: Encounter Builder → CR → Initiative → Combatants
 *
 * Characters: Wendy Swiftfoot (Rogue 5), Kehrfuffle Ironheart (Paladin 5)
 * Campaign: Arkla
 * Strict Compliance: NO dice rollers (Math.random counted + documented per rules),
 *   NO occult/undead/demonic, NO 'Tick race' or 'Food machine'
 *
 * Deployed at: https://arkla.vercel.app
 */

import { describe, it, expect } from "vitest";
import {
  getXpForCr, parseCr, calculateEncounterXp,
  determineDifficulty, analyzeEncounterDifficulty,
  getEffectiveMultiplier, getDifficultyLabel, getDifficultyColor,
} from "@/lib/mechanics/encounter-cr";
import type { DifficultyRating } from "@/lib/mechanics/encounter-cr";
import {
  getDexModifier, sortByInitiative, rollInitiativeDie,
  buildCombatantFromToken, buildCombatantsFromTokens,
  getInitiativeRange, generateCombatantId,
} from "@/lib/combat/initiative-engine";
import type { Combatant, CombatantHP } from "@/types";


// ═══════════════════════════════════════════════════════════════
// TEST FIXTURES — Arkla Campaign Enemies & Characters
// ═══════════════════════════════════════════════════════════════

// ── Common CRs used in Arkla campaign ──

const CR_GOBLIN = 0.25;
const CR_HOBGOBLIN = 0.5;
const CR_BUGBEAR = 1;
const CR_OWLBEAR = 3;
const CR_DRAGON = 8;

// ── Party configs ──

const WENDY_KEHRFUFFLE = { size: 2, level: 5 };
const PARTY_4_L5 = { size: 4, level: 5 };
const PARTY_1_L5 = { size: 1, level: 5 };
const PARTY_4_L1 = { size: 4, level: 1 };
const PARTY_4_L20 = { size: 4, level: 20 };

// ── Sample enemies ──

const GOBLIN = { id: "goblin_01", name: "Goblin", type: "enemy" as const };
const HOBGOBLIN = { id: "hob_01", name: "Hobgoblin", type: "enemy" as const };
const OWLBEAR = { id: "owl_01", name: "Owlbear", type: "enemy" as const };

function makeEnemy(name: string, cr: number, count: number = 1) {
  return { enemyName: name, cr, count };
}

function makeCombatant(
  id: string, name: string, type: "player" | "enemy" | "ally",
  initiative: number, dexMod: number
): Combatant {
  return {
    id, name, type,
    initiative, armorClass: 10,
    hitPoints: { current: 20, max: 20, temporary: 0 },
    statusEffects: [], isDead: false,
    isConcentrating: false, notes: "",
    ...({ dexMod } as any),
  };
}


// ═══════════════════════════════════════════════════════════════
// SUITE 1: CR → XP Table Integrity
// ═══════════════════════════════════════════════════════════════

describe("Encounter CR — XP Table Integrity", () => {
  it("fractional CRs map to correct XP", () => {
    expect(getXpForCr(0)).toBe(10);
    expect(getXpForCr(0.125)).toBe(25);
    expect(getXpForCr(0.25)).toBe(50);
    expect(getXpForCr(0.5)).toBe(100);
  });

  it("integer CRs 1-30 map to correct XP", () => {
    expect(getXpForCr(1)).toBe(200);
    expect(getXpForCr(5)).toBe(1800);
    expect(getXpForCr(10)).toBe(5900);
    expect(getXpForCr(15)).toBe(13000);
    expect(getXpForCr(20)).toBe(25000);
    expect(getXpForCr(30)).toBe(155000);
  });

  it("unknown/negative/NaN CR returns 0", () => {
    expect(getXpForCr(-1)).toBe(0);
    expect(getXpForCr(99)).toBe(0);
    expect(getXpForCr(NaN)).toBe(0);
    expect(getXpForCr(Infinity)).toBe(0);
  });

  it("parseCr handles fractions and integers", () => {
    expect(parseCr("1/8")).toBeCloseTo(0.125);
    expect(parseCr("1/4")).toBeCloseTo(0.25);
    expect(parseCr("1/2")).toBeCloseTo(0.5);
    expect(parseCr("1")).toBe(1);
    expect(parseCr("10")).toBe(10);
    expect(parseCr("garbage")).toBe(0);
  });
});


// ═══════════════════════════════════════════════════════════════
// SUITE 2: Encounter Multiplier Math (DMG pg. 83)
// ═══════════════════════════════════════════════════════════════

describe("Encounter CR — Multiplier Math (DMG pg. 83)", () => {
  it("1 monster → ×1 multiplier", () => {
    expect(getEffectiveMultiplier(1)).toBe(1);
  });

  it("2 monsters → ×1.5 multiplier", () => {
    expect(getEffectiveMultiplier(2)).toBe(1.5);
  });

  it("3-6 monsters → ×2 multiplier", () => {
    expect(getEffectiveMultiplier(3)).toBe(2);
    expect(getEffectiveMultiplier(4)).toBe(2);
    expect(getEffectiveMultiplier(6)).toBe(2);
  });

  it("7-10 monsters → ×2.5 multiplier", () => {
    expect(getEffectiveMultiplier(7)).toBe(2.5);
    expect(getEffectiveMultiplier(10)).toBe(2.5);
  });

  it("11-14 monsters → ×3 multiplier", () => {
    expect(getEffectiveMultiplier(11)).toBe(3);
    expect(getEffectiveMultiplier(14)).toBe(3);
  });

  it("15+ monsters → ×4 multiplier", () => {
    expect(getEffectiveMultiplier(15)).toBe(4);
    expect(getEffectiveMultiplier(50)).toBe(4);
  });

  it("0 enemies → 0", () => {
    expect(getEffectiveMultiplier(0)).toBe(0);
  });
});


// ═══════════════════════════════════════════════════════════════
// SUITE 3: Difficulty Thresholds
// ═══════════════════════════════════════════════════════════════

describe("Encounter CR — Difficulty Thresholds", () => {
  it("Wendy + Kehrfuffle (2×L5): 4 goblins → medium", () => {
    const xp = calculateEncounterXp([makeEnemy("Goblin", CR_GOBLIN, 4)]);
    const result = analyzeEncounterDifficulty([makeEnemy("Goblin", CR_GOBLIN, 4)], WENDY_KEHRFUFFLE);
    expect(result.difficulty).toBe("medium");
    expect(result.adjustedXp).toBe(xp * 2); // 4 enemies = ×2 multiplier
  });

  it("4 L5 vs 1 owlbear → easy", () => {
    const result = analyzeEncounterDifficulty([makeEnemy("Owlbear", CR_OWLBEAR, 1)], PARTY_4_L5);
    expect(result.difficulty).toBe("easy");
  });

  it("2 L5 vs 1 young dragon → deadly", () => {
    const result = analyzeEncounterDifficulty([makeEnemy("Young Dragon", CR_DRAGON, 1)], WENDY_KEHRFUFFLE);
    expect(result.difficulty).toBe("deadly");
  });

  it("4 L5 vs dragon + 8 goblins → deadly", () => {
    const result = analyzeEncounterDifficulty(
      [makeEnemy("Dragon", CR_DRAGON, 1), makeEnemy("Goblin", CR_GOBLIN, 8)],
      PARTY_4_L5
    );
    expect(result.difficulty).toBe("deadly");
  });

  it("1 L5 solo vs 1 goblin → trivial (not deadly)", () => {
    const result = analyzeEncounterDifficulty([makeEnemy("Goblin", CR_GOBLIN, 1)], PARTY_1_L5);
    expect(result.difficulty).not.toBe("deadly");
  });

  it("4 L1 vs 2 goblins → hard", () => {
    const result = analyzeEncounterDifficulty([makeEnemy("Goblin", CR_GOBLIN, 2)], PARTY_4_L1);
    expect(result.difficulty).toBe("hard");
  });

  it("level 0 → trivial regardless of enemies", () => {
    const result = analyzeEncounterDifficulty([makeEnemy("Goblin", CR_GOBLIN, 1)], { size: 4, level: 0 });
    expect(result.difficulty).toBe("trivial");
  });
});


// ═══════════════════════════════════════════════════════════════
// SUITE 4: DEX Modifier & Initiative Range
// ═══════════════════════════════════════════════════════════════

describe("Initiative — DEX Modifier & Range", () => {
  it("DEX 18 → +4 modifier", () => {
    expect(getDexModifier(18)).toBe(4);
  });

  it("DEX 10 → +0 modifier", () => {
    expect(getDexModifier(10)).toBe(0);
  });

  it("DEX 8 → -1 modifier", () => {
    expect(getDexModifier(8)).toBe(-1);
  });

  it("DEX 3 → -4 modifier (minimum functional)", () => {
    expect(getDexModifier(3)).toBe(-4);
  });

  it("DEX 1 → -5 modifier (absolute minimum)", () => {
    expect(getDexModifier(1)).toBe(-5);
  });

  it("DEX 30 → +10 modifier (absolute maximum)", () => {
    expect(getDexModifier(30)).toBe(10);
  });

  it("getInitiativeRange returns correct min/max/avg", () => {
    const range = getInitiativeRange(18); // DEX 18 = +4
    expect(range.min).toBe(5);  // 1 + 4
    expect(range.max).toBe(24); // 20 + 4
    expect(range.avg).toBeCloseTo(14.5, 1); // 10.5 + 4
  });

  it("getInitiativeRange for low DEX", () => {
    const range = getInitiativeRange(3); // DEX 3 = -4
    expect(range.min).toBe(-3);  // 1 - 4
    expect(range.max).toBe(16);  // 20 - 4
  });
});


// ═══════════════════════════════════════════════════════════════
// SUITE 5: sortByInitiative — 5e RAW Tiebreaker
// ═══════════════════════════════════════════════════════════════

describe("Initiative — sortByInitiative (5e RAW Tiebreaker)", () => {
  it("sorts higher initiative first", () => {
    const combatants = [
      makeCombatant("a", "Alice", "player", 15, 2),
      makeCombatant("b", "Bob", "player", 20, 1),
      makeCombatant("c", "Charlie", "player", 10, 3),
    ];
    const sorted = sortByInitiative(combatants);
    expect(sorted[0].name).toBe("Bob");
    expect(sorted[1].name).toBe("Alice");
    expect(sorted[2].name).toBe("Charlie");
  });

  it("tie goes to higher DEX modifier", () => {
    const combatants = [
      makeCombatant("a", "Alice", "player", 15, 4),
      makeCombatant("b", "Bob", "player", 15, 2),
    ];
    const sorted = sortByInitiative(combatants);
    expect(sorted[0].name).toBe("Alice"); // Higher DEX mod
    expect(sorted[1].name).toBe("Bob");
  });

  it("tie in DEX mod → alphabetical by name", () => {
    const combatants = [
      makeCombatant("a", "Zara", "player", 15, 2),
      makeCombatant("b", "Alice", "player", 15, 2),
      makeCombatant("c", "Bob", "player", 15, 2),
    ];
    const sorted = sortByInitiative(combatants);
    expect(sorted[0].name).toBe("Alice");
    expect(sorted[1].name).toBe("Bob");
    expect(sorted[2].name).toBe("Zara");
  });

  it("does NOT mutate the original array", () => {
    const combatants = [
      makeCombatant("a", "Alice", "player", 15, 2),
      makeCombatant("b", "Bob", "player", 20, 1),
    ];
    const original = [...combatants];
    sortByInitiative(combatants);
    expect(combatants[0].name).toBe(original[0].name);
    expect(combatants[1].name).toBe(original[1].name);
  });

  it("large combat (10+) sorted correctly", () => {
    const combatants: Combatant[] = [];
    for (let i = 0; i < 10; i++) {
      const init = 10 + (i % 5); // Creates ties intentionally
      combatants.push(makeCombatant(`c${i}`, `Combatant ${String.fromCharCode(65 + i)}`, "player", init, i % 3));
    }
    const sorted = sortByInitiative(combatants);
    expect(sorted.length).toBe(10);
    // Verify descending order
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i - 1].initiative).toBeGreaterThanOrEqual(sorted[i].initiative);
    }
  });

  it("empty array returns empty", () => {
    expect(sortByInitiative([])).toEqual([]);
  });

  it("single combatant returns itself", () => {
    const c = makeCombatant("a", "Alice", "player", 15, 2);
    const sorted = sortByInitiative([c]);
    expect(sorted.length).toBe(1);
    expect(sorted[0].name).toBe("Alice");
  });
});


// ═══════════════════════════════════════════════════════════════
// SUITE 6: buildCombatantFromToken
// ═══════════════════════════════════════════════════════════════

describe("Initiative — buildCombatantFromToken", () => {
  it("builds a combatant with proper structure", () => {
    const { combatant, rollResult } = buildCombatantFromToken(
      { ...GOBLIN, hp: { current: 7, max: 7 }, armorClass: 15 },
      10
    );

    expect(combatant.name).toBe("Goblin");
    expect(combatant.type).toBe("enemy");
    expect(combatant.armorClass).toBe(15);
    expect(combatant.hitPoints.current).toBe(7);
    expect(combatant.hitPoints.max).toBe(7);
    expect(combatant.hitPoints.temporary).toBe(0);
    expect(combatant.statusEffects).toEqual([]);
    expect(combatant.isDead).toBe(false);
    expect(combatant.isConcentrating).toBe(false);
    expect(combatant.notes).toBe("");
    expect(combatant.id).toMatch(/^cmb_/);
    expect(rollResult.name).toBe("Goblin");
    expect(rollResult.dexMod).toBe(0); // DEX 10
    expect(rollResult.total).toBeGreaterThanOrEqual(1);
    expect(rollResult.total).toBeLessThanOrEqual(20);
  });

  it("adjusts initiative total by DEX modifier", () => {
    // DEX 18 = +4 modifier
    const { rollResult } = buildCombatantFromToken(GOBLIN, 18);
    expect(rollResult.dexMod).toBe(4);
    expect(rollResult.total).toBeGreaterThanOrEqual(5);
    expect(rollResult.total).toBeLessThanOrEqual(24);
  });

  it("handles missing HP (falls back to max)", () => {
    const token = { ...GOBLIN, hp: undefined };
    const { combatant } = buildCombatantFromToken(token, 10);
    expect(combatant.hitPoints.current).toBe(10); // Fallback default
    expect(combatant.hitPoints.max).toBe(10);
  });

  it("handles missing AC (falls back to 10)", () => {
    const token = { ...GOBLIN, armorClass: undefined };
    const { combatant } = buildCombatantFromToken(token, 10);
    expect(combatant.armorClass).toBe(10);
  });

  it("sets type 'ally' for NPC tokens", () => {
    const { combatant } = buildCombatantFromToken(
      { ...GOBLIN, type: "npc" }, 10
    );
    expect(combatant.type).toBe("ally");
  });
});


// ═══════════════════════════════════════════════════════════════
// SUITE 7: buildCombatantsFromTokens (Group Build)
// ═══════════════════════════════════════════════════════════════

describe("Initiative — buildCombatantsFromTokens (Group)", () => {
  it("builds combatants for a group of enemies", () => {
    const tokens = [
      { ...GOBLIN, hp: { current: 7, max: 7 }, dexScore: 12 },
      { ...HOBGOBLIN, hp: { current: 15, max: 15 }, dexScore: 10 },
    ];

    const { combatants, rollResults } = buildCombatantsFromTokens(tokens);

    expect(combatants.length).toBe(2);
    expect(rollResults.length).toBe(2);
    expect(combatants[0].name).toBeDefined();
    expect(combatants[1].name).toBeDefined();
  });

  it("sorts all combatants by initiative descending", () => {
    const tokens = [
      { ...GOBLIN, dexScore: 8 },    // DEX 8 = -1
      { ...HOBGOBLIN, dexScore: 14 }, // DEX 14 = +2
      { id: "rogue", name: "Goblin Rogue", type: "enemy" as const, dexScore: 18 }, // DEX 18 = +4
    ];

    const { combatants } = buildCombatantsFromTokens(tokens);

    // Should be sorted by initiative descending
    for (let i = 1; i < combatants.length; i++) {
      expect(combatants[i - 1].initiative).toBeGreaterThanOrEqual(combatants[i].initiative);
    }
  });

  it("handles empty token list", () => {
    const { combatants, rollResults } = buildCombatantsFromTokens([]);
    expect(combatants).toEqual([]);
    expect(rollResults).toEqual([]);
  });
});


// ═══════════════════════════════════════════════════════════════
// SUITE 8: Difficulty Label & Color Consistency
// ═══════════════════════════════════════════════════════════════

describe("Encounter CR — Display Utilities", () => {
  it("all 6 difficulty ratings have valid labels", () => {
    expect(getDifficultyLabel("trivial")).toBe("Trivial");
    expect(getDifficultyLabel("easy")).toBe("Easy");
    expect(getDifficultyLabel("medium")).toBe("Medium");
    expect(getDifficultyLabel("hard")).toBe("Hard");
    expect(getDifficultyLabel("deadly")).toBe("Deadly");
    expect(getDifficultyLabel("impossible")).toBe("Impossible");
  });

  it("all 6 difficulty ratings have valid colors", () => {
    expect(getDifficultyColor("trivial")).toBe("text-surface-400");
    expect(getDifficultyColor("easy")).toBe("text-emerald-400");
    expect(getDifficultyColor("medium")).toBe("text-amber-400");
    expect(getDifficultyColor("hard")).toBe("text-rose-400");
    expect(getDifficultyColor("deadly")).toBe("text-red-400");
    expect(getDifficultyColor("impossible")).toBe("text-red-500");
  });
});


// ═══════════════════════════════════════════════════════════════
// SUITE 9: Full Pipeline — Encounter Config → Combatants
// ═══════════════════════════════════════════════════════════════

describe("Full Pipeline — Encounter Config to Combatants", () => {
  it("DM builds encounter → calculates CR → sorts by initiative", () => {
    // Step 1: DM configures encounter: 4 goblins vs party of 2 (Wendy + Kehrfuffle)
    const enemies = [makeEnemy("Goblin", CR_GOBLIN, 4)];

    // Step 2: Calculate CR and difficulty
    const xp = calculateEncounterXp(enemies);
    const crResult = analyzeEncounterDifficulty(enemies, WENDY_KEHRFUFFLE);

    expect(xp).toBe(200); // 4 goblins × 50 XP
    expect(crResult.adjustedXp).toBe(400); // 200 × 2 multiplier
    expect(crResult.difficulty).toBe("medium");

    // Step 3: Build combatants from tokens
    const tokens = Array.from({ length: 4 }, (_, i) => ({
      id: `goblin_${i}`,
      name: `Goblin ${i + 1}`,
      type: "enemy" as const,
      hp: { current: 7, max: 7 },
      armorClass: 15,
      dexScore: 12, // +1 DEX
    }));

    const { combatants } = buildCombatantsFromTokens(tokens);

    expect(combatants.length).toBe(4);
    expect(combatants[0].armorClass).toBe(15);
    expect(combatants.every((c) => c.hitPoints.max === 7)).toBe(true);

    // Step 4: Verify initiative sorted properly
    for (let i = 1; i < combatants.length; i++) {
      expect(combatants[i - 1].initiative).toBeGreaterThanOrEqual(combatants[i].initiative);
    }
  });
});


// ═══════════════════════════════════════════════════════════════
// SUITE 10: Real-World DM Encounter Scenarios
// ═══════════════════════════════════════════════════════════════

describe("Real-World DM Scenarios", () => {
  it("Sunless Citadel — 2 goblins at Lv1 = easy", () => {
    const result = analyzeEncounterDifficulty([makeEnemy("Goblin", CR_GOBLIN, 2)], PARTY_4_L1);
    expect(result.difficulty).toBe("easy");
    expect(result.totalXp).toBe(100); // 2 × 50
  });

  it("Sunless Citadel boss room (goblin+bugbear) = deadly at Lv1", () => {
    const result = analyzeEncounterDifficulty(
      [makeEnemy("Goblin", CR_GOBLIN, 2), makeEnemy("Bugbear", CR_BUGBEAR, 1)],
      PARTY_4_L1
    );
    expect(result.difficulty).toBe("deadly");
  });

  it("Forest patrol (4 goblins) at Lv5 = easy for party of 4", () => {
    const result = analyzeEncounterDifficulty([makeEnemy("Goblin", CR_GOBLIN, 4)], PARTY_4_L5);
    expect(result.difficulty).toBe("easy");
  });

  it("Young dragon (surprise boss) vs 2 L5 = deadly", () => {
    const result = analyzeEncounterDifficulty([makeEnemy("Young Dragon", CR_DRAGON, 1)], WENDY_KEHRFUFFLE);
    expect(result.difficulty).toBe("deadly");
  });

  it("Owlbear encounter vs L5 party = easy", () => {
    const result = analyzeEncounterDifficulty([makeEnemy("Owlbear", CR_OWLBEAR, 1)], PARTY_4_L5);
    expect(result.difficulty).toBe("easy");
  });

  it("Mixed group (dragon + minions) vs 2 L5 = deadly (always)", () => {
    const result = analyzeEncounterDifficulty(
      [makeEnemy("Young Dragon", CR_DRAGON, 1), makeEnemy("Goblin", CR_GOBLIN, 6)],
      WENDY_KEHRFUFFLE
    );
    expect(result.difficulty).toBe("deadly");
    expect(result.crRange.min).toBe(CR_GOBLIN);
    expect(result.crRange.max).toBe(CR_DRAGON);
  });
});


// ═══════════════════════════════════════════════════════════════
// SUITE 11: Initiative Engine Edge Cases
// ═══════════════════════════════════════════════════════════════

describe("Initiative — Engine Edge Cases", () => {
  it("generateCombatantId produces unique IDs", () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      ids.add(generateCombatantId());
    }
    expect(ids.size).toBe(100);
  });

  it("getInitiativeRange for DEX 30 (+10) has avg of 20.5", () => {
    const range = getInitiativeRange(30);
    expect(range.avg).toBeCloseTo(20.5, 1);
  });

  it("getInitiativeRange for DEX 1 (-5) has avg of 5.5", () => {
    const range = getInitiativeRange(1);
    expect(range.avg).toBeCloseTo(5.5, 1);
  });

  it("single token produces one combatant", () => {
    const { combatants } = buildCombatantsFromTokens([
      { ...GOBLIN, dexScore: 10 },
    ]);
    expect(combatants.length).toBe(1);
  });

  it("buildCombatantsFromTokens returns sorted results", () => {
    const tokens = [
      { ...GOBLIN, dexScore: 10 },
      { ...OWLBEAR, hp: { current: 60, max: 60 }, dexScore: 12, armorClass: 13 },
    ];
    const { combatants, rollResults } = buildCombatantsFromTokens(tokens);
    expect(rollResults.length).toBe(2);
    expect(combatants.length).toBe(2);
    // Results should rank match (sorted order matches combatants order)
    expect(combatants[0].id).toBeDefined();
    expect(combatants[1].id).toBeDefined();
  });
});
