/**
 * STᚱ VTT — Multi-Class Spell Slot Engine (PHB 164, 2024 PHB Ch.7)
 *
 * Implements the D&D 5e (and 5.5e/2024) multi-class spell slot stacking rules:
 *
 * ── Core Rule (PHB 164) ──
 * "You determine your available spell slots by adding together all your levels
 *  in the bard, cleric, druid, sorcerer, and wizard classes, half your levels
 *  (rounded down) in the paladin and ranger classes, and one-third of your
 *  fighter (Eldritch Knight) or rogue (Arcane Trickster) levels (rounded down).
 *  Use this total to determine your spell slots by consulting the Multiclass
 *  Spellcaster table."
 *
 * ── Warlock Exception ──
 * "Pact Magic" slots (Warlock) are TRACKED SEPARATELY from the multi-class pool.
 * A Warlock 3 / Wizard 2 has:
 *   - 2nd-level Pact Magic slots (from Warlock 3)
 *   - Multi-class pool at effective caster level 2 (from Wizard 2)
 *
 * ── Edge Cases ──
 *   - Effective level 0 → no multi-class slots
 *   - Levels below subclass minimum (Eldritch Knight Lv3, Arcane Trickster Lv3) → 0
 *   - Effective level capped at 20 (Spellcaster table only goes to 20)
 *
 * Architecture: All functions are PURE. No Zustand, no Firebase, no side effects.
 */

import type { SpellLevel, SpellSlotsFull, CasterType } from "@/types";

// ── Re-exported types ──
export type { CasterType };

/**
 * Extended caster type that includes Warlock "pact" magic
 * and "none" for non-casters.
 */
export type ExtendedCasterType = CasterType | "pact" | "none";

/**
 * Describes a single class's contribution to multi-class spellcasting.
 */
export interface ClassSpellcastingEntry {
  /** Class name (e.g. "Wizard", "Paladin", "Warlock") */
  className: string;
  /** Levels in this class */
  level: number;
  /** How this class contributes to the multi-class pool */
  contributionType: ExtendedCasterType;
  /** Effective levels contributed to the pool (after rounding) */
  effectiveLevels: number;
}

/**
 * Complete multi-class spellcasting state for a character.
 */
export interface MulticlassSpellcastingState {
  /** The consolidated multi-class spell slots (from all classes EXCEPT Warlock) */
  multiclassSlots: SpellSlotsFull;
  /** Effective caster level for the multi-class pool (1-20, or 0 if none) */
  effectiveCasterLevel: number;
  /** Warlock pact magic slots (separate pool) */
  pactSlots: PactMagicSlots;
  /** Per-class contributions */
  classEntries: ClassSpellcastingEntry[];
  /** Whether this character can cast spells at all */
  isCaster: boolean;
  /** Spellcasting ability modifier */
  spellcastingAbilityMod: number;
  /** Spell save DC */
  spellSaveDC: number;
  /** Spell attack bonus */
  spellAttackBonus: number;
}

/**
 * Warlock Pact Magic slot structure.
 * Warlocks have a fixed slot level and count that recharges on SHORT rest.
 */
export interface PactMagicSlots {
  /** Whether this character has Pact Magic */
  hasPactMagic: boolean;
  /** The level of pact slots (e.g. 5 for Warlock 9+) */
  slotLevel: SpellLevel;
  /** Current number of pact slots remaining */
  current: number;
  /** Maximum number of pact slots */
  max: number;
}

// ── Warlock Pact Magic Table (PHB) ───────────────────────────

interface PactSlotConfig {
  slotLevel: SpellLevel;
  slotCount: number;
  invocationsKnown?: number;
  spellsKnown?: number;
}

/**
 * Warlock Pact Magic progression per level.
 * Slot level increases at 1, 3, 5, 7, 9.
 * Slot count is 1 at Lv1, 2 at Lv2-10, 3 at Lv11-16, 4 at Lv17+.
 */
const PACT_MAGIC_TABLE: Record<number, PactSlotConfig> = {
  1:  { slotLevel: 1, slotCount: 1 },
  2:  { slotLevel: 1, slotCount: 2 },
  3:  { slotLevel: 2, slotCount: 2 },
  4:  { slotLevel: 2, slotCount: 2 },
  5:  { slotLevel: 3, slotCount: 2 },
  6:  { slotLevel: 3, slotCount: 2 },
  7:  { slotLevel: 4, slotCount: 2 },
  8:  { slotLevel: 4, slotCount: 2 },
  9:  { slotLevel: 5, slotCount: 2 },
  10: { slotLevel: 5, slotCount: 2 },
  11: { slotLevel: 5, slotCount: 3 },
  12: { slotLevel: 5, slotCount: 3 },
  13: { slotLevel: 5, slotCount: 3 },
  14: { slotLevel: 5, slotCount: 3 },
  15: { slotLevel: 5, slotCount: 3 },
  16: { slotLevel: 5, slotCount: 3 },
  17: { slotLevel: 5, slotCount: 4 },
  18: { slotLevel: 5, slotCount: 4 },
  19: { slotLevel: 5, slotCount: 4 },
  20: { slotLevel: 5, slotCount: 4 },
};

/**
 * Multi-class effective caster level consolidation table (PHB 165 "Multiclass Spellcaster").
 * Maps effective caster level → spell slots per level.
 *
 * This IS the table that determines slots for multi-class casters.
 */
const MULTICLASS_SLOT_TABLE: Record<number, Partial<Record<SpellLevel, number>>> = {
  1:  { 1: 2 },
  2:  { 1: 3 },
  3:  { 1: 4, 2: 2 },
  4:  { 1: 4, 2: 3 },
  5:  { 1: 4, 2: 3, 3: 2 },
  6:  { 1: 4, 2: 3, 3: 3 },
  7:  { 1: 4, 2: 3, 3: 3, 4: 1 },
  8:  { 1: 4, 2: 3, 3: 3, 4: 2 },
  9:  { 1: 4, 2: 3, 3: 3, 4: 3, 5: 1 },
  10: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2 },
  11: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1 },
  12: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1 },
  13: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1 },
  14: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1 },
  15: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1 },
  16: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1 },
  17: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1, 9: 1 },
  18: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 1, 7: 1, 8: 1, 9: 1 },
  19: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 2, 7: 1, 8: 1, 9: 1 },
  20: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 2, 7: 2, 8: 1, 9: 1 },
};

// ═══════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════

/**
 * Classify a class's contribution type for multi-class spell slot consolidation.
 *
 * Per PHB 164:
 *   - Full casters (Bard, Cleric, Druid, Sorcerer, Wizard): 1:1
 *   - Half casters (Paladin, Ranger, Artificer): 1:2 (round down)
 *   - Third casters (Eldritch Knight, Arcane Trickster): 1:3 (round down)
 *   - Warlocks: Tracked separately as Pact Magic
 *   - All others (Fighter, Barbarian, Monk, Rogue): none
 */
export function getContributionType(className: string): ExtendedCasterType {
  const lower = className.toLowerCase().trim();

  // Full casters
  if (["bard", "cleric", "druid", "sorcerer", "wizard"].includes(lower)) return "full";

  // Half casters
  if (["paladin", "ranger", "artificer"].includes(lower)) return "half";

  // Third casters (subclass-specific, but we need to handle it)
  if (lower === "eldritch knight" || lower === "arcane trickster") return "third";

  // Warlock — Pact Magic is separate
  if (lower === "warlock") return "pact";

  // Non-casters
  return "none";
}

/**
 * Compute the effective levels contributed by a single class.
 *
 * @param className Class name (case-insensitive)
 * @param level     Levels in this class (1-20)
 * @returns Effective levels contributed to the multiclass pool
 */
export function computeEffectiveLevels(className: string, level: number): number {
  const type = getContributionType(className);
  return computeEffectiveLevelsForType(type, level);
}

/**
 * Compute effective levels from a contribution type and level.
 *
 * @param type  Contribution type
 * @param level Levels in the class
 * @returns Effective levels contributed
 */
export function computeEffectiveLevelsForType(type: ExtendedCasterType, level: number): number {
  if (level <= 0) return 0;

  switch (type) {
    case "full":
      // Full caster: 1:1 — every level counts
      return level;
    case "half":
      // Half caster: 1:2 — Paladin Lv6 contributes 3 effective levels
      return Math.floor(level / 2);
    case "third":
      // Third caster: 1:3 — Eldritch Knight Lv6 contributes 2 effective levels
      // Minimum: subclass gained at Lv3, so levels 1-2 contribute 0
      return Math.floor(Math.max(0, level - 2) / 3);
    case "pact":
    case "none":
      // Warlock and non-casters contribute NOTHING to the pool
      return 0;
  }
}

/**
 * Compute the TOTAL effective caster level across all spellcasting classes.
 * This is the number used to look up the Multiclass Spellcaster table.
 *
 * @param classEntries Array of class contributions
 * @returns Effective caster level (0-20, capped at 20)
 */
export function computeEffectiveCasterLevel(
  classEntries: ClassSpellcastingEntry[]
): number {
  // Sum all effective levels, excluding pact magic (Warlock)
  const total = classEntries
    .filter((e) => e.contributionType !== "pact" && e.contributionType !== "none")
    .reduce((sum, e) => sum + e.effectiveLevels, 0);

  // Cap at 20 (the table doesn't go higher)
  return Math.min(20, Math.max(0, Math.floor(total)));
}

/**
 * Build an array of ClassSpellcastingEntry from a character's class list.
 *
 * @param classes Array of { name, level } objects
 * @returns Class entries with computed contributions
 */
export function buildClassEntries(
  classes: { name: string; level: number }[]
): ClassSpellcastingEntry[] {
  return classes.map((c) => {
    const contributionType = getContributionType(c.name);
    const effectiveLevels = computeEffectiveLevelsForType(contributionType, c.level);
    return {
      className: c.name,
      level: c.level,
      contributionType,
      effectiveLevels,
    };
  });
}

/**
 * Determine Warlock Pact Magic slots from Warlock levels.
 *
 * @param warlockLevel Levels in Warlock class
 * @returns PactMagicSlots (empty if no Warlock levels)
 */
export function computePactMagicSlots(warlockLevel: number): PactMagicSlots {
  if (warlockLevel <= 0) {
    return { hasPactMagic: false, slotLevel: 1 as SpellLevel, current: 0, max: 0 };
  }

  // Clamp to 1-20
  const level = Math.min(20, Math.max(1, warlockLevel));
  const config = PACT_MAGIC_TABLE[level];

  return {
    hasPactMagic: true,
    slotLevel: config.slotLevel,
    current: config.slotCount,
    max: config.slotCount,
  };
}

/**
 * Build a complete SpellSlotsFull from the Multiclass Spellcaster table.
 *
 * @param effectiveCasterLevel Effective caster level (1-20, or 0)
 * @returns Fully populated SpellSlotsFull (all 9 levels, zeroed for unavailable)
 */
export function buildMulticlassSlots(effectiveCasterLevel: number): SpellSlotsFull {
  const slots: SpellSlotsFull = {} as SpellSlotsFull;

  for (let lvl = 1 as SpellLevel; lvl <= 9; lvl++) {
    const key = `level${lvl}` as keyof SpellSlotsFull;
    let max = 0;

    if (effectiveCasterLevel >= 1) {
      const tableData = MULTICLASS_SLOT_TABLE[effectiveCasterLevel] ?? {};
      max = (tableData as any)[lvl] ?? 0;
    }

    (slots as any)[key] = { level: lvl, current: max, max };
  }

  return slots;
}

/**
 * Determine the spellcasting ability modifier for a character based on
 * their highest-level caster class.
 *
 * Priority: Full casters > Half casters > Third casters > Warlock
 *
 * @param classEntries Class entries with contribution types
 * @param abilityScores Character's ability scores
 * @returns Spellcasting ability modifier
 */
export function determineSpellcastingAbility(
  classEntries: ClassSpellcastingEntry[],
  abilityScores: { strength: number; dexterity: number; constitution: number; intelligence: number; wisdom: number; charisma: number }
): number {
  const getMod = (score: number) => Math.floor((score - 10) / 2);

  // Find the highest-priority caster class
  const priorityOrder: ExtendedCasterType[] = ["full", "half", "third", "pact"];

  for (const priority of priorityOrder) {
    const entry = classEntries.find((e) => e.contributionType === priority);
    if (!entry) continue;

    const lower = entry.className.toLowerCase();

    // Determine which ability this class uses
    if (["wizard", "artificer", "eldritch knight"].some((x) => lower.includes(x))) {
      return getMod(abilityScores.intelligence);
    }
    if (["cleric", "druid", "ranger"].some((x) => lower.includes(x))) {
      return getMod(abilityScores.wisdom);
    }
    if (["paladin", "sorcerer", "bard", "warlock", "arcane trickster"].some((x) => lower.includes(x))) {
      return getMod(abilityScores.charisma);
    }
  }

  // No caster class found
  return 0;
}

/**
 * Compute the complete multi-class spellcasting state for a character.
 *
 * This is the MAIN entry point. Takes class levels and ability scores,
 * returns the full spellcasting state.
 *
 * @param classes Array of { name, level } for all character classes
 * @param abilityScores Ability scores
 * @param proficiencyBonus Character's proficiency bonus
 * @returns Complete MulticlassSpellcastingState
 */
export function computeMulticlassSpellcasting(
  classes: { name: string; level: number }[],
  abilityScores: { strength: number; dexterity: number; constitution: number; intelligence: number; wisdom: number; charisma: number },
  proficiencyBonus: number
): MulticlassSpellcastingState {
  // Build class entries
  const classEntries = buildClassEntries(classes);

  // Check if character can cast at all
  const isCaster = classEntries.some((e) =>
    e.contributionType !== "none"
  );

  // Compute effective caster level (multi-class pool)
  const effectiveCasterLevel = computeEffectiveCasterLevel(classEntries);

  // Build multi-class slots
  const multiclassSlots = buildMulticlassSlots(effectiveCasterLevel);

  // Compute Warlock pact magic (if any)
  const warlockEntry = classEntries.find((e) => e.contributionType === "pact");
  const pactSlots = computePactMagicSlots(warlockEntry?.level ?? 0);

  // Determine spellcasting ability
  const spellcastingAbilityMod = determineSpellcastingAbility(classEntries, abilityScores);

  // Compute DC and attack bonus
  const spellSaveDC = 8 + spellcastingAbilityMod + proficiencyBonus;
  const spellAttackBonus = spellcastingAbilityMod + proficiencyBonus;

  return {
    multiclassSlots,
    effectiveCasterLevel,
    pactSlots,
    classEntries,
    isCaster,
    spellcastingAbilityMod,
    spellSaveDC,
    spellAttackBonus,
  };
}

/**
 * Cast a spell from the multi-class pool.
 * Reduces the appropriate spell slot level by 1.
 *
 * @param state Current MulticlassSpellcastingState
 * @param level Spell level to cast
 * @param isPactMagic If true, use pact magic slots instead of the multi-class pool
 * @returns Updated state, or error if no slots available
 */
export function castSpellFromMulticlassPool(
  state: MulticlassSpellcastingState,
  level: SpellLevel,
  isPactMagic: boolean = false
): { success: boolean; error?: string; state: MulticlassSpellcastingState } {
  if (isPactMagic) {
    if (!state.pactSlots.hasPactMagic) {
      return { success: false, error: "No Pact Magic available.", state };
    }
    if (state.pactSlots.current <= 0) {
      return { success: false, error: "No Pact Magic slots remaining.", state };
    }
    if (level !== state.pactSlots.slotLevel) {
      return { success: false, error: `Pact Magic slots are level ${state.pactSlots.slotLevel}.`, state };
    }

    return {
      success: true,
      state: {
        ...state,
        pactSlots: { ...state.pactSlots, current: state.pactSlots.current - 1 },
      },
    };
  }

  // Multi-class pool
  const key = `level${level}` as keyof SpellSlotsFull;
  const pool = state.multiclassSlots[key];

  if (!pool || pool.current <= 0) {
    return { success: false, error: `No level ${level} spell slots remaining.`, state };
  }

  const updatedSlots = {
    ...state.multiclassSlots,
    [key]: { ...pool, current: pool.current - 1 },
  };

  return {
    success: true,
    state: { ...state, multiclassSlots: updatedSlots },
  };
}

/**
 * Restore pact magic slots to full (Warlock short rest).
 *
 * @param state Current MulticlassSpellcastingState
 * @returns Updated state with full pact slots
 */
export function restorePactMagicSlots(state: MulticlassSpellcastingState): MulticlassSpellcastingState {
  if (!state.pactSlots.hasPactMagic) return state;
  return {
    ...state,
    pactSlots: { ...state.pactSlots, current: state.pactSlots.max },
  };
}

/**
 * Restore multi-class spell slots (long rest).
 *
 * @param state Current MulticlassSpellcastingState
 * @returns Updated state with full slots
 */
export function restoreAllMulticlassSlots(state: MulticlassSpellcastingState): MulticlassSpellcastingState {
  const restoredSlots = { ...state.multiclassSlots };
  for (let lvl = 1 as SpellLevel; lvl <= 9; lvl++) {
    const key = `level${lvl}` as keyof SpellSlotsFull;
    restoredSlots[key] = { ...restoredSlots[key], current: restoredSlots[key].max };
  }
  return { ...state, multiclassSlots: restoredSlots };
}

/**
 * Get a human-readable summary of effective caster level breakdown.
 *
 * @param entries Class entries
 * @returns Summary strings
 */
export function getCasterLevelBreakdown(entries: ClassSpellcastingEntry[]): string[] {
  return entries
    .filter((e) => e.contributionType !== "none")
    .map((e) => {
      if (e.contributionType === "pact") {
        return `${e.className} ${e.level} → Pact Magic (slots: ${e.level <= 0 ? 0 : computePactMagicSlots(e.level).max}x Lv${computePactMagicSlots(e.level).slotLevel})`;
      }
      return `${e.className} ${e.level} → ${e.effectiveLevels} effective level${e.effectiveLevels !== 1 ? "s" : ""}`;
    });
}
