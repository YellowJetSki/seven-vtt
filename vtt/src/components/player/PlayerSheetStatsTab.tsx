import { useMemo, useState } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import type { PlayerCharacter } from "@/types";
import { getProficiencyBonus } from "@/lib/mechanics/character-derivations";
import PlayerSheetAbilityScores from "./PlayerSheetAbilityScores";
import PlayerSheetSavingThrows from "./PlayerSheetSavingThrows";
import PlayerSheetSkills from "./PlayerSheetSkills";

interface PlayerSheetStatsTabProps {
  character: PlayerCharacter;
}

export default function PlayerSheetStatsTab({ character }: PlayerSheetStatsTabProps) {
  const c = character;
  const updateCharacter = useCampaignStore((s) => s.updateCharacter);
  const pb = useMemo(() => getProficiencyBonus(c.level), [c.level]);
  const [showTraits, setShowTraits] = useState(false);

  return (
    <div className="space-y-4 px-3 py-3">
      {/* Inspiration Toggle */}
      <button
        onClick={() => updateCharacter(c.id, { inspiration: !c.inspiration })}
        className={`w-full py-3 rounded-xl text-center text-xs font-semibold border active:scale-[0.98] transition-all duration-200 ${
          c.inspiration
            ? "bg-gold-500/10 border-gold/25 text-gold-400 shadow-[0_0_10px_rgba(234,179,8,0.06)]"
            : "bg-obsidian-mid/40 border-surface-700/20 text-surface-500 hover:border-gold/15 hover:text-gold-500/50"
        }`}
      >
        {c.inspiration ? "✦ Inspiration (Active)" : "✦ No Inspiration"}
      </button>

      {/* Experience & Level */}
      <div className="rounded-xl bg-obsidian-mid/40 border border-surface-700/20 p-3 hover:border-gold/10 transition-all duration-200">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] uppercase tracking-widest font-black text-gold-500/60">Experience Points</span>
          <span className="text-xs font-mono font-bold text-gold-300 tabular-nums drop-shadow-[0_0_4px_rgba(234,179,8,0.06)]">
            {c.experiencePoints.toLocaleString()} XP
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-surface-500">Level {c.level} · Next level: {(c.level * 1000).toLocaleString()} XP needed</span>
          <span className="text-[10px] text-surface-500">
            {c.level < 20
              ? `▲ ${Math.max(0, (c.level * 1000) - c.experiencePoints).toLocaleString()} to go`
              : "✦ MAX"}
          </span>
        </div>
        <div className="h-1.5 bg-surface-700/60 rounded-full overflow-hidden mt-2">
          <div
            className="h-full bg-gold-500 rounded-full transition-all duration-500 shadow-[0_0_6px_rgba(234,179,8,0.2)]"
            style={{
              width: `${
                c.level < 20
                  ? Math.min(100, (c.experiencePoints / (c.level * 1000)) * 100)
                  : 100
              }%`,
            }}
          />
        </div>
      </div>

      {/* Proficiency Bonus */}
      <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-obsidian-mid/40 border border-surface-700/10">
        <span className="text-[10px] uppercase tracking-widest text-gold-500/60 font-black">Proficiency Bonus</span>
        <span className="text-sm font-bold font-mono text-gold-300">+{pb}</span>
      </div>

      {/* Ability Scores */}
      <PlayerSheetAbilityScores character={character} />

      {/* Saving Throws */}
      <PlayerSheetSavingThrows character={character} />

      {/* Skills */}
      <div>
        <span className="text-[10px] uppercase tracking-widest font-black text-gold-500/60 block mb-1.5">Skills</span>
        <PlayerSheetSkills character={character} />
      </div>

      {/* Traits, Features & Languages (collapsible) */}
      <div className="rounded-xl bg-obsidian-mid/40 border border-surface-700/20 overflow-hidden">
        <button
          onClick={() => setShowTraits(!showTraits)}
          className="w-full flex items-center justify-between px-3 py-2.5"
        >
          <span className="text-[10px] uppercase tracking-widest font-black text-gold-500/60">
            Traits & Features
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-surface-500">
              {c.traits.length + c.features.length + c.languages.length} items
            </span>
            <span className={`text-gold-500/40 transform transition-transform duration-200 ${showTraits ? "rotate-180" : ""}`}>▼</span>
          </div>
        </button>

        {showTraits && (
          <div className="px-3 pb-3 space-y-3 animate-slide-in-up">
            {/* Languages */}
            {c.languages.length > 0 && (
              <div>
                <span className="text-[9px] uppercase tracking-widest text-gold-500/50 font-semibold block mb-1">Languages</span>
                <div className="flex flex-wrap gap-1">
                  {c.languages.map((lang) => (
                    <span key={lang} className="px-2 py-0.5 rounded text-[10px] bg-gold-500/8 text-gold-400 border border-gold/15">
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Racial Traits */}
            {c.traits.length > 0 && (
              <div>
                <span className="text-[9px] uppercase tracking-widest text-gold-500/50 font-semibold block mb-1">Racial Traits</span>
                <div className="flex flex-wrap gap-1">
                  {c.traits.map((trait) => (
                    <span key={typeof trait === "string" ? trait : trait.name} className="px-2 py-0.5 rounded text-[10px] bg-surface-700/30 text-surface-300 border border-surface-600/30">
                      {typeof trait === "string" ? trait : trait.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Class Features */}
            {c.features.length > 0 && (
              <div>
                <span className="text-[9px] uppercase tracking-widest text-gold-500/50 font-semibold block mb-1">Class Features</span>
                <div className="space-y-1">
                  {c.features.map((feat) => (
                    <div key={typeof feat === "string" ? feat : feat.name} className="flex items-center gap-2 px-2 py-1 rounded bg-surface-700/20">
                      <span className="text-[10px] text-surface-300">
                        {typeof feat === "string" ? feat : feat.name}
                      </span>
                      {typeof feat !== "string" && feat.description && (
                        <span className="text-[9px] text-surface-500 truncate">{feat.description}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Proficiencies */}
            {c.proficiencies.length > 0 && (
              <div>
                <span className="text-[9px] uppercase tracking-widest text-gold-500/50 font-semibold block mb-1">Proficiencies</span>
                <div className="flex flex-wrap gap-1">
                  {c.proficiencies.map((prof) => (
                    <span key={typeof prof === "string" ? prof : prof.name} className="px-2 py-0.5 rounded text-[10px] bg-surface-700/30 text-surface-300 border border-surface-600/30">
                      {typeof prof === "string" ? prof : prof.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
