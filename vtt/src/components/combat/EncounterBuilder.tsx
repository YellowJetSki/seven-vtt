/* ── Encounter Builder ─────────────────────────────────────────
 * Allows the DM to build encounters by selecting enemies, setting
 * counts, and configuring the environment. Supports drag-reorder,
 * exact XP calculation, multi-environment tags.
 * ─────────────────────────────────────────────────────────────── */

import { useState, useMemo, useCallback } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import { useUiStore } from "@/stores/uiStore";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import type { Encounter, EncounterEnemy } from "@/types";

/* ── Pre-built enemy templates (for reference) ──────────────── */

interface EnemyTemplate {
  id: string;
  name: string;
  cr: number;
  ac: number;
  hp: number;
  type: string;
  subType?: string;
  source: string;
}

const SRD_ENEMIES: EnemyTemplate[] = [
  { id: "bandit", name: "Bandit", cr: 0.125, ac: 12, hp: 11, type: "humanoid", subType: "any race", source: "SRD" },
  { id: "bandit_captain", name: "Bandit Captain", cr: 2, ac: 15, hp: 65, type: "humanoid", subType: "any race", source: "SRD" },
  { id: "skeleton", name: "Skeleton", cr: 0.25, ac: 13, hp: 13, type: "undead", source: "SRD" },
  { id: "zombie", name: "Zombie", cr: 0.25, ac: 8, hp: 22, type: "undead", source: "SRD" },
  { id: "wight", name: "Wight", cr: 3, ac: 14, hp: 45, type: "undead", source: "SRD" },
  { id: "earth_elemental", name: "Earth Elemental", cr: 5, ac: 17, hp: 126, type: "elemental", source: "SRD" },
  { id: "mud_mephit", name: "Mud Mephit", cr: 0.25, ac: 11, hp: 27, type: "elemental", source: "SRD" },
  { id: "goblin", name: "Goblin", cr: 0.25, ac: 15, hp: 7, type: "humanoid", subType: "goblinoid", source: "SRD" },
  { id: "hobgoblin", name: "Hobgoblin", cr: 0.5, ac: 18, hp: 11, type: "humanoid", subType: "goblinoid", source: "SRD" },
  { id: "bugbear", name: "Bugbear", cr: 1, ac: 16, hp: 27, type: "humanoid", subType: "goblinoid", source: "SRD" },
  { id: "specter", name: "Specter", cr: 1, ac: 12, hp: 22, type: "undead", source: "SRD" },
  { id: "ghoul", name: "Ghoul", cr: 1, ac: 12, hp: 22, type: "undead", source: "SRD" },
  { id: "giant_spider", name: "Giant Spider", cr: 1, ac: 14, hp: 26, type: "beast", source: "SRD" },
  { id: "werewolf", name: "Werewolf", cr: 3, ac: 12, hp: 58, type: "humanoid", subType: "shapechanger", source: "SRD" },
  { id: "vampire_spawn", name: "Vampire Spawn", cr: 5, ac: 15, hp: 82, type: "undead", source: "SRD" },
  { id: "young_dragon", name: "Young Red Dragon", cr: 10, ac: 18, hp: 178, type: "dragon", source: "SRD" },
  { id: "cultist", name: "Cultist", cr: 0.125, ac: 12, hp: 9, type: "humanoid", subType: "any race", source: "SRD" },
  { id: "cult_fanatic", name: "Cult Fanatic", cr: 2, ac: 13, hp: 33, type: "humanoid", subType: "any race", source: "SRD" },
  { id: "dire_wolf", name: "Dire Wolf", cr: 1, ac: 14, hp: 37, type: "beast", source: "SRD" },
  { id: "displacer_beast", name: "Displacer Beast", cr: 3, ac: 13, hp: 85, type: "monstrosity", source: "SRD" },
];

/* ── XP by CR (D&D 5e DMG p. 274) ──────────────────────────── */

const XP_BY_CR: Record<number, number> = {
  0: 10,
  0.125: 25,
  0.25: 50,
  0.5: 100,
  1: 200,
  2: 450,
  3: 700,
  4: 1100,
  5: 1800,
  6: 2300,
  7: 2900,
  8: 3900,
  9: 5000,
  10: 5900,
  11: 7200,
  12: 8400,
  13: 10000,
  14: 11500,
  15: 13000,
  16: 15000,
  17: 18000,
  18: 20000,
  19: 22000,
  20: 25000,
  21: 33000,
  22: 41000,
  23: 50000,
  24: 62000,
  25: 75000,
  30: 155000,
};

/* ── XP Thresholds by Party Level ───────────────────────────── */

const PARTY_SIZE_MULTIPLIERS: Record<number, number> = {
  1: 1, 2: 1.5, 3: 2, 4: 2, 5: 2,
  6: 2, 7: 2.5, 8: 2.5, 9: 2.5, 10: 2.5,
  11: 3, 12: 3, 13: 3, 14: 3, 15: 4,
};

const THRESHOLDS: Record<number, { easy: number; medium: number; hard: number; deadly: number }> = {
  1: { easy: 25, medium: 50, hard: 75, deadly: 100 },
  2: { easy: 50, medium: 100, hard: 150, deadly: 200 },
  3: { easy: 75, medium: 150, hard: 225, deadly: 400 },
  4: { easy: 125, medium: 250, hard: 375, deadly: 500 },
  5: { easy: 250, medium: 500, hard: 750, deadly: 1100 },
  6: { easy: 300, medium: 600, hard: 900, deadly: 1400 },
  7: { easy: 350, medium: 750, hard: 1100, deadly: 1700 },
  8: { easy: 450, medium: 900, hard: 1400, deadly: 2100 },
  9: { easy: 550, medium: 1100, hard: 1600, deadly: 2400 },
  10: { easy: 600, medium: 1200, hard: 1900, deadly: 2800 },
  11: { easy: 800, medium: 1600, hard: 2400, deadly: 3600 },
  12: { easy: 1000, medium: 2000, hard: 3000, deadly: 4500 },
  13: { easy: 1100, medium: 2200, hard: 3400, deadly: 5100 },
  14: { easy: 1250, medium: 2500, hard: 3800, deadly: 5700 },
  15: { easy: 1400, medium: 2800, hard: 4300, deadly: 6400 },
  16: { easy: 1600, medium: 3200, hard: 4800, deadly: 7200 },
  17: { easy: 2000, medium: 3900, hard: 5900, deadly: 8800 },
  18: { easy: 2100, medium: 4200, hard: 6300, deadly: 9500 },
  19: { easy: 2400, medium: 4900, hard: 7300, deadly: 10900 },
  20: { easy: 2800, medium: 5700, hard: 8500, deadly: 12700 },
};

function getDifficultyColor(difficulty: string): string {
  switch (difficulty) {
    case "easy": return "text-rogue-400 border-rogue-500/30 bg-rogue-500/10";
    case "medium": return "text-divine-400 border-divine-500/30 bg-divine-500/10";
    case "hard": return "text-warrior-400 border-warrior-500/30 bg-warrior-500/10";
    case "deadly": return "text-warrior-400 border-warrior-500/50 bg-warrior-500/20";
    default: return "text-surface-400 border-surface-700 bg-surface-800";
  }
}

/* ── Helpers ────────────────────────────────────────────────── */

function uid(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function calculateExactXp(enemies: { enemyId: string; count: number }[]): {
  totalXp: number;
  adjustedXp: number;
  multiplier: number;
} {
  let rawXp = 0;
  let enemyCount = 0;

  for (const e of enemies) {
    const template = SRD_ENEMIES.find((t) => t.id === e.enemyId);
    if (template) {
      rawXp += (XP_BY_CR[template.cr] ?? 0) * e.count;
      enemyCount += e.count;
    }
  }

  // Encounter size multiplier (DMG p. 274)
  const multKey = enemyCount as keyof typeof PARTY_SIZE_MULTIPLIERS;
  const multiplier = PARTY_SIZE_MULTIPLIERS[multKey] ?? 4;
  const adjustedXp = Math.floor(rawXp * multiplier);

  return { totalXp: rawXp, adjustedXp, multiplier };
}

function estimateDifficulty(adjustedXp: number, partyLevels: number[]): string {
  if (partyLevels.length === 0) return "unknown";
  const avgLevel = Math.round(partyLevels.reduce((s, l) => s + l, 0) / partyLevels.length);
  const threshold = THRESHOLDS[avgLevel] ?? THRESHOLDS[5];

  // Deadly by total party threshold
  const partyDeadly = threshold.deadly * partyLevels.length;
  const partyHard = threshold.hard * partyLevels.length;

  if (adjustedXp >= partyDeadly * 1.25) return "deadly";
  if (adjustedXp >= partyDeadly) return "deadly";
  if (adjustedXp >= partyHard) return "hard";
  if (adjustedXp >= threshold.medium * partyLevels.length) return "medium";
  return "easy";
}

/* ── Component Props ────────────────────────────────────────── */

interface EncounterBuilderProps {
  existingEncounter?: Encounter;
  onSave: (encounter: Encounter) => void;
  onCancel: () => void;
}

export function EncounterBuilder({
  existingEncounter,
  onSave,
  onCancel,
}: EncounterBuilderProps) {
  const campaign = useCampaignStore((s) => s.campaign);
  const showToast = useUiStore((s) => s.showToast);

  const [name, setName] = useState(existingEncounter?.name ?? "");
  const [description, setDescription] = useState(existingEncounter?.description ?? "");
  const [environment, setEnvironment] = useState(existingEncounter?.environment ?? "");
  const [slots, setSlots] = useState<{ enemyId: string; count: number }[]>(
    existingEncounter?.enemies.map((e) => ({ enemyId: e.enemyId, count: e.count })) ?? [],
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [showEnemyPicker, setShowEnemyPicker] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const partyLevels = campaign?.playerCharacters.map((pc) => pc.level) ?? [5];
  const averagePartyLevel = partyLevels.length
    ? Math.round(partyLevels.reduce((s, l) => s + l, 0) / partyLevels.length)
    : 5;

  const { totalXp, adjustedXp, multiplier } = useMemo(
    () => calculateExactXp(slots),
    [slots],
  );
  const difficulty = useMemo(
    () => estimateDifficulty(adjustedXp, partyLevels),
    [adjustedXp, partyLevels],
  );

  const filteredEnemies = useMemo(() => {
    if (!searchQuery.trim()) return SRD_ENEMIES;
    const q = searchQuery.toLowerCase();
    return SRD_ENEMIES.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.type.toLowerCase().includes(q) ||
        (e.subType ?? "").toLowerCase().includes(q),
    );
  }, [searchQuery]);

  /* ── Drag-reorder handlers ── */
  const handleDragStart = useCallback((index: number) => {
    setDraggedIndex(index);
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault();
      if (draggedIndex === null || draggedIndex === index) return;

      setSlots((prev) => {
        const newSlots = [...prev];
        const [moved] = newSlots.splice(draggedIndex, 1);
        newSlots.splice(index, 0, moved);
        return newSlots;
      });
      setDraggedIndex(index);
    },
    [draggedIndex],
  );

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
  }, []);

  const addEnemy = (enemyId: string) => {
    setSlots((prev) => {
      const existing = prev.find((s) => s.enemyId === enemyId);
      if (existing) {
        return prev.map((s) =>
          s.enemyId === enemyId ? { ...s, count: s.count + 1 } : s,
        );
      }
      return [...prev, { enemyId, count: 1 }];
    });
  };

  const updateCount = (enemyId: string, count: number) => {
    if (count <= 0) {
      setSlots((prev) => prev.filter((s) => s.enemyId !== enemyId));
      return;
    }
    setSlots((prev) =>
      prev.map((s) => (s.enemyId === enemyId ? { ...s, count } : s)),
    );
  };

  const removeEnemy = (enemyId: string) => {
    setSlots((prev) => prev.filter((s) => s.enemyId !== enemyId));
  };

  const handleSave = () => {
    if (!name.trim()) {
      showToast({ message: "Encounter needs a name.", type: "error" });
      return;
    }
    if (slots.length === 0) {
      showToast({ message: "Add at least one enemy group.", type: "error" });
      return;
    }

    const encounter: Encounter = {
      id: existingEncounter?.id ?? uid("enc"),
      name: name.trim(),
      description: description.trim() || "No description provided.",
      enemies: slots.map(
        (s): EncounterEnemy => ({
          enemyId: s.enemyId,
          count: s.count,
        }),
      ),
      environment: environment.trim() || undefined,
      difficulty: (difficulty === "unknown" ? undefined : difficulty) as "easy" | "medium" | "hard" | "deadly" | undefined,
      experienceReward: totalXp,
      isHomebrew: false,
      createdAt: existingEncounter?.createdAt ?? Date.now(),
      updatedAt: Date.now(),
    };

    onSave(encounter);
    showToast({ message: `Encounter "${name}" saved!`, type: "success" });
  };

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-surface-400">Encounter Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Roadside Ambush"
            className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:ring-1 focus:ring-accent-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-surface-400">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the encounter scenario..."
            rows={3}
            className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:ring-1 focus:ring-accent-500 focus:outline-none resize-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-surface-400">Environment</label>
          <input
            value={environment}
            onChange={(e) => setEnvironment(e.target.value)}
            placeholder="e.g., Dark forest, ruined keep, swamp"
            className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:ring-1 focus:ring-accent-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Enemy Groups with Drag-Reorder */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-surface-400">
            Enemy Groups
          </h4>
          <Button size="xs" onClick={() => setShowEnemyPicker(true)}>
            + Add Enemy
          </Button>
        </div>

        {slots.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-surface-700 bg-surface-800 py-8">
            <span className="text-2xl text-surface-600">⚔</span>
            <p className="mt-2 text-sm text-surface-500">No enemies yet. Add some!</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {slots.map((slot, index) => {
              const template = SRD_ENEMIES.find((e) => e.id === slot.enemyId);
              if (!template) return null;
              return (
                <div
                  key={`${slot.enemyId}-${index}`}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center gap-3 rounded-lg border bg-surface-800 px-3 py-2.5 transition-all ${
                    draggedIndex === index
                      ? "border-accent-500 opacity-50 scale-[1.02] shadow-lg"
                      : "border-surface-700 hover:border-surface-600"
                  }`}
                >
                  {/* Drag Handle */}
                  <span className="cursor-grab text-surface-500 hover:text-surface-300 text-sm shrink-0" title="Drag to reorder">
                    ⠿
                  </span>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-surface-200">{template.name}</p>
                    <p className="text-xs text-surface-500">
                      CR {template.cr} · AC {template.ac} · {template.hp} HP · {template.type}
                      {template.subType ? ` (${template.subType})` : ""}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateCount(slot.enemyId, slot.count - 1)}
                      className="flex h-7 w-7 items-center justify-center rounded bg-surface-700 text-surface-400 hover:bg-surface-600 hover:text-surface-200 transition-colors"
                      aria-label="Decrease count"
                    >
                      −
                    </button>
                    <span className="w-6 text-center text-sm font-bold text-surface-200">
                      {slot.count}
                    </span>
                    <button
                      onClick={() => updateCount(slot.enemyId, slot.count + 1)}
                      className="flex h-7 w-7 items-center justify-center rounded bg-surface-700 text-surface-400 hover:bg-surface-600 hover:text-surface-200 transition-colors"
                      aria-label="Increase count"
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={() => removeEnemy(slot.enemyId)}
                    className="flex h-7 w-7 items-center justify-center rounded text-surface-500 hover:bg-warrior-500/10 hover:text-warrior-400 transition-colors"
                    aria-label="Remove enemy"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Difficulty Summary — Enhanced */}
      {slots.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-lg border border-surface-700 bg-surface-800 p-3">
            <p className="text-xs text-surface-500">Raw XP</p>
            <p className="text-lg font-bold text-surface-100">{totalXp.toLocaleString()}</p>
          </div>
          <div className="rounded-lg border border-surface-700 bg-surface-800 p-3">
            <p className="text-xs text-surface-500">Adjusted XP</p>
            <p className="text-lg font-bold text-surface-100">{adjustedXp.toLocaleString()}</p>
            <p className="text-[10px] text-surface-500">×{multiplier} mult</p>
          </div>
          <div className="rounded-lg border border-surface-700 bg-surface-800 p-3">
            <p className="text-xs text-surface-500">Difficulty</p>
            <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-bold mt-1 ${getDifficultyColor(difficulty)}`}>
              {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
            </span>
          </div>
          <div className="rounded-lg border border-surface-700 bg-surface-800 p-3">
            <p className="text-xs text-surface-500">Party</p>
            <p className="text-lg font-bold text-surface-100">Lvl {averagePartyLevel}</p>
            <p className="text-[10px] text-surface-500">{partyLevels.length} adventurers</p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2 border-t border-surface-700">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave}>
          {existingEncounter ? "Update Encounter" : "Create Encounter"}
        </Button>
      </div>

      {/* Enemy Picker Modal */}
      {showEnemyPicker && (
        <Modal modalId="enemy-picker" title="Select Enemy" size="lg">
          <div className="space-y-4">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search enemies by name, type, or subtype..."
              className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:ring-1 focus:ring-accent-500 focus:outline-none"
              autoFocus
            />
            <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-1">
              {filteredEnemies.map((enemy) => (
                <button
                  key={enemy.id}
                  onClick={() => {
                    addEnemy(enemy.id);
                    setShowEnemyPicker(false);
                    setSearchQuery("");
                  }}
                  className="text-left rounded-lg border border-surface-700 bg-surface-800 p-3 transition-colors hover:border-accent-500/50 hover:bg-surface-700"
                >
                  <p className="text-sm font-medium text-surface-200">{enemy.name}</p>
                  <div className="flex gap-2 mt-1">
                    <Badge size="xs" variant="neutral">CR {enemy.cr}</Badge>
                    <Badge size="xs" variant="neutral">AC {enemy.ac}</Badge>
                    <Badge size="xs" variant="neutral">HP {enemy.hp}</Badge>
                  </div>
                  <p className="text-[10px] text-surface-500 mt-1">
                    {enemy.type}{enemy.subType ? ` · ${enemy.subType}` : ""} · {enemy.source}
                  </p>
                </button>
              ))}
              {filteredEnemies.length === 0 && (
                <div className="col-span-2 py-8 text-center text-sm text-surface-500">
                  No enemies matching "{searchQuery}"
                </div>
              )}
            </div>
            <div className="flex justify-end">
              <Button variant="ghost" size="sm" onClick={() => { setShowEnemyPicker(false); setSearchQuery(""); }}>
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
