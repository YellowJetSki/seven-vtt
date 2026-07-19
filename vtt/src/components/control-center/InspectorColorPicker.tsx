/**
 * STᚱ VTT — Inspector Color Picker
 *
 * Token color selector with a grid of preset colors.
 */

interface InspectorColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

const COLORS = [
  "#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#d946ef",
  "#ec4899", "#f43f5e", "#ef4444", "#f97316", "#f59e0b",
  "#eab308", "#84cc16", "#22c55e", "#14b8a6", "#06b6d4",
  "#0ea5e9", "#64748b", "#ffffff",
];

export default function InspectorColorPicker({
  value,
  onChange,
}: InspectorColorPickerProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] uppercase tracking-wider text-surface-500 font-medium">
        Token Color
      </label>
      <div className="grid grid-cols-6 gap-1.5">
        {COLORS.map((color) => (
          <button
            key={color}
            onClick={() => onChange(color)}
            className={`
              w-8 h-8 rounded-lg transition-all duration-150 border
              ${value === color
                ? "ring-2 ring-gold-500/30 scale-110 border-transparent"
                : "border-white/[0.06] hover:scale-105"
              }
            `}
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
      </div>
    </div>
  );
}
