/* ── Encounter Builder ─────────────────────────────────────────
 * Allows the DM to build encounters by selecting enemies, setting
 * counts, and configuring the environment. XP/difficulty auto-calc.
 * ─────────────────────────────────────────────────────────────── */

import { useState, useMemo } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import { useUiStore } from "@/stores/uiStore";
import { Button } from "@/components/ui/Button";
import { getEnemyById } from "@/data/enemy-database";
import { calculateXp, estimateDifficulty, getDifficultyColor } from "./EncounterXpCalculator";
import { EnemyPickerModal } from "./EnemyPickerModal";
import type { Encounter, EncounterEnemy } from "@/types";

function uid(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

interface Props {
  existingEncounter?: Encounter;
  onSave: (encounter: Encounter) => void;
  onCancel: () => void;
}

export function EncounterBuilder({ existingEncounter, onSave, onCancel }: Props) {
  const meta = useCampaignStore((s) => s.meta);
  const characters = useCampaignStore((s) => s.characters);
  const campaign = meta ? { id: meta.id, name: meta.name, playerCharacters: characters } : null;
  const showToast = useUiStore((s) => s.showToast);

  const [name, setName] = useState(existingEncounter?.name ?? "");
  const [description, setDescription] = useState(existingEncounter?.description ?? "");
  const [environment, setEnvironment] = useState(existingEncounter?.environment ?? "");
  const [slots, setSlots] = useState<{ enemyId: string; count: number }[]>(
    existingEncounter?.enemies.map((e) => ({ enemyId: e.enemyId, count: e.count })) ?? [],
  );
  const [showEnemyPicker, setShowEnemyPicker] = useState(false);

  const partyLevels = campaign?.playerCharacters.map((pc) => pc.level) ?? [5];
  const averagePartyLevel = partyLevels.length ? Math.round(partyLevels.reduce((s, l) => s + l, 0) / partyLevels.length) : 5;
  const { totalXp, adjustedXp, multiplier } = useMemo(() => calculateXp(slots), [slots]);
  const difficulty = useMemo(() => estimateDifficulty(adjustedXp, partyLevels), [adjustedXp, partyLevels]);

  const addEnemy = (template: { id: string; name: string; cr: number; ac: number; hp: number; type: string; subType?: string }) => {
    setSlots((prev) => {
      const existing = prev.find((s) => s.enemyId === template.id);
      return existing
        ? prev.map((s) => s.enemyId === template.id ? { ...s, count: s.count + 1 } : s)
        : [...prev, { enemyId: template.id, count: 1 }];
    });
    setShowEnemyPicker(false);
  };

  const updateCount = (enemyId: string, count: number) => {
    if (count <= 0) { setSlots((prev) => prev.filter((s) => s.enemyId !== enemyId)); return; }
    setSlots((prev) => prev.map((s) => s.enemyId === enemyId ? { ...s, count } : s));
  };

  const handleSave = () => {
    if (!name.trim()) { showToast({ message: "Encounter needs a name.", type: "error" }); return; }
    if (slots.length === 0) { showToast({ message: "Add at least one enemy group.", type: "error" }); return; }
    onSave({
      id: existingEncounter?.id ?? uid("enc"),
      name: name.trim(),
      description: description.trim() || "No description provided.",
      enemies: slots.map((s) => ({ enemyId: s.enemyId, count: s.count } as EncounterEnemy)),
      environment: environment.trim() || "Unknown",
      difficulty: difficulty === "unknown" ? "medium" : difficulty,
      experienceReward: totalXp,
      isActive: false,
      isHomebrew: false,
      createdAt: existingEncounter?.createdAt ?? Date.now(),
      updatedAt: Date.now(),
    });
    showToast({ message: `Encounter "${name}" saved!`, type: "success" });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-surface-400">Encounter Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Goblin Ambush"
            className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-surface-400">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
            placeholder="Brief description of the encounter..."
            className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-surface-400">Environment</label>
          <input value={environment} onChange={(e) => setEnvironment(e.target.value)} placeholder="e.g., Forest, Dungeon, City Streets"
            className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none" />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-surface-400">Enemies ({slots.length} group{slots.length !== 1 ? "s" : ""})</h3>
          <Button size="xs" variant="ghost" onClick={() => setShowEnemyPicker(true)}>+ Add Enemy</Button>
        </div>
        {slots.length === 0 ? (
          <div className="rounded-lg border border-dashed border-surface-700 bg-surface-800 py-6 text-center">
            <p className="text-xs text-surface-500">No enemies added yet. Click "Add Enemy" to begin.</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {slots.map((slot) => {
              const template = getEnemyById(slot.enemyId);
              return (
                <div key={slot.enemyId} className="flex items-center justify-between rounded-lg bg-surface-800 px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-surface-200 truncate">{template?.name ?? slot.enemyId}</p>
                    <p className="text-[10px] text-surface-500">CR {template?.cr ?? "?"} · AC {template?.ac ?? "?"} · HP {template?.hp ?? "?"}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <button onClick={() => updateCount(slot.enemyId, slot.count - 1)}
                      className="flex h-6 w-6 items-center justify-center rounded bg-surface-700 text-xs text-surface-300 hover:text-surface-100">−</button>
                    <span className="w-6 text-center text-sm font-medium text-surface-200">{slot.count}</span>
                    <button onClick={() => updateCount(slot.enemyId, slot.count + 1)}
                      className="flex h-6 w-6 items-center justify-center rounded bg-surface-700 text-xs text-surface-300 hover:text-surface-100">+</button>
                    <button onClick={() => setSlots((prev) => prev.filter((s) => s.enemyId !== slot.enemyId))}
                      className="ml-1 text-surface-600 hover:text-warrior-400">✕</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg bg-surface-800 p-3 text-center">
          <p className="text-[10px] text-surface-500">Raw XP</p>
          <p className="text-sm font-bold text-surface-200">{totalXp.toLocaleString()}</p>
        </div>
        <div className="rounded-lg bg-surface-800 p-3 text-center">
          <p className="text-[10px] text-surface-500">Adjusted (×{multiplier})</p>
          <p className="text-sm font-bold text-surface-200">{adjustedXp.toLocaleString()}</p>
        </div>
        <div className="rounded-lg bg-surface-800 p-3 text-center">
          <p className="text-[10px] text-surface-500">Difficulty</p>
          <p className={`text-sm font-bold ${getDifficultyColor(difficulty)}`}>{difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}</p>
        </div>
      </div>

      <p className="text-[10px] text-surface-500">Based on {partyLevels.length} PC(s) with average level {averagePartyLevel}.</p>

      <div className="flex justify-end gap-2 border-t border-surface-700 pt-4">
        <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
        <Button size="sm" onClick={handleSave} disabled={!name.trim() || slots.length === 0}>Save Encounter</Button>
      </div>

      {showEnemyPicker && <EnemyPickerModal onSelect={addEnemy} onClose={() => setShowEnemyPicker(false)} />}
    </div>
  );
}
