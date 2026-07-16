/* ── Random Encounter Generator ─────────────────────────────────
 * Builds a random encounter based on party level and terrain type.
 * Uses the shared enemy database and encounter difficulty calculator.
 * ──────────────────────────────────────────────────────────────── */
import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useCampaignStore } from "@/stores/campaignStore";
import { useCombatStore } from "@/stores/combatStore";
import { useUiStore } from "@/stores/uiStore";
import { getAllEnemies, XP_BY_CR } from "@/data/enemy-database";
import type { EnemyTemplate } from "@/data/enemy-database";

const TERRAIN_OPTIONS = [
  { id: "forest", label: "🌲 Forest", emoji: "🌲" },
  { id: "dungeon", label: "🏚️ Dungeon", emoji: "🏚️" },
  { id: "coastal", label: "🌊 Coastal", emoji: "🌊" },
  { id: "mountain", label: "⛰️ Mountain", emoji: "⛰️" },
  { id: "plains", label: "🌾 Plains", emoji: "🌾" },
  { id: "swamp", label: "🪴 Swamp", emoji: "🪴" },
  { id: "arctic", label: "❄️ Arctic", emoji: "❄️" },
  { id: "desert", label: "🏜️ Desert", emoji: "🏜️" },
  { id: "urban", label: "🏙️ Urban", emoji: "🏙️" },
  { id: "underdark", label: "🕳️ Underdark", emoji: "🕳️" },
];

const TERRAIN_TYPES: Record<string, string[]> = {
  forest:     ["Beast", "Fey", "Humanoid", "Monstrosity", "Plant"],
  dungeon:    ["Undead", "Construct", "Monstrosity", "Humanoid", "Ooze"],
  coastal:    ["Beast", "Dragon", "Humanoid", "Monstrosity"],
  mountain:   ["Giant", "Dragon", "Humanoid", "Monstrosity", "Elemental"],
  plains:     ["Beast", "Humanoid", "Monstrosity"],
  swamp:      ["Undead", "Beast", "Humanoid", "Plant", "Monstrosity"],
  arctic:     ["Beast", "Giant", "Humanoid", "Monstrosity"],
  desert:     ["Beast", "Humanoid", "Monstrosity", "Elemental", "Dragon"],
  urban:      ["Humanoid", "Construct", "Beast"],
  underdark:  ["Monstrosity", "Undead", "Aberration", "Giant", "Humanoid"],
};

const DIFFICULTY_PRESETS = ["easy", "medium", "hard", "deadly"];

// XP thresholds per PC level (from DMG)
const XP_THRESHOLDS: Record<number, Record<string, number>> = {
  1:  { easy: 25, medium: 50, hard: 75, deadly: 100 },
  2:  { easy: 50, medium: 100, hard: 150, deadly: 200 },
  3:  { easy: 75, medium: 150, hard: 225, deadly: 400 },
  4:  { easy: 125, medium: 250, hard: 375, deadly: 500 },
  5:  { easy: 250, medium: 500, hard: 750, deadly: 1100 },
  6:  { easy: 300, medium: 600, hard: 900, deadly: 1400 },
  7:  { easy: 350, medium: 750, hard: 1100, deadly: 1700 },
  8:  { easy: 450, medium: 900, hard: 1400, deadly: 2100 },
  9:  { easy: 550, medium: 1100, hard: 1600, deadly: 2400 },
  10: { easy: 600, medium: 1200, hard: 1900, deadly: 2800 },
};

function generateEncounter(
  terrain: string,
  difficulty: string,
  partyLevels: number[],
  availableEnemies: EnemyTemplate[],
): { enemies: { template: EnemyTemplate; count: number }[]; description: string } {
  const avgLevel = partyLevels.length
    ? Math.round(partyLevels.reduce((s, l) => s + l, 0) / partyLevels.length)
    : 5;
  const thresholds = XP_THRESHOLDS[Math.min(avgLevel, 10)] ?? XP_THRESHOLDS[5];
  const targetXp = (thresholds[difficulty as keyof typeof thresholds] ?? thresholds.medium) * partyLevels.length;

  // Filter enemies by terrain type
  const allowedTypes = TERRAIN_TYPES[terrain] ?? ["Humanoid", "Beast"];
  const candidates = availableEnemies.filter((e) => allowedTypes.includes(e.type));

  if (candidates.length === 0) {
    return { enemies: [{ template: availableEnemies[0], count: 3 }], description: "A generic threat emerges!" };
  }

  const selected: { template: EnemyTemplate; count: number }[] = [];
  let currentXp = 0;
  let attempts = 0;

  while (currentXp < targetXp && attempts < 20) {
    attempts++;
    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    const xp = XP_BY_CR[pick.cr] ?? 50;

    // Don't add if it would overshoot by more than 50%
    if (currentXp + xp > targetXp * 1.5 && selected.length > 0) break;

    const existing = selected.find((s) => s.template.id === pick.id);
    if (existing) {
      existing.count++;
    } else {
      selected.push({ template: pick, count: 1 });
    }
    currentXp += xp;
  }

  // Generate description
  const mainType = selected[0]?.template.type ?? "creatures";
  const groupCount = selected.reduce((s, e) => s + e.count, 0);
  const names = selected.map((s) => `${s.count}× ${s.template.name}`).join(", ");

  const descriptions = [
    `A group of ${groupCount} ${mainType.toLowerCase()} creatures ambush the party!`,
    `The party encounters ${groupCount} hostile ${mainType.toLowerCase()} creatures.`,
    `From the ${terrain}, ${groupCount} creatures emerge — ${names}!`,
    `A patrol of ${names} stands in the party's path.`,
  ];

  return {
    enemies: selected,
    description: descriptions[Math.floor(Math.random() * descriptions.length)],
  };
}

export function RandomEncounterGenerator({ onAddToCombat }: { onAddToCombat?: (enemies: { enemyId: string; count: number }[]) => void }) {
  const campaign = useCampaignStore((s) => s.campaign);
  const showToast = useUiStore((s) => s.showToast);

  const [terrain, setTerrain] = useState("forest");
  const [difficulty, setDifficulty] = useState("medium");
  const [result, setResult] = useState<{ enemies: { template: EnemyTemplate; count: number }[]; description: string } | null>(null);

  const partyLevels = campaign?.playerCharacters.map((pc) => pc.level) ?? [5];
  const allEnemies = useMemo(() => getAllEnemies(), []);

  const handleGenerate = () => {
    const generated = generateEncounter(terrain, difficulty, partyLevels, allEnemies);
    setResult(generated);
    showToast({ message: `✨ Random encounter generated: ${generated.description}`, type: "success" });
  };

  const handleLoadToCombat = () => {
    if (!result) return;
    const addEnemyGroup = useCombatStore.getState().addEnemyGroup;
    result.enemies.forEach((e) => {
      addEnemyGroup(e.template.name, e.count);
    });
    showToast({ message: `Loaded ${result.enemies.reduce((s, e) => s + e.count, 0)} enemies into combat!`, type: "success" });
  };

  return (
    <div className="rounded-xl border border-surface-700 bg-surface-850 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-surface-200">🎲 Random Encounter</h3>
        <Badge variant="info">Auto-Generated</Badge>
      </div>

      {/* Terrain Selector */}
      <div>
        <p className="text-[10px] text-surface-400 mb-1.5">Terrain</p>
        <div className="flex flex-wrap gap-1.5">
          {TERRAIN_OPTIONS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTerrain(t.id)}
              className={`rounded-lg px-2.5 py-1 text-xs transition-colors ${
                terrain === t.id
                  ? "bg-accent-500/20 text-accent-300 border border-accent-500/30"
                  : "bg-surface-800 text-surface-400 border border-surface-700 hover:border-surface-600"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Difficulty Selector */}
      <div>
        <p className="text-[10px] text-surface-400 mb-1.5">Difficulty</p>
        <div className="flex gap-1.5">
          {DIFFICULTY_PRESETS.map((d) => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className={`rounded-lg px-3 py-1 text-xs capitalize transition-colors ${
                difficulty === d
                  ? "bg-accent-500/20 text-accent-300 border border-accent-500/30"
                  : "bg-surface-800 text-surface-400 border border-surface-700 hover:border-surface-600"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Generate Button */}
      <Button size="sm" onClick={handleGenerate} className="w-full">
        🎲 Generate Encounter
      </Button>

      {/* Result */}
      {result && (
        <div className="space-y-3 rounded-lg border border-surface-700 bg-surface-800 p-3">
          <p className="text-sm text-surface-200">{result.description}</p>

          <div className="space-y-1.5">
            {result.enemies.map((e) => (
              <div key={e.template.id} className="flex items-center justify-between text-xs">
                <span className="text-surface-300">{e.template.name}</span>
                <span className="text-surface-500">
                  ×{e.count} · AC {e.template.ac} · HP {e.template.hp} · CR {e.template.cr}
                </span>
              </div>
            ))}
          </div>

          <Button size="xs" variant="primary" onClick={handleLoadToCombat}>
            ⚔ Load into Combat
          </Button>
        </div>
      )}
    </div>
  );
}
