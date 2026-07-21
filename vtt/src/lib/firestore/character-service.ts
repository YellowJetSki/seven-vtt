/**
 * STᚱ VTT — Firestore Character Service
 *
 * CRUD + real-time listener for the PlayerCharacter subcollection.
 *
 * OPTIMIZATION (Sprint 6):
 *   - Fixed `listenCharacters` returning `Promise<Unsubscribe> as unknown as Unsubscribe`
 *     (a dangerous TypeScript anti-pattern that masks promise rejections).
 *   - Now returns a sync `Unsubscribe` function immediately, with async init inside.
 *   - Added cleanup guard so callback is never called after unsubscription.
 *   - Added error listener to prevent silent subscription failures.
 */

import { collection, doc, getDoc, getDocs, setDoc, deleteDoc, onSnapshot, writeBatch } from "firebase/firestore";
import type { QuerySnapshot, Unsubscribe } from "firebase/firestore";
import { getFirestoreDb } from "../firebase";
import type { PlayerCharacter } from "@/types";
import { toFirestore, fromFirestore, CAMPAIGN_COLLECTION } from "./helpers";

function charactersPath(campaignId: string): string {
  return `${CAMPAIGN_COLLECTION}/${campaignId}/characters`;
}

export async function getCharacters(campaignId: string): Promise<PlayerCharacter[]> {
  const db = await getFirestoreDb();
  const snap = await getDocs(collection(db, charactersPath(campaignId)));
  return snap.docs.map((d) => fromFirestore<PlayerCharacter>(d.id, d.data()));
}

export async function getCharacter(campaignId: string, charId: string): Promise<PlayerCharacter | null> {
  const db = await getFirestoreDb();
  const snap = await getDoc(doc(db, charactersPath(campaignId), charId));
  if (!snap.exists()) return null;
  return fromFirestore<PlayerCharacter>(snap.id, snap.data());
}

export async function setCharacter(
  campaignId: string,
  charId: string,
  character: PlayerCharacter
): Promise<void> {
  const db = await getFirestoreDb();
  await setDoc(doc(db, charactersPath(campaignId), charId), toFirestore(character), { merge: true });
}

export async function deleteCharacter(campaignId: string, charId: string): Promise<void> {
  const db = await getFirestoreDb();
  await deleteDoc(doc(db, charactersPath(campaignId), charId));
}

/**
 * Subscribe to real-time character updates.
 *
 * OPTIMIZATION: Returns a sync unsubscribe function immediately.
 * The async DB initialization happens internally with proper
 * cleanup — if the hook unmounts before init completes, the
 * stored unsubscribe will no-op safely.
 */
export function listenCharacters(
  campaignId: string,
  callback: (characters: PlayerCharacter[]) => void
): Unsubscribe {
  let unsub: Unsubscribe | null = null;
  let cancelled = false;

  getFirestoreDb()
    .then((db) => {
      if (cancelled) return;
      unsub = onSnapshot(
        collection(db, charactersPath(campaignId)),
        (snap: QuerySnapshot) => {
          if (cancelled) return;
          callback(snap.docs.map((d) => fromFirestore<PlayerCharacter>(d.id, d.data())));
        },
        (err) => {
          console.warn("[Firestore/Characters] Listener error:", err);
          // CRITICAL: Do NOT call callback([]) on transient connection blips.
          // The retry mechanism in useFirestoreSync will reconnect and restore data.
          // Clearing characters here would wipe Zustand state and localStorage persist,
          // causing a "No characters" flash during live sessions.
        }
      );
    })
    .catch((err) => {
      if (!cancelled) {
        console.warn("[Firestore/Characters] Failed to initialize:", err);
        callback([]);
      }
    });

  return () => {
    cancelled = true;
    if (unsub) unsub();
  };
}

/**
 * Batch-write all characters in a single Firestore transaction.
 * Use during initial sync or bulk import to minimize write operations.
 */
export async function batchSetCharacters(
  campaignId: string,
  characters: PlayerCharacter[]
): Promise<void> {
  const db = await getFirestoreDb();
  const batch = writeBatch(db);
  for (const char of characters) {
    batch.set(doc(db, charactersPath(campaignId), char.id), toFirestore(char), { merge: true });
  }
  await batch.commit();
}
