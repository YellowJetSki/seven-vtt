/**
 * STᚱ VTT — Player Card Conditions (Premium)
 *
 * Premium condition badges with gold/amber tint.
 * Shows up to 4 conditions inline, with overflow count.
 * Condition badges have light glow effect on hover.
 */

import type { PlayerCharacter } from "@/types";

interface PlayerCardConditionsProps {
  character: PlayerCharacter;
}

const conditionColors: Record<string, string> = {
  poisoned: "border-emerald-500/20 text-emerald-400 bg-emerald-500/8",
  paralyzed: "border-amber-500/20 text-amber-400 bg-amber-500/8",
  stunned: "border-amber-500/20 text-amber-400 bg-amber-500/8",
  unconscious: "border-red-500/20 text-red-400 bg-red-500/8",
  prone: "border-sky-500/20 text-sky-400 bg-sky-500/8",
  grappled: "border-red-500/20 text-red-400 bg-red-500/8",
  restrained: "border-red-500/20 text-red-400 bg-red-500/8",
  invisible: "border-violet-500/20 text-violet-400 bg-violet-500/8",
  blinded: "border-surface-500/20 text-surface-400 bg-surface-500/8",
  deafened: "border-surface-500/20 text-surface-400 bg-surface-500/8",
  frightened: "border-purple-500/20 text-purple-400 bg-purple-500/8",
  charmed: "border-pink-500/20 text-pink-400 bg-pink-500/8",
  exhausted: "border-amber-500/20 text-amber-400 bg-amber-500/8",
  concentrating: "border-gold-500/20 text-gold-400 bg-gold-500/8",
};

export default function PlayerCardConditions({
  character: c,
}: PlayerCardConditionsProps) {
  const activeConditions = c.conditions?.filter(Boolean) || [];

  if (activeConditions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1 mt-2.5 pt-2.5 border-t border-white/[0.04]">
      {activeConditions.slice(0, 4).map((cond) => {
        const colorClasses =
          conditionColors[cond.toLowerCase()] ??
          "border-surface-500/20 text-surface-400 bg-surface-500/8";

        return (
          <span
            key={cond}
            className={`px-2 py-0.5 rounded text-[9px] font-medium border ${colorClasses} transition-all duration-200 hover:brightness-125`}
          >
            {cond.charAt(0).toUpperCase() + cond.slice(1)}
          </span>
        );
      })}
      {activeConditions.length > 4 && (
        <span className="text-[9px] text-surface-500 px-1 py-0.5">
          +{activeConditions.length - 4}
        </span>
      )}
    </div>
  );
}
