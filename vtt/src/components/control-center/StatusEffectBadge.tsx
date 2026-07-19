/**
 * STᚱ VTT — Status Effect Badge
 *
 * Small clickable badge for a status effect on a combatant.
 * Clicking removes the effect.
 */

interface StatusEffectBadgeProps {
  id: string;
  label: string;
  onRemove: (id: string) => void;
}

export default function StatusEffectBadge({
  id,
  label,
  onRemove,
}: StatusEffectBadgeProps) {
  return (
    <span
      onClick={(e) => {
        e.stopPropagation();
        onRemove(id);
      }}
      className="px-1 py-0.5 rounded text-[8px] bg-mage-500/20 text-mage-400 cursor-pointer hover:bg-mage-500/40 transition-colors"
      title={`Click to remove ${label}`}
    >
      {label}
    </span>
  );
}
