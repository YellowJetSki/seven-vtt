/**
 * STᚱ VTT — Inspector HP Section
 *
 * Hit point editing section with current/max inputs, quick damage/heal buttons,
 * and a visual HP bar for the token inspector.
 */

interface InspectorHpSectionProps {
  hpCurrent: number;
  hpMax: number;
  onCurrentChange: (val: number) => void;
  onMaxChange: (val: number) => void;
  onQuickDamage: (amount: number) => void;
  onQuickHeal: (amount: number) => void;
}

export default function InspectorHpSection({
  hpCurrent,
  hpMax,
  onCurrentChange,
  onMaxChange,
  onQuickDamage,
  onQuickHeal,
}: InspectorHpSectionProps) {
  const hpRatio = hpMax > 0 ? hpCurrent / hpMax : 1;
  const barColor =
    hpRatio > 0.5
      ? "bg-green-500"
      : hpRatio > 0.25
        ? "bg-amber-500"
        : "bg-red-500";

  return (
    <div>
      <label className="text-[10px] uppercase tracking-widest text-surface-500 font-black mb-1 block">
        Hit Points
      </label>
      <div className="flex items-center gap-2 mb-2">
        <div className="flex-1">
          <span className="text-[10px] text-surface-500">Current</span>
          <input
            type="number"
            value={hpCurrent}
            onChange={(e) => onCurrentChange(parseInt(e.target.value) || 0)}
            className="input-arcane w-full py-1 px-2 text-xs"
            min={0}
          />
        </div>
        <div className="flex-1">
          <span className="text-[10px] text-surface-500">Max</span>
          <input
            type="number"
            value={hpMax}
            onChange={(e) => onMaxChange(parseInt(e.target.value) || 0)}
            className="input-arcane w-full py-1 px-2 text-xs"
            min={0}
          />
        </div>
      </div>

      {/* Quick damage/heal buttons */}
      <div className="flex items-center gap-1 flex-wrap">
        <button
          onClick={() => onQuickDamage(1)}
          className="px-2 py-0.5 rounded text-[10px] bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors"
        >
          -1
        </button>
        <button
          onClick={() => onQuickDamage(5)}
          className="px-2 py-0.5 rounded text-[10px] bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors"
        >
          -5
        </button>
        <button
          onClick={() => onQuickDamage(10)}
          className="px-2 py-0.5 rounded text-[10px] bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors"
        >
          -10
        </button>

        <span className="text-xs font-mono font-bold px-2 py-0.5 tabular-nums text-surface-300">
          {hpCurrent}/{hpMax}
        </span>

        <button
          onClick={() => onQuickHeal(1)}
          className="px-2 py-0.5 rounded text-[10px] bg-green-500/15 text-green-400 hover:bg-green-500/25 transition-colors"
        >
          +1
        </button>
        <button
          onClick={() => onQuickHeal(5)}
          className="px-2 py-0.5 rounded text-[10px] bg-green-500/15 text-green-400 hover:bg-green-500/25 transition-colors"
        >
          +5
        </button>
        <button
          onClick={() => onQuickHeal(10)}
          className="px-2 py-0.5 rounded text-[10px] bg-green-500/15 text-green-400 hover:bg-green-500/25 transition-colors"
        >
          +10
        </button>
      </div>

      {/* HP bar */}
      <div className="mt-1.5 h-1.5 bg-surface-700/60 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${barColor}`}
          style={{ width: `${Math.max(0, hpRatio * 100)}%` }}
        />
      </div>
    </div>
  );
}
