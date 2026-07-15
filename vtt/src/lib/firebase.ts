/* ── Firebase Initialization ───────────────────────────────────
 * Central Firebase config. In dev mode, connects to local emulators.
 *
 * NOTE: Auth is no longer managed via Firebase. DM login uses a simple
 * environment-variable comparison. Firebase is used solely for Firestore
 * (campaign sync) and Storage (assets). The Firebase Auth module is not
 * initialized here.
 * ─────────────────────────────────────────────────────────────── */

import { initializeApp, type FirebaseOptions } from "firebase/app";
import { getFirestore, connectFirestoreEmulator, type Firestore } from "firebase/firestore";
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
let _storage: FirebaseStorage | null = null;

if (hasValidConfig()) {
  _app = initializeApp(firebaseConfig);
  _db = getFirestore(_app);
  _storage = getStorage(_app);

  /* ── Emulator Connection (Dev Mode) ─────────────────────────── */
  const useEmulators = import.meta.env.VITE_USE_EMULATORS === "true";
  if (useEmulators) {
    connectFirestoreEmulator(_db, "127.0.0.1", 8090);
    connectStorageEmulator(_storage, "127.0.0.1", 9199);
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
  return _db !== null;
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
 * Returns the Storage instance. Throws if Firebase is not initialized.
 */
export function getStorageInstance(): FirebaseStorage {
  if (!_storage) throw new Error("Firebase is not initialized. Check your .env configuration.");
  return _storage;
}

// Legacy named exports for backwards compat with existing imports
export { _app as app, _db as db, _storage as storage };
export default _app;
