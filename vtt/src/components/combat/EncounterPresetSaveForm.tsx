/* ── Encounter Preset Save Form ─────────────────────────────────
 * Inline form for saving the current encounter as a preset.
 * Fantasy-styled glass input row with arcane accent highlights.
 * ─────────────────────────────────────────────────────────────── */

import { Button } from "@/components/ui/Button";

interface Props {
  saveName: string;
  onSaveNameChange: (name: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

export function EncounterPresetSaveForm({ saveName, onSaveNameChange, onSave, onCancel }: Props) {
  return (
    <div className="border-b border-surface-700/50 bg-surface-900/40 px-3 py-2.5">
      <div className="flex gap-1.5">
        <input
          value={saveName}
          onChange={(e) => onSaveNameChange(e.target.value)}
          placeholder="Name your preset..."
          className="flex-1 rounded-lg border border-surface-700/60 bg-surface-800/80 px-2.5 py-1.5 text-xs text-surface-100 placeholder:text-surface-500 focus:border-accent-500/60 focus:outline-none focus:ring-1 focus:ring-accent-500/20 transition-all"
          onKeyDown={(e) => e.key === "Enter" && onSave()}
        />
        <Button size="xs" variant="primary" onClick={onSave} disabled={!saveName.trim()}>
          ✨ Save
        </Button>
        <Button size="xs" variant="ghost" onClick={onCancel}>
          ✕
        </Button>
      </div>
    </div>
  );
}
