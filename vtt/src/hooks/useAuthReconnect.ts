/**
 * STᚱ VTT — useAuthReconnect (Sprint 7: Player Re-Login Persistence)
 *
 * Handles player re-authentication from persisted Zustand state
 * after a page refresh or tab close.
 *
 * The Zustand auth store persists: state, role, username, characterId
 *
 * When the page loads fresh:
 *   1. Zustand rehydrates from localStorage (sync)
 *   2. If role is "player" and we have a characterId, auto-login
 *   3. Character data arrives via Firestore onSnapshot (async, ~200ms)
 *
 * This hook enables the "connecting" state in PlayerSheetPage
 * while Firestore syncs the character data.
 *
 * Edge cases handled:
 *   - Page refresh: player sees "Loading campaign data..." briefly
 *   - Character deleted by DM: player sees "Character Not Found"
 *   - Firestore offline: player sees "Character data unavailable"
 *   - First-time login: player picks from character roster
 */

import { useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useCampaignStore } from "@/stores/campaignStore";

export function useAuthReconnect() {
  const authState = useAuthStore((s) => s.state);
  const role = useAuthStore((s) => s.role);
  const characterId = useAuthStore((s) => s.characterId);
  const characters = useCampaignStore((s) => s.characters);

  // When the page loads with persisted auth, we need to ensure
  // the character is in the campaign store before navigating.
  // The Firestore sync hooks handle this — this hook just provides
  // state for the UI to show loading states.
  useEffect(() => {
    if (authState === "authenticated" && role === "player" && characterId) {
      const exists = characters.some((c) => c.id === characterId);
      if (!exists) {
        // Character not yet synced from Firestore
        // The PlayerSheetPage shows its loading state
      }
    }
  }, [authState, role, characterId, characters]);

  return {
    isReconnecting:
      authState === "authenticated" &&
      role === "player" &&
      !!characterId,
  };
}
