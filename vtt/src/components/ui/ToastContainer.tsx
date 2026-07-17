/* ── Toast Container ────────────────────────────────────────────
 * The DM's real-time notification system.
 * Displays styled toast messages (success, error, info, warning)
 * in a fixed bottom-right container. Supports stacking.
 *
 * UPDATED: Uses `toasts` array from uiStore (each toast has its
 * own auto-dismiss timer managed by the store).
 * ─────────────────────────────────────────────────────────────── */

import { useUiStore } from "@/stores/uiStore";
import type { Toast } from "@/stores/uiStore";

const TYPE_STYLES: Record<Toast["type"], { bg: string; border: string; icon: string }> = {
  success: { bg: "bg-rogue-500/10", border: "border-rogue-500/30", icon: "✓" },
  error: { bg: "bg-warrior-500/10", border: "border-warrior-500/30", icon: "✕" },
  info: { bg: "bg-mage-500/10", border: "border-mage-500/30", icon: "ℹ" },
  warning: { bg: "bg-divine-500/10", border: "border-divine-500/30", icon: "⚠" },
};

export function ToastContainer() {
  const toasts = useUiStore((s) => s.toasts);
  const dismissToast = useUiStore((s) => s.dismissToast);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm pointer-events-none">
      {toasts.map((toast) => {
        const style = TYPE_STYLES[toast.type];
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-sm animate-in slide-in-from-right-5 fade-in duration-200 ${style.bg} ${style.border}`}
            onClick={() => dismissToast(toast.id)}
          >
            <span className="mt-0.5 text-lg shrink-0">{style.icon}</span>
            <p className="text-sm text-surface-200 flex-1">{toast.message}</p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                dismissToast(toast.id);
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
