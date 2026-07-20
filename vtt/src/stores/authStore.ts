/**
 * STᚱ VTT — Auth Store (Zustand + Persist)
 *
 * Authentication state management with Firebase sync awareness.
 *
 * Schema:
 *   - state: "unauthenticated" | "authenticated"
 *   - role: "dm" | "player" | null
 *   - username: display name
 *   - characterId: linked PC ID (player only)
 *   - playerIdentifiers: stored player-character mappings
 *   - firebaseConnected: real-time sync status
 *   - firebaseAuthLoading: auth operation in progress
 *   - firebaseAuthError: last auth error message
 *   - syncExhausted: true when Firebase retries exhausted (Sprint 6)
 *
 * Persisted: state, role, username, characterId, playerIdentifiers
 * Volatile: firebaseConnected, syncExhausted, firebaseAuthLoading, firebaseAuthError
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { hasValidConfig, loginFirebaseDm as firebaseLogin } from "@/lib/firebase";
import type { AuthState, UserRole } from "@/types";

const STORAGE_KEY = "str-vtt-auth";

interface PlayerIdentifier {
  label: string;
  characterId: string;
}

interface AuthStateShape {
  state: AuthState;
  role: UserRole | null;
  username: string | null;
  characterId: string | null;
  playerIdentifiers: PlayerIdentifier[];
  firebaseConnected: boolean;
  syncExhausted: boolean;
  firebaseAuthLoading: boolean;
  firebaseAuthError: string | null;
}

interface AuthActions {
  login: (username: string, password: string) => boolean;
  loginAsPlayer: (characterId: string, playerName: string) => void;
  logout: () => void;
  setPlayerIdentifiers: (identifiers: PlayerIdentifier[]) => void;
  setFirebaseConnected: (connected: boolean) => void;
  setSyncExhausted: (exhausted: boolean) => void;
  setFirebaseAuthLoading: (loading: boolean) => void;
  setFirebaseAuthError: (error: string | null) => void;
}

const DM_USERNAME = "MikeJello";
const DM_PASSWORD = "Jello1";

export const useAuthStore = create<AuthStateShape & AuthActions>()(
  persist(
    (set) => ({
      state: "unauthenticated",
      role: null,
      username: null,
      characterId: null,
      playerIdentifiers: [],
      firebaseConnected: false,
      syncExhausted: false,
      firebaseAuthLoading: false,
      firebaseAuthError: null,

      login: (username: string, password: string): boolean => {
        if (username === DM_USERNAME && password === DM_PASSWORD) {
          set({
            state: "authenticated",
            role: "dm",
            username,
            characterId: null,
          });
          return true;
        }
        return false;
      },

      loginAsPlayer: (characterId: string, playerName: string) => {
        set({
          state: "authenticated",
          role: "player",
          username: playerName,
          characterId,
        });
      },

      logout: () => {
        set({
          state: "unauthenticated",
          role: null,
          username: null,
          characterId: null,
          firebaseConnected: false,
          syncExhausted: false,
          firebaseAuthLoading: false,
          firebaseAuthError: null,
        });
      },

      setPlayerIdentifiers: (identifiers: PlayerIdentifier[]) => {
        set({ playerIdentifiers: identifiers });
      },

      setFirebaseConnected: (connected: boolean) => {
        set({ firebaseConnected: connected, syncExhausted: false });
      },

      setSyncExhausted: (exhausted: boolean) => {
        set({ syncExhausted: exhausted });
      },

      setFirebaseAuthLoading: (loading: boolean) => {
        set({ firebaseAuthLoading: loading });
      },

      setFirebaseAuthError: (error: string | null) => {
        set({ firebaseAuthError: error });
      },
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({
        state: state.state,
        role: state.role,
        username: state.username,
        characterId: state.characterId,
        playerIdentifiers: state.playerIdentifiers,
      }),
    }
  )
);
