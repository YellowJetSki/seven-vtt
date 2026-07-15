import { useEffect } from "react";
import { Button } from "./Button";
import type { ButtonProps } from "./Button";

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "info";
  onConfirm: () => void;
  onCancel: () => void;
}

const VARIANT_STYLES: Record<string, { button: ButtonProps["variant"]; icon: string }> = {
  danger: { button: "danger", icon: "⚠️" },
  warning: { button: "primary", icon: "⚠️" },
  info: { button: "primary", icon: "ℹ️" },
};

export function ConfirmDialog({
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const config = VARIANT_STYLES[variant];

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="w-full max-w-sm rounded-xl border border-surface-700 bg-surface-850 p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl">{config.icon}</span>
          <h3 className="text-lg font-semibold text-surface-100">{title}</h3>
        </div>
        <p className="text-sm text-surface-400 leading-relaxed">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant={config.button} size="sm" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
