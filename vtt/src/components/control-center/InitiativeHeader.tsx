/**
 * STᚱ VTT — Initiative Header
 *
 * Title bar for the initiative tracker with combatant count and round number.
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
    <div className="flex items-center justify-between px-3 py-2 border-b border-surface-700/20 shrink-0">
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold text-gradient-arcane">Initiative</span>
        <span className="text-[10px] text-surface-500 bg-surface-800/50 px-1.5 py-0.5 rounded-full">
          {combatantCount}
        </span>
      </div>
      <span className="text-[10px] text-surface-500 uppercase tracking-wider">
        Round {round || 1}
      </span>
    </div>
  );
}
