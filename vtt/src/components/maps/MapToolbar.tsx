import Button from "@/components/ui/Button";

interface MapToolbarProps {
  placementMode: "none" | "light" | "wall" | "door";
  mapName: string;
  onBack: () => void;
  onSetPlacementMode: (mode: "none" | "light" | "wall" | "door") => void;
}

export default function MapToolbar({ placementMode, mapName, onBack, onSetPlacementMode }: MapToolbarProps) {
  return (
    <div className="flex items-center justify-between mb-4 flex-shrink-0">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-surface-400 hover:text-surface-200 text-sm transition-colors">← Back</button>
        <h2 className="text-lg font-bold text-white">{mapName}</h2>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm"
          onClick={() => onSetPlacementMode(placementMode === "light" ? "none" : "light")}
          className={placementMode === "light" ? "bg-gold-500/10 border-gold/25 text-gold-400 shadow-[0_0_4px_rgba(234,179,8,0.06)]" : ""}>
          💡 Place Light
        </Button>
        <Button variant="ghost" size="sm"
          onClick={() => onSetPlacementMode(placementMode === "wall" ? "none" : "wall")}
          className={placementMode === "wall" ? "bg-gold-500/10 border-gold/25 text-gold-400 shadow-[0_0_4px_rgba(234,179,8,0.06)]" : ""}>
          🧱 Place Wall
        </Button>
        <Button variant="ghost" size="sm"
          onClick={() => onSetPlacementMode(placementMode === "door" ? "none" : "door")}
          className={placementMode === "door" ? "bg-gold-500/10 border-gold/25 text-gold-400 shadow-[0_0_4px_rgba(234,179,8,0.06)]" : ""}>
          🚪 Place Door
        </Button>
      </div>
    </div>
  );
}
