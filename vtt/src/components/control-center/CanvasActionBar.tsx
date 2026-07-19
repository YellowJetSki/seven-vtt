/**
 * STᚱ VTT — Canvas Action Bar
 *
 * Floating bottom-left action bar for the DM Control Center.
 * Provides quick access to Encounter and Initiative panels.
 * Glossy gold glass styling with backdrop blur.
 */

import type { CombatEncounter } from "@/types";

interface CanvasActionBarProps {
  showEncounterPanel: boolean;
  showInitiative: boolean;
  activeEncounter: CombatEncounter | null;
  onToggleEncounterPanel: () => void;
  onToggleInitiative: () => void;
}

export default function CanvasActionBar({
  showEncounterPanel,
  showInitiative,
  activeEncounter,
  onToggleEncounterPanel,
  onToggleInitiative,
}: CanvasActionBarProps) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onToggleEncounterPanel}
        className={`
          px-3.5 py-2 rounded-xl text-[10px] font-semibold tracking-wide uppercase
          transition-all duration-200 border backdrop-blur-xl shadow-lg
          ${showEncounterPanel
            ? "bg-gold-500/10 border-gold-500/25 text-gold-400 shadow-[0_0_16px_rgba(234,179,8,0.06)]"
            : "bg-[#12131e]/80 border-white/[0.06] text-surface-400 hover:text-gold-300 hover:border-gold-500/15 hover:bg-gold-500/5"
          }
        `}
      >
        ⚔ Encounters
      </button>
      <button
        onClick={onToggleInitiative}
        className={`
          px-3.5 py-2 rounded-xl text-[10px] font-semibold tracking-wide uppercase
          transition-all duration-200 border backdrop-blur-xl shadow-lg
          ${showInitiative
            ? "bg-gold-500/10 border-gold-500/25 text-gold-400 shadow-[0_0_16px_rgba(234,179,8,0.06)]"
            : "bg-[#12131e]/80 border-white/[0.06] text-surface-400 hover:text-gold-300 hover:border-gold-500/15 hover:bg-gold-500/5"
          }
        `}
      >
        📋 Initiative{" "}
        {activeEncounter ? `(${activeEncounter.combatants.length})` : ""}
      </button>
    </div>
  );
}
