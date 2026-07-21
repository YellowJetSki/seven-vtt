/**
 * STᚱ VTT — Token Context Menu Store
 *
 * Lightweight Zustand store managing the right-click context menu
 * position and the target token. When the DM right-clicks a canvas
 * token, this store opens the menu at the click position, and
 * any action (damage, heal, conditions, etc.) reads the target token
 * from here.
 *
 * Flow:
 *   DM right-clicks token on canvas
 *     → CanvasMapView detects hit, uses CanvasEventGuard
 *     → contextMenuStore.openMenu(token, {x, y})
 *     → TokenContextMenu renders as fixed DOM overlay at {x, y}
 *     → DM clicks action button (e.g., "Damage -5")
 *     → menuStore.target is read by action handler
 *     → Action writes to Zustand + Firestore
 *     → contextMenuStore.closeMenu()
 */

import { create } from "zustand";
import type { MapToken } from "@/types";

export interface ContextMenuPosition {
  x: number;
  y: number;
}

interface ContextMenuState {
  /** The target token, or null if menu is closed */
  targetToken: MapToken | null;
  /** Screen position for the floating menu */
  position: ContextMenuPosition;
  /** Whether the menu is visible */
  isOpen: boolean;
}

interface ContextMenuActions {
  /** Open the context menu at a screen position for a target token */
  openMenu: (token: MapToken, x: number, y: number) => void;
  /** Close the context menu */
  closeMenu: () => void;
  /** Get the current target if still valid */
  getTarget: () => MapToken | null;
}

export const useContextMenuStore = create<ContextMenuState & ContextMenuActions>()((set, get) => ({
  targetToken: null,
  position: { x: 0, y: 0 },
  isOpen: false,

  openMenu: (token: MapToken, x: number, y: number) => {
    set({
      targetToken: token,
      position: { x, y },
      isOpen: true,
    });
  },

  closeMenu: () => {
    set({
      targetToken: null,
      isOpen: false,
    });
  },

  getTarget: () => {
    return get().targetToken;
  },
}));
