/* ── Firebase Initialization ───────────────────────────────────
 * Central Firebase config. In dev mode, connects to local emulators.
 * ─────────────────────────────────────────────────────────────── */

import { initializeApp, type FirebaseOptions } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getStorage, connectStorageEmulator } from "firebase/storage";

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

let app: ReturnType<typeof initializeApp> | null = null;
let db: ReturnType<typeof getFirestore> | null = null;
let auth: ReturnType<typeof getAuth> | null = null;
let storage: ReturnType<typeof getStorage> | null = null;

if (hasValidConfig()) {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
  storage = getStorage(app);

  /* ── Emulator Connection (Dev Mode) ─────────────────────────── */
  if (import.meta.env.DEV) {
    connectFirestoreEmulator(db, "localhost", 8080);
    connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
    connectStorageEmulator(storage, "localhost", 9199);
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
  return app !== null && db !== null && auth !== null;
}

export { app, db, auth, storage };
export default app;
