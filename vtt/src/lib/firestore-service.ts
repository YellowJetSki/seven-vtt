import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  DocumentData,
  QuerySnapshot,
  Unsubscribe,
  writeBatch,
  Timestamp,
} from "firebase/firestore";
import { getFirestoreDb } from "./firebase";
import type {
  CampaignMeta,
  PlayerCharacter,
  EnemyDoc,
  Encounter,
  BattleMap,
  MapToken,
  JournalEntry,
} from "@/types";

// ── Helpers ──────────────────────────────────────────────────

function now(): number {
  return Date.now();
}

function serverTimestamp(): Timestamp {
  return Timestamp.now();
}

function toFirestore<T extends DocumentData>(data: T): T & { updatedAt: number } {
  return { ...data, updatedAt: now() };
}

function fromFirestore<T>(id: string, data: DocumentData): T & { id: string } {
  return { id, ...data } as T & { id: string };
}

// ── Campaign Meta ─────────────────────────────────────────────

const CAMPAIGN_COLLECTION = "campaigns";

export async function getCampaignMeta(campaignId: string): Promise<CampaignMeta | null> {
  const db = await getFirestoreDb();
  const snap = await getDoc(doc(db, CAMPAIGN_COLLECTION, campaignId));
  if (!snap.exists()) return null;
  return fromFirestore<CampaignMeta>(snap.id, snap.data());
}

export async function setCampaignMeta(
  campaignId: string,
  meta: CampaignMeta
): Promise<void> {
  const db = await getFirestoreDb();
  await setDoc(doc(db, CAMPAIGN_COLLECTION, campaignId), toFirestore(meta), {
    merge: true,
  });
}

export function listenCampaignMeta(
  campaignId: string,
  callback: (meta: CampaignMeta | null) => void
): Unsubscribe {
  return new Promise<Unsubscribe>(async (resolve) => {
    const db = await getFirestoreDb();
    const unsub = onSnapshot(doc(db, CAMPAIGN_COLLECTION, campaignId), (snap) => {
      if (snap.exists()) {
        callback(fromFirestore<CampaignMeta>(snap.id, snap.data()));
      } else {
        callback(null);
      }
    });
    resolve(unsub);
  }) as unknown as Unsubscribe;
}

// ── Characters (subcollection) ────────────────────────────────

function charactersPath(campaignId: string): string {
  return `${CAMPAIGN_COLLECTION}/${campaignId}/characters`;
}

export async function getCharacters(campaignId: string): Promise<PlayerCharacter[]> {
  const db = await getFirestoreDb();
  const snap = await getDocs(collection(db, charactersPath(campaignId)));
  return snap.docs.map((d) => fromFirestore<PlayerCharacter>(d.id, d.data()));
}

export async function getCharacter(
  campaignId: string,
  charId: string
): Promise<PlayerCharacter | null> {
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
  await setDoc(doc(db, charactersPath(campaignId), charId), toFirestore(character), {
    merge: true,
  });
}

export async function deleteCharacter(
  campaignId: string,
  charId: string
): Promise<void> {
  const db = await getFirestoreDb();
  await deleteDoc(doc(db, charactersPath(campaignId), charId));
}

export function listenCharacters(
  campaignId: string,
  callback: (characters: PlayerCharacter[]) => void
): Unsubscribe {
  return new Promise<Unsubscribe>(async (resolve) => {
    const db = await getFirestoreDb();
    const unsub = onSnapshot(
      collection(db, charactersPath(campaignId)),
      (snap: QuerySnapshot) => {
        callback(snap.docs.map((d) => fromFirestore<PlayerCharacter>(d.id, d.data())));
      }
    );
    resolve(unsub);
  }) as unknown as Unsubscribe;
}

// ── Enemies (subcollection) ───────────────────────────────────

function enemiesPath(campaignId: string): string {
  return `${CAMPAIGN_COLLECTION}/${campaignId}/enemies`;
}

export async function getEnemies(campaignId: string): Promise<EnemyDoc[]> {
  const db = await getFirestoreDb();
  const snap = await getDocs(collection(db, enemiesPath(campaignId)));
  return snap.docs.map((d) => fromFirestore<EnemyDoc>(d.id, d.data()));
}

export async function setEnemy(
  campaignId: string,
  enemyId: string,
  enemy: EnemyDoc
): Promise<void> {
  const db = await getFirestoreDb();
  await setDoc(doc(db, enemiesPath(campaignId), enemyId), toFirestore(enemy), {
    merge: true,
  });
}

// ── Encounters (subcollection) ────────────────────────────────

function encountersPath(campaignId: string): string {
  return `${CAMPAIGN_COLLECTION}/${campaignId}/encounters`;
}

export async function getEncounters(campaignId: string): Promise<Encounter[]> {
  const db = await getFirestoreDb();
  const snap = await getDocs(collection(db, encountersPath(campaignId)));
  return snap.docs.map((d) => fromFirestore<Encounter>(d.id, d.data()));
}

export async function setEncounter(
  campaignId: string,
  encId: string,
  encounter: Encounter
): Promise<void> {
  const db = await getFirestoreDb();
  await setDoc(doc(db, encountersPath(campaignId), encId), toFirestore(encounter), {
    merge: true,
  });
}

// ── Battle Maps (subcollection) ───────────────────────────────

function mapsPath(campaignId: string): string {
  return `${CAMPAIGN_COLLECTION}/${campaignId}/maps`;
}

export async function getBattleMaps(campaignId: string): Promise<BattleMap[]> {
  const db = await getFirestoreDb();
  const snap = await getDocs(collection(db, mapsPath(campaignId)));
  return snap.docs.map((d) => fromFirestore<BattleMap>(d.id, d.data()));
}

export async function setBattleMap(
  campaignId: string,
  mapId: string,
  map: BattleMap
): Promise<void> {
  const db = await getFirestoreDb();
  await setDoc(doc(db, mapsPath(campaignId), mapId), toFirestore(map), {
    merge: true,
  });
}

export async function deleteBattleMap(
  campaignId: string,
  mapId: string
): Promise<void> {
  const db = await getFirestoreDb();
  await deleteDoc(doc(db, mapsPath(campaignId), mapId));
}

// ── Map Tokens (sub-subcollection) ────────────────────────────

function tokensPath(campaignId: string, mapId: string): string {
  return `${CAMPAIGN_COLLECTION}/${campaignId}/maps/${mapId}/tokens`;
}

export async function getMapTokens(
  campaignId: string,
  mapId: string
): Promise<MapToken[]> {
  const db = await getFirestoreDb();
  const snap = await getDocs(collection(db, tokensPath(campaignId, mapId)));
  return snap.docs.map((d) => fromFirestore<MapToken>(d.id, d.data()));
}

export async function setMapToken(
  campaignId: string,
  mapId: string,
  tokenId: string,
  token: MapToken
): Promise<void> {
  const db = await getFirestoreDb();
  await setDoc(
    doc(db, tokensPath(campaignId, mapId), tokenId),
    toFirestore(token),
    { merge: true }
  );
}

export async function deleteMapToken(
  campaignId: string,
  mapId: string,
  tokenId: string
): Promise<void> {
  const db = await getFirestoreDb();
  await deleteDoc(doc(db, tokensPath(campaignId, mapId), tokenId));
}

// ── Journal (subcollection) ───────────────────────────────────

function journalPath(campaignId: string): string {
  return `${CAMPAIGN_COLLECTION}/${campaignId}/journal`;
}

export async function getJournal(campaignId: string): Promise<JournalEntry[]> {
  const db = await getFirestoreDb();
  const snap = await getDocs(collection(db, journalPath(campaignId)));
  return snap.docs.map((d) => fromFirestore<JournalEntry>(d.id, d.data()));
}

export async function setJournalEntry(
  campaignId: string,
  entryId: string,
  entry: JournalEntry
): Promise<void> {
  const db = await getFirestoreDb();
  await setDoc(doc(db, journalPath(campaignId), entryId), toFirestore(entry), {
    merge: true,
  });
}

// ── Batch Operations ──────────────────────────────────────────

export async function batchSetCharacters(
  campaignId: string,
  characters: PlayerCharacter[]
): Promise<void> {
  const db = await getFirestoreDb();
  const batch = writeBatch(db);
  const path = charactersPath(campaignId);

  for (const char of characters) {
    const ref = doc(db, path, char.id);
    batch.set(ref, toFirestore(char), { merge: true });
  }

  await batch.commit();
}

export async function clearSubcollection(
  campaignId: string,
  subcollection: string
): Promise<void> {
  const db = await getFirestoreDb();
  const snap = await getDocs(collection(db, `${CAMPAIGN_COLLECTION}/${campaignId}/${subcollection}`));
  if (snap.empty) return;

  const batch = writeBatch(db);
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
}
