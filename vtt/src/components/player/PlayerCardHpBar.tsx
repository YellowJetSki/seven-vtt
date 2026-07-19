/**
 * STᚱ VTT — Player Card HP Bar
 *
 * Animated HP bar with label and numeric display for the compact player card.
 */

import { useMemo } from "react";
import { Heart } from "lucide-react";
import type { PlayerCharacter } from "@/types";

interface PlayerCardHpBarProps {
  character: PlayerCharacter;
}

export default function PlayerCardHpBar({ character: c }: PlayerCardHpBarProps) {
  const hpRatio = useMemo(
    () => (c.hitPoints.max > 0 ? c.hitPoints.current / c.hitPoints.max : 1),
    [c.hitPoints.current, c.hitPoints.max]
  );

  const hpColor = useMemo(
    () =>
      hpRatio > 0.5
        ? "bg-green-500"
        : hpRatio > 0.25
          ? "bg-amber-500"
          : "bg-red-500",
    [hpRatio]
  );

  const hpLabel = useMemo(() => {
    if (hpRatio > 0.75) return "Healthy";
    if (hpRatio > 0.5) return "Hurt";
    if (hpRatio > 0.25) return "Bloodied";
    if (hpRatio > 0) return "Critical";
    return "Down";
  }, [hpRatio]);

  return (
    <div className="flex-1">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1">
          <Heart className="w-3 h-3 text-red-400" />
          <span className="text-[9px] uppercase tracking-wider text-surface-500 font-semibold">
            {hpLabel}
          </span>
        </div>
        <span className="text-[10px] font-mono font-bold tabular-nums">
          {c.hitPoints.current}
          <span className="text-surface-500">/{c.hitPoints.max}</span>
        </span>
      </div>
      <div className="h-2.5 bg-surface-700/60 rounded-full overflow-hidden">
        <div
          className={`h-full ${hpColor} rounded-full transition-all duration-300`}
          style={{ width: `${Math.max(0, hpRatio * 100)}%` }}
        />
      </div>
    </div>
  );
}
