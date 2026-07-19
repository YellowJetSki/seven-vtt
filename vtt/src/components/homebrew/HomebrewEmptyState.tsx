/**
 * STᚱ VTT — Homebrew Empty State
 *
 * Placeholder display when no homebrew items/spells/feats exist for the active tab.
 */

interface HomebrewEmptyStateProps {
  tabLabel: string;
}

export default function HomebrewEmptyState({
  tabLabel,
}: HomebrewEmptyStateProps) {
  return (
    <div className="text-center py-12">
      <p className="text-surface-500 text-sm">No {tabLabel} yet</p>
      <p className="text-surface-600 text-xs mt-1">
        Create your first {tabLabel.slice(0, -1)}
      </p>
    </div>
  );
}
