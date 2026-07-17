/* ── Live Session Slice ────────────────────────────────────────
 * Session lifecycle management, scene/map/announcement, conditions, rests.
 * ─────────────────────────────────────────────────────────────── */

import type { StateCreator } from "zustand";
import type { CombatStoreState } from "./types";
import type { LiveSessionState } from "@/types/combat";

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

export const createLiveSessionSlice: StateCreator<
  CombatStoreState,
  [],
  [],
  Pick<CombatStoreState,
    "startSession" | "endSession" | "setSessionPhase" |
    "setCurrentScene" | "setCurrentMapUrl" | "setDmAnnouncement" |
    "setConditions" | "recordRest"
  >
> = (set, get) => ({
  startSession: () => {
    const now = Date.now();
    set({
      liveSession: { ...get().liveSession, sessionStartedAt: now, phase: "exploration" },
    });
  },

  endSession: () => {
    set({ liveSession: { ...DEFAULT_LIVE_SESSION } });
  },

  setSessionPhase: (phase) => {
    set({ liveSession: { ...get().liveSession, phase } });
  },

  setCurrentScene: (scene) => {
    set({ liveSession: { ...get().liveSession, currentScene: scene } });
  },

  setCurrentMapUrl: (url) => {
    set({ liveSession: { ...get().liveSession, currentMapUrl: url } });
  },

  setDmAnnouncement: (msg) => {
    set({ liveSession: { ...get().liveSession, dmAnnouncement: msg } });
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
});
