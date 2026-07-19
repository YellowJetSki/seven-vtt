/**
 * STᚱ VTT — Player Card (Lusion-Grade Premium)
 *
 * A deeply layered, tactile character token card.
 * Features:
 * - Multi-layer depth with floating gold edge glow
 * - Large touch target with active press feedback
 * - At-a-glance HP, AC, Initiative, Conditions
 * - Smooth hover elevation and edge lighting
 * - Feels like a physical game token
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
      className="group relative bg-gradient-to-b from-[#191b2b]/70 to-[#12131e]/85 rounded-xl border border-white/[0.04] p-3.5 sm:p-4 cursor-pointer active:scale-[0.97] transition-all duration-200 touch-manipulation shadow-[0_4px_20px_rgba(0,0,0,0.25)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.35),0_0_30px_rgba(234,179,8,0.03)] hover:border-gold-500/12 hover:-translate-y-0.5"
    >
      {/* Top gold edge line — illuminates on hover */}
      <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-gold-500/0 to-transparent group-hover:via-gold-500/15 transition-all duration-500" />

      {/* Hover glow directional sweep */}
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-gold-500/5 via-transparent to-amber-500/2" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <PlayerCardAvatar character={c} />

        <div className="flex items-center gap-3 mb-2.5">
          <PlayerCardHpBar character={c} />
        </div>

        <PlayerCardQuickActions character={c} onHpQuick={handleHpQuick} />
        <PlayerCardConditions character={c} />
      </div>
    </div>
  );
}
