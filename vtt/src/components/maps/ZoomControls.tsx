/**
 * STᚱ VTT — Zoom Controls (Premium Glass w/ Tailwind)
 *
 * Vertical zoom control stack with gold glass styling.
 * Positioned in the bottom-right corner of the battle map canvas.
 *
 * Features:
 * - Glass dark background with backdrop blur
 * - Zoom in (+)/Zoom out (−) with gold accent and hover glow
 * - Disabled states at min/max zoom
 * - Color-coded zoom percentage badge (amber ≤50%, gold normal, green ≥150%)
 * - Active scale feedback on press
 * - Compact 36px × 36px buttons
 */

interface ZoomControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

export default function ZoomControls({ zoom, onZoomIn, onZoomOut }: ZoomControlsProps) {
  const zoomPercent = Math.round(zoom * 100);
  const isMaxZoom = zoom >= 4;
  const isMinZoom = zoom <= 0.25;

  return (
    <div className="absolute bottom-4 right-4 flex flex-col items-center gap-1 z-20">
      {/* Glass card */}
      <div className="flex flex-col items-center gap-1 rounded-xl overflow-hidden bg-gradient-to-b from-[#0f101a]/85 to-[#0a0b12]/90 backdrop-blur-xl border border-white/[0.06] shadow-[0_4px_16px_rgba(0,0,0,0.3)] p-[3px]">
        {/* Zoom In */}
        <button
          onClick={onZoomIn}
          disabled={isMaxZoom}
          className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold transition-all duration-150 active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed text-gold-500 hover:bg-gold-500/8"
          title="Zoom In (+)"
          aria-label="Zoom in"
        >
          +
        </button>

        {/* Divider */}
        <div className="w-5 h-px bg-white/[0.06]" />

        {/* Zoom Out */}
        <button
          onClick={onZoomOut}
          disabled={isMinZoom}
          className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold transition-all duration-150 active:scale-90 disabled:opacity-30 disabled:cursor-not-allowed text-gold-500 hover:bg-gold-500/8"
          title="Zoom Out (-)"
          aria-label="Zoom out"
        >
          −
        </button>
      </div>

      {/* Zoom percentage badge */}
      <div className="px-2 py-0.5 rounded-lg text-center bg-gradient-to-b from-[#0f101a]/60 to-[#0a0b12]/70 backdrop-blur-sm border border-white/[0.04]">
        <span
          className="text-[10px] font-mono tabular-nums font-bold"
          style={{
            color: zoomPercent <= 50 ? "#f59e0b" : zoomPercent >= 150 ? "#22c55e" : "#eab308",
          }}
        >
          {zoomPercent}%
        </span>
      </div>
    </div>
  );
}
