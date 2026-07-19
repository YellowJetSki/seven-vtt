/**
 * STᚱ VTT — Encounter Card (DM Combat Command)
 *
 * Premium gold-accented card showing:
 * - Encounter name + unit count
 * - Difficulty badge (Easy/Medium/Hard/Deadly) with color coding
 * - XP total + adjusted XP
 * - CR range (min → max)
 * - HP totals per enemy group
 * - Enemy group breakdown with type icons
 * - Actions: Duplicate, Delete
 * - Selectable state for map population
 */

import { useMemo, useCallback } from "react";
import type { Encounter, EnemyDoc } from "@/types";
import {
  analyzeEncounterDifficulty,
  getDifficultyLabel,
  getDifficultyColor,
  type PartyConfig,
} from "@/lib/mechanics/encounter-cr";

interface EncounterCardProps {
  encounter: Encounter;
  enemies: EnemyDoc[];
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  partyConfig: PartyConfig;
}

function getCreatureIcon(type: string): string {
  switch (type) {
    case "Humanoid": return "🧑";
    case "Beast": return "🐺";
    case "Dragon": return "🐉";
    case "Undead": return "💀";
    case "Fiend": return "😈";
    case "Celestial": return "😇";
    case "Fey": return "🧚";
    case "Giant": return "🦣";
    case "Construct": return "🤖";
    case "Elemental": return "🌊";
    case "Aberration": return "👁";
    case "Monstrosity": return "🦑";
    case "Ooze": return "🫧";
    case "Plant": return "🌿";
    default: return "❓";
  }
}

export default function EncounterCard({
  encounter,
  enemies,
  isSelected,
  onSelect,
  onDuplicate,
  onDelete,
  partyConfig,
}: EncounterCardProps) {
  const unitBreakdown = useMemo(() => {
    return encounter.enemyGroups.map((g) => {
      const enemy = enemies.find((e) => e.id === g.enemyId);
      const count = g.count || 1;
      return {
        enemy,
        count,
        label: g.label,
        totalCr: enemy ? enemy.challengeRating * count : 0,
        totalHp: enemy ? (enemy.hitPoints.max || 10) * count : 0,
        icon: enemy ? getCreatureIcon(enemy.type) : "❓",
        singleXp: enemy ? enemy.challengeRating : 0,
      };
    });
  }, [encounter, enemies]);

  const crs = useMemo(
    () =>
      encounter.enemyGroups.flatMap((g) => {
        const enemy = enemies.find((e) => e.id === g.enemyId);
        return enemy ? Array(g.count || 1).fill(enemy.challengeRating) : [];
      }),
    [encounter, enemies]
  );

  const difficulty = useMemo(
    () => analyzeEncounterDifficulty(crs, partyConfig),
    [crs, partyConfig]
  );

  const totalUnits = encounter.enemyGroups.reduce((sum, g) => sum + (g.count || 1), 0);
  const totalHp = unitBreakdown.reduce((sum, u) => sum + u.totalHp, 0);

  const handleDuplicate = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onDuplicate(encounter.id);
    },
    [encounter.id, onDuplicate]
  );

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onDelete(encounter.id);
    },
    [encounter.id, onDelete]
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
      {/* ── Top row: Name + Difficulty ── */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <span
            className={`text-xs font-semibold truncate ${
              isSelected ? "text-gold-200" : "text-surface-200"
            }`}
          >
            {encounter.name}
          </span>
          <span className="text-[9px] text-surface-500 shrink-0">
            {totalUnits} unit{totalUnits !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Difficulty badge */}
        <span
          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border shrink-0 ${getDifficultyColor(difficulty.rating)}`}
        >
          {getDifficultyLabel(difficulty.rating)}
        </span>
      </div>

      {/* ── Enemy group breakdown ── */}
      <div className="flex flex-wrap gap-1 mb-1.5">
        {unitBreakdown.map((u, i) => (
          <span
            key={i}
            className="text-[9px] bg-surface-700/30 text-surface-400 px-1.5 py-0.5 rounded flex items-center gap-0.5"
            title={u.enemy ? `${u.enemy.name} · CR ${u.enemy.challengeRating} · HP ${u.totalHp}` : u.label}
          >
            {u.icon}
            <span>
              {u.count}x {u.enemy?.name || u.label || "Unknown"}
            </span>
            {u.totalHp > 0 && (
              <span className="text-surface-600 ml-0.5">
                · ❤️{u.totalHp}
              </span>
            )}
          </span>
        ))}
      </div>

      {/* ── Stats row: XP · CR · HP ── */}
      <div className="flex items-center gap-2 text-[9px] text-surface-500">
        <span className="flex items-center gap-0.5">
          <span className="text-gold-400/60">✦</span>
          {difficulty.totalXp.toLocaleString()} XP
        </span>
        <span className="text-surface-600">·</span>
        <span className="flex items-center gap-0.5">
          CR {difficulty.crRange.min}–{difficulty.crRange.max}
        </span>
        <span className="text-surface-600">·</span>
        <span className="flex items-center gap-0.5">
          ❤️ {totalHp}
        </span>
        {difficulty.adjustedXp !== difficulty.totalXp && (
          <>
            <span className="text-surface-600">·</span>
            <span className="text-amber-400/60">adj. {difficulty.adjustedXp.toLocaleString()} XP</span>
          </>
        )}
      </div>

      {/* ── Actions ── */}
      <div className="flex items-center gap-1 mt-1.5 pt-1.5 border-t border-white/[0.03]">
        <button
          onClick={handleDuplicate}
          className="text-[9px] px-1.5 py-0.5 rounded border border-white/[0.06] text-surface-500 hover:text-surface-300 hover:border-white/[0.1] active:scale-95 transition-all duration-150"
        >
          📋 Duplicate
        </button>
        <button
          onClick={handleDelete}
          className="text-[9px] px-1.5 py-0.5 rounded border border-white/[0.06] text-surface-500 hover:text-red-400 hover:border-red-500/15 active:scale-95 transition-all duration-150"
        >
          🗑 Delete
        </button>
      </div>
    </div>
  );
}
