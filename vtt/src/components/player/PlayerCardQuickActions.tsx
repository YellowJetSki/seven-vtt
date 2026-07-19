/**
 * STᚱ VTT — Player Card Quick Actions (Premium Tactile)
 *
 * Large, tactile HP adjustment buttons and stat badges.
 * - -5/+5 buttons with gradient backgrounds and glow on press
 * - AC/Initiative badges with gold accents
 * - All touch targets exceed 44px for mobile
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
      {/* HP Quick buttons */}
      <div className="flex gap-1.5">
        <button
          onClick={(e) => onHpQuick(-5, e)}
          className="relative overflow-hidden px-3 sm:px-4 py-2 rounded-lg bg-gradient-to-br from-red-500/15 to-red-600/10 text-red-400 text-[11px] font-bold active:scale-90 transition-all duration-150 min-w-[44px] hover:from-red-500/25 hover:to-red-600/15 border border-red-500/15 hover:border-red-500/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
        >
          <span className="relative z-10">-5</span>
          {/* Active press glow */}
          <div className="absolute inset-0 bg-gradient-to-t from-red-500/20 to-transparent opacity-0 active:opacity-100 transition-opacity duration-150" />
        </button>
        <button
          onClick={(e) => onHpQuick(5, e)}
          className="relative overflow-hidden px-3 sm:px-4 py-2 rounded-lg bg-gradient-to-br from-emerald-500/15 to-green-600/10 text-emerald-400 text-[11px] font-bold active:scale-90 transition-all duration-150 min-w-[44px] hover:from-emerald-500/25 hover:to-green-600/15 border border-emerald-500/15 hover:border-emerald-500/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
        >
          <span className="relative z-10">+5</span>
          <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/20 to-transparent opacity-0 active:opacity-100 transition-opacity duration-150" />
        </button>
      </div>

      {/* Stat badges */}
      <div className="flex items-center gap-1.5 ml-auto">
        <div className="flex items-center gap-1.5 bg-[#151729]/70 border border-white/[0.04] px-2.5 py-1.5 rounded-lg group/badge hover:border-gold-500/15 transition-all duration-200">
          <Shield className="w-3.5 h-3.5 text-gold-400/70" />
          <span className="text-xs font-bold tabular-nums text-white/80">
            {c.armorClass}
          </span>
        </div>
        <div className="flex items-center gap-1.5 bg-[#151729]/70 border border-white/[0.04] px-2.5 py-1.5 rounded-lg group/badge hover:border-gold-500/15 transition-all duration-200">
          <Zap className="w-3.5 h-3.5 text-gold-400/70" />
          <span className="text-xs font-bold tabular-nums text-white/80">
            {c.initiative >= 0 ? "+" : ""}{c.initiative}
          </span>
        </div>
      </div>
    </div>
  );
}
