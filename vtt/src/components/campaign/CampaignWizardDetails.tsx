/* ── CampaignWizardDetails ─────────────────────────────────────
 * Step 2: Campaign details (name, description).
 * ─────────────────────────────────────────────────────────────── */

import { Button } from "@/components/ui/Button";

interface CampaignWizardDetailsProps {
  name: string;
  description: string;
  useArklaTemplate: boolean;
  onNameChange: (name: string) => void;
  onDescriptionChange: (desc: string) => void;
  onBack: () => void;
  onNext: () => void;
}

export function CampaignWizardDetails({
  name, description, useArklaTemplate,
  onNameChange, onDescriptionChange,
  onBack, onNext,
}: CampaignWizardDetailsProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-surface-100">
        {useArklaTemplate ? "Name Your Arkla Campaign" : "New Campaign Details"}
      </h3>
      <div>
        <label className="mb-1 block text-xs font-medium text-surface-400">Campaign Name *</label>
        <input
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="e.g. The Obelisks of Arkla"
          className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none"
          autoFocus
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-surface-400">Description (optional)</label>
        <textarea
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          rows={3}
          placeholder={useArklaTemplate
            ? "A world of floating islands, ancient obelisks, and lost Kolari magic..."
            : "A brief synopsis of your campaign..."
          }
          className="w-full resize-none rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none"
        />
      </div>
      <div className="flex justify-between">
        <Button variant="ghost" size="sm" onClick={onBack}>← Back</Button>
        <Button size="sm" onClick={onNext} disabled={!name.trim()}>Next: Species →</Button>
      </div>
    </div>
  );
}
