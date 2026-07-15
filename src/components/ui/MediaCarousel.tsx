/* ── MediaCarousel ─────────────────────────────────────────────
 * A swipeable image gallery for homebrew items, spells, and feats.
 * Supports fullscreen mode, image-to-image navigation, and
 * fallback for missing images.
 * ─────────────────────────────────────────────────────────────── */

import { useState, useCallback, useEffect, useRef } from "react";

export interface MediaItem {
  id: string;
  src: string;
  alt: string;
  caption?: string;
}

interface MediaCarouselProps {
  items: MediaItem[];
  /** Start at a specific index */
  initialIndex?: number;
  onClose: () => void;
}

export function MediaCarousel({ items, initialIndex = 0, onClose }: MediaCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchDelta, setTouchDelta] = useState(0);
  const [loaded, setLoaded] = useState<Record<string, boolean>>({});
  const containerRef = useRef<HTMLDivElement>(null);

  const current = items[currentIndex];
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < items.length - 1;

  const goTo = useCallback((index: number) => {
    if (index >= 0 && index < items.length) {
      setCurrentIndex(index);
      setTouchDelta(0);
    }
  }, [items.length]);

  const goNext = useCallback(() => goTo(currentIndex + 1), [goTo, currentIndex]);
  const goPrev = useCallback(() => goTo(currentIndex - 1), [goTo, currentIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, goNext, goPrev]);

  // Touch handlers for swipe
  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.touches[0].clientX);
  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    setTouchDelta(e.touches[0].clientX - touchStart);
  };
  const handleTouchEnd = () => {
    if (touchDelta > 60 && hasPrev) goPrev();
    if (touchDelta < -60 && hasNext) goNext();
    setTouchStart(null);
    setTouchDelta(0);
  };

  if (!current) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-sm"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3">
        <span className="text-xs text-surface-400">
          {currentIndex + 1} / {items.length}
        </span>
        <button onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-800 text-surface-400 hover:bg-surface-700 hover:text-surface-200 transition-colors">
          ✕
        </button>
      </div>

      {/* Image container */}
      <div className="flex-1 flex items-center justify-center overflow-hidden">
        <div
          className="relative h-full w-full flex items-center justify-center transition-transform duration-200"
          style={{ transform: `translateX(${touchDelta}px)` }}
        >
          {!loaded[current.src] && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-500 border-t-transparent" />
            </div>
          )}
          <img
            key={current.src}
            src={current.src}
            alt={current.alt}
            onLoad={() => setLoaded((p) => ({ ...p, [current.src]: true }))}
            className={`max-h-full max-w-full object-contain transition-opacity duration-300 ${loaded[current.src] ? "opacity-100" : "opacity-0"}`}
          />
        </div>
      </div>

      {/* Caption */}
      {current.caption && (
        <div className="px-4 py-3 text-center">
          <p className="text-sm text-surface-300">{current.caption}</p>
        </div>
      )}

      {/* Bottom nav */}
      <div className="flex items-center justify-between px-4 py-4">
        <button onClick={goPrev} disabled={!hasPrev}
          className="rounded-lg border border-surface-700 bg-surface-800 px-4 py-2 text-xs font-medium text-surface-300 hover:bg-surface-700 hover:text-surface-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
          ← Previous
        </button>

        {/* Dots */}
        <div className="flex gap-1.5">
          {items.map((item, i) => (
            <button key={item.id} onClick={() => goTo(i)}
              className={`h-2 rounded-full transition-all ${i === currentIndex ? "w-6 bg-accent-500" : "w-2 bg-surface-600 hover:bg-surface-500"}`}
            />
          ))}
        </div>

        <button onClick={goNext} disabled={!hasNext}
          className="rounded-lg border border-surface-700 bg-surface-800 px-4 py-2 text-xs font-medium text-surface-300 hover:bg-surface-700 hover:text-surface-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
          Next →
        </button>
      </div>
    </div>
  );
}
