import { useState } from "react";
import type { LightSource, LightColor } from "@/types";
import { LIGHT_COLORS, generateLightId } from "@/types";
import LightColorPicker from "./LightColorPicker";
import ActiveLightsList from "./ActiveLightsList";

interface LightingControlsProps {
  lights: LightSource[];
  onAddLight: (light: LightSource) => void;
  onRemoveLight: (id: string) => void;
}

export default function LightingControls({ lights, onAddLight, onRemoveLight }: LightingControlsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [radius, setRadius] = useState(6);
  const [dimRadius, setDimRadius] = useState(12);
  const [color, setColor] = useState<LightColor>("torch");
  const [intensity, setIntensity] = useState(0.8);

  const handleAdd = () => {
    onAddLight({
      id: generateLightId(), x: 150, y: 150, radius, dimRadius, color, intensity,
      shape: "circle", isDynamic: false, animates: color === "torch" || color === "fire" || color === "candle",
      colorHex: LIGHT_COLORS[color].hex,
    });
  };

  return (
    <div className="space-y-3">
      <button onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 rounded-lg bg-surface-800/60 border border-surface-600/30 text-xs text-surface-300 hover:bg-surface-700 transition-colors flex items-center justify-between">
        <span>💡 Lighting Controls ({lights.length})</span>
        <span className={`transform transition-transform ${isOpen ? "rotate-180" : ""}`}>▼</span>
      </button>
      {isOpen && (
        <div className="space-y-3 p-3 rounded-lg bg-surface-800/40 border border-surface-700/30">
          <div>
            <label className="text-[10px] uppercase tracking-widest text-surface-500 font-black">Bright Radius</label>
            <input type="range" min={1} max={30} value={radius} onChange={e => setRadius(Number(e.target.value))} className="w-full accent-accent-500" />
            <span className="text-xs text-surface-400">{radius} units</span>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-surface-500 font-black">Dim Radius</label>
            <input type="range" min={1} max={60} value={dimRadius} onChange={e => setDimRadius(Number(e.target.value))} className="w-full accent-accent-500" />
            <span className="text-xs text-surface-400">{dimRadius} units</span>
          </div>
          <LightColorPicker value={color} onChange={setColor} />
          <div>
            <label className="text-[10px] uppercase tracking-widest text-surface-500 font-black">Intensity: {Math.round(intensity * 100)}%</label>
            <input type="range" min={0.1} max={1} step={0.1} value={intensity} onChange={e => setIntensity(Number(e.target.value))} className="w-full accent-accent-500" />
          </div>
          <button onClick={handleAdd} className="w-full py-2 rounded-lg bg-accent-600/40 text-accent-200 text-xs font-medium border border-accent-500/30 hover:bg-accent-600/60 transition-colors">+ Add Ambient Light</button>
          <ActiveLightsList lights={lights} onRemove={onRemoveLight} />
        </div>
      )}
    </div>
  );
}
