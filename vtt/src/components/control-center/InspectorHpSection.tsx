/**
 * STᚱ VTT — Inspector HP Section (Premium Gold)
 *
 * Gold-accented hit point editing section with current/max inputs,
 * quick damage/heal buttons, and visual HP bar.
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
      <label className="text-[10px] uppercase tracking-widest text-gold-500/60 font-black mb-1.5 block">
        Hit Points
      </label>
      <div className="flex items-center gap-2 mb-2">
        <div className="flex-1">
          <span className="text-[10px] text-surface-500">Current</span>
          <input
            type="number"
            value={hpCurrent}
            onChange={(e) => onCurrentChange(parseInt(e.target.value) || 0)}
            className="w-full py-1 px-2 text-xs bg-obsidian-mid/60 border border-surface-700/30 rounded-lg text-surface-200 focus:border-gold/30 focus:ring-1 focus:ring-gold/20 transition-all outline-none"
            min={0}
          />
        </div>
        <div className="flex-1">
          <span className="text-[10px] text-surface-500">Max</span>
          <input
            type="number"
            value={hpMax}
            onChange={(e) => onMaxChange(parseInt(e.target.value) || 0)}
            className="w-full py-1 px-2 text-xs bg-obsidian-mid/60 border border-surface-700/30 rounded-lg text-surface-200 focus:border-gold/30 focus:ring-1 focus:ring-gold/20 transition-all outline-none"
            min={0}
          />
        </div>
      </div>

      {/* Quick damage/heal buttons */}
      <div className="flex items-center gap-1 flex-wrap">
        <button
          onClick={() => onQuickDamage(1)}
          className="px-2 py-0.5 rounded text-[10px] bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-all duration-150 border border-red-500/10 hover:border-red-500/20"
        >
          -1
        </button>
        <button
          onClick={() => onQuickDamage(5)}
          className="px-2 py-0.5 rounded text-[10px] bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-all duration-150 border border-red-500/10 hover:border-red-500/20"
        >
          -5
        </button>
        <button
          onClick={() => onQuickDamage(10)}
          className="px-2 py-0.5 rounded text-[10px] bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-all duration-150 border border-red-500/10 hover:border-red-500/20"
        >
          -10
        </button>

        <span className="text-xs font-mono font-bold px-2 py-0.5 tabular-nums text-gold-300">
          {hpCurrent}/{hpMax}
        </span>

        <button
          onClick={() => onQuickHeal(1)}
          className="px-2 py-0.5 rounded text-[10px] bg-green-500/15 text-green-400 hover:bg-green-500/25 transition-all duration-150 border border-green-500/10 hover:border-green-500/20"
        >
          +1
        </button>
        <button
          onClick={() => onQuickHeal(5)}
          className="px-2 py-0.5 rounded text-[10px] bg-green-500/15 text-green-400 hover:bg-green-500/25 transition-all duration-150 border border-green-500/10 hover:border-green-500/20"
        >
          +5
        </button>
        <button
          onClick={() => onQuickHeal(10)}
          className="px-2 py-0.5 rounded text-[10px] bg-green-500/15 text-green-400 hover:bg-green-500/25 transition-all duration-150 border border-green-500/10 hover:border-green-500/20"
        >
          +10
        </button>
      </div>

      {/* HP bar */}
      <div className="mt-1.5 h-1.5 bg-surface-700/60 rounded-full overflow-hidden shadow-inner">
        <div
          className={`h-full rounded-full transition-all duration-300 ${barColor}`}
          style={{ width: `${Math.max(0, hpRatio * 100)}%` }}
        />
      </div>
    </div>
  );
}
