/**
 * STᚱ VTT — Player Status Card (DM War Room)
 *
 * Compact player status for the DM dashboard showing:
 * - Character name + player name
 * - HP bar with fraction (color-coded)
 * - Active conditions badges
 * - AC display
 * - Quick HP adjustment (+5/-5)
 *
 * This is the DM's at-a-glance player health monitor during live gameplay.
 */

import { useCallback, useState } from "react";
import type { PlayerCharacter } from "@/types";

interface PlayerStatusCardProps {
  character: PlayerCharacter;
}

export default function PlayerStatusCard({ character }: PlayerStatusCardProps) {
  const [hp, setHp] = useState(character.hitPoints?.current ?? 10);
  const hpMax = character.hitPoints?.max ?? 10;
  const ratio = hpMax > 0 ? hp / hpMax : 1;
  const hpColor = ratio > 0.6 ? "text-emerald-400" : ratio > 0.3 ? "text-amber-400" : "text-red-400";
  const barColor = ratio > 0.6 ? "bg-emerald-500/70" : ratio > 0.3 ? "bg-amber-500/70" : "bg-red-500/70";
  const ac = character.armorClass ?? 10;
  const conditions = character.conditions ?? [];

  const handleHpChange = useCallback(
    (delta: number) => {
      setHp((prev) => Math.max(0, Math.min(hpMax, prev + delta)));
    },
    [hpMax]
  );

  const handleHpInput = useCallback(
    (value: string) => {
      const num = parseInt(value, 10);
      if (!isNaN(num)) {
        setHp(Math.max(0, Math.min(hpMax, num)));
      }
    },
    [hpMax]
  );

  return (
    <div className="bg-[#0c0d15] border border-white/[0.04] rounded-xl p-3 hover:border-white/[0.08] transition-all duration-200 group">
      {/* Header: Name + AC */}
      <div className="flex items-start justify-between mb-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-white/80 truncate leading-tight">
            {character.name || "Unnamed Hero"}
          </p>
          <p className="text-[9px] text-surface-500 mt-0.5 truncate">
            {character.playerName || character.class || "Player"}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0 ml-2">
          <span className="text-[9px] text-surface-500 uppercase">AC</span>
          <span className="text-sm font-bold text-white/90 tabular-nums w-6 text-center">{ac}</span>
        </div>
      </div>

      {/* HP Bar */}
      <div className="space-y-1.5 mb-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-surface-500 uppercase">HP</span>
          <span className={`text-[11px] font-bold tabular-nums ${hpColor}`}>
            {hp}
            <span className="text-surface-500 font-normal">/{hpMax}</span>
          </span>
        </div>
        <div className="h-1.5 bg-[#07080d] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${barColor}`}
            style={{ width: `${Math.max(0, ratio * 100)}%` }}
          />
        </div>

        {/* Quick HP buttons (shown on hover / always clickable) */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={() => handleHpChange(-5)}
            className="flex-1 py-1 rounded text-[9px] font-bold bg-red-500/8 text-red-400/70 border border-red-500/8 hover:bg-red-500/15 hover:text-red-400 active:scale-95 transition-all duration-150"
          >
            -5
          </button>
          <input
            type="number"
            value={hp}
            onChange={(e) => handleHpInput(e.target.value)}
            className="w-14 text-center py-1 rounded text-[9px] font-mono bg-[#07080d] border border-white/[0.06] text-white/60 focus:outline-none focus:border-gold-500/25 focus:ring-1 focus:ring-gold-500/15"
          />
          <button
            onClick={() => handleHpChange(5)}
            className="flex-1 py-1 rounded text-[9px] font-bold bg-emerald-500/8 text-emerald-400/70 border border-emerald-500/8 hover:bg-emerald-500/15 hover:text-emerald-400 active:scale-95 transition-all duration-150"
          >
            +5
          </button>
        </div>
      </div>

      {/* Conditions */}
      {conditions.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {conditions.map((condition) => (
            <span
              key={condition}
              className="text-[8px] font-medium px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/15 text-amber-400/80"
            >
              {condition}
            </span>
          ))}
        </div>
      )}

      {/* No conditions */}
      {conditions.length === 0 && (
        <p className="text-[8px] text-surface-600 italic">No conditions</p>
      )}
    </div>
  );
}
