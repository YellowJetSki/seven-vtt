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

/**
 * Safe campaign meta listener — returns a sync Unsubscribe immediately.
 * Uses the same `cancelled` guard pattern as the other service functions.
 */
export function listenCampaignMeta(
  campaignId: string,
  callback: (meta: CampaignMeta | null) => void
): Unsubscribe {
  let unsub: Unsubscribe | null = null;
  let cancelled = false;

  getFirestoreDb()
    .then((db) => {
      if (cancelled) return;
      unsub = onSnapshot(
        doc(db, CAMPAIGN_COLLECTION, campaignId),
        (snap) => {
          if (cancelled) return;
          callback(snap.exists() ? fromFirestore<CampaignMeta>(snap.id, snap.data()) : null);
        },
        (err) => {
          console.warn("[Firestore/CampaignMeta] Listener error:", err);
          if (!cancelled) callback(null);
        }
      );
    })
    .catch((err) => {
      console.warn("[Firestore/CampaignMeta] Init error:", err);
      if (!cancelled) callback(null);
    });

  return () => {
    cancelled = true;
    if (unsub) unsub();
  };
}
