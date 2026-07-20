/**
 * STᚱ VTT — Player Placeholder (Premium Gold)
 *
 * Placeholder state shown when player sign-in is not available.
 */

interface PlayerPlaceholderProps {
  onBack: () => void;
}

export default function PlayerPlaceholder({ onBack }: PlayerPlaceholderProps) {
  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="text-sm text-surface-400 hover:text-surface-200 transition-colors flex items-center gap-1"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      <div className="p-6 rounded-xl border border-amber-500/20 bg-amber-500/5">
        <p className="text-surface-300 text-sm text-center">
          Player sign-in will be available once characters are created by the DM.
        </p>
      </div>
    </div>
  );
}
