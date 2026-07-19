/**
 * STᚱ VTT — Status Effect Badge (Premium Gold)
 *
 * Small clickable gold-accented badge for a status effect.
 * Hover reveals removal intent with stronger gold tint.
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
      className="px-1 py-0.5 rounded text-[8px] bg-gold-500/10 text-gold-400/80 cursor-pointer hover:bg-gold-500/20 hover:text-gold-300 border border-gold/10 hover:border-gold/20 transition-all duration-150"
      title={`Click to remove ${label}`}
    >
      {label}
    </span>
  );
}
