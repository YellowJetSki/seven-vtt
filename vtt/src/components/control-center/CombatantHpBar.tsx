/**
 * STᚱ VTT — Combatant HP Bar
 *
 * Small HP bar indicator for initiative tracker combatant rows.
 */

interface CombatantHpBarProps {
  current: number;
  max: number;
}

export default function CombatantHpBar({ current, max }: CombatantHpBarProps) {
  const ratio = max > 0 ? current / max : 1;
  const barColor =
    ratio > 0.5
      ? "bg-green-500"
      : ratio > 0.25
        ? "bg-amber-500"
        : "bg-red-500";

  return (
    <div className="flex items-center gap-1 shrink-0">
      <div className="w-12 h-1.5 bg-surface-700/60 rounded-full overflow-hidden">
        <div
          className={`h-full ${barColor} rounded-full transition-all duration-300`}
          style={{ width: `${Math.max(0, ratio * 100)}%` }}
        />
      </div>
      <span
        className={`text-[10px] font-mono ${
          current <= 3 && current > 0 ? "text-red-400" : "text-surface-400"
        }`}
      >
        {current}/{max}
      </span>
    </div>
  );
}
