/**
 * STᚱ VTT — Player Sheet Saving Throws (Enhanced)
 *
 * Interactive saving throws with:
 * - Click-to-toggle proficiency for each save
 * - Modifier breakdown (ability + proficiency bonus)
 * - Color-coded values
 * - Visual indicator of which mod is from ability vs PB
 */

import { useMemo, useCallback } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import type { PlayerCharacter } from "@/types";
import { getAbilityMod, getProficiencyBonus } from "@/lib/mechanics/character-derivations";

function modStr(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

interface PlayerSheetSavingThrowsProps {
  character: PlayerCharacter;
}

export default function PlayerSheetSavingThrows({ character }: PlayerSheetSavingThrowsProps) {
  const c = character;
  const updateCharacter = useCampaignStore((s) => s.updateCharacter);
  const pb = useMemo(() => getProficiencyBonus(c.level), [c.level]);

  const handleToggleSave = useCallback(
    (saveKey: string) => {
      const current = c.savingThrows[saveKey];
      const nextProf = !current?.proficient;
      updateCharacter(c.id, {
        savingThrows: {
          ...c.savingThrows,
          [saveKey]: { proficient: nextProf, bonus: current?.bonus || 0 },
        },
      });
    },
    [c, updateCharacter]
  );

  const saveData = useMemo(() =>
    ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"].map((s) => {
      const save = c.savingThrows[s];
      const mod = getAbilityMod((c as any)[s] as number);
      const isProf = save?.proficient || false;
      const pbBonus = isProf ? pb : 0;
      const bonus = save?.bonus || 0;
      const total = mod + pbBonus + bonus;
      return { key: s, mod, isProf, pbBonus, bonus, total };
    }),
    [c, pb]
  );

  const proficientCount = saveData.filter((s) => s.isProf).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] uppercase tracking-widest font-black text-gold-500/60">Saving Throws</span>
        <span className="text-[9px] text-surface-500 font-mono tabular-nums">
          {proficientCount}/6 proficient
        </span>
      </div>
      <div className="space-y-1">
        {saveData.map(({ key, mod, isProf, pbBonus, bonus, total }) => (
          <div
            key={key}
            className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-obsidian-mid/40 border border-surface-700/10 hover:border-gold/10 transition-all duration-200 group cursor-pointer"
            onClick={() => handleToggleSave(key)}
          >
            {/* Left: Dot + name */}
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <button
                onClick={(e) => { e.stopPropagation(); handleToggleSave(key); }}
                className={`shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-bold transition-all duration-200 ${
                  isProf
                    ? "bg-gold-500/20 border border-gold-500/40 text-gold-400 shadow-[0_0_4px_rgba(234,179,8,0.1)]"
                    : "bg-transparent border border-surface-600/20 text-surface-600 group-hover:border-gold/30"
                }`}
                title={isProf ? "Proficient (click to remove)" : "Not proficient (click to add)"}
              >
                {isProf ? "●" : ""}
              </button>
              <span className="text-xs text-surface-300 capitalize">{key}</span>
              {isProf && (
                <span className="text-[7px] uppercase tracking-widest text-gold-500/50 font-semibold border border-gold/10 rounded px-1">Prof</span>
              )}
            </div>

            {/* Right: Breakdown + Total */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Breakdown */}
              {pbBonus > 0 && (
                <div className="hidden sm:flex items-center gap-1 text-[8px] font-mono tabular-nums">
                  <span className={mod > 0 ? "text-green-400/70" : mod < 0 ? "text-red-400/70" : "text-surface-500"}>
                    {modStr(mod)}
                  </span>
                  {pbBonus > 0 && (
                    <>
                      <span className="text-surface-600">+</span>
                      <span className="text-gold-500/60">PB</span>
                    </>
                  )}
                  {bonus > 0 && (
                    <>
                      <span className="text-surface-600">+</span>
                      <span className="text-cyan-400/60">{bonus}</span>
                    </>
                  )}
                  <span className="text-surface-600">=</span>
                </div>
              )}
              {/* Total */}
              <span className={`text-xs font-mono font-bold tabular-nums ${
                total > 0 ? "text-gold-300" : total < 0 ? "text-red-300" : "text-surface-400"
              } w-7 text-right`}>
                {modStr(total)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
