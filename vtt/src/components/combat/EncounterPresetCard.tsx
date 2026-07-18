/* ── Encounter Preset Card ──────────────────────────────────────
 * Individual preset button card for the EncounterPresets panel.
 * Displays name, description, environment icon, difficulty, and
 * enemy count badge. Extracted from EncounterPresets.tsx.
 * ─────────────────────────────────────────────────────────────── */

import type { EncounterPreset } from "./encounter-preset-types";
import { Badge } from "@/components/ui/Badge";

interface Props {
  preset: EncounterPreset;
  onApply: (preset: EncounterPreset) => void;
}

/** Map environment string to emoji icon */
function environmentIcon(env: string): string {
  const icons: Record<string, string> = {
    forest: "🌲", dungeon: "🏚️", road: "🛤️", temple: "🏛️",
    mountain: "⛰️", plains: "🌾", cavern: "🕳️", swamp: "🌿",
    arctic: "❄️", desert: "🏜️", coast: "🌊", urban: "🏙️",
  };
  return icons[env] ?? "📍";
}

/** Get text color class for difficulty */
function difficultyColor(d: string): string {
  switch (d) {
    case "easy": return "text-divine-400";
    case "medium": return "text-mage-400";
    case "hard": return "text-warrior-400";
    case "deadly": return "text-warrior-400";
    default: return "text-surface-400";
  }
}

export function EncounterPresetCard({ preset, onApply }: Props) {
  const totalEnemies = preset.enemies.reduce((sum, e) => sum + e.count, 0);

  return (
    <button
      onClick={() => onApply(preset)}
      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left hover:bg-surface-800 transition-colors group"
    >
      <span className="text-sm shrink-0">{environmentIcon(preset.environment)}</span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-surface-200 truncate">{preset.name}</p>
        <p className="text-[10px] text-surface-500 truncate">{preset.description}</p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <span className={`text-[10px] font-medium ${difficultyColor(preset.difficulty)}`}>
          {preset.difficulty}
        </span>
        <Badge variant="neutral" size="xs">{totalEnemies}</Badge>
      </div>
    </button>
  );
}
