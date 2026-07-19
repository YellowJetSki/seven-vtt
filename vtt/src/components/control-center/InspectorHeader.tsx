/**
 * STᚱ VTT — Inspector Header
 *
 * Title bar for the token inspector panel with icon and close button.
 */

interface InspectorHeaderProps {
  icon?: string;
  onClose: () => void;
}

export default function InspectorHeader({ icon, onClose }: InspectorHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-surface-700/20 shrink-0">
      <div className="flex items-center gap-2">
        <span className="text-lg">{icon || "⬤"}</span>
        <span className="text-sm font-bold text-surface-200">Token Inspector</span>
      </div>
      <button
        onClick={onClose}
        className="p-1 rounded-lg hover:bg-surface-700/50 text-surface-400 hover:text-surface-200 transition-colors"
        aria-label="Close inspector"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
