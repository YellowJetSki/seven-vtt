/* ── Encounter Preset Save Form ─────────────────────────────────
 * Inline form for saving the current encounter as a preset.
 * Extracted from EncounterPresets.tsx to keep files under 150 lines.
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
    <div className="border-b border-surface-700 px-3 py-2">
      <div className="flex gap-1">
        <input
          value={saveName}
          onChange={(e) => onSaveNameChange(e.target.value)}
          placeholder="Preset name..."
          className="flex-1 rounded border border-surface-700 bg-surface-800 px-2 py-1 text-xs text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none"
          onKeyDown={(e) => e.key === "Enter" && onSave()}
        />
        <Button size="xs" variant="primary" onClick={onSave} disabled={!saveName.trim()}>
          Save
        </Button>
        <Button size="xs" variant="ghost" onClick={onCancel}>
          ✕
        </Button>
      </div>
    </div>
  );
}
