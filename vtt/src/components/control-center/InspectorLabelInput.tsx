/**
 * STᚱ VTT — Inspector Label Input
 *
 * Label editing field for the token inspector.
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
      <label className="text-[10px] uppercase tracking-widest text-surface-500 font-black mb-1 block">
        Label
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-arcane w-full py-1.5 px-2 text-sm"
        placeholder="Token name"
      />
    </div>
  );
}
