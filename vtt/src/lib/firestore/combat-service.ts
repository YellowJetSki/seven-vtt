/**
 * STᚱ VTT — Firestore Combat Service
 *
 * Real-time CRUD for the active combat encounter document.
 * Stores the full CombatEncounter (with combatants, HP, status effects)
 * under `campaigns/{campaignId}/combat/active`.
 *
 * The combat log is stored separately under `campaigns/{campaignId}/combat/log/{logId}`
 * to avoid hitting the 1MB document limit on large sessions.
 *
 * OPTIMIZATION (Sprint 6):
 *   - `listenActiveEncounter` and `listenCombatLog` no longer return
 *     `Promise<Unsubscribe> as unknown as Unsubscribe`. Now return sync
 *     `Unsubscribe` with internal async safety.
 *   - Added `cancelled` guard to prevent callback after unsubscribe.
 *   - Added error listeners to all onSnapshot calls.
 */

import {
  doc,
  collection,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  addDoc,
  query,
  orderBy,
  limit,
  Timestamp,
  type Unsubscribe,
} from "firebase/firestore";
import { getFirestoreDb } from "../firebase";
import type { CombatEncounter, CombatLogEntry } from "@/types";
import { fromFirestore, toFirestore, CAMPAIGN_COLLECTION } from "./helpers";

// ── Paths ─────────────────────────────────────────────────────

function combatActivePath(campaignId: string): string {
  return `${CAMPAIGN_COLLECTION}/${campaignId}/combat/active`;
}

function combatLogPath(campaignId: string): string {
  return `${CAMPAIGN_COLLECTION}/${campaignId}/combat/log`;
}

// ── Active Encounter ─────────────────────────────────────────

export async function getActiveEncounter(campaignId: string): Promise<CombatEncounter | null> {
  const db = await getFirestoreDb();
  const snap = await getDoc(doc(db, combatActivePath(campaignId)));
  if (!snap.exists()) return null;
  return fromFirestore<CombatEncounter>(snap.id, snap.data());
}

export async function setActiveEncounter(
  campaignId: string,
  encounter: CombatEncounter
): Promise<void> {
  const db = await getFirestoreDb();
  await setDoc(doc(db, combatActivePath(campaignId)), toFirestore(encounter), { merge: true });
}

export async function deleteActiveEncounter(campaignId: string): Promise<void> {
  const db = await getFirestoreDb();
  await deleteDoc(doc(db, combatActivePath(campaignId)));
}

/**
 * Listens for real-time changes to the active combat encounter.
 *
 * OPTIMIZATION: Returns sync Unsubscribe immediately with internal
 * async safety and cancelled guard.
 */
export function listenActiveEncounter(
  campaignId: string,
  callback: (encounter: CombatEncounter | null) => void
): Unsubscribe {
  let unsub: Unsubscribe | null = null;
  let cancelled = false;

  getFirestoreDb()
    .then((db) => {
      if (cancelled) return;
      unsub = onSnapshot(
        doc(db, combatActivePath(campaignId)),
        (snap) => {
          if (cancelled) return;
          callback(snap.exists() ? fromFirestore<CombatEncounter>(snap.id, snap.data()) : null);
        },
        (err) => {
          console.warn("[Firestore/Combat] Listener error:", err);
          if (!cancelled) callback(null);
        }
      );
    })
    .catch((err) => {
      if (!cancelled) {
        console.warn("[Firestore/Combat] Failed to initialize:", err);
        callback(null);
      }
    });

  return () => {
    cancelled = true;
    if (unsub) unsub();
  };
}

// ── Combat Log ──────────────────────────────────────────────

export async function addLogEntry(
  campaignId: string,
  entry: CombatLogEntry
): Promise<string> {
  const db = await getFirestoreDb();
  const docRef = await addDoc(collection(db, combatLogPath(campaignId)), {
    ...entry,
    timestamp: Timestamp.fromMillis(entry.timestamp),
    createdAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function getRecentLogEntries(
  campaignId: string,
  limitCount: number = 50
): Promise<CombatLogEntry[]> {
  const db = await getFirestoreDb();
  const q = query(
    collection(db, combatLogPath(campaignId)),
    orderBy("timestamp", "desc"),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => fromFirestore<CombatLogEntry>(d.id, d.data()))
    .sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Subscribe to recent combat log entries in real-time.
 *
 * OPTIMIZATION: Returns sync Unsubscribe immediately with internal
 * async safety, `cancelled` guard, and error listener.
 */
export function listenCombatLog(
  campaignId: string,
  callback: (entries: CombatLogEntry[]) => void,
  limitCount: number = 50
): Unsubscribe {
  let unsub: Unsubscribe | null = null;
  let cancelled = false;

  getFirestoreDb()
    .then((db) => {
      if (cancelled) return;
      const q = query(
        collection(db, combatLogPath(campaignId)),
        orderBy("timestamp", "desc"),
        limit(limitCount)
      );
      unsub = onSnapshot(
        q,
        (snap) => {
          if (cancelled) return;
          const entries = snap.docs
            .map((d) => fromFirestore<CombatLogEntry>(d.id, d.data()))
            .sort((a, b) => a.timestamp - b.timestamp);
          callback(entries);
        },
        (err) => {
          console.warn("[Firestore/CombatLog] Listener error:", err);
          if (!cancelled) callback([]);
        }
      );
    })
    .catch((err) => {
      if (!cancelled) {
        console.warn("[Firestore/CombatLog] Failed to initialize:", err);
        callback([]);
      }
    });

  return () => {
    cancelled = true;
    if (unsub) unsub();
  };
}

export async function clearCombatLog(campaignId: string): Promise<void> {
  const db = await getFirestoreDb();
  const snap = await getDocs(collection(db, combatLogPath(campaignId)));
  const batch = snap.docs.map((d) => deleteDoc(d.ref));
  await Promise.all(batch);
}
