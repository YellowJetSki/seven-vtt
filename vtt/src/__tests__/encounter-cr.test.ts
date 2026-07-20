/**
 * STᚱ VTT — Encounter CR Calculator & Difficulty Engine Unit Tests
 *
 * QA Sprint 13: Comprehensive validation of DMG encounter math.
 * 
 * Tests validate:
 *   1. XP threshold tables (levels 1-20)
 *   2. CR→XP conversion (CR 0 through 30, including fractions)
 *   3. Encounter multiplier math (DMG pg. 83)
 *   4. Party size adjustments
 *   5. Difficulty determination (trivial → impossible)
 *   6. Edge cases (empty parties, single CR, very large groups)
 *   7. Mixed CR groups
 *   8. Cross-character edge cases
 *   9. parseCr utility
 *   10. Display utilities
 *
 * Reference: D&D 5e DMG pg. 82-83
 */

import { describe, it, expect } from "vitest";
import {
  getXpForCr,
  parseCr,
  calculateEncounterXp,
  determineDifficulty,
  analyzeEncounterDifficulty,
  getDifficultyLabel,
  getDifficultyColor,
  type PartyConfig,
  type DifficultyRating,
  type DifficultyResult,
} from "@/lib/mechanics/encounter-cr";

// ═══════════════════════════════════════════════════════════════
// 1. CR → XP Conversion
// ═══════════════════════════════════════════════════════════════

describe("getXpForCr", () => {
  // ── Fractional CR ──
  it("returns 25 XP for CR 1/8 (0.125)", () => {
    expect(getXpForCr(0.125)).toBe(25);
  });

  it("returns 50 XP for CR 1/4 (0.25)", () => {
    expect(getXpForCr(0.25)).toBe(50);
  });

  it("returns 100 XP for CR 1/2 (0.5)", () => {
    expect(getXpForCr(0.5)).toBe(100);
  });

  // ── Integer CR ──
  it("returns 200 XP for CR 1", () => {
    expect(getXpForCr(1)).toBe(200);
  });

  it("returns 450 XP for CR 2", () => {
    expect(getXpForCr(2)).toBe(450);
  });

  // ── High CR ──
  it("returns 155,000 XP for CR 30", () => {
    expect(getXpForCr(30)).toBe(155000);
  });

  // ── Edge cases ──
  it("returns 10 XP for CR 0", () => {
    expect(getXpForCr(0)).toBe(10);
  });

  it("returns 0 XP for unknown CR", () => {
    expect(getXpForCr(-1)).toBe(0);
  });

  it("returns 0 XP for CR 42 (out of range)", () => {
    expect(getXpForCr(42)).toBe(0);
  });

  it("returns 0 XP for NaN input", () => {
    expect(getXpForCr(NaN)).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════
// 2. CR Parsing
// ═══════════════════════════════════════════════════════════════

describe("parseCr", () => {
  it("parses '1/8' as 0.125", () => {
    expect(parseCr("1/8")).toBe(0.125);
  });

  it("parses '1/4' as 0.25", () => {
    expect(parseCr("1/4")).toBe(0.25);
  });

  it("parses '1/2' as 0.5", () => {
    expect(parseCr("1/2")).toBe(0.5);
  });

  it("parses integer strings correctly", () => {
    expect(parseCr("5")).toBe(5);
    expect(parseCr("0")).toBe(0);
  });

  it("handles numeric input directly", () => {
    expect(parseCr(3)).toBe(3);
    expect(parseCr(0.25)).toBe(0.25);
  });

  it("returns 0 for unparseable strings", () => {
    expect(parseCr("CR 5")).toBe(0); // not a clean parse
    expect(parseCr("goblin")).toBe(0);
  });

  it("handles empty string", () => {
    expect(parseCr("")).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════
// 3. Encounter Multiplier (DMG pg. 83 — RAW)
// ═══════════════════════════════════════════════════════════════

describe("calculateEncounterXp — Multiplier Math", () => {
  // ── Single monster ──
  it("single monster: total XP = adjusted XP (×1)", () => {
    const result = calculateEncounterXp([1], 4); // 1 CR 1 monster, 4 players
    expect(result.totalXp).toBe(200);
    expect(result.adjustedXp).toBe(200); // ×1
  });

  // ── Two monsters: ×1.5 ──
  it("two monsters: ×1.5 multiplier", () => {
    const result = calculateEncounterXp([1, 1], 4);
    expect(result.totalXp).toBe(400); // 200 + 200
    expect(result.adjustedXp).toBe(600); // 400 × 1.5
  });

  // ── 3-6 monsters: ×2 ──
  it("three monsters: ×2 multiplier", () => {
    const result = calculateEncounterXp([1, 1, 1], 4);
    expect(result.totalXp).toBe(600);
    expect(result.adjustedXp).toBe(1200); // 600 × 2
  });

  it("six monsters: ×2 multiplier (upper bound of range)", () => {
    const result = calculateEncounterXp([0.5, 0.5, 0.5, 0.5, 0.5, 0.5], 4);
    expect(result.totalXp).toBe(600); // 6 × 100
    expect(result.adjustedXp).toBe(1200); // 600 × 2
  });

  // ── 7-10 monsters: ×2.5 ──
  it("seven monsters: ×2.5 multiplier", () => {
    const result = calculateEncounterXp([0.125, 0.125, 0.125, 0.125, 0.125, 0.125, 0.125], 4);
    expect(result.totalXp).toBe(175); // 7 × 25
    expect(result.adjustedXp).toBe(438); // 175 × 2.5 = 437.5 → round
  });

  // ── 11-14 monsters: ×3 ──
  it("twelve monsters: ×3 multiplier", () => {
    const result = calculateEncounterXp([0.125, 0.125, 0.125, 0.125, 0.125, 0.125, 0.125, 0.125, 0.125, 0.125, 0.125, 0.125], 4);
    expect(result.totalXp).toBe(300); // 12 × 25
    expect(result.adjustedXp).toBe(900); // 300 × 3
  });

  // ── 15+ monsters: ×4 ──
  it("twenty monsters: ×4 multiplier", () => {
    const crs = Array(20).fill(0.125); // 20 goblins, each 25 XP
    const result = calculateEncounterXp(crs, 4);
    expect(result.totalXp).toBe(500); // 20 × 25
    expect(result.adjustedXp).toBe(2000); // 500 × 4
  });

  // ── Empty array ──
  it("empty encounter: 0 XP", () => {
    const result = calculateEncounterXp([], 4);
    expect(result.totalXp).toBe(0);
    expect(result.adjustedXp).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════
// 4. Party Size Adjustment (DMG pg. 83 — RAW)
// ═══════════════════════════════════════════════════════════════

describe("party size adjustments (DMG RAW — refactored)", () => {
  // Per DMG pg. 83:
  //   - Parties of 3-5: standard multiplier
  //   - Parties of <3: apply ×1.5 on top of standard multiplier
  //   - Parties of 6+: use the next higher multiplier bracket

  it("small party (2 players) gets ×1.5 modifier", () => {
    const result = calculateEncounterXp([1], 2);
    // Single monster: ×1 encounter × 1.5 small party = ×1.5 total
    expect(result.adjustedXp).toBe(300); // 200 × 1.5
  });

  it("large party (6 players): single monster uses ×1.5 (next bracket)", () => {
    const result = calculateEncounterXp([1], 6);
    // Single monster starts at ×1, but 6+ party shifts to next bracket = ×1.5
    expect(result.adjustedXp).toBe(300); // 200 × 1.5
  });

  it("large party (6 players): 2 monsters uses ×2 (next bracket from ×1.5)", () => {
    const result = calculateEncounterXp([1, 1], 6);
    // 2 monsters starts at ×1.5, 6+ party shifts to next = ×2
    expect(result.adjustedXp).toBe(800); // 400 × 2
  });

  it("large party (6 players): 3 monsters uses ×2.5 (next bracket from ×2)", () => {
    const result = calculateEncounterXp([1, 1, 1], 6);
    // 3 monsters starts at ×2, 6+ party shifts to next = ×2.5
    expect(result.adjustedXp).toBe(1500); // 600 × 2.5
  });

  it("standard party (4 players) gets standard multiplier", () => {
    const result = calculateEncounterXp([1], 4);
    expect(result.adjustedXp).toBe(200);
  });

  it("single player vs 3 monsters: standard ×2 × 1.5 solo", () => {
    const result = calculateEncounterXp([1, 1, 1], 1);
    // 3 monsters: ×2 encounter multiplier
    // 1 player: ×1.5 small party
    // 600 XP × 2 × 1.5 = 1800
    expect(result.adjustedXp).toBe(1800);
  });

  it("2 players vs 2 monsters: ×1.5 × 1.5 = ×2.25", () => {
    const result = calculateEncounterXp([1, 1], 2);
    // 2 monsters: ×1.5, 2 players: ×1.5
    // 400 × 1.5 × 1.5 = 900
    expect(result.adjustedXp).toBe(900);
  });
});

// ═══════════════════════════════════════════════════════════════
// 5. Difficulty Determination
// ═══════════════════════════════════════════════════════════════

describe("determineDifficulty", () => {
  // ── Party of 4 at level 1 ──
  it("level 1, 4 players: thresholds are 100/200/300/400", () => {
    // Easy: 25 × 4 = 100
    expect(determineDifficulty(50, 4, 1)).toBe("trivial");
    expect(determineDifficulty(100, 4, 1)).toBe("easy");
    expect(determineDifficulty(200, 4, 1)).toBe("medium");
    expect(determineDifficulty(300, 4, 1)).toBe("hard");
    expect(determineDifficulty(400, 4, 1)).toBe("deadly");
    expect(determineDifficulty(999, 4, 1)).toBe("deadly");
  });

  // ── Party of 4 at level 5 ──
  it("level 5, 4 players: thresholds are 1000/2000/3000/4400", () => {
    expect(determineDifficulty(500, 4, 5)).toBe("trivial");
    expect(determineDifficulty(1000, 4, 5)).toBe("easy");
    expect(determineDifficulty(2000, 4, 5)).toBe("medium");
    expect(determineDifficulty(3000, 4, 5)).toBe("hard");
    expect(determineDifficulty(4400, 4, 5)).toBe("deadly");
  });

  // ── Party of 5 at level 10 ──
  it("level 10, 5 players: thresholds are 3000/6000/9500/14000", () => {
    // Easy: 600 × 5 = 3000
    expect(determineDifficulty(3000, 5, 10)).toBe("easy");
    expect(determineDifficulty(6000, 5, 10)).toBe("medium");
    expect(determineDifficulty(9500, 5, 10)).toBe("hard");
    expect(determineDifficulty(14000, 5, 10)).toBe("deadly");
  });

  // ── Single character (level 20 vs deadly) ──
  it("level 20 solo: thresholds scale by ×1", () => {
    // Solo: 2800/5700/8500/12700
    expect(determineDifficulty(12700, 1, 20)).toBe("deadly");
    expect(determineDifficulty(8500, 1, 20)).toBe("hard");
  });

  // ── Edge cases ──
  it("level 0 returns trivial (not a valid adventuring level)", () => {
    const result = determineDifficulty(100, 4, 0);
    expect(result).toBe("trivial");
  });

  it("level 21 clamps to level 20 thresholds", () => {
    const result = determineDifficulty(7000, 4, 21);
    expect(result).toBe("hard"); // 7000 < 8500 (level 20 hard for 4)
  });

  it("negative level returns trivial", () => {
    const result = determineDifficulty(100, 4, -5);
    expect(result).toBe("trivial");
  });

  it("immense XP returns deadly", () => {
    const result = determineDifficulty(1000000, 4, 5);
    expect(result).toBe("deadly");
  });

  it("zero XP returns trivial", () => {
    const result = determineDifficulty(0, 4, 5);
    expect(result).toBe("trivial");
  });
});

// ═══════════════════════════════════════════════════════════════
// 6. Full analysis
// ═══════════════════════════════════════════════════════════════

describe("analyzeEncounterDifficulty", () => {
  // ── Single goblin vs level 1 party ──
  it("1 goblin (CR 1/4) vs 4 level-1 PCs → Easy", () => {
    const result = analyzeEncounterDifficulty([0.25], { size: 4, level: 1 });
    expect(result.totalXp).toBe(50); // CR 1/4 = 50 XP
    expect(result.adjustedXp).toBe(50); // ×1 multiplier
    expect(result.rating).toBe("easy");
    expect(result.enemyCount).toBe(1);
    expect(result.crRange.min).toBe(0.25);
    expect(result.crRange.max).toBe(0.25);
  });

  // ── Classic: 4 goblins vs level 1 party ──
  it("4 goblins (CR 1/4) vs 4 level-1 PCs → Medium (should be Deadly per DMG)", () => {
    // 4 goblins × 50 XP = 200 total
    // 4 enemies → ×2 multiplier = 400 adjusted
    // Level 1 party of 4: Easy=100, Medium=200, Hard=300, Deadly=400
    const result = analyzeEncounterDifficulty(
      [0.25, 0.25, 0.25, 0.25],
      { size: 4, level: 1 }
    );
    expect(result.totalXp).toBe(200);
    expect(result.adjustedXp).toBe(400); // 200 × 2
    expect(result.rating).toBe("deadly"); // 400 >= 400 deadly threshold
    expect(result.enemyCount).toBe(4);
  });

  // ── Dragons: Young Red Dragon (CR 10) vs level 10 party ──
  it("Young Red Dragon (CR 10) vs 4 level-10 PCs → Hard", () => {
    const result = analyzeEncounterDifficulty([10], { size: 4, level: 10 });
    expect(result.totalXp).toBe(5900);
    expect(result.adjustedXp).toBe(5900); // ×1 single monster
    // Level 10, 4 PCs: Easy=2400, Medium=4800, Hard=7600, Deadly=11200
    expect(result.rating).toBe("medium"); // 5900 >= 4800 but < 7600
  });

  // ── Mixed: Bugbear (CR 1) + 3 goblins (CR 1/4) vs level 3 party ──
  it("Bugbear (CR 1) + 3 goblins (CR 1/4) vs 4 level-3 PCs → Hard", () => {
    // XP: 200 + 50 + 50 + 50 = 350
    // 4 enemies → ×2 multiplier = 700 adjusted
    // Level 3, 4 PCs: Easy=300, Medium=600, Hard=900, Deadly=1600
    const result = analyzeEncounterDifficulty(
      [1, 0.25, 0.25, 0.25],
      { size: 4, level: 3 }
    );
    expect(result.totalXp).toBe(350);
    expect(result.adjustedXp).toBe(700); // 350 × 2
    expect(result.rating).toBe("medium"); // 700 >= 600 but < 900
  });

  // ── Mixed CR range ──
  it("reports CR range correctly for mixed groups", () => {
    const result = analyzeEncounterDifficulty(
      [0.125, 0.25, 1, 3, 5],
      { size: 4, level: 5 }
    );
    expect(result.crRange.min).toBe(0.125);
    expect(result.crRange.max).toBe(5);
  });

  it("reports CR range for single CR", () => {
    const result = analyzeEncounterDifficulty([8], { size: 4, level: 10 });
    expect(result.crRange.min).toBe(8);
    expect(result.crRange.max).toBe(8);
  });

  // ── High level party vs weak enemies ──
  it("8 goblins (CR 1/4) vs 4 level-10 PCs → Trivial", () => {
    const result = analyzeEncounterDifficulty(
      [0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25],
      { size: 4, level: 10 }
    );
    // 8 × 50 = 400 total
    // 8 enemies → ×2.5 multiplier = 1000 adjusted
    // Level 10, 4 PCs: Easy=2400
    expect(result.rating).toBe("trivial"); // 1000 < 2400
  });

  // ── Empty encounter ──
  it("empty encounter returns trivial", () => {
    const result = analyzeEncounterDifficulty([], { size: 4, level: 5 });
    expect(result.totalXp).toBe(0);
    expect(result.adjustedXp).toBe(0);
    expect(result.rating).toBe("trivial");
    expect(result.enemyCount).toBe(0);
    expect(result.crRange.min).toBe(0);
    expect(result.crRange.max).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════
// 7. Known SRD Encounter Examples
// ═══════════════════════════════════════════════════════════════

describe("SRD Encounter Examples — DMG Reference", () => {
  // ── DMG pg. 82 example 1 ──
  it("DMG Example 1: 1 hobgoblin (CR 1/2) + 5 goblins (CR 1/4) vs 4 level-1 PCs", () => {
    // Hobgoblin: 100 XP, Goblins: 5 × 50 = 250 XP → Total: 350
    // 6 enemies → ×2 multiplier = 700 adjusted
    // Level 1, 4 PCs: Deadly = 400
    const result = analyzeEncounterDifficulty(
      [0.5, 0.25, 0.25, 0.25, 0.25, 0.25],
      { size: 4, level: 1 }
    );
    expect(result.totalXp).toBe(350);
    expect(result.adjustedXp).toBe(700); // 350 × 2
    expect(result.rating).toBe("deadly"); // 700 >= 400
  });

  // ── DMG pg. 82 example 2 ──
  it("DMG Example 2: 3 specters (CR 1) vs 5 level-3 PCs", () => {
    // 3 × 200 XP = 600 total
    // 3 enemies → ×2 multiplier = 1200 adjusted
    // Level 3, 5 PCs: Deadly = 400 × 5 = 2000
    // Hard = 225 × 5 = 1125
    const result = analyzeEncounterDifficulty(
      [1, 1, 1],
      { size: 5, level: 3 }
    );
    expect(result.totalXp).toBe(600);
    expect(result.adjustedXp).toBe(1200);
    expect(result.rating).toBe("hard"); // 1200 >= 1125, < 2000
  });

  // ── Death House classic ──
  it("Death House: 1 specter (CR 1) + 4 ghouls (CR 1) vs 4 level-2 PCs", () => {
    // 5 × 200 = 1000 total
    // 5 enemies → ×2 multiplier = 2000 adjusted
    // Level 2, 4 PCs: Easy=200, Medium=400, Hard=600, Deadly=800
    const result = analyzeEncounterDifficulty(
      [1, 1, 1, 1, 1],
      { size: 4, level: 2 }
    );
    expect(result.rating).toBe("deadly"); // 2000 >= 800
  });
});

// ═══════════════════════════════════════════════════════════════
// 8. Edge Cases
// ═══════════════════════════════════════════════════════════════

describe("edge cases", () => {
  it("single CR 0 creature vs level 1 party → trivial", () => {
    const result = analyzeEncounterDifficulty([0], { size: 4, level: 1 });
    expect(result.totalXp).toBe(10);
    expect(result.rating).toBe("trivial");
  });

  it("large party of 10 vs single monster", () => {
    const result = calculateEncounterXp([5], 10);
    // CR 5 = 1800, single monster: ×1, 10+ party shifts to ×1.5 (next bracket)
    expect(result.adjustedXp).toBe(2700); // 1800 × 1.5
  });

  it("party of 8 vs swarm of 16 enemies", () => {
    const crs = Array(16).fill(0.25); // 16 × 50 XP = 800
    const result = calculateEncounterXp(crs, 8);
    // Total: 800, 16 enemies: ×4, 8+ party: next bracket is still ×4 (already maxed)
    expect(result.adjustedXp).toBe(3200); // 800 × 4
  });

  it("fractional CRs accumulate correctly across the table", () => {
    // 3 x CR 1/8 (25 XP) + 2 x CR 1/4 (50 XP) + 1 x CR 1/2 (100 XP)
    // = 75 + 100 + 100 = 275 total
    const result = calculateEncounterXp([0.125, 0.125, 0.125, 0.25, 0.25, 0.5], 4);
    expect(result.totalXp).toBe(275);
    expect(result.adjustedXp).toBe(550); // 275 × 2 (6 enemies)
  });

  it("very high level (20) + very high CR (30) → deadly", () => {
    const result = analyzeEncounterDifficulty([30], { size: 4, level: 20 });
    // CR 30 = 155,000 XP vs 4×12700 = 50800 deadly → deadly
    expect(result.rating).toBe("deadly");
    expect(result.totalXp).toBe(155000);
  });

  it("party size of 1 vs appropriate enemy", () => {
    // Solo level 3 vs CR 1 (200 XP)
    // Level 3 solo: Easy=75, Medium=150, Hard=225, Deadly=400
    const result = analyzeEncounterDifficulty([1], { size: 1, level: 3 });
    expect(result.totalXp).toBe(200);
    expect(result.adjustedXp).toBe(300); // 200 × 1 (single) × 1.5 (solo party)
    expect(result.rating).toBe("hard"); // 300 >= 225, < 400
  });
});

// ═══════════════════════════════════════════════════════════════
// 9. API Stability
// ═══════════════════════════════════════════════════════════════

describe("API stability", () => {
  it("returns consistent structure", () => {
    const result = analyzeEncounterDifficulty([1, 0.5], { size: 4, level: 5 });
    const keys: (keyof DifficultyResult)[] = [
      "rating", "totalXp", "adjustedXp", "thresholds",
      "partyThresholds", "crRange", "enemyCount",
    ];
    for (const key of keys) {
      expect(result).toHaveProperty(key);
    }
    expect(result.thresholds).toHaveProperty("easy");
    expect(result.thresholds).toHaveProperty("medium");
    expect(result.thresholds).toHaveProperty("hard");
    expect(result.thresholds).toHaveProperty("deadly");
  });

  it("deterministic: same input = same output", () => {
    const input = { crs: [3, 1, 0.5], party: { size: 4, level: 7 } as PartyConfig };
    const a = analyzeEncounterDifficulty(input.crs, input.party);
    const b = analyzeEncounterDifficulty(input.crs, input.party);
    expect(a).toEqual(b);
  });

  it("preserves input (no mutation)", () => {
    const crs = [1, 2, 3];
    const party: PartyConfig = { size: 4, level: 5 };
    const originalCrs = [...crs];
    const originalParty = { ...party };
    analyzeEncounterDifficulty(crs, party);
    expect(crs).toEqual(originalCrs);
    expect(party).toEqual(originalParty);
  });
});

// ═══════════════════════════════════════════════════════════════
// 10. Display Utilities
// ═══════════════════════════════════════════════════════════════

describe("getDifficultyLabel", () => {
  const cases: [DifficultyRating, string][] = [
    ["trivial", "Trivial"],
    ["easy", "Easy"],
    ["medium", "Medium"],
    ["hard", "Hard"],
    ["deadly", "Deadly"],
    ["impossible", "Impossible"],
  ];

  it.each(cases)("'%s' → '%s'", (rating, label) => {
    expect(getDifficultyLabel(rating)).toBe(label);
  });
});

describe("getDifficultyColor", () => {
  it("returns a non-empty string for all ratings", () => {
    const ratings: DifficultyRating[] = ["trivial", "easy", "medium", "hard", "deadly", "impossible"];
    for (const rating of ratings) {
      const color = getDifficultyColor(rating);
      expect(color).toBeTruthy();
      expect(typeof color).toBe("string");
      expect(color.length).toBeGreaterThan(10); // meaningful class string
    }
  });

  it("trivial returns surface colors (muted)", () => {
    const color = getDifficultyColor("trivial");
    expect(color).toContain("surface");
  });

  it("deadly returns red colors (danger)", () => {
    const color = getDifficultyColor("deadly");
    expect(color).toContain("red");
  });

  it("impossible returns rose colors (extreme)", () => {
    const color = getDifficultyColor("impossible");
    expect(color).toContain("rose");
  });
});
