/**
 * STᚱ VTT — Player List Empty State
 *
 * Placeholder display when no player characters exist.
 */

interface PlayerListEmptyStateProps {
  onCreateFirst: () => void;
}

export default function PlayerListEmptyState({
  onCreateFirst,
}: PlayerListEmptyStateProps) {
  return (
    <div className="text-center py-12">
      <p className="text-surface-500 text-sm">No characters yet</p>
      <p className="text-surface-600 text-xs mt-1">
        Add a character to get started with your party
      </p>
      <button
        onClick={onCreateFirst}
        className="mt-4 px-4 py-2.5 rounded-xl bg-gold-500/10 border border-gold/25 text-gold-400 text-sm font-semibold active:scale-95 transition-all duration-200 hover:bg-gold-500/15"
      >
        + Create First Character
      </button>
    </div>
  );
}
