/* ── EmptyEncounterState ───────────────────────────────────────
 * Shown when no combat encounter is active. Offers create/quick-start.
 * ─────────────────────────────────────────────────────────────── */

import { useState, useCallback } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import { useUiStore } from "@/stores/uiStore";
import { Button } from "@/components/ui/Button";

interface EmptyEncounterStateProps {
  onCreateWithPCs: (name: string) => void;
  onQuickStart: (name: string) => void;
}

export function EmptyEncounterState({ onCreateWithPCs, onQuickStart }: EmptyEncounterStateProps) {
  const characters = useCampaignStore((s) => s.characters);
  const [customName, setCustomName] = useState("");
  const showToast = useUiStore((s) => s.showToast);

  const handleCreate = useCallback(() => {
    const name = customName.trim() || `Encounter ${new Date().toLocaleTimeString()}`;
    onCreateWithPCs(name);
  }, [customName, onCreateWithPCs]);

  const handleQuickStart = useCallback(() => {
    const name = `Quick Encounter ${new Date().toLocaleTimeString()}`;
    onQuickStart(name);
  }, [onQuickStart]);

  return (
    <div className="rounded-xl border border-dashed border-surface-700/60 bg-surface-850/80 glass p-8 text-center">
      <span className="mb-4 inline-block text-4xl text-surface-600">⚔️</span>
      <h3 className="mb-2 text-lg font-semibold text-surface-100">No Active Encounter</h3>
      <p className="mb-6 text-sm text-surface-400">
        Create a new encounter to manage initiative, track HP, and run combat.
      </p>
      <div className="mx-auto max-w-sm space-y-3">
        <div className="flex gap-2">
          <input
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder="Encounter name (optional)"
            className="flex-1 rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none"
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          />
          <Button onClick={handleCreate} disabled={characters.length === 0}>
            Create
          </Button>
        </div>
        <Button variant="secondary" onClick={handleQuickStart} className="w-full">
          ⚡ Quick-Start with {characters.length > 0 ? `${characters.length} PCs` : "Demo"} + 4 Bandits
        </Button>
      </div>
    </div>
  );
}
