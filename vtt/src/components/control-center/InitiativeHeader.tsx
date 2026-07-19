/**
 * STᚱ VTT — Initiative Header (Premium Gold)
 *
 * Gold-accented title bar for the initiative tracker.
 */

interface InitiativeHeaderProps {
  combatantCount: number;
  round: number;
}

export default function InitiativeHeader({
  combatantCount,
  round,
}: InitiativeHeaderProps) {
  return (
    <div className="panel-header flex items-center justify-between px-3 py-2 shrink-0">
      <div className="flex items-center gap-2">
        <span className="panel-header-title">Initiative</span>
        <span className="text-[10px] text-gold-400 bg-gold-500/10 border border-gold/15 px-1.5 py-0.5 rounded-full">
          {combatantCount}
        </span>
      </div>
      <span className="text-[10px] text-gold-400/60 uppercase tracking-wider">
        Round {round || 1}
      </span>
    </div>
  );
}
