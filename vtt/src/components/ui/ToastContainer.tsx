/**
 * STᚱ VTT — Toast Container
 *
 * Lightweight toast notification system for undo feedback and confirmations.
 * Uses a simple stack pattern via Zustand uiStore.
 */

import { useCallback, useEffect, useState } from "react";
import { X } from "lucide-react";

export interface Toast {
  id: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  duration?: number;
  /** Optional undo action */
  onUndo?: () => void;
  undoLabel?: string;
}

// Global toast queue (simple module-level array)
let toastListeners: Array<(toasts: Toast[]) => void> = [];
let toastQueue: Toast[] = [];
let toastCounter = 0;

export function showToast(toast: Omit<Toast, "id">) {
  const id = `toast_${++toastCounter}`;
  const entry: Toast = { ...toast, id };
  toastQueue = [...toastQueue, entry];
  toastListeners.forEach((fn) => fn(toastQueue));

  // Auto-dismiss
  const duration = toast.duration ?? 4000;
  setTimeout(() => {
    toastQueue = toastQueue.filter((t) => t.id !== id);
    toastListeners.forEach((fn) => fn(toastQueue));
  }, duration);
}

export function dismissToast(id: string) {
  toastQueue = toastQueue.filter((t) => t.id !== id);
  toastListeners.forEach((fn) => fn(toastQueue));
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const handler = (updated: Toast[]) => setToasts([...updated]);
    toastListeners.push(handler);
    return () => {
      toastListeners = toastListeners.filter((h) => h !== handler);
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border backdrop-blur-md animate-slide-up ${
            toast.type === "error"
              ? "bg-red-950/90 border-red-500/30 text-red-200"
              : toast.type === "warning"
                ? "bg-amber-950/90 border-amber-500/30 text-amber-200"
                : toast.type === "success"
                  ? "bg-emerald-950/90 border-emerald-500/30 text-emerald-200"
                  : "bg-surface-950/90 border-surface-600/40 text-surface-200"
          }`}
          style={{ maxWidth: "420px" }}
        >
          <span className="text-xs font-medium leading-tight flex-1">{toast.message}</span>
          {toast.onUndo && (
            <button
              onClick={toast.onUndo}
              className="text-[10px] uppercase tracking-wider font-bold text-gold-400 hover:text-gold-300 transition-colors whitespace-nowrap"
            >
              {toast.undoLabel ?? "Undo"}
            </button>
          )}
          <button
            onClick={() => dismissToast(toast.id)}
            className="p-0.5 rounded hover:bg-white/10 text-surface-400 hover:text-surface-200 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
    </div>
  );
}
