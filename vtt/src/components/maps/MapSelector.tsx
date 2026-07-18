import type { BattleMap } from "@/types";

interface MapSelectorProps {
  maps: BattleMap[];
  onSelect: (map: BattleMap) => void;
}

export default function MapSelector({ maps, onSelect }: MapSelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {maps.map((map) => (
        <button
          key={map.id}
          onClick={() => onSelect(map)}
          className="p-6 rounded-xl bg-surface-800/40 border border-surface-700/30 hover:border-accent-500/40 hover:bg-surface-800/60 transition-all text-left group"
        >
          <div className="text-3xl mb-3">🗺</div>
          <h3 className="font-bold text-white group-hover:text-accent-300 transition-colors">{map.name}</h3>
          <p className="text-xs text-surface-500 mt-1">{map.gridWidth} × {map.gridHeight} grid</p>
        </button>
      ))}
    </div>
  );
}
