/* ── Firebase Initialization ───────────────────────────────────
 * Central Firebase config. In dev mode, connects to local emulators.
 * ─────────────────────────────────────────────────────────────── */

import { initializeApp, type FirebaseOptions } from "firebase/app";
import { getFirestore, connectFirestoreEmulator, type Firestore } from "firebase/firestore";
import { getAuth, connectAuthEmulator, type Auth } from "firebase/auth";
import { getStorage, connectStorageEmulator, type FirebaseStorage } from "firebase/storage";

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
let _auth: Auth | null = null;
let _storage: FirebaseStorage | null = null;

if (hasValidConfig()) {
  _app = initializeApp(firebaseConfig);
  _db = getFirestore(_app);
  _auth = getAuth(_app);
  _storage = getStorage(_app);

  /* ── Emulator Connection (Dev Mode) ─────────────────────────── */
  if (import.meta.env.DEV) {
    connectFirestoreEmulator(_db, "localhost", 8080);
    connectAuthEmulator(_auth, "http://localhost:9099", { disableWarnings: true });
    connectStorageEmulator(_storage, "localhost", 9199);
  }
} else {
  console.info(
    "[Firebase] No valid Firebase config found. App will run in offline-only mode.",
  );
}

/**
 * Checks if Firebase is initialized and ready for use.
 * Components should call this before making Firestore/Firebase calls.
 */
export function isFirebaseAvailable(): boolean {
  return _db !== null && _auth !== null;
}

/**
 * Returns the Firestore instance. Throws if Firebase is not initialized.
 * Always call isFirebaseAvailable() before using this.
 */
export function getDb(): Firestore {
  if (!_db) throw new Error("Firebase is not initialized. Check your .env configuration.");
  return _db;
}

/**
 * Returns the Auth instance. Throws if Firebase is not initialized.
 */
export function getAuthInstance(): Auth {
  if (!_auth) throw new Error("Firebase is not initialized. Check your .env configuration.");
  return _auth;
}

/**
 * Returns the Storage instance. Throws if Firebase is not initialized.
 */
export function getStorageInstance(): FirebaseStorage {
  if (!_storage) throw new Error("Firebase is not initialized. Check your .env configuration.");
  return _storage;
}

// Legacy named exports for backwards compat with existing imports
export { _app as app, _db as db, _auth as auth, _storage as storage };
export default _app;
