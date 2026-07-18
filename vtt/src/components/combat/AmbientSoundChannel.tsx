/* ── Ambient Sound Channel Row ──────────────────────────────────
 * Single channel row in the AmbientSoundMixer with toggle button
 * and volume slider. Extracted from AmbientSoundMixer.tsx.
 * ─────────────────────────────────────────────────────────────── */

interface Props {
  icon: string;
  label: string;
  active: boolean;
  volume: number;
  onToggle: () => void;
  onVolumeChange: (volume: number) => void;
}

export function AmbientSoundChannel({ icon, label, active, volume, onToggle, onVolumeChange }: Props) {
  return (
    <div className="space-y-1.5">
      {/* ── Channel Toggle & Volume Display ── */}
      <div className="flex items-center justify-between">
        <button
          onClick={onToggle}
          className={`group flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
            active
              ? "bg-accent-500/15 text-accent-300 shadow-sm shadow-accent-500/10 ring-1 ring-accent-500/20"
              : "bg-surface-800/60 text-surface-400 hover:text-surface-200 hover:bg-surface-800 ring-1 ring-surface-700/30"
          }`}
        >
          <span className={`transition-transform duration-200 ${active ? "scale-110" : ""}`}>{icon}</span>
          <span>{label}</span>
          <span className={`ml-1 text-[10px] transition-all ${active ? "opacity-100" : "opacity-50"}`}>
            {active ? "🔊" : "🔇"}
          </span>
        </button>
        <span className={`text-[10px] font-mono w-9 text-right transition-colors ${active ? "text-accent-400" : "text-surface-500"}`}>
          {Math.round(volume * 100)}%
        </span>
      </div>

      {/* ── Volume Slider ── */}
      <div className="relative">
        <div className={`absolute inset-y-0 left-0 w-full rounded-full transition-opacity ${active ? "opacity-100" : "opacity-30"}`}>
          <div className="h-1.5 w-full rounded-full bg-surface-800" />
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={volume}
          onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
          className="relative w-full h-1.5 cursor-pointer appearance-none rounded-full bg-transparent [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent-500 [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:shadow-accent-500/30 [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-125"
        />
      </div>
    </div>
  );
}
