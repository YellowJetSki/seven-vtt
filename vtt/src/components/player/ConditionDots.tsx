/**
 * STᚱ VTT — Condition Dots
 *
 * Compact condition indicator dots for the player sheet and DM cards.
 * Shows up to 4 colored dots with an overflow count.
 * Each dot uses the condition's own color for instant recognition.
 */

import type { ConditionId } from "@/types";
import { CONDITIONS } from "@/types";

interface ConditionDotsProps {
  conditionIds: string[];
  maxDots?: number;
  size?: number;
}

export default function ConditionDots({
  conditionIds,
  maxDots = 4,
  size = 8,
}: ConditionDotsProps) {
  const conditions = conditionIds
    .map((id) => CONDITIONS[id as ConditionId])
    .filter(Boolean);

  if (conditions.length === 0) return null;

  const visible = conditions.slice(0, maxDots);
  const overflow = conditions.length - maxDots;

  return (
    <div className="flex gap-1 items-center">
      {visible.map((cond) => (
        <span
          key={cond.id}
          className="rounded-full shrink-0"
          style={{
            width: `${size}px`,
            height: `${size}px`,
            backgroundColor: cond.color,
            boxShadow: `0 0 3px ${cond.color}60`,
          }}
          title={cond.name}
        />
      ))}
      {overflow > 0 && (
        <span className="text-[7px] text-surface-500 tabular-nums font-mono">
          +{overflow}
        </span>
      )}
    </div>
  );
}
