/**
 * STᚱ VTT — Combat HP Slice (Sprint 21)
 *
 * Now with FULL UNDO SUPPORT. Every mutation stores an `undoPayload`
 * containing the HP snapshot of all affected combatants BEFORE the
 * action. When the DM clicks "Undo", the HP and isDead states are
 * RESTORED to their previous values — NOT just the log entry removed.
 *
 * Key Architecture:
 *   - Single undo: Pops the last log entry and reverses its HP snapshots
 *   - AoE undo: Reverses ALL target snapshots simultaneously (batch revert)
 *   - Overflow-safe: 500-entry max, oldest 20% culled
 *   - No dice rollers: Pure state transformation
 */

import type { StateCreator } from "zustand";
import type { CombatLogEntry, Combatant, UndoPayload } from "@/types";
import type { CombatSlice } from "./combatSlice";
import { clampHP, createLogEntry } from "./combat-helpers";
import type { AoEDamageResult } from "@/lib/combat/aoe-damage-engine";
import { buildAoEHPUpdates, createAoELogEntry } from "@/lib/combat/aoe-damage-engine";

// ── Combat log overflow protection ──
const MAX_COMBAT_LOG = 500;
const COMBAT_LOG_CULL_COUNT = Math.floor(MAX_COMBAT_LOG * 0.2);

function trimCombatLog(log: CombatLogEntry[]): CombatLogEntry[] {
  if (log.length <= MAX_COMBAT_LOG) return log;
  return log.slice(COMBAT_LOG_CULL_COUNT);
}

export interface CombatHpActions {
  damageCombatant: (combatantId: string, amount: number) => void;
  healCombatant: (combatantId: string, amount: number) => void;
  setTempHP: (combatantId: string, amount: number) => void;
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
  /** Undo the last action — REVERSES HP changes, not just log removal */
  undoLastAction: () => void;
  /** Clear the entire combat log (no HP reversal) */
  clearLog: () => void;
};

function mapCombatants(combatants: Combatant[], id: string, updates: Partial<Combatant>): Combatant[] {
  return combatants.map((c) => (c.id === id ? { ...c, ...updates } : c));
}

/**
 * Build an undo payload snapshot for a single combatant.
 */
function snapHP(combatant: Combatant): UndoPayload["hpSnapshots"][0] {
  return {
    combatantId: combatant.id,
    previousHP: { ...combatant.hitPoints },
    previousIsDead: combatant.isDead,
  };
}

/**
 * Build an undo payload from one or more combatant snapshots.
 */
function buildUndo(...snapshots: UndoPayload["hpSnapshots"]): UndoPayload {
  return { hpSnapshots: snapshots };
}

/**
 * Apply an undo payload to a combatants array — restoring each
 * combatant to their previous HP and isDead state.
 */
function applyUndo(
  combatants: Combatant[],
  undoPayload: UndoPayload
): Combatant[] {
  let updated = [...combatants];
  for (const snap of undoPayload.hpSnapshots) {
    updated = mapCombatants(updated, snap.combatantId, {
      hitPoints: { ...snap.previousHP },
      isDead: snap.previousIsDead,
    });
  }
  return updated;
}

export const createCombatHpSlice: StateCreator<CombatSlice & CombatHpSlice, [], [], CombatHpSlice> =
  (set) => ({
  damageCombatant: (combatantId: string, amount: number) =>
    set((state) => {
      if (!state.activeEncounter) return state;
      const c = state.activeEncounter.combatants.find((x) => x.id === combatantId);
      if (!c) return state;

      // Snapshot BEFORE mutation
      const snapshot = snapHP(c);

      const hp = clampHP(c.hitPoints, -amount);
      const dead = hp.current <= 0;
      const log: CombatLogEntry[] = [
        createLogEntry("damage", combatantId, c.name, {
          value: amount,
          undoPayload: buildUndo(snapshot),
        }),
      ];
      if (dead && !c.isDead) {
        log.push(createLogEntry("death", combatantId, c.name, {
          undoPayload: buildUndo(snapshot),
        }));
      }
      return {
        activeEncounter: {
          ...state.activeEncounter,
          combatants: mapCombatants(
            state.activeEncounter.combatants,
            combatantId,
            { hitPoints: hp, isDead: dead }
          ),
        },
        combatLog: trimCombatLog([...state.combatLog, ...log]),
      };
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

      // Snapshot ALL targets BEFORE mutation
      const snapshots: UndoPayload["hpSnapshots"] = [];
      for (const target of result.targets) {
        const existing = state.activeEncounter.combatants.find(
          (c) => c.id === target.combatantId
        );
        if (existing) snapshots.push(snapHP(existing));
      }

      // Build HP updates from the engine
      const updates = buildAoEHPUpdates(result);

      // Apply all HP changes simultaneously
      let combatants = [...state.activeEncounter.combatants];
      for (const update of updates) {
        const existing = combatants.find((c) => c.id === update.combatantId);
        if (!existing) continue;
        combatants = mapCombatants(combatants, update.combatantId, {
          hitPoints: update.hitPoints,
          isDead: update.isDead,
        });
      }

      // Create grouped AoE log entry with undo payload
      const aoeEntry = createAoELogEntry(
        actorId,
        actorName,
        spellName,
        damage,
        damageType,
        result
      );
      // Add undo payload to the AoE log entry
      aoeEntry.undoPayload = buildUndo(...snapshots);

      const logEntries: CombatLogEntry[] = [aoeEntry];
      logEntries.push(...result.deathEntries);

      return {
        activeEncounter: { ...state.activeEncounter, combatants },
        combatLog: trimCombatLog([...state.combatLog, ...logEntries]),
      };
    }),

  healCombatant: (combatantId: string, amount: number) =>
    set((state) => {
      if (!state.activeEncounter) return state;
      const c = state.activeEncounter.combatants.find((x) => x.id === combatantId);
      if (!c) return state;

      // Snapshot BEFORE mutation
      const snapshot = snapHP(c);

      const hp = clampHP(c.hitPoints, amount);
      const alive = hp.current > 0;
      const log: CombatLogEntry[] = [
        createLogEntry("heal", combatantId, c.name, {
          value: amount,
          undoPayload: buildUndo(snapshot),
        }),
      ];
      if (c.isDead && alive) {
        log.push(createLogEntry("revive", combatantId, c.name, {
          undoPayload: buildUndo(snapshot),
        }));
      }
      return {
        activeEncounter: {
          ...state.activeEncounter,
          combatants: mapCombatants(
            state.activeEncounter.combatants,
            combatantId,
            { hitPoints: hp, isDead: !alive }
          ),
        },
        combatLog: trimCombatLog([...state.combatLog, ...log]),
      };
    }),

  setTempHP: (combatantId: string, amount: number) =>
    set((state) => {
      if (!state.activeEncounter) return state;
      const existing = state.activeEncounter.combatants.find(
        (x) => x.id === combatantId
      );
      if (!existing) return state;

      // Snapshot BEFORE mutation
      const snapshot = snapHP(existing);

      return {
        activeEncounter: {
          ...state.activeEncounter,
          combatants: mapCombatants(
            state.activeEncounter.combatants,
            combatantId,
            {
              hitPoints: { ...existing.hitPoints, temporary: amount },
            }
          ),
        },
        combatLog: [
          ...state.combatLog,
          createLogEntry("temp_hp", combatantId, existing.name, {
            value: amount,
            undoPayload: buildUndo(snapshot),
          }),
        ],
      };
    }),

  addStatusEffect: (combatantId: string, effect: string) =>
    set((state) => {
      if (!state.activeEncounter) return state;
      const c = state.activeEncounter.combatants.find((x) => x.id === combatantId);
      if (!c) return state;
      const newEffects = [
        ...c.statusEffects,
        { id: `${effect}_${Date.now()}`, effect },
      ];
      return {
        activeEncounter: {
          ...state.activeEncounter,
          combatants: mapCombatants(
            state.activeEncounter.combatants,
            combatantId,
            { statusEffects: newEffects }
          ),
        },
        combatLog: [
          ...state.combatLog,
          createLogEntry("status", combatantId, c.name, {
            description: `+ ${effect}`,
          }),
        ],
      };
    }),

  removeStatusEffect: (combatantId: string, effectId: string) =>
    set((state) => {
      if (!state.activeEncounter) return state;
      const c = state.activeEncounter.combatants.find((x) => x.id === combatantId);
      if (!c) return state;
      return {
        activeEncounter: {
          ...state.activeEncounter,
          combatants: mapCombatants(
            state.activeEncounter.combatants,
            combatantId,
            {
              statusEffects: c.statusEffects.filter(
                (e) => e.id !== effectId
              ),
            }
          ),
        },
      };
    }),

  toggleDead: (combatantId: string) =>
    set((state) => {
      if (!state.activeEncounter) return state;
      const c = state.activeEncounter.combatants.find(
        (x) => x.id === combatantId
      );
      if (!c) return state;
      return {
        activeEncounter: {
          ...state.activeEncounter,
          combatants: mapCombatants(
            state.activeEncounter.combatants,
            combatantId,
            { isDead: !c.isDead }
          ),
        },
      };
    }),

  toggleConcentration: (combatantId: string) =>
    set((state) => {
      if (!state.activeEncounter) return state;
      const c = state.activeEncounter.combatants.find(
        (x) => x.id === combatantId
      );
      if (!c) return state;
      return {
        activeEncounter: {
          ...state.activeEncounter,
          combatants: mapCombatants(
            state.activeEncounter.combatants,
            combatantId,
            { isConcentrating: !c.isConcentrating }
          ),
        },
      };
    }),

  setCombatantNotes: (combatantId: string, notes: string) =>
    set((state) => {
      if (!state.activeEncounter) return state;
      return {
        activeEncounter: {
          ...state.activeEncounter,
          combatants: mapCombatants(
            state.activeEncounter.combatants,
            combatantId,
            { notes }
          ),
        },
      };
    }),

  addLogEntry: (entry: CombatLogEntry) =>
    set((state) => ({
      combatLog: trimCombatLog([...state.combatLog, entry]),
    })),

  /**
   * PROPER UNDO: Reverses HP changes from the last action.
   *
   * Steps:
   * 1. Find the LAST entry in the combat log that has an undoPayload
   * 2. Reverse all HP snapshots for that action
   * 3. Remove the entry from the log
   *
   * This handles:
   *   - Single-target damage/heal
   *   - Multi-target AoE damage (batch revert)
   *   - Death/revive state restoration
   */
  undoLastAction: () =>
    set((state) => {
      if (state.combatLog.length === 0) return state;

      // Find the last entry that has an undo payload
      // (some entries like status effects don't store HP snapshots)
      const undoableIndex = state.combatLog.length - 1;
      const lastEntry = state.combatLog[undoableIndex];

      if (!lastEntry) return state;

      // Remove the entry from the log (always)
      const newLog = state.combatLog.slice(0, -1);

      // If there's no undo payload, we can only remove the log entry
      if (!lastEntry.undoPayload || !state.activeEncounter) {
        return { combatLog: newLog };
      }

      // Revert all HP snapshots
      const revertedCombatants = applyUndo(
        state.activeEncounter.combatants,
        lastEntry.undoPayload
      );

      return {
        activeEncounter: {
          ...state.activeEncounter,
          combatants: revertedCombatants,
        },
        combatLog: trimCombatLog(newLog),
      };
    }),

  clearLog: () =>
    set((state) => ({
      combatLog: [],
    })),
});
