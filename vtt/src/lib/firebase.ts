import { initializeApp, FirebaseApp } from "firebase/app";
import {
  getFirestore,
  Firestore,
  enableMultiTabIndexedDbPersistence,
  connectFirestoreEmulator,
} from "firebase/firestore";
import {
  getAuth,
  connectAuthEmulator,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  Auth,
} from "firebase/auth";

const REQUIRED_VARS = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
] as const;

export function hasValidConfig(): boolean {
  return REQUIRED_VARS.every((key) => {
    const val = import.meta.env[key];
    return typeof val === "string" && val.length > 0;
  });
}

function loadFirebaseConfig(): Record<string, string> {
  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? "",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? "",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? "",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? "",
    appId: import.meta.env.VITE_FIREBASE_APP_ID ?? "",
  };
}

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

export function getFirebaseApp(): FirebaseApp {
  if (!app) {
    const config = loadFirebaseConfig();
    app = initializeApp(config);
  }
  return app;
}

export async function getFirestoreDb(): Promise<Firestore> {
  if (!db) {
    db = getFirestore(getFirebaseApp());

    const useEmulators = import.meta.env.VITE_USE_EMULATORS === "true";
    if (useEmulators) {
      connectFirestoreEmulator(db, "127.0.0.1", 8090);
    }

    try {
      await enableMultiTabIndexedDbPersistence(db);
    } catch (err: unknown) {
      const error = err as { code?: string };
      if (error?.code === "failed-precondition") {
        console.warn("[Firebase] Multi-tab persistence unavailable (multiple tabs open)");
      } else if (error?.code === "unimplemented") {
        console.warn("[Firebase] Persistence not supported in this browser");
      }
    }
  }
  return db;
}

export function getAuthInstance(): Auth {
  if (!auth) {
    auth = getAuth(getFirebaseApp());

    const useEmulators = import.meta.env.VITE_USE_EMULATORS === "true";
    if (useEmulators) {
      connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
    }
  }
  return auth;
}

export async function loginFirebaseDm(
  email: string,
  password: string
): Promise<User> {
  const authInstance = getAuthInstance();
  const result = await signInWithEmailAndPassword(authInstance, email, password);
  return result.user;
}

export async function logoutFirebase(): Promise<void> {
  const authInstance = getAuthInstance();
  await signOut(authInstance);
}

export function onFirebaseAuthChanged(callback: (user: User | null) => void): () => void {
  const authInstance = getAuthInstance();
  return onAuthStateChanged(authInstance, callback);
}

export { type User } from "firebase/auth";
