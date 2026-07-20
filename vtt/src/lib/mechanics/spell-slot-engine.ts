import type { SpellLevel, SpellSlotsFull, CasterType } from "@/types";
import { getCasterType, getMaxSlots } from "@/types";
import {
  computeMulticlassSpellcasting,
  type MulticlassSpellcastingState,
  castSpellFromMulticlassPool,
  restoreAllMulticlassSlots,
  restorePactMagicSlots,
  buildClassEntries,
  computeEffectiveCasterLevel,
  getCasterLevelBreakdown,
  type ClassSpellcastingEntry,
} from "@/lib/mechanics/multiclass-spell-slots";

// ── Core Math Functions ──────────────────────────────────────

export function computeSpellSaveDC(abilityMod: number, proficiencyBonus: number): number {
  return 8 + abilityMod + proficiencyBonus;
}

export function computeSpellAttackBonus(abilityMod: number, proficiencyBonus: number): number {
  return abilityMod + proficiencyBonus;
}

export function buildSpellSlots(casterType: CasterType, level: number): SpellSlotsFull {
  const slots = casterType === "pact" || casterType === "none" ? {} : getMaxSlots(casterType, level);
  const pool: SpellSlotsFull = {} as SpellSlotsFull;
  for (let lvl = 1 as SpellLevel; lvl <= 9; lvl++) {
    const max = (slots as any)[lvl] ?? 0;
    (pool as any)[`level${lvl}`] = { level: lvl, current: max, max };
  }
  return pool;
}

export interface SlotDeductionResult {
  success: boolean;
  error?: string;
  updatedSlots: SpellSlotsFull;
}

export function castSpell(slots: SpellSlotsFull, level: SpellLevel, upcast: SpellLevel = level): SlotDeductionResult {
  const targetLevel = Math.max(level, upcast);
  const key = `level${targetLevel}` as keyof SpellSlotsFull;
  const pool = slots[key];
  if (!pool) return { success: false, error: `No level ${targetLevel} spell slots available.`, updatedSlots: slots };
  if (pool.current <= 0) return { success: false, error: `No level ${targetLevel} spell slots remaining.`, updatedSlots: slots };
  const updated = { ...slots, [key]: { ...pool, current: pool.current - 1 } };
  return { success: true, updatedSlots: updated };
}

export function restoreSlots(slots: SpellSlotsFull, level?: SpellLevel): SpellSlotsFull {
  const updated = { ...slots };
  if (level) {
    const key = `level${level}` as keyof SpellSlotsFull;
    updated[key] = { ...updated[key], current: updated[key].max };
  } else {
    for (let lvl = 1 as SpellLevel; lvl <= 9; lvl++) {
      const k = `level${lvl}` as keyof SpellSlotsFull;
      updated[k] = { ...updated[k], current: updated[k].max };
    }
  }
  return updated;
}

// ── State Management ─────────────────────────────────────────

export interface SpellcastingState {
  slots: SpellSlotsFull;
  casterType: CasterType;
  spellSaveDC: number;
  spellAttackBonus: number;
  preparedSpells: string[];
  knownSpells: string[];
  cantripsKnown: string[];
  concentrationSpell: string | null;
}

export interface SpellCastRequest {
  spellName: string;
  spellLevel: SpellLevel;
  upcastTo?: SpellLevel;
}

export interface SpellCastResult {
  success: boolean;
  error?: string;
  state: SpellcastingState;
}

export function createSpellcastingState(
  className: string | { name: string; level: number }[],
  classLevel?: number,
  spellcastingAbilityScore?: number,
  proficiencyBonus?: number
): SpellcastingState {
  // Multi-class mode: accept array of classes
  if (Array.isArray(className)) {
    const classes = className;
    const pb = spellcastingAbilityScore !== undefined
      ? classLevel ?? 2
      : (proficiencyBonus ?? 2);
    const mcState = computeMulticlassSpellcasting(
      classes,
      { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 },
      pb
    );
    return {
      slots: mcState.multiclassSlots,
      casterType: mcState.effectiveCasterLevel > 0 ? "full" : mcState.pactSlots.hasPactMagic ? "pact" : "none",
      spellSaveDC: mcState.spellSaveDC,
      spellAttackBonus: mcState.spellAttackBonus,
      preparedSpells: [],
      knownSpells: [],
      cantripsKnown: [],
      concentrationSpell: null,
    };
  }

  // Single-class mode (backward compatible)
  const casterType = getCasterType(className);
  const slots = buildSpellSlots(casterType, classLevel ?? 1);
  const mod = Math.floor(((spellcastingAbilityScore ?? 10) - 10) / 2);
  return {
    slots,
    casterType,
    spellSaveDC: computeSpellSaveDC(mod, proficiencyBonus ?? 2),
    spellAttackBonus: computeSpellAttackBonus(mod, proficiencyBonus ?? 2),
    preparedSpells: [],
    knownSpells: [],
    cantripsKnown: [],
    concentrationSpell: null,
  };
}

export function tryCastSpell(state: SpellcastingState, request: SpellCastRequest): SpellCastResult {
  const targetLevel = request.upcastTo ?? request.spellLevel;
  const result = castSpell(state.slots, request.spellLevel, targetLevel);
  if (!result.success) return { success: false, error: result.error, state };
  return {
    success: true,
    state: { ...state, slots: result.updatedSlots, concentrationSpell: targetLevel >= 1 ? request.spellName : state.concentrationSpell },
  };
}

export function restoreAllSpellSlots(state: SpellcastingState): SpellcastingState {
  return { ...state, slots: restoreSlots(state.slots) };
}

export function restoreSpellSlotsForLevel(state: SpellcastingState, level: SpellLevel): SpellcastingState {
  return { ...state, slots: restoreSlots(state.slots, level) };
}

export function endConcentration(state: SpellcastingState): SpellcastingState {
  return { ...state, concentrationSpell: null };
}

export function getSlotSummary(slots: SpellSlotsFull): { level: number; current: number; max: number }[] {
  const summary: { level: number; current: number; max: number }[] = [];
  for (let lvl = 1 as SpellLevel; lvl <= 9; lvl++) {
    const key = `level${lvl}` as keyof SpellSlotsFull;
    const pool = slots[key];
    if (pool && pool.max > 0) summary.push({ level: lvl, current: pool.current, max: pool.max });
  }
  return summary;
}
