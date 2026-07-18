interface MapViewControlsProps {
  showFog: boolean;
  isDmView: boolean;
  showGrid: boolean;
  onToggleFog: () => void;
  onToggleDmView: () => void;
  onToggleGrid: () => void;
}

export default function MapViewControls({
  showFog, isDmView, showGrid,
  onToggleFog, onToggleDmView, onToggleGrid,
}: MapViewControlsProps) {
  return (
    <div className="absolute top-4 right-4 flex gap-2">
      <button
        onClick={onToggleFog}
        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
          showFog
            ? "bg-accent-600/40 text-accent-200 border border-accent-500/30"
            : "bg-surface-800/60 text-surface-400 border border-surface-600/30 hover:bg-surface-700"
        }`}
      >
        {showFog ? "🔦 Fog On" : "🌫 Fog Off"}
      </button>

      <button
        onClick={onToggleDmView}
        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
          isDmView
            ? "bg-rogue-600/40 text-rogue-200 border border-rogue-500/30"
            : "bg-surface-800/60 text-surface-400 border border-surface-600/30 hover:bg-surface-700"
        }`}
      >
        {isDmView ? "👁 DM View" : "👤 Player View"}
      </button>

      <button
        onClick={onToggleGrid}
        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
          showGrid
            ? "bg-mage-600/40 text-mage-200 border border-mage-500/30"
            : "bg-surface-800/60 text-surface-400 border border-surface-600/30 hover:bg-surface-700"
        }`}
      >
        {showGrid ? "▦ Grid" : "◻ No Grid"}
      </button>
    </div>
  );
}
