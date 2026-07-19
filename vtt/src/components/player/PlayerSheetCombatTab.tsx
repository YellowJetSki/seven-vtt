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

      {/* Temp HP */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-widest font-black text-mage-400">Temp HP</span>
        <div className="flex items-center gap-2">
          <button onClick={() => handleTempHp(-5)}
            className="px-3 py-1.5 rounded-lg bg-surface-800/40 border border-surface-700/20 text-surface-400 text-sm active:scale-95 transition-transform">
            -5
          </button>
          <span className="text-sm font-mono font-bold text-mage-400 w-8 text-center tabular-nums">{c.temporaryHitPoints || 0}</span>
          <button onClick={() => handleTempHp(5)}
            className="px-3 py-1.5 rounded-lg bg-mage-500/15 border border-mage-500/20 text-mage-400 text-sm active:scale-95 transition-transform">
            +5
          </button>
        </div>
      </div>

      <PlayerSheetDeathSaves character={character} />
      <PlayerSheetCombatStats character={character} />
      <PlayerSheetConditions character={character} />

      {/* Hit Dice */}
      <div className="flex items-center justify-between rounded-xl bg-surface-800/30 border border-surface-700/20 p-3">
        <span className="text-[10px] uppercase tracking-widest font-black text-surface-400">Hit Dice</span>
        <span className="text-sm font-mono font-bold tabular-nums text-surface-200">{c.hitDice}</span>
      </div>
    </div>
  );
}
