/* ── Combat & Initiative Tracker Store ───────────────────────── */

import { create } from "zustand";
import type {
  CombatEncounter,
  Combatant,
  CombatLogEntry,
  StatusEffectInstance,
  StatusEffect,
  LiveSessionState,
} from "@/types/combat";

/* ── Helpers ────────────────────────────────────────────────── */

let _combatantIdCounter = 0;
let _logIdCounter = 0;

function uid(prefix: string) {
  return `${prefix}_${Date.now()}_${++_combatantIdCounter}`;
}

function logUid() {
  return `log_${Date.now()}_${++_logIdCounter}`;
}

/* ── Interface ──────────────────────────────────────────────── */

interface CombatStore {
  /* ── Active Encounter ── */
  activeEncounter: CombatEncounter | null;
  combatLog: CombatLogEntry[];

  /* ── Live Session ── */
  liveSession: LiveSessionState;

  /* ── Encounter CRUD ── */
  createEncounter: (name: string) => string;
  setActiveEncounter: (encounterId: string | null) => void;

  /* ── Combatant Management ── */
  addCombatant: (combatant: Omit<Combatant, "id">) => string;
  removeCombatant: (combatantId: string) => void;
  updateCombatant: (combatantId: string, updates: Partial<Combatant>) => void;
  reorderCombatants: (combatantIds: string[]) => void;
  clearCombatants: () => void;

  /* ── Combat Flow ── */
  startEncounter: () => void;
  nextTurn: () => void;
  previousTurn: () => void;
  endEncounter: () => void;
  togglePause: () => void;

  /* ── HP & Status ── */
  damageCombatant: (combatantId: string, amount: number, source?: string) => void;
  healCombatant: (combatantId: string, amount: number, source?: string) => void;
  setTempHp: (combatantId: string, amount: number) => void;
  toggleStatus: (combatantId: string, effect: StatusEffect, source?: string) => void;
  toggleConcentration: (combatantId: string, spellName?: string) => void;
  toggleDead: (combatantId: string) => void;
  addNote: (combatantId: string, note: string) => void;

  /* ── Logging ── */
  clearLog: () => void;

  /* ── Live Session ── */
  setSessionPhase: (phase: LiveSessionState["phase"]) => void;
  setCurrentScene: (scene?: string) => void;
  setCurrentMapUrl: (url?: string) => void;
  setDmAnnouncement: (text?: string) => void;
  startSession: () => void;
  recordRest: (type: "short" | "long") => void;
  endSession: () => void;

  /* ── Orchestration ── */
  resetCombat: () => void;
}

export const useCombatStore = create<CombatStore>()((set, get) => ({
  /* ── Defaults ── */
  activeEncounter: null,
  combatLog: [],
  liveSession: {
    activeEncounterId: null,
    phase: "downtime",
    currentScene: undefined,
    currentMapUrl: undefined,
    dmAnnouncement: undefined,
    sessionStartedAt: null,
    lastShortRestAt: null,
    lastLongRestAt: null,
  },

  /* ── Encounter CRUD ── */
  createEncounter: (name) => {
    const id = uid("encounter");
    const encounter: CombatEncounter = {
      id,
      name,
      combatants: [],
      round: 1,
      currentCombatantIndex: 0,
      phase: "prep",
      startedAt: null,
      completedAt: null,
      elapsedSeconds: 0,
      isPaused: false,
    };
    set({ activeEncounter: encounter, combatLog: [] });
    return id;
  },

  setActiveEncounter: (encounterId) => {
    // For now, encounters are single-instance; clearing resets
    if (encounterId === null) {
      set({ activeEncounter: null, combatLog: [] });
    }
  },

  /* ── Combatant Management ── */
  addCombatant: (data) => {
    const id = uid("combatant");
    const combatant: Combatant = { ...data, id };
    const encounter = get().activeEncounter;
    if (!encounter) return id;

    const updated = {
      ...encounter,
      combatants: [...encounter.combatants, combatant],
    };
    set({ activeEncounter: updated });
    return id;
  },

  removeCombatant: (combatantId) => {
    const encounter = get().activeEncounter;
    if (!encounter) return;
    set({
      activeEncounter: {
        ...encounter,
        combatants: encounter.combatants.filter((c) => c.id !== combatantId),
      },
    });
  },

  updateCombatant: (combatantId, updates) => {
    const encounter = get().activeEncounter;
    if (!encounter) return;
    set({
      activeEncounter: {
        ...encounter,
        combatants: encounter.combatants.map((c) =>
          c.id === combatantId ? { ...c, ...updates } : c,
        ),
      },
    });
  },

  reorderCombatants: (combatantIds) => {
    const encounter = get().activeEncounter;
    if (!encounter) return;
    const map = new Map(encounter.combatants.map((c) => [c.id, c]));
    const reordered = combatantIds.map((id) => map.get(id)).filter(Boolean) as Combatant[];
    set({
      activeEncounter: { ...encounter, combatants: reordered },
    });
  },

  clearCombatants: () => {
    const encounter = get().activeEncounter;
    if (!encounter) return;
    set({
      activeEncounter: { ...encounter, combatants: [] },
      combatLog: [],
    });
  },

  /* ── Combat Flow ── */
  startEncounter: () => {
    const encounter = get().activeEncounter;
    if (!encounter || encounter.combatants.length === 0) return;

    // Sort by initiative descending, then by initiative bonus descending
    const sorted = [...encounter.combatants].sort((a, b) => {
      const initDiff = b.initiative - a.initiative;
      if (initDiff !== 0) return initDiff;
      return b.initiativeBonus - a.initiativeBonus;
    });

    const logEntry: CombatLogEntry = {
      id: logUid(),
      timestamp: Date.now(),
      type: "round_start",
      actorId: "system",
      actorName: "⚔ Combat",
      description: `Combat begins! Round 1`,
    };

    set({
      activeEncounter: {
        ...encounter,
        combatants: sorted,
        phase: "active",
        round: 1,
        currentCombatantIndex: 0,
        startedAt: Date.now(),
        isPaused: false,
      },
      combatLog: [logEntry, ...get().combatLog],
    });
  },

  nextTurn: () => {
    const encounter = get().activeEncounter;
    if (!encounter || encounter.phase !== "active") return;

    const { currentCombatantIndex, combatants, round } = encounter;
    const nextIndex = currentCombatantIndex + 1;

    if (nextIndex >= combatants.length) {
      // New round
      const newRound = round + 1;
      // Decrement status effect durations
      const updatedCombatants = combatants.map((c) => ({
        ...c,
        statusEffects: c.statusEffects
          .map((s) =>
            s.remainingRounds !== undefined
              ? { ...s, remainingRounds: s.remainingRounds - 1 }
              : s,
          )
          .filter((s) => s.remainingRounds === undefined || s.remainingRounds > 0),
      }));

      const logEntry: CombatLogEntry = {
        id: logUid(),
        timestamp: Date.now(),
        type: "round_start",
        actorId: "system",
        actorName: "⏱ Round",
        description: `Round ${newRound}`,
      };

      set({
        activeEncounter: {
          ...encounter,
          combatants: updatedCombatants,
          round: newRound,
          currentCombatantIndex: 0,
        },
        combatLog: [logEntry, ...get().combatLog],
      });
    } else {
      set({
        activeEncounter: {
          ...encounter,
          currentCombatantIndex: nextIndex,
        },
      });
    }
  },

  previousTurn: () => {
    const encounter = get().activeEncounter;
    if (!encounter || encounter.phase !== "active") return;
    const prevIndex = Math.max(0, encounter.currentCombatantIndex - 1);
    set({
      activeEncounter: { ...encounter, currentCombatantIndex: prevIndex },
    });
  },

  endEncounter: () => {
    const encounter = get().activeEncounter;
    if (!encounter) return;
    const logEntry: CombatLogEntry = {
      id: logUid(),
      timestamp: Date.now(),
      type: "note",
      actorId: "system",
      actorName: "⚔ Combat",
      description: `Combat ended after ${encounter.round} round(s).`,
    };
    set({
      activeEncounter: {
        ...encounter,
        phase: "completed",
        completedAt: Date.now(),
        isPaused: false,
      },
      combatLog: [logEntry, ...get().combatLog],
    });
  },

  togglePause: () => {
    const encounter = get().activeEncounter;
    if (!encounter) return;
    set({
      activeEncounter: { ...encounter, isPaused: !encounter.isPaused },
    });
  },

  /* ── HP & Status ── */
  damageCombatant: (combatantId, amount, source) => {
    const encounter = get().activeEncounter;
    if (!encounter) return;
    const target = encounter.combatants.find((c) => c.id === combatantId);
    if (!target) return;

    let newHp = target.hitPoints.current;
    // Apply temp HP first
    let tempLeft = target.hitPoints.temporary;
    const tempAbsorbed = Math.min(tempLeft, amount);
    tempLeft -= tempAbsorbed;
    const remainingDamage = amount - tempAbsorbed;
    newHp -= remainingDamage;

    const updatedCombatants = encounter.combatants.map((c) => {
      if (c.id !== combatantId) return c;
      return {
        ...c,
        hitPoints: {
          current: Math.max(0, newHp),
          max: c.hitPoints.max,
          temporary: Math.max(0, tempLeft),
        },
        isDead: newHp <= 0,
      };
    });

    const died = newHp <= 0 && target.hitPoints.current > 0;
    const logEntry: CombatLogEntry = {
      id: logUid(),
      timestamp: Date.now(),
      type: died ? "death" : "damage",
      actorId: source ?? "unknown",
      actorName: source ?? "Unknown",
      targetId: target.id,
      targetName: target.name,
      value: amount,
      description: died
        ? `${target.name} took ${amount} damage and has fallen!`
        : `${target.name} took ${amount} damage (${Math.max(0, newHp)} HP remaining)`,
    };

    set({
      activeEncounter: { ...encounter, combatants: updatedCombatants },
      combatLog: [logEntry, ...get().combatLog],
    });
  },

  healCombatant: (combatantId, amount, source) => {
    const encounter = get().activeEncounter;
    if (!encounter) return;
    const updatedCombatants = encounter.combatants.map((c) => {
      if (c.id !== combatantId) return c;
      const newCurrent = Math.min(c.hitPoints.max, c.hitPoints.current + amount);
      return {
        ...c,
        hitPoints: { ...c.hitPoints, current: newCurrent },
        isDead: false,
      };
    });

    const target = encounter.combatants.find((c) => c.id === combatantId);
    const logEntry: CombatLogEntry = {
      id: logUid(),
      timestamp: Date.now(),
      type: "heal",
      actorId: source ?? "unknown",
      actorName: source ?? "Unknown",
      targetId: target?.id,
      targetName: target?.name,
      value: amount,
      description: `${target?.name} healed for ${amount} HP.`,
    };

    set({
      activeEncounter: { ...encounter, combatants: updatedCombatants },
      combatLog: [logEntry, ...get().combatLog],
    });
  },

  setTempHp: (combatantId, amount) => {
    const encounter = get().activeEncounter;
    if (!encounter) return;
    const updatedCombatants = encounter.combatants.map((c) => {
      if (c.id !== combatantId) return c;
      return {
        ...c,
        hitPoints: { ...c.hitPoints, temporary: amount },
      };
    });
    set({ activeEncounter: { ...encounter, combatants: updatedCombatants } });
  },

  toggleStatus: (combatantId, effect, source) => {
    const encounter = get().activeEncounter;
    if (!encounter) return;
    const updatedCombatants = encounter.combatants.map((c) => {
      if (c.id !== combatantId) return c;
      const existing = c.statusEffects.find((s) => s.effect === effect);
      let newStatuses: StatusEffectInstance[];
      if (existing) {
        newStatuses = c.statusEffects.filter((s) => s.effect !== effect);
      } else {
        newStatuses = [
          ...c.statusEffects,
          { id: uid("status"), effect, source, remainingRounds: undefined },
        ];
      }
      return { ...c, statusEffects: newStatuses };
    });

    const target = encounter.combatants.find((c) => c.id === combatantId);
    const isAdding = !target?.statusEffects.find((s) => s.effect === effect);
    const logEntry: CombatLogEntry = {
      id: logUid(),
      timestamp: Date.now(),
      type: "status",
      actorId: "system",
      actorName: "⚔ Combat",
      targetId: target?.id,
      targetName: target?.name,
      description: isAdding
        ? `${target?.name} is now ${effect}.`
        : `${target?.name} is no longer ${effect}.`,
    };

    set({
      activeEncounter: { ...encounter, combatants: updatedCombatants },
      combatLog: [logEntry, ...get().combatLog],
    });
  },

  toggleConcentration: (combatantId, spellName) => {
    const encounter = get().activeEncounter;
    if (!encounter) return;
    const updatedCombatants = encounter.combatants.map((c) => {
      if (c.id !== combatantId) return c;
      return {
        ...c,
        isConcentrating: !c.isConcentrating,
        concentrationOn: c.isConcentrating ? undefined : spellName,
      };
    });
    set({ activeEncounter: { ...encounter, combatants: updatedCombatants } });
  },

  toggleDead: (combatantId) => {
    const encounter = get().activeEncounter;
    if (!encounter) return;
    const updatedCombatants = encounter.combatants.map((c) => {
      if (c.id !== combatantId) return c;
      const newDead = !c.isDead;
      return {
        ...c,
        isDead: newDead,
        hitPoints: newDead ? { ...c.hitPoints, current: 0 } : { ...c.hitPoints, current: 1 },
      };
    });
    set({ activeEncounter: { ...encounter, combatants: updatedCombatants } });
  },

  addNote: (combatantId, note) => {
    const encounter = get().activeEncounter;
    if (!encounter) return;
    const updatedCombatants = encounter.combatants.map((c) => {
      if (c.id !== combatantId) return c;
      return { ...c, notes: c.notes ? `${c.notes}\n${note}` : note };
    });
    set({ activeEncounter: { ...encounter, combatants: updatedCombatants } });
  },

  /* ── Logging ── */
  clearLog: () => set({ combatLog: [] }),

  /* ── Live Session ── */
  setSessionPhase: (phase) => {
    set({ liveSession: { ...get().liveSession, phase } });
  },
  setCurrentScene: (scene) => {
    set({ liveSession: { ...get().liveSession, currentScene: scene } });
  },
  setCurrentMapUrl: (url) => {
    set({ liveSession: { ...get().liveSession, currentMapUrl: url } });
  },
  setDmAnnouncement: (text) => {
    set({ liveSession: { ...get().liveSession, dmAnnouncement: text } });
  },
  startSession: () => {
    set({
      liveSession: {
        ...get().liveSession,
        sessionStartedAt: Date.now(),
        phase: "exploration",
      },
    });
  },
  recordRest: (type) => {
    const now = Date.now();
    if (type === "short") {
      set({ liveSession: { ...get().liveSession, lastShortRestAt: now, phase: "rest" } });
    } else {
      set({ liveSession: { ...get().liveSession, lastLongRestAt: now, phase: "rest" } });
    }
  },
  endSession: () => {
    set({
      liveSession: {
        activeEncounterId: null,
        phase: "downtime",
        currentScene: undefined,
        currentMapUrl: undefined,
        dmAnnouncement: undefined,
        sessionStartedAt: null,
        lastShortRestAt: null,
        lastLongRestAt: null,
      },
    });
  },

  /* ── Reset ── */
  resetCombat: () => {
    set({ activeEncounter: null, combatLog: [] });
  },
}));
