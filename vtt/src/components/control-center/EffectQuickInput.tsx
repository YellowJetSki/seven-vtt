/**
 * STᚱ VTT — Effect Quick Input
 *
 * Inline input for adding a status effect to a combatant.
 */

interface EffectQuickInputProps {
  value: string;
  onChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

export default function EffectQuickInput({
  value,
  onChange,
  onKeyDown,
}: EffectQuickInputProps) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onKeyDown}
      placeholder="+effect"
      className="w-16 bg-surface-800/60 border border-surface-600/30 rounded px-1.5 py-0.5 text-[10px] text-surface-300 placeholder-surface-600 focus:outline-none focus:border-accent-500/40"
    />
  );
}
