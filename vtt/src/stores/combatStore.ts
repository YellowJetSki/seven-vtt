/* ── Combat & Initiative Tracker Store ─────────────────────────
 * Manages:
 *  • Combat encounters (CRUD, flow)
 *  • Combatant management (add, remove, damage, heal, status)
 *  • Turn tracking (next/previous, round counter)
 *  • Per-turn timer (turnStartedAt — used by CombatantTurnTimer)
 *  • Combat log
 *  • Live session state (broadcast to players via Firebase)
 *  • Conditions/weather/lighting/terrain
 *
 * PERSISTENCE: This store uses Zustand persist middleware to
 * survive page refreshes. DM combat state is stored locally.
 *
 * HP SYNC: When player combatants take damage or are healed,
 * the store automatically syncs their HP back to the campaign
 * store's PlayerCharacter records so HP is consistent between
 * the PC sheet, DM view, and battle map tokens.
 * ─────────────────────────────────────────────────────────────── */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  CombatEncounter,
  Combatant,
  CombatLogEntry,
  StatusEffectInstance,
  StatusEffect,
  LiveSessionState,
  LiveConditions,
} from "@/types/combat";
import { getEnemyById } from "@/data/enemy-database";

// Lazy reference to campaign store — set at runtime after all modules are loaded.
// This avoids circular dependency issues during initialization.
let _syncPlayerHp: ((combatants: Combatant[]) => void) | null = null;

/**
 * Register the HP sync callback. Called once from App.tsx or a bootstrap
 * module after both stores are initialized.
 */
export function registerHpSyncCallback(fn: (combatants: Combatant[]) => void) {
  _syncPlayerHp = fn;
}

/* ── Helpers ────────────────────────────────────────────────── */

let _combatantIdCounter = 0;
let _logIdCounter = 0;

function uid(prefix: string) {
  return `${prefix}_${Date.now()}_${++_combatantIdCounter}`;
}

function logUid() {
  return `log_${Date.now()}_${++_logIdCounter}`;
}

const DEFAULT_LIVE_SESSION: LiveSessionState = {
  activeEncounterId: null,
  phase: "downtime",
  currentScene: undefined,
  currentMapUrl: undefined,
  dmAnnouncement: undefined,
  sessionStartedAt: null,
  lastShortRestAt: null,
  lastLongRestAt: null,
  conditions: {
    weather: "clear",
    lighting: "bright",
    terrain: "normal",
  },
};

/* ── Store Interface ────────────────────────────────────────── */

interface CombatStoreState {
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

  /* ── Undo Support ── */
  /** Pop the last combat log entry and revert the HP change. */
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

/* ── Store Definition ───────────────────────────────────────── */

export const useCombatStore = create<CombatStoreState>()(
  persist(
    (set, get) => ({
      activeEncounter: null,
      combatLog: [],
      liveSession: { ...DEFAULT_LIVE_SESSION },

      /* ── Encounter CRUD ── */
      createEncounter: (name) => {
        const id = uid("encounter");
        const encounter: CombatEncounter = {
          id,
          name,
          combatants: [],
          round: 1,
          currentCombatantIndex: 0,
          turnStartedAt: null,
          phase: "prep",
          startedAt: null,
          completedAt: null,
          elapsedSeconds: 0,
          isPaused: false,
        };
        set({ activeEncounter: encounter, combatLog: [] });
        return id;
      },

      /* ── Create encounter with pre-populated combatants ── */
      createEncounterWithCombatants: (name, combatantData) => {
        const id = uid("encounter");
        const combatants: Combatant[] = combatantData.map((data) => ({
          ...data,
          id: uid("combatant"),
        }));
        const encounter: CombatEncounter = {
          id,
          name,
          combatants,
          round: 1,
          currentCombatantIndex: 0,
          turnStartedAt: null,
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

      addEnemyGroup: (name, count) => {
        const encounter = get().activeEncounter;
        if (!encounter) return;

        // Look up the enemy template — by ID or by name
        const template = getEnemyById(name) ?? getEnemyById(name.toLowerCase().replace(/\s+/g, "_"));
        const ac = template?.ac ?? 12;
        const hp = template?.hp ?? 15;

        const newCombatants: Combatant[] = Array.from({ length: count }, (_, i) => ({
          id: uid("enemy"),
          name: `${name} ${i + 1}`,
          type: "enemy" as const,
          initiative: 0,
          armorClass: ac,
          hitPoints: { current: hp, max: hp, temporary: 0 },
          statusEffects: [],
          isDead: false,
          isConcentrating: false,
          notes: "",
        }));

        set({
          activeEncounter: {
            ...encounter,
            combatants: [...encounter.combatants, ...newCombatants],
          },
        });
      },

      removeCombatant: (id) => {
        const encounter = get().activeEncounter;
        if (!encounter) return;
        set({
          activeEncounter: {
            ...encounter,
            combatants: encounter.combatants.filter((c) => c.id !== id),
          },
        });
      },

      setCombatantInitiative: (id, value) => {
        const encounter = get().activeEncounter;
        if (!encounter) return;
        set({
          activeEncounter: {
            ...encounter,
            combatants: encounter.combatants.map((c) =>
              c.id === id ? { ...c, initiative: value } : c,
            ),
          },
        });
      },

      damageCombatant: (id, amount, source) => {
        const encounter = get().activeEncounter;
        if (!encounter) return;

        const target = encounter.combatants.find((c) => c.id === id);
        if (!target) return;

        // Apply damage: temp HP first, then real HP
        let tempRemaining = target.hitPoints.temporary;
        let realDamage = amount;

        if (tempRemaining > 0) {
          const absorbed = Math.min(tempRemaining, amount);
          tempRemaining -= absorbed;
          realDamage = amount - absorbed;
        }

        const newHp = Math.max(0, target.hitPoints.current - realDamage);
        const isDead = newHp <= 0 && !target.isDead;

        const logEntry: CombatLogEntry = {
          id: logUid(),
          timestamp: Date.now(),
          type: isDead ? "death" : "damage",
          actorId: source ?? "DM",
          actorName: source ?? "DM",
          targetId: target.id,
          targetName: target.name,
          value: amount,
          description: `${target.name} takes ${amount} damage${isDead ? " — DEAD!" : ""} (${realDamage} to HP, ${amount - realDamage} to temp)`,
        };

        const updatedCombatants = encounter.combatants.map((c) => {
          if (c.id !== id) return c;
          return {
            ...c,
            hitPoints: {
              ...c.hitPoints,
              current: newHp,
              temporary: Math.max(0, tempRemaining),
            },
            isDead,
          };
        });

        set({
          activeEncounter: { ...encounter, combatants: updatedCombatants },
          combatLog: [logEntry, ...get().combatLog],
        });

        // Sync PC HP back to campaign store via registered callback
        if (_syncPlayerHp) _syncPlayerHp(updatedCombatants);
      },

      healCombatant: (id, amount, source) => {
        const encounter = get().activeEncounter;
        if (!encounter) return;

        const target = encounter.combatants.find((c) => c.id === id);
        if (!target) return;

        const newHp = Math.min(target.hitPoints.max, target.hitPoints.current + amount);

        const logEntry: CombatLogEntry = {
          id: logUid(),
          timestamp: Date.now(),
          type: "heal",
          actorId: source ?? "DM",
          actorName: source ?? "DM",
          targetId: target.id,
          targetName: target.name,
          value: amount,
          description: `${target.name} healed for ${amount} HP (${target.hitPoints.current} → ${newHp})`,
        };

        const updatedCombatants = encounter.combatants.map((c) =>
          c.id === id
            ? { ...c, hitPoints: { ...c.hitPoints, current: newHp }, isDead: false }
            : c,
        );

        set({
          activeEncounter: {
            ...encounter,
            combatants: updatedCombatants,
          },
          combatLog: [logEntry, ...get().combatLog],
        });

        // Sync PC HP back to campaign store via registered callback
        if (_syncPlayerHp) _syncPlayerHp(updatedCombatants);
      },

      setTempHp: (id, amount) => {
        const encounter = get().activeEncounter;
        if (!encounter) return;
        const updatedCombatants = encounter.combatants.map((c) =>
          c.id === id
            ? { ...c, hitPoints: { ...c.hitPoints, temporary: amount } }
            : c,
        );
        set({
          activeEncounter: {
            ...encounter,
            combatants: updatedCombatants,
          },
        });
        if (_syncPlayerHp) _syncPlayerHp(updatedCombatants);
      },

      toggleStatus: (id, effect) => {
        const encounter = get().activeEncounter;
        if (!encounter) return;

        const updatedCombatants = encounter.combatants.map((c) => {
          if (c.id !== id) return c;
          const exists = c.statusEffects.some((s) => s.effect === effect);
          if (exists) {
            return { ...c, statusEffects: c.statusEffects.filter((s) => s.effect !== effect) };
          }
          const newEffect: StatusEffectInstance = {
            id: uid("status"),
            effect,
          };
          return { ...c, statusEffects: [...c.statusEffects, newEffect] };
        });

        set({ activeEncounter: { ...encounter, combatants: updatedCombatants } });
      },

      toggleConcentration: (id) => {
        const encounter = get().activeEncounter;
        if (!encounter) return;
        set({
          activeEncounter: {
            ...encounter,
            combatants: encounter.combatants.map((c) =>
              c.id === id ? { ...c, isConcentrating: !c.isConcentrating } : c,
            ),
          },
        });
      },

      toggleDead: (id) => {
        const encounter = get().activeEncounter;
        if (!encounter) return;
        const updatedCombatants = encounter.combatants.map((c) =>
          c.id === id ? { ...c, isDead: !c.isDead } : c,
        );
        set({
          activeEncounter: {
            ...encounter,
            combatants: updatedCombatants,
          },
        });
        if (_syncPlayerHp) _syncPlayerHp(updatedCombatants);
      },

      /* ── Undo Last Action ── */
      undoLastAction: () => {
        const { combatLog, activeEncounter } = get();
        if (combatLog.length === 0 || !activeEncounter) return;

        // Find the first log entry that's a damage/heal/death and has a target
        const lastEntry = combatLog[0];
        if (!lastEntry || !lastEntry.targetId) return;

        // Revert: heal reverses damage, damage reverses heal, death reverses death
        const target = activeEncounter.combatants.find((c) => c.id === lastEntry.targetId);
        if (!target) return;

        let revertedCombatants = [...activeEncounter.combatants];

        if (lastEntry.type === "damage" || lastEntry.type === "death") {
          // Heal back the damage
          revertedCombatants = revertedCombatants.map((c) => {
            if (c.id !== lastEntry.targetId) return c;
            const healed = Math.min(c.hitPoints.max, c.hitPoints.current + (lastEntry.value ?? 0));
            return {
              ...c,
              hitPoints: { ...c.hitPoints, current: healed },
              // If this damage caused death, un-dead
              isDead: healed > 0 ? false : c.isDead,
            };
          });
        } else if (lastEntry.type === "heal") {
          // Re-damage the heal
          revertedCombatants = revertedCombatants.map((c) => {
            if (c.id !== lastEntry.targetId) return c;
            const damaged = Math.max(0, c.hitPoints.current - (lastEntry.value ?? 0));
            return {
              ...c,
              hitPoints: { ...c.hitPoints, current: damaged },
            };
          });
        }

        set({
          activeEncounter: { ...activeEncounter, combatants: revertedCombatants },
          combatLog: combatLog.slice(1),
        });

        if (_syncPlayerHp) _syncPlayerHp(revertedCombatants);
      },

      /* ── Combat Flow ── */
      startEncounter: () => {
        const encounter = get().activeEncounter;
        if (!encounter || encounter.phase !== "prep") return;

        const now = Date.now();
        const logEntry: CombatLogEntry = {
          id: logUid(),
          timestamp: now,
          type: "round_start",
          actorId: "system",
          actorName: "⚔️ Combat",
          description: "Combat begins!",
        };

        // Sort combatants by initiative descending
        const sorted = [...encounter.combatants].sort((a, b) => b.initiative - a.initiative);

        set({
          activeEncounter: {
            ...encounter,
            combatants: sorted,
            phase: "active",
            round: 1,
            currentCombatantIndex: 0,
            startedAt: now,
            turnStartedAt: now,
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
              round: newRound,
              currentCombatantIndex: 0,
              turnStartedAt: Date.now(),
            },
            combatLog: [logEntry, ...get().combatLog],
          });
        } else {
          set({
            activeEncounter: {
              ...encounter,
              currentCombatantIndex: nextIndex,
              turnStartedAt: Date.now(),
            },
          });
        }
      },

      previousTurn: () => {
        const encounter = get().activeEncounter;
        if (!encounter || encounter.phase !== "active") return;
        const prevIndex = Math.max(0, encounter.currentCombatantIndex - 1);
        set({
          activeEncounter: {
            ...encounter,
            currentCombatantIndex: prevIndex,
            turnStartedAt: Date.now(),
          },
        });
      },

      endEncounter: () => {
        const encounter = get().activeEncounter;
        if (!encounter || encounter.phase !== "active") return;
        set({
          activeEncounter: {
            ...encounter,
            phase: "completed",
            completedAt: Date.now(),
            turnStartedAt: null,
          },
        });
      },

      togglePause: () => {
        const encounter = get().activeEncounter;
        if (!encounter) return;
        set({
          activeEncounter: { ...encounter, isPaused: !encounter.isPaused },
        });
      },

      /* ── Combat Log ── */
      addNote: (note) => {
        const logEntry: CombatLogEntry = {
          id: logUid(),
          timestamp: Date.now(),
          type: "note",
          actorId: "DM",
          actorName: "DM Note",
          description: note,
        };
        set({ combatLog: [logEntry, ...get().combatLog] });
      },

      clearLog: () => {
        set({ combatLog: [] });
      },

      /* ── Live Session ── */
      startSession: () => {
        const now = Date.now();
        set({
          liveSession: {
            ...get().liveSession,
            sessionStartedAt: now,
            phase: "exploration",
          },
        });
      },

      endSession: () => {
        set({
          liveSession: { ...DEFAULT_LIVE_SESSION },
        });
      },

      setSessionPhase: (phase) => {
        set({
          liveSession: { ...get().liveSession, phase },
        });
      },

      setCurrentScene: (scene) => {
        set({
          liveSession: { ...get().liveSession, currentScene: scene },
        });
      },

      setCurrentMapUrl: (url) => {
        set({
          liveSession: { ...get().liveSession, currentMapUrl: url },
        });
      },

      setDmAnnouncement: (msg) => {
        set({
          liveSession: { ...get().liveSession, dmAnnouncement: msg },
        });
      },

      setConditions: (conditions) => {
        set({
          liveSession: {
            ...get().liveSession,
            conditions: { ...get().liveSession.conditions, ...conditions },
          },
        });
      },

      recordRest: (type) => {
        const now = Date.now();
        set((state) => ({
          liveSession: {
            ...state.liveSession,
            phase: "rest",
            ...(type === "short" ? { lastShortRestAt: now } : { lastLongRestAt: now }),
          },
        }));
      },
    }),
    {
      name: "str-vtt-combat",
      partialize: (state) => ({
        activeEncounter: state.activeEncounter,
        combatLog: state.combatLog,
        liveSession: state.liveSession,
      }),
    },
  ),
);
