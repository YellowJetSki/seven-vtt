/* ── Combat Store Types ────────────────────────────────────────
 * Shared types for combat store slices.
 * ─────────────────────────────────────────────────────────────── */

import type {
  CombatEncounter,
  Combatant,
  CombatLogEntry,
  StatusEffect,
  LiveSessionState,
  LiveConditions,
} from "@/types/combat";

export interface CombatStoreState {
  activeEncounter: CombatEncounter | null;
  combatLog: CombatLogEntry[];
  liveSession: LiveSessionState;

  /* ── Encounter CRUD ── */
  createEncounter: (name: string) => string;
  createEncounterWithCombatants: (name: string, combatants: Omit<Combatant, "id">[]) => string;
  setActiveEncounter: (encounterId: string | null) => void;

  /* ── Combatant Management ── */
  addCombatant: (data: Omit<Combatant, "id">) => string;
  addEnemyGroup: (name: string, count: number) => void;
  removeCombatant: (id: string) => void;
  setCombatantInitiative: (id: string, value: number) => void;
  damageCombatant: (id: string, amount: number, source?: string) => void;
  healCombatant: (id: string, amount: number, source?: string) => void;
  setTempHp: (id: string, amount: number) => void;
  toggleStatus: (id: string, effect: StatusEffect) => void;
  toggleConcentration: (id: string) => void;
  toggleDead: (id: string) => void;

  /* ── Combat Flow ── */
  startEncounter: () => void;
  nextTurn: () => void;
  previousTurn: () => void;
  endEncounter: () => void;
  togglePause: () => void;

  /* ── Combat Log ── */
  addNote: (note: string) => void;
  clearLog: () => void;
  undoLastAction: () => void;

  /* ── Live Session ── */
  startSession: () => void;
  endSession: () => void;
  setSessionPhase: (phase: LiveSessionState["phase"]) => void;
  setCurrentScene: (scene: string) => void;
  setCurrentMapUrl: (url: string) => void;
  setDmAnnouncement: (msg: string) => void;
  setConditions: (conditions: Partial<LiveConditions>) => void;
  recordRest: (type: "short" | "long") => void;
}

/* ── Shared UID helpers ── */

let _combatantIdCounter = 0;
let _logIdCounter = 0;

export function uid(prefix: string): string {
  return `${prefix}_${Date.now()}_${++_combatantIdCounter}`;
}

export function logUid(): string {
  return `log_${Date.now()}_${++_logIdCounter}`;
}
