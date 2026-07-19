interface TheatricStatusBarProps {
  mapName?: string;
  isConnected: boolean;
  show: boolean;
  onToggleFullscreen: () => void;
}

export default function TheatricStatusBar({ mapName, isConnected, show, onToggleFullscreen }: TheatricStatusBarProps) {
  const connectionText = isConnected ? "🟢 Live" : "🟡 Connecting...";

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-40 transition-opacity duration-500 ${
        show ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <div className="bg-gradient-to-b from-black/60 to-transparent px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-white/80 font-semibold text-sm">
              {mapName || "Theatric Display"}
            </span>
            <span className="text-[10px] text-surface-400 uppercase tracking-wider">
              {connectionText}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleFullscreen}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-xs transition-all backdrop-blur-sm border border-white/10"
              aria-label="Toggle fullscreen"
            >
              ⛶ Fullscreen
            </button>
            <span className="text-[10px] text-surface-500">
              Arkla — STᚱ VTT
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
