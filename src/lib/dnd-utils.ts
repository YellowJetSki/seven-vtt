/* ── D&D 5e Utility Functions ──────────────────────────────────
 * Pure functions for ability modifiers, initiative calculation,
 * proficiency bonuses, and XP thresholds.
 * ─────────────────────────────────────────────────────────────── */

/**
 * Calculate the ability modifier from a score (D&D 5e PHB p. 173).
 * Formula: floor((score - 10) / 2)
 */
export function abilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

/**
 * Format an ability modifier with a sign prefix.
 * e.g. "+3", "-1", "+0"
 */
export function formatModifier(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

/**
 * Format ability modifier from a raw score.
 */
export function formatAbilityModifier(score: number): string {
  return formatModifier(abilityModifier(score));
}

/**
 * Calculate initiative bonus from Dexterity score.
 * Includes miscellaneous bonuses (e.g. from feats or items).
 */
export function calculateInitiative(dexterityScore: number, miscBonus: number = 0): number {
  return abilityModifier(dexterityScore) + miscBonus;
}

/**
 * Proficiency bonus by level (D&D 5e PHB p. 15).
 */
export function proficiencyBonus(level: number): number {
  return Math.ceil(level / 4) + 1;
}

/**
 * Passive Perception = 10 + Wisdom modifier + proficiency (if proficient).
 */
export function passivePerception(wisdomScore: number, proficient: boolean, miscBonus: number = 0): number {
  return 10 + abilityModifier(wisdomScore) + (proficient ? proficiencyBonus(1) : 0) + miscBonus;
}

/**
 * XP required to reach a given level (D&D 5e PHB p. 15).
 */
export function xpToLevel(level: number): number {
  const xpTable: Record<number, number> = {
    1: 0,
    2: 300,
    3: 900,
    4: 2700,
    5: 6500,
    6: 14000,
    7: 23000,
    8: 34000,
    9: 48000,
    10: 64000,
    11: 85000,
    12: 100000,
    13: 120000,
    14: 140000,
    15: 165000,
    16: 195000,
    17: 225000,
    18: 265000,
    19: 305000,
    20: 355000,
  };
  return xpTable[level] ?? 355000;
}

/**
 * Roll a dice expression string (e.g. "2d6", "1d20+5").
 * Returns the numeric result. Note: actual dice rolling is forbidden
 * in the VTT per System Law #1; this function is for initiative
 * calculation and damage computation that the DM inputs manually.
 */
export function parseDiceExpression(expr: string): { count: number; sides: number; modifier: number } | null {
  const match = expr.match(/^(\d+)d(\d+)([+-]\d+)?$/i);
  if (!match) return null;
  return {
    count: parseInt(match[1], 10),
    sides: parseInt(match[2], 10),
    modifier: match[3] ? parseInt(match[3], 10) : 0,
  };
}
