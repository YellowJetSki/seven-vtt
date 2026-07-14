/* ── Toast Container ────────────────────────────────────────────
 * The DM's real-time notification system.
 * Displays styled toast messages (success, error, info, warning)
 * in a fixed bottom-right container. Supports stacking.
 * ─────────────────────────────────────────────────────────────── */

import { useState, useEffect, useCallback } from "react";
import { useUiStore } from "@/stores/uiStore";
import type { Toast } from "@/stores/uiStore";

/* ═══════════════════════════════════════════════════════════════
 * TOAST CONTAINER
 *
 * Features:
 *  • Individual auto-dismiss timers per toast
 *  • Stack up to 5 visible toasts
 *  • Dismissible by click
 *  • Color-coded by type
 *  • Animated entrance and exit
 * ═══════════════════════════════════════════════════════════════ */

export function ToastContainer() {
  const currentToast = useUiStore((s) => s.toast);
  const dismissToast = useUiStore((s) => s.dismissToast);

  const [toastStack, setToastStack] = useState<(Toast & { id: number })[]>([]);
  const [toastIdCounter, setToastIdCounter] = useState(0);

  // When a new toast arrives, add it to the stack
  useEffect(() => {
    if (!currentToast) return;

    const newId = toastIdCounter + 1;
    setToastIdCounter(newId);
    setToastStack((prev) => [...prev, { ...currentToast, id: newId }].slice(-5));

    // Auto-dismiss after duration
    const duration = currentToast.duration ?? 4000;
    const timer = setTimeout(() => {
      setToastStack((prev) => prev.filter((t) => t.id !== newId));
    }, duration);

    // Dismiss the store toast immediately so it can receive new ones
    dismissToast();

    return () => clearTimeout(timer);
  }, [currentToast, dismissToast, toastIdCounter]);

  const removeToast = useCallback((id: number) => {
    setToastStack((prev) => prev.filter((t) => t.id !== id));
  }, []);

  if (toastStack.length === 0) return null;

  const typeStyles: Record<Toast["type"], { bg: string; border: string; icon: string }> = {
    success: {
      bg: "bg-rogue-500/10",
      border: "border-rogue-500/30",
      icon: "✓",
    },
    error: {
      bg: "bg-warrior-500/10",
      border: "border-warrior-500/30",
      icon: "✕",
    },
    info: {
      bg: "bg-mage-500/10",
      border: "border-mage-500/30",
      icon: "ℹ",
    },
    warning: {
      bg: "bg-divine-500/10",
      border: "border-divine-500/30",
      icon: "⚠",
    },
  };

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      {toastStack.map((toast) => {
        const style = typeStyles[toast.type];
        return (
          <div
            key={toast.id}
            className={`flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-sm animate-in slide-in-from-right-5 fade-in duration-200 ${style.bg} ${style.border}`}
            onClick={() => removeToast(toast.id)}
          >
            <span className="mt-0.5 text-lg shrink-0">{style.icon}</span>
            <p className="text-sm text-surface-200 flex-1">{toast.message}</p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeToast(toast.id);
              }}
              className="text-surface-500 hover:text-surface-300 text-xs shrink-0 mt-0.5"
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}
