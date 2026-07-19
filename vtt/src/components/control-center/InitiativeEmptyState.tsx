/**
 * STᚱ VTT — Initiative Empty State
 *
 * Placeholder display when no combatants in initiative.
 */

export default function InitiativeEmptyState() {
  return (
    <div className="text-center py-8">
      <p className="text-surface-500 text-xs">No combatants</p>
      <p className="text-surface-600 text-[10px] mt-1">
        Add tokens or create an encounter
      </p>
    </div>
  );
}
