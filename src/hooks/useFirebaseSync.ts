/* ── Firebase Sync Hook ────────────────────────────────────────
 *
 * Hook that manages the Firebase sync lifecycle.
 * Call it once at the top of your app (e.g., in AppShell or App.tsx).
 *
 * ── Usage ─────────────────────────────────────────────────────
 *   function App() {
 *     useFirebaseSync();
 *     return <Router>...</Router>;
 *   }
 * ─────────────────────────────────────────────────────────────── */

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useCampaignStore } from "@/stores/campaignStore";
import { useCombatStore } from "@/stores/combatStore";
import { useHomebrewStore } from "@/stores/homebrewStore";
import { syncManager } from "@/lib/firebase-service";
import { isFirebaseAvailable } from "@/lib/firebase";
import { useUiStore } from "@/stores/uiStore";

const CAMPAIGN_ID = "arkla"; // Single campaign for now

/**
 * Manages Firebase real-time sync for campaign, combat, and homebrew data.
 * Starts/stops listeners based on auth state and campaign availability.
 */
export function useFirebaseSync(): void {
  const initialized = useRef(false);
  const authState = useAuthStore((s) => s.state);
  const authRole = useAuthStore((s) => s.role);
  const campaign = useCampaignStore((s) => s.campaign);
  const showToast = useUiStore((s) => s.showToast);

  // Debounce refs to avoid rapid successive pushes
  const pushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── Start/Stop Listeners on Auth Change ── */
  useEffect(() => {
    if (!isFirebaseAvailable()) return;

    if (authState === "authenticated") {
      // Start syncing
      syncManager.start(CAMPAIGN_ID);
      initialized.current = true;

      // Push initial state
      syncManager.pushAll().catch(() => {
        // Silent fail — will retry on next change
      });
    }

    return () => {
      if (syncManager.isListening) {
        syncManager.stop();
      }
    };
  }, [authState]);

  /* ── Push Campaign Changes ── */
  useEffect(() => {
    if (!campaign || authState !== "authenticated") return;
    if (!isFirebaseAvailable()) return;

    if (pushTimerRef.current) {
      clearTimeout(pushTimerRef.current);
    }

    pushTimerRef.current = setTimeout(() => {
      syncManager.pushCampaign().catch(() => {
        // Silent fail
      });
    }, 2000); // 2s debounce

    return () => {
      if (pushTimerRef.current) {
        clearTimeout(pushTimerRef.current);
      }
    };
  }, [
    campaign?.name,
    campaign?.description,
    campaign?.settings,
    campaign?.playerCharacters.length,
    campaign?.encounters.length,
    campaign?.battleMaps.length,
    campaign?.journal.length,
    campaign?.updatedAt,
    authState,
  ]);

  /* ── Push Combat Session Changes ── */
  const activeEncounter = useCombatStore((s) => s.activeEncounter);
  const liveSession = useCombatStore((s) => s.liveSession);

  useEffect(() => {
    if (authState !== "authenticated") return;
    if (!isFirebaseAvailable()) return;

    if (pushTimerRef.current) {
      clearTimeout(pushTimerRef.current);
    }

    pushTimerRef.current = setTimeout(() => {
      syncManager.pushSession().catch(() => {
        // Silent fail
      });
    }, 1500); // 1.5s debounce for combat (more frequent)

    return () => {
      if (pushTimerRef.current) {
        clearTimeout(pushTimerRef.current);
      }
    };
  }, [
    activeEncounter?.phase,
    activeEncounter?.round,
    activeEncounter?.currentCombatantIndex,
    activeEncounter?.combatants.length,
    liveSession.phase,
    liveSession.currentScene,
    liveSession.currentMapUrl,
    liveSession.dmAnnouncement,
    authState,
  ]);

  /* ── Push Homebrew Changes ── */
  const homebrewItems = useHomebrewStore((s) => s.items.length);
  const homebrewFeats = useHomebrewStore((s) => s.feats.length);
  const homebrewSpells = useHomebrewStore((s) => s.spells.length);

  useEffect(() => {
    if (authState !== "authenticated") return;
    if (!isFirebaseAvailable()) return;

    if (pushTimerRef.current) {
      clearTimeout(pushTimerRef.current);
    }

    pushTimerRef.current = setTimeout(() => {
      syncManager.pushHomebrew().catch(() => {
        // Silent fail
      });
    }, 2000);

    return () => {
      if (pushTimerRef.current) {
        clearTimeout(pushTimerRef.current);
      }
    };
  }, [homebrewItems, homebrewFeats, homebrewSpells, authState]);

  /* ── Sync Status Indicator ── */
  // Show a toast when Firebase connects/disconnects
  useEffect(() => {
    if (!initialized.current) return;

    const wasConnected = isFirebaseAvailable();
    if (wasConnected && authState === "authenticated") {
      showToast({
        message: "Cloud sync is active. Your data is backed up in real-time.",
        type: "info",
        duration: 3000,
      });
    }
    // Skip on first mount — avoid initial toast
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}

/**
 * Manually triggers a full sync push.
 * Useful after bulk operations (import, reset, etc.).
 */
export async function triggerFullSync(): Promise<boolean> {
  if (!isFirebaseAvailable()) return false;
  return syncManager.pushAll();
}
