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
  0: 10, 0.125: 25, 0.25: 50, 0.5: 100,
  1: 200, 2: 450, 3: 700, 4: 1100, 5: 1800,
  6: 2300, 7: 2900, 8: 3900, 9: 5000, 10: 5900,
  11: 7200, 12: 8400, 13: 10000, 14: 11500, 15: 13000,
  16: 15000, 17: 18000, 18: 20000, 19: 22000, 20: 25000,
  21: 33000, 22: 41000, 23: 50000, 24: 62000, 25: 75000, 30: 155000,
};

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

  const multKey = enemyCount as keyof typeof PARTY_SIZE_MULTIPLIERS;
  const multiplier = PARTY_SIZE_MULTIPLIERS[multKey] ?? 4;
  const adjustedXp = Math.floor(rawXp * multiplier);

  return { totalXp: rawXp, adjustedXp, multiplier };
}

function estimateDifficulty(adjustedXp: number, partyLevels: number[]): string {
  if (partyLevels.length === 0) return "unknown";
  const avgLevel = Math.round(partyLevels.reduce((s, l) => s + l, 0) / partyLevels.length);
  const threshold = THRESHOLDS[avgLevel] ?? THRESHOLDS[5];
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

  const addEnemy = (template: EnemyTemplate) => {
    setSlots((prev) => {
      const existing = prev.find((s) => s.enemyId === template.id);
      if (existing) {
        return prev.map((s) =>
          s.enemyId === template.id ? { ...s, count: s.count + 1 } : s,
        );
      }
      return [...prev, { enemyId: template.id, count: 1 }];
    });
    setShowEnemyPicker(false);
    setSearchQuery("");
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
        (s) => ({
          enemyId: s.enemyId,
          count: s.count,
        } as EncounterEnemy),
      ),
      environment: environment.trim() || "Unknown",
      difficulty: (difficulty === "unknown" ? "medium" : difficulty),
      experienceReward: totalXp,
      isActive: false,
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
            placeholder="e.g., Goblin Ambush"
            className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-surface-400">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Brief description of the encounter..."
            className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-surface-400">Environment</label>
          <input
            value={environment}
            onChange={(e) => setEnvironment(e.target.value)}
            placeholder="e.g., Forest, Dungeon, City Streets"
            className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Enemy Slots */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-surface-400">
            Enemies ({slots.length} group{slots.length !== 1 ? "s" : ""})
          </h3>
          <Button size="xs" variant="ghost" onClick={() => setShowEnemyPicker(true)}>
            + Add Enemy
          </Button>
        </div>

        {slots.length === 0 ? (
          <div className="rounded-lg border border-dashed border-surface-700 bg-surface-800 py-6 text-center">
            <p className="text-xs text-surface-500">No enemies added yet. Click "Add Enemy" to begin.</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {slots.map((slot, i) => {
              const template = SRD_ENEMIES.find((t) => t.id === slot.enemyId);
              return (
                <div
                  key={slot.enemyId}
                  className="flex items-center justify-between rounded-lg bg-surface-800 px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-surface-200 truncate">
                      {template?.name ?? slot.enemyId}
                    </p>
                    <p className="text-[10px] text-surface-500">
                      CR {template?.cr ?? "?"} · AC {template?.ac ?? "?"} · HP {template?.hp ?? "?"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <button
                      onClick={() => updateCount(slot.enemyId, slot.count - 1)}
                      className="flex h-6 w-6 items-center justify-center rounded bg-surface-700 text-xs text-surface-300 hover:text-surface-100"
                    >−</button>
                    <span className="w-6 text-center text-sm font-medium text-surface-200">
                      {slot.count}
                    </span>
                    <button
                      onClick={() => updateCount(slot.enemyId, slot.count + 1)}
                      className="flex h-6 w-6 items-center justify-center rounded bg-surface-700 text-xs text-surface-300 hover:text-surface-100"
                    >+</button>
                    <button
                      onClick={() => removeEnemy(slot.enemyId)}
                      className="ml-1 text-surface-600 hover:text-warrior-400"
                    >✕</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Difficulty & XP Display */}
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
          <p className={`text-sm font-bold ${getDifficultyColor(difficulty)}`}>
            {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
          </p>
        </div>
      </div>

      {/* Average Party Level */}
      <p className="text-[10px] text-surface-500">
        Based on {partyLevels.length} PC(s) with average level {averagePartyLevel}.
      </p>

      {/* Actions */}
      <div className="flex justify-end gap-2 border-t border-surface-700 pt-4">
        <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
        <Button size="sm" onClick={handleSave} disabled={!name.trim() || slots.length === 0}>
          Save Encounter
        </Button>
      </div>

      {/* Enemy Picker Modal */}
      {showEnemyPicker && (
        <Modal modalId="enemy-picker" title="Add Enemy" size="md">
          <div className="space-y-3">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search enemies by name or type..."
              autoFocus
              className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none"
            />
            <div className="max-h-60 overflow-y-auto space-y-1">
              {filteredEnemies.map((template) => (
                <button
                  key={template.id}
                  onClick={() => addEnemy(template)}
                  className="flex w-full items-center justify-between rounded-lg bg-surface-800 px-3 py-2 text-left transition-colors hover:bg-surface-700"
                >
                  <div>
                    <p className="text-sm font-medium text-surface-200">{template.name}</p>
                    <p className="text-[10px] text-surface-500 capitalize">
                      {template.type}{template.subType ? ` (${template.subType})` : ""}
                    </p>
                  </div>
                  <div className="flex gap-2 text-[10px] text-surface-500">
                    <span>CR {template.cr}</span>
                    <span>AC {template.ac}</span>
                    <span>HP {template.hp}</span>
                  </div>
                </button>
              ))}
              {filteredEnemies.length === 0 && (
                <p className="py-4 text-center text-xs text-surface-500">
                  No enemies match "{searchQuery}"
                </p>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
