import type { LightSource } from "@/types";

interface ActiveLightsListProps {
  lights: LightSource[];
  onRemove: (id: string) => void;
}

export default function ActiveLightsList({ lights, onRemove }: ActiveLightsListProps) {
  if (lights.length === 0) return null;
  return (
    <div className="space-y-1 mt-2">
      <label className="text-[10px] uppercase tracking-widest text-surface-500 font-black">Active Lights</label>
      {lights.map((light) => (
        <div key={light.id} className="flex items-center justify-between px-2 py-1.5 rounded bg-surface-800/60">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: light.colorHex }} />
            <span className="text-xs text-surface-300">{light.radius}′/{light.dimRadius}′</span>
          </div>
          <button onClick={() => onRemove(light.id)} className="text-warrior-400 hover:text-warrior-300 text-xs transition-colors" aria-label={`Remove light ${light.id}`}>✕</button>
        </div>
      ))}
    </div>
  );
}
