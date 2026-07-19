import { useCampaignStore } from "@/stores/campaignStore";
import type { PlayerCharacter } from "@/types";
import PlayerSheetAbilityScores from "./PlayerSheetAbilityScores";
import PlayerSheetSavingThrows from "./PlayerSheetSavingThrows";
import PlayerSheetSkills from "./PlayerSheetSkills";

interface PlayerSheetStatsTabProps {
  character: PlayerCharacter;
}

export default function PlayerSheetStatsTab({ character }: PlayerSheetStatsTabProps) {
  const c = character;
  const updateCharacter = useCampaignStore((s) => s.updateCharacter);

  return (
    <div className="space-y-4 px-3 py-3">
      <button onClick={() => updateCharacter(c.id, { inspiration: !c.inspiration })}
        className={`w-full py-2 rounded-xl text-center text-xs font-semibold border active:scale-[0.98] transition-all ${
          c.inspiration ? "bg-amber-500/15 border-amber-500/30 text-amber-400" : "bg-surface-800/30 border-surface-700/20 text-surface-500"
        }`}>
        {c.inspiration ? "✦ Inspiration (Active)" : "✦ No Inspiration"}
      </button>

      <div className="rounded-xl bg-surface-800/30 border border-surface-700/20 p-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] uppercase tracking-widest font-black text-surface-400">Experience Points</span>
          <span className="text-xs font-mono font-bold text-surface-200 tabular-nums">{c.experiencePoints.toLocaleString()} XP</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-surface-500">Level {c.level} · Next level: {(c.level * 1000).toLocaleString()} XP needed</span>
          <span className="text-[10px] text-surface-500">
            {c.level < 20 ? `▲ ${((c.level * 1000) - c.experiencePoints).toLocaleString()} to go` : "✦ MAX"}
          </span>
        </div>
        <div className="h-1.5 bg-surface-700/60 rounded-full overflow-hidden mt-2">
          <div className="h-full bg-accent-500 rounded-full transition-all duration-300"
            style={{ width: `${c.level < 20 ? Math.min(100, (c.experiencePoints / (c.level * 1000)) * 100) : 100}%` }} />
        </div>
      </div>

      <PlayerSheetAbilityScores character={character} />
      <PlayerSheetSavingThrows character={character} />

      <div>
        <span className="text-[10px] uppercase tracking-widest font-black text-surface-400 block mb-1.5">Skills</span>
        <PlayerSheetSkills character={character} />
      </div>
    </div>
  );
}
