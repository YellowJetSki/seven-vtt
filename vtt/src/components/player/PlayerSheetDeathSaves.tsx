import { useCallback } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import type { PlayerCharacter } from "@/types";

interface PlayerSheetDeathSavesProps {
  character: PlayerCharacter;
}

export default function PlayerSheetDeathSaves({ character }: PlayerSheetDeathSavesProps) {
  const c = character;
  const updateCharacter = useCampaignStore((s) => s.updateCharacter);

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

  return (
    <div className="rounded-xl bg-obsidian-mid/40 border border-surface-700/20 p-3 hover:border-gold/10 transition-all duration-200">
      <span className="text-[10px] uppercase tracking-widest font-black text-gold-500/60 block mb-2">Death Saves</span>
      <div className="flex items-center justify-center gap-6">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-green-400 uppercase font-semibold">Saved</span>
          {[0, 1, 2].map((i) => (
            <button key={i} onClick={() => handleDeathSave("success")}
              className={`w-9 h-9 rounded-full border-2 flex items-center justify-center text-sm font-bold active:scale-90 transition-all duration-150 ${
                c.deathSaves.successes > i ? "bg-green-500/20 border-green-500/50 text-green-400 shadow-[0_0_8px_rgba(34,197,94,0.15)]" : "border-surface-600/30 text-surface-500 hover:border-green-500/30"
              }`}>
              {c.deathSaves.successes > i ? "✓" : "○"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-red-400 uppercase font-semibold">Failed</span>
          {[0, 1, 2].map((i) => (
            <button key={i} onClick={() => handleDeathSave("failure")}
              className={`w-9 h-9 rounded-full border-2 flex items-center justify-center text-sm font-bold active:scale-90 transition-all duration-150 ${
                c.deathSaves.failures > i ? "bg-red-500/20 border-red-500/50 text-red-400 shadow-[0_0_8px_rgba(239,68,68,0.15)]" : "border-surface-600/30 text-surface-500 hover:border-red-500/30"
              }`}>
              {c.deathSaves.failures > i ? "✕" : "○"}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
