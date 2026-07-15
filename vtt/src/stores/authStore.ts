/* ── Authentication Store (DM / Player) ────────────────────────
 *
 * Two-layer authentication:
 *   1. App-level: DM checks MikeJello/Jello1 credentials.
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
 * DM CREDENTIALS: Hardcoded as MikeJello/Jello1 (the single source of truth).
 * The VITE_DM_USERNAME / VITE_DM_PASSWORD env vars serve as a secondary
 * override for custom deployments. Both should agree.
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
 * The single hardcoded DM credential.
 * This is the ONLY way to log in as DM, regardless of env var state.
 */
const DM_CREDENTIALS = { username: "MikeJello", password: "Jello1" };

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

      /* ── DM Login — single source of truth: MikeJello/Jello1 ── */
      login: (username, password) => {
        const trimmedUser = username.trim();
        const trimmedPass = password.trim();

        if (!trimmedUser || !trimmedPass) {
          return {
            success: false,
            error: "Please enter both username and password.",
          };
        }

        // 1. Check env vars first (for custom deployments)
        const expectedUser = ENV.DM_USERNAME();
        const expectedPass = ENV.DM_PASSWORD();

        const envMatch = expectedUser && expectedPass
          && trimmedUser === expectedUser && trimmedPass === expectedPass;

        // 2. Check hardcoded primary credential
        const primaryMatch = trimmedUser === DM_CREDENTIALS.username
          && trimmedPass === DM_CREDENTIALS.password;

        if (!envMatch && !primaryMatch) {
          return {
            success: false,
            error: "Invalid credentials. Only MikeJello is authorized as DM.",
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
