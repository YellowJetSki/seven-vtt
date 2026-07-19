/**
 * STᚱ VTT — Player Card (Compact)
 *
 * Mobile-first compact player character card for the player list.
 * Composed of PlayerCardAvatar, PlayerCardHpBar, PlayerCardQuickActions,
 * and PlayerCardConditions sub-components.
 *
 * Large touch target with key stats visible at a glance.
 * Tapping opens the full PlayerSheet modal.
 */

import { useCallback } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import PlayerCardAvatar from "./PlayerCardAvatar";
import PlayerCardHpBar from "./PlayerCardHpBar";
import PlayerCardQuickActions from "./PlayerCardQuickActions";
import PlayerCardConditions from "./PlayerCardConditions";
import type { PlayerCharacter } from "@/types";

interface PlayerCardCompactProps {
  character: PlayerCharacter;
  onOpen: (character: PlayerCharacter) => void;
}

export default function PlayerCardCompact({
  character: c,
  onOpen,
}: PlayerCardCompactProps) {
  const updateCharacter = useCampaignStore((s) => s.updateCharacter);

  const handleHpQuick = useCallback(
    (delta: number, e: React.MouseEvent) => {
      e.stopPropagation();
      const newHp = Math.max(
        0,
        Math.min(c.hitPoints.max, c.hitPoints.current + delta)
      );
      updateCharacter(c.id, {
        hitPoints: { ...c.hitPoints, current: newHp },
      });
    },
    [c, updateCharacter]
  );

  return (
    <div
      onClick={() => onOpen(c)}
      className="premium-surface rounded-xl p-3 cursor-pointer active:scale-[0.98] transition-transform touch-manipulation"
    >
      <PlayerCardAvatar character={c} />

      <div className="flex items-center gap-3 mb-2.5">
        <PlayerCardHpBar character={c} />
      </div>

      <PlayerCardQuickActions character={c} onHpQuick={handleHpQuick} />
      <PlayerCardConditions character={c} />
    </div>
  );
}
