/**
 * STᚱ VTT — Encounter Difficulty Calculator
 *
 * D&D 5e XP Thresholds for encounter difficulty.
 * Party level vs total adjusted encounter XP determines:
 *   Easy / Medium / Hard / Deadly
 *
 * Reference: D&D 5e DMG pg. 82-83
 */

// ── XP Thresholds per Character Level ──

const XP_THRESHOLDS: Record<number, { easy: number; medium: number; hard: number; deadly: number }> = {
  1:  { easy: 25, medium: 50, hard: 75, deadly: 100 },
  2:  { easy: 50, medium: 100, hard: 150, deadly: 200 },
  3:  { easy: 75, medium: 150, hard: 225, deadly: 400 },
  4:  { easy: 125, medium: 250, hard: 375, deadly: 500 },
  5:  { easy: 250, medium: 500, hard: 750, deadly: 1100 },
  6:  { easy: 300, medium: 600, hard: 900, deadly: 1400 },
  7:  { easy: 350, medium: 750, hard: 1100, deadly: 1700 },
  8:  { easy: 450, medium: 900, hard: 1400, deadly: 2100 },
  9:  { easy: 550, medium: 1100, hard: 1600, deadly: 2400 },
  10: { easy: 600, medium: 1200, hard: 1900, deadly: 2800 },
  11: { easy: 800, medium: 1600, hard: 2400, deadly: 3600 },
  12: { easy: 1000, medium: 2000, hard: 3000, deadly: 4500 },
  13: { easy: 1100, medium: 2200, hard: 3400, deadly: 5100 },
  14: { easy: 1250, medium: 2500, hard: 3800, deadly: 5700 },
  15: { easy: 1400, medium: 2800, hard: 4300, deadly: 6400 },
  16: { easy: 1600, medium: 3200, hard: 4800, deadly: 7200 },
  17: { easy: 2000, medium: 3900, hard: 5900, deadly: 8800 },
  18: { easy: 2100, medium: 4200, hard: 6300, deadly: 9500 },
  19: { easy: 2400, medium: 4900, hard: 7300, deadly: 10900 },
  20: { easy: 2800, medium: 5700, hard: 8500, deadly: 12700 },
};

// ── XP Values by Challenge Rating ──

const CR_XP: Record<number, number> = {
  0:   10,
  // Using number keys for CR 0.125, 0.25, 0.5
  0.125: 25,
  0.25:  50,
  0.5:   100,
  1:     200,
  2:     450,
  3:     700,
  4:     1100,
  5:     1800,
  6:     2300,
  7:     2900,
  8:     3900,
  9:     5000,
  10:    5900,
  11:    7200,
  12:    8400,
  13:    10000,
  14:    11500,
  15:    13000,
  16:    15000,
  17:    18000,
  18:    20000,
  19:    22000,
  20:    25000,
  21:    33000,
  22:    41000,
  23:    50000,
  24:    62000,
  25:    75000,
  26:    90000,
  27:    105000,
  28:    120000,
  29:    135000,
  30:    155000,
};

export interface PartyConfig {
  size: number;     // Number of player characters
  level: number;    // Average party level
}

export type DifficultyRating = "easy" | "medium" | "hard" | "deadly" | "trivial" | "impossible";

export interface DifficultyResult {
  rating: DifficultyRating;
  totalXp: number;
  adjustedXp: number;
  thresholds: { easy: number; medium: number; hard: number; deadly: number };
  partyThresholds: { easy: number; medium: number; hard: number; deadly: number };
  crRange: { min: number; max: number };
  enemyCount: number;
}

// ── Encounter Multiplier (DMG pg. 83) ──

function getEncounterMultiplier(enemyCount: number): number {
  if (enemyCount === 1) return 1;
  if (enemyCount === 2) return 1.5;
  if (enemyCount <= 6) return 2;
  if (enemyCount <= 10) return 2.5;
  if (enemyCount <= 14) return 3;
  return 4;
}

// ── Party Size Adjustment (for 3 or 6+ characters) ──

function getPartySizeMultiplier(partySize: number): number {
  if (partySize < 3) return 1.5;  // Smaller party = harder
  if (partySize > 5) return 0.5;  // Larger party = easier
  return 1;
}

/**
 * Get XP value for a given challenge rating.
 * Handles fractional CRs (0.125, 0.25, 0.5).
 */
export function getXpForCr(cr: number): number {
  return CR_XP[cr] ?? 0;
}

/**
 * Calculate total adjusted encounter XP.
 * This is the XP used for difficulty determination.
 */
export function calculateEncounterXp(
  crs: number[],
  partySize: number
): { totalXp: number; adjustedXp: number } {
  const totalXp = crs.reduce((sum, cr) => sum + getXpForCr(cr), 0);
  const multiplier = getEncounterMultiplier(crs.length) * getPartySizeMultiplier(partySize);
  return { totalXp, adjustedXp: Math.round(totalXp * multiplier) };
}

/**
 * Determine the difficulty rating of an encounter.
 */
export function determineDifficulty(
  adjustedXp: number,
  partySize: number,
  avgLevel: number
): DifficultyRating {
  const level = Math.min(Math.max(Math.round(avgLevel), 1), 20);
  const thresholds = XP_THRESHOLDS[level];
  if (!thresholds) return "medium";

  const partyThresholds = {
    easy: thresholds.easy * partySize,
    medium: thresholds.medium * partySize,
    hard: thresholds.hard * partySize,
    deadly: thresholds.deadly * partySize,
  };

  if (adjustedXp >= partyThresholds.deadly) return "deadly";
  if (adjustedXp >= partyThresholds.hard) return "hard";
  if (adjustedXp >= partyThresholds.medium) return "medium";
  if (adjustedXp >= partyThresholds.easy) return "easy";
  return "trivial";
}

/**
 * Full encounter difficulty analysis.
 */
export function analyzeEncounterDifficulty(
  crs: number[],
  party: PartyConfig
): DifficultyResult {
  const { totalXp, adjustedXp } = calculateEncounterXp(crs, party.size);
  const rating = determineDifficulty(adjustedXp, party.size, party.level);

  const level = Math.min(Math.max(Math.round(party.level), 1), 20);
  const thresholds = XP_THRESHOLDS[level];
  const partyThresholds = thresholds
    ? {
        easy: thresholds.easy * party.size,
        medium: thresholds.medium * party.size,
        hard: thresholds.hard * party.size,
        deadly: thresholds.deadly * party.size,
      }
    : { easy: 0, medium: 0, hard: 0, deadly: 0 };

  const validCrs = crs.filter((cr) => cr > 0 || cr === 0);
  const crRange = {
    min: validCrs.length ? Math.min(...validCrs) : 0,
    max: validCrs.length ? Math.max(...validCrs) : 0,
  };

  return {
    rating,
    totalXp,
    adjustedXp,
    thresholds: thresholds || { easy: 0, medium: 0, hard: 0, deadly: 0 },
    partyThresholds,
    crRange,
    enemyCount: crs.length,
  };
}

/**
 * Get a display label for the difficulty rating.
 */
export function getDifficultyLabel(rating: DifficultyRating): string {
  switch (rating) {
    case "trivial": return "Trivial";
    case "easy": return "Easy";
    case "medium": return "Medium";
    case "hard": return "Hard";
    case "deadly": return "Deadly";
    case "impossible": return "Impossible";
  }
}

/**
 * Get color class for difficulty badge.
 */
export function getDifficultyColor(rating: DifficultyRating): string {
  switch (rating) {
    case "trivial": return "text-surface-500 bg-surface-700/30 border-surface-700/20";
    case "easy": return "text-emerald-400 bg-emerald-500/10 border-emerald-500/15";
    case "medium": return "text-amber-400 bg-amber-500/10 border-amber-500/15";
    case "hard": return "text-orange-400 bg-orange-500/10 border-orange-500/15";
    case "deadly": return "text-red-400 bg-red-500/10 border-red-500/15";
    case "impossible": return "text-rose-400 bg-rose-500/10 border-rose-500/15";
  }
}

/**
 * Default party configuration — a balanced adventuring party of 4 at level 3.
 */
export const DEFAULT_PARTY_CONFIG: PartyConfig = { size: 4, level: 3 };

/**
 * Parse the CR XP lookup key. CR can be a number (1, 2, 3...) or a float (0.125, 0.25, 0.5).
 */
export function parseCr(cr: number | string): number {
  if (typeof cr === "string") {
    if (cr === "1/8") return 0.125;
    if (cr === "1/4") return 0.25;
    if (cr === "1/2") return 0.5;
    return parseFloat(cr) || 0;
  }
  return cr;
}
