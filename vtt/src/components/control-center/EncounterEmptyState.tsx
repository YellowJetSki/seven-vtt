/**
 * STᚱ VTT — Encounter Empty State
 *
 * Placeholder display when no encounters exist.
 */

export default function EncounterEmptyState() {
  return (
    <div className="text-center py-6">
      <p className="text-surface-500 text-xs">No encounters saved</p>
      <p className="text-surface-600 text-[10px] mt-1">
        Create one from the Encounters page
      </p>
    </div>
  );
}
