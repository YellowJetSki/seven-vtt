/* ── Firebase Sync Hook ────────────────────────────────────────
 *
 * Manages the Firebase real-time sync lifecycle.
 * Call ONCE at the root of all DM routes (done in AppShell.tsx).
 *
 * ── What It Does ──────────────────────────────────────────────
 * 1. Starts Firestore listeners when the DM authenticates
 * 2. Auto-pushes campaign, combat, and homebrew state to Firestore
 *    whenever any tracked field changes (with debounce)
 * 3. Provides `triggerFullSync()` for manual bulk sync operations
 * 4. Shows a toast when sync becomes active
 *
 * ── Conflict Resolution ─────────────────────────────────────
 * Last-write-wins with updatedAt comparison. Remote data only
 * overwrites local data if the remote updatedAt is newer.
 * ─────────────────────────────────────────────────────────────── */

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useCampaignStore } from "@/stores/campaignStore";
import { useCombatStore } from "@/stores/combatStore";
import { useHomebrewStore } from "@/stores/homebrewStore";
import { syncManager } from "@/lib/firebase-service";
import { isFirebaseAvailable } from "@/lib/firebase";
import { useUiStore } from "@/stores/uiStore";

const CAMPAIGN_ID = "arkla";

/**
 * Manages Firebase real-time sync for campaign, combat, and homebrew data.
 */
export function useFirebaseSync(): void {
  const initialized = useRef(false);
  const authState = useAuthStore((s) => s.state);
  const authRole = useAuthStore((s) => s.role);
  const campaign = useCampaignStore((s) => s.campaign);
  const showToast = useUiStore((s) => s.showToast);

  // ── Campaign watchers (every dimension that can change) ──
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

  // ── Force push counter (wholesale replacements) ──
  const forcePushCounter = useCampaignStore((s) => s.forcePushCounter);

  const pushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Debounced push helper. Cancels any pending push and schedules
   * a new one after `delay` ms of inactivity.
   */
  const debouncedPush = (fn: () => Promise<boolean>, delay: number) => {
    if (pushTimerRef.current) {
      clearTimeout(pushTimerRef.current);
    }
    pushTimerRef.current = setTimeout(() => {
      fn().catch(() => {
        // Silent fail — will retry on next change
      });
    }, delay);
  };

  /* ── Start/Stop Listeners on Auth Change ── */
  useEffect(() => {
    if (!isFirebaseAvailable()) return;

    if (authState === "authenticated" && authRole === "dm") {
      syncManager.start(CAMPAIGN_ID);
      initialized.current = true;

      // Push initial state on first connect
      syncManager.pushAll().catch(() => {});
    }

    return () => {
      if (syncManager.isListening) {
        syncManager.stop();
      }
    };
  }, [authState, authRole]);

  /* ── Push Campaign on Any Change ── */
  useEffect(() => {
    if (authState !== "authenticated" || authRole !== "dm") return;
    if (!campaign) return;

    debouncedPush(() => syncManager.pushCampaign(), 2000);

    return () => {
      if (pushTimerRef.current) clearTimeout(pushTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    pcCount,
    encCount,
    mapCount,
    journalCount,
    campaignUpdatedAt,
    campaignName,
    campaignDescription,
    forcePushCounter,
    authState,
    authRole,
  ]);

  /* ── Push Combat/Session on Changes ── */
  useEffect(() => {
    if (authState !== "authenticated" || authRole !== "dm") return;

    debouncedPush(() => syncManager.pushSession(), 1500);

    return () => {
      if (pushTimerRef.current) clearTimeout(pushTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    activeEncounter?.phase,
    activeEncounter?.round,
    activeEncounter?.currentCombatantIndex,
    activeEncounter?.combatants.length,
    activeEncounter?.startedAt,
    activeEncounter?.completedAt,
    liveSession.phase,
    liveSession.currentScene,
    liveSession.currentMapUrl,
    liveSession.dmAnnouncement,
    liveSession.sessionStartedAt,
    authState,
    authRole,
  ]);

  /* ── Push Homebrew on Changes ── */
  useEffect(() => {
    if (authState !== "authenticated" || authRole !== "dm") return;

    debouncedPush(() => syncManager.pushHomebrew(), 2000);

    return () => {
      if (pushTimerRef.current) clearTimeout(pushTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [homebrewItemsLen, homebrewFeatsLen, homebrewSpellsLen, authState, authRole]);

  /* ── Welcome Toast on First Sync ── */
  useEffect(() => {
    if (!initialized.current) return;
    initialized.current = false; // Only fire once

    if (isFirebaseAvailable() && authState === "authenticated") {
      showToast({
        message: "Cloud sync is active. Your data is backed up in real-time.",
        type: "info",
        duration: 3000,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

/**
 * Triggers an immediate full sync push to Firestore.
 * Use this after bulk operations (JSON import, demo reset, campaign delete+replace).
 */
export async function triggerFullSync(): Promise<boolean> {
  if (!isFirebaseAvailable()) return false;
  return syncManager.pushAll();
}
