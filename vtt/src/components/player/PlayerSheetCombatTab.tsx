import { useCallback } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import type { PlayerCharacter } from "@/types";
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

  const handleTempHp = useCallback(
    (amount: number) => {
      updateCharacter(c.id, { temporaryHitPoints: Math.max(0, (c.temporaryHitPoints || 0) + amount) });
    },
    [c, updateCharacter]
  );

  return (
    <div className="space-y-4 px-3 py-3">
      <PlayerSheetHpSection character={character} />

      {/* Temp HP — gold accent */}
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

      <PlayerSheetDeathSaves character={character} />
      <PlayerSheetCombatStats character={character} />
      <PlayerSheetConditions character={character} />

      {/* Hit Dice — gold card */}
      <div className="flex items-center justify-between rounded-xl bg-obsidian-mid/40 border border-surface-700/20 p-3 hover:border-gold/10 transition-all duration-200">
        <span className="text-[10px] uppercase tracking-widest font-black text-gold-500/60">Hit Dice</span>
        <span className="text-sm font-mono font-bold tabular-nums text-gold-300">{c.hitDice}</span>
      </div>
    </div>
  );
}
