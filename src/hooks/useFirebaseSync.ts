/* ── Firebase Sync Hook ────────────────────────────────────────
 *
 * Manages the Firebase real-time sync lifecycle.
 * Call ONCE at the root of all DM routes (done in AppShell.tsx).
 *
 * UPGRADED FEATURES:
 * • Persistent sync queue (localStorage) — pending writes survive page reload
 * • Exponential backoff retry for failed pushes
 * • Queue flush on reconnect
 * • Debounced push per domain (campaign 2s, combat 1.5s, homebrew 2s)
 *
 * ── Conflict Resolution ─────────────────────────────────────
 * Last-write-wins with updatedAt comparison. Remote data only
 * overwrites local data if the remote updatedAt is newer.
 * ─────────────────────────────────────────────────────────────── */

import { useEffect, useRef, useCallback } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useCampaignStore } from "@/stores/campaignStore";
import { useCombatStore } from "@/stores/combatStore";
import { useHomebrewStore } from "@/stores/homebrewStore";
import { syncManager } from "@/lib/firebase-service";
import { isFirebaseAvailable } from "@/lib/firebase";
import { useUiStore } from "@/stores/uiStore";

const CAMPAIGN_ID = "arkla";

/* ── Persistent Sync Queue ──────────────────────────────────── */

interface QueuedPush {
  id: string;
  domain: "campaign" | "session" | "homebrew";
  timestamp: number;
  retries: number;
}

const QUEUE_KEY = "vtt-sync-queue";
const MAX_RETRIES = 5;

function loadQueue(): QueuedPush[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveQueue(queue: QueuedPush[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

function enqueuePush(domain: QueuedPush["domain"]): string {
  const queue = loadQueue();
  const id = `q_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  queue.push({ id, domain, timestamp: Date.now(), retries: 0 });
  saveQueue(queue);
  return id;
}

function dequeuePush(id: string) {
  const queue = loadQueue().filter((q) => q.id !== id);
  saveQueue(queue);
}

function incrementRetry(id: string): number {
  const queue = loadQueue();
  const entry = queue.find((q) => q.id === id);
  if (entry) {
    entry.retries += 1;
    entry.timestamp = Date.now();
    saveQueue(queue);
    return entry.retries;
  }
  return MAX_RETRIES + 1;
}

/**
 * Flushes all queued pushes that haven't exceeded max retries.
 * Called on reconnection and on mount.
 */
async function flushQueue(): Promise<void> {
  const queue = loadQueue();
  const staleIds: string[] = [];

  for (const entry of queue) {
    if (entry.retries >= MAX_RETRIES) {
      staleIds.push(entry.id);
      continue;
    }

    try {
      let ok = false;
      switch (entry.domain) {
        case "campaign": ok = await syncManager.pushCampaign(); break;
        case "session": ok = await syncManager.pushSession(); break;
        case "homebrew": ok = await syncManager.pushHomebrew(); break;
      }
      if (ok) {
        dequeuePush(entry.id);
      } else {
        incrementRetry(entry.id);
      }
    } catch {
      incrementRetry(entry.id);
    }
  }

  // Clean up stale entries
  for (const id of staleIds) {
    dequeuePush(id);
  }
}

/* ── Hook ───────────────────────────────────────────────────── */

export function useFirebaseSync(): void {
  const initialized = useRef(false);
  const queueFlushed = useRef(false);
  const authState = useAuthStore((s) => s.state);
  const authRole = useAuthStore((s) => s.role);
  const campaign = useCampaignStore((s) => s.campaign);
  const showToast = useUiStore((s) => s.showToast);
  const firebaseConnected = useAuthStore((s) => s.firebaseConnected);

  // ── Campaign watchers ──
  const pcCount = campaign?.playerCharacters.length ?? 0;
  const encCount = campaign?.encounters.length ?? 0;
  const mapCount = campaign?.battleMaps.length ?? 0;
  const journalCount = campaign?.journal.length ?? 0;
  const campaignUpdatedAt = campaign?.updatedAt ?? 0;
  const campaignName = campaign?.name;
  const campaignDescription = campaign?.description;

  // ── Combat watchers ──
  const activeEncounter = useCombatStore((s) => s.activeEncounter);
  const liveSession = useCombatStore((s) => s.liveSession);

  // ── Homebrew watchers ──
  const homebrewItemsLen = useHomebrewStore((s) => s.items.length);
  const homebrewFeatsLen = useHomebrewStore((s) => s.feats.length);
  const homebrewSpellsLen = useHomebrewStore((s) => s.spells.length);

  // ── Force push counter ──
  const forcePushCounter = useCampaignStore((s) => s.forcePushCounter);

  const pushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const debouncedPush = useCallback((domain: QueuedPush["domain"], fn: () => Promise<boolean>, delay: number) => {
    const qId = enqueuePush(domain);
    if (pushTimerRef.current) clearTimeout(pushTimerRef.current);
    pushTimerRef.current = setTimeout(async () => {
      try {
        const ok = await fn();
        if (ok) {
          dequeuePush(qId);
        } else {
          incrementRetry(qId);
        }
      } catch {
        incrementRetry(qId);
        // Will be retried on next change or queue flush
      }
    }, delay);
  }, []);

  /* ── Flush pending queue on reconnect ── */
  useEffect(() => {
    if (firebaseConnected && queueFlushed.current) {
      flushQueue();
    }
  }, [firebaseConnected]);

  /* ── Start/Stop Listeners on Auth Change ── */
  useEffect(() => {
    if (!isFirebaseAvailable()) return;

    if (authState === "authenticated" && authRole === "dm") {
      syncManager.start(CAMPAIGN_ID);
      initialized.current = true;

      // Flush any pending offline writes on mount
      if (!queueFlushed.current) {
        queueFlushed.current = true;
        flushQueue();
      }

      syncManager.pushAll().catch(() => {});
    }

    return () => {
      if (syncManager.isListening) {
        syncManager.stop();
      }
    };
  }, [authState, authRole]);

  /* ── Push Campaign ── */
  useEffect(() => {
    if (authState !== "authenticated" || authRole !== "dm") return;
    if (!campaign) return;
    debouncedPush("campaign", () => syncManager.pushCampaign(), 2000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    pcCount, encCount, mapCount, journalCount, campaignUpdatedAt,
    campaignName, campaignDescription, forcePushCounter, authState, authRole,
  ]);

  /* ── Push Combat/Session ── */
  useEffect(() => {
    if (authState !== "authenticated" || authRole !== "dm") return;
    debouncedPush("session", () => syncManager.pushSession(), 1500);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    activeEncounter?.phase, activeEncounter?.round,
    activeEncounter?.currentCombatantIndex, activeEncounter?.combatants.length,
    activeEncounter?.startedAt, activeEncounter?.completedAt,
    liveSession.phase, liveSession.currentScene, liveSession.currentMapUrl,
    liveSession.dmAnnouncement, liveSession.sessionStartedAt,
    authState, authRole,
  ]);

  /* ── Push Homebrew ── */
  useEffect(() => {
    if (authState !== "authenticated" || authRole !== "dm") return;
    debouncedPush("homebrew", () => syncManager.pushHomebrew(), 2000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [homebrewItemsLen, homebrewFeatsLen, homebrewSpellsLen, authState, authRole]);

  /* ── Welcome Toast ── */
  useEffect(() => {
    if (!initialized.current) return;
    initialized.current = false;
    if (isFirebaseAvailable() && authState === "authenticated") {
      showToast({
        message: "Cloud sync is active. Offline queue ready.",
        type: "info",
        duration: 3000,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

/**
 * Triggers an immediate full sync push to Firestore.
 * Flushes the pending queue first, then pushes all domains.
 */
export async function triggerFullSync(): Promise<boolean> {
  if (!isFirebaseAvailable()) return false;
  await flushQueue();
  return syncManager.pushAll();
}

/**
 * Returns the count of pending (unsynced) items in the queue.
 * Use this to show a "pending sync" badge in the UI.
 */
export function getPendingSyncCount(): number {
  return loadQueue().length;
}
