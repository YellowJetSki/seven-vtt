import { useUIStore } from "@/stores/uiStore";

const typeStyles: Record<string, string> = {
  success: "border-rogue-500/30 bg-rogue-500/10 text-rogue-300",
  error: "border-warrior-500/30 bg-warrior-500/10 text-warrior-300",
  info: "border-mage-500/30 bg-mage-500/10 text-mage-300",
  warning: "border-divine-500/30 bg-divine-500/10 text-divine-300",
};

const typeIcons: Record<string, string> = {
  success: "✓",
  error: "✕",
  info: "ℹ",
  warning: "⚠",
};

export default function ToastContainer() {
  const toasts = useUIStore((s) => s.toasts);
  const dismissToast = useUIStore((s) => s.dismissToast);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`animate-slide-in-up flex items-start gap-3 px-4 py-3 rounded-lg border backdrop-blur-md ${typeStyles[toast.type]}`}
        >
          <span className="mt-0.5 text-lg">{typeIcons[toast.type]}</span>
          <p className="flex-1 text-sm">{toast.message}</p>
          <button
            onClick={() => dismissToast(toast.id)}
            className="text-current opacity-60 hover:opacity-100 transition-opacity"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
