import { collection, doc, getDoc, getDocs, setDoc, deleteDoc, onSnapshot, writeBatch } from "firebase/firestore";
import type { DocumentData, QuerySnapshot, Unsubscribe } from "firebase/firestore";
import { getFirestoreDb } from "../firebase";
import type { CampaignMeta, PlayerCharacter, EnemyDoc, Encounter, BattleMap, MapToken, JournalEntry } from "@/types";
import { toFirestore, fromFirestore, CAMPAIGN_COLLECTION } from "./helpers";

// ── Campaign Meta ─────────────────────────────────────────────

export async function getCampaignMeta(campaignId: string): Promise<CampaignMeta | null> {
  const db = await getFirestoreDb();
  const snap = await getDoc(doc(db, CAMPAIGN_COLLECTION, campaignId));
  if (!snap.exists()) return null;
  return fromFirestore<CampaignMeta>(snap.id, snap.data());
}

export async function setCampaignMeta(campaignId: string, meta: CampaignMeta): Promise<void> {
  const db = await getFirestoreDb();
  await setDoc(doc(db, CAMPAIGN_COLLECTION, campaignId), toFirestore(meta), { merge: true });
}

export function listenCampaignMeta(campaignId: string, callback: (meta: CampaignMeta | null) => void): Unsubscribe {
  return new Promise<Unsubscribe>(async (resolve) => {
    const db = await getFirestoreDb();
    const unsub = onSnapshot(doc(db, CAMPAIGN_COLLECTION, campaignId), (snap) => {
      callback(snap.exists() ? fromFirestore<CampaignMeta>(snap.id, snap.data()) : null);
    });
    resolve(unsub);
  }) as unknown as Unsubscribe;
}
