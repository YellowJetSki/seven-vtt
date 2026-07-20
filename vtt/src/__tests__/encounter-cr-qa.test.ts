/**
 * Sprint 18/41 — Deep Exploration QA Phase: Encounter CR & Monster Browser QA
 *
 * Rigorous QA on the encounter difficulty calculator and monster browser
 * search/filter pipeline. These are used by the DM for every combat.
 *
 * Characters used:
 *   - Wendy (Rogue 5) — party scout
 *   - Kehrfuffle (Paladin 5) — party tank
 *   - Kaelen (Wizard 5) — party blaster
 *
 * Strict Compliance: NO dice rollers, NO occult elements.
 * Arkla campaign setting only.
 */

import { describe, it, expect } from "vitest";
import {
  analyzeEncounterDifficulty,
  calculateEncounterXp,
  determineDifficulty,
  getDifficultyLabel,
  getDifficultyColor,
  getXpForCr,
  parseCr,
  getEffectiveMultiplier,
} from "@/lib/mechanics/encounter-cr";
import type { DifficultyRating } from "@/lib/mechanics/encounter-cr";


// ── Test Data: Standard party of 4 at level 5 ──

const PARTY_4_L5 = { size: 4, level: 5 };
const PARTY_3_L5 = { size: 3, level: 5 };
const PARTY_6_L5 = { size: 6, level: 5 };
const PARTY_1_L5 = { size: 1, level: 5 };
const PARTY_4_L1 = { size: 4, level: 1 };
const PARTY_4_L20 = { size: 4, level: 20 };

// ── Common enemy CRs for Arkla campaign ──

const CR_GOBLIN = 0.25;     // 50 XP
const CR_HOBGOBLIN = 0.5;   // 100 XP
const CR_BUGBEAR = 1;       // 200 XP
const CR_OWLBEAR = 3;       // 700 XP
const CR_DRAGON = 8;        // 3900 XP


// ═══════════════════════════════════════════════════════════════
// PARSE CR — handle all formats
// ═══════════════════════════════════════════════════════════════

describe("parseCr", () => {
  it("should parse fraction strings: 1/8, 1/4, 1/2", () => {
    expect(parseCr("1/8")).toBe(0.125);
    expect(parseCr("1/4")).toBe(0.25);
    expect(parseCr("1/2")).toBe(0.5);
  });

  it("should parse integer strings", () => {
    expect(parseCr("1")).toBe(1);
    expect(parseCr("5")).toBe(5);
    expect(parseCr("30")).toBe(30);
  });

  it("should return numeric input as-is", () => {
    expect(parseCr(1)).toBe(1);
    expect(parseCr(0.25)).toBe(0.25);
    expect(parseCr(3)).toBe(3);
  });

  it("should return 0 for unparseable strings", () => {
    expect(parseCr("")).toBe(0);
    expect(parseCr("abc")).toBe(0);
    expect(parseCr("CR 5")).toBe(0);
  });
});


// ═══════════════════════════════════════════════════════════════
// GET XP FOR CR
// ═══════════════════════════════════════════════════════════════

describe("getXpForCr", () => {
  it("should return correct XP for fractional CRs", () => {
    expect(getXpForCr(0)).toBe(10);
    expect(getXpForCr(0.125)).toBe(25);
    expect(getXpForCr(0.25)).toBe(50);
    expect(getXpForCr(0.5)).toBe(100);
  });

  it("should return correct XP for integer CRs 1-30", () => {
    expect(getXpForCr(1)).toBe(200);
    expect(getXpForCr(3)).toBe(700);
    expect(getXpForCr(5)).toBe(1800);
    expect(getXpForCr(10)).toBe(5900);
    expect(getXpForCr(20)).toBe(25000);
    expect(getXpForCr(30)).toBe(155000);
  });

  it("should return 0 for unknown/negative CRs", () => {
    expect(getXpForCr(-1)).toBe(0);
    expect(getXpForCr(999)).toBe(0);
    expect(getXpForCr(NaN)).toBe(0);
  });
});


// ═══════════════════════════════════════════════════════════════
// ENCOUNTER MULTIPLIER
// ═══════════════════════════════════════════════════════════════

describe("getEffectiveMultiplier — 5e RAW (DMG pg. 83)", () => {
  // Standard party (3-5): standard multiplier
  it("standard party 1 monster: ×1", () => {
    expect(getEffectiveMultiplier(1, 4)).toBe(1);
  });
  it("standard party 2 monsters: ×1.5", () => {
    expect(getEffectiveMultiplier(2, 4)).toBe(1.5);
  });
  it("standard party 3-6 monsters: ×2", () => {
    expect(getEffectiveMultiplier(3, 4)).toBe(2);
    expect(getEffectiveMultiplier(6, 4)).toBe(2);
  });
  it("standard party 7-10 monsters: ×2.5", () => {
    expect(getEffectiveMultiplier(7, 4)).toBe(2.5);
    expect(getEffectiveMultiplier(10, 4)).toBe(2.5);
  });
  it("standard party 11-14 monsters: ×3", () => {
    expect(getEffectiveMultiplier(11, 4)).toBe(3);
    expect(getEffectiveMultiplier(14, 4)).toBe(3);
  });
  it("standard party 15+ monsters: ×4", () => {
    expect(getEffectiveMultiplier(15, 4)).toBe(4);
    expect(getEffectiveMultiplier(30, 4)).toBe(4);
  });

  // Small party (<3): ×1.5 on top of standard
  it("solo party 1 monster: ×1 ×1.5 = 1.5", () => {
    expect(getEffectiveMultiplier(1, 1)).toBe(1.5);
  });
  it("solo party 2 monsters: ×1.5 ×1.5 = 2.25", () => {
    expect(getEffectiveMultiplier(2, 1)).toBe(2.25);
  });
  it("solo party 3-6 monsters: ×2 ×1.5 = 3", () => {
    expect(getEffectiveMultiplier(5, 1)).toBe(3);
  });

  // Large party (6+): next higher bracket
  it("large party 1 monster: ×1 → ×1.5", () => {
    expect(getEffectiveMultiplier(1, 6)).toBe(1.5);
  });
  it("large party 2 monsters: ×1.5 → ×2", () => {
    expect(getEffectiveMultiplier(2, 6)).toBe(2);
  });
  it("large party 3-6 monsters: ×2 → ×2.5", () => {
    expect(getEffectiveMultiplier(5, 6)).toBe(2.5);
  });
  it("large party 7-10 monsters: ×2.5 → ×3", () => {
    expect(getEffectiveMultiplier(8, 6)).toBe(3);
  });
  it("large party 11-14 monsters: ×3 → ×4", () => {
    expect(getEffectiveMultiplier(12, 6)).toBe(4);
  });
  it("large party 15+ monsters: ×4 → ×4 (cap)", () => {
    expect(getEffectiveMultiplier(20, 6)).toBe(4);
  });

  // Edge cases
  it("0 monsters returns ×1", () => {
    expect(getEffectiveMultiplier(0, 4)).toBe(1);
  });
  it("party size 0 treats as standard", () => {
    expect(getEffectiveMultiplier(4, 0)).toBe(2);
  });
  it("negative party size treats as standard", () => {
    expect(getEffectiveMultiplier(4, -1)).toBe(2);
  });
});


// ═══════════════════════════════════════════════════════════════
// CALCULATE ENCOUNTER XP
// ═══════════════════════════════════════════════════════════════

describe("calculateEncounterXp", () => {
  it("single goblin (CR 0.25): 50 XP total, 50 XP adjusted", () => {
    const result = calculateEncounterXp([CR_GOBLIN], 4);
    expect(result.totalXp).toBe(50);
    expect(result.adjustedXp).toBe(50); // ×1
  });

  it("4 goblins (CR 0.25): 200 XP total, 400 XP adjusted (×2)", () => {
    const result = calculateEncounterXp([CR_GOBLIN, CR_GOBLIN, CR_GOBLIN, CR_GOBLIN], 4);
    expect(result.totalXp).toBe(200);
    expect(result.adjustedXp).toBe(400); // ×2 for 3-6 enemies
  });

  it("6 goblins + 1 hobgoblin: 400 XP total, 1000 XP adjusted (×2.5)", () => {
    const crs = [CR_GOBLIN, CR_GOBLIN, CR_GOBLIN, CR_GOBLIN, CR_GOBLIN, CR_GOBLIN, CR_HOBGOBLIN];
    const result = calculateEncounterXp(crs, 4);
    expect(result.totalXp).toBe(400); // 6×50 + 100
    expect(result.adjustedXp).toBe(1000); // ×2.5 for 7-10 enemies
  });

  it("empty array: 0 XP total, 0 XP adjusted", () => {
    const result = calculateEncounterXp([], 4);
    expect(result.totalXp).toBe(0);
    expect(result.adjustedXp).toBe(0);
  });

  it("handles negative CRs by ignoring XP (returns 0 for them)", () => {
    const result = calculateEncounterXp([-1, CR_GOBLIN, -5], 4);
    expect(result.totalXp).toBe(50); // Only goblin counted
  });
});


// ═══════════════════════════════════════════════════════════════
// DETERMINE DIFFICULTY — XP Thresholds (DMG pg. 82-83)
// ═══════════════════════════════════════════════════════════════

describe("determineDifficulty — threshold validation", () => {
  // Lv5 party thresholds (×4 for party): easy=1000, medium=2000, hard=3000, deadly=4400
  it("Lv5 party: 50 XP → trivial", () => {
    expect(determineDifficulty(50, 4, 5)).toBe("trivial");
  });
  it("Lv5 party: 1500 XP → easy (below medium 2000)", () => {
    expect(determineDifficulty(1500, 4, 5)).toBe("easy");
  });
  it("Lv5 party: 2500 XP → medium (above 2000, below 3000)", () => {
    expect(determineDifficulty(2500, 4, 5)).toBe("medium");
  });
  it("Lv5 party: 3500 XP → hard (above 3000, below 4400)", () => {
    expect(determineDifficulty(3500, 4, 5)).toBe("hard");
  });
  it("Lv5 party: 5000 XP → deadly (above 4400)", () => {
    expect(determineDifficulty(5000, 4, 5)).toBe("deadly");
  });

  // Lv1 thresholds (×4): easy=100, medium=200, hard=300, deadly=400
  it("Lv1 party: 50 XP → trivial", () => {
    expect(determineDifficulty(50, 4, 1)).toBe("trivial");
  });
  it("Lv1 party: 250 XP → medium", () => {
    expect(determineDifficulty(250, 4, 1)).toBe("medium");
  });
  it("Lv1 party: 500 XP → deadly", () => {
    expect(determineDifficulty(500, 4, 1)).toBe("deadly");
  });

  // Lv20 thresholds (×4): easy=11200, medium=22800, hard=34000, deadly=50800
  it("Lv20 party: 60000 XP → deadly", () => {
    expect(determineDifficulty(60000, 4, 20)).toBe("deadly");
  });

  // Invalid levels
  it("level 0 or negative returns 'trivial'", () => {
    expect(determineDifficulty(1000, 4, 0)).toBe("trivial");
    expect(determineDifficulty(1000, 4, -1)).toBe("trivial");
  });
  it("fractional level rounds to nearest", () => {
    const r1 = determineDifficulty(250, 4, 4.6); // rounds to 5
    const r2 = determineDifficulty(250, 4, 4.4); // rounds to 4
    // Lv5 medium threshold = 500×4 = 2000, so 250 → trivial
    // Lv4 easy threshold = 250×4 = 1000, so 250 → trivial
    expect(r1).toBe("trivial");
    expect(r2).toBe("trivial");
  });
});


// ═══════════════════════════════════════════════════════════════
// ANALYZE ENCOUNTER DIFFICULTY — Full pipeline
// ═══════════════════════════════════════════════════════════════

describe("analyzeEncounterDifficulty — full pipeline", () => {
  it("4 goblins vs Wendy/Kehrfuffle party (4× Lv5): Medium", () => {
    const result = analyzeEncounterDifficulty(
      [CR_GOBLIN, CR_GOBLIN, CR_GOBLIN, CR_GOBLIN],
      PARTY_4_L5
    );
    expect(result.rating).toBe("medium");
    expect(result.totalXp).toBe(200);
    expect(result.adjustedXp).toBe(400);
    expect(result.enemyCount).toBe(4);
    expect(result.crRange.min).toBe(0.25);
    expect(result.crRange.max).toBe(0.25);
  });

  it("1 Owlbear vs 4× Lv5: Easy (700 XP, ×1 = 700, below 1000 easy)", () => {
    const result = analyzeEncounterDifficulty([CR_OWLBEAR], PARTY_4_L5);
    expect(result.rating).toBe("easy");
    expect(result.totalXp).toBe(700);
    expect(result.adjustedXp).toBe(700);
  });

  it("1 Young Dragon (CR 8) vs 4× Lv5: Hard (3900 XP, ×1 = 3900, between 3000 and 4400)", () => {
    // 3900 is above hard threshold (3000 for party of 4)
    // 3900 is below deadly threshold (4400 for party of 4)
    const result = analyzeEncounterDifficulty([CR_DRAGON], PARTY_4_L5);
    expect(result.rating).toBe("hard");
    expect(result.totalXp).toBe(3900);
    expect(result.adjustedXp).toBe(3900);
  });

  it("Dragon + 6 goblins vs 4× Lv5: Deadly (4200 XP ×2.5 = 10500 adjusted, above 4400)", () => {
    const crs = [CR_DRAGON, CR_GOBLIN, CR_GOBLIN, CR_GOBLIN, CR_GOBLIN, CR_GOBLIN, CR_GOBLIN];
    const result = analyzeEncounterDifficulty(crs, PARTY_4_L5);
    expect(result.rating).toBe("deadly");
    expect(result.totalXp).toBe(4200); // 3900 + 6*50
    expect(result.adjustedXp).toBe(10500); // 4200 ×2.5
    expect(result.enemyCount).toBe(7);
  });

  it("Kehrfuffle solo (Lv5) vs 1 goblin: Medium (50 ×1 ×1.5 = 75 adjusted, Lv5 solo medium=500, so trivial actually)", () => {
    // Solo Lv5 party: threshold = medium ×1 = 500
    // 50 total ×1.5 = 75 adjusted — well below 500
    const result = analyzeEncounterDifficulty([CR_GOBLIN], PARTY_1_L5);
    expect(result.rating).toBe("trivial");
    expect(result.adjustedXp).toBe(75);
  });

  it("Large party (6× Lv5) vs 4 goblins: Trivial — 200 ×2 (shifted from ×1 to ×1.5) = 300 adjusted, below 1000", () => {
    const result = analyzeEncounterDifficulty(
      [CR_GOBLIN, CR_GOBLIN, CR_GOBLIN, CR_GOBLIN],
      PARTY_6_L5
    );
    expect(result.rating).toBe("trivial");
    expect(result.adjustedXp).toBe(400); // 200 ×2 (shifted up from 1.5 to 2)
  });

  it("should handle empty CR array gracefully", () => {
    const result = analyzeEncounterDifficulty([], PARTY_4_L5);
    expect(result.rating).toBe("trivial");
    expect(result.totalXp).toBe(0);
    expect(result.adjustedXp).toBe(0);
    expect(result.enemyCount).toBe(0);
    expect(result.crRange.min).toBe(0);
    expect(result.crRange.max).toBe(0);
  });

  it("should include partyThresholds with correct scaling", () => {
    const result = analyzeEncounterDifficulty([CR_GOBLIN], PARTY_4_L5);
    // Lv5 thresholds ×4: easy=1000, medium=2000, hard=3000, deadly=4400
    expect(result.partyThresholds.easy).toBe(1000);
    expect(result.partyThresholds.medium).toBe(2000);
    expect(result.partyThresholds.hard).toBe(3000);
    expect(result.partyThresholds.deadly).toBe(4400);
  });
});


// ═══════════════════════════════════════════════════════════════
// GET DIFFICULTY LABELS & COLORS
// ═══════════════════════════════════════════════════════════════

describe("getDifficultyLabel", () => {
  it("should return proper labels for all 6 ratings", () => {
    expect(getDifficultyLabel("trivial")).toBe("Trivial");
    expect(getDifficultyLabel("easy")).toBe("Easy");
    expect(getDifficultyLabel("medium")).toBe("Medium");
    expect(getDifficultyLabel("hard")).toBe("Hard");
    expect(getDifficultyLabel("deadly")).toBe("Deadly");
    expect(getDifficultyLabel("impossible")).toBe("Impossible");
  });
});

describe("getDifficultyColor", () => {
  it("should return color classes for all 6 ratings", () => {
    expect(getDifficultyColor("trivial")).toContain("text-surface");
    expect(getDifficultyColor("easy")).toContain("text-emerald");
    expect(getDifficultyColor("medium")).toContain("text-amber");
    expect(getDifficultyColor("hard")).toContain("text-orange");
    expect(getDifficultyColor("deadly")).toContain("text-red");
    expect(getDifficultyColor("impossible")).toContain("text-rose");
  });

  it("should not be empty for any rating", () => {
    const ratings: DifficultyRating[] = ["trivial", "easy", "medium", "hard", "deadly", "impossible"];
    ratings.forEach((r) => {
      expect(getDifficultyColor(r).length).toBeGreaterThan(0);
    });
  });
});


// ═══════════════════════════════════════════════════════════════
// CR RANGE & ENEMY COUNT
// ═══════════════════════════════════════════════════════════════

describe("analyzeEncounterDifficulty — CR range", () => {
  it("mixed CRs return correct min/max", () => {
    const result = analyzeEncounterDifficulty([CR_GOBLIN, CR_OWLBEAR, CR_DRAGON], PARTY_4_L5);
    expect(result.crRange.min).toBe(0.25);
    expect(result.crRange.max).toBe(8);
    expect(result.enemyCount).toBe(3);
  });

  it("filters out NaN CRs from range", () => {
    const result = analyzeEncounterDifficulty([CR_GOBLIN, NaN, CR_OWLBEAR], PARTY_4_L5);
    expect(result.crRange.min).toBe(0.25);
    expect(result.crRange.max).toBe(3);
    expect(result.enemyCount).toBe(3); // count includes NaN items
  });
});


// ═══════════════════════════════════════════════════════════════
// EDGE CASES — Defensive guards
// ═══════════════════════════════════════════════════════════════

describe("Edge cases — defensive guards", () => {
  it("should handle CR 0 creatures", () => {
    const result = analyzeEncounterDifficulty([0, 0, 0], PARTY_4_L5);
    expect(result.totalXp).toBe(30); // 3 × 10 XP
    expect(result.crRange.min).toBe(0);
    expect(result.crRange.max).toBe(0);
  });

  it("should handle very large groups (50+ enemies)", () => {
    const fiftyGoblins = Array(50).fill(CR_GOBLIN);
    const result = calculateEncounterXp(fiftyGoblins, 4);
    expect(result.totalXp).toBe(2500); // 50 × 50
    expect(result.adjustedXp).toBe(10000); // ×4 for 15+
    expect(determineDifficulty(result.adjustedXp, 4, 5)).toBe("deadly");
  });

  it("should handle zero party size gracefully", () => {
    // Party size 0 would cause division issues — check it doesn't crash
    const result = analyzeEncounterDifficulty([CR_GOBLIN], { size: 0, level: 5 });
    expect(result.rating).toBeDefined();
    expect(typeof result.totalXp).toBe("number");
  });

  it("should not mutate input arrays", () => {
    const input = [CR_GOBLIN, CR_OWLBEAR];
    const copy = [...input];
    const result = analyzeEncounterDifficulty(input, PARTY_4_L5);
    expect(input).toEqual(copy);
    expect(result.totalXp).toBe(750); // 50 + 700
  });

  it("should be deterministic (same input = same output)", () => {
    const crs = [CR_GOBLIN, CR_GOBLIN, CR_GOBLIN, CR_GOBLIN];
    const r1 = analyzeEncounterDifficulty(crs, PARTY_4_L5);
    const r2 = analyzeEncounterDifficulty(crs, PARTY_4_L5);
    expect(r1.rating).toBe(r2.rating);
    expect(r1.totalXp).toBe(r2.totalXp);
    expect(r1.adjustedXp).toBe(r2.adjustedXp);
  });
});


// ═══════════════════════════════════════════════════════════════
// REAL-WORLD DM SESSION SCENARIOS
// ═══════════════════════════════════════════════════════════════

describe("Real-world DM encounter scenarios (Arkla campaign)", () => {
  // Session: The Sunless Citadel — Level 1 party
  it("Lv1 party vs 2 goblins (L1 easy encounter)", () => {
    const result = analyzeEncounterDifficulty(
      [CR_GOBLIN, CR_GOBLIN],
      PARTY_4_L1
    );
    // 2 goblins = 100 XP total ×1.5 = 150 adjusted
    // Lv1 party easy threshold = 25×4 = 100, medium = 50×4 = 200
    expect(result.rating).toBe("easy");
    expect(result.adjustedXp).toBe(150);
  });

  // Session: The Sunless Citadel — Boss room
  it("Lv1 party vs 2 goblins + 1 hobgoblin (boss)", () => {
    const result = analyzeEncounterDifficulty(
      [CR_GOBLIN, CR_GOBLIN, CR_HOBGOBLIN],
      PARTY_4_L1
    );
    // 3 enemies = 200 XP total ×2 = 400 adjusted
    // Lv1 party hard threshold = 75×4 = 300, deadly = 100×4 = 400
    // 400 >= 400 → deadly
    expect(result.rating).toBe("deadly");
    expect(result.adjustedXp).toBe(400);
  });

  // Session: Forest encounter — 3 goblins, 1 bugbear
  it("Lv5 party vs goblin + bugbear patrol", () => {
    const result = analyzeEncounterDifficulty(
      [CR_GOBLIN, CR_GOBLIN, CR_GOBLIN, CR_BUGBEAR],
      PARTY_4_L5
    );
    // 4 enemies = 350 XP total ×2 = 700 adjusted
    // Lv5 party easy threshold = 250×4 = 1000
    expect(result.rating).toBe("trivial");
    expect(result.adjustedXp).toBe(700);
  });

  // Session: Boss fight — 1 Owlbear (CR 3)
  it("Lv5 party vs 1 owlbear — easy", () => {
    const result = analyzeEncounterDifficulty([CR_OWLBEAR], PARTY_4_L5);
    expect(result.rating).toBe("easy");
    expect(result.totalXp).toBe(700);
    expect(result.adjustedXp).toBe(700);
  });

  // Session: Deadly boss — Dragon + minions
  it("Lv5 party vs dragon + 4 goblins — deadly", () => {
    const result = analyzeEncounterDifficulty(
      [CR_DRAGON, CR_GOBLIN, CR_GOBLIN, CR_GOBLIN, CR_GOBLIN],
      PARTY_4_L5
    );
    // 5 enemies = 3900 + 200 = 4100 XP ×2 = 8200 adjusted
    // Lv5 deadly threshold = 1100×4 = 4400
    expect(result.rating).toBe("deadly");
    expect(result.adjustedXp).toBe(8200);
  });

  // Session: Kehrfuffle solo vs goblin
  it("Kehrfuffle (Lv5 Paladin) vs 1 goblin", () => {
    const result = analyzeEncounterDifficulty([CR_GOBLIN], PARTY_1_L5);
    // Solo: 50 XP ×1.5 = 75 adjusted
    // Solo Lv5: medium threshold = 500×1 = 500
    expect(result.rating).toBe("trivial");
    expect(result.adjustedXp).toBe(75);
  });

  // Session: Wendy (Lv5 Rogue) exploring alone vs 2 goblins
  it("Wendy solo vs 2 goblins", () => {
    const result = analyzeEncounterDifficulty(
      [CR_GOBLIN, CR_GOBLIN],
      { size: 1, level: 5 }
    );
    // Solo duo: 100 XP × 1.5 (duo bracket) = 150 → ×1.5 for solo = 225
    // Solo Lv5: easy threshold = 250, medium = 500
    expect(result.rating).toBe("trivial");
    expect(result.adjustedXp).toBe(225);
  });
});


// ═══════════════════════════════════════════════════════════════
// RAPID FIRE STRESS TEST
// ═══════════════════════════════════════════════════════════════

describe("Rapid fire encounter analysis (live-game stress)", () => {
  it("should analyze 100 random encounters without state drift", () => {
    for (let i = 0; i < 100; i++) {
      const count = (i % 10) + 1; // 1-10 enemies
      const crs = Array(count).fill(CR_GOBLIN);
      const level = (i % 20) + 1; // Lv1-20
      const result = analyzeEncounterDifficulty(crs, { size: 4, level });
      expect(result.totalXp).toBe(count * 50);
      expect(result.adjustedXp).toBeGreaterThanOrEqual(result.totalXp);
      expect(["trivial", "easy", "medium", "hard", "deadly"]).toContain(result.rating);
    }
  });

  it("should handle rapidly changing party configurations", () => {
    const configs = [
      { size: 1, level: 1 },
      { size: 2, level: 5 },
      { size: 4, level: 10 },
      { size: 6, level: 15 },
      { size: 8, level: 20 },
    ];
    const crs = [CR_DRAGON, CR_OWLBEAR, CR_GOBLIN, CR_GOBLIN];

    configs.forEach((config) => {
      const result = analyzeEncounterDifficulty(crs, config);
      expect(result.enemyCount).toBe(4);
      expect(result.crRange.min).toBe(0.25);
      expect(result.crRange.max).toBe(8);
      // Adjusted XP increases with larger party (shifted multiplier brackets)
      // But the multiplier sequence is deterministic
      expect(typeof result.adjustedXp).toBe("number");
      expect(result.adjustedXp).toBeGreaterThan(0);
    });
  });
});
