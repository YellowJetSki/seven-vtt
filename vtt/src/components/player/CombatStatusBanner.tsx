/**
 * STᚱ VTT — CombatStatusBanner
 *
 * Condition-aware combat status banner with color-coded HP ratio.
 * Shows Healthy/Bloodied/Unconscious/Dead with icon, label, and HP fraction.
 *
 * Extracted from PlayerSheetCombatTab.tsx monolith (Sprint 9 refactor).
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

  return (
    <div
      className={`rounded-xl border p-3 flex items-center justify-between transition-all duration-300 ${combatStatus.bg}`}
    >
      <div className="flex items-center gap-2.5">
        <span className="text-xl">{combatStatus.icon}</span>
        <div>
          <span className={`text-[10px] uppercase tracking-widest font-black ${combatStatus.color}`}>
            {combatStatus.label}
          </span>
          {!isDead && (
            <span className="text-[10px] text-surface-500 ml-2">
              {character.hitPoints.current}/{character.hitPoints.max} HP
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        {isAtZero && !isDead && (
          <span className="text-[9px] text-rose-400/60 font-mono">
            DS {character.deathSaves.successes}/{character.deathSaves.failures}
          </span>
        )}
        {isBloodied && (
          <span className="px-1.5 py-0.5 rounded text-[9px] bg-amber-500/10 border border-amber-500/15 text-amber-400 font-semibold">
            Bloodied
          </span>
        )}
      </div>
    </div>
  );
}
