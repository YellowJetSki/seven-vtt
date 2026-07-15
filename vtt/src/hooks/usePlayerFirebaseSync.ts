/* ── Player Firebase Sync Hook ─────────────────────────────────
 *
 * This hook subscribes to live session updates from Firestore.
 * It is used by the Player Dashboard to see real-time changes
 * made by the DM (e.g., new encounters, session phase changes,
 * DM announcements, current scene/map).
 *
 * ── Usage ─────────────────────────────────────────────────────
 *   // In PlayerDashboard or any player-facing component:
 *   usePlayerFirebaseSync();
 *
 * ── Behavior ──────────────────────────────────────────────────
 * - Only activates for player role (not DM)
 * - Subscribes to liveSessions/{campaignId} via onSnapshot
 * - Hydrates the combatStore's liveSession field
 * - Also hydrates campaign data (for character sheets)
 * - Cleans up listeners on unmount
 * ─────────────────────────────────────────────────────────────── */

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useCombatStore } from "@/stores/combatStore";
import { sessionSync, campaignSync } from "@/lib/firebase-service";
import { isFirebaseAvailable } from "@/lib/firebase";

const CAMPAIGN_ID = "arkla";

/**
 * Real-time Firebase sync for player-facing state.
 * Call once in the player's root component.
 */
export function usePlayerFirebaseSync(): void {
  const role = useAuthStore((s) => s.role);
  const initializedRef = useRef(false);

  useEffect(() => {
    // Only run for players, not DM
    if (role !== "player") return;
    if (!isFirebaseAvailable()) return;
    if (initializedRef.current) return;

    initializedRef.current = true;

    // Subscribe to live session updates (scene, map, announcements, combat state)
    const unsubSession = sessionSync.listenSession(CAMPAIGN_ID);
    // Subscribe to campaign updates (character data, if DM edits a character)
    const unsubCampaign = campaignSync.listenCampaign(CAMPAIGN_ID);

    // Eagerly fetch the current session state to hydrate on mount
    sessionSync.fetchSession(CAMPAIGN_ID).then((sessionData) => {
      if (sessionData) {
        const store = useCombatStore.getState();
        if (sessionData.liveSession) {
          const ls = sessionData.liveSession;
          if (ls.phase) store.setSessionPhase(ls.phase);
          if (ls.currentScene) store.setCurrentScene(ls.currentScene);
          if (ls.currentMapUrl) store.setCurrentMapUrl(ls.currentMapUrl);
          if (ls.dmAnnouncement) store.setDmAnnouncement(ls.dmAnnouncement);
          if (ls.conditions) store.setConditions(ls.conditions);
        }
      }
    });

    return () => {
      unsubSession?.();
      unsubCampaign?.();
      initializedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);
}
