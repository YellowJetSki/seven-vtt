import type { StateCreator } from "zustand";
import type { CombatLogEntry, Combatant } from "@/types";
import type { CombatSlice } from "./combatSlice";
import { clampHP, createLogEntry } from "./combat-helpers";
import type { AoEDamageResult } from "@/lib/combat/aoe-damage-engine";
import { buildAoEHPUpdates, createAoELogEntry } from "@/lib/combat/aoe-damage-engine";

// ── Combat log overflow protection ──
// Prevents unbounded growth during long sessions
const MAX_COMBAT_LOG = 500;
const COMBAT_LOG_CULL_COUNT = Math.floor(MAX_COMBAT_LOG * 0.2); // Remove oldest 20%

function trimCombatLog(log: CombatLogEntry[]): CombatLogEntry[] {
  if (log.length <= MAX_COMBAT_LOG) return log;
  return log.slice(COMBAT_LOG_CULL_COUNT);
}

export interface CombatHpActions {
  damageCombatant: (combatantId: string, amount: number) => void;
  healCombatant: (combatantId: string, amount: number) => void;
  setTempHP: (combatantId: string, amount: number) => void;
  /** Apply AoE damage to multiple combatants at once with per-target resistance */
  aoeDamageCombatants: (
    actorId: string,
    actorName: string,
    spellName: string,
    damage: number,
    damageType: string,
    result: AoEDamageResult
  ) => void;
}

export interface CombatEffectActions {
  addStatusEffect: (combatantId: string, effect: string) => void;
  removeStatusEffect: (combatantId: string, effectId: string) => void;
  toggleDead: (combatantId: string) => void;
  toggleConcentration: (combatantId: string) => void;
  setCombatantNotes: (combatantId: string, notes: string) => void;
}

export type CombatHpSlice = CombatHpActions & CombatEffectActions & {
  addLogEntry: (entry: CombatLogEntry) => void;
  undoLastAction: () => void;
};

function mapCombatants(combatants: Combatant[], id: string, updates: Partial<Combatant>): Combatant[] {
  return combatants.map((c) => (c.id === id ? { ...c, ...updates } : c));
}

export const createCombatHpSlice: StateCreator<CombatSlice & CombatHpSlice, [], [], CombatHpSlice> = 
  (set) => ({
  damageCombatant: (combatantId: string, amount: number) =>
    set((state) => {
      if (!state.activeEncounter) return state;
      const c = state.activeEncounter.combatants.find((x) => x.id === combatantId);
      if (!c) return state;
      const hp = clampHP(c.hitPoints, -amount);
      const dead = hp.current <= 0;
      const log = [createLogEntry("damage", combatantId, c.name, { value: amount })];
      if (dead && !c.isDead) log.push(createLogEntry("death", combatantId, c.name));
      return { activeEncounter: { ...state.activeEncounter, combatants: mapCombatants(state.activeEncounter.combatants, combatantId, { hitPoints: hp, isDead: dead }) }, combatLog: trimCombatLog([...state.combatLog, ...log]) };
    }),

  aoeDamageCombatants: (
    actorId: string,
    actorName: string,
    spellName: string,
    damage: number,
    damageType: string,
    result: AoEDamageResult
  ) =>
    set((state) => {
      if (!state.activeEncounter) return state;

      // Build per-combatant HP updates
      const updates = buildAoEHPUpdates(result);

      // Apply all HP changes simultaneously
      let combatants = [...state.activeEncounter.combatants];
      const logEntries: CombatLogEntry[] = [];

      for (const update of updates) {
        const existing = combatants.find((c) => c.id === update.combatantId);
        if (!existing) continue;
        combatants = mapCombatants(combatants, update.combatantId, {
          hitPoints: update.hitPoints,
          isDead: update.isDead,
        });
      }

      // Create a single grouped AoE log entry
      const aoeEntry = createAoELogEntry(
        actorId,
        actorName,
        spellName,
        damage,
        damageType,
        result
      );
      logEntries.push(aoeEntry);

      // Add death entries (deduplicated by engine)
      logEntries.push(...result.deathEntries);

      return {
        activeEncounter: {
          ...state.activeEncounter,
          combatants,
        },
        combatLog: trimCombatLog([...state.combatLog, ...logEntries]),
      };
    }),

  healCombatant: (combatantId: string, amount: number) =>
    set((state) => {
      if (!state.activeEncounter) return state;
      const c = state.activeEncounter.combatants.find((x) => x.id === combatantId);
      if (!c) return state;
      const hp = clampHP(c.hitPoints, amount);
      const alive = hp.current > 0;
      const log = [createLogEntry("heal", combatantId, c.name, { value: amount })];
      if (c.isDead && alive) log.push(createLogEntry("revive", combatantId, c.name));
      return { activeEncounter: { ...state.activeEncounter, combatants: mapCombatants(state.activeEncounter.combatants, combatantId, { hitPoints: hp, isDead: !alive }) }, combatLog: trimCombatLog([...state.combatLog, ...log]) };
    }),

  setTempHP: (combatantId: string, amount: number) =>
    set((state) => {
      if (!state.activeEncounter) return state;
      const existing = state.activeEncounter.combatants.find((x) => x.id === combatantId);
      if (!existing) return state;
      return {
        activeEncounter: {
          ...state.activeEncounter,
          combatants: mapCombatants(state.activeEncounter.combatants, combatantId, {
            hitPoints: { ...existing.hitPoints, temporary: amount },
          }),
        },
      };
    }),

  addStatusEffect: (combatantId: string, effect: string) =>
    set((state) => {
      if (!state.activeEncounter) return state;
      return { activeEncounter: { ...state.activeEncounter, combatants: mapCombatants(state.activeEncounter.combatants, combatantId, { statusEffects: [...(state.activeEncounter.combatants.find((x) => x.id === combatantId)?.statusEffects ?? []), { id: `${effect}_${Date.now()}`, effect }] }) } };
    }),

  removeStatusEffect: (combatantId: string, effectId: string) =>
    set((state) => {
      if (!state.activeEncounter) return state;
      return { activeEncounter: { ...state.activeEncounter, combatants: mapCombatants(state.activeEncounter.combatants, combatantId, { statusEffects: state.activeEncounter.combatants.find((x) => x.id === combatantId)?.statusEffects.filter((e) => e.id !== effectId) ?? [] }) } };
    }),

  toggleDead: (combatantId: string) =>
    set((state) => {
      if (!state.activeEncounter) return state;
      const c = state.activeEncounter.combatants.find((x) => x.id === combatantId);
      return c ? { activeEncounter: { ...state.activeEncounter, combatants: mapCombatants(state.activeEncounter.combatants, combatantId, { isDead: !c.isDead }) } } : state;
    }),

  toggleConcentration: (combatantId: string) =>
    set((state) => {
      if (!state.activeEncounter) return state;
      const c = state.activeEncounter.combatants.find((x) => x.id === combatantId);
      return c ? { activeEncounter: { ...state.activeEncounter, combatants: mapCombatants(state.activeEncounter.combatants, combatantId, { isConcentrating: !c.isConcentrating }) } } : state;
    }),

  setCombatantNotes: (combatantId: string, notes: string) =>
    set((state) => {
      if (!state.activeEncounter) return state;
      return { activeEncounter: { ...state.activeEncounter, combatants: mapCombatants(state.activeEncounter.combatants, combatantId, { notes }) } };
    }),

  addLogEntry: (entry: CombatLogEntry) => set((state) => ({ combatLog: trimCombatLog([...state.combatLog, entry]) })),

  undoLastAction: () => set((state) => {
    if (state.combatLog.length === 0) return state;
    return { combatLog: state.combatLog.slice(0, -1) };
  }),
});
