/* ── CampaignWizardChoice ──────────────────────────────────────
 * Step 1: Choose template (Arkla / Blank / Import).
 * ─────────────────────────────────────────────────────────────── */

import { Button } from "@/components/ui/Button";

interface CampaignWizardChoiceProps {
  onSelectTemplate: (useArkla: boolean) => void;
  onImport: () => void;
  onCancel: () => void;
}

export function CampaignWizardChoice({ onSelectTemplate, onImport, onCancel }: CampaignWizardChoiceProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-surface-100">Create a New Campaign</h3>
      <p className="text-sm text-surface-400">Choose how to get started:</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          onClick={() => onSelectTemplate(true)}
          className="rounded-xl border-2 border-accent-500/30 bg-accent-500/5 p-5 text-left transition-all hover:border-accent-500/60 hover:bg-accent-500/10 hover:-translate-y-0.5"
        >
          <span className="text-3xl">🏛️</span>
          <p className="mt-2 font-semibold text-surface-100">Arkla Template</p>
          <p className="mt-1 text-xs text-surface-400">Pre-populated with 4 starter PCs, custom species & classes, and the Assarions currency system</p>
        </button>
        <button
          onClick={() => onSelectTemplate(false)}
          className="rounded-xl border-2 border-dashed border-surface-600 bg-surface-800 p-5 text-left transition-all hover:border-mage-500/40 hover:bg-surface-700 hover:-translate-y-0.5"
        >
          <span className="text-3xl">✨</span>
          <p className="mt-2 font-semibold text-surface-100">Blank Campaign</p>
          <p className="mt-1 text-xs text-surface-400">Start from scratch — configure species, classes, currency, and rules yourself</p>
        </button>
      </div>
      <div className="border-t border-surface-700 pt-4">
        <button
          onClick={onImport}
          className="w-full rounded-lg border border-dashed border-surface-600 bg-surface-800 p-4 text-center transition-all hover:border-mage-500/40 hover:bg-surface-700"
        >
          <span className="text-lg">📥</span>
          <span className="ml-2 text-sm font-medium text-surface-200">Import Campaign from JSON</span>
        </button>
      </div>
      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}
