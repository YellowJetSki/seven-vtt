/* ── ItemFormArmorFields ────────────────────────────────────────
 * Armor-specific fields for ItemForm.
 * Handles armor type, AC, dex bonus, stealth, and shields.
 * ─────────────────────────────────────────────────────────────── */

import type { ArmorType } from "@/types/homebrew";
import { Input } from "@/components/ui/Input";
import { ARMOR_TYPES } from "./ItemFormConstants";

interface ArmorFields {
  armorType: ArmorType;
  baseAC: number;
  dexBonusOption: string;
  stealthDisadvantage: boolean;
  strengthRequirement: number;
  isShield: boolean;
  shieldACBonus: number;
}

interface ItemFormArmorFieldsProps {
  data: ArmorFields;
  onChange: (data: Partial<ArmorFields>) => void;
}

export function ItemFormArmorFields({ data, onChange }: ItemFormArmorFieldsProps) {
  return (
    <div className="rounded-lg border border-warrior-500/20 bg-warrior-500/5 p-4 space-y-4">
      <h4 className="text-sm font-semibold text-warrior-400 uppercase tracking-wider">Armor Properties</h4>

      <label className="flex cursor-pointer items-center gap-2 text-sm text-surface-200">
        <input
          type="checkbox"
          checked={data.isShield}
          onChange={(e) => onChange({ isShield: e.target.checked })}
          className="h-4 w-4 rounded border-surface-600 bg-surface-800 accent-accent-500"
        />
        This is a Shield
      </label>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {!data.isShield ? (
          <>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-surface-400">Armor Type</label>
              <select
                value={data.armorType}
                onChange={(e) => onChange({ armorType: e.target.value as ArmorType })}
                className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2.5 text-sm text-surface-100 focus:border-accent-500 focus:ring-1 focus:ring-accent-500 focus:outline-none"
              >
                {ARMOR_TYPES.filter((a) => a.value !== "shield").map((at) => (
                  <option key={at.value} value={at.value}>{at.label}</option>
                ))}
              </select>
            </div>

            <div>
              <Input
                label="Base AC"
                type="number"
                min={10}
                max={25}
                value={data.baseAC}
                onChange={(e) => onChange({ baseAC: parseInt(e.target.value) || 10 })}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-surface-400">Dexterity Bonus</label>
              <select
                value={data.dexBonusOption}
                onChange={(e) => onChange({ dexBonusOption: e.target.value })}
                className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2.5 text-sm text-surface-100 focus:border-accent-500 focus:ring-1 focus:ring-accent-500 focus:outline-none"
              >
                <option value="full">Full Dex Bonus</option>
                <option value="up to 2">Up to +2 (Medium)</option>
                <option value="none">No Dex Bonus (Heavy)</option>
              </select>
            </div>

            <div>
              <Input
                label="Strength Requirement"
                type="number"
                min={0}
                value={data.strengthRequirement}
                onChange={(e) => onChange({ strengthRequirement: parseInt(e.target.value) || 0 })}
                placeholder="0 for none"
              />
            </div>
          </>
        ) : (
          <div>
            <Input
              label="Shield AC Bonus"
              type="number"
              min={1}
              max={5}
              value={data.shieldACBonus}
              onChange={(e) => onChange({ shieldACBonus: parseInt(e.target.value) || 2 })}
            />
          </div>
        )}
      </div>

      {!data.isShield && (
        <label className="flex cursor-pointer items-center gap-2 text-sm text-surface-300">
          <input
            type="checkbox"
            checked={data.stealthDisadvantage}
            onChange={(e) => onChange({ stealthDisadvantage: e.target.checked })}
            className="h-4 w-4 rounded border-surface-600 bg-surface-800 accent-accent-500"
          />
          Stealth Disadvantage
        </label>
      )}
    </div>
  );
}
