/* ── Authentication Store (DM / Player) ──────────────────────── */

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type UserRole = "dm" | "player";
export type AuthState = "loading" | "authenticated" | "unauthenticated";

interface AuthStore {
  state: AuthState;
  role: UserRole | null;
  username: string | null;
  /** If role === "player", this is the matched character's ID */
  characterId: string | null;
  /** Array of character first names for player lookup */
  playerCharacterNames: string[];

  // ── Actions ──
  setPlayerCharacterNames: (names: string[]) => void;
  login: (username: string, password: string) => LoginResult;
  loginAsPlayer: (firstName: string) => LoginResult;
  logout: () => void;
  initialize: () => void;
}

export interface LoginResult {
  success: boolean;
  error?: string;
  role?: UserRole;
  characterId?: string;
}

/* ── DM Credentials (from environment variables, never pre-filled) ── */
const DM_USERNAME = import.meta.env.VITE_DM_USERNAME ?? "";
const DM_PASSWORD = import.meta.env.VITE_DM_PASSWORD ?? "";

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      state: "unauthenticated" as AuthState,
      role: null,
      username: null,
      characterId: null,
      playerCharacterNames: [],

      setPlayerCharacterNames: (names) => set({ playerCharacterNames: names }),

      login: (username, password) => {
        // Credentials are set via VITE_DM_USERNAME / VITE_DM_PASSWORD in .env
        // DM must know these; they are never revealed in the UI or source hints.
        if (
          DM_USERNAME &&
          DM_PASSWORD &&
          username.trim() === DM_USERNAME &&
          password === DM_PASSWORD
        ) {
          set({
            state: "authenticated",
            role: "dm",
            username: "Dungeon Master",
            characterId: null,
          });
          return { success: true, role: "dm" };
        }

        // Use constant-time-ish check to avoid leaking which field was wrong
        return {
          success: false,
          error: "Invalid credentials. Please try again.",
        };
      },

      loginAsPlayer: (firstName) => {
        const trimmed = firstName.trim();
        if (!trimmed) {
          return { success: false, error: "Please enter your character's first name." };
        }

        const { playerCharacterNames } = get();
        const matchedName = playerCharacterNames.find(
          (name) => name.toLowerCase() === trimmed.toLowerCase(),
        );

        if (matchedName) {
          set({
            state: "authenticated",
            role: "player",
            username: matchedName,
            characterId: matchedName,
          });
          return { success: true, role: "player", characterId: matchedName };
        }

        return {
          success: false,
          error: `No character found with the name "${trimmed}". Please check with your DM.`,
        };
      },

      logout: () => {
        set({
          state: "unauthenticated",
          role: null,
          username: null,
          characterId: null,
        });
      },

      initialize: () => {
        const { state } = get();
        if (state !== "authenticated") {
          set({ state: "unauthenticated" });
        }
      },
    }),
    {
      name: "str-vtt-auth",
      partialize: (state) => ({
        state: state.state,
        role: state.role,
        username: state.username,
        characterId: state.characterId,
      }),
    },
  ),
);
