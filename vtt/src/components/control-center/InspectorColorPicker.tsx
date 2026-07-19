/**
 * STᚱ VTT — Inspector Color Picker
 *
 * Color preset selector for the token inspector.
 */

const COLOR_PRESETS = [
  "#4a9eff", "#22c55e", "#ef4444", "#f59e0b",
  "#8b5cf6", "#ec4899", "#06b6d4", "#f97316",
  "#84cc16", "#14b8a6", "#d946ef", "#0ea5e9",
];

interface InspectorColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

export default function InspectorColorPicker({
  value,
  onChange,
}: InspectorColorPickerProps) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-widest text-surface-500 font-black mb-1 block">
        Token Color
      </label>
      <div className="flex items-center gap-1.5 flex-wrap">
        {COLOR_PRESETS.map((c) => (
          <button
            key={c}
            onClick={() => onChange(c)}
            className={`w-6 h-6 rounded-full border-2 transition-all ${
              value === c ? "border-white scale-110" : "border-transparent hover:scale-110"
            }`}
            style={{ backgroundColor: c }}
            aria-label={`Select color ${c}`}
          />
        ))}
      </div>
    </div>
  );
}
