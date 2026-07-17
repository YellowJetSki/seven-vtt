/* ── CampaignWizardClassesCurrency ─────────────────────────────
 * Step 4: Classes toggle + currency preset selection.
 * ─────────────────────────────────────────────────────────────── */

import { useState } from "react";
import { Button } from "@/components/ui/Button";

interface ClassOption {
  id: string;
  label: string;
  isHomebrew?: boolean;
}

interface CurrencyPreset {
  id: string;
  label: string;
  copperLabel: string;
  silverLabel: string;
  electrumLabel: string;
  goldLabel: string;
  platinumLabel: string;
}

interface CampaignWizardClassesCurrencyProps {
  selectedClasses: Set<string>;
  customClasses: ClassOption[];
  currencyPreset: CurrencyPreset;
  currencyPresets: CurrencyPreset[];
  onToggleClass: (id: string) => void;
  onAddCustomClass: (label: string) => void;
  onCurrencyChange: (preset: CurrencyPreset) => void;
  onBack: () => void;
  onNext: () => void;
}

const DEFAULT_CLASSES: ClassOption[] = [
  { id: "barbarian", label: "Barbarian" },
  { id: "bard", label: "Bard" },
  { id: "cleric", label: "Cleric" },
  { id: "druid", label: "Druid" },
  { id: "fighter", label: "Fighter" },
  { id: "monk", label: "Monk" },
  { id: "paladin", label: "Paladin" },
  { id: "ranger", label: "Ranger" },
  { id: "rogue", label: "Rogue" },
  { id: "sorcerer", label: "Sorcerer" },
  { id: "warlock", label: "Warlock" },
  { id: "wizard", label: "Wizard" },
];

export function CampaignWizardClassesCurrency({
  selectedClasses, customClasses, currencyPreset, currencyPresets,
  onToggleClass, onAddCustomClass, onCurrencyChange,
  onBack, onNext,
}: CampaignWizardClassesCurrencyProps) {
  const [newClassName, setNewClassName] = useState("");

  const handleAdd = () => {
    const trimmed = newClassName.trim();
    if (!trimmed) return;
    onAddCustomClass(trimmed);
    setNewClassName("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-surface-100">Allowed Classes</h3>
        <p className="text-sm text-surface-400">Select which classes players can choose from:</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {DEFAULT_CLASSES.map((cls) => (
            <button
              key={cls.id}
              onClick={() => onToggleClass(cls.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                selectedClasses.has(cls.id)
                  ? "bg-accent-500/20 text-accent-300 ring-1 ring-accent-500"
                  : "bg-surface-800 text-surface-400 hover:bg-surface-700 hover:text-surface-300"
              }`}
            >
              {cls.label}
            </button>
          ))}
          {customClasses.map((cls) => (
            <button
              key={cls.id}
              onClick={() => onToggleClass(cls.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                selectedClasses.has(cls.id)
                  ? "bg-mage-500/20 text-mage-300 ring-1 ring-mage-500"
                  : "bg-surface-800 text-surface-400 hover:bg-surface-700 hover:text-surface-300"
              }`}
            >
              ✦ {cls.label}
            </button>
          ))}
        </div>
        <div className="mt-2 flex items-center gap-2">
          <input
            value={newClassName}
            onChange={(e) => setNewClassName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="Add custom class..."
            className="flex-1 rounded-lg border border-surface-700 bg-surface-800 px-3 py-1.5 text-xs text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none"
          />
          <Button size="xs" onClick={handleAdd} disabled={!newClassName.trim()}>+ Add</Button>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-surface-100">Currency System</h3>
        <p className="text-sm text-surface-400">Choose the currency naming for your world:</p>
        <div className="mt-2 space-y-2">
          {currencyPresets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => onCurrencyChange(preset)}
              className={`w-full rounded-lg border p-3 text-left transition-all ${
                currencyPreset.id === preset.id
                  ? "border-accent-500/50 bg-accent-500/10"
                  : "border-surface-700 bg-surface-800 hover:border-surface-600"
              }`}
            >
              <p className="text-sm font-medium text-surface-200">{preset.label}</p>
              <p className="mt-0.5 text-[11px] text-surface-500">
                cp: {preset.copperLabel} · sp: {preset.silverLabel} · ep: {preset.electrumLabel} · gp: {preset.goldLabel} · pp: {preset.platinumLabel}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="ghost" size="sm" onClick={onBack}>← Back</Button>
        <Button size="sm" onClick={onNext}>Next: Review →</Button>
      </div>
    </div>
  );
}
