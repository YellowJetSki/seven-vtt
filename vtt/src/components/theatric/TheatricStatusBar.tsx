/**
 * STᚱ VTT — Theatric Status Bar (Premium Gold)
 *
 * Minimal HUD overlay for the cinematic Theatric Display.
 * Gold-accented, fades out when idle, shows connection status.
 */

interface TheatricStatusBarProps {
  mapName?: string;
  isConnected: boolean;
  show: boolean;
  onToggleFullscreen: () => void;
}

export default function TheatricStatusBar({
  mapName,
  isConnected,
  show,
  onToggleFullscreen,
}: TheatricStatusBarProps) {
  return (
    <div
      className={`fixed top-0 left-0 right-0 z-40 transition-opacity duration-500 ${
        show ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <div className="bg-gradient-to-b from-black/70 to-transparent px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-white/80 font-semibold text-sm drop-shadow-[0_0_8px_rgba(234,179,8,0.2)]">
              {mapName || "Theatric Display"}
            </span>
            <span className="text-[10px] text-gold-400/60 uppercase tracking-wider">
              {isConnected ? "🟢 Live" : "🟡 Connecting..."}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleFullscreen}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-gold-500/10 text-white/60 hover:text-gold-400 text-xs transition-all backdrop-blur-sm border border-white/10 hover:border-gold/20"
              aria-label="Toggle fullscreen"
            >
              ⛶ Fullscreen
            </button>
            <span className="text-[10px] text-gold-500/40">Arkla — STᚱ VTT</span>
          </div>
        </div>
      </div>
    </div>
  );
}
