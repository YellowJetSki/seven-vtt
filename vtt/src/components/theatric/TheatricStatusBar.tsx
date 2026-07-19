/**
 * STᚱ VTT — Theatric Status Bar (Premium Gold Glassmorphism)
 *
 * Premium auto-hide HUD overlay for the cinematic Theatric Display.
 * Glass-gold with backdrop blur, fades out after 3s of inactivity.
 * Provides grid toggle, label toggle, and fullscreen controls.
 * Hides all DM chrome by default — only player-facing controls.
 */

interface TheatricStatusBarProps {
  mapName?: string;
  isConnected: boolean;
  show: boolean;
  showGrid: boolean;
  showLabels: boolean;
  onToggleFullscreen: () => void;
  onToggleGrid: () => void;
  onToggleLabels: () => void;
}

export default function TheatricStatusBar({
  mapName,
  isConnected,
  show,
  showGrid,
  showLabels,
  onToggleFullscreen,
  onToggleGrid,
  onToggleLabels,
}: TheatricStatusBarProps) {
  return (
    <div
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 ${
        show
          ? "opacity-100 translate-y-0"
          : "opacity-0 -translate-y-2 pointer-events-none"
      }`}
    >
      {/* Gold glass backdrop */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/50 to-transparent backdrop-blur-sm" />
        <div className="absolute inset-0 bg-gradient-to-b from-gold-500/[0.03] to-transparent" />

        <div className="relative px-5 py-3 flex items-center justify-between">
          {/* Left: Map name + connection */}
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-2">
              <span className="text-gold-400/50 text-lg leading-none">ᚱ</span>
              <span className="text-white/85 font-semibold text-sm tracking-wide drop-shadow-[0_0_8px_rgba(234,179,8,0.15)]">
                {mapName || "Theatric Display"}
              </span>
            </span>
            <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider">
              <span
                className={`inline-block w-1.5 h-1.5 rounded-full ${
                  isConnected
                    ? "bg-gold-400 shadow-[0_0_6px_rgba(234,179,8,0.5)]"
                    : "bg-amber-500/60"
                }`}
              />
              <span className={isConnected ? "text-gold-400/70" : "text-amber-400/60"}>
                {isConnected ? "Live" : "Sync"}
              </span>
            </span>
          </div>

          {/* Right: Controls */}
          <div className="flex items-center gap-1.5">
            {/* Grid toggle */}
            <button
              onClick={onToggleGrid}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-200 backdrop-blur-sm border ${
                showGrid
                  ? "bg-gold-500/10 border-gold/25 text-gold-400 shadow-[0_0_12px_rgba(234,179,8,0.1)]"
                  : "bg-white/[0.04] border-white/[0.08] text-white/40 hover:bg-white/[0.08] hover:text-white/60 hover:border-white/15"
              }`}
              aria-label="Toggle grid overlay"
            >
              ▦ Grid
            </button>

            {/* Label toggle */}
            <button
              onClick={onToggleLabels}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-200 backdrop-blur-sm border ${
                showLabels
                  ? "bg-gold-500/10 border-gold/25 text-gold-400 shadow-[0_0_12px_rgba(234,179,8,0.1)]"
                  : "bg-white/[0.04] border-white/[0.08] text-white/40 hover:bg-white/[0.08] hover:text-white/60 hover:border-white/15"
              }`}
              aria-label="Toggle token labels"
            >
              Aa Labels
            </button>

            {/* Separator */}
            <span className="w-px h-4 bg-white/[0.06] mx-1" />

            {/* Fullscreen */}
            <button
              onClick={onToggleFullscreen}
              className="px-2.5 py-1.5 rounded-lg text-xs transition-all duration-200 backdrop-blur-sm border border-white/[0.08] text-white/50 hover:text-gold-400 hover:border-gold/20 hover:bg-gold-500/8"
              aria-label="Toggle fullscreen"
            >
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                </svg>
                <span className="hidden sm:inline text-[11px]">Fullscreen</span>
              </span>
            </button>
          </div>
        </div>

        {/* Gold accent line at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-500/10 to-transparent" />
      </div>
    </div>
  );
}
