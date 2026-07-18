/* ── Encounter Preset Card ──────────────────────────────────────
 * Individual preset button card for the EncounterPresets panel.
 * Displays name, description, environment icon, difficulty rating,
 * and enemy count badge. Fantasy-styled glass card.
 * ─────────────────────────────────────────────────────────────── */

import type { EncounterPreset } from "./encounter-preset-types";
import { Badge } from "@/components/ui/Badge";

interface Props {
  preset: EncounterPreset;
  onApply: (preset: EncounterPreset) => void;
  onDelete?: (name: string) => void;
}

/** Map environment string to fantasy emoji icon */
function environmentIcon(env: string): string {
  const icons: Record<string, string> = {
    forest: "🌲", dungeon: "🏚️", road: "🛤️", temple: "🏛️",
    mountain: "⛰️", plains: "🌾", cavern: "🕳️", swamp: "🌿",
    arctic: "❄️", desert: "🏜️", coast: "🌊", urban: "🏙️",
  };
  return icons[env] ?? "📍";
}

/** Get fantasy-styled difficulty color config */
function difficultyColor(d: string): string {
  switch (d) {
    case "easy": return "text-divine-400 bg-divine-500/10";
    case "medium": return "text-mage-400 bg-mage-500/10";
    case "hard": return "text-warrior-400 bg-warrior-500/10";
    case "deadly": return "text-rogue-400 bg-rogue-500/10";
    default: return "text-surface-400 bg-surface-800";
  }
}

export function EncounterPresetCard({ preset, onApply, onDelete }: Props) {
  const totalEnemies = preset.enemies.reduce((sum, e) => sum + e.count, 0);
  const diffStyle = difficultyColor(preset.difficulty);

  return (
    <div className="group flex items-center rounded-xl border border-surface-700/50 bg-surface-850/60 hover:bg-surface-800/70 hover:border-accent-500/20 transition-all duration-200 hover:shadow-lg hover:shadow-accent-500/5">
      <button
        onClick={() => onApply(preset)}
        className="flex flex-1 items-center gap-3 px-3 py-2.5 text-left min-w-0"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-800 text-sm ring-1 ring-surface-700/50">
          {environmentIcon(preset.environment)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-surface-200 truncate group-hover:text-accent-300 transition-colors">
            {preset.name}
          </p>
          <p className="text-[10px] text-surface-500 truncate mt-0.5">{preset.description}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ${diffStyle}`}>
            {preset.difficulty}
          </span>
          <Badge variant="neutral" size="xs" className="bg-surface-800 text-surface-400">
            {totalEnemies}
          </Badge>
        </div>
      </button>
      {onDelete && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(preset.name); }}
          className="mr-2 flex h-6 w-6 items-center justify-center rounded-md text-surface-500 hover:bg-warrior-500/15 hover:text-warrior-400 opacity-0 group-hover:opacity-100 transition-all duration-200 text-[10px]"
          aria-label={`Delete preset ${preset.name}`}
        >
          ✕
        </button>
      )}
    </div>
  );
}
