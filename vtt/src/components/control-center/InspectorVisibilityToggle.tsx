/**
 * STᚱ VTT — Inspector Visibility Toggle
 *
 * Toggle switch for token visibility to players.
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
      <label className="text-[10px] uppercase tracking-widest text-surface-500 font-black">
        Visible to Players
      </label>
      <button
        onClick={() => onChange(!visible)}
        className={`relative w-10 h-5 rounded-full transition-colors ${
          visible ? "bg-accent-500/50" : "bg-surface-600/40"
        }`}
        aria-label={visible ? "Visible to players" : "Hidden from players"}
      >
        <span
          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
            visible ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}
