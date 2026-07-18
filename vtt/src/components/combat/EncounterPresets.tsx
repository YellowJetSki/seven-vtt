/* ── Encounter Presets ─────────────────────────────────────────
 * Save/Load encounter templates to/from localStorage.
 * Allows the DM to quickly create encounters from pre-built
 * templates organized by difficulty and environment.
 *
 * Orchestrates: EncounterPresetCard, EncounterPresetSaveForm
 * Data: encounter-preset-types, encounter-preset-data
 * ─────────────────────────────────────────────────────────────── */

import { useState, useEffect, useCallback } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import { useUiStore } from "@/stores/uiStore";
import { Button } from "@/components/ui/Button";
import type { EncounterEnemy } from "@/types";
import { EncounterPresetCard } from "./EncounterPresetCard";
import { EncounterPresetSaveForm } from "./EncounterPresetSaveForm";
import type { EncounterPreset } from "./encounter-preset-types";
import { loadUserPresets, saveUserPresets, presetToEnemies } from "./encounter-preset-types";
import { BUILT_IN_PRESETS } from "./encounter-preset-data";

interface EncounterPresetsProps {
  onApplyPreset: (enemies: EncounterEnemy[]) => void;
}

export function EncounterPresets({ onApplyPreset }: EncounterPresetsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [userPresets, setUserPresets] = useState<EncounterPreset[]>([]);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [saveName, setSaveName] = useState("");
  const showToast = useUiStore((s) => s.showToast);

  const activeEncounter = useCampaignStore((s) => {
    const encs = s.encounters;
    return encs.length > 0 ? encs[encs.length - 1] : null;
  });

  useEffect(() => {
    setUserPresets(loadUserPresets());
  }, [isOpen]);

  const handleApplyPreset = useCallback((preset: EncounterPreset) => {
    onApplyPreset(presetToEnemies(preset));
    setIsOpen(false);
    showToast({ message: `Loaded "${preset.name}".`, type: "success" });
  }, [onApplyPreset, showToast]);

  const handleSaveCurrent = useCallback(() => {
    const name = saveName.trim();
    if (!name || !activeEncounter) return;

    const preset: EncounterPreset = {
      name,
      difficulty: "medium",
      environment: "dungeon",
      enemies: activeEncounter.enemies.map((e) => ({
        enemyId: e.enemyId,
        count: e.count,
      })),
    };

    const updated = [...userPresets.filter((p) => p.name !== name), preset];
    setUserPresets(updated);
    saveUserPresets(updated);
    setSaveName("");
    setShowSaveForm(false);
    showToast({ message: `Saved "${name}" as preset.`, type: "success" });
  }, [saveName, activeEncounter, userPresets, showToast]);

  const handleDeletePreset = useCallback((name: string) => {
    const updated = userPresets.filter((p) => p.name !== name);
    setUserPresets(updated);
    saveUserPresets(updated);
    showToast({ message: `Deleted "${name}".`, type: "info" });
  }, [userPresets, showToast]);

  return (
    <div className="relative">
      <Button size="xs" variant="secondary" onClick={() => setIsOpen((o) => !o)}>
        📋 Presets
      </Button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 top-full z-50 mt-1 w-80 rounded-xl border border-surface-700 bg-surface-850 shadow-xl max-h-96">
            <div className="flex items-center justify-between border-b border-surface-700 px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-surface-400">
                Encounter Presets
              </p>
              {activeEncounter && (
                <button
                  onClick={() => setShowSaveForm((f) => !f)}
                  className="text-[10px] text-accent-400 hover:text-accent-300 transition-colors"
                >
                  {showSaveForm ? "Cancel" : "+ Save Current"}
                </button>
              )}
            </div>

            {showSaveForm && (
              <EncounterPresetSaveForm
                saveName={saveName}
                onSaveNameChange={setSaveName}
                onSave={handleSaveCurrent}
                onCancel={() => { setShowSaveForm(false); setSaveName(""); }}
              />
            )}

            <div className="overflow-y-auto max-h-72 p-1.5 space-y-1">
              <p className="px-2 py-1 text-[9px] font-semibold uppercase tracking-wider text-surface-500">
                Built-in
              </p>
              {BUILT_IN_PRESETS.map((preset) => (
                <EncounterPresetCard key={preset.name} preset={preset} onApply={handleApplyPreset} />
              ))}

              {userPresets.length > 0 && (
                <>
                  <div className="border-t border-surface-700 my-1" />
                  <p className="px-2 py-1 text-[9px] font-semibold uppercase tracking-wider text-surface-500">
                    Custom
                  </p>
                  {userPresets.map((preset) => (
                    <div key={preset.name} className="group flex items-center rounded-lg hover:bg-surface-800 transition-colors">
                      <div className="flex flex-1 min-w-0">
                        <EncounterPresetCard preset={preset} onApply={handleApplyPreset} />
                      </div>
                      <button
                        onClick={() => handleDeletePreset(preset.name)}
                        className="mr-2 text-surface-500 hover:text-warrior-400 opacity-0 group-hover:opacity-100 transition-all text-[10px] shrink-0"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
