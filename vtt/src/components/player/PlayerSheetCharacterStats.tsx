/**
 * STᚱ VTT — Player Sheet Character Stats Sub-Component
 *
 * Dedicated stats management panel showing Proficiency Bonus,
 * Initiative, Armor Class, Speed, Hit Dice, and Passive Senses.
 *
 * This component replaces scattered stat displays with one
 * unified, premium visual panel that lives inside the Combat Tab.
 *
 * Wires together:
 * - CharacterStatsPanel    → Core derived stats overview
 * - HitDiceTracker         → Visual HD management (spend/recover)
 * - SpeedConfigurator       → Movement speed display
 *
 * Usage:
 *   <PlayerSheetCharacterStats character={character} />
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

  // Hit dice spend/recover handlers
  const handleSpendHitDie = useCallback(
    (count: number) => {
      // In a real implementation, this would restore HP based on the roll
      // and decrement available HD. For now we track via character notes.
      updateCharacter(character.id, {
        hitPoints: {
          ...character.hitPoints,
          // Example: heal minimum possible HD value
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
        hitPoints: {
          ...character.hitPoints,
        },
      });
    },
    [character, updateCharacter]
  );

  const conMod = getAbilityMod(character.constitution);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[9px] font-bold uppercase tracking-wider text-white/50">
          Character Stats
        </span>
        <div className="h-px flex-1 bg-gradient-to-r from-white/[0.04] to-transparent" />
        <span className="text-[8px] text-surface-600 font-mono">
          Lv.{character.level}
        </span>
      </div>

      {/* Core Stat Cards (PB, Init, AC, HP) */}
      <CharacterStatsPanel character={character} />

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" />

      {/* Hit Dice */}
      <div className="bg-gradient-to-br from-[#14151f]/60 to-[#0c0d15]/80 border border-white/[0.04] rounded-xl p-3">
        <HitDiceTracker
          hitDie={character.hitDice || "1d8"}
          total={character.level}
          spent={0}
          onSpend={handleSpendHitDie}
          onRecover={handleRecoverHitDie}
        />
      </div>

      {/* Speed */}
      <div className="bg-gradient-to-br from-[#14151f]/60 to-[#0c0d15]/80 border border-white/[0.04] rounded-xl p-3">
        <SpeedConfigurator
          speeds={character.speed}
          encumbrancePenalty={0}
        />
      </div>
    </div>
  );
}
