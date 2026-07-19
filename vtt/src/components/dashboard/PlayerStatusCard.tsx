/**
 * STᚱ VTT — Player Status Card (DM Dashboard — Premium Refactor)
 *
 * Compact player monitor for the DM dashboard using shared components.
 * Shows: name, player-name, HP gauge (with quick controls), AC, conditions.
 *
 * Sprint 2 refactor: Uses CharacterHpGauge (shared with PlayerSheet & DM Cards).
 * Staggered entry animation. Premium hover glow.
 */

import { useState, useCallback } from "react";
import type { PlayerCharacter } from "@/types";
import { useCampaignStore } from "@/stores/campaignStore";
import ConditionDots from "@/components/player/ConditionDots";
import CharacterHpGauge from "@/components/player/CharacterHpGauge";

interface PlayerStatusCardProps {
  character: PlayerCharacter;
  index?: number;
}

export default function PlayerStatusCard({ character: c, index = 0 }: PlayerStatusCardProps) {
  const updateCharacter = useCampaignStore((s) => s.updateCharacter);

  const ac = c.armorClass ?? 10;
  const conditions = c.conditions ?? [];

  const handleHpChange = useCallback(
    (delta: number) => {
      const newHp = delta >= c.hitPoints.max
        ? c.hitPoints.max
        : Math.max(0, Math.min(c.hitPoints.max, c.hitPoints.current + delta));
      updateCharacter(c.id, { hitPoints: { ...c.hitPoints, current: newHp } });
    },
    [c, updateCharacter]
  );

  return (
    <div
      className="bg-[#0c0d15] border border-white/[0.04] rounded-xl p-3 hover:border-gold-500/12 hover:shadow-[0_0_20px_rgba(234,179,8,0.02)] transition-all duration-200 group animate-in fade-in slide-in-from-bottom-2"
      style={{ animationDuration: '300ms', animationDelay: `${index * 60}ms` }}
    >
      {/* Header: Name + AC + Conditions */}
      <div className="flex items-start justify-between mb-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-bold text-white/80 truncate leading-tight transition-colors group-hover:text-white/90">
              {c.name || "Unnamed Hero"}
            </p>
            {conditions.length > 0 && (
              <ConditionDots conditionIds={conditions} size={6} maxDots={3} />
            )}
          </div>
          <p className="text-[9px] text-surface-500 mt-0.5 truncate">
            {c.playerName || c.class || "Player"} · Lv.{c.level || 1}
          </p>
        </div>

        {/* AC badge */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-gold-500/8 border border-gold/15 shrink-0 ml-2">
          <span className="text-[7px] uppercase tracking-wider font-black text-gold-500/60">AC</span>
          <span className="text-xs font-bold tabular-nums text-gold-300">{ac}</span>
        </div>
      </div>

      {/* HP Gauge (shared component — used on PlayerSheet too) */}
      <CharacterHpGauge character={c} onHpChange={handleHpChange} showControls />
    </div>
  );
}
