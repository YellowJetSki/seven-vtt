/* ── Combat History (Undo/Redo) ────────────────────────────────
 * A lightweight command-pattern history tracker for combat actions.
 * Stores snapshots of the active encounter and combat log state.
 * Integrates into the InitiativeTracker via the combatStore.
 *
 * ── How It Works ─────────────────────────────────────────────
 * Before any state mutation, push a snapshot via addSnapshot().
 * Then undo() restores the previous snapshot.
 *
 * ── Maximum Snapshots ────────────────────────────────────────
 * Keeps the last 50 snapshots to stay memory-efficient.
 * ─────────────────────────────────────────────────────────────── */

import { useRef, useCallback } from "react";
import { useCombatStore } from "@/stores/combatStore";
import type { CombatEncounter, CombatLogEntry } from "@/types/combat";

interface HistorySnapshot {
  encounter: CombatEncounter | null;
  log: CombatLogEntry[];
}

const MAX_HISTORY = 50;

/**
 * Hook that provides undo/redo capabilities for combat state.
 * Call `addSnapshot()` before any combat mutation to push the
 * current state onto the undo stack.
 */
export function useCombatHistory() {
  const undoStack = useRef<HistorySnapshot[]>([]);
  const redoStack = useRef<HistorySnapshot[]>([]);

  const takeSnapshot = useCallback((): HistorySnapshot => {
    const state = useCombatStore.getState();
    return {
      encounter: state.activeEncounter
        ? JSON.parse(JSON.stringify(state.activeEncounter))
        : null,
      log: JSON.parse(JSON.stringify(state.combatLog)),
    };
  }, []);

  const addSnapshot = useCallback(() => {
    const snapshot = takeSnapshot();
    undoStack.current.push(snapshot);
    // Keep within limit
    if (undoStack.current.length > MAX_HISTORY) {
      undoStack.current.shift();
    }
    // Clear redo stack on new action
    redoStack.current = [];
  }, [takeSnapshot]);

  const canUndo = undoStack.current.length > 0;
  const canRedo = redoStack.current.length > 0;

  const undo = useCallback(() => {
    if (undoStack.current.length === 0) return false;
    const current = takeSnapshot();
    redoStack.current.push(current);
    const previous = undoStack.current.pop()!;
    useCombatStore.setState({
      activeEncounter: previous.encounter,
      combatLog: previous.log,
    });
    return true;
  }, [takeSnapshot]);

  const redo = useCallback(() => {
    if (redoStack.current.length === 0) return false;
    const current = takeSnapshot();
    undoStack.current.push(current);
    const next = redoStack.current.pop()!;
    useCombatStore.setState({
      activeEncounter: next.encounter,
      combatLog: next.log,
    });
    return true;
  }, [takeSnapshot]);

  /**
   * Clears all history. Call when starting a new encounter.
   */
  const clearHistory = useCallback(() => {
    undoStack.current = [];
    redoStack.current = [];
  }, []);

  return { addSnapshot, undo, redo, canUndo, canRedo, clearHistory };
}

/**
 * Wrapper for combat actions that automatically records history.
 * Use this in place of direct store calls to enable undo/redo.
 *
 * Example:
 *   withHistory(combatStore.damageCombatant, ["pc_1", 5, "Goblin"]);
 */
export function withHistory(
  actionFn: (...args: unknown[]) => void,
  args: unknown[],
  addSnapshot: () => void,
): void {
  addSnapshot();
  actionFn(...args);
}
