/**
 * STᚱ VTT — CombatStatusBanner (Premium)
 *
 * Lusion-grade combat status banner with:
 * - Multi-layer glass depth with edge lighting
 * - Color-coded tier (emerald/amber/rose/red) per HP state
 * - Icon + animated pulse for critical states
 * - HP fraction with gradient glow
 * - Bloodied badge with amber shimmer
 * - Death saves quick reference when down
 * - Directional hover glow sweep
 */

import type { PlayerCharacter } from "@/types";
import { computeCombatStatus } from "@/lib/combat/combat-resource-deriver";

interface CombatStatusBannerProps {
  character: PlayerCharacter;
  hpRatio: number;
  isAtZero: boolean;
  isDead: boolean;
  isBloodied: boolean;
}

export default function CombatStatusBanner({
  character,
  hpRatio,
  isAtZero,
  isDead,
  isBloodied,
}: CombatStatusBannerProps) {
  const combatStatus = computeCombatStatus(hpRatio, isAtZero, isDead, isBloodied);

  const tierBg = isDead
    ? "from-red-950/40 to-rose-950/30 border-red-500/15"
    : isAtZero
      ? "from-red-950/30 to-rose-950/20 border-rose-500/15"
      : isBloodied
        ? "from-amber-950/30 to-red-950/20 border-amber-500/15"
        : "from-emerald-950/30 to-surface-950/20 border-emerald-500/15";

  return (
    <div
      className={`relative rounded-xl bg-gradient-to-b ${tierBg} border p-3 flex items-center justify-between overflow-hidden group transition-all duration-300`}
    >
      {/* Edge light */}
      <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Hover glow sweep */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none bg-gradient-to-br from-white/[0.02] via-transparent to-transparent" />

      <div className="flex items-center gap-3 relative z-[1]">
        {/* Icon with pulse for critical */}
        <span className={`text-xl ${isAtZero ? "animate-pulse-soft" : ""}`}>
          {combatStatus.icon}
        </span>
        <div>
          <span className={`text-[10px] uppercase tracking-widest font-black ${combatStatus.color}`}>
            {combatStatus.label}
          </span>
          {!isDead && (
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-lg font-black tabular-nums font-mono text-gold-300">
                {character.hitPoints.current}
              </span>
              <span className="text-[10px] text-surface-500 font-mono">
                /{character.hitPoints.max} HP
              </span>
              {/* HP ratio percent */}
              <span className={`text-[9px] font-semibold tabular-nums px-1.5 py-0.5 rounded border ${
                hpRatio > 0.5
                  ? "text-emerald-400/60 border-emerald-500/15"
                  : hpRatio > 0.25
                    ? "text-amber-400/60 border-amber-500/15"
                    : "text-rose-400/60 border-rose-500/15"
              }`}>
                {Math.round(hpRatio * 100)}%
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 relative z-[1]">
        {/* Death saves quick ref */}
        {isAtZero && !isDead && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-500/10 border border-rose-500/15">
            <span className="text-[9px] text-rose-400/80 font-mono">
              DS
            </span>
            <span className="text-[9px] font-bold text-rose-400 tabular-nums">
              {character.deathSaves.successes}✓ {character.deathSaves.failures}✕
            </span>
          </div>
        )}

        {/* Bloodied badge */}
        {isBloodied && (
          <span className="px-2 py-1 rounded-lg text-[9px] font-bold bg-amber-500/10 border border-amber-500/15 text-amber-400 flex items-center gap-1">
            <span className="text-[8px]">⚔️</span>
            Bloodied
          </span>
        )}
      </div>
    </div>
  );
}
