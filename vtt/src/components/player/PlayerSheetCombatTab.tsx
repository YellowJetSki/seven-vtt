/**
 * STᚱ VTT — Player Sheet Combat Tab
 *
 * All combat-relevant stats, HP management, death saves, conditions, hit dice.
 * AC, Initiative, Speed are auto-calculated from abilities + equipment.
 * Shows passive Perception/Investigation.
 */

import { useCallback, useMemo } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import type { PlayerCharacter } from "@/types";
import { computeAllDerivations, getAbilityMod } from "@/lib/mechanics/character-derivations";
import PlayerSheetHpSection from "./PlayerSheetHpSection";
import PlayerSheetDeathSaves from "./PlayerSheetDeathSaves";
import PlayerSheetConditions from "./PlayerSheetConditions";
import PlayerSheetCombatStats from "./PlayerSheetCombatStats";

interface PlayerSheetCombatTabProps {
  character: PlayerCharacter;
}

export default function PlayerSheetCombatTab({ character }: PlayerSheetCombatTabProps) {
  const c = character;
  const updateCharacter = useCampaignStore((s) => s.updateCharacter);
  const derived = useMemo(() => computeAllDerivations(c), [c]);

  const handleTempHp = useCallback(
    (amount: number) => {
      updateCharacter(c.id, { temporaryHitPoints: Math.max(0, (c.temporaryHitPoints || 0) + amount) });
    },
    [c, updateCharacter]
  );

  // Passive Perception/Investigation
  const perceptionMod = derived.abilityMods.wisdom;
  const investigationMod = derived.abilityMods.intelligence;
  const passivePerception = 10 + perceptionMod + (c.skills?.perception === "proficient" ? derived.proficiencyBonus : c.skills?.perception === "expertise" ? derived.proficiencyBonus * 2 : 0);
  const passiveInvestigation = 10 + investigationMod + (c.skills?.investigation === "proficient" ? derived.proficiencyBonus : c.skills?.investigation === "expertise" ? derived.proficiencyBonus * 2 : 0);
  const passiveInsight = 10 + perceptionMod + (c.skills?.insight === "proficient" ? derived.proficiencyBonus : c.skills?.insight === "expertise" ? derived.proficiencyBonus * 2 : 0);

  return (
    <div className="space-y-4 px-3 py-3">
      {/* Auto-calculated AC, Init, Speed + PB */}
      <PlayerSheetCombatStats character={character} />

      {/* Passive Skills */}
      <div className="grid grid-cols-3 gap-1.5">
        <div className="flex flex-col items-center px-2 py-1.5 rounded-lg bg-obsidian-mid/40 border border-surface-700/10">
          <span className="text-[8px] uppercase tracking-widest text-gold-500/50">Passive Perception</span>
          <span className="text-base font-bold tabular-nums text-cyan-300">{passivePerception}</span>
        </div>
        <div className="flex flex-col items-center px-2 py-1.5 rounded-lg bg-obsidian-mid/40 border border-surface-700/10">
          <span className="text-[8px] uppercase tracking-widest text-gold-500/50">Passive Investigation</span>
          <span className="text-base font-bold tabular-nums text-mage-300">{passiveInvestigation}</span>
        </div>
        <div className="flex flex-col items-center px-2 py-1.5 rounded-lg bg-obsidian-mid/40 border border-surface-700/10">
          <span className="text-[8px] uppercase tracking-widest text-gold-500/50">Passive Insight</span>
          <span className="text-base font-bold tabular-nums text-gold-300">{passiveInsight}</span>
        </div>
      </div>

      {/* HP Management */}
      <PlayerSheetHpSection character={character} />

      {/* Temp HP */}
      <div className="rounded-xl bg-obsidian-mid/40 border border-surface-700/20 p-3 hover:border-gold/10 transition-all duration-200">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-widest font-black text-gold-500/60">Temp HP</span>
          <div className="flex items-center gap-2">
            <button onClick={() => handleTempHp(-5)}
              className="px-3 py-1.5 rounded-lg bg-obsidian-mid/60 border border-surface-700/20 text-surface-400 text-sm active:scale-95 transition-all duration-150 hover:border-gold/20 hover:text-gold-300">
              -5
            </button>
            <span className="text-sm font-mono font-bold text-gold-400 w-8 text-center tabular-nums">{c.temporaryHitPoints || 0}</span>
            <button onClick={() => handleTempHp(5)}
              className="px-3 py-1.5 rounded-lg bg-gold-500/10 border border-gold/15 text-gold-400 text-sm active:scale-95 transition-all duration-150 hover:bg-gold-500/15">
              +5
            </button>
          </div>
        </div>
      </div>

      {/* Death Saves */}
      <PlayerSheetDeathSaves character={character} />

      {/* Conditions */}
      <PlayerSheetConditions character={character} />

      {/* Hit Dice */}
      <div className="flex items-center justify-between rounded-xl bg-obsidian-mid/40 border border-surface-700/20 p-3 hover:border-gold/10 transition-all duration-200">
        <span className="text-[10px] uppercase tracking-widest font-black text-gold-500/60">Hit Dice</span>
        <span className="text-sm font-mono font-bold tabular-nums text-gold-300">{c.hitDice}</span>
      </div>
    </div>
  );
}
