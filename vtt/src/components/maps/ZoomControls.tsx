/**
 * STᚱ VTT — Zoom Controls (Premium Glass)
 *
 * Vertical zoom control stack with gold glass styling.
 * Positioned in the bottom-right corner of the battle map canvas.
 *
 * Features:
 *   - Zoom in (+) / Zoom out (−) buttons with gold accent
 *   - Zoom percentage display underneath
 *   - Glass-dark background with backdrop blur
 *   - Hover glow effects matching the gold design system
 *   - Compact 36px × 36px buttons with active scale feedback
 *   - Keyboard shortcut hint in the tooltip
 *
 * Cycle 25 (Premium Battlemap Overhaul — FINAL):
 *   - Premium gold glass design matching the new keyboard shortcut system
 *   - Enhanced hover/active states
 *   - Tooltip with keyboard shortcut reference
 */

interface ZoomControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

export default function ZoomControls({ zoom, onZoomIn, onZoomOut }: ZoomControlsProps) {
  const zoomPercent = Math.round(zoom * 100);

  return (
    <div className="absolute bottom-4 right-4 flex flex-col items-center gap-1 z-20">
      {/* ── Glass card ── */}
      <div
        className="flex flex-col items-center gap-1 rounded-xl overflow-hidden"
        style={{
          background: "rgba(15, 16, 26, 0.85)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255, 255, 255, 0.06)",
          boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
          padding: "3px",
        }}
      >
        {/* Zoom In */}
        <button
          onClick={onZoomIn}
          className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold transition-all duration-150 active:scale-90"
          style={{
            color: zoom >= 4 ? "#6b7280" : "#eab308",
            background: "transparent",
          }}
          onMouseEnter={(e) => {
            if (zoom < 4) {
              e.currentTarget.style.background = "rgba(234, 179, 8, 0.08)";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
          }}
          disabled={zoom >= 4}
          title="Zoom In (+)"
          aria-label="Zoom in"
        >
          +
        </button>

        {/* Divider */}
        <div style={{
          width: "20px",
          height: "1px",
          background: "rgba(255, 255, 255, 0.06)",
        }} />

        {/* Zoom Out */}
        <button
          onClick={onZoomOut}
          className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold transition-all duration-150 active:scale-90"
          style={{
            color: zoom <= 0.25 ? "#6b7280" : "#eab308",
            background: "transparent",
          }}
          onMouseEnter={(e) => {
            if (zoom > 0.25) {
              e.currentTarget.style.background = "rgba(234, 179, 8, 0.08)";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
          }}
          disabled={zoom <= 0.25}
          title="Zoom Out (-)"
          aria-label="Zoom out"
        >
          −
        </button>
      </div>

      {/* ── Zoom percentage ── */}
      <div
        className="px-2 py-0.5 rounded-lg text-center"
        style={{
          background: "rgba(15, 16, 26, 0.6)",
          backdropFilter: "blur(4px)",
          border: "1px solid rgba(255, 255, 255, 0.04)",
        }}
      >
        <span className="text-[10px] font-mono tabular-nums font-bold" style={{
          color: zoomPercent <= 50 ? "#f59e0b" : zoomPercent >= 150 ? "#22c55e" : "#eab308",
        }}>
          {zoomPercent}%
        </span>
      </div>
    </div>
  );
}
