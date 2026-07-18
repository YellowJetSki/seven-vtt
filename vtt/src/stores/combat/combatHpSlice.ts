import type { StateCreator } from "zustand";
import type { CombatLogEntry, Combatant } from "@/types";
import type { CombatSlice } from "./combatSlice";
import { clampHP, createLogEntry } from "./combat-helpers";

export interface CombatHpActions {
  damageCombatant: (combatantId: string, amount: number) => void;
  healCombatant: (combatantId: string, amount: number) => void;
  setTempHP: (combatantId: string, amount: number) => void;
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
      return { activeEncounter: { ...state.activeEncounter, combatants: mapCombatants(state.activeEncounter.combatants, combatantId, { hitPoints: hp, isDead: dead }) }, combatLog: [...state.combatLog, ...log] };
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
      return { activeEncounter: { ...state.activeEncounter, combatants: mapCombatants(state.activeEncounter.combatants, combatantId, { hitPoints: hp, isDead: !alive }) }, combatLog: [...state.combatLog, ...log] };
    }),

  setTempHP: (combatantId: string, amount: number) =>
    set((state) => {
      if (!state.activeEncounter) return state;
      return { activeEncounter: { ...state.activeEncounter, combatants: mapCombatants(state.activeEncounter.combatants, combatantId, { hitPoints: { ...state.activeEncounter.combatants.find((x) => x.id === combatantId)!.hitPoints, temporary: amount } }) } };
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

  addLogEntry: (entry: CombatLogEntry) => set((state) => ({ combatLog: [...state.combatLog, entry] })),

  undoLastAction: () => set((state) => {
    if (state.combatLog.length === 0) return state;
    return { combatLog: state.combatLog.slice(0, -1) };
  }),
});
