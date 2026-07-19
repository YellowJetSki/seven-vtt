import { useState, useCallback } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import type { PlayerCharacter } from "@/types";

function modStr(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

interface PlayerSheetCombatTabProps {
  character: PlayerCharacter;
}

export default function PlayerSheetCombatTab({ character }: PlayerSheetCombatTabProps) {
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

  const handleTempHp = useCallback(
    (amount: number) => {
      updateCharacter(c.id, { temporaryHitPoints: Math.max(0, (c.temporaryHitPoints || 0) + amount) });
    },
    [c, updateCharacter]
  );

  const handleDeathSave = useCallback(
    (type: "success" | "failure") => {
      const ds = { ...c.deathSaves };
      if (type === "success") {
        ds.successes = Math.min(3, ds.successes + 1);
        if (ds.successes >= 3) { ds.successes = 0; ds.failures = 0; }
      } else {
        ds.failures = Math.min(3, ds.failures + 1);
        if (ds.failures >= 3) { ds.successes = 0; ds.failures = 0; }
      }
      updateCharacter(c.id, { deathSaves: ds });
    },
    [c, updateCharacter]
  );

  const hpRatio = c.hitPoints.max > 0 ? c.hitPoints.current / c.hitPoints.max : 1;
  const hpColor = hpRatio > 0.5 ? "bg-green-500" : hpRatio > 0.25 ? "bg-amber-500" : "bg-red-500";
  const hasTemp = (c.temporaryHitPoints || 0) > 0;

  const allConditions = [
    "Blinded", "Charmed", "Deafened", "Frightened", "Grappled",
    "Incapacitated", "Invisible", "Paralyzed", "Petrified",
    "Poisoned", "Prone", "Restrained", "Stunned", "Unconscious",
  ];

  return (
    <div className="space-y-4 px-3 py-3">
      {/* HP Section */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] uppercase tracking-widest font-black text-surface-400">Hit Points</span>
          <span className="text-sm font-mono font-bold tabular-nums">
            {c.hitPoints.current}
            <span className="text-surface-500 font-normal">/{c.hitPoints.max}</span>
            {hasTemp && <span className="text-mage-400 text-xs ml-1">+{c.temporaryHitPoints} tmp</span>}
          </span>
        </div>
        <div className="h-4 bg-surface-700/60 rounded-full overflow-hidden relative">
          <div className={`h-full ${hpColor} rounded-full transition-all duration-300`} style={{ width: `${Math.max(0, hpRatio * 100)}%` }} />
          {hasTemp && (
            <div className="absolute top-0 h-full bg-mage-500/40 rounded-full"
              style={{
                left: `${Math.min(100, hpRatio * 100)}%`,
                width: `${Math.min(100 - hpRatio * 100, ((c.temporaryHitPoints || 0) / c.hitPoints.max) * 100)}%`,
              }}
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <button onClick={() => handleHpChange(-10)}
          className="py-3 rounded-xl bg-red-500/15 border border-red-500/20 text-red-400 text-lg font-bold active:scale-95 transition-transform">
          -10
        </button>
        <button onClick={() => handleHpChange(-5)}
          className="py-3 rounded-xl bg-red-500/15 border border-red-500/20 text-red-400 text-lg font-bold active:scale-95 transition-transform">
          -5
        </button>
        <button onClick={() => handleHpChange(5)}
          className="py-3 rounded-xl bg-green-500/15 border border-green-500/20 text-green-400 text-lg font-bold active:scale-95 transition-transform">
          +5
        </button>
        <button onClick={() => handleHpChange(10)}
          className="py-3 rounded-xl bg-green-500/15 border border-green-500/20 text-green-400 text-lg font-bold active:scale-95 transition-transform">
          +10
        </button>
      </div>

      <div className="flex items-center gap-2">
        <input type="number" value={hpInput} onChange={(e) => setHpInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleHpInput(); }}
          placeholder="Custom amount (+/-)"
          className="flex-1 py-3 px-3 text-sm bg-surface-800/50 border border-surface-700/30 rounded-xl text-surface-200 placeholder-surface-500 focus:outline-none focus:border-accent-500/40" />
        <button onClick={handleHpInput}
          className="px-5 py-3 bg-accent-600/20 border border-accent-500/20 text-accent-300 text-sm font-semibold rounded-xl active:scale-95 transition-transform">
          Apply
        </button>
      </div>

      {/* Temp HP */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-widest font-black text-mage-400">Temp HP</span>
        <div className="flex items-center gap-2">
          <button onClick={() => handleTempHp(-5)}
            className="px-3 py-1.5 rounded-lg bg-surface-800/40 border border-surface-700/20 text-surface-400 text-sm active:scale-95 transition-transform">
            -5
          </button>
          <span className="text-sm font-mono font-bold text-mage-400 w-8 text-center tabular-nums">{c.temporaryHitPoints || 0}</span>
          <button onClick={() => handleTempHp(5)}
            className="px-3 py-1.5 rounded-lg bg-mage-500/15 border border-mage-500/20 text-mage-400 text-sm active:scale-95 transition-transform">
            +5
          </button>
        </div>
      </div>

      {/* Death Saves */}
      <div className="rounded-xl bg-surface-800/30 border border-surface-700/20 p-3">
        <span className="text-[10px] uppercase tracking-widest font-black text-surface-400 block mb-2">Death Saves</span>
        <div className="flex items-center justify-center gap-6">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-green-400 uppercase font-semibold">Saved</span>
            {[0, 1, 2].map((i) => (
              <button key={i} onClick={() => handleDeathSave("success")}
                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold active:scale-90 transition-transform ${
                  c.deathSaves.successes > i ? "bg-green-500/20 border-green-500/50 text-green-400" : "border-surface-600/30 text-surface-500"
                }`}>
                {c.deathSaves.successes > i ? "✓" : "○"}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-red-400 uppercase font-semibold">Failed</span>
            {[0, 1, 2].map((i) => (
              <button key={i} onClick={() => handleDeathSave("failure")}
                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold active:scale-90 transition-transform ${
                  c.deathSaves.failures > i ? "bg-red-500/20 border-red-500/50 text-red-400" : "border-surface-600/30 text-surface-500"
                }`}>
                {c.deathSaves.failures > i ? "✕" : "○"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Combat Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col items-center bg-surface-800/40 rounded-xl border border-surface-700/20 py-2.5">
          <span className="text-[9px] uppercase tracking-widest font-black text-surface-500">AC</span>
          <span className="text-2xl font-bold tabular-nums mt-0.5">{c.armorClass}</span>
        </div>
        <div className="flex flex-col items-center bg-surface-800/40 rounded-xl border border-surface-700/20 py-2.5">
          <span className="text-[9px] uppercase tracking-widest font-black text-surface-500">Init</span>
          <span className="text-2xl font-bold tabular-nums mt-0.5">{modStr(c.initiative)}</span>
        </div>
        <div className="flex flex-col items-center bg-surface-800/40 rounded-xl border border-surface-700/20 py-2.5">
          <span className="text-[9px] uppercase tracking-widest font-black text-surface-500">Speed</span>
          <span className="text-2xl font-bold tabular-nums mt-0.5">{c.speed.walk}</span>
        </div>
      </div>

      {/* Conditions */}
      <div>
        <span className="text-[10px] uppercase tracking-widest font-black text-surface-400 block mb-1.5">Conditions</span>
        <div className="flex flex-wrap gap-1.5">
          {allConditions.map((cond) => {
            const isActive = c.conditions.includes(cond.toLowerCase());
            return (
              <button key={cond} onClick={() => {
                const updated = isActive
                  ? c.conditions.filter((x) => x !== cond.toLowerCase())
                  : [...c.conditions, cond.toLowerCase()];
                updateCharacter(c.id, { conditions: updated });
              }}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold active:scale-95 transition-all duration-150 border ${
                  isActive ? "bg-accent-600/20 border-accent-500/30 text-accent-300" : "bg-surface-800/30 border-surface-700/20 text-surface-400 hover:bg-surface-700/40"
                }`}>
                {cond}
              </button>
            );
          })}
        </div>
      </div>

      {/* Hit Dice */}
      <div className="flex items-center justify-between rounded-xl bg-surface-800/30 border border-surface-700/20 p-3">
        <span className="text-[10px] uppercase tracking-widest font-black text-surface-400">Hit Dice</span>
        <span className="text-sm font-mono font-bold tabular-nums text-surface-200">{c.hitDice}</span>
      </div>
    </div>
  );
}
