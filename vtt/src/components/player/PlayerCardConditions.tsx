/**
 * STᚱ VTT — Player Card Conditions
 *
 * Displays active conditions as small badges on the compact player card.
 */

import type { PlayerCharacter } from "@/types";

interface PlayerCardConditionsProps {
  character: PlayerCharacter;
}

export default function PlayerCardConditions({
  character: c,
}: PlayerCardConditionsProps) {
  const activeConditions = c.conditions?.filter(Boolean) || [];

  if (activeConditions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-surface-700/20">
      {activeConditions.slice(0, 4).map((cond) => (
        <span
          key={cond}
          className="px-1.5 py-0.5 rounded text-[9px] bg-accent-600/15 text-accent-400 border border-accent-500/10"
        >
          {cond.charAt(0).toUpperCase() + cond.slice(1)}
        </span>
      ))}
      {activeConditions.length > 4 && (
        <span className="text-[9px] text-surface-500">
          +{activeConditions.length - 4}
        </span>
      )}
    </div>
  );
}
