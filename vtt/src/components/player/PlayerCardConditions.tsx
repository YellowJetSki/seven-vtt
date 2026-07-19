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
    <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-gold/10">
      {activeConditions.slice(0, 4).map((cond) => (
        <span
          key={cond}
          className="px-1.5 py-0.5 rounded text-[9px] bg-gold-500/10 text-gold-400 border border-gold/15"
        >
          {cond.charAt(0).toUpperCase() + cond.slice(1)}
        </span>
      ))}
      {activeConditions.length > 4 && (
        <span className="text-[9px] text-gold-500/40">
          +{activeConditions.length - 4}
        </span>
      )}
    </div>
  );
}
