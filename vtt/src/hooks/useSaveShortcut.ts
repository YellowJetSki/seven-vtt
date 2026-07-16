/* ── useSaveShortcut ─────────────────────────────────────────────
 * Global Ctrl+S / Cmd+S save shortcut. Displays a toast and
 * triggers the provided save handler. Prevents the browser's
 * native "Save Page" dialog.
 * ──────────────────────────────────────────────────────────────── */
import { useEffect, useCallback } from "react";
import { useUiStore } from "@/stores/uiStore";

export function useSaveShortcut(onSave?: () => void) {
  const showToast = useUiStore((s) => s.showToast);

  const handleSave = useCallback((e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "s") {
      e.preventDefault();
      onSave?.();
      showToast({ message: "✨ Campaign saved", type: "success" });
    }
  }, [onSave, showToast]);

  useEffect(() => {
    window.addEventListener("keydown", handleSave);
    return () => window.removeEventListener("keydown", handleSave);
  }, [handleSave]);
}
