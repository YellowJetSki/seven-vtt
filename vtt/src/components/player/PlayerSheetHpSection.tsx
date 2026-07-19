import { useState, useCallback } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import type { PlayerCharacter } from "@/types";

interface PlayerSheetHpSectionProps {
  character: PlayerCharacter;
}

export default function PlayerSheetHpSection({ character }: PlayerSheetHpSectionProps) {
  const c = character;
  const updateCharacter = useCampaignStore((s) => s.updateCharacter);
  const [hpInput, setHpInput] = useState("");

  const handleHpChange = useCallback(
    (delta: number) => {
      const newHp = Math.max(0, Math.min(c.hitPoints.max, c.hitPoints.current + delta));
      updateCharacter(c.id, { hitPoints: { ...c.hitPoints, current: newHp } });
    },
    [c, updateCharacter]
  );

  const handleHpInput = useCallback(() => {
    const val = parseInt(hpInput, 10);
    if (isNaN(val)) return;
    handleHpChange(val);
    setHpInput("");
  }, [hpInput, handleHpChange]);

  const hpRatio = c.hitPoints.max > 0 ? c.hitPoints.current / c.hitPoints.max : 1;
  const hpColor = hpRatio > 0.5 ? "bg-green-500" : hpRatio > 0.25 ? "bg-amber-500" : "bg-red-500";
  const hasTemp = (c.temporaryHitPoints || 0) > 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] uppercase tracking-widest font-black text-gold-500/60">Hit Points</span>
        <span className="text-sm font-mono font-bold tabular-nums text-gold-300">
          {c.hitPoints.current}
          <span className="text-surface-500 font-normal">/{c.hitPoints.max}</span>
          {hasTemp && <span className="text-gold-400 text-xs ml-1">+{c.temporaryHitPoints} tmp</span>}
        </span>
      </div>
      <div className="h-4 bg-surface-700/60 rounded-full overflow-hidden relative shadow-inner">
        <div className={`h-full ${hpColor} rounded-full transition-all duration-500`} style={{ width: `${Math.max(0, hpRatio * 100)}%` }} />
        {hasTemp && (
          <div className="absolute top-0 h-full bg-gold-500/30 rounded-full"
            style={{
              left: `${Math.min(100, hpRatio * 100)}%`,
              width: `${Math.min(100 - hpRatio * 100, ((c.temporaryHitPoints || 0) / c.hitPoints.max) * 100)}%`,
            }}
          />
        )}
      </div>

      <div className="grid grid-cols-4 gap-2 mt-3">
        <button onClick={() => handleHpChange(-10)} className="py-3.5 rounded-xl bg-red-500/15 border border-red-500/20 text-red-400 text-lg font-bold active:scale-95 transition-all duration-150 hover:bg-red-500/20">-10</button>
        <button onClick={() => handleHpChange(-5)} className="py-3.5 rounded-xl bg-red-500/15 border border-red-500/20 text-red-400 text-lg font-bold active:scale-95 transition-all duration-150 hover:bg-red-500/20">-5</button>
        <button onClick={() => handleHpChange(5)} className="py-3.5 rounded-xl bg-green-500/15 border border-green-500/20 text-green-400 text-lg font-bold active:scale-95 transition-all duration-150 hover:bg-green-500/20">+5</button>
        <button onClick={() => handleHpChange(10)} className="py-3.5 rounded-xl bg-green-500/15 border border-green-500/20 text-green-400 text-lg font-bold active:scale-95 transition-all duration-150 hover:bg-green-500/20">+10</button>
      </div>

      <div className="flex items-center gap-2 mt-3">
        <input type="number" value={hpInput} onChange={(e) => setHpInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleHpInput(); }}
          placeholder="Custom amount (+/-)"
          className="flex-1 py-3 px-3 text-sm bg-obsidian-mid/60 border border-surface-700/30 rounded-xl text-surface-200 placeholder-surface-500 focus:outline-none focus:border-gold/30 focus:ring-1 focus:ring-gold/20 transition-all" />
        <button onClick={handleHpInput}
          className="px-5 py-3 bg-gold-500/10 border border-gold/20 text-gold-400 text-sm font-semibold rounded-xl active:scale-95 transition-all duration-150 hover:bg-gold-500/15">
          Apply
        </button>
      </div>
    </div>
  );
}
