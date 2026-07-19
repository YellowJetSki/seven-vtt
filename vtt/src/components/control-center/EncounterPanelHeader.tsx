/**
 * STᚱ VTT — Encounter Panel Header
 *
 * Title bar for the encounter panel with count display.
 */

interface EncounterPanelHeaderProps {
  encounterCount: number;
}

export default function EncounterPanelHeader({
  encounterCount,
}: EncounterPanelHeaderProps) {
  return (
    <div className="flex items-center justify-between px-3 py-2 border-b border-surface-700/20 shrink-0">
      <span className="text-sm font-bold text-gradient-arcane">Encounters</span>
      <span className="text-[10px] text-surface-500">
        {encounterCount} saved
      </span>
    </div>
  );
}
