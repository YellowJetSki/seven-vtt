interface ZoomControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

export default function ZoomControls({ zoom, onZoomIn, onZoomOut }: ZoomControlsProps) {
  return (
    <div className="absolute bottom-4 right-4 flex flex-col gap-2">
      <button
        onClick={onZoomIn}
        className="w-10 h-10 rounded-lg bg-surface-800/80 backdrop-blur-sm border border-surface-600/50 text-white hover:bg-surface-700 flex items-center justify-center text-xl font-bold transition-colors"
        aria-label="Zoom in"
      >
        +
      </button>
      <button
        onClick={onZoomOut}
        className="w-10 h-10 rounded-lg bg-surface-800/80 backdrop-blur-sm border border-surface-600/50 text-white hover:bg-surface-700 flex items-center justify-center text-xl font-bold transition-colors"
        aria-label="Zoom out"
      >
        −
      </button>
      <span className="text-xs text-surface-400 text-center">{Math.round(zoom * 100)}%</span>
    </div>
  );
}
