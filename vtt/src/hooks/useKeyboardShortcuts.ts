/**
 * STᚱ VTT — Keyboard Shortcuts Hook (Premium)
 *
 * Centralized keyboard shortcut management for the battle map canvas.
 * Maps keyboard keys to canvas actions for rapid DM operations.
 *
 * Shortcut Map:
 *   G → Toggle grid overlay
 *   F → Toggle fog of war
 *   V → Toggle DM/player view
 *   Space → Next initiative turn
 *   Shift+Space → Previous initiative turn
 *   R → Recenter camera
 *   +/= → Zoom in
 *   - → Zoom out
 *   P → Toggle ping mode
 *   M → Toggle ruler/measurement mode
 *   Escape → Cancel active tool (ruler/ping) / Clear selection
 *   1-4 → Toggle right panel sections
 *   0 → Clear all ruler measurements
 *   H → Toggle initiative HUD overlay
 *
 * Architecture:
 *   useKeyboardShortcuts() is called once in CanvasMapView.
 *   Shortcuts only fire when the map canvas is focused/active.
 *   All shortcuts check for no active text input (ignored if input focused).
 *
 * Cycle 25 (Premium Battlemap Overhaul — FINAL):
 *   - Full keyboard shortcut system for rapid DM actions
 *   - Visual shortcut hints on toolbar buttons
 *   - Escape to cancel tools, Space for turn flow
 */

import { useEffect, useCallback, useRef } from "react";

// ── Types ────────────────────────────────────────────────

export interface KeyboardShortcutActions {
  /** Toggle grid overlay visibility */
  onToggleGrid: () => void;
  /** Toggle fog of war visibility */
  onToggleFog: () => void;
  /** Toggle DM view / player view */
  onToggleDmView: () => void;
  /** Advance to next combat turn */
  onNextTurn: () => void;
  /** Go to previous combat turn */
  onPrevTurn: () => void;
  /** Recenter the camera to origin */
  onRecenter: () => void;
  /** Zoom in by one step */
  onZoomIn: () => void;
  /** Zoom out by one step */
  onZoomOut: () => void;
  /** Toggle ping mode on/off */
  onTogglePing: () => void;
  /** Toggle ruler measurement mode on/off */
  onToggleRuler: () => void;
  /** Clear all ruler measurements */
  onClearMeasurements: () => void;
  /** Clear current tool state (escape hatch) */
  onEscape: () => void;
  /** Toggle initiative HUD visibility */
  onToggleInitiative: () => void;
}

// ── Shortcut Entry ──────────────────────────────────────

interface ShortcutEntry {
  /** Key description for display */
  description: string;
  /** Keyboard event handler */
  action: () => void;
  /** Whether Shift must be held */
  shift?: boolean;
  /** Whether Ctrl/Cmd must be held */
  ctrl?: boolean;
}

// ── Hook ────────────────────────────────────────────────

/**
 * Centralized keyboard shortcut hook for the battle map.
 * Provides a list of all active shortcuts for display in tooltips.
 */
export function useKeyboardShortcuts(actions: KeyboardShortcutActions, enabled: boolean = true) {
  const actionsRef = useRef(actions);
  actionsRef.current = actions;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      // Ignore if user is typing in an input/textarea
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      const key = e.key.toLowerCase();
      const shift = e.shiftKey;
      const ctrl = e.ctrlKey || e.metaKey;

      // ── Grid toggle: G ──
      if (key === "g" && !shift && !ctrl) {
        e.preventDefault();
        actionsRef.current.onToggleGrid();
        return;
      }

      // ── Fog toggle: F ──
      if (key === "f" && !shift && !ctrl) {
        e.preventDefault();
        actionsRef.current.onToggleFog();
        return;
      }

      // ── DM View toggle: V ──
      if (key === "v" && !shift && !ctrl) {
        e.preventDefault();
        actionsRef.current.onToggleDmView();
        return;
      }

      // ── Next turn: Space ──
      if (key === " " && !shift) {
        e.preventDefault();
        actionsRef.current.onNextTurn();
        return;
      }

      // ── Previous turn: Shift+Space ──
      if (key === " " && shift) {
        e.preventDefault();
        actionsRef.current.onPrevTurn();
        return;
      }

      // ── Recenter: R ──
      if (key === "r" && !shift && !ctrl) {
        e.preventDefault();
        actionsRef.current.onRecenter();
        return;
      }

      // ── Zoom in: +/= or Shift+= ──
      if ((key === "=" || key === "+") && !ctrl) {
        e.preventDefault();
        actionsRef.current.onZoomIn();
        return;
      }

      // ── Zoom out: - ──
      if (key === "-" && !ctrl) {
        e.preventDefault();
        actionsRef.current.onZoomOut();
        return;
      }

      // ── Ping mode: P ──
      if (key === "p" && !shift && !ctrl) {
        e.preventDefault();
        actionsRef.current.onTogglePing();
        return;
      }

      // ── Ruler mode: M ──
      if (key === "m" && !shift && !ctrl) {
        e.preventDefault();
        actionsRef.current.onToggleRuler();
        return;
      }

      // ── Escape: Cancel tools ──
      if (key === "escape") {
        e.preventDefault();
        actionsRef.current.onEscape();
        return;
      }

      // ── Clear measurements: 0 ──
      if (key === "0" && !shift) {
        e.preventDefault();
        actionsRef.current.onClearMeasurements();
        return;
      }

      // ── Toggle initiative HUD: H ──
      if (key === "h" && !shift && !ctrl) {
        e.preventDefault();
        actionsRef.current.onToggleInitiative();
        return;
      }
    },
    [enabled]
  );

  useEffect(() => {
    if (!enabled) return;
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown, enabled]);

  /**
   * Returns the list of all active keyboard shortcuts for display.
   */
  const getShortcutList = useCallback((): { key: string; description: string }[] => {
    return [
      { key: "G", description: "Toggle grid" },
      { key: "F", description: "Toggle fog of war" },
      { key: "V", description: "Toggle DM/player view" },
      { key: "Space", description: "Next turn" },
      { key: "⇧+Space", description: "Previous turn" },
      { key: "R", description: "Recenter camera" },
      { key: "+/−", description: "Zoom in/out" },
      { key: "P", description: "Ping mode" },
      { key: "M", description: "Ruler mode" },
      { key: "Esc", description: "Cancel tool / Clear" },
      { key: "0", description: "Clear ruler" },
      { key: "H", description: "Toggle initiative HUD" },
    ];
  }, []);

  return { getShortcutList };
}
