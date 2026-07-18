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
      <Button
        size="xs"
        variant="secondary"
        onClick={() => setIsOpen((o) => !o)}
        className="ring-1 ring-surface-700/50"
      >
        📋 Presets
      </Button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 top-full z-50 mt-1 w-80 rounded-2xl border border-surface-700/60 bg-surface-900/90 backdrop-blur-xl shadow-2xl shadow-accent-500/5 max-h-96 overflow-hidden">
            {/* ── Header ── */}
            <div className="flex items-center justify-between border-b border-surface-700/50 px-4 py-2.5">
              <div className="flex items-center gap-2">
                <span className="text-sm">🗂️</span>
                <p className="text-[11px] font-bold uppercase tracking-widest text-surface-400">
                  Encounter Presets
                </p>
              </div>
              {activeEncounter && (
                <button
                  onClick={() => setShowSaveForm((f) => !f)}
                  className="text-[10px] font-medium text-accent-400 hover:text-accent-300 transition-colors px-2 py-1 rounded-md hover:bg-accent-500/10"
                >
                  {showSaveForm ? "− Cancel" : "+ Save"}
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

            <div className="overflow-y-auto max-h-72 p-2 space-y-1">
              {/* ── Built-in Section ── */}
              <div className="flex items-center gap-2 px-2 py-1.5">
                <div className="h-px flex-1 bg-gradient-to-r from-surface-700/0 via-surface-700 to-surface-700/0" />
                <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-surface-500">
                  📜 Built-in
                </span>
                <div className="h-px flex-1 bg-gradient-to-r from-surface-700/0 via-surface-700 to-surface-700/0" />
              </div>
              {BUILT_IN_PRESETS.map((preset) => (
                <EncounterPresetCard key={preset.name} preset={preset} onApply={handleApplyPreset} />
              ))}

              {userPresets.length > 0 && (
                <>
                  <div className="flex items-center gap-2 px-2 py-1.5 pt-3">
                    <div className="h-px flex-1 bg-gradient-to-r from-surface-700/0 via-surface-700 to-surface-700/0" />
                    <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-surface-500">
                      ⚔️ Custom
                    </span>
                    <div className="h-px flex-1 bg-gradient-to-r from-surface-700/0 via-surface-700 to-surface-700/0" />
                  </div>
                  {userPresets.map((preset) => (
                    <EncounterPresetCard
                      key={preset.name}
                      preset={preset}
                      onApply={handleApplyPreset}
                      onDelete={handleDeletePreset}
                    />
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
