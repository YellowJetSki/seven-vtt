import { create } from "zustand";
import { persist } from "zustand/middleware";
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
  firebaseAuthLoading: boolean;
  firebaseAuthError: string | null;
}

interface AuthActions {
  login: (username: string, password: string) => boolean;
  loginAsPlayer: (characterId: string, playerName: string) => void;
  logout: () => void;
  setPlayerIdentifiers: (identifiers: PlayerIdentifier[]) => void;
  setFirebaseConnected: (connected: boolean) => void;
  setFirebaseAuthLoading: (loading: boolean) => void;
  setFirebaseAuthError: (error: string | null) => void;
}

const DM_USERNAME = import.meta.env.VITE_DM_USERNAME ?? "MikeJello";
const DM_PASSWORD = import.meta.env.VITE_DM_PASSWORD ?? "Jello1";

export const useAuthStore = create<AuthStateShape & AuthActions>()(
  persist(
    (set) => ({
      state: "unauthenticated",
      role: null,
      username: null,
      characterId: null,
      playerIdentifiers: [],
      firebaseConnected: false,
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
        });
      },

      setPlayerIdentifiers: (identifiers: PlayerIdentifier[]) => {
        set({ playerIdentifiers: identifiers });
      },

      setFirebaseConnected: (connected: boolean) => {
        set({ firebaseConnected: connected });
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
