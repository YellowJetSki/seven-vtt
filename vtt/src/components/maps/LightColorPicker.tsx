import type { LightColor } from "@/types";
import { LIGHT_COLORS } from "@/types";

interface LightColorPickerProps {
  value: LightColor;
  onChange: (color: LightColor) => void;
}

export default function LightColorPicker({ value, onChange }: LightColorPickerProps) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-widest text-surface-500 font-black">Color</label>
      <div className="grid grid-cols-5 gap-1 mt-1">
        {(Object.keys(LIGHT_COLORS) as LightColor[]).map((key) => (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={`w-full aspect-square rounded-lg border-2 transition-all ${
              value === key ? "border-white scale-110 shadow-lg" : "border-transparent opacity-60 hover:opacity-100"
            }`}
            style={{ backgroundColor: LIGHT_COLORS[key].hex }}
            title={LIGHT_COLORS[key].label}
            aria-label={LIGHT_COLORS[key].label}
          />
        ))}
      </div>
    </div>
  );
}
