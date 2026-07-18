import { useUIStore } from "@/stores/uiStore";

const typeStyles: Record<string, string> = {
  success: "border-rogue-500/25 bg-rogue-500/8",
  error: "border-warrior-500/25 bg-warrior-500/8",
  info: "border-mage-500/25 bg-mage-500/8",
  warning: "border-divine-500/25 bg-divine-500/8",
};

const typeIcons: Record<string, string> = {
  success: "✓",
  error: "✕",
  info: "ℹ",
  warning: "⚠",
};

const typeColors: Record<string, string> = {
  success: "text-rogue-400",
  error: "text-warrior-400",
  info: "text-mage-400",
  warning: "text-divine-400",
};

export default function ToastContainer() {
  const toasts = useUIStore((s) => s.toasts);
  const dismissToast = useUIStore((s) => s.dismissToast);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      {toasts.map((toast, idx) => (
        <div
          key={toast.id}
          className={`toast-premium flex items-start gap-3 px-4 py-3 border ${typeStyles[toast.type]} ${typeColors[toast.type]} animate-slide-in-up`}
          style={{ animationDelay: `${idx * 50}ms` }}
        >
          <span className="mt-0.5 text-base font-bold">{typeIcons[toast.type]}</span>
          <p className="flex-1 text-sm font-medium">{toast.message}</p>
          <button
            onClick={() => dismissToast(toast.id)}
            className="text-current opacity-50 hover:opacity-100 transition-opacity duration-200 p-0.5"
            aria-label="Dismiss"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
