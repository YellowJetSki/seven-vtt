/**
 * STᚱ VTT — usePresence (Sprint 10)
 *
 * React hook for player presence management.
 *
 * DM view: subscribes to all presence entries, provides connected player list.
 * Player view: writes heartbeat on mount, updates every 30s, removes on unmount.
 *
 * Edge cases handled:
 *   - Tab crash: heartbeat expires after 60-90s → DM sees "disconnected" with (?) indicator
 *   - Multiple player tabs: last-write-wins (same characterId overwrites)
 *   - DM offline: presence still works if connected via Firebase
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useCampaignStore } from "@/stores/campaignStore";
import { writePresence, removePresence, listenPresence } from "@/lib/firestore/presence-service";
import type { PlayerPresenceEntry } from "@/lib/firestore/presence-service";

const HEARTBEAT_INTERVAL = 30000; // 30 seconds
const STALE_THRESHOLD = 90000; // 90 seconds

/**
 * Hook for DM view — subscribe to ALL connected players.
 */
export function usePresenceSubscription(): {
  connectedPlayers: PlayerPresenceEntry[];
  isLoading: boolean;
  connectedCount: number;
} {
  const [connectedPlayers, setConnectedPlayers] = useState<PlayerPresenceEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const campaignId = useCampaignStore((s) => s.meta?.id);

  useEffect(() => {
    setIsLoading(true);
    const unsub = listenPresence(campaignId || null, (entries) => {
      // Filter stale entries client-side
      const now = Date.now();
      const fresh = entries.filter((e) => e.lastSeen > now - STALE_THRESHOLD);
      setConnectedPlayers(fresh);
      setIsLoading(false);
    });

    return () => unsub();
  }, [campaignId]);

  const connectedCount = connectedPlayers.length;

  return { connectedPlayers, isLoading, connectedCount };
}

/**
 * Hook for Player view — write heartbeat, remove on unmount.
 */
export function usePlayerPresence(): {
  isOnline: boolean;
  lastHeartbeat: number | null;
} {
  const characterId = useAuthStore((s) => s.characterId);
  const playerName = useAuthStore((s) => s.username);
  const role = useAuthStore((s) => s.role);
  const campaignId = useCampaignStore((s) => s.meta?.id);
  const firebaseConnected = useAuthStore((s) => s.firebaseConnected);

  const [lastHeartbeat, setLastHeartbeat] = useState<number | null>(null);
  const hasError = useRef(false);

  // Heartbeat function
  const heartbeat = useCallback(async () => {
    if (!campaignId || !characterId || !playerName || !role) return;

    try {
      await writePresence(campaignId, characterId, playerName, role);
      setLastHeartbeat(Date.now());
      hasError.current = false;
    } catch (err) {
      if (!hasError.current) {
        console.warn("[Presence] Heartbeat failed (will retry):", err);
        hasError.current = true;
      }
    }
  }, [campaignId, characterId, playerName, role]);

  // Write on mount + interval
  useEffect(() => {
    if (!characterId || !firebaseConnected) return;

    // Immediate write on mount
    heartbeat();

    // Interval updates
    const interval = setInterval(heartbeat, HEARTBEAT_INTERVAL);

    return () => {
      clearInterval(interval);
    };
  }, [characterId, firebaseConnected, heartbeat]);

  // Remove on unmount
  useEffect(() => {
    return () => {
      if (campaignId && characterId) {
        removePresence(campaignId, characterId).catch(() => {
          // Silent cleanup — best effort
        });
      }
    };
  }, [campaignId, characterId]);

  const isOnline = lastHeartbeat !== null && (Date.now() - lastHeartbeat) < STALE_THRESHOLD;

  return { isOnline, lastHeartbeat };
}
