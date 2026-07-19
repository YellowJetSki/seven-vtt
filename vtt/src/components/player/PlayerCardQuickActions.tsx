/**
 * STᚱ VTT — Player Card Quick Actions
 *
 * Quick HP adjustment buttons and AC/Initiative display for the compact player card.
 */

import { Shield, Zap } from "lucide-react";
import type { PlayerCharacter } from "@/types";

interface PlayerCardQuickActionsProps {
  character: PlayerCharacter;
  onHpQuick: (delta: number, e: React.MouseEvent) => void;
}

export default function PlayerCardQuickActions({
  character: c,
  onHpQuick,
}: PlayerCardQuickActionsProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1">
        <button
          onClick={(e) => onHpQuick(-5, e)}
          className="px-2.5 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-[10px] font-bold active:scale-90 transition-transform min-w-[32px]"
        >
          -5
        </button>
        <button
          onClick={(e) => onHpQuick(5, e)}
          className="px-2.5 py-1.5 rounded-lg bg-green-500/10 text-green-400 text-[10px] font-bold active:scale-90 transition-transform min-w-[32px]"
        >
          +5
        </button>
      </div>
      <div className="flex items-center gap-2 ml-auto">
        <div className="flex items-center gap-1 bg-surface-800/40 px-2 py-1 rounded-lg">
          <Shield className="w-3 h-3 text-accent-400" />
          <span className="text-xs font-bold tabular-nums">{c.armorClass}</span>
        </div>
        <div className="flex items-center gap-1 bg-surface-800/40 px-2 py-1 rounded-lg">
          <Zap className="w-3 h-3 text-amber-400" />
          <span className="text-xs font-bold tabular-nums">
            {c.initiative >= 0 ? "+" : ""}
            {c.initiative}
          </span>
        </div>
      </div>
    </div>
  );
}
