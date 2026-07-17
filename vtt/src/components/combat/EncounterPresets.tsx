/* ── Encounter Presets ─────────────────────────────────────────
 * Save/Load encounter templates to/from localStorage.
 * Allows the DM to quickly create encounters from pre-built
 * templates organized by difficulty and environment.
 *
 * ── Preset Categories ─────────────────────────────────────────
 * • Easy / Medium / Hard / Deadly (by CR)
 * • Undead horde, Goblin raid, Dragon lair, etc.
 *
 * ── Storage ────────────────────────────────────────────────────
 * Saved to localStorage under "vtt-encounter-presets".
 * Can be imported/exported as JSON for sharing.
 * ─────────────────────────────────────────────────────────────── */

import { useState, useEffect, useCallback } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import { useUiStore } from "@/stores/uiStore";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import type { Encounter, EncounterEnemy } from "@/types";

/* ── Types ──────────────────────────────────────────────────── */

interface EncounterPreset {
  name: string;
  difficulty: "easy" | "medium" | "hard" | "deadly";
  environment: string;
  enemies: { enemyId: string; count: number }[];
  description?: string;
}

const PRESETS_KEY = "vtt-encounter-presets";

/* ── Built-in presets ───────────────────────────────────────── */

const BUILT_IN_PRESETS: EncounterPreset[] = [
  {
    name: "Goblin Ambush",
    difficulty: "easy",
    environment: "forest",
    description: "A standard goblin ambush — perfect for levels 1-3.",
    enemies: [
      { enemyId: "goblin", count: 4 },
      { enemyId: "hobgoblin", count: 1 },
    ],
  },
  {
    name: "Undead Rising",
    difficulty: "medium",
    environment: "dungeon",
    description: "Skeletons and zombies crawl from the earth.",
    enemies: [
      { enemyId: "skeleton", count: 3 },
      { enemyId: "zombie", count: 3 },
      { enemyId: "wight", count: 1 },
    ],
  },
  {
    name: "Bandit Raid",
    difficulty: "medium",
    environment: "road",
    description: "A well-organized bandit crew intercepts the party.",
    enemies: [
      { enemyId: "bandit", count: 6 },
      { enemyId: "bandit_captain", count: 1 },
    ],
  },
  {
    name: "Cultist Rite",
    difficulty: "hard",
    environment: "temple",
    description: "Fanatics performing a dark ritual with monstrous guardians.",
    enemies: [
      { enemyId: "cultist", count: 4 },
      { enemyId: "cult_fanatic", count: 2 },
      { enemyId: "specter", count: 1 },
    ],
  },
  {
    name: "Elemental Fury",
    difficulty: "hard",
    environment: "mountain",
    description: "Elementals and mephits pour from a rift.",
    enemies: [
      { enemyId: "mud_mephit", count: 3 },
      { enemyId: "earth_elemental", count: 2 },
    ],
  },
  {
    name: "The Horde",
    difficulty: "deadly",
    environment: "plains",
    description: "A massive goblinoid war party.",
    enemies: [
      { enemyId: "goblin", count: 8 },
      { enemyId: "hobgoblin", count: 3 },
      { enemyId: "bugbear", count: 2 },
    ],
  },
  {
    name: "Dragon's Lair",
    difficulty: "deadly",
    environment: "cavern",
    description: "A young dragon and its cultist servants.",
    enemies: [
      { enemyId: "young_dragon", count: 1 },
      { enemyId: "cult_fanatic", count: 2 },
      { enemyId: "cultist", count: 2 },
    ],
  },
  {
    name: "Lycanthrope Hunt",
    difficulty: "hard",
    environment: "forest",
    description: "Werewolves stalk the party through the woods.",
    enemies: [
      { enemyId: "werewolf", count: 3 },
      { enemyId: "dire_wolf", count: 2 },
    ],
  },
];

function loadUserPresets(): EncounterPreset[] {
  try {
    const raw = localStorage.getItem(PRESETS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveUserPresets(presets: EncounterPreset[]) {
  localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
}

interface EncounterPresetsProps {
  onApplyPreset: (enemies: EncounterEnemy[]) => void;
}

export function EncounterPresets({ onApplyPreset }: EncounterPresetsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [userPresets, setUserPresets] = useState<EncounterPreset[]>([]);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [saveName, setSaveName] = useState("");
  const showToast = useUiStore((s) => s.showToast);
  const activeEncounter = useCampaignStore((s) => s.encounters);

  useEffect(() => {
    setUserPresets(loadUserPresets());
  }, [isOpen]);

  const handleApplyPreset = useCallback((preset: EncounterPreset) => {
    const enemies: EncounterEnemy[] = preset.enemies.map((e) => ({
      enemyId: e.enemyId,
      count: e.count,
      customHp: undefined,
    }));
    onApplyPreset(enemies);
    setIsOpen(false);
    showToast({ message: `Loaded "${preset.name}".`, type: "success" });
  }, [onApplyPreset, showToast]);

  const handleSaveCurrent = useCallback(() => {
    const name = saveName.trim();
    if (!name) return;
    // Find the most recently edited encounter
    if (activeEncounter.length === 0) return;
    const lastEnc = activeEncounter[activeEncounter.length - 1];
    const preset: EncounterPreset = {
      name,
      difficulty: "medium",
      environment: "dungeon",
      enemies: lastEnc.enemies.map((e) => ({ enemyId: e.enemyId, count: e.count })),
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

  const difficultyColor = (d: string) => {
    switch (d) {
      case "easy": return "text-divine-400";
      case "medium": return "text-mage-400";
      case "hard": return "text-warrior-400";
      case "deadly": return "text-warrior-400";
      default: return "text-surface-400";
    }
  };

  const environmentIcon = (env: string) => {
    const icons: Record<string, string> = {
      forest: "🌲", dungeon: "🏚️", road: "🛤️", temple: "🏛️",
      mountain: "⛰️", plains: "🌾", cavern: "🕳️", swamp: "🌿",
      arctic: "❄️", desert: "🏜️", coast: "🌊", urban: "🏙️",
    };
    return icons[env] ?? "📍";
  };

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
              <p className="text-[11px] font-semibold uppercase tracking-wider text-surface-400">Encounter Presets</p>
              <button onClick={() => setShowSaveForm((f) => !f)} className="text-[10px] text-accent-400 hover:text-accent-300 transition-colors">
                {showSaveForm ? "Cancel" : "+ Save Current"}
              </button>
            </div>

            {/* Save form */}
            {showSaveForm && (
              <div className="border-b border-surface-700 px-3 py-2">
                <div className="flex gap-1">
                  <input value={saveName} onChange={(e) => setSaveName(e.target.value)}
                    placeholder="Preset name..." className="flex-1 rounded border border-surface-700 bg-surface-800 px-2 py-1 text-xs text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none"
                    onKeyDown={(e) => e.key === "Enter" && handleSaveCurrent()} />
                  <Button size="xs" variant="primary" onClick={handleSaveCurrent} disabled={!saveName.trim()}>Save</Button>
                </div>
              </div>
            )}

            <div className="overflow-y-auto max-h-72 p-1.5 space-y-1">
              {/* Built-in presets */}
              <p className="px-2 py-1 text-[9px] font-semibold uppercase tracking-wider text-surface-500">Built-in</p>
              {BUILT_IN_PRESETS.map((preset) => (
                <button key={preset.name} onClick={() => handleApplyPreset(preset)}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left hover:bg-surface-800 transition-colors group">
                  <span className="text-sm">{environmentIcon(preset.environment)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-surface-200 truncate">{preset.name}</p>
                    <p className="text-[10px] text-surface-500 truncate">{preset.description}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className={`text-[10px] font-medium ${difficultyColor(preset.difficulty)}`}>
                      {preset.difficulty}
                    </span>
                    <Badge variant="neutral" size="xs">{preset.enemies.reduce((s, e) => s + e.count, 0)}</Badge>
                  </div>
                </button>
              ))}

              {/* User presets */}
              {userPresets.length > 0 && (
                <>
                  <div className="border-t border-surface-700 my-1" />
                  <p className="px-2 py-1 text-[9px] font-semibold uppercase tracking-wider text-surface-500">Custom</p>
                  {userPresets.map((preset) => (
                    <div key={preset.name} className="group flex items-center rounded-lg hover:bg-surface-800 transition-colors">
                      <button onClick={() => handleApplyPreset(preset)}
                        className="flex flex-1 items-center gap-2 px-2.5 py-2 text-left min-w-0">
                        <span className="text-sm">{environmentIcon(preset.environment)}</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-surface-200 truncate">{preset.name}</p>
                          <span className={`text-[10px] font-medium ${difficultyColor(preset.difficulty)}`}>
                            {preset.difficulty}
                          </span>
                        </div>
                      </button>
                      <button onClick={() => handleDeletePreset(preset.name)}
                        className="mr-2 text-surface-500 hover:text-warrior-400 opacity-0 group-hover:opacity-100 transition-all text-[10px]">
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
