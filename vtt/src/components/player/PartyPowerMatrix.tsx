/**
 * STᚱ VTT — Party Power Matrix (Ventriloc-Grade Data Visualization)
 *
 * Compact, at-a-glance tactical overview of the entire party.
 * Shows key stats across all characters in a single scrollable matrix.
 *
 * Premium features:
 * - Glass gradient surface with edge light
 * - Color-coded stat columns (AC=cyan, HP=green, Init=gold, PB=amber)
 * - Role detection badges with per-type colors
 * - Footer stats with tabular-nums values
 * - Hover row highlight with gold accent
 * - Responsive horizontal scroll with gold scrollbar
 *
 * DM value: Instant cognitive relief during encounter building.
 * See party AC/HP/Init without opening individual sheets.
 */

import { useMemo } from "react";
import type { PlayerCharacter } from "@/types";

interface PartyPowerMatrixProps {
  characters: PlayerCharacter[];
}

function getAbilityMod(score: number): string {
  const mod = Math.floor((score - 10) / 2);
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

export default function PartyPowerMatrix({ characters }: PartyPowerMatrixProps) {
  const stats = useMemo(() => {
    if (characters.length === 0) return null;

    const totalHp = characters.reduce((sum, c) => sum + c.hitPoints.max, 0);
    const avgLevel = characters.reduce((sum, c) => sum + c.level, 0) / characters.length;
    const highestAc = Math.max(...characters.map((c) => c.armorClass));
    const avgAc = characters.reduce((sum, c) => sum + c.armorClass, 0) / characters.length;
    const totalLevels = characters.reduce((sum, c) => sum + c.level, 0);

    // Roles detection
    const roles = {
      frontline: characters.filter((c) => {
        const ac = c.armorClass;
        const hp = c.hitPoints.max;
        return ac >= 16 || hp >= 50 || ["Barbarian", "Fighter", "Paladin"].includes(c.class);
      }).length,
      healer: characters.filter((c) => ["Cleric", "Druid", "Paladin", "Bard"].includes(c.class)).length,
      arcane: characters.filter((c) => ["Wizard", "Sorcerer", "Warlock", "Artificer"].includes(c.class)).length,
      skill: characters.filter((c) => ["Rogue", "Bard", "Ranger"].includes(c.class)).length,
    };

    return { totalHp, avgLevel, highestAc, avgAc, totalLevels, roles };
  }, [characters]);

  if (characters.length === 0) return null;

  return (
    <div className="relative bg-gradient-to-b from-[#141520] to-[#0f1019] border border-white/[0.04] rounded-xl overflow-hidden">
      {/* Top edge light */}
      <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-gold-500/20 to-transparent" />

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.04]">
        <div className="flex items-center gap-2">
          <span className="text-[12px]">📊</span>
          <h3 className="text-[11px] font-bold text-white/70 tracking-tight">
            Party Power Matrix
          </h3>
        </div>
        <span className="text-[8px] text-surface-500 tabular-nums">
          {characters.length} character{characters.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Scrollable table */}
      <div className="overflow-x-auto scrollbar-gold">
        <table className="w-full text-[10px]">
          <thead>
            <tr className="text-[8px] uppercase tracking-widest text-surface-600 border-b border-white/[0.03]">
              <th className="text-left px-3 py-2 font-black">Name</th>
              <th className="text-left px-2 py-2 font-black">Race</th>
              <th className="text-left px-2 py-2 font-black">Class</th>
              <th className="text-center px-2 py-2 font-black w-8">Lv</th>
              <th className="text-center px-2 py-2 font-black w-9">AC</th>
              <th className="text-center px-2 py-2 font-black w-10">HP</th>
              <th className="text-center px-2 py-2 font-black w-8">Init</th>
              <th className="text-center px-2 py-2 font-black w-7">PB</th>
              <th className="text-center px-2 py-2 font-black w-10">Speed</th>
              <th className="text-center px-2 py-2 font-black w-14">Passive</th>
            </tr>
          </thead>
          <tbody>
            {characters.map((c) => {
              const initMod = getAbilityMod(c.dexterity);
              const passivePerception = 10 + Math.floor((c.wisdom - 10) / 2) +
                (c.skills?.perception === "proficient" ? c.proficiencyBonus : 0);
              const pb = c.proficiencyBonus || Math.ceil(c.level / 4) + 1;

              return (
                <tr
                  key={c.id}
                  className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-3 py-2 font-semibold text-surface-200 truncate max-w-[100px]">
                    {c.name}
                  </td>
                  <td className="px-2 py-2 text-surface-400 truncate max-w-[70px]">{c.race}</td>
                  <td className="px-2 py-2">
                    <span className="text-[9px] text-gold-400/80">{c.class}</span>
                  </td>
                  <td className="px-2 py-2 text-center tabular-nums text-surface-200">{c.level}</td>
                  <td className="px-2 py-2 text-center">
                    <span className="font-bold text-cyan-300 tabular-nums">{c.armorClass}</span>
                  </td>
                  <td className="px-2 py-2 text-center tabular-nums">
                    <span className="font-bold text-emerald-400">{c.hitPoints.max}</span>
                  </td>
                  <td className="px-2 py-2 text-center tabular-nums text-gold-400">{initMod}</td>
                  <td className="px-2 py-2 text-center tabular-nums text-amber-400">{pb}</td>
                  <td className="px-2 py-2 text-center text-surface-400">{c.speed.walk}ft</td>
                  <td className="px-2 py-2 text-center tabular-nums text-surface-400">
                    {passivePerception}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer stats */}
      {stats && (
        <div className="border-t border-white/[0.03] px-4 py-2.5">
          <div className="flex items-center gap-4 flex-wrap">
            <StatPill label="Avg Level" value={stats.avgLevel.toFixed(1)} color="text-gold-300" />
            <StatPill label="Total HP" value={String(stats.totalHp)} color="text-emerald-400" />
            <StatPill label="Highest AC" value={String(stats.highestAc)} color="text-cyan-300" />
            <StatPill label="Avg AC" value={stats.avgAc.toFixed(1)} color="text-cyan-300/60" />
            <StatPill label="Total Levels" value={String(stats.totalLevels)} color="text-surface-300" />

            {/* Role badges */}
            {stats.roles.frontline > 0 && (
              <span className="inline-flex items-center gap-1 text-[8px] px-1.5 py-0.5 rounded bg-rose-500/8 border border-rose-500/10 text-rose-400">
                {stats.roles.frontline} Frontline
              </span>
            )}
            {stats.roles.healer > 0 && (
              <span className="inline-flex items-center gap-1 text-[8px] px-1.5 py-0.5 rounded bg-emerald-500/8 border border-emerald-500/10 text-emerald-400">
                {stats.roles.healer} Healer
              </span>
            )}
            {stats.roles.arcane > 0 && (
              <span className="inline-flex items-center gap-1 text-[8px] px-1.5 py-0.5 rounded bg-violet-500/8 border border-violet-500/10 text-violet-400">
                {stats.roles.arcane} Arcane
              </span>
            )}
            {stats.roles.skill > 0 && (
              <span className="inline-flex items-center gap-1 text-[8px] px-1.5 py-0.5 rounded bg-amber-500/8 border border-amber-500/10 text-amber-400">
                {stats.roles.skill} Skill
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatPill({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-[8px] uppercase tracking-wider text-surface-600">{label}</span>
      <span className={`text-[11px] font-bold tabular-nums ${color}`}>{value}</span>
    </div>
  );
}
