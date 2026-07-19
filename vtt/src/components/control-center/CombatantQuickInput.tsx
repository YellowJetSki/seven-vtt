/**
 * STᚱ VTT — Combatant Quick Input (Premium Gold)
 *
 * Inline input for quick HP damage/heal on a combatant.
 * Gold-accented focus ring and apply button.
 */

interface CombatantQuickInputProps {
  value: string;
  onChange: (value: string) => void;
  onApply: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

export default function CombatantQuickInput({
  value,
  onChange,
  onApply,
  onKeyDown,
}: CombatantQuickInputProps) {
  return (
    <>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="-dmg / +heal"
        className="w-20 bg-obsidian-mid/60 border border-surface-700/30 rounded px-1.5 py-0.5 text-[10px] text-surface-300 placeholder-surface-600 focus:outline-none focus:border-gold/30 focus:ring-1 focus:ring-gold/15 transition-all"
      />
      <button
        onClick={(e) => {
          e.stopPropagation();
          onApply();
        }}
        className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-gold-500/10 text-gold-400 hover:bg-gold-500/20 border border-gold/15 hover:border-gold/25 transition-all duration-150"
      >
        Apply
      </button>
    </>
  );
}
