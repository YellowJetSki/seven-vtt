/**
 * STᚱ VTT — useFirestoreSync
 *
 * Bridges the gap between local Zustand state and Firestore real-time data.
 *
 * Architecture:
 *   Firestore ──(onSnapshot)──► useFirestoreSync ──(setState)──► Zustand Store
 *   UI mutations ──► useCharacterMutations ──(setDoc)──► Firestore ◄──(onSnapshot)──► other tabs
 *
 * This hook:
 *   1. Subscribes to Firestore `onSnapshot` for characters collection
 *   2. Merges incoming data into the Zustand campaignStore
 *   3. Tracks connection status in authStore
 *   4. Cleans up listeners on unmount
 *
 * MUST be mounted once at the top of the app tree (App.tsx or CampaignPage).
 */

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useCampaignStore } from "@/stores/campaignStore";
import { listenCharacters } from "@/lib/firestore-service";

const FALLBACK_CAMPAIGN_ID = "arkla-campaign";

export function useFirestoreSync(): void {
  const initialized = useRef(false);
  const unsubRef = useRef<(() => void) | null>(null);

  const authState = useAuthStore((s) => s.state);
  const role = useAuthStore((s) => s.role);
  const setFirebaseConnected = useAuthStore((s) => s.setFirebaseConnected);
  const setCharacters = useCampaignStore((s) => s.setCharacters);

  useEffect(() => {
    // Only subscribe when authenticated
    if (authState !== "authenticated" || !role) {
      return;
    }

    // Prevent double-subscription in development strict mode
    if (initialized.current) return;
    initialized.current = true;

    let mounted = true;

    async function subscribe() {
      try {
        const unsub = await listenCharacters(FALLBACK_CAMPAIGN_ID, (characters) => {
          if (!mounted) return;
          // Merge Firestore data into Zustand — this is the source of truth
          setCharacters(characters);
          setFirebaseConnected(true);
        });
        if (mounted) {
          unsubRef.current = unsub;
        }
      } catch (err) {
        console.warn("[FirestoreSync] Failed to subscribe to characters:", err);
        setFirebaseConnected(false);
      }
    }

    subscribe();

    return () => {
      mounted = false;
      initialized.current = false;
      if (unsubRef.current) {
        unsubRef.current();
        unsubRef.current = null;
      }
      setFirebaseConnected(false);
    };
  }, [authState, role, setCharacters, setFirebaseConnected]);
}

/**
 * FALLBACK_CAMPAIGN_ID is exported so other Firestore service calls
 * (writes, combat sync, etc.) use the same campaign ID.
 */
export { FALLBACK_CAMPAIGN_ID };
