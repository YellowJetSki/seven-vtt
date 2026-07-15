/* ── Authentication Store (DM / Player) ────────────────────────
 *
 * SIMPLIFIED AUTH SYSTEM (no Firebase Auth dependency):
 *
 *   - DM Login: Checks username + password against VITE_DM_USERNAME
 *     and VITE_DM_PASSWORD env vars. No Firebase Auth calls.
 *
 *   - Player Login: Matches the entered name against a list of
 *     known identifiers (first name + alias). Case-insensitive.
 *     Example: "Edmund 'Strider' Tudul" can log in as "Edmund" or "Strider".
 *
 *   - Persistence: Role + username survive page refresh via localStorage.
 * ─────────────────────────────────────────────────────────────── */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ENV } from "@/lib/env";

export type UserRole = "dm" | "player";
export type AuthState = "unauthenticated" | "authenticated";

/**
 * A "login identifier" is a string that a player can type to
 * authenticate. This is either the character's first name or alias.
 */
export interface PlayerIdentifier {
  /** The matched identifier (what the user typed). */
  label: string;
  /** The underlying character document ID. */
  characterId: string;
}

interface AuthStore {
  state: AuthState;
  role: UserRole | null;
  username: string | null;
  /** If role === "player", this is the matched character's ID. */
  characterId: string | null;

  /** All known identifiers that players can use to log in. */
  playerIdentifiers: PlayerIdentifier[];

  /** Whether Firestore sync is connected (runtime flag, not persisted). */
  firebaseConnected: boolean;

  // ── Actions ──
  setPlayerIdentifiers: (identifiers: PlayerIdentifier[]) => void;
  setFirebaseConnected: (connected: boolean) => void;
  login: (username: string, password: string) => LoginResult;
  loginAsPlayer: (name: string) => LoginResult;
  logout: () => void;
}

export interface LoginResult {
  success: boolean;
  error?: string;
  role?: UserRole;
  characterId?: string;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      state: "unauthenticated" as AuthState,
      role: null,
      username: null,
      characterId: null,
      playerIdentifiers: [],
      firebaseConnected: false,

      /* ── Set the player identifier lookup table ── */
      setPlayerIdentifiers: (identifiers) => set({ playerIdentifiers: identifiers }),

      /* ── Set Firebase connection status (runtime only) ── */
      setFirebaseConnected: (connected) => set({ firebaseConnected: connected }),

      /* ── DM Login (env-based, no Firebase Auth) ── */
      login: (username, password) => {
        const trimmedUser = username.trim();
        const trimmedPass = password.trim();

        if (!trimmedUser || !trimmedPass) {
          return {
            success: false,
            error: "Please enter both username and password.",
          };
        }

        const expectedUser = ENV.DM_USERNAME();
        const expectedPass = ENV.DM_PASSWORD();

        if (!expectedUser || !expectedPass) {
          return {
            success: false,
            error:
              "DM credentials are not configured. Set VITE_DM_USERNAME and VITE_DM_PASSWORD in your .env file.",
          };
        }

        if (trimmedUser !== expectedUser || trimmedPass !== expectedPass) {
          return {
            success: false,
            error: "Invalid credentials. Please check your username and password.",
          };
        }

        set({
          state: "authenticated",
          role: "dm",
          username: trimmedUser,
          characterId: null,
        });

        return { success: true, role: "dm" };
      },

      /* ── Player Login (name/alias matching) ── */
      loginAsPlayer: (name) => {
        const trimmed = name.trim();
        if (!trimmed) {
          return {
            success: false,
            error: "Please enter your character's name or alias.",
          };
        }

        const { playerIdentifiers } = get();
        const normalizedInput = trimmed.toLowerCase();

        const match = playerIdentifiers.find(
          (id) => id.label.toLowerCase() === normalizedInput,
        );

        if (match) {
          set({
            state: "authenticated",
            role: "player",
            username: match.label,
            characterId: match.characterId,
          });
          return { success: true, role: "player", characterId: match.characterId };
        }

        return {
          success: false,
          error: `No character found with the name "${trimmed}". Please check with your DM.`,
        };
      },

      /* ── Logout ── */
      logout: () => {
        set({
          state: "unauthenticated",
          role: null,
          username: null,
          characterId: null,
        });
      },
    }),
    {
      name: "str-vtt-auth",
      partialize: (state) => ({
        state: state.state,
        role: state.role,
        username: state.username,
        characterId: state.characterId,
        // firebaseConnected and playerIdentifiers are runtime-only — not persisted
      }),
    },
  ),
);
