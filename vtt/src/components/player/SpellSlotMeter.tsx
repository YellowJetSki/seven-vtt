import { useState } from "react";
import type { SpellLevel, SpellSlotsFull, CasterType } from "@/types";
import { getSlotSummary } from "@/lib/mechanics/spell-slot-engine";

interface SpellSlotMeterProps {
  slots: SpellSlotsFull;
  casterType: CasterType;
  spellSaveDC: number;
  spellAttackBonus: number;
  onCast?: (level: SpellLevel) => void;
  onRestore?: (level?: SpellLevel) => void;
  concentrationSpell?: string | null;
}

export default function SpellSlotMeter({
  slots, casterType, spellSaveDC, spellAttackBonus,
  onCast, onRestore, concentrationSpell,
}: SpellSlotMeterProps) {
  const [expanded, setExpanded] = useState(false);
  const summary = getSlotSummary(slots);
  const totalSlots = summary.reduce((s, x) => s + x.max, 0);
  const usedSlots = summary.reduce((s, x) => s + (x.max - x.current), 0);

  if (totalSlots === 0) {
    return (
      <div className="space-y-2 p-3 rounded-lg bg-surface-800/40 border border-surface-700/20">
        <h3 className="text-[10px] uppercase tracking-widest text-surface-500 font-black">Spellcasting</h3>
        <p className="text-xs text-surface-500 italic">No spell slots available</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 p-3 rounded-lg bg-surface-800/40 border border-surface-700/20">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between"
      >
        <h3 className="text-[10px] uppercase tracking-widest text-surface-500 font-black">Spellcasting</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-surface-400">{usedSlots}/{totalSlots} used</span>
          <span className={`text-surface-500 transform transition-transform ${expanded ? "rotate-180" : ""}`}>▼</span>
        </div>
      </button>

      {expanded && (
        <div className="space-y-2">
          {/* DC & Attack Bonus */}
          <div className="flex gap-2 text-[10px]">
            <div className="px-2 py-1 rounded bg-mage-500/15 text-mage-300 border border-mage-500/20">
              DC {spellSaveDC}
            </div>
            <div className="px-2 py-1 rounded bg-rogue-500/15 text-rogue-300 border border-rogue-500/20">
              +{spellAttackBonus} ATK
            </div>
          </div>

          {/* Concentration */}
          {concentrationSpell && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-accent-500/15 text-[10px] text-accent-300 border border-accent-500/20">
              <span className="animate-pulse-soft">🧘</span>
              <span>Concentrating: {concentrationSpell}</span>
            </div>
          )}

          {/* Slot gauges */}
          <div className="grid grid-cols-3 gap-1.5">
            {summary.map(({ level, current, max }) => {
              const pct = max > 0 ? (current / max) * 100 : 0;
              return (
                <div key={level} className="px-2 py-1.5 rounded bg-surface-800/60 border border-surface-700/30">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-surface-300">Lv.{level}</span>
                    <span className="text-[9px] text-surface-500">{current}/{max}</span>
                  </div>
                  <div className="h-1.5 bg-surface-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-mage-500 transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex gap-1 mt-1">
                    <button
                      onClick={() => onCast?.(level as SpellLevel)}
                      disabled={current <= 0}
                      className="flex-1 py-0.5 rounded text-[8px] font-medium bg-accent-600/20 text-accent-400 border border-accent-500/20 hover:bg-accent-600/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      aria-label={`Cast level ${level} spell`}
                    >
                      Cast
                    </button>
                    <button
                      onClick={() => onRestore?.(level as SpellLevel)}
                      disabled={current >= max}
                      className="flex-1 py-0.5 rounded text-[8px] font-medium bg-rogue-600/20 text-rogue-400 border border-rogue-500/20 hover:bg-rogue-600/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      aria-label={`Restore level ${level} slot`}
                    >
                      Rest
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Restore All */}
          <button
            onClick={() => onRestore?.()}
            className="w-full py-1.5 rounded text-[10px] font-medium bg-rogue-600/15 text-rogue-300 border border-rogue-500/20 hover:bg-rogue-600/30 transition-colors"
          >
            🔄 Restore All Slots (Long Rest)
          </button>
        </div>
      )}
    </div>
  );
}
