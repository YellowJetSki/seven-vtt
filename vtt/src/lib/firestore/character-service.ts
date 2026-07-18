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

export async function setCharacter(campaignId: string, charId: string, character: PlayerCharacter): Promise<void> {
  const db = await getFirestoreDb();
  await setDoc(doc(db, charactersPath(campaignId), charId), toFirestore(character), { merge: true });
}

export async function deleteCharacter(campaignId: string, charId: string): Promise<void> {
  const db = await getFirestoreDb();
  await deleteDoc(doc(db, charactersPath(campaignId), charId));
}

export function listenCharacters(campaignId: string, callback: (characters: PlayerCharacter[]) => void): Unsubscribe {
  return new Promise<Unsubscribe>(async (resolve) => {
    const db = await getFirestoreDb();
    const unsub = onSnapshot(collection(db, charactersPath(campaignId)), (snap: QuerySnapshot) => {
      callback(snap.docs.map((d) => fromFirestore<PlayerCharacter>(d.id, d.data())));
    });
    resolve(unsub);
  }) as unknown as Unsubscribe;
}

export async function batchSetCharacters(campaignId: string, characters: PlayerCharacter[]): Promise<void> {
  const db = await getFirestoreDb();
  const batch = writeBatch(db);
  for (const char of characters) {
    batch.set(doc(db, charactersPath(campaignId), char.id), toFirestore(char), { merge: true });
  }
  await batch.commit();
}
