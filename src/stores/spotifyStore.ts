/* ── Spotify Playback State Store ──────────────────────────────
 * Manages authentication status, playback state, search results,
 * and device list for the DM's Spotify integration.
 * ─────────────────────────────────────────────────────────────── */

import { create } from "zustand";
import {
  isAuthenticated,
  handleCallback,
  initiateLogin,
  logout as spotifyLogout,
  searchTracks,
  getPlaybackState,
  playTrack,
  pausePlayback,
  resumePlayback,
  nextTrack,
  previousTrack,
  setVolume,
  getDevices,
  transferPlayback,
  type SpotifyTrack,
  type SpotifyDevice,
  type PlaybackState,
} from "@/lib/spotify";

interface SpotifyState {
  /* ── Auth ── */
  isConnected: boolean;
  isConnecting: boolean;
  authError: string | null;

  /* ── Playback ── */
  currentTrack: SpotifyTrack | null;
  isPlaying: boolean;
  progressMs: number;
  volumePercent: number;
  device: SpotifyDevice | null;

  /* ── UI ── */
  isOpen: boolean;
  isSearching: boolean;
  searchResults: SpotifyTrack[];
  searchQuery: string;
  devices: SpotifyDevice[];
  showDeviceList: boolean;

  /* ── Polling ── */
  pollingInterval: ReturnType<typeof setInterval> | null;

  /* ── Actions ── */
  initialize: (clientId: string, redirectUri: string) => Promise<void>;
  connect: (clientId: string, redirectUri: string) => void;
  disconnect: () => void;

  toggleOpen: () => void;
  setOpen: (open: boolean) => void;

  search: (query: string, clientId: string) => Promise<void>;
  clearSearch: () => void;

  play: (trackUri: string, clientId: string) => Promise<void>;
  pause: (clientId: string) => Promise<void>;
  resume: (clientId: string) => Promise<void>;
  next: (clientId: string) => Promise<void>;
  previous: (clientId: string) => Promise<void>;
  changeVolume: (percent: number, clientId: string) => Promise<void>;

  refreshPlayback: (clientId: string) => Promise<void>;
  refreshDevices: (clientId: string) => Promise<void>;
  selectDevice: (deviceId: string, clientId: string) => Promise<void>;

  startPolling: (clientId: string) => void;
  stopPolling: () => void;
}

export const useSpotifyStore = create<SpotifyState>((set, get) => ({
  /* ── Initial State ── */
  isConnected: isAuthenticated(),
  isConnecting: false,
  authError: null,

  currentTrack: null,
  isPlaying: false,
  progressMs: 0,
  volumePercent: 50,
  device: null,

  isOpen: false,
  isSearching: false,
  searchResults: [],
  searchQuery: "",
  devices: [],
  showDeviceList: false,

  pollingInterval: null,

  /* ── Actions ── */
  initialize: async (clientId, redirectUri) => {
    // Handle OAuth callback if coming back from Spotify
    const handled = await handleCallback(clientId, redirectUri);
    if (handled) {
      set({ isConnected: true, isConnecting: false });
      // Start polling immediately after successful auth
      get().startPolling(clientId);
      return;
    }

    // Check if we're already authenticated
    if (isAuthenticated()) {
      set({ isConnected: true, isConnecting: false });
      get().startPolling(clientId);
    }
  },

  connect: (clientId, redirectUri) => {
    set({ isConnecting: true, authError: null });
    initiateLogin(clientId, redirectUri);
  },

  disconnect: () => {
    spotifyLogout();
    get().stopPolling();
    set({
      isConnected: false,
      currentTrack: null,
      isPlaying: false,
      progressMs: 0,
      device: null,
      devices: [],
      searchResults: [],
      searchQuery: "",
    });
  },

  toggleOpen: () => set((s) => ({ isOpen: !s.isOpen })),
  setOpen: (isOpen) => set({ isOpen }),

  search: async (query, clientId) => {
    if (!query.trim()) {
      set({ searchResults: [], isSearching: false, searchQuery: "" });
      return;
    }
    set({ isSearching: true, searchQuery: query });
    try {
      const results = await searchTracks(query, clientId);
      set({ searchResults: results, isSearching: false });
    } catch {
      set({ isSearching: false });
    }
  },

  clearSearch: () => {
    set({ searchResults: [], searchQuery: "", isSearching: false });
  },

  play: async (trackUri, clientId) => {
    try {
      await playTrack(trackUri, clientId);
      set({ isPlaying: true });
    } catch (err) {
      console.error("[Spotify] Play failed:", err);
    }
  },

  pause: async (clientId) => {
    try {
      await pausePlayback(clientId);
      set({ isPlaying: false });
    } catch (err) {
      console.error("[Spotify] Pause failed:", err);
    }
  },

  resume: async (clientId) => {
    try {
      await resumePlayback(clientId);
      set({ isPlaying: true });
    } catch (err) {
      console.error("[Spotify] Resume failed:", err);
    }
  },

  next: async (clientId) => {
    try {
      await nextTrack(clientId);
    } catch (err) {
      console.error("[Spotify] Next failed:", err);
    }
  },

  previous: async (clientId) => {
    try {
      await previousTrack(clientId);
    } catch (err) {
      console.error("[Spotify] Previous failed:", err);
    }
  },

  changeVolume: async (percent, clientId) => {
    set({ volumePercent: percent });
    try {
      await setVolume(percent, clientId);
    } catch (err) {
      console.error("[Spotify] Volume change failed:", err);
    }
  },

  refreshPlayback: async (clientId) => {
    try {
      const state = await getPlaybackState(clientId);
      if (state) {
        set({
          currentTrack: state.track,
          isPlaying: state.isPlaying,
          progressMs: state.progressMs,
          device: state.device,
        });
      } else {
        // No active playback
        set({ currentTrack: null, isPlaying: false, progressMs: 0 });
      }
    } catch {
      // Silently fail during polling
    }
  },

  refreshDevices: async (clientId) => {
    try {
      const devices = await getDevices(clientId);
      set({ devices });
    } catch {
      // Silently fail
    }
  },

  selectDevice: async (deviceId, clientId) => {
    try {
      await transferPlayback(deviceId, clientId);
      set({ showDeviceList: false });
      // Refresh state after transfer
      setTimeout(() => get().refreshPlayback(clientId), 500);
    } catch (err) {
      console.error("[Spotify] Device transfer failed:", err);
    }
  },

  startPolling: (clientId) => {
    get().stopPolling();
    const id = setInterval(() => {
      get().refreshPlayback(clientId);
    }, 3000);
    set({ pollingInterval: id });
    // Immediate first refresh
    get().refreshPlayback(clientId);
    get().refreshDevices(clientId);
  },

  stopPolling: () => {
    const id = get().pollingInterval;
    if (id) {
      clearInterval(id);
      set({ pollingInterval: null });
    }
  },
}));
