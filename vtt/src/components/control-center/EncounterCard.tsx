/**
 * STᚱ VTT — Encounter Card (Premium Gold)
 *
 * Gold-accented selectable card in the encounter panel.
 * Active state highlighted with gold glow and border.
 * Shows encounter name, unit count, and enemy group breakdown.
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
      className={`p-2.5 rounded-lg cursor-pointer transition-all duration-200 border ${
        isSelected
          ? "bg-gold-500/10 border-gold/25 shadow-[0_0_10px_rgba(234,179,8,0.05)]"
          : "bg-obsidian-mid/40 border-surface-700/20 hover:bg-gold-500/[0.03] hover:border-gold/10"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className={`text-xs font-semibold ${
          isSelected ? "text-gold-200" : "text-surface-200"
        }`}>
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
