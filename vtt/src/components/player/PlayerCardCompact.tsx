/**
 * ST R VTT - Player Card (DM Management Hub)
 *
 * A deeply layered, tactile character token card with DM management options.
 * Features:
 * - Multi-layer depth with floating gold edge glow
 * - Manage button (⚙) to edit/duplicate/delete/level up
 * - Large touch target with active press feedback
 * - At-a-glance HP, AC, Initiative, Conditions
 * - Smooth hover elevation and edge lighting
 */

import { useState, useCallback } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import PlayerCardAvatar from "./PlayerCardAvatar";
import PlayerCardHpBar from "./PlayerCardHpBar";
import PlayerCardQuickActions from "./PlayerCardQuickActions";
import PlayerCardConditions from "./PlayerCardConditions";
import PlayerCardManager from "./PlayerCardManager";
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
  const [showManager, setShowManager] = useState(false);

  const handleHpQuick = useCallback(
    (delta: number, e: React.MouseEvent) => {
      e.stopPropagation();
      const newHp = Math.max(0, Math.min(c.hitPoints.max, c.hitPoints.current + delta));
      updateCharacter(c.id, { hitPoints: { ...c.hitPoints, current: newHp } });
    },
    [c, updateCharacter]
  );

  return (
    <>
      <div
        onClick={() => onOpen(c)}
        className="group relative bg-gradient-to-b from-[#191b2b]/70 to-[#12131e]/85 rounded-xl border border-white/[0.04] p-3.5 sm:p-4 cursor-pointer active:scale-[0.97] transition-all duration-200 touch-manipulation shadow-[0_4px_20px_rgba(0,0,0,0.25)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.35),0_0_30px_rgba(234,179,8,0.03)] hover:border-gold-500/12 hover:-translate-y-0.5"
      >
        {/* Top gold edge line */}
        <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-gold-500/0 to-transparent group-hover:via-gold-500/15 transition-all duration-500" />

        {/* Hover glow directional sweep */}
        <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-gold-500/5 via-transparent to-amber-500/2" />
        </div>

        {/* Manage button — top right, always visible */}
        <button
          onClick={(e) => { e.stopPropagation(); setShowManager(true); }}
          className="absolute top-2 right-2 z-20 w-7 h-7 rounded-lg bg-[#07080d]/70 border border-white/[0.04] text-surface-500 hover:text-gold-400 hover:border-gold/15 hover:bg-gold-500/8 active:scale-90 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100"
          title="Manage character"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>

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

      {/* Manage Modal */}
      <PlayerCardManager
        isOpen={showManager}
        character={c}
        onClose={() => setShowManager(false)}
      />
    </>
  );
}
