/**
 * STᚱ VTT — Inspector Position Input (Premium Gold)
 *
 * Gold-accented X/Y grid coordinate inputs for the token inspector.
 */

interface InspectorPositionInputProps {
  x: number;
  y: number;
  onXChange: (x: number) => void;
  onYChange: (y: number) => void;
}

export default function InspectorPositionInput({
  x,
  y,
  onXChange,
  onYChange,
}: InspectorPositionInputProps) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-widest text-gold-500/60 font-black mb-1.5 block">
        Position (Grid)
      </label>
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <span className="text-[10px] text-surface-500">X</span>
          <input
            type="number"
            value={x}
            onChange={(e) => onXChange(parseInt(e.target.value) || 0)}
            className="w-full py-1 px-2 text-xs bg-obsidian-mid/60 border border-surface-700/30 rounded-lg text-surface-200 focus:border-gold/30 focus:ring-1 focus:ring-gold/20 transition-all outline-none"
            min={0}
          />
        </div>
        <div className="flex-1">
          <span className="text-[10px] text-surface-500">Y</span>
          <input
            type="number"
            value={y}
            onChange={(e) => onYChange(parseInt(e.target.value) || 0)}
            className="w-full py-1 px-2 text-xs bg-obsidian-mid/60 border border-surface-700/30 rounded-lg text-surface-200 focus:border-gold/30 focus:ring-1 focus:ring-gold/20 transition-all outline-none"
            min={0}
          />
        </div>
      </div>
    </div>
  );
}
