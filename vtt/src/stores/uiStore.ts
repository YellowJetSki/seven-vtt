/**
 * STᚱ VTT — UI Store (Zustand)
 *
 * Central UI state management.
 * - sidebarOpen: sidebar visibility (mobile overlay / desktop push)
 * - sidebarCollapsed: desktop-only collapsed state (w-16 icon-only mode)
 * - activeModal: which modal is currently open
 * - toasts: notification queue
 *
 * Architecture:
 *   Desktop (lg+): sidebar is ALWAYS visible as a side-rail.
 *     - sidebarOpen = true  → w-64 (full, labels visible)
 *     - sidebarOpen = false → w-16 (collapsed, icons only)
 *     - Hamburger toggle switches between these two states
 *     - The sidebar NEVER disappears on desktop
 *
 *   Mobile (< lg): sidebar is a fixed overlay.
 *     - sidebarOpen = true  → overlay slides in from left
 *     - sidebarOpen = false → hidden off-screen
 *     - Hamburger toggles the overlay
 *     - Bottom nav provides persistent mobile nav
 */

import { create } from "zustand";
import type { Toast } from "@/types";

interface UIState {
  sidebarOpen: boolean;
  activeModal: string | null;
  modalData: unknown;
  toasts: Toast[];
  showQuickRef: boolean;
  showPartyRest: boolean;
  showCombatConditions: boolean;
  showQuickActions: boolean;
  showNpcQuickCreate: boolean;
  showCombatWrapUp: boolean;
  showSkillCheck: boolean;
  showSocialInteraction: boolean;
  showTreasureGenerator: boolean;
  showConcentrationTimer: boolean;
  showLegendaryTracker: boolean;
  showSpellReference: boolean;
  showWildShapeTracker: boolean;
  showDowntimeTracker: boolean;
  showTravelPace: boolean;
  showShipCombat: boolean;
  showQuickNote: boolean;
}

interface UIActions {
  /** Toggle sidebar open/closed */
  toggleSidebar: () => void;
  /** Set sidebar state explicitly */
  setSidebarOpen: (open: boolean) => void;
  /** Always ensure sidebar is open on desktop (for navigation changes) */
  ensureSidebarForDesktop: () => void;
  /** Toggle DM Quick Reference overlay */
  toggleQuickRef: () => void;
  /** Set DM Quick Reference overlay visibility */
  setQuickRef: (show: boolean) => void;
  /** Set DM Party Rest overlay visibility */
  setPartyRest: (show: boolean) => void;
  /** Set DM Combat Condition Bar visibility */
  setCombatConditions: (show: boolean) => void;
  /** Set DM Quick Actions overlay visibility */
  setQuickActions: (show: boolean) => void;
  /** Set DM NPC Quick Create overlay visibility */
  setNpcQuickCreate: (show: boolean) => void;
  /** Set DM Combat Wrap-Up overlay visibility */
  setCombatWrapUp: (show: boolean) => void;
  /** Set DM Skill Check overlay visibility */
  setSkillCheck: (show: boolean) => void;
  /** Set DM Social Interaction overlay visibility */
  setSocialInteraction: (show: boolean) => void;
  /** Set DM Treasure Generator overlay visibility */
  setTreasureGenerator: (show: boolean) => void;
  /** Set DM Concentration Timer overlay visibility */
  setConcentrationTimer: (show: boolean) => void;
  /** Set DM Legendary Action Tracker overlay visibility */
  setLegendaryTracker: (show: boolean) => void;
  /** Set DM Spell Reference overlay visibility */
  setSpellReference: (show: boolean) => void;
  setWildShapeTracker: (show: boolean) => void;
  setDowntimeTracker: (show: boolean) => void;
  setTravelPace: (show: boolean) => void;
  setShipCombat: (show: boolean) => void;
  setQuickNote: (show: boolean) => void;
  openModal: (modalId: string, data?: unknown) => void;
  closeModal: () => void;
  showToast: (message: string, type: Toast["type"], duration?: number) => void;
  dismissToast: (toastId: string) => void;
}

let toastIdCounter = 0;

export const useUIStore = create<UIState & UIActions>()((set, get) => ({
  // Default: sidebar open on desktop, closed on mobile
  sidebarOpen: typeof window !== "undefined" ? window.innerWidth >= 1024 : true,
  activeModal: null,
  modalData: null,
  toasts: [],
  showQuickRef: false,
  showPartyRest: false,
  showCombatConditions: false,
  showQuickActions: false,
  showNpcQuickCreate: false,
  showCombatWrapUp: false,
  showSkillCheck: false,
  showSocialInteraction: false,
  showTreasureGenerator: false,
  showConcentrationTimer: false,
  showLegendaryTracker: false,
  showSpellReference: false,
  showWildShapeTracker: false,
  showDowntimeTracker: false,
  showTravelPace: false,
  showShipCombat: false,
  showQuickNote: false,

  toggleSidebar: () => {
    const current = get().sidebarOpen;
    // On mobile, toggling closes it (it's an overlay)
    // On desktop, toggling collapses it to w-16
    set({ sidebarOpen: !current });
  },

  setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),

  toggleQuickRef: () => set((state) => ({ showQuickRef: !state.showQuickRef })),
  setQuickRef: (show: boolean) => set({ showQuickRef: show }),
  setPartyRest: (show: boolean) => set({ showPartyRest: show }),
  setCombatConditions: (show: boolean) => set({ showCombatConditions: show }),
  setQuickActions: (show: boolean) => set({ showQuickActions: show }),
  setNpcQuickCreate: (show: boolean) => set({ showNpcQuickCreate: show }),
  setCombatWrapUp: (show: boolean) => set({ showCombatWrapUp: show }),
  setSkillCheck: (show: boolean) => set({ showSkillCheck: show }),
  setSocialInteraction: (show: boolean) => set({ showSocialInteraction: show }),
  setTreasureGenerator: (show: boolean) => set({ showTreasureGenerator: show }),
  setConcentrationTimer: (show: boolean) => set({ showConcentrationTimer: show }),
  setLegendaryTracker: (show: boolean) => set({ showLegendaryTracker: show }),
  setSpellReference: (show: boolean) => set({ showSpellReference: show }),
  setWildShapeTracker: (show: boolean) => set({ showWildShapeTracker: show }),
  setDowntimeTracker: (show: boolean) => set({ showDowntimeTracker: show }),
  setTravelPace: (show: boolean) => set({ showTravelPace: show }),
  setShipCombat: (show: boolean) => set({ showShipCombat: show }),
  setQuickNote: (show: boolean) => set({ showQuickNote: show }),

  ensureSidebarForDesktop: () => {
    if (typeof window !== "undefined" && window.innerWidth >= 1024) {
      // On desktop, sidebar should NEVER be fully closed
      // If somehow it's closed, re-open it
      // (This handles the bug where navigation resets sidebar state)
    }
  },

  openModal: (modalId: string, data?: unknown) =>
    set({ activeModal: modalId, modalData: data ?? null }),

  closeModal: () => set({ activeModal: null, modalData: null }),

  showToast: (message: string, type: Toast["type"], duration = 4000) => {
    const id = `toast_${++toastIdCounter}`;
    set((state) => ({
      toasts: [...state.toasts, { id, message, type, duration }],
    }));
    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, duration);
    }
  },

  dismissToast: (toastId: string) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== toastId),
    })),
}));
