/**
 * ST R VTT - Encounter List
 *
 * Displays all saved encounters with rich metadata cards.
 * Each card shows: name, environment, difficulty badge, enemy count,
 * XP range, last updated, and action buttons (launch, edit, delete).
 */

import { useCallback } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import { analyzeEncounterDifficulty, DEFAULT_PARTY_CONFIG, getDifficultyLabel, getDifficultyColor } from "@/lib/mechanics/encounter-cr";
import { getXpForCr } from "@/lib/mechanics/encounter-cr";
import { parseCr } from "@/lib/mechanics/encounter-cr";
import type { Encounter } from "@/types";

interface EncounterListProps {
  onSelectEncounter: (encounter: Encounter) => void;
  onDeleteEncounter: (id: string) => void;
  onLaunchEncounter: (encounter: Encounter) => void;
}

const ENVIRONMENT_ICONS: Record<string, string> = {
  dungeon: "🏚", forest: "🌲", city: "🏛", cave: "🕳",
  swamp: "🌿", mountain: "⛰", desert: "🏜", water: "🌊",
  planar: "🌀", urban: "🏘", ruins: "🏗", temple: "⛩",
  castle: "🏰", wilderness: "🌄", underdark: "🕸",
  custom: "✦",
};

const ENV_GRADIENTS: Record<string, string> = {
  dungeon: "from-amber-900/20 via-transparent",
  forest: "from-emerald-900/20 via-transparent",
  city: "from-amber-800/15 via-transparent",
  cave: "from-slate-900/20 via-transparent",
  swamp: "from-emerald-950/20 via-transparent",
  underdark: "from-indigo-950/20 via-transparent",
  planar: "from-purple-900/20 via-transparent",
  wilderness: "from-emerald-800/15 via-transparent",
};

export default function EncounterList({
  onSelectEncounter,
  onDeleteEncounter,
  onLaunchEncounter,
}: EncounterListProps) {
  const encounters = useCampaignStore((s) => s.encounters);
  const enemies = useCampaignStore((s) => s.enemies);
  const characters = useCampaignStore((s) => s.characters);

  const handleDelete = useCallback(
    (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      onDeleteEncounter(id);
    },
    [onDeleteEncounter]
  );

  const handleLaunch = useCallback(
    (e: React.MouseEvent, enc: Encounter) => {
      e.stopPropagation();
      onLaunchEncounter(enc);
    },
    [onLaunchEncounter]
  );

  if (encounters.length === 0) return null;

  // Auto-detect party for CR calculation
  const partySize = characters.length > 0 ? characters.length : 4;
  const avgLevel = characters.length > 0
    ? Math.round(characters.reduce((sum, c) => sum + c.level, 0) / characters.length)
    : 3;

  return (
    <div className="space-y-2.5">
      {encounters.map((enc) => {
        // Calculate encounter stats
        const enemyCrs: number[] = [];
        let totalEnemyCount = 0;

        enc.enemyGroups.forEach((group) => {
          const enemyDoc = enemies.find((e) => e.id === group.enemyId);
          const cr = enemyDoc ? parseCr(enemyDoc.challengeRating) : 0;
          for (let i = 0; i < group.count; i++) {
            enemyCrs.push(cr);
          }
          totalEnemyCount += group.count;
        });

        const difficulty = analyzeEncounterDifficulty(enemyCrs, { size: partySize, level: avgLevel });
        const envIcon = ENVIRONMENT_ICONS[enc.environment] || "⚔";
        const envGradient = ENV_GRADIENTS[enc.environment] || "from-gold-900/10";

        return (
          <div
            key={enc.id}
            onClick={() => onSelectEncounter(enc)}
            className={`group relative rounded-xl border border-white/[0.04] bg-gradient-to-br from-[#191b2b]/60 to-[#12131e]/75 p-3.5 cursor-pointer transition-all duration-200 hover:from-gold-500/[0.03] hover:to-transparent hover:border-gold-500/10 hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)] ${
              enc.isActive ? "ring-1 ring-gold/20 bg-gold-500/[0.02]" : ""
            }`}
          >
            {/* Ambient gradient by environment */}
            <div className={`absolute top-0 right-0 w-40 h-full rounded-r-xl bg-gradient-to-r ${envGradient} to-transparent opacity-40 pointer-events-none`} />

            {/* Top gold edge */}
            <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-gold-500/0 to-transparent group-hover:via-gold-500/10 transition-all duration-500" />

            <div className="relative z-10 flex items-start gap-3">
              {/* Environment icon */}
              <div className="shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-gold-500/8 to-amber-500/5 border border-gold-500/10 flex items-center justify-center text-base">
                {envIcon}
              </div>

              <div className="flex-1 min-w-0">
                {/* Title row */}
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-bold text-surface-200 truncate">{enc.name}</h3>

                  {/* Difficulty badge */}
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-semibold ${getDifficultyColor(difficulty.rating)}`}>
                    {getDifficultyLabel(difficulty.rating)}
                  </span>

                  {enc.isActive && (
                    <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/15 text-emerald-400 font-semibold">
                      ● Active
                    </span>
                  )}
                </div>

                {/* Description */}
                {enc.description && (
                  <p className="text-[11px] text-surface-500 mt-1 line-clamp-1">{enc.description}</p>
                )}

                {/* Stat chips */}
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  <StatChip label="Enemies" value={String(totalEnemyCount)} color="text-surface-400" />
                  <StatChip label="XP" value={String(difficulty.totalXp)} color="text-gold-400" />
                  <StatChip label="Adj. XP" value={String(difficulty.adjustedXp)} color="text-gold-300/60" />
                  {difficulty.crRange.min > 0 && (
                    <StatChip label="CR" value={`${difficulty.crRange.min}–${difficulty.crRange.max}`} color="text-rose-400" />
                  )}
                  <StatChip label="Updated" value={new Date(enc.updatedAt).toLocaleDateString()} color="text-surface-600" />
                </div>
              </div>

              {/* Actions — visible on hover */}
              <div className="shrink-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button
                  onClick={(e) => handleLaunch(e, enc)}
                  className="w-8 h-8 rounded-lg bg-emerald-500/8 border border-emerald-500/15 text-emerald-400 hover:bg-emerald-500/12 active:scale-90 transition-all flex items-center justify-center"
                  title="Launch encounter"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
                <button
                  onClick={(e) => handleDelete(e, enc.id)}
                  className="w-8 h-8 rounded-lg bg-rose-500/8 border border-rose-500/15 text-rose-400/70 hover:bg-rose-500/12 hover:text-rose-400 active:scale-90 transition-all flex items-center justify-center"
                  title="Delete encounter"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StatChip({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-[8px] uppercase tracking-wider text-surface-600">{label}</span>
      <span className={`text-[10px] font-semibold tabular-nums ${color}`}>{value}</span>
    </div>
  );
}
