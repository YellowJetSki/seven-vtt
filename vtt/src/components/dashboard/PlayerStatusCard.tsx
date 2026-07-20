/**
 * STᚱ VTT — Player Status Card (Premium Glass Card)
 *
 * Premium player health monitor for the DM dashboard.
 * Features:
 * - Glass gradient card with hover elevation
 * - Shared CharacterHpGauge for HP management
 * - ConditionDots for status effects
 * - AC badge with gold accent
 * - Staggered entrance animation
 * - Edge light and directional hover glow
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
      className="relative group/card bg-[#0c0d15] border border-white/[0.04] rounded-xl p-3 overflow-hidden
        hover:border-gold-500/12 hover:-translate-y-0.5
        hover:shadow-[0_4px_20px_rgba(234,179,8,0.03)]
        transition-all duration-200 ease-out"
      style={{
        animation: `slideInUp 0.3s ease-out ${index * 60}ms both`,
      }}
    >
      {/* Directional hover glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-gold-500/[0.02] to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 pointer-events-none" />

      {/* Top edge light on hover */}
      <div className="absolute top-0 left-[15%] right-[15%] h-px bg-gradient-to-r from-transparent via-gold-500/0 to-transparent group-hover/card:via-gold-500/12 transition-all duration-300 pointer-events-none" />

      {/* Header: Name + AC + Conditions */}
      <div className="relative flex items-start justify-between mb-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-bold text-white/80 truncate leading-tight transition-colors group-hover/card:text-white/90">
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

      {/* HP Gauge (shared component) */}
      <div className="relative">
        <CharacterHpGauge character={c} onHpChange={handleHpChange} showControls />
      </div>
    </div>
  );
}
