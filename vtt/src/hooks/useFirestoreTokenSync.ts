/**
 * STᚱ VTT — useFirestoreTokenSync (Fixed)
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
 * FIX (Sprint 25): Fixed race condition where rapid map switching caused
 * cross-contamination of listener references. Previously, `async function subscribe()`
 * inside `useEffect` created a window where:
 *   1. User clicks Map A → subscribe() starts (getFirestoreDb() pending)
 *   2. User clicks Map B → cleanup runs, sets mounted=false for Map A
 *   3. Map A's getFirestoreDb() resolves → stores listener in unsubRef
 *   4. Map B's cleanup later calls unsubRef.current() → which is Map A's listener!
 *      Map A's listener is never properly unsubscribed (memory leak + stale data).
 *
 * Fix: Use subscription generation counter. Each new subscription increments the gen counter.
 * When the async init resolves, it checks if it's still the GENUINE latest subscription.
 * If not, it immediately unsubscribes and discards the reference.
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
  // Generation counter: increments on every new subscription.
  // When async init completes, only the latest generation's listener survives.
  const genRef = useRef(0);

  const setMapTokens = useCampaignStore((s) => s.setMapTokens);

  useEffect(() => {
    // Skip if mapId hasn't changed and we're already listening
    if (mapId === lastMapIdRef.current && initializedRef.current) return;

    // Clean up previous listener BEFORE subscribing to new map
    if (unsubRef.current) {
      unsubRef.current();
      unsubRef.current = null;
    }

    const newGen = ++genRef.current;
    lastMapIdRef.current = mapId;

    if (!mapId) {
      initializedRef.current = true;
      return;
    }

    // TypeScript narrow: mapId is definitely string here
    const activeMapId: string = mapId;

    // Subscribe — listenMapTokens returns sync Unsubscribe immediately
    // (getFirestoreDb() is called internally, but the returned unsubscribe
    //  function captures the null `unsub` ref and will call it when available)
    const unsub = listenMapTokens(FALLBACK_CAMPAIGN_ID, activeMapId, (tokens) => {
      // Stale generation check: if this listener belongs to a previous
      // subscription, discard the callback to prevent stale state
      if (genRef.current !== newGen) return;
      // Merge Firestore tokens into Zustand — this is the source of truth
      setMapTokens(activeMapId, tokens);
    });

    unsubRef.current = unsub;
    initializedRef.current = true;

    return () => {
      if (unsubRef.current) {
        unsubRef.current();
        unsubRef.current = null;
      }
      initializedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapId]);
}
