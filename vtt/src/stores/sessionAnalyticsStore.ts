/* ── Session Analytics Store ───────────────────────────────────
 * Tracks session metrics: combat rounds, damage dealt/taken,
 * time spent per phase, and encounter history.
 *
 * ── Purpose ──────────────────────────────────────────────────
 * Provides a dashboard panel showing DM session statistics for
 * review after and during sessions.
 *
 * ── Integration ──────────────────────────────────────────────
 * This store is populated by hooking into combat store actions
 * (nextTurn, applyDamage, startSession, endSession). It is not
 * persisted to Firebase — analytics are local-only.
 * ─────────────────────────────────────────────────────────────── */

import { create } from "zustand";

/* ── Types ──────────────────────────────────────────────────── */

export interface PhaseTimer {
  phase: string;
  totalMs: number;
  startedAt: number | null;
}

export interface EncounterLog {
  id: string;
  encounterName: string;
  startedAt: number;
  endedAt: number | null;
  totalRounds: number;
  partyDamageDealt: number;
  partyDamageTaken: number;
  enemyDamageDealt: number;
  enemyDamageTaken: number;
  combatantCount: number;
  result: "victory" | "defeat" | "retreat" | "ongoing";
}

export interface SessionAnalytics {
  sessionId: string;
  sessionDate: number;
  startedAt: number;
  endedAt: number | null;
  totalDurationMs: number;
  phaseTimers: PhaseTimer[];
  encounterLogs: EncounterLog[];
  totalCombats: number;
  totalRounds: number;
  totalPartyDamageDealt: number;
  totalPartyDamageTaken: number;
  totalEnemyDamageDealt: number;
  totalEnemyDamageTaken: number;
  peakCombatants: number;
  noteCount: number;
}

/* ── Store ──────────────────────────────────────────────────── */

interface SessionAnalyticsState {
  /** Current session analytics (reset on new session) */
  currentSession: SessionAnalytics | null;
  /** Historical session list */
  sessionHistory: SessionAnalytics[];
  /** Active encounter log (while encounter is running) */
  currentEncounter: EncounterLog | null;

  // Actions
  startSession: (sessionId: string) => void;
  endSession: () => void;
  startEncounter: (encounterId: string, encounterName: string, combatantCount: number) => void;
  endEncounter: (result: EncounterLog["result"]) => void;
  recordDamage: (isPlayer: boolean, amount: number) => void;
  advanceRound: () => void;
  setPhase: (phase: string) => void;
  incrementNoteCount: () => void;
  clearHistory: () => void;
}

let _sessionIdCounter = 0;
function uid(): string {
  return `session_${Date.now()}_${++_sessionIdCounter}`;
}

export const useSessionAnalyticsStore = create<SessionAnalyticsState>((set, get) => ({
  currentSession: null,
  sessionHistory: [],
  currentEncounter: null,

  startSession: (sessionId: string) => {
    const now = Date.now();
    const newSession: SessionAnalytics = {
      sessionId: sessionId || uid(),
      sessionDate: now,
      startedAt: now,
      endedAt: null,
      totalDurationMs: 0,
      phaseTimers: [
        { phase: "exploration", totalMs: 0, startedAt: now },
        { phase: "combat", totalMs: 0, startedAt: null },
        { phase: "rest", totalMs: 0, startedAt: null },
        { phase: "downtime", totalMs: 0, startedAt: null },
      ],
      encounterLogs: [],
      totalCombats: 0,
      totalRounds: 0,
      totalPartyDamageDealt: 0,
      totalPartyDamageTaken: 0,
      totalEnemyDamageDealt: 0,
      totalEnemyDamageTaken: 0,
      peakCombatants: 0,
      noteCount: 0,
    };
    set({ currentSession: newSession });
  },

  endSession: () => {
    const { currentSession, currentEncounter } = get();
    if (!currentSession) return;

    const now = Date.now();

    // Finalize any active phase timer
    const updatedPhases = currentSession.phaseTimers.map((pt) => {
      if (pt.startedAt !== null) {
        return { ...pt, totalMs: pt.totalMs + (now - pt.startedAt), startedAt: now };
      }
      return pt;
    });

    // Finalize active encounter
    let finalEncounter = currentEncounter;
    if (finalEncounter && !finalEncounter.endedAt) {
      finalEncounter = { ...finalEncounter, endedAt: now, result: "ongoing" };
    }

    const finalizedSession: SessionAnalytics = {
      ...currentSession,
      endedAt: now,
      totalDurationMs: now - currentSession.startedAt,
      phaseTimers: updatedPhases,
      encounterLogs: finalEncounter
        ? [...currentSession.encounterLogs, finalEncounter]
        : currentSession.encounterLogs,
    };

    set((state) => ({
      currentSession: null,
      currentEncounter: null,
      sessionHistory: [...state.sessionHistory, finalizedSession],
    }));
  },

  startEncounter: (encounterId: string, encounterName: string, combatantCount: number) => {
    const { currentSession } = get();
    if (!currentSession) return;

    const newEncounter: EncounterLog = {
      id: encounterId || uid(),
      encounterName,
      startedAt: Date.now(),
      endedAt: null,
      totalRounds: 0,
      partyDamageDealt: 0,
      partyDamageTaken: 0,
      enemyDamageDealt: 0,
      enemyDamageTaken: 0,
      combatantCount,
      result: "ongoing",
    };

    set((state) => ({
      currentEncounter: newEncounter,
      currentSession: state.currentSession
        ? {
            ...state.currentSession,
            peakCombatants: Math.max(state.currentSession.peakCombatants, combatantCount),
          }
        : null,
    }));
  },

  endEncounter: (result: EncounterLog["result"]) => {
    const { currentEncounter, currentSession } = get();
    if (!currentEncounter || !currentSession) return;

    const finalizedEncounter: EncounterLog = {
      ...currentEncounter,
      endedAt: Date.now(),
      result,
    };

    set({
      currentEncounter: null,
      currentSession: {
        ...currentSession,
        encounterLogs: [...currentSession.encounterLogs, finalizedEncounter],
        totalCombats: currentSession.totalCombats + 1,
        totalRounds: currentSession.totalRounds + finalizedEncounter.totalRounds,
      },
    });
  },

  recordDamage: (isPlayer: boolean, amount: number) => {
    const { currentSession, currentEncounter } = get();
    if (!currentSession) return;

    if (currentEncounter) {
      if (isPlayer) {
        // Player dealt damage to enemy
        set({
          currentEncounter: {
            ...currentEncounter,
            partyDamageDealt: currentEncounter.partyDamageDealt + amount,
          },
        });
      } else {
        // Enemy dealt damage to player
        set({
          currentEncounter: {
            ...currentEncounter,
            partyDamageTaken: currentEncounter.partyDamageTaken + amount,
          },
        });
      }
    }

    // Accumulate totals
    if (isPlayer) {
      set({
        currentSession: {
          ...currentSession,
          totalPartyDamageDealt: currentSession.totalPartyDamageDealt + amount,
        },
      });
    } else {
      set({
        currentSession: {
          ...currentSession,
          totalPartyDamageTaken: currentSession.totalPartyDamageTaken + amount,
        },
      });
    }
  },

  advanceRound: () => {
    const { currentEncounter } = get();
    if (!currentEncounter) return;
    set({
      currentEncounter: {
        ...currentEncounter,
        totalRounds: currentEncounter.totalRounds + 1,
      },
    });
  },

  setPhase: (phase: string) => {
    const { currentSession } = get();
    if (!currentSession) return;

    const now = Date.now();
    const updatedPhases = currentSession.phaseTimers.map((pt) => {
      if (pt.phase === phase) {
        // Start this phase
        return { ...pt, startedAt: pt.startedAt ?? now };
      }
      if (pt.startedAt !== null) {
        // Stop other phases and accumulate time
        return { ...pt, totalMs: pt.totalMs + (now - pt.startedAt), startedAt: null };
      }
      return pt;
    });

    set({
      currentSession: {
        ...currentSession,
        phaseTimers: updatedPhases,
      },
    });
  },

  incrementNoteCount: () => {
    const { currentSession } = get();
    if (!currentSession) return;
    set({
      currentSession: {
        ...currentSession,
        noteCount: currentSession.noteCount + 1,
      },
    });
  },

  clearHistory: () => {
    set({ sessionHistory: [] });
  },
}));
