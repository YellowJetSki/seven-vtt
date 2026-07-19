/**
 * STᚱ VTT — Inspector HP Section (Premium)
 *
 * HP management section with current/max HP inputs, plus quick damage/heal buttons.
 * Gold-accented inputs with color-coded HP fraction display.
 */

interface InspectorHpSectionProps {
  hpCurrent: number;
  hpMax: number;
  onCurrentChange: (value: number) => void;
  onMaxChange: (value: number) => void;
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
  const hpColor = hpRatio > 0.5 ? "text-emerald-400" : hpRatio > 0.25 ? "text-amber-400" : "text-red-400";

  return (
    <div className="space-y-2.5">
      <label className="text-[10px] uppercase tracking-wider text-surface-500 font-medium">
        Hit Points
      </label>

      {/* HP fraction display */}
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <span className="text-[9px] text-surface-500 block mb-0.5">Current</span>
          <input
            type="number"
            value={hpCurrent}
            onChange={(e) => onCurrentChange(Number(e.target.value))}
            className={`w-full px-2.5 py-1.5 rounded-lg text-xs bg-[#0c0d15] border border-white/[0.06] ${hpColor} focus:outline-none focus:border-gold-500/25 focus:ring-1 focus:ring-gold-500/15 transition-all duration-200 font-mono tabular-nums`}
          />
        </div>
        <div className="flex items-center self-end pb-1.5">
          <span className="text-xs text-surface-500 font-mono">/</span>
        </div>
        <div className="flex-1">
          <span className="text-[9px] text-surface-500 block mb-0.5">Max</span>
          <input
            type="number"
            value={hpMax}
            onChange={(e) => onMaxChange(Number(e.target.value))}
            className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-[#0c0d15] border border-white/[0.06] text-white/80 focus:outline-none focus:border-gold-500/25 focus:ring-1 focus:ring-gold-500/15 transition-all duration-200 font-mono tabular-nums"
          />
        </div>
      </div>

      {/* HP visual bar */}
      <div className="h-1.5 bg-[#0c0d15] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            hpRatio > 0.5 ? "bg-emerald-500/60" : hpRatio > 0.25 ? "bg-amber-500/60" : "bg-red-500/60"
          }`}
          style={{ width: `${Math.max(0, hpRatio * 100)}%` }}
        />
      </div>

      {/* Quick damage / heal buttons */}
      <div className="grid grid-cols-4 gap-1.5">
        <button
          onClick={() => onQuickDamage(10)}
          className="px-2 py-1.5 rounded-lg text-[9px] font-bold bg-red-500/10 text-red-400 border border-red-500/10 hover:bg-red-500/15 hover:border-red-500/20 active:scale-95 transition-all duration-150"
        >
          -10
        </button>
        <button
          onClick={() => onQuickDamage(5)}
          className="px-2 py-1.5 rounded-lg text-[9px] font-bold bg-red-500/8 text-red-400/80 border border-red-500/8 hover:bg-red-500/12 hover:border-red-500/15 active:scale-95 transition-all duration-150"
        >
          -5
        </button>
        <button
          onClick={() => onQuickHeal(5)}
          className="px-2 py-1.5 rounded-lg text-[9px] font-bold bg-emerald-500/8 text-emerald-400/80 border border-emerald-500/8 hover:bg-emerald-500/12 hover:border-emerald-500/15 active:scale-95 transition-all duration-150"
        >
          +5
        </button>
        <button
          onClick={() => onQuickHeal(10)}
          className="px-2 py-1.5 rounded-lg text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 hover:bg-emerald-500/15 hover:border-emerald-500/20 active:scale-95 transition-all duration-150"
        >
          +10
        </button>
      </div>
    </div>
  );
}
