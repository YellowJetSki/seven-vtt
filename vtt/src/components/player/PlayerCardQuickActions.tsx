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
          className="px-2.5 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-[10px] font-bold active:scale-90 transition-all duration-150 min-w-[36px] hover:bg-red-500/15 border border-red-500/10 hover:border-red-500/20"
        >
          -5
        </button>
        <button
          onClick={(e) => onHpQuick(5, e)}
          className="px-2.5 py-1.5 rounded-lg bg-green-500/10 text-green-400 text-[10px] font-bold active:scale-90 transition-all duration-150 min-w-[36px] hover:bg-green-500/15 border border-green-500/10 hover:border-green-500/20"
        >
          +5
        </button>
      </div>
      <div className="flex items-center gap-2 ml-auto">
        <div className="flex items-center gap-1 bg-obsidian-mid/60 border border-surface-700/20 px-2 py-1 rounded-lg hover:border-gold/10 transition-all duration-200">
          <Shield className="w-3 h-3 text-gold-400" />
          <span className="text-xs font-bold tabular-nums text-gold-300">{c.armorClass}</span>
        </div>
        <div className="flex items-center gap-1 bg-obsidian-mid/60 border border-surface-700/20 px-2 py-1 rounded-lg hover:border-gold/10 transition-all duration-200">
          <Zap className="w-3 h-3 text-gold-400" />
          <span className="text-xs font-bold tabular-nums text-gold-300">
            {c.initiative >= 0 ? "+" : ""}
            {c.initiative}
          </span>
        </div>
      </div>
    </div>
  );
}
