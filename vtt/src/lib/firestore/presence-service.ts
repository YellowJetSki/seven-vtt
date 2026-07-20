/**
 * STᚱ VTT — Firestore Presence Service (Sprint 10)
 *
 * Player presence tracking for live session awareness.
 * Each connected player writes a presence document that the DM
 * can read to see who's currently logged in.
 *
 * Architecture:
 *   - Each character gets a presence doc under campaign/{id}/presence/{charId}
 *   - Contains: characterId, playerName, lastSeen (server timestamp), role
 *   - Players write on mount, update every 30s (heartbeat), delete on unmount
 *   - DM subscribes via onSnapshot to see live connected players
 *
 * Edge cases:
 *   - Tab close / crash: heartbeat expires after 60s (lastSeen > 60s = disconnected)
 *   - Multiple tabs: last-write-wins — latest heartbeat overwrites
 *   - No character selected: no presence written
 */

import {
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  collection,
  query,
  where,
  type Unsubscribe,
  serverTimestamp,
} from "firebase/firestore";
import { getFirestoreDb } from "../firebase";
import { CAMPAIGN_COLLECTION } from "./helpers";

// ── Types ─────────────────────────────────────────────────────

export interface PlayerPresenceEntry {
  characterId: string;
  playerName: string;
  role: "player" | "dm";
  lastSeen: number; // client timestamp as fallback
  lastSeenServer?: unknown; // server timestamp placeholder
  sessionId: string; // unique session to detect stale entries
}

// ── Paths ─────────────────────────────────────────────────────

function presencePath(campaignId: string, charId?: string): string {
  const base = `${CAMPAIGN_COLLECTION}/${campaignId}/presence`;
  return charId ? `${base}/${charId}` : base;
}

// ── Write Presence ────────────────────────────────────────────

const SESSION_ID = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

/**
 * Write a heartbeat for the current character/player.
 * Called on mount and every 30s while the player tab is open.
 */
export async function writePresence(
  campaignId: string,
  characterId: string,
  playerName: string,
  role: "player" | "dm"
): Promise<void> {
  try {
    const db = await getFirestoreDb();
    await setDoc(
      doc(db, presencePath(campaignId, characterId)),
      {
        characterId,
        playerName,
        role,
        lastSeen: Date.now(),
        lastSeenServer: serverTimestamp(),
        sessionId: SESSION_ID,
      },
      { merge: true }
    );
  } catch (err) {
    console.warn("[Presence] Failed to write heartbeat:", err);
  }
}

/**
 * Remove presence on unmount/logout.
 */
export async function removePresence(
  campaignId: string,
  characterId: string
): Promise<void> {
  try {
    const db = await getFirestoreDb();
    await deleteDoc(doc(db, presencePath(campaignId, characterId)));
  } catch (err) {
    console.warn("[Presence] Failed to remove:", err);
  }
}

// ── Subscribe to Presence ─────────────────────────────────────

/**
 * Listen for all active presence entries.
 * Entries older than 90s are filtered out (stale/crashed tabs).
 */
export function listenPresence(
  campaignId: string | null,
  callback: (entries: PlayerPresenceEntry[]) => void
): Unsubscribe {
  let unsub: Unsubscribe | null = null;
  let cancelled = false;

  if (!campaignId) {
    // No campaign → empty list
    callback([]);
    return () => { cancelled = true; };
  }

  getFirestoreDb()
    .then((db) => {
      if (cancelled) return;
      const q = query(
        collection(db, presencePath(campaignId)),
        where("lastSeen", ">", Date.now() - 90000)
      );
      unsub = onSnapshot(
        q,
        (snap) => {
          if (cancelled) return;
          const now = Date.now();
          const entries: PlayerPresenceEntry[] = [];
          snap.docs.forEach((d) => {
            const data = d.data() as PlayerPresenceEntry;
            // Client-side stale filter (for immediate tab-reload detection)
            if (data.lastSeen && data.lastSeen > now - 90000) {
              entries.push(data);
            }
          });
          callback(entries);
        },
        (err) => {
          console.warn("[Presence] Listener error:", err);
          if (!cancelled) callback([]);
        }
      );
    })
    .catch((err) => {
      if (!cancelled) {
        console.warn("[Presence] Init error:", err);
        callback([]);
      }
    });

  return () => {
    cancelled = true;
    if (unsub) unsub();
  };
}

/**
 * Get current session ID for debugging.
 */
export function getSessionId(): string {
  return SESSION_ID;
}
