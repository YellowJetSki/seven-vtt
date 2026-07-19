/**
 * STᚱ VTT — Inspector Header (Premium Gold)
 *
 * Gold-accented title bar for the token inspector.
 */

interface InspectorHeaderProps {
  icon?: string;
  onClose: () => void;
}

export default function InspectorHeader({ icon, onClose }: InspectorHeaderProps) {
  return (
    <div className="panel-header flex items-center justify-between px-4 py-3 shrink-0">
      <div className="flex items-center gap-2">
        <span className="text-lg">{icon || "⬤"}</span>
        <span className="text-sm font-bold text-gold-300">Token Inspector</span>
      </div>
      <button
        onClick={onClose}
        className="p-1 rounded-lg hover:bg-gold-500/10 text-surface-400 hover:text-gold-400 transition-colors"
        aria-label="Close inspector"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
