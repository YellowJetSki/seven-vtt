/* ── ItemFormPotionFields ───────────────────────────────────────
 * Potion-specific fields for ItemForm.
 * Renders effect description, duration, and spell level.
 * ─────────────────────────────────────────────────────────────── */

import { Input } from "@/components/ui/Input";

interface PotionFields {
  effect: string;
  duration: string;
  level: number;
}

interface ItemFormPotionFieldsProps {
  data: PotionFields;
  onChange: (data: Partial<PotionFields>) => void;
}

export function ItemFormPotionFields({ data, onChange }: ItemFormPotionFieldsProps) {
  return (
    <div className="rounded-lg border border-rogue-500/20 bg-rogue-500/5 p-4 space-y-3">
      <h4 className="text-sm font-semibold text-rogue-400 uppercase tracking-wider">Potion Effects</h4>
      <div>
        <label className="mb-1.5 block text-xs font-medium text-surface-400">Effect *</label>
        <textarea
          value={data.effect}
          onChange={(e) => onChange({ effect: e.target.value })}
          rows={3}
          placeholder="Describe what this potion does..."
          className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2.5 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:ring-1 focus:ring-accent-500 focus:outline-none resize-y"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Duration (optional)"
          placeholder="e.g. 1 hour"
          value={data.duration}
          onChange={(e) => onChange({ duration: e.target.value })}
        />
        <Input
          label="Spell Level (if mimicking a spell)"
          type="number"
          min={0}
          max={9}
          value={data.level}
          onChange={(e) => onChange({ level: parseInt(e.target.value) || 0 })}
        />
      </div>
    </div>
  );
}
