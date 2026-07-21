/**
 * STᚱ VTT — Canvas Focus Store
 *
 * A lightweight Zustand store that bridges DM popovers (Legendary Tracker,
 * Concentration Timer, Wild Shape, etc.) with the CanvasMapView.
 *
 * When a DM tool needs to highlight a creature, it sets `focusTokenId`
 * here. The Canvas Map View subscribes to this store and applies
 * an animated gold highlight ring to the focused token.
 *
 * Flow:
 *   DM clicks "Legendary Dragon" in DmLegendaryTracker
 *     → canvasFocusStore.setFocusToken("token_dragon_01")
 *     → CanvasMapView picks it up via store subscription
 *     → Gold pulsing ring rendered around Dragon token
 *     → Camera optionally pans to center the focused token
 *
 * After 3 seconds of no focus updates, the highlight auto-clears.
 */

import { create } from "zustand";

interface CanvasFocusState {
  /** The token ID currently focused, or null if none */
  focusTokenId: string | null;
  /** Whether to auto-pan the camera to the focused token */
  shouldAutoPan: boolean;
  /** Timestamp of the last focus update (for auto-clear) */
  lastFocusAt: number;
}

interface CanvasFocusActions {
  /** Set the focused token. Pass null to clear the focus. */
  setFocusToken: (tokenId: string | null, autoPan?: boolean) => void;
  /** Clear the current focus (called by Canvas on focus timeout) */
  clearFocus: () => void;
}

const FOCUS_DURATION_MS = 3000;

export const useCanvasFocusStore = create<CanvasFocusState & CanvasFocusActions>()((set) => ({
  focusTokenId: null,
  shouldAutoPan: false,
  lastFocusAt: 0,

  setFocusToken: (tokenId: string | null, autoPan = true) => {
    set({
      focusTokenId: tokenId,
      shouldAutoPan: autoPan,
      lastFocusAt: Date.now(),
    });
  },

  clearFocus: () => {
    set({
      focusTokenId: null,
      shouldAutoPan: false,
      lastFocusAt: 0,
    });
  },
}));

/**
 * Helper: subscribe to focus changes and auto-clear after FOCUS_DURATION_MS.
 * Call this from a useEffect in CanvasMapView or any subscribing component.
 *
 * Returns an unsubscribe function for the subscription.
 */
export function subscribeFocusAutoClear(callback: (tokenId: string | null) => void): () => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const unsub = useCanvasFocusStore.subscribe((state) => {
    if (timeoutId) clearTimeout(timeoutId);

    callback(state.focusTokenId);

    if (state.focusTokenId) {
      timeoutId = setTimeout(() => {
        useCanvasFocusStore.getState().clearFocus();
      }, FOCUS_DURATION_MS);
    }
  });

  return () => {
    if (timeoutId) clearTimeout(timeoutId);
    unsub();
  };
}
