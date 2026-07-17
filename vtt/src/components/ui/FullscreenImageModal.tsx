/* ── FullscreenImageModal ──────────────────────────────────────
 * Dismissible fullscreen image viewer for character portraits,
 * battle maps, item images, etc. Closes on click, escape, or
 * backdrop click. Keyboard accessible.
 * ─────────────────────────────────────────────────────────────── */

import { useEffect, useCallback } from "react";

interface FullscreenImageModalProps {
  src: string;
  alt: string;
  onClose: () => void;
}

export function FullscreenImageModal({ src, alt, onClose }: FullscreenImageModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [handleKeyDown]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-label={`Fullscreen view: ${alt}`}
      aria-modal="true"
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white/70 backdrop-blur-sm transition-colors hover:bg-white/20 hover:text-white"
        aria-label="Close fullscreen view"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M5 5l10 10M15 5L5 15" />
        </svg>
      </button>

      {/* Image */}
      <div
        className="relative max-h-[90vh] max-w-[90vw] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={src}
          alt={alt}
          className="max-h-[90vh] max-w-[90vw] rounded-xl object-contain shadow-2xl"
        />
        <p className="mt-2 text-center text-sm text-white/50">{alt}</p>
      </div>
    </div>
  );
}
