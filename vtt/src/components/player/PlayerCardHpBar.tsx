/**
 * STᚱ VTT — Player Card HP Bar (Data-Rich Premium)
 *
 * Animated HP bar with color-coded state labels, temp HP display,
 * and gold/amber/red gradient transitions.
 * Shows temp HP as a separate overlay on the bar.
 */

import { useMemo } from "react";
import { Heart } from "lucide-react";
import type { PlayerCharacter } from "@/types";

interface PlayerCardHpBarProps {
  character: PlayerCharacter;
}

export default function PlayerCardHpBar({ character: c }: PlayerCardHpBarProps) {
  const { current, max, temporary } = c.hitPoints;
  const hasTempHp = (temporary ?? 0) > 0;

  const hpRatio = useMemo(
    () => (max > 0 ? current / max : 1),
    [current, max]
  );

  const hpColor = useMemo(() => {
    if (hpRatio > 0.75) return "from-emerald-500 to-emerald-400";
    if (hpRatio > 0.5) return "from-emerald-500 to-amber-400";
    if (hpRatio > 0.25) return "from-amber-500 to-orange-400";
    if (hpRatio > 0) return "from-red-500 to-rose-400";
    return "from-red-900/60 to-red-800/40";
  }, [hpRatio]);

  const hpLabel = useMemo(() => {
    if (current === 0) return "Down";
    if (hpRatio > 0.75) return "Healthy";
    if (hpRatio > 0.5) return "Hurt";
    if (hpRatio > 0.25) return "Bloodied";
    return "Critical";
  }, [hpRatio, current]);

  const hpLabelColor = useMemo(() => {
    if (current === 0) return "text-red-400";
    if (hpRatio > 0.5) return "text-emerald-400";
    if (hpRatio > 0.25) return "text-amber-400";
    return "text-red-400";
  }, [hpRatio, current]);

  return (
    <div className="flex-1">
      {/* Label row */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1">
          <Heart className={`w-3 h-3 ${current === 0 ? 'text-red-400' : 'text-red-400/80'}`} />
          <span className={`text-[9px] uppercase tracking-wider font-semibold ${hpLabelColor}`}>
            {hpLabel}
          </span>
          {hasTempHp && (
            <span className="text-[9px] text-amber-400/70 font-medium ml-1">
              +{temporary} THP
            </span>
          )}
        </div>
        <span className="text-[10px] font-mono font-bold tabular-nums text-white/80">
          {current}
          <span className="text-surface-500">/{max}</span>
        </span>
      </div>

      {/* HP bar with optional temp HP overlay */}
      <div className="h-2.5 bg-surface-700/50 rounded-full overflow-hidden shadow-inner relative">
        {/* Main HP bar */}
        <div
          className={`h-full rounded-full bg-gradient-to-r ${hpColor} transition-all duration-500 ease-out relative`}
          style={{ width: `${Math.max(0, hpRatio * 100)}%` }}
        >
          {/* Shimmer animation on full bar */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer-dot" />
        </div>

        {/* Temp HP overlay */}
        {hasTempHp && (
          <div
            className="absolute top-0 h-full rounded-r-full bg-gradient-to-r from-amber-500/30 to-amber-400/20 border-l border-amber-400/30"
            style={{
              left: `${Math.min(hpRatio * 100, 95)}%`,
              width: `${Math.min(((temporary ?? 0) / max) * 100, 20)}%`,
              maxWidth: `${Math.max(0, 100 - hpRatio * 100)}%`,
            }}
          />
        )}
      </div>
    </div>
  );
}
