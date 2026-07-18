/* ── Obelisk Network Zustand Store ──────────────────────────────
 * State management for the 7 Arkla obelisks.
 * Persisted to localStorage under 'str-vtt-obelisks'.
 * ─────────────────────────────────────────────────────────────── */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Obelisk,
  ObeliskId,
  ObeliskState,
  ObeliskNetwork,
  ObeliskConnection,
  LoreFragment,
} from "@/types/obelisks";
import {
  createDefaultNetwork,
  calculateGlobalCorruption,
  nextObeliskState,
} from "@/types/obelisks";

/* ── Store Interface ──────────────────────────────────────────── */

interface ObeliskStore {
  /** The full network state */
  network: ObeliskNetwork;

  /* ── Actions ─────────────────────────────── */

  /** Initialise the network with default Arkla data */
  initNetwork: () => void;

  /** Set the full network (for Firebase hydration / import) */
  setNetwork: (network: ObeliskNetwork) => void;

  /** Change the state of a single obelisk */
  setObeliskState: (id: ObeliskId, state: ObeliskState) => void;

  /** Discover an obelisk (convenience — sets discovered, records timestamp) */
  discoverObelisk: (id: ObeliskId) => void;

  /** Advance an obelisk to its next state */
  advanceObeliskState: (id: ObeliskId) => void;

  /** Set corruption level for an obelisk */
  setCorruption: (id: ObeliskId, level: number) => void;

  /** Adjust corruption by delta (positive or negative) */
  adjustCorruption: (id: ObeliskId, delta: number) => void;

  /** Set the linked map ID for an obelisk */
  setLinkedMap: (id: ObeliskId, mapId: string | undefined) => void;

  /** Mark a lore fragment as revealed */
  revealLoreFragment: (obeliskId: ObeliskId, fragmentId: string) => void;

  /** Update DM notes for an obelisk */
  setDmNotes: (id: ObeliskId, notes: string) => void;

  /** Set map position for an obelisk */
  setMapPosition: (id: ObeliskId, x: number, y: number) => void;

  /** Toggle overlay visibility */
  toggleOverlay: () => void;

  /** Set zoom level */
  setZoomLevel: (level: number) => void;

  /** Select an obelisk for detail view */
  selectObelisk: (id: ObeliskId | null) => void;

  /** Reset all obelisks to undiscovered */
  resetNetwork: () => void;

  /** Add a custom lore fragment */
  addLoreFragment: (obeliskId: ObeliskId, fragment: LoreFragment) => void;

  /** Set attunement charges */
  setAttunementCharges: (id: ObeliskId, charges: number) => void;

  /** Toggle obelisk active state */
  setActive: (id: ObeliskId, active: boolean) => void;

  /** Set obelisk scale */
  setScale: (id: ObeliskId, scale: number) => void;
}

/* ── Store Implementation ─────────────────────────────────────── */

export const useObeliskStore = create<ObeliskStore>()(
  persist(
    (set) => ({
      network: createDefaultNetwork(),

      initNetwork: () => set({ network: createDefaultNetwork() }),

      setNetwork: (network) => set({ network }),

      setObeliskState: (id, state) =>
        set((s) => {
          const obelisk = { ...s.network.obelisks[id], state, stateChangedAt: Date.now() };
          const obelisks = { ...s.network.obelisks, [id]: obelisk };
          const attunedCount = Object.values(obelisks).filter((o) => o.state === "attuned").length;
          const cleansedCount = Object.values(obelisks).filter((o) => o.state === "cleansed" || o.state === "shattered").length;
          return {
            network: {
              ...s.network,
              obelisks,
              attunedCount,
              cleansedCount,
              globalCorruption: calculateGlobalCorruption(obelisks),
              updatedAt: Date.now(),
            },
          };
        }),

      discoverObelisk: (id) =>
        set((s) => {
          const obelisk = {
            ...s.network.obelisks[id],
            state: "discovered" as ObeliskState,
            discoveredAt: Date.now(),
            stateChangedAt: Date.now(),
            isActive: true,
          };
          const obelisks = { ...s.network.obelisks, [id]: obelisk };
          return {
            network: {
              ...s.network,
              obelisks,
              updatedAt: Date.now(),
            },
          };
        }),

      advanceObeliskState: (id) =>
        set((s) => {
          const current = s.network.obelisks[id];
          const next = nextObeliskState(current.state);
          if (!next) return s;
          return s.network.obelisks[id].state === "shattered"
            ? s
            : {
                network: {
                  ...s.network,
                  obelisks: {
                    ...s.network.obelisks,
                    [id]: { ...current, state: next, stateChangedAt: Date.now() },
                  },
                  attunedCount: Object.values(s.network.obelisks).filter(
                    (o) => (o.id === id ? next : o.state) === "attuned",
                  ).length,
                  cleansedCount: Object.values(s.network.obelisks).filter(
                    (o) =>
                      (o.id === id ? next : o.state) === "cleansed" ||
                      (o.id === id ? next : o.state) === "shattered",
                  ).length,
                  globalCorruption: calculateGlobalCorruption({
                    ...s.network.obelisks,
                    [id]: { ...current, state: next },
                  }),
                  updatedAt: Date.now(),
                },
              };
        }),

      setCorruption: (id, level) =>
        set((s) => {
          const clamped = Math.max(0, Math.min(100, level));
          const obelisks = {
            ...s.network.obelisks,
            [id]: { ...s.network.obelisks[id], corruption: clamped },
          };
          return {
            network: {
              ...s.network,
              obelisks,
              globalCorruption: calculateGlobalCorruption(obelisks),
              updatedAt: Date.now(),
            },
          };
        }),

      adjustCorruption: (id, delta) =>
        set((s) => {
          const current = s.network.obelisks[id].corruption;
          const clamped = Math.max(0, Math.min(100, current + delta));
          const obelisks = {
            ...s.network.obelisks,
            [id]: { ...s.network.obelisks[id], corruption: clamped },
          };
          return {
            network: {
              ...s.network,
              obelisks,
              globalCorruption: calculateGlobalCorruption(obelisks),
              updatedAt: Date.now(),
            },
          };
        }),

      setLinkedMap: (id, mapId) =>
        set((s) => ({
          network: {
            ...s.network,
            obelisks: {
              ...s.network.obelisks,
              [id]: { ...s.network.obelisks[id], linkedMapId: mapId },
            },
            updatedAt: Date.now(),
          },
        })),

      revealLoreFragment: (obeliskId, fragmentId) =>
        set((s) => {
          const obelisk = s.network.obelisks[obeliskId];
          const fragments = obelisk.loreFragments.map((f) =>
            f.id === fragmentId ? { ...f, revealed: true } : f,
          );
          return {
            network: {
              ...s.network,
              obelisks: {
                ...s.network.obelisks,
                [obeliskId]: { ...obelisk, loreFragments: fragments },
              },
              updatedAt: Date.now(),
            },
          };
        }),

      setDmNotes: (id, notes) =>
        set((s) => ({
          network: {
            ...s.network,
            obelisks: {
              ...s.network.obelisks,
              [id]: { ...s.network.obelisks[id], dmNotes: notes },
            },
            updatedAt: Date.now(),
          },
        })),

      setMapPosition: (id, x, y) =>
        set((s) => ({
          network: {
            ...s.network,
            obelisks: {
              ...s.network.obelisks,
              [id]: { ...s.network.obelisks[id], mapPositionX: x, mapPositionY: y },
            },
            updatedAt: Date.now(),
          },
        })),

      toggleOverlay: () =>
        set((s) => ({
          network: { ...s.network, overlayVisible: !s.network.overlayVisible },
        })),

      setZoomLevel: (level) =>
        set((s) => ({
          network: { ...s.network, zoomLevel: Math.max(0.5, Math.min(3.0, level)) },
        })),

      selectObelisk: (id) =>
        set((s) => ({
          network: { ...s.network, selectedObeliskId: id },
        })),

      resetNetwork: () => set({ network: createDefaultNetwork() }),

      addLoreFragment: (obeliskId, fragment) =>
        set((s) => {
          const obelisk = s.network.obelisks[obeliskId];
          return {
            network: {
              ...s.network,
              obelisks: {
                ...s.network.obelisks,
                [obeliskId]: {
                  ...obelisk,
                  loreFragments: [...obelisk.loreFragments, fragment],
                },
              },
              updatedAt: Date.now(),
            },
          };
        }),

      setAttunementCharges: (id, charges) =>
        set((s) => ({
          network: {
            ...s.network,
            obelisks: {
              ...s.network.obelisks,
              [id]: {
                ...s.network.obelisks[id],
                attunementCharges: Math.max(0, Math.min(s.network.obelisks[id].maxAttunementCharges, charges)),
              },
            },
            updatedAt: Date.now(),
          },
        })),

      setActive: (id, active) =>
        set((s) => ({
          network: {
            ...s.network,
            obelisks: {
              ...s.network.obelisks,
              [id]: { ...s.network.obelisks[id], isActive: active },
            },
            updatedAt: Date.now(),
          },
        })),

      setScale: (id, scale) =>
        set((s) => ({
          network: {
            ...s.network,
            obelisks: {
              ...s.network.obelisks,
              [id]: { ...s.network.obelisks[id], scale: Math.max(0.5, Math.min(2.0, scale)) },
            },
            updatedAt: Date.now(),
          },
        })),
    }),
    {
      name: "str-vtt-obelisks",
      partialize: (state) => ({
        network: state.network,
      }),
    },
  ),
);

/* ── Selector Helpers ─────────────────────────────────────────── */

/** Get a single obelisk by ID */
export function selectObelisk(id: ObeliskId) {
  return (s: ObeliskStore) => s.network.obelisks[id];
}

/** Get all obelisks as an array */
export function selectObelisks() {
  return (s: ObeliskStore) => Object.values(s.network.obelisks);
}

/** Get obelisks in a given state */
export function selectObelisksByState(state: ObeliskState) {
  return (s: ObeliskStore) =>
    Object.values(s.network.obelisks).filter((o) => o.state === state);
}

/** Get visible connections (both endpoints discovered) */
export function selectVisibleConnections() {
  return (s: ObeliskStore) => {
    const discovered = new Set(
      Object.values(s.network.obelisks)
        .filter((o) => o.state !== "undiscovered")
        .map((o) => o.id),
    );
    return s.network.connections
      .filter((c) => discovered.has(c.sourceId) && discovered.has(c.targetId))
      .filter((c) => c.visible);
  };
}
