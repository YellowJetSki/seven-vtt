/**
 * STᚱ VTT — useFirestoreTokenSync
 *
 * Bridges map tokens between Firestore and the Zustand campaignStore.
 *
 * Architecture:
 *   Firestore ──(onSnapshot)──► useFirestoreTokenSync ──(setMapTokens)──► campaignStore
 *   Token drag/move ──► useTokenMutations ──(setMapToken)──► Firestore ◄──(onSnapshot)──► other tabs
 *
 * This hook:
 *   1. Subscribes to Firestore `onSnapshot` for the current map's tokens subcollection
 *   2. Merges incoming data into the Zustand campaignStore
 *   3. Tracks the currently active mapId (from campaignStore or URL)
 *   4. Cleans up listeners on map change or unmount
 *
 * MUST be mounted in the DM Control Center or wherever map tokens are displayed.
 */

import { useEffect, useRef } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import { listenMapTokens } from "@/lib/firestore-service";
import { FALLBACK_CAMPAIGN_ID } from "./useFirestoreSync";

/**
 * Subscribe to Firestore token changes for a given map.
 * Pass null or undefined to unsubscribe (e.g., when no map is selected).
 */
export function useFirestoreTokenSync(mapId: string | null): void {
  const unsubRef = useRef<(() => void) | null>(null);
  const lastMapIdRef = useRef<string | null>(null);
  const initializedRef = useRef(false);

  const setMapTokens = useCampaignStore((s) => s.setMapTokens);

  useEffect(() => {
    // Skip if mapId hasn't changed and we're already listening
    if (mapId === lastMapIdRef.current && initializedRef.current) return;

    // Clean up previous listener
    if (unsubRef.current) {
      unsubRef.current();
      unsubRef.current = null;
    }

    lastMapIdRef.current = mapId;

    if (!mapId) {
      initializedRef.current = true;
      return;
    }

    // TypeScript narrow: mapId is definitely string here
    const activeMapId: string = mapId;
    let mounted = true;

    async function subscribe() {
      try {
        const unsub = listenMapTokens(FALLBACK_CAMPAIGN_ID, activeMapId, (tokens) => {
          if (!mounted) return;
          // Merge Firestore tokens into Zustand — this is the source of truth
          setMapTokens(activeMapId, tokens);
        });
        if (mounted) {
          unsubRef.current = unsub;
          initializedRef.current = true;
        }
      } catch (err) {
        console.warn("[FirestoreTokenSync] Failed to subscribe:", err);
      }
    }

    subscribe();

    return () => {
      mounted = false;
      if (unsubRef.current) {
        unsubRef.current();
        unsubRef.current = null;
      }
      initializedRef.current = false;
    };
  }, [mapId, setMapTokens]);
}
