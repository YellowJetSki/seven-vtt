/**
 * STᚱ VTT — Status Effects List
 *
 * Displays active status effects as clickable badges for removal.
 */

import type { StatusEffect } from "@/types";
import StatusEffectBadge from "./StatusEffectBadge";

interface StatusEffectsListProps {
  effects: StatusEffect[];
  onRemoveEffect: (effectId: string) => void;
}

export default function StatusEffectsList({
  effects,
  onRemoveEffect,
}: StatusEffectsListProps) {
  if (effects.length === 0) return null;

  return (
    <div className="flex gap-0.5">
      {effects.map((s) => (
        <StatusEffectBadge
          key={s.id}
          id={s.id}
          label={s.effect}
          onRemove={onRemoveEffect}
        />
      ))}
    </div>
  );
}
