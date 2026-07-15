/* ── Firebase Initialization ───────────────────────────────────
 * Central Firebase config. Handles Firestore, Storage, and Auth.
 *
 * AUTH STRATEGY:
 *   The app uses Firebase Auth (Email/Password) for secure Firestore access.
 *   - DM user: Created once in Firebase Console. Must have a custom claim
 *     { role: "dm" } set via Firebase Admin SDK or Cloud Function.
 *   - On DM login → app calls signInWithEmailAndPassword()
 *   - On Player login → app calls signInAnonymously() for read-only access
 *
 * SECURITY RULES (firestore.rules):
 *   Writes: require request.auth.token.role == "dm"
 *   Reads:  require any authenticated user (request.auth != null)
 * ─────────────────────────────────────────────────────────────── */

import { initializeApp, type FirebaseOptions } from "firebase/app";
import { getFirestore, connectFirestoreEmulator, type Firestore } from "firebase/firestore";
import { getStorage, connectStorageEmulator, type FirebaseStorage } from "firebase/storage";
import {
  getAuth,
  connectAuthEmulator,
  signInWithEmailAndPassword,
  signInAnonymously,
  signOut as firebaseSignOut,
  type Auth,
} from "firebase/auth";

/* ── Check if Firebase config is valid ────────────────────────
 * Returns true if the API key is set and not a placeholder.
 */
function hasValidConfig(): boolean {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY as string | undefined;
  if (!apiKey) return false;
  if (apiKey === "your_api_key_here") return false;
  if (apiKey.length < 20) return false; // Real Firebase keys are ~39 chars
  return true;
}

/* ── Firebase Auth Credentials (for DM) ───────────────────────
 * These are stored in .env alongside the app-level DM credentials.
 * Must be created manually in Firebase Console (Authentication → Users).
 * The DM user must have a custom claim { role: "dm" } assigned.
 */
const FIREBASE_AUTH_EMAIL = import.meta.env.VITE_FIREBASE_AUTH_EMAIL as string | undefined;
const FIREBASE_AUTH_PASSWORD = import.meta.env.VITE_FIREBASE_AUTH_PASSWORD as string | undefined;

const firebaseConfig: FirebaseOptions = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let _app: ReturnType<typeof initializeApp> | null = null;
let _db: Firestore | null = null;
let _storage: FirebaseStorage | null = null;
let _auth: Auth | null = null;

if (hasValidConfig()) {
  _app = initializeApp(firebaseConfig);
  _db = getFirestore(_app);
  _storage = getStorage(_app);
  _auth = getAuth(_app);

  /* ── Emulator Connection (Dev Mode) ─────────────────────────── */
  const useEmulators = import.meta.env.VITE_USE_EMULATORS === "true";
  if (useEmulators) {
    connectFirestoreEmulator(_db, "127.0.0.1", 8080);
    connectStorageEmulator(_storage, "127.0.0.1", 9199);
    connectAuthEmulator(_auth, "http://127.0.0.1:9099", { disableWarnings: true });
  }
} else {
  console.info(
    "[Firebase] No valid Firebase config found. App will run in offline-only mode.",
  );
}

/* ── Auth Helpers ───────────────────────────────────────────── */

/**
 * Signs in the DM using Firebase Auth (Email/Password).
 * Requires VITE_FIREBASE_AUTH_EMAIL and VITE_FIREBASE_AUTH_PASSWORD
 * to be set in .env.
 *
 * The Firebase Auth user must have a custom claim { role: "dm" }
 * assigned via Firebase Admin SDK or a Cloud Function.
 */
export async function loginFirebaseDm(): Promise<boolean> {
  if (!_auth) return false;
  if (!FIREBASE_AUTH_EMAIL || !FIREBASE_AUTH_PASSWORD) {
    console.warn(
      "[Firebase Auth] DM credentials not configured. " +
        "Set VITE_FIREBASE_AUTH_EMAIL and VITE_FIREBASE_AUTH_PASSWORD.",
    );
    return false;
  }
  try {
    // Sign out first to ensure a clean session
    await firebaseSignOut(_auth).catch(() => {});
    await signInWithEmailAndPassword(_auth, FIREBASE_AUTH_EMAIL, FIREBASE_AUTH_PASSWORD);
    return true;
  } catch (err) {
    console.error("[Firebase Auth] DM sign-in failed:", err);
    return false;
  }
}

/**
 * Signs in a player anonymously for read-only Firestore access.
 */
export async function loginFirebasePlayer(): Promise<boolean> {
  if (!_auth) return false;
  try {
    await signInAnonymously(_auth);
    return true;
  } catch (err) {
    console.error("[Firebase Auth] Anonymous sign-in failed:", err);
    return false;
  }
}

/**
 * Signs out of Firebase Auth.
 */
export async function logoutFirebase(): Promise<void> {
  if (!_auth) return;
  try {
    await firebaseSignOut(_auth);
  } catch (err) {
    console.error("[Firebase Auth] Sign-out failed:", err);
  }
}

/**
 * Returns the current Firebase Auth user's UID, or null.
 */
export function getFirebaseUid(): string | null {
  return _auth?.currentUser?.uid ?? null;
}

/* ── Public API ─────────────────────────────────────────────── */

/**
 * Checks if Firebase is initialized and ready for use.
 * Components should call this before making Firestore/Firebase calls.
 */
export function isFirebaseAvailable(): boolean {
  return _db !== null && _auth !== null;
}

/**
 * Returns the Firestore instance. Throws if Firebase is not initialized.
 */
export function getDb(): Firestore {
  if (!_db) throw new Error("Firebase is not initialized. Check your .env configuration.");
  return _db;
}

/**
 * Returns the Storage instance. Throws if Firebase is not initialized.
 */
export function getStorageInstance(): FirebaseStorage {
  if (!_storage) throw new Error("Firebase is not initialized. Check your .env configuration.");
  return _storage;
}

/**
 * Returns the Auth instance. Throws if Firebase is not initialized.
 */
export function getAuthInstance(): Auth {
  if (!_auth) throw new Error("Firebase is not initialized. Check your .env configuration.");
  return _auth;
}

// Legacy named exports for backwards compat
export { _app as app, _db as db, _storage as storage, _auth as auth };
export default _app;
