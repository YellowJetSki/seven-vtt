/**
 * STᚱ VTT — Effect Quick Input (Premium Gold)
 *
 * Inline input for adding a status effect to a combatant.
 * Gold-accented focus ring.
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
      className="w-16 bg-obsidian-mid/60 border border-surface-700/30 rounded px-1.5 py-0.5 text-[10px] text-surface-300 placeholder-surface-600 focus:outline-none focus:border-gold/30 focus:ring-1 focus:ring-gold/15 transition-all"
    />
  );
}
