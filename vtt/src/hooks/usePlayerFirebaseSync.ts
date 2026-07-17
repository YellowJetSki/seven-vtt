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
import { useHomebrewStore } from "@/stores/homebrewStore";
import { isFirebaseAvailable } from "@/lib/firebase";
import {
  normalizedSessions, normalizedCampaign,
  normalizedCombatLog, normalizedHomebrewItems,
  normalizedHomebrewSpells, normalizedHomebrewFeats,
  normalizedSessionCombatants,
} from "@/lib/normalized-firebase-service";

/* ── Derive campaign ID from store (or use default) ────────── */
function getCampaignId(): string {
  const meta = useCampaignStore.getState().meta;
  return meta?.id ?? "arkla";
}

export function usePlayerFirebaseSync(): void {
  const role = useAuthStore((s) => s.role);
  const initializedRef = useRef(false);
  const meta = useCampaignStore((s) => s.meta);

  useEffect(() => {
    if (role !== "player" || !isFirebaseAvailable() || initializedRef.current) return;
    initializedRef.current = true;

    const cid = getCampaignId();

    const unsubSession = normalizedSessions.listenAll(cid, (sessions) => {
      if (sessions.length === 0) return;
      const latest = sessions[0]; // ordered by updatedAt desc
      const store = useCombatStore.getState();
      if (latest.phase) store.setSessionPhase(latest.phase as "exploration" | "combat" | "rest" | "downtime");
      if (latest.currentScene) store.setCurrentScene(latest.currentScene);
      if (latest.currentMapUrl) store.setCurrentMapUrl(latest.currentMapUrl);
      if (latest.dmAnnouncement) store.setDmAnnouncement(latest.dmAnnouncement);
      if (latest.conditions) store.setConditions(latest.conditions);
    });

    const unsubMeta = normalizedCampaign.listenMeta(cid, (meta) => {
      if (meta) useCampaignStore.getState().setMeta(meta);
    });

    const unsubCombatLog = normalizedCombatLog.listenAll(cid, (entries) => {
      const store = useCombatStore.getState();
      const storeIds = new Set(store.combatLog.map((e) => e.id));
      const newEntries = entries.filter((e) => !storeIds.has(e.id));
      if (newEntries.length > 0) {
        useCombatStore.setState({ combatLog: [...store.combatLog, ...newEntries] });
      }
    });

    /* ── Live combatant sync ── */
    let unsubCombatants: (() => void) | null = null;
    const setupCombatantListener = () => {
      unsubCombatants?.();
      unsubCombatants = normalizedSessionCombatants.listenAll(cid, "current", (combatants) => {
        const store = useCombatStore.getState();
        if (!store.activeEncounter) return;
        // Merge incoming combatant data into the active encounter
        const existing = [...store.activeEncounter.combatants];
        let changed = false;
        for (const inc of combatants) {
          const idx = existing.findIndex((c) => c.id === inc.id);
          if (idx >= 0) {
            // Update HP, status effects, dead flag from DM
            existing[idx] = {
              ...existing[idx],
              hitPoints: inc.hitPoints ?? existing[idx].hitPoints,
              statusEffects: inc.statusEffects ?? existing[idx].statusEffects,
              isDead: inc.isDead ?? existing[idx].isDead,
              isConcentrating: inc.isConcentrating ?? existing[idx].isConcentrating,
              name: inc.name ?? existing[idx].name,
              initiative: inc.initiative ?? existing[idx].initiative,
              armorClass: inc.armorClass ?? existing[idx].armorClass,
            };
            changed = true;
          }
        }
        if (changed) {
          useCombatStore.setState({
            activeEncounter: { ...store.activeEncounter, combatants: existing },
          });
        }
      });
    };
    setupCombatantListener();

    const unsubItems = normalizedHomebrewItems.listenAll(cid, (items) => {
      const store = useHomebrewStore.getState();
      if (typeof store.setItems === "function") store.setItems(items);
    });
    const unsubSpells = normalizedHomebrewSpells.listenAll(cid, (spells) => {
      const store = useHomebrewStore.getState();
      if (typeof store.setSpells === "function") store.setSpells(spells);
    });
    const unsubFeats = normalizedHomebrewFeats.listenAll(cid, (feats) => {
      const store = useHomebrewStore.getState();
      if (typeof store.setFeats === "function") store.setFeats(feats);
    });

    // Eager fetch on mount
    normalizedSessions.fetchAll(cid).then((sessions) => {
      if (sessions.length > 0) {
        const ls = sessions[0];
        const store = useCombatStore.getState();
        if (ls.phase) store.setSessionPhase(ls.phase as "exploration" | "combat" | "rest" | "downtime");
        if (ls.currentScene) store.setCurrentScene(ls.currentScene);
        if (ls.currentMapUrl) store.setCurrentMapUrl(ls.currentMapUrl);
        if (ls.dmAnnouncement) store.setDmAnnouncement(ls.dmAnnouncement);
        if (ls.conditions) store.setConditions(ls.conditions);
      }
    });

    return () => {
      unsubSession?.();
      unsubMeta?.();
      unsubCombatLog?.();
      unsubCombatants?.();
      unsubItems?.();
      unsubSpells?.();
      unsubFeats?.();
      initializedRef.current = false;
    };
  }, [role, meta]);
}
