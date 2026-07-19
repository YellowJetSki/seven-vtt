/**
 * STᚱ VTT — Encounter Card
 *
 * Selectable card in the encounter panel showing encounter name,
 * unit count, and enemy group breakdown.
 */

import type { Encounter, EnemyDoc } from "@/types";

interface EncounterCardProps {
  encounter: Encounter;
  enemies: EnemyDoc[];
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export default function EncounterCard({
  encounter,
  enemies,
  isSelected,
  onSelect,
}: EncounterCardProps) {
  const totalUnits = encounter.enemyGroups.reduce(
    (sum, g) => sum + (g.count || 1),
    0
  );

  return (
    <div
      onClick={() => onSelect(encounter.id)}
      className={`p-2.5 rounded-lg cursor-pointer transition-all duration-150 border ${
        isSelected
          ? "bg-accent-600/15 border-accent-500/30"
          : "bg-surface-800/30 border-surface-700/20 hover:bg-surface-700/40"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-surface-200">
          {encounter.name}
        </span>
        <span className="text-[10px] text-surface-500">{totalUnits} units</span>
      </div>
      <div className="flex gap-1 mt-1.5 flex-wrap">
        {encounter.enemyGroups.map((g, i) => {
          const enemy = enemies.find((e) => e.id === g.enemyId);
          return (
            <span
              key={i}
              className="text-[9px] bg-surface-700/30 text-surface-400 px-1 py-0.5 rounded"
            >
              {g.count || 1}x {enemy?.name || g.label || "Unknown"}
            </span>
          );
        })}
      </div>
    </div>
  );
}
