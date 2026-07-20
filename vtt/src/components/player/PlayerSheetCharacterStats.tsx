/**
 * STᚱ VTT — Player Sheet Character Stats (Premium Orchestrator)
 *
 * Premium unified stats management panel lining inside the Combat Tab:
 * - CharacterStatsPanel → Core derived stats with staggered entrance
 * - HitDiceTracker → Visual HD management (spend/recover) in glass card
 * - SpeedConfigurator → Movement speed display in glass card
 *
 * All wrapped in the unified glass gradient design system.
 */

import { useCallback } from "react";
import type { PlayerCharacter } from "@/types";
import { useCampaignStore } from "@/stores/campaignStore";
import CharacterStatsPanel from "./CharacterStatsPanel";
import HitDiceTracker from "./HitDiceTracker";
import SpeedConfigurator from "./SpeedConfigurator";
import { getAbilityMod } from "@/lib/mechanics/character-derivations";

interface PlayerSheetCharacterStatsProps {
  character: PlayerCharacter;
}

export default function PlayerSheetCharacterStats({
  character,
}: PlayerSheetCharacterStatsProps) {
  const updateCharacter = useCampaignStore((s) => s.updateCharacter);

  const handleSpendHitDie = useCallback(
    (count: number) => {
      updateCharacter(character.id, {
        hitPoints: {
          ...character.hitPoints,
          current: Math.min(
            character.hitPoints.current + (count * 1),
            character.hitPoints.max
          ),
        },
      });
    },
    [character, updateCharacter]
  );

  const handleRecoverHitDie = useCallback(
    (count: number) => {
      updateCharacter(character.id, {
        hitPoints: { ...character.hitPoints },
      });
    },
    [character, updateCharacter]
  );

  return (
    <div className="space-y-4">
      {/* Section label with gradient divider */}
      <div className="flex items-center gap-2">
        <span className="text-[9px] font-bold uppercase tracking-wider text-white/50">
          Character Stats
        </span>
        <div className="h-px flex-1 bg-gradient-to-r from-white/[0.04] to-transparent" />
        <span className="text-[8px] text-surface-600 font-mono">
          Lv.{character.level}
        </span>
      </div>

      {/* Core Stat Cards */}
      <CharacterStatsPanel character={character} />

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" />

      {/* Hit Dice in glass card */}
      <div className="relative rounded-xl bg-gradient-to-b from-[#14151f]/90 to-[#0f1019]/95 border border-white/[0.04] p-3 overflow-hidden group hover:border-white/[0.07] transition-all duration-200"
        style={{ animation: "slide-in-up 0.3s ease-out 0.35s both" }}>
        <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-gold-500/20 to-transparent" />
        <HitDiceTracker
          hitDie={character.hitDice || "1d8"}
          total={character.level}
          spent={0}
          onSpend={handleSpendHitDie}
          onRecover={handleRecoverHitDie}
        />
      </div>

      {/* Speed in glass card */}
      <div className="relative rounded-xl bg-gradient-to-b from-[#14151f]/90 to-[#0f1019]/95 border border-white/[0.04] p-3 overflow-hidden group hover:border-white/[0.07] transition-all duration-200"
        style={{ animation: "slide-in-up 0.3s ease-out 0.4s both" }}>
        <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-gold-500/20 to-transparent" />
        <SpeedConfigurator
          speeds={character.speed}
          encumbrancePenalty={0}
        />
      </div>
    </div>
  );
}
