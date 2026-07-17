/* ── Player Firebase Sync Hook ─────────────────────────────────
 *
 * Subscribes to live session + campaign updates from Firestore.
 * Used by the Player Dashboard for real-time DM state.
 * Uses the normalized Firestore service for consistency.
 * ─────────────────────────────────────────────────────────────── */

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useCombatStore } from "@/stores/combatStore";
import { useCampaignStore } from "@/stores/campaignStore";
import { isFirebaseAvailable } from "@/lib/firebase";
import { normalizedSessions, normalizedCampaign } from "@/lib/normalized-firebase-service";

const CAMPAIGN_ID = "arkla";

export function usePlayerFirebaseSync(): void {
  const role = useAuthStore((s) => s.role);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (role !== "player" || !isFirebaseAvailable() || initializedRef.current) return;
    initializedRef.current = true;

    const unsubSession = normalizedSessions.listenAll(CAMPAIGN_ID, (sessions) => {
      if (sessions.length === 0) return;
      const latest = sessions[0]; // ordered by updatedAt desc
      const store = useCombatStore.getState();
      if (latest.phase) store.setSessionPhase(latest.phase as any);
      if (latest.currentScene) store.setCurrentScene(latest.currentScene);
      if (latest.currentMapUrl) store.setCurrentMapUrl(latest.currentMapUrl);
      if (latest.dmAnnouncement) store.setDmAnnouncement(latest.dmAnnouncement);
      if (latest.conditions) store.setConditions(latest.conditions as any);
    });

    const unsubMeta = normalizedCampaign.listenMeta(CAMPAIGN_ID, (meta) => {
      if (meta) useCampaignStore.getState().setMeta(meta);
    });

    // Eager fetch on mount
    normalizedSessions.fetchAll(CAMPAIGN_ID).then((sessions) => {
      if (sessions.length > 0) {
        const ls = sessions[0];
        const store = useCombatStore.getState();
        if (ls.phase) store.setSessionPhase(ls.phase as any);
        if (ls.currentScene) store.setCurrentScene(ls.currentScene);
        if (ls.currentMapUrl) store.setCurrentMapUrl(ls.currentMapUrl);
        if (ls.dmAnnouncement) store.setDmAnnouncement(ls.dmAnnouncement);
        if (ls.conditions) store.setConditions(ls.conditions as any);
      }
    });

    return () => {
      unsubSession?.();
      unsubMeta?.();
      initializedRef.current = false;
    };
  }, [role]);
}
