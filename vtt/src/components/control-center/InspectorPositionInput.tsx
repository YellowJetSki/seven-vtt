/**
 * STᚱ VTT — Inspector Position Input
 *
 * X/Y grid coordinate inputs for the token inspector.
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
      <label className="text-[10px] uppercase tracking-widest text-surface-500 font-black mb-1 block">
        Position (Grid)
      </label>
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <span className="text-[10px] text-surface-500">X</span>
          <input
            type="number"
            value={x}
            onChange={(e) => onXChange(parseInt(e.target.value) || 0)}
            className="input-arcane w-full py-1 px-2 text-xs"
            min={0}
          />
        </div>
        <div className="flex-1">
          <span className="text-[10px] text-surface-500">Y</span>
          <input
            type="number"
            value={y}
            onChange={(e) => onYChange(parseInt(e.target.value) || 0)}
            className="input-arcane w-full py-1 px-2 text-xs"
            min={0}
          />
        </div>
      </div>
    </div>
  );
}
