/**
 * STᚱ VTT — Inspector Footer
 *
 * Bottom action bar for the token inspector with Save and Delete buttons.
 */

interface InspectorFooterProps {
  hasChanges: boolean;
  onSave: () => void;
  onDelete: () => void;
}

export default function InspectorFooter({
  hasChanges,
  onSave,
  onDelete,
}: InspectorFooterProps) {
  return (
    <div className="flex items-center gap-2 px-4 py-3 border-t border-white/[0.04] shrink-0">
      <button
        onClick={onSave}
        disabled={!hasChanges}
        className={`
          flex-1 py-2 rounded-lg text-xs font-semibold transition-all duration-200 border
          ${hasChanges
            ? "bg-gold-500/10 border-gold-500/20 text-gold-400 hover:bg-gold-500/15 hover:border-gold-500/30 active:scale-[0.98]"
            : "bg-[#0c0d15] border-white/[0.04] text-surface-500 cursor-not-allowed"
          }
        `}
      >
        Save Changes
      </button>
      <button
        onClick={onDelete}
        className="px-3 py-2 rounded-lg text-xs font-medium bg-red-500/8 border border-red-500/10 text-red-400 hover:bg-red-500/12 hover:border-red-500/20 active:scale-[0.98] transition-all duration-150"
      >
        Delete
      </button>
    </div>
  );
}
