/**
 * STᚱ VTT — Canvas Zoom & Pan Indicator (Premium)
 *
 * A compact, animated zoom percentage indicator that floats on the canvas.
 * Shows current zoom level, and optionally: pan coordinates, and fit-to-content
 * status. Appears on zoom change with a short fade-out delay.
 *
 * Features:
 *   - Large, easy-to-read zoom percentage
 *   - Smooth animate-in on zoom change + auto-fade after 1.5s
 *   - Gold accent styling matching the design system
 *   - Keyboard shortcut hint ("+/- or scroll to zoom")
 *   - Pan position shown as subtle indicator ("X: 128 Y: 64")
 *   - Compact pill layout that doesn't obscure the map
 *
 * Layout:
 *   ┌─────────────┐
 *   │  Zoom 125%  │
 *   │  X: 32 Y: 0 │ (subtle)
 *   └─────────────┘
 *
 * Cycle 25 (Premium Battlemap Overhaul — FINAL):
 *   - Premium zoom visualization with auto-fade
 *   - Responsive to both mouse wheel and keyboard zoom
 *   - Glass dark styling
 */

import { useEffect, useState, useRef } from "react";

// ── Props ────────────────────────────────────────────────

interface CanvasZoomIndicatorProps {
  /** Current zoom level (1 = 100%) */
  zoom: number;
  /** Current pan X offset (pixels) */
  panX?: number;
  /** Current pan Y offset (pixels) */
  panY?: number;
}

// ── Component ───────────────────────────────────────────

export default function CanvasZoomIndicator({
  zoom,
  panX = 0,
  panY = 0,
}: CanvasZoomIndicatorProps) {
  const [visible, setVisible] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const hintTimerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const prevZoomRef = useRef(zoom);

  // Show indicator briefly on zoom change
  useEffect(() => {
    if (zoom !== prevZoomRef.current) {
      prevZoomRef.current = zoom;
      setVisible(true);

      // Clear previous timer
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setVisible(false), 1500);
    }
  }, [zoom]);

  // Show "scroll to zoom" hint on first interaction
  useEffect(() => {
    if (!showHint) {
      hintTimerRef.current = setTimeout(() => setShowHint(true), 2000);
    }
    return () => {
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    };
  }, [showHint]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
    };
  }, []);

  const zoomPercent = Math.round(zoom * 100);

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
      {/* ── Zoom pill ── */}
      <div
        className="transition-all duration-300 ease-out"
        style={{
          opacity: visible ? 1 : 0,
          transform: `translateY(${visible ? 0 : 8}px)`,
        }}
      >
        <div className="flex flex-col items-center">
          {/* Main zoom badge */}
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
            style={{
              background: "rgba(15, 16, 26, 0.85)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(234, 179, 8, 0.15)",
              boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
            }}
          >
            {/* Zoom icon */}
            <span className="text-[10px] text-gold-400/70">🔍</span>

            {/* Zoom value */}
            <span className="text-sm font-bold font-mono text-gold-400 tabular-nums">
              {zoomPercent}%
            </span>

            {/* Zoom level indicator bar */}
            <div className="w-12 h-1 rounded-full overflow-hidden" style={{
              background: "rgba(255, 255, 255, 0.06)",
            }}>
              <div
                className="h-full rounded-full transition-all duration-200"
                style={{
                  width: `${Math.max(5, Math.min(100, zoomPercent))}%`,
                  background: zoomPercent <= 50
                    ? "#f59e0b"
                    : zoomPercent >= 150
                      ? "#22c55e"
                      : "#eab308",
                }}
              />
            </div>
          </div>

          {/* Pan coordinates (subtle) */}
          {visible && (
            <div className="mt-1 px-2 py-0.5 rounded-lg" style={{
              background: "rgba(15, 16, 26, 0.6)",
              backdropFilter: "blur(4px)",
            }}>
              <span className="text-[9px] font-mono text-surface-500">
                X: {Math.round(panX)} Y: {Math.round(panY)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Hover hint (shows once) ── */}
      {showHint && !visible && (
        <div
          className="mt-1 transition-opacity duration-1000"
          style={{ opacity: 0.4 }}
        >
          <span className="text-[8px] text-surface-500">
            scroll to zoom · drag to pan
          </span>
        </div>
      )}
    </div>
  );
}
