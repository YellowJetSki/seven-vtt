/**
 * STᚱ VTT — Spell Point Variant System
 *
 * Implements the DMG page 288 Spell Points variant rule.
 * Converts spell slots to a unified pool of spell points.
 *
 * 5e RAW (DMG 288-289):
 *   - Each spell level costs a specific number of points
 *   - Max points per level: you can't spend more points on a
 *     single spell than your max spell level
 *   - Warlocks use Pact Magic (separate pool)
 *   - Cantrips are free
 *
 * Spell Point Costs:
 *   Level 1:  2 points  (1 slot = 2 SP)
 *   Level 2:  3 points  (1 slot = 3 SP)
 *   Level 3:  5 points  (1 slot = 5 SP)
 *   Level 4:  6 points  (1 slot = 6 SP)
 *   Level 5:  7 points  (1 slot = 7 SP)
 *   Level 6:  9 points  (1 slot = 9 SP)
 *   Level 7:  10 points
 *   Level 8:  11 points
 *   Level 9:  13 points
 */

import type { SpellLevel, SpellSlotsFull, CasterType } from "@/types";

// ── Spell Point Cost Table (DMG 289) ─────────────────────────

export const SPELL_POINT_COSTS: Record<number, number> = {
  1: 2,
  2: 3,
  3: 5,
  4: 6,
  5: 7,
  6: 9,
  7: 10,
  8: 11,
  9: 13,
};

/**
 * Total spell points per caster level (DMG 289 table).
 * Indexed by character level [1..20].
 * Values are: [totalPoints, maxSlotLevel]
 */
export const SPELL_POINTS_BY_LEVEL: Record<number, [number, number]> = {
  1:  [4,  1],   // 2nd-level slots unavailable, max lv1
  2:  [6,  1],
  3:  [14, 2],
  4:  [17, 2],
  5:  [27, 3],
  6:  [32, 3],
  7:  [38, 4],
  8:  [44, 4],
  9:  [57, 5],
  10: [64, 5],
  11: [73, 6],
  12: [73, 6],
  13: [83, 7],
  14: [83, 7],
  15: [94, 8],
  16: [94, 8],
  17: [107, 9],
  18: [114, 9],
  19: [123, 9],
  20: [133, 9],
};

// ── Types ────────────────────────────────────────────────────

export interface SpellPointState {
  /** Current spell points remaining */
  current: number;
  /** Maximum spell points available */
  max: number;
  /** Highest level slot that can be created (based on caster level) */
  maxSlotLevel: number;
  /** Whether spell points variant is active */
  enabled: boolean;
}

export interface SpellPointSpendResult {
  success: boolean;
  error?: string;
  updatedState: SpellPointState;
  /** Cost in points for this spell */
  cost: number;
}

export interface SpellPointRestoreResult {
  updatedState: SpellPointState;
  /** Number of points restored */
  restored: number;
}

// ── Core Functions ───────────────────────────────────────────

/**
 * Converts a character's spell slots to spell points.
 * Computes the total point pool from all available slots.
 */
export function slotsToSpellPoints(slots: SpellSlotsFull | null, casterLevel: number): SpellPointState {
  if (!slots) {
    const lookup = SPELL_POINTS_BY_LEVEL[Math.min(casterLevel, 20)];
    return {
      current: lookup?.[0] ?? 0,
      max: lookup?.[0] ?? 0,
      maxSlotLevel: lookup?.[1] ?? 1,
      enabled: true,
    };
  }

  // Compute from actual slots
  let totalPoints = 0;
  let maxSlotLevel = 0;

  for (let lvl = 1; lvl <= 9; lvl++) {
    const key = `level${lvl}` as keyof SpellSlotsFull;
    const pool = slots[key];
    if (pool && pool.max > 0) {
      totalPoints += pool.current * SPELL_POINT_COSTS[lvl];
      maxSlotLevel = lvl;
    }
  }

  // Also compute max from caster level table
  const lookup = SPELL_POINTS_BY_LEVEL[Math.min(casterLevel, 20)];
  const maxPool = lookup?.[0] ?? totalPoints;

  return {
    current: totalPoints,
    max: maxPool,
    maxSlotLevel: Math.max(maxSlotLevel, lookup?.[1] ?? 1),
    enabled: true,
  };
}

/**
 * Gets the maximum spell points for a given caster level.
 */
export function getMaxSpellPoints(casterLevel: number): number {
  const lookup = SPELL_POINTS_BY_LEVEL[Math.min(Math.max(casterLevel, 1), 20)];
  return lookup?.[0] ?? 0;
}

/**
 * Gets the max slot level for a given caster level under spell points.
 */
export function getMaxSlotLevelForSpellPoints(casterLevel: number): number {
  const lookup = SPELL_POINTS_BY_LEVEL[Math.min(Math.max(casterLevel, 1), 20)];
  return lookup?.[1] ?? 1;
}

/**
 * Attempts to spend spell points to cast a spell of a given level.
 * Validates:
 *   - Sufficient points remaining
 *   - Target level does not exceed max slot level
 *   - Target level is valid (1-9)
 */
export function spendSpellPoints(
  state: SpellPointState,
  spellLevel: number
): SpellPointSpendResult {
  if (!state.enabled) {
    return { success: false, error: "Spell points not enabled.", updatedState: state, cost: 0 };
  }
  if (spellLevel < 1 || spellLevel > 9) {
    return { success: false, error: `Invalid spell level: ${spellLevel}.`, updatedState: state, cost: 0 };
  }
  if (spellLevel > state.maxSlotLevel) {
    return {
      success: false,
      error: `Cannot cast level ${spellLevel} spells (max: level ${state.maxSlotLevel}).`,
      updatedState: state,
      cost: 0,
    };
  }

  const cost = SPELL_POINT_COSTS[spellLevel];
  if (!cost) {
    return { success: false, error: `Unknown cost for level ${spellLevel}.`, updatedState: state, cost: 0 };
  }
  if (state.current < cost) {
    return {
      success: false,
      error: `Not enough spell points (${state.current}/${state.max}). Need ${cost} for level ${spellLevel}.`,
      updatedState: state,
      cost,
    };
  }

  const updatedState: SpellPointState = {
    ...state,
    current: state.current - cost,
  };

  return { success: true, updatedState, cost };
}

/**
 * Restores spell points. If amount is not specified, restores to full.
 */
export function restoreSpellPoints(
  state: SpellPointState,
  amount?: number
): SpellPointRestoreResult {
  if (amount === undefined || amount >= state.max - state.current) {
    const restored = state.max - state.current;
    return {
      updatedState: { ...state, current: state.max },
      restored,
    };
  }

  return {
    updatedState: { ...state, current: state.current + amount },
    restored: amount,
  };
}

/**
 * Converts a spell slot back to its spell point value (for recovery abilities).
 */
export function getSlotCostInPoints(spellLevel: SpellLevel): number {
  return SPELL_POINT_COSTS[spellLevel] ?? 0;
}

/**
 * Calculates what spell levels a caster can create with their remaining points.
 * Returns an array of [level, canCast] pairs.
 */
export function getAvailableSpellLevelsFromPoints(state: SpellPointState): { level: number; canCast: boolean; cost: number }[] {
  const available: { level: number; canCast: boolean; cost: number }[] = [];

  for (let lvl = 1; lvl <= state.maxSlotLevel; lvl++) {
    const cost = SPELL_POINT_COSTS[lvl];
    available.push({
      level: lvl,
      canCast: cost !== undefined && state.current >= cost,
      cost: cost ?? 0,
    });
  }

  return available;
}

/**
 * Estimates how many spells of each level a caster could cast with remaining points.
 */
export function estimateSpellCasts(state: SpellPointState): Record<number, number> {
  const estimates: Record<number, number> = {};

  for (let lvl = 1; lvl <= state.maxSlotLevel; lvl++) {
    const cost = SPELL_POINT_COSTS[lvl];
    if (cost) {
      estimates[lvl] = Math.floor(state.current / cost);
    }
  }

  return estimates;
}

/**
 * Flexible casting variant (DMG 288):
 * Can cast lower-level spells at higher levels by spending extra points.
 * Returns the points needed for upcasting.
 */
export function getUpcastCost(baseLevel: number, targetLevel: number): number {
  if (targetLevel <= baseLevel) return SPELL_POINT_COSTS[baseLevel] ?? 0;
  const baseCost = SPELL_POINT_COSTS[baseLevel] ?? 0;
  const targetCost = SPELL_POINT_COSTS[targetLevel] ?? 0;
  return targetCost; // You pay the cost of the target level
}

/**
 * Converts full SpellSlotsFull to SpellPointState (batch conversion).
 */
export function convertSlotsToSpellPoints(
  slots: SpellSlotsFull,
  casterLevel: number
): SpellPointState {
  const state = slotsToSpellPoints(slots, casterLevel);
  // Ensure max is from the table, not computed
  const maxFromTable = getMaxSpellPoints(casterLevel);
  return { ...state, max: maxFromTable };
}

/**
 * Flexible casting: lets a caster create a slot of any valid level
 * as long as they have enough points. Returns updated state and
 * the slot level that was "created".
 */
export function createSlotWithPoints(
  state: SpellPointState,
  targetLevel: number
): SpellPointSpendResult & { createdLevel: number | null } {
  if (targetLevel < 1 || targetLevel > 9) {
    return { success: false, error: `Invalid level: ${targetLevel}.`, updatedState: state, cost: 0, createdLevel: null };
  }
  if (targetLevel > state.maxSlotLevel) {
    return {
      success: false,
      error: `Maximum spell level is ${state.maxSlotLevel}.`,
      updatedState: state,
      cost: 0,
      createdLevel: null,
    };
  }

  const result = spendSpellPoints(state, targetLevel);
  return {
    ...result,
    createdLevel: result.success ? targetLevel : null,
  };
}
