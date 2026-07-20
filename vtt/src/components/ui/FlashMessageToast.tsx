/**
 * STᚱ VTT — FlashMessageToast
 *
 * A reusable toast notification for one-line status feedback.
 * Auto-dismisses after 1500ms. Can be used anywhere in the app.
 *
 * Extracted from PlayerSheetInventoryTab.tsx monolith (Sprint 8 refactor).
 */

import { useEffect, useRef } from "react";

interface FlashMessageToastProps {
  message: string | null;
  onDismiss?: () => void;
}

export default function FlashMessageToast({ message, onDismiss }: FlashMessageToastProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (message && onDismiss) {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        onDismiss();
        timerRef.current = null;
      }, 1500);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [message, onDismiss]);

  if (!message) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[80] px-4 py-2 rounded-xl bg-gold-500/10 border border-gold/20 text-gold-400 text-[11px] font-semibold shadow-xl shadow-gold-500/5 backdrop-blur-sm animate-in fade-in slide-in-from-top-2 duration-150">
      {message}
    </div>
  );
}
