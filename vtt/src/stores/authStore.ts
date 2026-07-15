/* ── Authentication Store (DM / Player) ────────────────────────
 *
 * Two-layer authentication:
 *   1. App-level: DM checks VITE_DM_USERNAME/VITE_DM_PASSWORD env vars.
 *      Player matches name against campaign's player character list.
 *   2. Firebase Auth: On successful DM app-login, calls signInWithEmailAndPassword
 *      to get a Firebase Auth token for Firestore access.
 *      On player login, calls signInAnonymously for read-only Firestore access.
 *
 * SECURITY: Firestore security rules check request.auth.uid.
 *   - DM UID can write campaign/liveSession/homebrew documents.
 *   - Any authenticated user (DM or anonymous player) can read.
 *
 * Persistence: Role + username survive page refresh via localStorage.
 *
 * DM CREDENTIALS: The DM login checks against VITE_DM_USERNAME and
 * VITE_DM_PASSWORD env vars, WITH a fallback list of valid credentials
 * to support multiple environments without Vercel env var headaches.
 * ─────────────────────────────────────────────────────────────── */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ENV } from "@/lib/env";
import { logoutFirebase } from "@/lib/firebase";

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

/**
 * Hardcoded fallback DM credentials for environments where
 * VITE_DM_USERNAME / VITE_DM_PASSWORD cannot be easily changed
 * (e.g., Vercel production with stuck env vars).
 */
const FALLBACK_DM_CREDENTIALS: { username: string; password: string }[] = [
  { username: "MikeJello", password: "Jello1" },
  { username: "arkla", password: "silvertongue" },
];

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

  /** Whether Firebase Auth login is in progress. */
  firebaseAuthLoading: boolean;

  /** Error message from Firebase Auth, if any. */
  firebaseAuthError: string | null;

  // ── Actions ──
  setPlayerIdentifiers: (identifiers: PlayerIdentifier[]) => void;
  setFirebaseConnected: (connected: boolean) => void;
  setFirebaseAuthLoading: (loading: boolean) => void;
  setFirebaseAuthError: (error: string | null) => void;
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
      firebaseAuthLoading: false,
      firebaseAuthError: null,

      /* ── Set the player identifier lookup table ── */
      setPlayerIdentifiers: (identifiers) => set({ playerIdentifiers: identifiers }),

      /* ── Set Firebase connection status (runtime only) ── */
      setFirebaseConnected: (connected) => set({ firebaseConnected: connected }),

      /* ── Set Firebase Auth loading state ── */
      setFirebaseAuthLoading: (loading) => set({ firebaseAuthLoading: loading }),

      /* ── Set Firebase Auth error ── */
      setFirebaseAuthError: (error) => set({ firebaseAuthError: error }),

      /* ── DM Login (env-based + fallback list) ── */
      login: (username, password) => {
        const trimmedUser = username.trim();
        const trimmedPass = password.trim();

        if (!trimmedUser || !trimmedPass) {
          return {
            success: false,
            error: "Please enter both username and password.",
          };
        }

        // Primary check: against env vars
        const expectedUser = ENV.DM_USERNAME();
        const expectedPass = ENV.DM_PASSWORD();

        if (expectedUser && expectedPass) {
          if (trimmedUser === expectedUser && trimmedPass === expectedPass) {
            set({
              state: "authenticated",
              role: "dm",
              username: trimmedUser,
              characterId: null,
            });
            return { success: true, role: "dm" };
          }
        }

        // Fallback check: against hardcoded credential list
        for (const cred of FALLBACK_DM_CREDENTIALS) {
          if (trimmedUser === cred.username && trimmedPass === cred.password) {
            set({
              state: "authenticated",
              role: "dm",
              username: trimmedUser,
              characterId: null,
            });
            return { success: true, role: "dm" };
          }
        }

        // No match found
        return {
          success: false,
          error: "Invalid credentials. Please check your username and password.",
        };
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

      /* ── Logout (app-level + Firebase Auth) ── */
      logout: () => {
        // Fire-and-forget the Firebase sign-out — don't block the UI
        logoutFirebase();

        set({
          state: "unauthenticated",
          role: null,
          username: null,
          characterId: null,
          firebaseConnected: false,
          firebaseAuthError: null,
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
        // Runtime-only fields — not persisted
      }),
    },
  ),
);
