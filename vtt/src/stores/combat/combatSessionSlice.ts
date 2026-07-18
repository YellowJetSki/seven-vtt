import type { StateCreator } from "zustand";
import type { LiveSessionState } from "@/types";
import type { CombatSlice } from "./combatSlice";
import { defaultConditions } from "./combat-helpers";

export interface CombatSessionSlice {
  setSession: (session: Partial<LiveSessionState>) => void;
  startSession: () => void;
  endSession: () => void;
  clearAll: () => void;
}

const defaultSession: LiveSessionState = {
  activeEncounterId: null,
  phase: "exploration",
  sessionStartedAt: null,
  lastShortRestAt: null,
  lastLongRestAt: null,
  conditions: { ...defaultConditions },
};

export const createCombatSessionSlice: StateCreator<CombatSlice & CombatSessionSlice, [], [], CombatSessionSlice> = 
  (set) => ({
  setSession: (session: Partial<LiveSessionState>) =>
    set((state) => ({
      liveSession: { ...state.liveSession, ...session },
    })),

  startSession: () =>
    set((state) => ({
      liveSession: { ...state.liveSession, sessionStartedAt: Date.now(), phase: "exploration" },
    })),

  endSession: () =>
    set({ liveSession: { ...defaultSession } }),

  clearAll: () =>
    set({ activeEncounter: null, combatLog: [], liveSession: { ...defaultSession } }),
});
