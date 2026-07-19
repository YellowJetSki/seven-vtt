/**
 * STᚱ VTT — useFirestoreCombatSync
 *
 * Bridges the combatStore (Zustand) with Firestore real-time data.
 *
 * Architecture:
 *   Firestore ──(onSnapshot)──► useFirestoreCombatSync ──(set)──► combatStore
 *   UI actions ──► useCombatMutations ──(setDoc)──► Firestore ◄──(onSnapshot)──► other tabs
 *
 * This hook:
 *   1. Subscribes to Firestore `onSnapshot` for the active combat encounter
 *   2. Merges incoming data into the Zustand combatStore
 *   3. Tracks connection status
 *   4. Cleans up listeners on unmount
 *
 * MUST be mounted once (alongside useFirestoreSync) in the auth gate.
 */

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useCombatStore } from "@/stores/combatStore";
import { listenActiveEncounter } from "@/lib/firestore-service";
import { FALLBACK_CAMPAIGN_ID } from "./useFirestoreSync";

export function useFirestoreCombatSync(): void {
  const initialized = useRef(false);
  const unsubRef = useRef<(() => void) | null>(null);

  const authState = useAuthStore((s) => s.state);
  const setFirebaseConnected = useAuthStore((s) => s.setFirebaseConnected);
  const setEncounter = useCombatStore((s) => s.setEncounter);

  useEffect(() => {
    if (authState !== "authenticated") return;
    if (initialized.current) return;
    initialized.current = true;

    let mounted = true;

    async function subscribe() {
      try {
        const unsub = listenActiveEncounter(FALLBACK_CAMPAIGN_ID, (encounter) => {
          if (!mounted) return;
          if (encounter) {
            setEncounter(encounter);
          }
          setFirebaseConnected(true);
        });
        if (mounted) {
          unsubRef.current = unsub;
        }
      } catch (err) {
        console.warn("[FirestoreCombatSync] Failed to subscribe:", err);
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
    };
  }, [authState, setEncounter, setFirebaseConnected]);
}
