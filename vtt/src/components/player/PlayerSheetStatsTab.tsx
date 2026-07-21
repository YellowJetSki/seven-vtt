/**
 * STᚱ VTT — Player Sheet Stats Tab (Enhanced)
 *
 * Character stats hub showing:
 * - Inspiration toggle (active → gold glow)
 * - XP summary with level progression
 * - Proficiency bonus
 * - Ability scores with mod display (click to view breakdown)
 * - Saving throws (interactive toggle proficiency)
 * - Skills & Proficiencies hub with search, filter, toggle proficiency
 * - Traits & Features collapsible section
 *
 * All mutations → Zustand + Firestore via centralized hooks.
 */

import { useMemo, useState } from "react";
import type { PlayerCharacter } from "@/types";
import { getProficiencyBonus } from "@/lib/mechanics/character-derivations";
import { useInspirationMutation } from "@/hooks/useCharacterMutations";
// Stats display utilities
import PlayerSheetAbilityScores from "./PlayerSheetAbilityScores";
import PlayerSheetSavingThrows from "./PlayerSheetSavingThrows";
import PlayerSheetSkills from "./PlayerSheetSkills";

interface PlayerSheetStatsTabProps {
  character: PlayerCharacter;
}

export default function PlayerSheetStatsTab({ character }: PlayerSheetStatsTabProps) {
  const c = character;
  const pb = useMemo(() => getProficiencyBonus(c.level), [c.level]);
  const [showTraits, setShowTraits] = useState(false);

  const { handleToggleInspiration } = useInspirationMutation();

  // ── Total items for traits section ──
  const traitCount = c.traits.length + c.features.length + c.languages.length + c.proficiencies.length;

  // ── XP to next level ──
  const xpForNextLevel = c.level < 20 ? c.level * 1000 : null;
  const xpProgress = xpForNextLevel ? Math.min(100, (c.experiencePoints / xpForNextLevel) * 100) : 100;

  // ── Determine bonuses display ──
  const abilityKeys = ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"] as const;
  const abilityTotalMod = abilityKeys.reduce((sum, k) => {
    const raw = (c as unknown as Record<string, number>)[k] ?? 10;
    return sum + Math.floor((raw - 10) / 2);
  }, 0);

  return (
    <div className="space-y-4 px-3 py-3">
      {/* ── INSPIRATION TOGGLE ── */}
      <button
        onClick={() => handleToggleInspiration(c)}
        className={`w-full py-4 rounded-xl text-center text-xs font-semibold border active:scale-[0.98] transition-all duration-200 ${
          c.inspiration
            ? "bg-gold-500/12 border-gold/25 text-gold-400 shadow-[0_0_12px_rgba(234,179,8,0.08)]"
            : "bg-obsidian-mid/40 border-surface-700/20 text-surface-500 hover:border-gold/15 hover:text-gold-500/50"
        }`}
      >
        {c.inspiration ? (
          <span className="flex items-center justify-center gap-2">
            <span className="text-lg">✦</span>
            <span>Inspiration Active</span>
            <span className="text-[8px] text-gold-500/40 uppercase tracking-widest">(tap to clear)</span>
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <span className="text-lg opacity-40">✦</span>
            <span className="text-surface-500">No Inspiration</span>
            <span className="text-[8px] text-surface-600 uppercase tracking-widest">(tap to gain)</span>
          </span>
        )}
      </button>

      {/* ── XP + LEVEL ROW ── */}
      <div className="rounded-xl bg-obsidian-mid/30 border border-surface-700/15 p-3">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest font-black text-amber-500/60">Experience Points</span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-surface-700/40 text-surface-300 border border-surface-600/20">
              Lv.{c.level}
            </span>
          </div>
          <span className="text-sm font-mono font-bold text-amber-300 tabular-nums">
            {c.experiencePoints.toLocaleString()} <span className="text-[10px] text-amber-500/50">XP</span>
          </span>
        </div>

        {/* XP Progress bar */}
        {c.level < 20 && xpForNextLevel && (
          <div className="h-2 bg-surface-700/50 rounded-full overflow-hidden shadow-inner mb-1">
            <div
              className="h-full bg-gradient-to-r from-amber-500/40 to-amber-400 rounded-full transition-all duration-500"
              style={{ width: `${xpProgress}%` }}
            />
          </div>
        )}

        <div className="flex items-center justify-between">
          {c.level < 20 && xpForNextLevel ? (
            <>
              <span className="text-[9px] text-surface-500">
                {Math.max(0, xpForNextLevel - c.experiencePoints).toLocaleString()} XP to next level
              </span>
              <span className="text-[9px] text-surface-500 font-mono">
                {Math.round(xpProgress)}%
              </span>
            </>
          ) : (
            <span className="text-[9px] text-gold-400 font-semibold">✦ MAX LEVEL — Level 20</span>
          )}
        </div>
      </div>

      {/* ── PROFICIENCY BONUS + ABILITY TOTAL ── */}
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col items-center justify-center px-3 py-2.5 rounded-xl bg-obsidian-mid/40 border border-surface-700/10">
          <span className="text-[8px] uppercase tracking-widest text-gold-500/50 font-black">Proficiency</span>
          <span className="text-xl font-black font-mono text-gold-300 tabular-nums mt-0.5">+{pb}</span>
        </div>
        <div className="flex flex-col items-center justify-center px-3 py-2.5 rounded-xl bg-obsidian-mid/40 border border-surface-700/10">
          <span className="text-[8px] uppercase tracking-widest text-gold-500/50 font-black">Ability Total</span>
          <span className={`text-xl font-black font-mono tabular-nums mt-0.5 ${
            abilityTotalMod > 0 ? "text-green-400" : abilityTotalMod < 0 ? "text-red-400" : "text-gold-300"
          }`}>
            {abilityTotalMod >= 0 ? "+" : ""}{abilityTotalMod}
          </span>
        </div>
      </div>

      {/* ── ABILITY SCORES ── */}
      <PlayerSheetAbilityScores character={character} />

      {/* ── SAVING THROWS ── */}
      <PlayerSheetSavingThrows character={character} />

      {/* ── SKILLS ── */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] uppercase tracking-widest font-black text-gold-500/60">Skills</span>
        </div>
        <PlayerSheetSkills character={character} />
      </div>

      {/* ── TRAITS, FEATURES & PROFICIENCIES ── */}
      <div className="rounded-xl bg-obsidian-mid/40 border border-surface-700/20 overflow-hidden">
        <button
          onClick={() => setShowTraits(!showTraits)}
          className="w-full flex items-center justify-between px-3 py-2.5"
        >
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest font-black text-gold-500/60">
              Features & Proficiencies
            </span>
            {traitCount > 0 && (
              <span className="text-[9px] text-surface-500 font-mono">({traitCount})</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-gold-500/40 transform transition-transform duration-200 ${showTraits ? "rotate-180" : ""}`}>▼</span>
          </div>
        </button>

        {showTraits && (
          <div className="px-3 pb-3 space-y-3 animate-slide-in-up">
            {/* Languages */}
            {c.languages.length > 0 && (
              <div>
                <span className="text-[9px] uppercase tracking-widest text-gold-500/50 font-semibold block mb-1 flex items-center gap-1">
                  <span>🗣️</span> Languages
                </span>
                <div className="flex flex-wrap gap-1">
                  {c.languages.map((lang) => (
                    <span key={lang} className="px-2 py-0.5 rounded text-[10px] bg-gold-500/8 text-gold-400 border border-gold/15">
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Racial Traits */}
            {c.traits.length > 0 && (
              <div>
                <span className="text-[9px] uppercase tracking-widest text-gold-500/50 font-semibold block mb-1 flex items-center gap-1">
                  <span>🧬</span> Racial Traits
                </span>
                <div className="flex flex-wrap gap-1">
                  {c.traits.map((trait) => (
                    <span key={typeof trait === "string" ? trait : trait.name} className="px-2 py-0.5 rounded text-[10px] bg-surface-700/30 text-surface-300 border border-surface-600/30">
                      {typeof trait === "string" ? trait : trait.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Class Features */}
            {c.features.length > 0 && (
              <div>
                <span className="text-[9px] uppercase tracking-widest text-gold-500/50 font-semibold block mb-1 flex items-center gap-1">
                  <span>⚔️</span> Class Features
                </span>
                <div className="space-y-1">
                  {c.features.map((feat) => (
                    <div key={typeof feat === "string" ? feat : feat.name} className="flex items-center gap-2 px-2 py-1.5 rounded bg-surface-700/20 border border-surface-600/15">
                      <span className="text-[10px] font-medium text-surface-200">
                        {typeof feat === "string" ? feat : feat.name}
                      </span>
                      {typeof feat !== "string" && feat.description && (
                        <span className="text-[9px] text-surface-500 truncate flex-1">{feat.description}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Proficiencies */}
            {c.proficiencies.length > 0 && (
              <div>
                <span className="text-[9px] uppercase tracking-widest text-gold-500/50 font-semibold block mb-1 flex items-center gap-1">
                  <span>🛠️</span> Proficiencies
                </span>
                <div className="flex flex-wrap gap-1">
                  {c.proficiencies.map((prof) => (
                    <span key={typeof prof === "string" ? prof : prof.name} className="px-2 py-0.5 rounded text-[10px] bg-surface-700/30 text-surface-300 border border-surface-600/30">
                      {typeof prof === "string" ? prof : prof.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
