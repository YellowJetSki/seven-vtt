import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  CombatEncounter,
  Combatant,
  CombatantHP,
  CombatLogEntry,
  LiveSessionState,
  StatusEffect,
} from "@/types";

const STORAGE_KEY = "str-vtt-combat";

type CombatPhase = "prep" | "active" | "completed";

interface CombatState {
  activeEncounter: CombatEncounter | null;
  combatLog: CombatLogEntry[];
  liveSession: LiveSessionState;
}

interface CombatActions {
  createEncounter: (name: string) => string;
  createEncounterWithCombatants: (name: string, combatants: Combatant[]) => string;
  setEncounter: (encounter: CombatEncounter) => void;
  addCombatant: (combatant: Combatant) => void;
  updateCombatant: (combatantId: string, updates: Partial<Combatant>) => void;
  removeCombatant: (combatantId: string) => void;
  reorderCombatants: (combatantIds: string[]) => void;
  startCombat: () => void;
  nextTurn: () => void;
  prevTurn: () => void;
  endCombat: () => void;
  pauseCombat: () => void;
  resumeCombat: () => void;
  damageCombatant: (combatantId: string, amount: number) => void;
  healCombatant: (combatantId: string, amount: number) => void;
  setTempHP: (combatantId: string, amount: number) => void;
  addStatusEffect: (combatantId: string, effect: string) => void;
  removeStatusEffect: (combatantId: string, effectId: string) => void;
  toggleDead: (combatantId: string) => void;
  toggleConcentration: (combatantId: string) => void;
  setCombatantNotes: (combatantId: string, notes: string) => void;
  addLogEntry: (entry: CombatLogEntry) => void;
  undoLastAction: () => void;
  clearLog: () => void;
  setSession: (session: Partial<LiveSessionState>) => void;
  startSession: () => void;
  endSession: () => void;
  clearEncounter: () => void;
  clearAll: () => void;
}

const defaultConditions: LiveSessionState["conditions"] = {
  weather: "clear",
  lighting: "bright",
  terrain: "normal",
};

const defaultSession: LiveSessionState = {
  activeEncounterId: null,
  phase: "exploration",
  sessionStartedAt: null,
  lastShortRestAt: null,
  lastLongRestAt: null,
  conditions: { ...defaultConditions },
};

function generateId(): string {
  return `cbt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function clampHP(hp: CombatantHP, delta: number): CombatantHP {
  let { current, max, temporary } = hp;
  if (delta > 0) {
    if (temporary > 0) {
      const absorbed = Math.min(temporary, delta);
      temporary -= absorbed;
      delta -= absorbed;
    }
    current = Math.min(max, current + delta);
  } else {
    const damage = Math.abs(delta);
    if (temporary > 0) {
      const absorbed = Math.min(temporary, damage);
      temporary -= absorbed;
      current = damage > absorbed ? Math.max(0, current - (damage - absorbed)) : current;
    } else {
      current = Math.max(0, current - damage);
    }
  }
  return { current, max, temporary };
}

export const useCombatStore = create<CombatState & CombatActions>()(
  persist(
    (set, get) => ({
      activeEncounter: null,
      combatLog: [],
      liveSession: { ...defaultSession },

      createEncounter: (name: string): string => {
        const id = generateId();
        const encounter: CombatEncounter = {
          id,
          name,
          combatants: [],
          round: 0,
          currentCombatantIndex: 0,
          turnStartedAt: null,
          phase: "prep",
          startedAt: null,
          completedAt: null,
          elapsedSeconds: 0,
          isPaused: false,
        };
        set({ activeEncounter: encounter });
        return id;
      },

      createEncounterWithCombatants: (name: string, combatants: Combatant[]): string => {
        const id = generateId();
        const encounter: CombatEncounter = {
          id,
          name,
          combatants: combatants.sort((a, b) => b.initiative - a.initiative),
          round: 0,
          currentCombatantIndex: 0,
          turnStartedAt: null,
          phase: "prep",
          startedAt: null,
          completedAt: null,
          elapsedSeconds: 0,
          isPaused: false,
        };
        set({ activeEncounter: encounter });
        return id;
      },

      setEncounter: (encounter: CombatEncounter) => set({ activeEncounter: encounter }),

      addCombatant: (combatant: Combatant) =>
        set((state) => {
          if (!state.activeEncounter) return state;
          const combatants = [...state.activeEncounter.combatants, combatant].sort(
            (a, b) => b.initiative - a.initiative
          );
          return {
            activeEncounter: { ...state.activeEncounter, combatants },
          };
        }),

      updateCombatant: (combatantId: string, updates: Partial<Combatant>) =>
        set((state) => {
          if (!state.activeEncounter) return state;
          return {
            activeEncounter: {
              ...state.activeEncounter,
              combatants: state.activeEncounter.combatants.map((c) =>
                c.id === combatantId ? { ...c, ...updates } : c
              ),
            },
          };
        }),

      removeCombatant: (combatantId: string) =>
        set((state) => {
          if (!state.activeEncounter) return state;
          return {
            activeEncounter: {
              ...state.activeEncounter,
              combatants: state.activeEncounter.combatants.filter(
                (c) => c.id !== combatantId
              ),
            },
          };
        }),

      reorderCombatants: (combatantIds: string[]) =>
        set((state) => {
          if (!state.activeEncounter) return state;
          const combatantMap = new Map(
            state.activeEncounter.combatants.map((c) => [c.id, c])
          );
          const reordered = combatantIds
            .map((id) => combatantMap.get(id))
            .filter((c): c is Combatant => !!c);
          return {
            activeEncounter: { ...state.activeEncounter, combatants: reordered },
          };
        }),

      startCombat: () =>
        set((state) => {
          if (!state.activeEncounter) return state;
          const sorted = [...state.activeEncounter.combatants].sort(
            (a, b) => b.initiative - a.initiative
          );
          const logEntry: CombatLogEntry = {
            id: generateId(),
            timestamp: Date.now(),
            type: "round_start",
            actorId: "system",
            actorName: "⚔ Combat",
            description: "Combat begins!",
          };
          return {
            activeEncounter: {
              ...state.activeEncounter,
              combatants: sorted,
              round: 1,
              currentCombatantIndex: 0,
              phase: "active",
              startedAt: Date.now(),
              turnStartedAt: Date.now(),
              isPaused: false,
            },
            combatLog: [...state.combatLog, logEntry],
          };
        }),

      nextTurn: () =>
        set((state) => {
          if (!state.activeEncounter) return state;
          const { combatants, currentCombatantIndex } = state.activeEncounter;
          const nextIndex = (currentCombatantIndex + 1) % combatants.length;
          const newRound = nextIndex === 0 ? state.activeEncounter.round + 1 : state.activeEncounter.round;

          const entries: CombatLogEntry[] = [];
          if (nextIndex === 0) {
            entries.push({
              id: generateId(),
              timestamp: Date.now(),
              type: "round_start",
              actorId: "system",
              actorName: `📜 Round ${newRound}`,
              description: `Round ${newRound} begins!`,
            });
          }

          return {
            activeEncounter: {
              ...state.activeEncounter,
              round: newRound,
              currentCombatantIndex: nextIndex,
              turnStartedAt: Date.now(),
            },
            combatLog: [...state.combatLog, ...entries],
          };
        }),

      prevTurn: () =>
        set((state) => {
          if (!state.activeEncounter) return state;
          const { combatants, currentCombatantIndex } = state.activeEncounter;
          const prevIndex =
            currentCombatantIndex === 0
              ? combatants.length - 1
              : currentCombatantIndex - 1;
          return {
            activeEncounter: {
              ...state.activeEncounter,
              currentCombatantIndex: prevIndex,
              turnStartedAt: Date.now(),
            },
          };
        }),

      endCombat: () =>
        set((state) => {
          if (!state.activeEncounter) return state;
          return {
            activeEncounter: {
              ...state.activeEncounter,
              phase: "completed",
              completedAt: Date.now(),
              isPaused: false,
            },
          };
        }),

      pauseCombat: () =>
        set((state) => {
          if (!state.activeEncounter) return state;
          return {
            activeEncounter: { ...state.activeEncounter, isPaused: true },
          };
        }),

      resumeCombat: () =>
        set((state) => {
          if (!state.activeEncounter) return state;
          return {
            activeEncounter: {
              ...state.activeEncounter,
              isPaused: false,
              turnStartedAt: Date.now(),
            },
          };
        }),

      damageCombatant: (combatantId: string, amount: number) =>
        set((state) => {
          if (!state.activeEncounter) return state;
          const combatant = state.activeEncounter.combatants.find(
            (c) => c.id === combatantId
          );
          if (!combatant) return state;

          const newHP = clampHP(combatant.hitPoints, -amount);
          const isDead = newHP.current <= 0;

          const entries: CombatLogEntry[] = [
            {
              id: generateId(),
              timestamp: Date.now(),
              type: "damage",
              actorId: combatantId,
              actorName: combatant.name,
              value: amount,
              description: `${combatant.name} takes ${amount} damage`,
            },
          ];

          if (isDead && !combatant.isDead) {
            entries.push({
              id: generateId(),
              timestamp: Date.now(),
              type: "death",
              actorId: combatantId,
              actorName: combatant.name,
              description: `${combatant.name} has fallen!`,
            });
          }

          return {
            activeEncounter: {
              ...state.activeEncounter,
              combatants: state.activeEncounter.combatants.map((c) =>
                c.id === combatantId
                  ? { ...c, hitPoints: newHP, isDead }
                  : c
              ),
            },
            combatLog: [...state.combatLog, ...entries],
          };
        }),

      healCombatant: (combatantId: string, amount: number) =>
        set((state) => {
          if (!state.activeEncounter) return state;
          const combatant = state.activeEncounter.combatants.find(
            (c) => c.id === combatantId
          );
          if (!combatant) return state;

          const newHP = clampHP(combatant.hitPoints, amount);
          const wasDead = combatant.isDead;
          const isNowAlive = newHP.current > 0;

          const entries: CombatLogEntry[] = [
            {
              id: generateId(),
              timestamp: Date.now(),
              type: "heal",
              actorId: combatantId,
              actorName: combatant.name,
              value: amount,
              description: `${combatant.name} heals ${amount} HP`,
            },
          ];

          if (wasDead && isNowAlive) {
            entries.push({
              id: generateId(),
              timestamp: Date.now(),
              type: "revive",
              actorId: combatantId,
              actorName: combatant.name,
              description: `${combatant.name} is revived!`,
            });
          }

          return {
            activeEncounter: {
              ...state.activeEncounter,
              combatants: state.activeEncounter.combatants.map((c) =>
                c.id === combatantId
                  ? { ...c, hitPoints: newHP, isDead: !isNowAlive }
                  : c
              ),
            },
            combatLog: [...state.combatLog, ...entries],
          };
        }),

      setTempHP: (combatantId: string, amount: number) =>
        set((state) => {
          if (!state.activeEncounter) return state;
          return {
            activeEncounter: {
              ...state.activeEncounter,
              combatants: state.activeEncounter.combatants.map((c) =>
                c.id === combatantId
                  ? { ...c, hitPoints: { ...c.hitPoints, temporary: amount } }
                  : c
              ),
            },
          };
        }),

      addStatusEffect: (combatantId: string, effect: string) =>
        set((state) => {
          if (!state.activeEncounter) return state;
          const effectId = `${effect}_${Date.now()}`;
          return {
            activeEncounter: {
              ...state.activeEncounter,
              combatants: state.activeEncounter.combatants.map((c) =>
                c.id === combatantId
                  ? {
                      ...c,
                      statusEffects: [
                        ...c.statusEffects,
                        { id: effectId, effect },
                      ],
                    }
                  : c
              ),
            },
          };
        }),

      removeStatusEffect: (combatantId: string, effectId: string) =>
        set((state) => {
          if (!state.activeEncounter) return state;
          return {
            activeEncounter: {
              ...state.activeEncounter,
              combatants: state.activeEncounter.combatants.map((c) =>
                c.id === combatantId
                  ? {
                      ...c,
                      statusEffects: c.statusEffects.filter(
                        (e) => e.id !== effectId
                      ),
                    }
                  : c
              ),
            },
          };
        }),

      toggleDead: (combatantId: string) =>
        set((state) => {
          if (!state.activeEncounter) return state;
          return {
            activeEncounter: {
              ...state.activeEncounter,
              combatants: state.activeEncounter.combatants.map((c) =>
                c.id === combatantId
                  ? { ...c, isDead: !c.isDead }
                  : c
              ),
            },
          };
        }),

      toggleConcentration: (combatantId: string) =>
        set((state) => {
          if (!state.activeEncounter) return state;
          return {
            activeEncounter: {
              ...state.activeEncounter,
              combatants: state.activeEncounter.combatants.map((c) =>
                c.id === combatantId
                  ? { ...c, isConcentrating: !c.isConcentrating }
                  : c
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
              combatants: state.activeEncounter.combatants.map((c) =>
                c.id === combatantId ? { ...c, notes } : c
              ),
            },
          };
        }),

      addLogEntry: (entry: CombatLogEntry) =>
        set((state) => ({
          combatLog: [...state.combatLog, entry],
        })),

      undoLastAction: () =>
        set((state) => {
          if (state.combatLog.length === 0) return state;
          const newLog = state.combatLog.slice(0, -1);
          return { combatLog: newLog };
        }),

      clearLog: () => set({ combatLog: [] }),

      setSession: (session: Partial<LiveSessionState>) =>
        set((state) => ({
          liveSession: { ...state.liveSession, ...session },
        })),

      startSession: () =>
        set((state) => ({
          liveSession: {
            ...state.liveSession,
            sessionStartedAt: Date.now(),
            phase: "exploration",
          },
        })),

      endSession: () =>
        set((state) => ({
          liveSession: { ...defaultSession },
        })),

      clearEncounter: () =>
        set({ activeEncounter: null, combatLog: [] }),

      clearAll: () =>
        set({
          activeEncounter: null,
          combatLog: [],
          liveSession: { ...defaultSession },
        }),
    }),
    {
      name: STORAGE_KEY,
    }
  )
);
