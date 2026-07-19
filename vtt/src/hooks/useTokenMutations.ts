/**
 * STᚱ VTT — useTokenMutations
 *
 * ALL map token mutations centralized into a single hook.
 * Every mutation writes to BOTH:
 *   1. Zustand campaignStore (instant UI feedback for current tab)
 *   2. Firestore (real-time sync to other tabs/devices via onSnapshot)
 *
 * This is the DM's single source of truth for:
 *   - Token grid positions (with 5ft grid snapping handled by useTokenDrag)
 *   - Token HP, visibility, label, color, size
 *   - Token creation and deletion
 *
 * Usage:
 *   const { moveToken, updateToken, addToken, removeToken } = useTokenMutations(mapId);
 *   moveToken(tokenId, 12, 8); // Snaps to grid, syncs to Firestore
 */

import { useCallback } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import { setMapToken, deleteMapToken } from "@/lib/firestore-service";
import type { MapToken } from "@/types";
import { FALLBACK_CAMPAIGN_ID } from "./useFirestoreSync";

/**
 * Writes a map token to both Zustand (instant) and Firestore (async).
 */
function useWriteToken(mapId: string | null) {
  const updateMapToken = useCampaignStore((s) => s.updateMapToken);

  return useCallback(
    (tokenId: string, updates: Partial<MapToken>) => {
      if (!mapId) return;

      // Update Zustand immediately
      updateMapToken(mapId, tokenId, updates);

      // Read the full updated token for Firestore write
      const tokens = useCampaignStore.getState().mapTokens[mapId] ?? [];
      const fullToken = tokens.find((t) => t.id === tokenId);
      if (!fullToken) return;

      // Write to Firestore async
      setMapToken(FALLBACK_CAMPAIGN_ID, mapId, tokenId, {
        ...fullToken,
        ...updates,
        updatedAt: Date.now(),
      }).catch((err) => {
        console.warn("[Firestore/Tokens] Write failed:", err);
      });
    },
    [mapId, updateMapToken]
  );
}

/**
 * All token mutation hooks for a given map.
 */
export function useTokenMutations(mapId: string | null) {
  const addMapToken = useCampaignStore((s) => s.addMapToken);
  const removeMapToken = useCampaignStore((s) => s.removeMapToken);
  const writeToken = useWriteToken(mapId);

  /**
   * Move a token to a grid-snapped position.
   * x and y are expected to be in grid coordinates (e.g., 5, 3 = 5th column, 3rd row).
   */
  const moveToken = useCallback(
    (tokenId: string, gridX: number, gridY: number) => {
      writeToken(tokenId, { x: gridX, y: gridY });
    },
    [writeToken]
  );

  /**
   * Update arbitrary fields on a token.
   */
  const updateToken = useCallback(
    (tokenId: string, updates: Partial<MapToken>) => {
      writeToken(tokenId, updates);
    },
    [writeToken]
  );

  /**
   * Add a new token to the map (writes to both Zustand and Firestore).
   */
  const addToken = useCallback(
    (token: MapToken) => {
      if (!mapId) return;

      // Add to Zustand immediately
      addMapToken(mapId, token);

      // Write to Firestore async
      setMapToken(FALLBACK_CAMPAIGN_ID, mapId, token.id, token).catch((err) => {
        console.warn("[Firestore/Tokens] Add failed:", err);
      });
    },
    [mapId, addMapToken]
  );

  /**
   * Remove a token from the map.
   */
  const removeToken = useCallback(
    (tokenId: string) => {
      if (!mapId) return;

      // Remove from Zustand immediately
      removeMapToken(mapId, tokenId);

      // Delete from Firestore async
      deleteMapToken(FALLBACK_CAMPAIGN_ID, mapId, tokenId).catch((err) => {
        console.warn("[Firestore/Tokens] Delete failed:", err);
      });
    },
    [mapId, removeMapToken]
  );

  return { moveToken, updateToken, addToken, removeToken };
}
