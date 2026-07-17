/* ── ItemFormWeaponFields ───────────────────────────────────────
 * Weapon-specific fields for ItemForm.
 * Renders weapon type, damage dice, damage type, properties, range.
 * ─────────────────────────────────────────────────────────────── */

import type { WeaponType, DamageType, WeaponProperty } from "@/types/homebrew";
import { Input } from "@/components/ui/Input";
import { WEAPON_TYPES, DAMAGE_TYPES, WEAPON_PROPERTIES } from "./ItemFormConstants";

interface WeaponFields {
  weaponType: WeaponType;
  damageDice: string;
  damageType: DamageType;
  properties: WeaponProperty[];
  rangeNormal: number;
  rangeMax: number;
  versatileDice: string;
  attackBonus: number;
  damageBonus: number;
}

interface ItemFormWeaponFieldsProps {
  data: WeaponFields;
  onChange: (data: Partial<WeaponFields>) => void;
}

export function ItemFormWeaponFields({ data, onChange }: ItemFormWeaponFieldsProps) {
  const toggleProperty = (prop: WeaponProperty) => {
    const next = data.properties.includes(prop)
      ? data.properties.filter((p) => p !== prop)
      : [...data.properties, prop];
    onChange({ properties: next });
  };

  return (
    <div className="rounded-lg border border-mage-500/20 bg-mage-500/5 p-4 space-y-4">
      <h4 className="text-sm font-semibold text-mage-400 uppercase tracking-wider">Weapon Properties</h4>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-surface-400">Weapon Type</label>
          <select
            value={data.weaponType}
            onChange={(e) => onChange({ weaponType: e.target.value as WeaponType })}
            className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2.5 text-sm text-surface-100 focus:border-accent-500 focus:ring-1 focus:ring-accent-500 focus:outline-none"
          >
            {WEAPON_TYPES.map((wt) => (
              <option key={wt} value={wt}>{wt.charAt(0).toUpperCase() + wt.slice(1)}</option>
            ))}
          </select>
        </div>

        <div>
          <Input
            label="Damage Dice"
            placeholder="e.g. 1d8"
            value={data.damageDice}
            onChange={(e) => onChange({ damageDice: e.target.value })}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-surface-400">Damage Type</label>
          <select
            value={data.damageType}
            onChange={(e) => onChange({ damageType: e.target.value as DamageType })}
            className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2.5 text-sm text-surface-100 focus:border-accent-500 focus:ring-1 focus:ring-accent-500 focus:outline-none"
          >
            {DAMAGE_TYPES.map((dt) => (
              <option key={dt.value} value={dt.value}>{dt.label}</option>
            ))}
          </select>
        </div>

        <div>
          <Input
            label="Versatile Dice (if any)"
            placeholder="e.g. 1d10"
            value={data.versatileDice}
            onChange={(e) => onChange({ versatileDice: e.target.value })}
          />
        </div>

        <div>
          <Input
            label="Range Normal (ft)"
            type="number"
            min={0}
            value={data.rangeNormal}
            onChange={(e) => onChange({ rangeNormal: parseInt(e.target.value) || 0 })}
          />
        </div>

        <div>
          <Input
            label="Range Max (ft)"
            type="number"
            min={0}
            value={data.rangeMax}
            onChange={(e) => onChange({ rangeMax: parseInt(e.target.value) || 0 })}
          />
        </div>

        <div>
          <Input
            label="Attack Bonus"
            type="number"
            value={data.attackBonus}
            onChange={(e) => onChange({ attackBonus: parseInt(e.target.value) || 0 })}
          />
        </div>

        <div>
          <Input
            label="Damage Bonus"
            type="number"
            value={data.damageBonus}
            onChange={(e) => onChange({ damageBonus: parseInt(e.target.value) || 0 })}
          />
        </div>
      </div>

      {/* Weapon Properties Checkboxes */}
      <div>
        <label className="mb-2 block text-xs font-medium text-surface-400">Properties</label>
        <div className="flex flex-wrap gap-2">
          {WEAPON_PROPERTIES.map((prop) => (
            <label
              key={prop.value}
              className={`flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition-colors ${
                data.properties.includes(prop.value)
                  ? "border-mage-500/50 bg-mage-500/20 text-mage-300"
                  : "border-surface-700 bg-surface-800 text-surface-400 hover:border-surface-600"
              }`}
            >
              <input
                type="checkbox"
                checked={data.properties.includes(prop.value)}
                onChange={() => toggleProperty(prop.value)}
                className="sr-only"
              />
              {prop.label}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
