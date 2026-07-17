/* ── Firestore Helpers ─────────────────────────────────────────
 * Generic CRUD operations for Firestore subcollections.
 * Used by normalized-firebase-service.ts to reduce repetition.
 * ─────────────────────────────────────────────────────────────── */

import {
  doc, collection, setDoc, getDoc, getDocs, deleteDoc, query, orderBy, onSnapshot,
  type Unsubscribe, type DocumentData, type Firestore,
} from "firebase/firestore";
import { getDb, isFirebaseAvailable } from "@/lib/firebase";

const MAX_RETRIES = 3;
const RATE_LIMIT_MS = 500;

/* ── Queue ──────────────────────────────────────────────────── */

interface QueueItem {
  key: string;
  action: () => Promise<boolean>;
  timestamp: number;
  retries: number;
}

let pendingQueue: QueueItem[] = [];
let processingQueue = false;
let lastPushTime = 0;

async function processQueue(): Promise<void> {
  if (processingQueue || pendingQueue.length === 0) return;
  processingQueue = true;
  while (pendingQueue.length > 0) {
    const item = pendingQueue.shift()!;
    const elapsed = Date.now() - lastPushTime;
    if (elapsed < RATE_LIMIT_MS) {
      await new Promise((r) => setTimeout(r, RATE_LIMIT_MS - elapsed));
    }
    try {
      lastPushTime = Date.now();
      const ok = await item.action();
      if (!ok && item.retries < MAX_RETRIES) {
        pendingQueue.push({ ...item, retries: item.retries + 1, timestamp: Date.now() });
      } else if (!ok) {
        console.warn(`[Firestore] Failed ${item.key} after ${MAX_RETRIES} retries.`);
      }
    } catch {
      if (item.retries < MAX_RETRIES) {
        pendingQueue.push({ ...item, retries: item.retries + 1, timestamp: Date.now() });
      }
    }
  }
  processingQueue = false;
}

function enqueue(key: string, action: () => Promise<boolean>): void {
  pendingQueue.push({ key, action, timestamp: Date.now(), retries: 0 });
  processQueue();
}

/* ── Utilities ──────────────────────────────────────────────── */

export function safeStringify<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

function getUserId(): string {
  return "dm@strvtt";
}

function getDbOrThrow(): Firestore {
  const db = getDb();
  if (!db) throw new Error("Firestore not initialized.");
  return db;
}

/* ── Generic CRUD ───────────────────────────────────────────── */

export async function writeDoc(path: string, data: Record<string, unknown>): Promise<boolean> {
  if (!isFirebaseAvailable()) return false;
  try {
    const db = getDbOrThrow();
    const ref = doc(db, path);
    await setDoc(ref, { ...data, updatedAt: Date.now(), updatedBy: getUserId() }, { merge: true });
    return true;
  } catch (err) {
    console.error(`[Firestore] writeDoc failed for ${path}:`, err);
    return false;
  }
}

export async function deleteDocAtPath(path: string): Promise<boolean> {
  if (!isFirebaseAvailable()) return false;
  try {
    const db = getDbOrThrow();
    const ref = doc(db, path);
    await deleteDoc(ref);
    return true;
  } catch (err) {
    console.error(`[Firestore] deleteDoc failed for ${path}:`, err);
    return false;
  }
}

export async function readDoc<T>(path: string): Promise<T | null> {
  if (!isFirebaseAvailable()) return null;
  try {
    const db = getDbOrThrow();
    const ref = doc(db, path);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const raw = snap.data() as DocumentData;
      return (raw.data ?? raw) as T;
    }
    return null;
  } catch (err) {
    console.error(`[Firestore] readDoc failed for ${path}:`, err);
    return null;
  }
}

export async function readAllDocs<T>(collectionPath: string): Promise<T[]> {
  if (!isFirebaseAvailable()) return [];
  try {
    const db = getDbOrThrow();
    const ref = collection(db, collectionPath);
    const snap = await getDocs(ref);
    return snap.docs.map((d) => {
      const raw = d.data() as DocumentData;
      return (raw.data ?? raw) as T;
    });
  } catch (err) {
    console.error(`[Firestore] readAllDocs failed for ${collectionPath}:`, err);
    return [];
  }
}

export function listenCollection<T>(
  collectionPath: string,
  onChange: (items: T[]) => void,
  onError?: (error: string) => void,
): Unsubscribe | null {
  if (!isFirebaseAvailable()) return null;
  try {
    const db = getDbOrThrow();
    const ref = collection(db, collectionPath);
    const q = query(ref, orderBy("updatedAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const items: T[] = snapshot.docs.map((d) => {
          const raw = d.data() as DocumentData;
          return (raw.data ?? raw) as T;
        });
        onChange(items);
      },
      (error) => {
        console.error(`[Firestore] Listener error for ${collectionPath}:`, error);
        onError?.(error.message);
      },
    );
    return unsub;
  } catch (err) {
    console.error(`[Firestore] Failed to start listener for ${collectionPath}:`, err);
    onError?.(String(err));
    return null;
  }
}

/* ── Factory for Domain Stubs ───────────────────────────────── */

export function createDomainStub<T>(basePath: (campaignId: string, entityId: string) => string, collectionPath: (campaignId: string) => string) {
  return {
    async push(campaignId: string, entity: T & { id: string }): Promise<boolean> {
      return writeDoc(basePath(campaignId, entity.id), { data: safeStringify(entity) });
    },
    async remove(campaignId: string, entityId: string): Promise<boolean> {
      return deleteDocAtPath(basePath(campaignId, entityId));
    },
    async fetchAll(campaignId: string): Promise<T[]> {
      return readAllDocs<T>(collectionPath(campaignId));
    },
    listenAll(campaignId: string, onChange: (items: T[]) => void, onError?: (err: string) => void): Unsubscribe | null {
      return listenCollection<T>(collectionPath(campaignId), onChange, onError);
    },
  };
}

export function createTokenStub<T>(tokenPath: (campaignId: string, mapId: string, tokenId: string) => string, tokensCollectionPath: (campaignId: string, mapId: string) => string) {
  return {
    async push(campaignId: string, mapId: string, token: T & { id: string }): Promise<boolean> {
      return writeDoc(tokenPath(campaignId, mapId, token.id), { data: safeStringify(token) });
    },
    async remove(campaignId: string, mapId: string, tokenId: string): Promise<boolean> {
      return deleteDocAtPath(tokenPath(campaignId, mapId, tokenId));
    },
    async fetchAll(campaignId: string, mapId: string): Promise<T[]> {
      return readAllDocs<T>(tokensCollectionPath(campaignId, mapId));
    },
    listenAll(campaignId: string, mapId: string, onChange: (tokens: T[]) => void, onError?: (err: string) => void): Unsubscribe | null {
      return listenCollection<T>(tokensCollectionPath(campaignId, mapId), onChange, onError);
    },
  };
}
