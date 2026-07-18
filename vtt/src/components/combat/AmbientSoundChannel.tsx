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
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <button
          onClick={onToggle}
          className={`flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs transition-colors ${
            active
              ? "bg-accent-500/20 text-accent-300"
              : "bg-surface-800 text-surface-400 hover:text-surface-200"
          }`}
        >
          <span>{icon}</span>
          <span>{label}</span>
          <span>{active ? "🔊" : "🔇"}</span>
        </button>
        <span className="text-[10px] text-surface-500 w-8 text-right">
          {Math.round(volume * 100)}%
        </span>
      </div>
      <input
        type="range"
        min="0"
        max="1"
        step="0.05"
        value={volume}
        onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
        className="w-full h-1.5 cursor-pointer accent-accent-500"
      />
    </div>
  );
}
