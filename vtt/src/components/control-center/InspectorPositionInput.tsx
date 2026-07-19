/**
 * STᚱ VTT — Inspector Position Input
 *
 * Grid coordinate inputs for token position (X/Y).
 * Gold-accented focus states.
 */

interface InspectorPositionInputProps {
  x: number;
  y: number;
  onXChange: (value: number) => void;
  onYChange: (value: number) => void;
}

export default function InspectorPositionInput({
  x,
  y,
  onXChange,
  onYChange,
}: InspectorPositionInputProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] uppercase tracking-wider text-surface-500 font-medium">
        Position (grid)
      </label>
      <div className="flex gap-2">
        <div className="flex-1">
          <span className="text-[9px] text-surface-500 block mb-0.5">X</span>
          <input
            type="number"
            value={x}
            onChange={(e) => onXChange(Number(e.target.value))}
            className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-[#0c0d15] border border-white/[0.06] text-white/80 focus:outline-none focus:border-gold-500/25 focus:ring-1 focus:ring-gold-500/15 transition-all duration-200"
          />
        </div>
        <div className="flex-1">
          <span className="text-[9px] text-surface-500 block mb-0.5">Y</span>
          <input
            type="number"
            value={y}
            onChange={(e) => onYChange(Number(e.target.value))}
            className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-[#0c0d15] border border-white/[0.06] text-white/80 focus:outline-none focus:border-gold-500/25 focus:ring-1 focus:ring-gold-500/15 transition-all duration-200"
          />
        </div>
      </div>
    </div>
  );
}
