/**
 * STᚱ VTT — Theatric Store
 *
 * Manages the cinematic display state for the dual-screen Theatric View.
 * Syncs the active map, tokens, lights, and fog state in real-time via Firebase.
 * The TheatricDisplay component reads this store to render a pure cinematic canvas.
 *
 * Architecture:
 *   DM Dashboard (master) ── writes to Firestore ──► Theatric Tab (slave)
 *   Theatric Tab reads via onSnapshot ── updates local store ── re-renders canvas
 */

import { create } from "zustand";

export interface TheatricCamera {
  x: number;
  y: number;
  zoom: number;
  rotation: number;
}

export interface TheatricState {
  /** Currently active map ID for the theatric display */
  activeMapId: string | null;
  /** Camera state for the theatric canvas */
  camera: TheatricCamera;
  /** Whether fog of war is visible on the theatric display */
  showFog: boolean;
  /** Whether to show token labels */
  showLabels: boolean;
  /** Whether the theatric display is connected and syncing */
  isConnected: boolean;
  /** Last sync timestamp */
  lastSyncAt: number | null;

  // Actions
  setActiveMap: (mapId: string | null) => void;
  setCamera: (camera: Partial<TheatricCamera>) => void;
  setShowFog: (show: boolean) => void;
  setShowLabels: (show: boolean) => void;
  setConnected: (connected: boolean) => void;
  setLastSync: () => void;
  reset: () => void;
}

const initialCamera: TheatricCamera = { x: 0, y: 0, zoom: 1, rotation: 0 };

const initialState = {
  activeMapId: null as string | null,
  camera: initialCamera,
  showFog: false,
  showLabels: true,
  isConnected: false,
  lastSyncAt: null as number | null,
};

export const useTheatricStore = create<TheatricState>()((set) => ({
  ...initialState,

  setActiveMap: (mapId) =>
    set({ activeMapId: mapId, lastSyncAt: Date.now() }),

  setCamera: (cam) =>
    set((s) => ({ camera: { ...s.camera, ...cam }, lastSyncAt: Date.now() })),

  setShowFog: (show) =>
    set({ showFog: show, lastSyncAt: Date.now() }),

  setShowLabels: (show) =>
    set({ showLabels: show, lastSyncAt: Date.now() }),

  setConnected: (connected) =>
    set({ isConnected: connected }),

  setLastSync: () =>
    set({ lastSyncAt: Date.now() }),

  reset: () =>
    set({ ...initialState }),
}));
