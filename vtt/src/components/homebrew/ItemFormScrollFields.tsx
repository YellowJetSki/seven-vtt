/* ── ItemFormScrollFields ───────────────────────────────────────
 * Scroll-specific fields for ItemForm.
 * Renders spell name, level, and school fields.
 * ─────────────────────────────────────────────────────────────── */

import { Input } from "@/components/ui/Input";

interface ScrollFields {
  spellName: string;
  spellLevel: number;
  spellSchool: string;
}

interface ItemFormScrollFieldsProps {
  data: ScrollFields;
  onChange: (data: Partial<ScrollFields>) => void;
}

export function ItemFormScrollFields({ data, onChange }: ItemFormScrollFieldsProps) {
  return (
    <div className="rounded-lg border border-divine-500/20 bg-divine-500/5 p-4 space-y-3">
      <h4 className="text-sm font-semibold text-divine-400 uppercase tracking-wider">Scroll Details</h4>
      <Input
        label="Spell Name *"
        placeholder="e.g. Fireball"
        value={data.spellName}
        onChange={(e) => onChange({ spellName: e.target.value })}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Spell Level"
          type="number"
          min={0}
          max={9}
          value={data.spellLevel}
          onChange={(e) => onChange({ spellLevel: parseInt(e.target.value) || 1 })}
        />
        <Input
          label="Spell School"
          placeholder="e.g. Evocation"
          value={data.spellSchool}
          onChange={(e) => onChange({ spellSchool: e.target.value })}
        />
      </div>
    </div>
  );
}
