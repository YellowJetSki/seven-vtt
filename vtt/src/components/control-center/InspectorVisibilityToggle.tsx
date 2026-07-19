/**
 * STᚱ VTT — Inspector Visibility Toggle
 *
 * Toggle switch for token visibility on the canvas.
 * Gold accent when visible, dim when hidden.
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
    <div className="space-y-1.5">
      <label className="text-[10px] uppercase tracking-wider text-surface-500 font-medium">
        Visibility
      </label>
      <button
        onClick={() => onChange(!visible)}
        className={`
          flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-xs font-medium
          transition-all duration-200 border
          ${visible
            ? "bg-gold-500/8 border-gold-500/15 text-gold-400"
            : "bg-[#0c0d15] border-white/[0.04] text-surface-500 hover:text-surface-300"
          }
        `}
      >
        <span className={`text-sm ${visible ? "" : "opacity-40"}`}>
          {visible ? "👁" : "👁‍🗨"}
        </span>
        <span>{visible ? "Visible to Players" : "Hidden from Players"}</span>
      </button>
    </div>
  );
}
