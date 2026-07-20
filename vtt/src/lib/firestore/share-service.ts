/**
 * STᚱ VTT — DM Share Service (Optimized)
 *
 * Real-time image sharing for the DM's external display / player screens.
 *
 * OPTIMIZATION (Sprint 6): Replaced all dynamic `import("firebase/firestore")`
 * with static top-level imports, resolving the Vite chunk warning and
 * eliminating 5 unnecessary async import operations per function call.
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
 *     - isDismissed: boolean
 *     - inventoryPayload?: { name, quantity, weight, description }
 *     - targetPlayerId?: string
 *
 * IMPORTANT: Must NOT import from @/hooks/useFirestoreSync or
 * any module that imports from firestore-service.ts to avoid
 * circular dependency in the module evaluation chain.
 */

import { doc, setDoc, updateDoc, deleteDoc, onSnapshot } from "firebase/firestore";
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

// ── Lazy DB getter ────────────────────────────────────────
// Still uses async getFirestoreDb() because Firebase initializes lazily,
// but we now use static imports of doc/setDoc/etc. instead of dynamic ones.

async function getShareDocRef() {
  const db = await getFirestoreDb();
  return doc(db, SHARE_COLLECTION, SHARE_DOC_ID);
}

/**
 * Set a new DM share payload. This triggers an onSnapshot listener
 * on all player screens showing the fullscreen modal.
 */
export async function setDmShare(
  payload: Omit<DmSharePayload, "id" | "sharedAt" | "isDismissed">
): Promise<void> {
  const ref = await getShareDocRef();
  await setDoc(
    ref,
    {
      ...payload,
      id: SHARE_DOC_ID,
      sharedAt: Date.now(),
      isDismissed: false,
      sharedBy: payload.sharedBy || "DM",
    } satisfies DmSharePayload
  );
}

/**
 * Dismiss the share on the player's side — sets isDismissed=true.
 */
export async function dismissDmShare(): Promise<void> {
  const ref = await getShareDocRef();
  await updateDoc(ref, { isDismissed: true });
}

/**
 * Subscribe to DM share state. Returns unsubscribe function.
 *
 * OPTIMIZATION: onSnapshot listener is set directly after db init,
 * eliminating the nested dynamic import chain. Error listener added
 * to prevent silent failures.
 */
export function listenDmShare(
  onShare: (payload: DmSharePayload | null) => void
): () => void {
  let unsub: (() => void) | null = null;

  getShareDocRef()
    .then((ref) => {
      unsub = onSnapshot(
        ref,
        (snap) => {
          if (snap.exists()) {
            const data = snap.data() as DmSharePayload;
            onShare(data && typeof data.imageUrl === "string" ? data : null);
          } else {
            onShare(null);
          }
        },
        (err) => {
          console.warn("[Firestore/Share] Listener error:", err);
          onShare(null);
        }
      );
    })
    .catch((err) => {
      console.warn("[Firestore/Share] Failed to initialize listener:", err);
    });

  return () => {
    if (unsub) unsub();
  };
}

/**
 * Remove the DM share document completely (clear state).
 */
export async function clearDmShare(): Promise<void> {
  const ref = await getShareDocRef();
  await deleteDoc(ref).catch(() => {
    // Document might not exist, that's fine
  });
}
