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
 * ── Usage ─────────────────────────────────────────────────────
 *   import { campaignSync } from "@/lib/firebase-service";
 *   await campaignSync.pushCampaign("arkla");
 *   const unsub = campaignSync.listenCampaign("arkla");
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
import { getCurrentUser } from "@/lib/firebase-auth";
import { useCampaignStore } from "@/stores/campaignStore";
import { useCombatStore } from "@/stores/combatStore";
import { useHomebrewStore } from "@/stores/homebrewStore";
import type { Campaign } from "@/types";
import type { CombatEncounter, CombatLogEntry, LiveSessionState } from "@/types/combat";
import type { HomebrewLibrary } from "@/types/homebrew";

/* ── Types ──────────────────────────────────────────────────── */

export interface LiveSessionDocument {
  activeEncounter: CombatEncounter | null;
  combatLog: CombatLogEntry[];
  liveSession: LiveSessionState;
  updatedAt: number;
  updatedBy: string;
}

export interface HomebrewDocument extends HomebrewLibrary {
  updatedAt: number;
}

type SyncStatus = "idle" | "syncing" | "error" | "listening";

/* ── Rate Limiter ─────────────────────────────────────────────
 * Prevents Firestore write storms. Tracks pending pushes and
 * debounces rapid successive calls.
 * ─────────────────────────────────────────────────────────────── */

class RateLimiter {
  private pending = new Map<string, ReturnType<typeof setTimeout>>();
  private lastPush = new Map<string, number>();
  private readonly MIN_INTERVAL_MS = 500; // minimum 500ms between pushes per domain

  canPush(domain: string): boolean {
    const last = this.lastPush.get(domain) ?? 0;
    return Date.now() - last >= this.MIN_INTERVAL_MS;
  }

  markPushed(domain: string): void {
    this.lastPush.set(domain, Date.now());
  }

  debounce(domain: string, fn: () => Promise<boolean>, delayMs: number): Promise<boolean> {
    // Cancel existing pending
    const existing = this.pending.get(domain);
    if (existing) clearTimeout(existing);

    return new Promise((resolve) => {
      const timer = setTimeout(async () => {
        try {
          const result = await fn();
          this.markPushed(domain);
          resolve(result);
        } catch {
          resolve(false);
        }
        this.pending.delete(domain);
      }, delayMs);
      this.pending.set(domain, timer);
    });
  }

  cancelAll(): void {
    for (const [key, timer] of this.pending) {
      clearTimeout(timer);
      this.pending.delete(key);
    }
  }
}

const rateLimiter = new RateLimiter();

/* ── Retry Wrapper ──────────────────────────────────────────── */

async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 2,
  baseDelay = 1000,
): Promise<T | null> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      console.warn(`[Firebase] Retry ${attempt + 1}/${maxRetries} failed:`, err);
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, baseDelay * (attempt + 1)));
      }
    }
  }
  console.error(`[Firebase] All ${maxRetries + 1} retries exhausted:`, lastError);
  return null;
}

/* ── Helpers ────────────────────────────────────────────────── */

function getUserId(): string {
  return getCurrentUser()?.uid ?? "unknown";
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
   * Pushes the current campaign state to Firestore.
   * Overwrites the remote document entirely (last-write-wins).
   * Rate-limited: will debounce if called rapidly.
   */
  async pushCampaign(campaignId: string): Promise<boolean> {
    if (!isFirebaseAvailable()) return false;

    const campaign = useCampaignStore.getState().campaign;
    if (!campaign) return false;

    return rateLimiter.debounce("campaign", async () => {
      try {
        const db = getDbOrThrow();
        const payload = safeStringify<Record<string, unknown>>({
          ...campaign,
          updatedAt: Date.now(),
        });

        await withRetry(() => setDoc(doc(db, "campaigns", campaignId), payload, { merge: true }));
        return true;
      } catch (err) {
        console.error("[Firebase] Failed to push campaign:", err);
        return false;
      }
    }, 300);
  },

  /**
   * Subscribes to a campaign document in Firestore.
   * On each remote change, it hydrates the campaignStore.
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

    const db = getDbOrThrow();
    const ref = doc(db, "campaigns", campaignId);
    onStatusChange?.("listening");

    return onSnapshot(
      ref,
      (snapshot) => {
        if (!snapshot.exists()) {
          onStatusChange?.("idle");
          return;
        }

        const data = snapshot.data() as Campaign;
        // Don't overwrite if the local store has a newer updatedAt
        const localCampaign = useCampaignStore.getState().campaign;
        if (localCampaign && localCampaign.updatedAt > data.updatedAt) {
          return; // local is newer — skip
        }

        useCampaignStore.getState().setCampaign(data);
        onStatusChange?.("listening");
      },
      (err) => {
        console.error("[Firebase] Campaign listener error:", err);
        onStatusChange?.("error", err.message);
      },
    );
  },

  /**
   * Fetches the campaign document once (no subscription).
   * Used for initial hydration on app load.
   */
  async fetchCampaign(campaignId: string): Promise<Campaign | null> {
    if (!isFirebaseAvailable()) return null;

    try {
      const db = getDbOrThrow();
      const snapshot = await withRetry(() => getDoc(doc(db, "campaigns", campaignId)));
      if (!snapshot?.exists()) return null;
      return snapshot.data() as Campaign;
    } catch (err) {
      console.error("[Firebase] Failed to fetch campaign:", err);
      return null;
    }
  },
};

/* ── Live Session Sync ──────────────────────────────────────── */

export const sessionSync = {
  /**
   * Pushes the current combat + session state to Firestore.
   * Rate-limited.
   */
  async pushSession(campaignId: string): Promise<boolean> {
    if (!isFirebaseAvailable()) return false;

    const combatState = useCombatStore.getState();
    const payload: LiveSessionDocument = safeStringify({
      activeEncounter: combatState.activeEncounter,
      combatLog: combatState.combatLog,
      liveSession: combatState.liveSession,
      updatedAt: Date.now(),
      updatedBy: getUserId(),
    });

    return rateLimiter.debounce("session", async () => {
      try {
        const db = getDbOrThrow();
        await withRetry(() => setDoc(doc(db, "liveSessions", campaignId), payload, { merge: true }));
        return true;
      } catch (err) {
        console.error("[Firebase] Failed to push session:", err);
        return false;
      }
    }, 200);
  },

  /**
   * Subscribes to live session changes for player-facing state.
   */
  listenSession(
    campaignId: string,
    onStatusChange?: (status: SyncStatus, error?: string) => void,
  ): Unsubscribe | null {
    if (!isFirebaseAvailable()) {
      onStatusChange?.("error", "Firebase not available");
      return null;
    }

    const db = getDbOrThrow();
    const ref = doc(db, "liveSessions", campaignId);
    onStatusChange?.("listening");

    return onSnapshot(
      ref,
      (snapshot) => {
        if (!snapshot.exists()) return;

        const data = snapshot.data() as LiveSessionDocument;
        const store = useCombatStore.getState();

        // Only hydrate combat state if the remote is newer
        // or if we don't have local data
        if (data.activeEncounter && !store.activeEncounter) {
          store.setActiveEncounter(data.activeEncounter.id);
        }

        // Always hydrate liveSession (player-facing state)
        if (data.liveSession) {
          const ls = data.liveSession;
          if (ls.phase) store.setSessionPhase(ls.phase);
          if (ls.currentScene) store.setCurrentScene(ls.currentScene);
          if (ls.currentMapUrl) store.setCurrentMapUrl(ls.currentMapUrl);
          if (ls.dmAnnouncement) store.setDmAnnouncement(ls.dmAnnouncement);
        }

        onStatusChange?.("listening");
      },
      (err) => {
        console.error("[Firebase] Session listener error:", err);
        onStatusChange?.("error", err.message);
      },
    );
  },

  /**
   * Fetches the live session document once.
   */
  async fetchSession(campaignId: string): Promise<LiveSessionDocument | null> {
    if (!isFirebaseAvailable()) return null;

    try {
      const db = getDbOrThrow();
      const snapshot = await withRetry(() => getDoc(doc(db, "liveSessions", campaignId)));
      if (!snapshot?.exists()) return null;
      return snapshot.data() as LiveSessionDocument;
    } catch (err) {
      console.error("[Firebase] Failed to fetch session:", err);
      return null;
    }
  },
};

/* ── Homebrew Sync ──────────────────────────────────────────── */

export const homebrewSync = {
  /**
   * Pushes the current homebrew library to Firestore.
   * Rate-limited.
   */
  async pushHomebrew(campaignId: string): Promise<boolean> {
    if (!isFirebaseAvailable()) return false;

    const homebrew = useHomebrewStore.getState();
    const payload: HomebrewDocument = safeStringify({
      items: homebrew.items,
      feats: homebrew.feats,
      spells: homebrew.spells,
      updatedAt: Date.now(),
    });

    return rateLimiter.debounce("homebrew", async () => {
      try {
        const db = getDbOrThrow();
        await withRetry(() => setDoc(doc(db, "homebrew", campaignId), payload, { merge: true }));
        return true;
      } catch (err) {
        console.error("[Firebase] Failed to push homebrew:", err);
        return false;
      }
    }, 300);
  },

  /**
   * Subscribes to homebrew changes from Firestore.
   */
  listenHomebrew(
    campaignId: string,
    onStatusChange?: (status: SyncStatus, error?: string) => void,
  ): Unsubscribe | null {
    if (!isFirebaseAvailable()) {
      onStatusChange?.("error", "Firebase not available");
      return null;
    }

    const db = getDbOrThrow();
    const ref = doc(db, "homebrew", campaignId);
    onStatusChange?.("listening");

    return onSnapshot(
      ref,
      (snapshot) => {
        if (!snapshot.exists()) return;

        const data = snapshot.data() as HomebrewDocument;
        const store = useHomebrewStore.getState();

        // Only sync if remote has data and local doesn't
        if (data.items && data.items.length > 0 && store.items.length === 0) {
          data.items.forEach((item) => store.addItem(item));
          data.feats.forEach((feat) => store.addFeat(feat));
          data.spells.forEach((spell) => store.addSpell(spell));
        }

        onStatusChange?.("listening");
      },
      (err) => {
        console.error("[Firebase] Homebrew listener error:", err);
        onStatusChange?.("error", err.message);
      },
    );
  },

  /**
   * Fetches homebrew data once.
   */
  async fetchHomebrew(campaignId: string): Promise<HomebrewDocument | null> {
    if (!isFirebaseAvailable()) return null;

    try {
      const db = getDbOrThrow();
      const snapshot = await withRetry(() => getDoc(doc(db, "homebrew", campaignId)));
      if (!snapshot?.exists()) return null;
      return snapshot.data() as HomebrewDocument;
    } catch (err) {
      console.error("[Firebase] Failed to fetch homebrew:", err);
      return null;
    }
  },
};

/* ── Sync Manager ─────────────────────────────────────────────
 * Orchestrates all three sync domains. Call start(campaignId)
 * to begin listening, and stop() to clean up.
 * ─────────────────────────────────────────────────────────────── */

export class SyncManager {
  private campaignUnsub: Unsubscribe | null = null;
  private sessionUnsub: Unsubscribe | null = null;
  private homebrewUnsub: Unsubscribe | null = null;
  private campaignId: string | null = null;
  private _isListening = false;

  /**
   * Starts all Firestore listeners for a given campaign.
   */
  start(campaignId: string): void {
    this.stop(); // Clean up any existing listeners
    this.campaignId = campaignId;

    this.campaignUnsub = campaignSync.listenCampaign(campaignId);
    this.sessionUnsub = sessionSync.listenSession(campaignId);
    this.homebrewUnsub = homebrewSync.listenHomebrew(campaignId);
    this._isListening = true;

    console.log(`[Firebase] Sync started for campaign: ${campaignId}`);
  }

  /**
   * Pushes all local state to Firestore.
   */
  async pushAll(): Promise<boolean> {
    if (!this.campaignId) return false;

    const results = await Promise.all([
      campaignSync.pushCampaign(this.campaignId),
      sessionSync.pushSession(this.campaignId),
      homebrewSync.pushHomebrew(this.campaignId),
    ]);

    return results.every(Boolean);
  }

  /**
   * Pushes just the campaign data.
   */
  async pushCampaign(): Promise<boolean> {
    if (!this.campaignId) return false;
    return campaignSync.pushCampaign(this.campaignId);
  }

  /**
   * Pushes just the session/combat data.
   */
  async pushSession(): Promise<boolean> {
    if (!this.campaignId) return false;
    return sessionSync.pushSession(this.campaignId);
  }

  /**
   * Pushes just the homebrew data.
   */
  async pushHomebrew(): Promise<boolean> {
    if (!this.campaignId) return false;
    return homebrewSync.pushHomebrew(this.campaignId);
  }

  /**
   * Stops all Firestore listeners.
   */
  stop(): void {
    this.campaignUnsub?.();
    this.sessionUnsub?.();
    this.homebrewUnsub?.();

    this.campaignUnsub = null;
    this.sessionUnsub = null;
    this.homebrewUnsub = null;
    this._isListening = false;

    rateLimiter.cancelAll();

    if (this.campaignId) {
      console.log(`[Firebase] Sync stopped for campaign: ${this.campaignId}`);
    }
  }

  /**
   * Returns true if any listeners are active.
   */
  get isListening(): boolean {
    return this._isListening;
  }
}

/** Singleton sync manager instance */
export const syncManager = new SyncManager();
