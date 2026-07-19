/**
 * STᚱ VTT — Inspector Header (Premium)
 *
 * Header for the token inspector panel with icon, title, and close button.
 */

interface InspectorHeaderProps {
  icon?: string;
  onClose: () => void;
}

export default function InspectorHeader({ icon, onClose }: InspectorHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/[0.04] shrink-0">
      <div className="flex items-center gap-2.5">
        <span className="text-base">{icon || "📌"}</span>
        <span className="text-sm font-bold text-white/80 tracking-wide">
          Token Inspector
        </span>
      </div>
      <button
        onClick={onClose}
        className="w-7 h-7 rounded-lg flex items-center justify-center text-surface-500 hover:text-white/80 hover:bg-white/[0.04] transition-all duration-150 text-xs"
      >
        ✕
      </button>
    </div>
  );
}
