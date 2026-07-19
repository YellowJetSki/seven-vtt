/**
 * STᚱ VTT — Combatant Quick Input
 *
 * Inline input for quick HP damage/heal on a combatant.
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
        className="w-20 bg-surface-800/60 border border-surface-600/30 rounded px-1.5 py-0.5 text-[10px] text-surface-300 placeholder-surface-600 focus:outline-none focus:border-accent-500/40"
      />
      <button
        onClick={(e) => {
          e.stopPropagation();
          onApply();
        }}
        className="px-1.5 py-0.5 rounded text-[10px] bg-accent-600/20 text-accent-400 hover:bg-accent-600/30 transition-colors"
      >
        Apply
      </button>
    </>
  );
}
