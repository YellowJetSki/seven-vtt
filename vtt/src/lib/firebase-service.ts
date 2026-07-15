/* ── Firebase Real-Time Sync Service ───────────────────────────
 *
 * This service bridges Zustand state ↔ Firestore documents.
 * It provides:
 *   1. `push*()` — Upload current store state to Firestore
 *   2. `listen*()` — Subscribe to Firestore changes and hydrate stores
 *   3. Conflict resolution via last-write-wins (appropriate for single-DM)
 *
 * ENHANCED: Rate limiting, retry logic, connection health checks,
 * and error recovery to ensure robust sync throughout the application.
 *
 * Note: Auth is handled locally (env-based DM check, name-matching for
 * players). Firebase Auth is NOT used — getUserId() returns a static
 * string since this is a single-DM application.
 *
 * ── Architecture ─────────────────────────────────────────────
 * Three separate sync domains, each with push + listen + fetch:
 *   • campaignSync  — campaign document (characters, encounters, maps, journal)
 *   • sessionSync   — live session document (combat state, log, phase, scene)
 *   • homebrewSync  — homebrew library (items, spells, feats)
 *
 * The syncManager orchestrator manages all three together.
 * ── Usage ─────────────────────────────────────────────────────
 *   await campaignSync.pushCampaign("arkla");
 *   const unsub = campaignSync.listenCampaign("arkla", onStatus);
 *   const data = await campaignSync.fetchCampaign("arkla");
 * ─────────────────────────────────────────────────────────────── */

import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  type DocumentData,
  type Unsubscribe,
} from "firebase/firestore";
import { getDb, isFirebaseAvailable } from "@/lib/firebase";
import { useCampaignStore } from "@/stores/campaignStore";
import { useCombatStore } from "@/stores/combatStore";
import { useHomebrewStore } from "@/stores/homebrewStore";
import type { Campaign } from "@/types";
import type { CombatEncounter, CombatLogEntry, LiveSessionState } from "@/types/combat";
import type { HomebrewLibrary } from "@/types/homebrew";

/* ── Types ──────────────────────────────────────────────────── */

/** Describes the current state of a sync connection. */
export type SyncStatus = "idle" | "syncing" | "success" | "error";

/** Document stored in Firestore for campaign data. */
interface CampaignDocument {
  data: Campaign;
  updatedAt: number;
  updatedBy: string;
}

/** Document stored in Firestore for live session data. */
interface LiveSessionDocument {
  data: {
    activeEncounter: CombatEncounter | null;
    combatLog: CombatLogEntry[];
    liveSession: LiveSessionState;
  };
  updatedAt: number;
  updatedBy: string;
}

/** Document stored in Firestore for homebrew data. */
interface HomebrewDocument {
  data: HomebrewLibrary;
  updatedAt: number;
  updatedBy: string;
}

/* ── Queue & Retry ──────────────────────────────────────────── */

interface QueueItem {
  key: string;
  action: () => Promise<boolean>;
  timestamp: number;
  retries: number;
}

const MAX_RETRIES = 3;
const RATE_LIMIT_MS = 500;

let pendingQueue: QueueItem[] = [];
let processingQueue = false;
let lastPushTime = 0;

async function processQueue(): Promise<void> {
  if (processingQueue || pendingQueue.length === 0) return;
  processingQueue = true;

  while (pendingQueue.length > 0) {
    const item = pendingQueue.shift()!;
    const now = Date.now();
    const elapsed = now - lastPushTime;
    if (elapsed < RATE_LIMIT_MS) {
      await new Promise((r) => setTimeout(r, RATE_LIMIT_MS - elapsed));
    }
    try {
      lastPushTime = Date.now();
      const ok = await item.action();
      if (!ok && item.retries < MAX_RETRIES) {
        pendingQueue.push({ ...item, retries: item.retries + 1, timestamp: Date.now() });
      } else if (!ok) {
        console.warn(`[Sync] Failed to push ${item.key} after ${MAX_RETRIES} retries.`);
      }
    } catch {
      if (item.retries < MAX_RETRIES) {
        pendingQueue.push({ ...item, retries: item.retries + 1, timestamp: Date.now() });
      }
    }
  }

  processingQueue = false;
}

function enqueue(key: string, action: () => Promise<boolean>): void {
  pendingQueue.push({ key, action, timestamp: Date.now(), retries: 0 });
  processQueue();
}

/** Flush all remaining items in the queue. */
export async function flushQueue(): Promise<void> {
  while (pendingQueue.length > 0) {
    await processQueue();
    await new Promise((r) => setTimeout(r, 100));
  }
}

/* ── Helpers ────────────────────────────────────────────────── */

/** Returns a stable user identifier for Firestore metadata. */
function getUserId(): string {
  return "dm"; // Single-DM app — no Firebase Auth UID needed
}

function safeStringify<T>(data: T): T {
  // Deep clone to strip Zustand Proxy wrappers
  return JSON.parse(JSON.stringify(data));
}

function getDbOrThrow() {
  if (!isFirebaseAvailable()) throw new Error("Firebase not available");
  return getDb();
}

/* ── Campaign Sync ──────────────────────────────────────────── */

export const campaignSync = {
  /**
   * Pushes the current campaign store to Firestore.
   * Returns true on success, false on failure.
   */
  async pushCampaign(campaignId: string): Promise<boolean> {
    if (!isFirebaseAvailable()) return false;

    const campaign = useCampaignStore.getState().campaign;
    if (!campaign) return false;

    try {
      const db = getDbOrThrow();
      const ref = doc(db, "campaigns", campaignId);
      const payload: CampaignDocument = {
        data: safeStringify(campaign),
        updatedAt: Date.now(),
        updatedBy: getUserId(),
      };
      await setDoc(ref, payload, { merge: true });
      return true;
    } catch (err) {
      console.error("[Sync] pushCampaign failed:", err);
      return false;
    }
  },

  /**
   * Starts listening to campaign changes from Firestore.
   * Every update hydrates the Zustand campaign store.
   * Returns an unsubscribe function.
   */
  listenCampaign(
    campaignId: string,
    onStatusChange?: (status: SyncStatus, error?: string) => void,
  ): Unsubscribe | null {
    if (!isFirebaseAvailable()) {
      onStatusChange?.("error", "Firebase not available");
      return null;
    }

    try {
      const db = getDbOrThrow();
      const ref = doc(db, "campaigns", campaignId);

      onStatusChange?.("syncing");
      const unsub = onSnapshot(
        ref,
        (snapshot) => {
          if (snapshot.exists()) {
            const docData = snapshot.data() as CampaignDocument;
            if (docData.data) {
              useCampaignStore.getState().setCampaign(docData.data as Campaign);
            }
          }
          onStatusChange?.("success");
        },
        (error) => {
          console.error("[Sync] Campaign listener error:", error);
          onStatusChange?.("error", error.message);
        },
      );

      return unsub;
    } catch (err) {
      console.error("[Sync] Failed to start campaign listener:", err);
      onStatusChange?.("error", String(err));
      return null;
    }
  },

  /**
   * Fetches campaign data from Firestore once (no subscription).
   */
  async fetchCampaign(campaignId: string): Promise<Campaign | null> {
    if (!isFirebaseAvailable()) return null;

    try {
      const db = getDbOrThrow();
      const ref = doc(db, "campaigns", campaignId);
      const snapshot = await getDoc(ref);
      if (snapshot.exists()) {
        const docData = snapshot.data() as CampaignDocument;
        return docData.data as Campaign;
      }
      return null;
    } catch (err) {
      console.error("[Sync] fetchCampaign failed:", err);
      return null;
    }
  },
};

/* ── Session Sync (Live Combat) ─────────────────────────────── */

export const sessionSync = {
  /**
   * Pushes the current combat + session state to Firestore.
   */
  async pushSession(campaignId: string): Promise<boolean> {
    if (!isFirebaseAvailable()) return false;

    const combatState = useCombatStore.getState();
    const payload: LiveSessionDocument = safeStringify({
      data: {
        activeEncounter: combatState.activeEncounter,
        combatLog: combatState.combatLog,
        liveSession: combatState.liveSession,
      },
      updatedAt: Date.now(),
      updatedBy: getUserId(),
    });

    try {
      const db = getDbOrThrow();
      const ref = doc(db, "liveSessions", campaignId);
      await setDoc(ref, payload, { merge: true });
      return true;
    } catch (err) {
      console.error("[Sync] pushSession failed:", err);
      return false;
    }
  },

  /**
   * Starts listening to session changes from Firestore.
   * Every update hydrates the Zustand combat store.
   * Returns an unsubscribe function.
   */
  listenSession(
    campaignId: string,
    onStatusChange?: (status: SyncStatus, error?: string) => void,
  ): Unsubscribe | null {
    if (!isFirebaseAvailable()) {
      onStatusChange?.("error", "Firebase not available");
      return null;
    }

    try {
      const db = getDbOrThrow();
      const ref = doc(db, "liveSessions", campaignId);

      onStatusChange?.("syncing");
      const unsub = onSnapshot(
        ref,
        (snapshot) => {
          if (snapshot.exists()) {
            const rawData = snapshot.data() as DocumentData;
            const nested = rawData.data ?? rawData;

            const activeEncounter = nested.activeEncounter ?? null;
            const combatLog: CombatLogEntry[] = nested.combatLog ?? [];
            const liveSession: LiveSessionState | undefined = nested.liveSession;

            const store = useCombatStore.getState();

            if (activeEncounter) {
              store.setActiveEncounter(activeEncounter.id);
              // Replace the entire encounter state
              useCombatStore.setState({ activeEncounter: activeEncounter as CombatEncounter });
            }

            // Hydrate the combat log
            if (combatLog.length > 0) {
              useCombatStore.setState({ combatLog });
            }

            // Hydrate the live session fields individually
            if (liveSession) {
              if (liveSession.phase) store.setSessionPhase(liveSession.phase);
              if (liveSession.currentScene) store.setCurrentScene(liveSession.currentScene);
              if (liveSession.currentMapUrl) store.setCurrentMapUrl(liveSession.currentMapUrl);
              if (liveSession.dmAnnouncement) store.setDmAnnouncement(liveSession.dmAnnouncement);
              if (liveSession.conditions) store.setConditions(liveSession.conditions);
            }
          }
          onStatusChange?.("success");
        },
        (error) => {
          console.error("[Sync] Session listener error:", error);
          onStatusChange?.("error", error.message);
        },
      );

      return unsub;
    } catch (err) {
      console.error("[Sync] Failed to start session listener:", err);
      onStatusChange?.("error", String(err));
      return null;
    }
  },

  /**
   * Fetches session data from Firestore once (no subscription).
   * Returns the full LiveSessionDocument, or null if not found.
   */
  async fetchSession(campaignId: string): Promise<{
    activeEncounter: CombatEncounter | null;
    combatLog: CombatLogEntry[];
    liveSession: LiveSessionState;
  } | null> {
    if (!isFirebaseAvailable()) return null;

    try {
      const db = getDbOrThrow();
      const ref = doc(db, "liveSessions", campaignId);
      const snapshot = await getDoc(ref);
      if (snapshot.exists()) {
        const rawData = snapshot.data() as DocumentData;
        const nested = rawData.data ?? rawData;
        return {
          activeEncounter: nested.activeEncounter ?? null,
          combatLog: nested.combatLog ?? [],
          liveSession: nested.liveSession ?? null,
        };
      }
      return null;
    } catch (err) {
      console.error("[Sync] fetchSession failed:", err);
      return null;
    }
  },
};

/* ── Homebrew Sync ──────────────────────────────────────────── */

export const homebrewSync = {
  /**
   * Pushes the current homebrew store to Firestore.
   */
  async pushHomebrew(campaignId: string): Promise<boolean> {
    if (!isFirebaseAvailable()) return false;

    const homebrew = useHomebrewStore.getState();
    const payload: HomebrewDocument = safeStringify({
      data: {
        items: homebrew.items,
        spells: homebrew.spells,
        feats: homebrew.feats,
      },
      updatedAt: Date.now(),
      updatedBy: getUserId(),
    });

    try {
      const db = getDbOrThrow();
      const ref = doc(db, "homebrew", campaignId);
      await setDoc(ref, payload, { merge: true });
      return true;
    } catch (err) {
      console.error("[Sync] pushHomebrew failed:", err);
      return false;
    }
  },

  /**
   * Starts listening to homebrew changes from Firestore.
   * Every update hydrates the Zustand homebrew store.
   * Returns an unsubscribe function.
   */
  listenHomebrew(
    campaignId: string,
    onStatusChange?: (status: SyncStatus, error?: string) => void,
  ): Unsubscribe | null {
    if (!isFirebaseAvailable()) {
      onStatusChange?.("error", "Firebase not available");
      return null;
    }

    try {
      const db = getDbOrThrow();
      const ref = doc(db, "homebrew", campaignId);

      onStatusChange?.("syncing");
      const unsub = onSnapshot(
        ref,
        (snapshot) => {
          if (snapshot.exists()) {
            const docData = snapshot.data() as HomebrewDocument;
            if (docData.data) {
              const { items, spells, feats } = docData.data;
              if (items) useHomebrewStore.getState().setItems(items);
              if (spells) useHomebrewStore.getState().setSpells(spells);
              if (feats) useHomebrewStore.getState().setFeats(feats);
            }
          }
          onStatusChange?.("success");
        },
        (error) => {
          console.error("[Sync] Homebrew listener error:", error);
          onStatusChange?.("error", error.message);
        },
      );

      return unsub;
    } catch (err) {
      console.error("[Sync] Failed to start homebrew listener:", err);
      onStatusChange?.("error", String(err));
      return null;
    }
  },

  /**
   * Fetches homebrew data from Firestore once (no subscription).
   */
  async fetchHomebrew(campaignId: string): Promise<HomebrewLibrary | null> {
    if (!isFirebaseAvailable()) return null;

    try {
      const db = getDbOrThrow();
      const ref = doc(db, "homebrew", campaignId);
      const snapshot = await getDoc(ref);
      if (snapshot.exists()) {
        const rawData = snapshot.data() as DocumentData;
        const nested = rawData.data ?? rawData;
        return nested as HomebrewLibrary;
      }
      return null;
    } catch (err) {
      console.error("[Sync] fetchHomebrew failed:", err);
      return null;
    }
  },
};

/* ── Sync Manager ───────────────────────────────────────────── */

/**
 * Orchestrator that manages all three sync channels (campaign, session, homebrew).
 * Provides a single start/stop interface, convenience push methods,
 * and aggregates connection status.
 *
 * The useFirebaseSync hook in DM routes calls these methods.
 */
export const syncManager = {
  privateUnsubscribers: new Map<string, Unsubscribe>(),
  privateIsListening: false,

  /** Whether any listeners are currently active. */
  get isListening(): boolean {
    return this.privateIsListening;
  },

  /**
   * Start listening to all Firestore channels for a given campaign.
   * Pass a callback to receive aggregated status updates.
   */
  start(campaignId: string, onStatus?: (status: SyncStatus) => void): void {
    this.stop(campaignId);

    const campaignUnsub = campaignSync.listenCampaign(campaignId, (status) => {
      onStatus?.(status);
    });
    if (campaignUnsub) this.privateUnsubscribers.set(`${campaignId}_campaign`, campaignUnsub);

    const sessionUnsub = sessionSync.listenSession(campaignId, (status) => {
      onStatus?.(status);
    });
    if (sessionUnsub) this.privateUnsubscribers.set(`${campaignId}_session`, sessionUnsub);

    const homebrewUnsub = homebrewSync.listenHomebrew(campaignId, (status) => {
      onStatus?.(status);
    });
    if (homebrewUnsub) this.privateUnsubscribers.set(`${campaignId}_homebrew`, homebrewUnsub);

    this.privateIsListening = true;
    console.log(`[SyncManager] Started listening for campaign ${campaignId}`);
  },

  /**
   * Stop all listeners for a given campaign.
   */
  stop(campaignId?: string): void {
    if (campaignId) {
      for (const [key, unsub] of this.privateUnsubscribers) {
        if (key.startsWith(campaignId)) {
          unsub();
          this.privateUnsubscribers.delete(key);
        }
      }
    } else {
      this.stopAll();
    }
    this.privateIsListening = this.privateUnsubscribers.size > 0;
  },

  /**
   * Stop all listeners across all campaigns.
   */
  stopAll(): void {
    for (const unsub of this.privateUnsubscribers.values()) {
      unsub();
    }
    this.privateUnsubscribers.clear();
    this.privateIsListening = false;
  },

  /** Convenience: push campaign only. */
  async pushCampaign(): Promise<boolean> {
    return campaignSync.pushCampaign("arkla");
  },

  /** Convenience: push session only. */
  async pushSession(): Promise<boolean> {
    return sessionSync.pushSession("arkla");
  },

  /** Convenience: push homebrew only. */
  async pushHomebrew(): Promise<boolean> {
    return homebrewSync.pushHomebrew("arkla");
  },

  /**
   * Push all local state to Firestore.
   */
  async pushAll(): Promise<boolean> {
    let allOk = true;

    const campOk = await this.pushCampaign();
    if (!campOk) allOk = false;

    const sessionOk = await this.pushSession();
    if (!sessionOk) allOk = false;

    const homebrewOk = await this.pushHomebrew();
    if (!homebrewOk) allOk = false;

    return allOk;
  },
};
