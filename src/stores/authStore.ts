/* ── Authentication Store (DM / Player) ────────────────────────
 *
 * DM authentication now uses Firebase Auth (email/password).
 * Player authentication remains local (name matching).
 *
 * The store persists only the role and identifiers to localStorage.
 * Firebase auth tokens are managed by the Firebase SDK.
 * ─────────────────────────────────────────────────────────────── */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  loginWithFirebase,
  logoutFromFirebase,
  onAuthChanged,
  getCurrentUser,
  isDmUser,
} from "@/lib/firebase-auth";
import { isFirebaseAvailable } from "@/lib/firebase";

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
  /** Whether Firebase is connected (for UI indicators) */
  firebaseConnected: boolean;

  // ── Actions ──
  setPlayerCharacterNames: (names: string[]) => void;
  login: (username: string, password: string) => Promise<LoginResult>;
  loginAsPlayer: (firstName: string) => LoginResult;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
  setFirebaseConnected: (connected: boolean) => void;
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
      state: "loading" as AuthState,
      role: null,
      username: null,
      characterId: null,
      playerCharacterNames: [],
      firebaseConnected: false,

      setPlayerCharacterNames: (names) => set({ playerCharacterNames: names }),

      /* ── DM Login (Firebase Auth) ── */
      login: async (username, password) => {
        // Trim and validate
        const trimmedUser = username.trim();
        if (!trimmedUser || !password) {
          return {
            success: false,
            error: "Please enter both username and password.",
          };
        }

        // Check if Firebase is available
        if (!isFirebaseAvailable()) {
          return {
            success: false,
            error:
              "Firebase is not configured. Please set up your Firebase project credentials in the .env file.",
          };
        }

        // Authenticate via Firebase
        const result = await loginWithFirebase(trimmedUser, password);
        if (!result.success) {
          return result;
        }

        // Verify the authenticated user is a DM (email ends with @strvtt.local)
        if (!isDmUser()) {
          await logoutFromFirebase();
          return {
            success: false,
            error:
              "This account is not registered as a Dungeon Master. Please use the correct DM credentials.",
          };
        }

        set({
          state: "authenticated",
          role: "dm",
          username: "Dungeon Master",
          characterId: null,
          firebaseConnected: true,
        });

        return { success: true, role: "dm" };
      },

      /* ── Player Login (Local name matching) ── */
      loginAsPlayer: (firstName) => {
        const trimmed = firstName.trim();
        if (!trimmed) {
          return {
            success: false,
            error: "Please enter your character's first name.",
          };
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

      /* ── Logout ── */
      logout: async () => {
        const { role } = get();

        // If DM, sign out of Firebase
        if (role === "dm") {
          await logoutFromFirebase();
        }

        set({
          state: "unauthenticated",
          role: null,
          username: null,
          characterId: null,
          firebaseConnected: false,
        });
      },

      /* ── Initialize — subscribe to Firebase auth state ── */
      initialize: async () => {
        const { state } = get();

        // If already authenticated, keep the session
        if (state === "authenticated") return;

        // If Firebase is available, listen for existing auth sessions
        if (isFirebaseAvailable()) {
          return new Promise<void>((resolve) => {
            const unsub = onAuthChanged((user) => {
              if (user) {
                // Restore DM session from persisted Firebase token
                set({
                  state: "authenticated",
                  role: "dm",
                  username: "Dungeon Master",
                  characterId: null,
                  firebaseConnected: true,
                });
              } else {
                set({ state: "unauthenticated", firebaseConnected: false });
              }
              unsub(); // One-shot — we just need the initial state
              resolve();
            });

            // Timeout after 5s if Firebase doesn't respond
            setTimeout(() => {
              resolve();
            }, 5000);
          });
        }

        // No Firebase — just mark as unauthenticated
        set({ state: "unauthenticated" });
      },

      setFirebaseConnected: (connected) => set({ firebaseConnected: connected }),
    }),
    {
      name: "str-vtt-auth",
      partialize: (state) => ({
        state: state.state,
        role: state.role,
        username: state.username,
        characterId: state.characterId,
        // Don't persist firebaseConnected — it's a runtime status
      }),
    },
  ),
);
