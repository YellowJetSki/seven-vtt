/* ── Firebase Authentication Service ───────────────────────────
 * Wraps Firebase Auth for DM login. Players still authenticate
 * via local name matching (no Firebase UIs or accounts for players).
 *
 * Uses synthetic email pattern: dm_<username>@strvtt.app
 * The .app domain is used instead of .local because Firebase
 * Console requires RFC-compliant email addresses to create users.
 * ─────────────────────────────────────────────────────────────── */

import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { getAuthInstance, isFirebaseAvailable } from "@/lib/firebase";

export type AuthCallback = (user: User | null) => void;

/** The email domain used for DM accounts (must be RFC-compliant). */
const DM_EMAIL_DOMAIN = "@strvtt.app";

/**
 * Derives a synthetic email from a DM username.
 * Example: "MikeJello" → "dm_mikejello@strvtt.app"
 */
function buildDmEmail(username: string): string {
  const sanitized = username.toLowerCase().replace(/[^a-z0-9]/g, "");
  return `dm_${sanitized}${DM_EMAIL_DOMAIN}`;
}

/**
 * Signs in the DM using email/password credentials.
 * Uses a synthetic email derived from the username:
 *   `dm_<username>@strvtt.app`
 *
 * This keeps the login UX simple (username + password) while using
 * Firebase Auth properly internally.
 */
export async function loginWithFirebase(
  username: string,
  password: string,
): Promise<{ success: boolean; error?: string }> {
  if (!isFirebaseAvailable()) {
    return { success: false, error: "Firebase is not configured." };
  }

  try {
    const auth = getAuthInstance();
    const email = buildDmEmail(username);
    await signInWithEmailAndPassword(auth, email, password);
    return { success: true };
  } catch (err: unknown) {
    const code =
      err && typeof err === "object" && "code" in err
        ? (err as { code: string }).code
        : "unknown";

    switch (code) {
      case "auth/user-not-found":
      case "auth/invalid-credential":
        return {
          success: false,
          error: "Invalid credentials. Please check your username and password.",
        };
      case "auth/too-many-requests":
        return {
          success: false,
          error: "Too many login attempts. Please wait a moment and try again.",
        };
      case "auth/network-request-failed":
        return {
          success: false,
          error:
            "Cannot reach the authentication server. Check your internet connection.",
        };
      default:
        return {
          success: false,
          error: "Login failed. Please try again.",
        };
    }
  }
}

/**
 * Logs out the current user.
 */
export async function logoutFromFirebase(): Promise<void> {
  if (!isFirebaseAvailable()) return;
  try {
    const auth = getAuthInstance();
    await signOut(auth);
  } catch {
    // Silently fail — auth state will be cleared client-side anyway
  }
}

/**
 * Subscribes to auth state changes.
 * Returns an unsubscribe function.
 */
export function onAuthChanged(callback: AuthCallback): () => void {
  if (!isFirebaseAvailable()) {
    callback(null);
    return () => {};
  }
  const auth = getAuthInstance();
  return onAuthStateChanged(auth, callback);
}

/**
 * Returns the current Firebase user, or null if not authenticated.
 */
export function getCurrentUser(): User | null {
  if (!isFirebaseAvailable()) return null;
  const auth = getAuthInstance();
  return auth.currentUser;
}

/**
 * Checks if the current user is the DM by verifying the email pattern.
 * Must match the domain used in buildDmEmail().
 */
export function isDmUser(): boolean {
  const user = getCurrentUser();
  if (!user?.email) return false;
  return user.email.endsWith(DM_EMAIL_DOMAIN);
}
