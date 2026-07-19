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
        className={`w-full py-3 rounded-xl text-center text-xs font-semibold border active:scale-[0.98] transition-all duration-200 ${
          c.inspiration ? "bg-gold-500/10 border-gold/25 text-gold-400 shadow-[0_0_10px_rgba(234,179,8,0.06)]" : "bg-obsidian-mid/40 border-surface-700/20 text-surface-500 hover:border-gold/15 hover:text-gold-500/50"
        }`}>
        {c.inspiration ? "✦ Inspiration (Active)" : "✦ No Inspiration"}
      </button>

      <div className="rounded-xl bg-obsidian-mid/40 border border-surface-700/20 p-3 hover:border-gold/10 transition-all duration-200">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] uppercase tracking-widest font-black text-gold-500/60">Experience Points</span>
          <span className="text-xs font-mono font-bold text-gold-300 tabular-nums drop-shadow-[0_0_4px_rgba(234,179,8,0.06)]">{c.experiencePoints.toLocaleString()} XP</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-surface-500">Level {c.level} · Next level: {(c.level * 1000).toLocaleString()} XP needed</span>
          <span className="text-[10px] text-surface-500">
            {c.level < 20 ? `▲ ${((c.level * 1000) - c.experiencePoints).toLocaleString()} to go` : "✦ MAX"}
          </span>
        </div>
        <div className="h-1.5 bg-surface-700/60 rounded-full overflow-hidden mt-2">
          <div className="h-full bg-gold-500 rounded-full transition-all duration-500 shadow-[0_0_6px_rgba(234,179,8,0.2)]"
            style={{ width: `${c.level < 20 ? Math.min(100, (c.experiencePoints / (c.level * 1000)) * 100) : 100}%` }} />
        </div>
      </div>

      <PlayerSheetAbilityScores character={character} />
      <PlayerSheetSavingThrows character={character} />

      <div>
        <span className="text-[10px] uppercase tracking-widest font-black text-gold-500/60 block mb-1.5">Skills</span>
        <PlayerSheetSkills character={character} />
      </div>
    </div>
  );
}
