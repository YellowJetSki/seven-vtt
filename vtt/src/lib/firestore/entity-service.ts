import {
  collection, doc, getDocs, setDoc, deleteDoc, writeBatch, onSnapshot,
  type Unsubscribe,
} from "firebase/firestore";
import { getFirestoreDb } from "../firebase";
import type { EnemyDoc, Encounter, BattleMap, MapToken, JournalEntry } from "@/types";
import { toFirestore, fromFirestore, CAMPAIGN_COLLECTION } from "./helpers";

// ── Enemies ───────────────────────────────────────────────────

function enemiesPath(campaignId: string): string {
  return `${CAMPAIGN_COLLECTION}/${campaignId}/enemies`;
}

export async function getEnemies(campaignId: string): Promise<EnemyDoc[]> {
  const db = await getFirestoreDb();
  const snap = await getDocs(collection(db, enemiesPath(campaignId)));
  return snap.docs.map((d) => fromFirestore<EnemyDoc>(d.id, d.data()));
}

export async function setEnemy(campaignId: string, enemyId: string, enemy: EnemyDoc): Promise<void> {
  const db = await getFirestoreDb();
  await setDoc(doc(db, enemiesPath(campaignId), enemyId), toFirestore(enemy), { merge: true });
}

// ── Encounters ────────────────────────────────────────────────

function encountersPath(campaignId: string): string {
  return `${CAMPAIGN_COLLECTION}/${campaignId}/encounters`;
}

export async function getEncounters(campaignId: string): Promise<Encounter[]> {
  const db = await getFirestoreDb();
  const snap = await getDocs(collection(db, encountersPath(campaignId)));
  return snap.docs.map((d) => fromFirestore<Encounter>(d.id, d.data()));
}

export async function setEncounter(campaignId: string, encId: string, encounter: Encounter): Promise<void> {
  const db = await getFirestoreDb();
  await setDoc(doc(db, encountersPath(campaignId), encId), toFirestore(encounter), { merge: true });
}

// ── Battle Maps ───────────────────────────────────────────────

function mapsPath(campaignId: string): string {
  return `${CAMPAIGN_COLLECTION}/${campaignId}/maps`;
}

export async function getBattleMaps(campaignId: string): Promise<BattleMap[]> {
  const db = await getFirestoreDb();
  const snap = await getDocs(collection(db, mapsPath(campaignId)));
  return snap.docs.map((d) => fromFirestore<BattleMap>(d.id, d.data()));
}

export async function setBattleMap(campaignId: string, mapId: string, map: BattleMap): Promise<void> {
  const db = await getFirestoreDb();
  await setDoc(doc(db, mapsPath(campaignId), mapId), toFirestore(map), { merge: true });
}

export async function deleteBattleMap(campaignId: string, mapId: string): Promise<void> {
  const db = await getFirestoreDb();
  await deleteDoc(doc(db, mapsPath(campaignId), mapId));
}

// ── Map Tokens ────────────────────────────────────────────────

function tokensPath(campaignId: string, mapId: string): string {
  return `${CAMPAIGN_COLLECTION}/${campaignId}/maps/${mapId}/tokens`;
}

export async function getMapTokens(campaignId: string, mapId: string): Promise<MapToken[]> {
  const db = await getFirestoreDb();
  const snap = await getDocs(collection(db, tokensPath(campaignId, mapId)));
  return snap.docs.map((d) => fromFirestore<MapToken>(d.id, d.data()));
}

export async function setMapToken(
  campaignId: string, mapId: string, tokenId: string, token: MapToken
): Promise<void> {
  const db = await getFirestoreDb();
  await setDoc(doc(db, tokensPath(campaignId, mapId), tokenId), toFirestore(token), { merge: true });
}

export async function deleteMapToken(
  campaignId: string, mapId: string, tokenId: string
): Promise<void> {
  const db = await getFirestoreDb();
  await deleteDoc(doc(db, tokensPath(campaignId, mapId), tokenId));
}

/**
 * Listens for real-time changes to all map tokens for a given map.
 *
 * OPTIMIZATION (Sprint 6): Added `cancelled` guard to prevent callback
 * after unsubscribe. Added error listener for subscription failures.
 * Returns sync Unsubscribe immediately with internal async safety.
 */
export function listenMapTokens(
  campaignId: string,
  mapId: string,
  callback: (tokens: MapToken[]) => void
): Unsubscribe {
  let unsub: Unsubscribe | null = null;
  let cancelled = false;

  getFirestoreDb()
    .then((db) => {
      if (cancelled) return;
      unsub = onSnapshot(
        collection(db, tokensPath(campaignId, mapId)),
        (snap) => {
          if (cancelled) return;
          callback(snap.docs.map((d) => fromFirestore<MapToken>(d.id, d.data())));
        },
        (err) => {
          console.warn("[Firestore/Tokens] Listener error:", err);
          if (!cancelled) callback([]);
        }
      );
    })
    .catch((err) => {
      if (!cancelled) {
        console.warn("[Firestore/Tokens] Failed to initialize:", err);
        callback([]);
      }
    });

  return () => {
    cancelled = true;
    if (unsub) unsub();
  };
}

// ── Journal ───────────────────────────────────────────────────

function journalPath(campaignId: string): string {
  return `${CAMPAIGN_COLLECTION}/${campaignId}/journal`;
}

export async function getJournal(campaignId: string): Promise<JournalEntry[]> {
  const db = await getFirestoreDb();
  const snap = await getDocs(collection(db, journalPath(campaignId)));
  return snap.docs.map((d) => fromFirestore<JournalEntry>(d.id, d.data()));
}

export async function setJournalEntry(campaignId: string, entryId: string, entry: JournalEntry): Promise<void> {
  const db = await getFirestoreDb();
  await setDoc(doc(db, journalPath(campaignId), entryId), toFirestore(entry), { merge: true });
}

// ── Batch / Utility ───────────────────────────────────────────

export async function clearSubcollection(campaignId: string, subcollection: string): Promise<void> {
  const db = await getFirestoreDb();
  const snap = await getDocs(collection(db, `${CAMPAIGN_COLLECTION}/${campaignId}/${subcollection}`));
  if (snap.empty) return;
  const batch = writeBatch(db);
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
}
