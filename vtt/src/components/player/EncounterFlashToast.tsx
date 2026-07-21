/**
 * STᚱ VTT — Encounter Flash Toast
 *
 * Cycle 41: Extracted flash message component for encounter HP changes.
 * Shows damage/heal/info messages with type-appropriate styling.
 * Auto-dismisses after 2.5s with premium slide-in animation.
 */

import { useEffect } from "react";

export interface FlashMessage {
  text: string;
  type: "damage" | "heal" | "info";
}

interface EncounterFlashToastProps {
  message: FlashMessage | null;
  onDismiss: () => void;
}

export default function EncounterFlashToast({ message, onDismiss }: EncounterFlashToastProps) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => onDismiss(), 2500);
    return () => clearTimeout(t);
  }, [message, onDismiss]);

  if (!message) return null;

  return (
    <div
      className={`absolute top-2 right-2 z-10 px-3 py-1.5 rounded-lg text-[11px] font-semibold backdrop-blur-xl shadow-lg animate-in slide-in-from-top-1 duration-200 ${
        message.type === "damage"
          ? "bg-rose-500/20 text-rose-300 border border-rose-500/20"
          : message.type === "heal"
          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/20"
          : "bg-gold-500/15 text-gold-300 border border-gold-500/15"
      }`}
    >
      {message.text}
    </div>
  );
}
