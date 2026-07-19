/**
 * STᚱ VTT — Inspector Label Input
 *
 * Gold-accented text input for the token's display label.
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
    <div className="space-y-1.5">
      <label className="text-[10px] uppercase tracking-wider text-surface-500 font-medium">
        Label
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg text-sm bg-[#0c0d15] border border-white/[0.06] text-white/80 placeholder-surface-500 focus:outline-none focus:border-gold-500/25 focus:ring-1 focus:ring-gold-500/15 transition-all duration-200"
        placeholder="Token label"
      />
    </div>
  );
}
