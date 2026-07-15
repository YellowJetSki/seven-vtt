/* ── UI Global Store ─────────────────────────────────────────── */

import { create } from "zustand";

interface UiState {
  sidebarOpen: boolean;
  activeModal: string | null;
  modalData: unknown;
  toast: Toast | null;

  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  openModal: (modalId: string, data?: unknown) => void;
  closeModal: () => void;
  showToast: (toast: Toast) => void;
  dismissToast: () => void;
}

export interface Toast {
  message: string;
  type: "success" | "error" | "info" | "warning";
  duration?: number;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: true,
  activeModal: null,
  modalData: null,
  toast: null,

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),

  openModal: (activeModal, modalData = null) => set({ activeModal, modalData }),
  closeModal: () => set({ activeModal: null, modalData: null }),

  showToast: (toast) => set({ toast }),
  dismissToast: () => set({ toast: null }),
}));
