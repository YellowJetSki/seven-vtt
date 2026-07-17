/* ── UI Global Store ─────────────────────────────────────────── */

import { create } from "zustand";

interface UiState {
  sidebarOpen: boolean;
  activeModal: string | null;
  modalData: unknown;
  toasts: Toast[];

  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  openModal: (modalId: string, data?: unknown) => void;
  closeModal: () => void;
  showToast: (toast: Toast) => void;
  dismissToast: (id: string) => void;
}

export interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info" | "warning";
  duration?: number;
}

let toastCounter = 0;
function nextToastId(): string {
  return `toast_${Date.now()}_${++toastCounter}`;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: true,
  activeModal: null,
  modalData: null,
  toasts: [],

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),

  openModal: (activeModal, modalData = null) => set({ activeModal, modalData }),
  closeModal: () => set({ activeModal: null, modalData: null }),

  showToast: (toast) => {
    const toastWithId: Toast = { ...toast, id: toast.id ?? nextToastId() };
    set((state) => ({
      toasts: [...state.toasts, toastWithId].slice(-5),
    }));
    // Auto-dismiss
    const duration = toast.duration ?? 4000;
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== toastWithId.id),
      }));
    }, duration);
  },

  dismissToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));
