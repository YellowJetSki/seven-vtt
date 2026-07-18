import { create } from "zustand";
import type { Toast } from "@/types";

interface UIState {
  sidebarOpen: boolean;
  activeModal: string | null;
  modalData: unknown;
  toasts: Toast[];
}

interface UIActions {
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  openModal: (modalId: string, data?: unknown) => void;
  closeModal: () => void;
  showToast: (message: string, type: Toast["type"], duration?: number) => void;
  dismissToast: (toastId: string) => void;
}

let toastIdCounter = 0;

export const useUIStore = create<UIState & UIActions>()((set) => ({
  sidebarOpen: true,
  activeModal: null,
  modalData: null,
  toasts: [],

  toggleSidebar: () =>
    set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),

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
