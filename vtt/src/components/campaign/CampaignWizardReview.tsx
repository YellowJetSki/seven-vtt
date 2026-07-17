/* ── CampaignWizardReview ──────────────────────────────────────
 * Step 5: Review and confirm campaign settings.
 * ─────────────────────────────────────────────────────────────── */

import { Button } from "@/components/ui/Button";

interface SpeciesOption {
  id: string;
  label: string;
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

interface CampaignWizardReviewProps {
  name: string;
  useArklaTemplate: boolean;
  currencyPreset: CurrencyPreset;
  selectedRaces: Set<string>;
  selectedClasses: Set<string>;
  defaultRaces: SpeciesOption[];
  defaultClasses: SpeciesOption[];
  customRaces: SpeciesOption[];
  customClasses: SpeciesOption[];
  onBack: () => void;
  onCreate: () => void;
}

export function CampaignWizardReview({
  name, useArklaTemplate, currencyPreset,
  selectedRaces, selectedClasses,
  defaultRaces, defaultClasses,
  customRaces, customClasses,
  onBack, onCreate,
}: CampaignWizardReviewProps) {
  const raceNames = Array.from(selectedRaces).map((id) => {
    const found = [...defaultRaces, ...customRaces].find((r) => r.id === id);
    return found?.label ?? id;
  });

  const classNames = Array.from(selectedClasses).map((id) => {
    const found = [...defaultClasses, ...customClasses].find((c) => c.id === id);
    return found?.label ?? id;
  });

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-surface-100">Review Your Campaign</h3>
      <div className="rounded-lg border border-surface-700 bg-surface-800 p-4 space-y-3">
        <div className="flex justify-between">
          <span className="text-xs text-surface-400">Name</span>
          <span className="text-sm font-medium text-surface-200">{name || "Unnamed"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-xs text-surface-400">Template</span>
          <span className="text-sm font-medium text-surface-200">{useArklaTemplate ? "🏛️ Arkla (pre-populated)" : "✨ Blank"}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-xs text-surface-400">Currency</span>
          <span className="text-sm font-medium text-surface-200">{currencyPreset.label}</span>
        </div>
        <div>
          <span className="text-xs text-surface-400">Allowed Species ({raceNames.length})</span>
          <div className="mt-1 flex flex-wrap gap-1">
            {raceNames.map((r) => (
              <span key={r} className="rounded-full bg-accent-500/10 px-2 py-0.5 text-[10px] text-accent-300">{r}</span>
            ))}
          </div>
        </div>
        <div>
          <span className="text-xs text-surface-400">Allowed Classes ({classNames.length})</span>
          <div className="mt-1 flex flex-wrap gap-1">
            {classNames.map((c) => (
              <span key={c} className="rounded-full bg-mage-500/10 px-2 py-0.5 text-[10px] text-mage-300">{c}</span>
            ))}
          </div>
        </div>
      </div>
      <div className="flex justify-between">
        <Button variant="ghost" size="sm" onClick={onBack}>← Back</Button>
        <Button size="sm" onClick={onCreate}>✨ Create Campaign</Button>
      </div>
    </div>
  );
}
