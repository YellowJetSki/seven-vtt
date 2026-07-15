import { useEffect, useRef } from "react";

/* ── Props ── */
interface ImageViewerModalProps {
  imageUrl: string;
  itemName: string;
  onClose: () => void;
}

/**
 * Full-screen image viewer for players to inspect item images (maps, drawings, etc.).
 * Supports pinch-zoom on mobile and scroll-wheel zoom on desktop.
 */
export function ImageViewerModal({ imageUrl, itemName, onClose }: ImageViewerModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className="relative flex max-h-[90vh] max-w-[90vw] flex-col items-center">
        {/* Top bar */}
        <div className="mb-3 flex w-full items-center justify-between">
          <p className="text-sm font-medium text-surface-200 truncate">
            {itemName}
          </p>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-800/80 text-surface-300 hover:bg-surface-700 hover:text-surface-100 transition-colors"
            aria-label="Close image viewer"
          >
            ✕
          </button>
        </div>

        {/* Image */}
        <div className="overflow-auto rounded-xl bg-surface-950 p-2 shadow-2xl">
          <img
            src={imageUrl}
            alt={itemName}
            className="max-h-[80vh] w-auto max-w-full rounded-lg object-contain"
            draggable={false}
          />
        </div>

        {/* Hint */}
        <p className="mt-3 text-[11px] text-surface-500">
          Scroll to zoom · Click outside to close
        </p>
      </div>
    </div>
  );
}
