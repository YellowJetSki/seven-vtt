/**
 * STᚱ VTT — Encounter Empty State (Premium Gold)
 *
 * Gold-accented placeholder display when no encounters exist.
 */

export default function EncounterEmptyState() {
  return (
    <div className="text-center py-8">
      <span className="text-2xl block mb-2 opacity-30">⚔</span>
      <p className="text-surface-500 text-xs">No encounters saved</p>
      <p className="text-gold-500/40 text-[10px] mt-1">
        Create one from the Encounters page
      </p>
      <div className="mt-4 text-gold-500/20 text-xs">✦ ✦ ✦</div>
    </div>
  );
}
