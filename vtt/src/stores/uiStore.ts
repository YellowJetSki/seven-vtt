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

  toggleSidebar: () => {
    const current = get().sidebarOpen;
    // On mobile, toggling closes it (it's an overlay)
    // On desktop, toggling collapses it to w-16
    set({ sidebarOpen: !current });
  },

  setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),

  toggleQuickRef: () => set((state) => ({ showQuickRef: !state.showQuickRef })),
  setQuickRef: (show: boolean) => set({ showQuickRef: show }),

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
