/**
 * STᚱ VTT — Inspector Visibility Toggle (Premium Gold)
 *
 * Gold-accented toggle switch for token visibility to players.
 */

interface InspectorVisibilityToggleProps {
  visible: boolean;
  onChange: (visible: boolean) => void;
}

export default function InspectorVisibilityToggle({
  visible,
  onChange,
}: InspectorVisibilityToggleProps) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-[10px] uppercase tracking-widest text-gold-500/60 font-black">
        Visible to Players
      </label>
      <button
        onClick={() => onChange(!visible)}
        className={`relative w-10 h-5 rounded-full transition-all duration-200 ${
          visible
            ? "bg-gold-500/40 shadow-[0_0_6px_rgba(234,179,8,0.15)]"
            : "bg-surface-600/40"
        }`}
        aria-label={visible ? "Visible to players" : "Hidden from players"}
      >
        <span
          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-200 ${
            visible ? "translate-x-5 shadow-gold-500/30" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}
