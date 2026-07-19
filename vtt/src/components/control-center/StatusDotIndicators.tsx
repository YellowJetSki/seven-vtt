/**
 * STᚱ VTT — Status Dot Indicators
 *
 * Small colored dots representing active status effects on a combatant.
 * Shows up to 3 dots, with a "+N" overflow indicator.
 */

import type { StatusEffect } from "@/types";

interface StatusDotIndicatorsProps {
  effects: StatusEffect[];
}

export default function StatusDotIndicators({
  effects,
}: StatusDotIndicatorsProps) {
  if (effects.length === 0) return null;

  return (
    <div className="flex gap-0.5 shrink-0">
      {effects.slice(0, 3).map((s) => (
        <span
          key={s.id}
          className="w-1.5 h-1.5 rounded-full bg-mage-400"
          title={s.effect}
        />
      ))}
      {effects.length > 3 && (
        <span className="text-[8px] text-surface-500">
          +{effects.length - 3}
        </span>
      )}
    </div>
  );
}
