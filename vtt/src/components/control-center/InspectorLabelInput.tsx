/**
 * STᚱ VTT — Inspector Label Input (Premium Gold)
 *
 * Gold-accented label editing field for the token inspector.
 */

interface InspectorLabelInputProps {
  value: string;
  onChange: (value: string) => void;
}

export default function InspectorLabelInput({
  value,
  onChange,
}: InspectorLabelInputProps) {
  return (
    <div>
      <label className="text-[10px] uppercase tracking-widest text-gold-500/60 font-black mb-1.5 block">
        Label
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full py-1.5 px-2.5 text-sm bg-obsidian-mid/60 border border-surface-700/30 rounded-lg text-surface-200 placeholder-surface-600 focus:border-gold/30 focus:ring-1 focus:ring-gold/20 transition-all outline-none"
        placeholder="Token name"
      />
    </div>
  );
}
