/**
 * STᚱ VTT — Encounter Panel Header (Premium Gold)
 *
 * Gold-accented title bar for the encounter panel.
 */

interface EncounterPanelHeaderProps {
  encounterCount: number;
}

export default function EncounterPanelHeader({
  encounterCount,
}: EncounterPanelHeaderProps) {
  return (
    <div className="panel-header flex items-center justify-between px-3 py-2 shrink-0">
      <span className="panel-header-title">Encounters</span>
      <span className="text-[10px] text-gold-400/50">{encounterCount} saved</span>
    </div>
  );
}
