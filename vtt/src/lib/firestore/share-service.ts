/**
 * ST R VTT — DM Share Service
 *
 * Real-time image sharing for the DM's external display / player screens.
 * The DM can:
 *   1. Push any image/map to appear as a fullscreen overlay on all player screens
 *   2. Tie the shared image into the inventory system for loot deposit
 *
 * Firestore document structure:
 *   campaigns/{campaignId}/dm-share/active
 *     - id: string ("active")
 *     - imageUrl: string
 *     - title: string
 *     - description: string
 *     - type: "image" | "map" | "item" | "handout"
 *     - sharedAt: number (timestamp)
 *     - sharedBy: string (DM username)
 *     - isDismissed: boolean (player-side flag)
 *     - inventoryPayload?: { name, quantity, weight, description }
 *     - targetPlayerId?: string
 *
 * IMPORTANT: This module must NOT import from @/hooks/useFirestoreSync
 * or any module that imports from firestore-service.ts to avoid
 * circular dependency issues in the module evaluation chain.
 */

import { getFirestoreDb } from "@/lib/firebase";

// ── Types ─────────────────────────────────────────────────

export interface DmSharePayload {
  id: string;
  imageUrl: string;
  title: string;
  description: string;
  type: "image" | "map" | "item" | "handout";
  sharedAt: number;
  sharedBy: string;
  isDismissed: boolean;
  inventoryPayload?: {
    name: string;
    quantity: number;
    weight: number;
    description: string;
  };
  targetPlayerId?: string;
}

const FALLBACK_CAMPAIGN_ID = "arkla-campaign";
const SHARE_DOC_ID = "active";
const SHARE_COLLECTION = `campaigns/${FALLBACK_CAMPAIGN_ID}/dm-share`;

// ── Lazy DB getter (matches pattern from character-service, entity-service, etc.) ──

async function getShareDocRef() {
  const db = await getFirestoreDb();
  const { doc } = await import("firebase/firestore");
  return doc(db, SHARE_COLLECTION, SHARE_DOC_ID);
}

/**
 * Set a new DM share payload. This triggers an onSnapshot listener
 * on all player screens showing the fullscreen modal.
 */
export async function setDmShare(payload: Omit<DmSharePayload, "id" | "sharedAt" | "isDismissed">): Promise<void> {
  const { setDoc } = await import("firebase/firestore");
  const ref = await getShareDocRef();
  await setDoc(ref, {
    ...payload,
    id: SHARE_DOC_ID,
    sharedAt: Date.now(),
    isDismissed: false,
    sharedBy: payload.sharedBy || "DM",
  } satisfies DmSharePayload);
}

/**
 * Dismiss the share on the player's side — sets isDismissed=true.
 * Players can tap "Dismiss" to close the fullscreen overlay.
 */
export async function dismissDmShare(): Promise<void> {
  const { updateDoc } = await import("firebase/firestore");
  const ref = await getShareDocRef();
  await updateDoc(ref, { isDismissed: true });
}

/**
 * Subscribe to DM share state. Returns unsubscribe function.
 * Player components call this to show/hide the fullscreen modal.
 */
export function listenDmShare(
  onShare: (payload: DmSharePayload | null) => void
): () => void {
  let unsub: (() => void) | null = null;

  getShareDocRef().then((ref) => {
    import("firebase/firestore").then(({ onSnapshot }) => {
      unsub = onSnapshot(ref, (snap) => {
        if (snap.exists()) {
          const data = snap.data() as DmSharePayload;
          if (data && typeof data.imageUrl === "string") {
            onShare(data);
          } else {
            onShare(null);
          }
        } else {
          onShare(null);
        }
      });
    });
  });

  return () => {
    if (unsub) unsub();
  };
}

/**
 * Remove the DM share document completely (clear state).
 */
export async function clearDmShare(): Promise<void> {
  const { deleteDoc } = await import("firebase/firestore");
  const ref = await getShareDocRef();
  await deleteDoc(ref).catch(() => {
    // Document might not exist, that's fine
  });
}
