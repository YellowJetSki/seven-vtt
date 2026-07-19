import { useMemo } from "react";
import type { PlayerCharacter } from "@/types";
import { computeArmorClass, computeInitiative, computeAllDerivations } from "@/lib/mechanics/character-derivations";

function modStr(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

interface PlayerSheetCombatStatsProps {
  character: PlayerCharacter;
}

export default function PlayerSheetCombatStats({ character }: PlayerSheetCombatStatsProps) {
  const derived = useMemo(() => computeAllDerivations(character), [character]);

  return (
    <div>
      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col items-center bg-obsidian-mid/40 rounded-xl border border-surface-700/20 py-3 hover:border-gold/10 transition-all duration-200">
          <span className="text-[9px] uppercase tracking-widest font-black text-gold-500/60">AC</span>
          <span className="text-2xl font-bold tabular-nums mt-0.5 text-gold-200 drop-shadow-[0_0_4px_rgba(234,179,8,0.06)]">
            {derived.ac}
          </span>
          <span className="text-[8px] text-surface-600 mt-0.5">
            (computed from armor & DEX)
          </span>
        </div>
        <div className="flex flex-col items-center bg-obsidian-mid/40 rounded-xl border border-surface-700/20 py-3 hover:border-gold/10 transition-all duration-200">
          <span className="text-[9px] uppercase tracking-widest font-black text-gold-500/60">Init</span>
          <span className="text-2xl font-bold tabular-nums mt-0.5 text-gold-200 drop-shadow-[0_0_4px_rgba(234,179,8,0.06)]">
            {modStr(derived.initiative)}
          </span>
          <span className="text-[8px] text-surface-600 mt-0.5">
            (DEX {modStr(derived.abilityMods.dexterity)})
          </span>
        </div>
        <div className="flex flex-col items-center bg-obsidian-mid/40 rounded-xl border border-surface-700/20 py-3 hover:border-gold/10 transition-all duration-200">
          <span className="text-[9px] uppercase tracking-widest font-black text-gold-500/60">Speed</span>
          <span className="text-2xl font-bold tabular-nums mt-0.5 text-gold-200 drop-shadow-[0_0_4px_rgba(234,179,8,0.06)]">
            {derived.speed.walk}
          </span>
          <span className="text-[8px] text-surface-600 mt-0.5">
            {derived.encumbrance.speedReduction !== 0
              ? `${derived.speed.walk - derived.encumbrance.speedReduction}ft (reduced)`
              : "walk"}
          </span>
        </div>
      </div>

      {/* Proficiency Bonus display */}
      <div className="flex items-center justify-between mt-2 px-3 py-2 rounded-lg bg-obsidian-mid/40 border border-surface-700/10">
        <span className="text-[10px] uppercase tracking-widest text-gold-500/60 font-black">Proficiency Bonus</span>
        <span className="text-sm font-bold font-mono text-gold-300">+{derived.proficiencyBonus}</span>
      </div>
    </div>
  );
}
