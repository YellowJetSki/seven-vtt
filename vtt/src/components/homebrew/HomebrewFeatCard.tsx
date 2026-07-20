/**
 * STᚱ VTT — Homebrew Feat Card (Premium Glass v3.1)
 *
 * Premium feat card with gold gradient hover, staggered entrance,
 * ability score increase display, skill proficiency badges,
 * duplicate action, visibility toggle, bulk-select checkbox,
 * and hover-reveal actions.
 */

import { Edit3, Trash2, Copy, Eye, EyeOff } from "lucide-react";
import type { HomebrewFeat } from "@/types/homebrew";

interface HomebrewFeatCardProps {
  feat: HomebrewFeat;
  onEdit: (feat: HomebrewFeat) => void;
  onDelete: (id: string) => void;
  onDuplicate: (feat: HomebrewFeat) => void;
  onToggleVisibility: (id: string, visible: boolean) => void;
  isBulkMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
}

const ABILITY_LABELS: Record<string, string> = {
  strength: "STR", dexterity: "DEX", constitution: "CON",
  intelligence: "INT", wisdom: "WIS", charisma: "CHA",
};

export default function HomebrewFeatCard({
  feat,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleVisibility,
  isBulkMode,
  isSelected,
  onToggleSelect,
}: HomebrewFeatCardProps) {
  const abilityIncreaseList = feat.abilityScoreIncrease
    ? feat.abilityScoreIncrease.split(",").filter(Boolean)
    : [];

  return (
    <div
      className={`relative rounded-xl p-3 transition-all duration-200 group ${
        isSelected
          ? "bg-gradient-to-b from-gold-500/10 to-gold-500/5 border border-gold-500/25 shadow-[0_0_12px_rgba(234,179,8,0.04)]"
          : "bg-gradient-to-b from-[#14151f]/60 to-[#0f1019]/70 border border-white/[0.04] hover:border-gold-500/15 hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(0,0,0,0.2)]"
      }`}
    >
      {/* Gold edge light on hover */}
      <div className="absolute top-0 left-3 right-3 h-px bg-gradient-to-r from-transparent via-gold-500/0 to-transparent transition-all duration-300 group-hover:via-gold-500/15" />

      <div className="flex items-start justify-between gap-2">
        {isBulkMode && onToggleSelect && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(feat.id)}
            className="mt-1 rounded border-surface-600 bg-surface-800 accent-gold-500 w-3.5 h-3.5 shrink-0"
          />
        )}

        <div className="flex-1 min-w-0">
          {/* Name + Prerequisites Row */}
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-semibold text-white/80 truncate group-hover:text-gold-200 transition-colors">
              {feat.name}
            </h4>
            {feat.repeatable && (
              <span className="text-[8px] px-1 py-0.5 rounded bg-amber-500/10 border border-amber-500/15 text-amber-400/80">
                Repeatable
              </span>
            )}
            {feat.prerequisites && feat.prerequisites.length > 0 && (
              <span className="text-[8px] text-surface-500">
                Prereq: {feat.prerequisites.map((p) => `${ABILITY_LABELS[(p.ability as keyof typeof ABILITY_LABELS)] || p.ability} ${p.minimumValue}`).join(", ")}
              </span>
            )}
          </div>

          {/* Ability Increase + Skill Proficiencies */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {abilityIncreaseList.length > 0 && abilityIncreaseList.map((abil) => (
              <span key={abil} className="text-[9px] px-1.5 py-0.5 rounded bg-gold-500/10 border border-gold-500/15 text-gold-400 font-mono">
                +1 {ABILITY_LABELS[abil.trim()] || abil.trim().toUpperCase()}
              </span>
            ))}
            {feat.skillProficiencies && feat.skillProficiencies.length > 0 && feat.skillProficiencies.slice(0, 4).map((skill) => (
              <span key={skill} className="text-[8px] px-1 py-0.5 rounded bg-violet-500/10 border border-violet-500/15 text-violet-400">
                {skill}
              </span>
            ))}
            {feat.skillProficiencies && feat.skillProficiencies.length > 4 && (
              <span className="text-[8px] text-surface-500">+{feat.skillProficiencies.length - 4} more</span>
            )}
          </div>

          {/* Benefits */}
          {feat.benefits && feat.benefits.length > 0 && (
            <div className="mt-1.5 text-[10px] text-surface-500 line-clamp-2 leading-relaxed">
              {feat.benefits.slice(0, 2).map((b, i) => (
                <span key={i}>{b}{i < Math.min(feat.benefits.length, 2) - 1 ? " · " : ""}</span>
              ))}
              {feat.benefits.length > 2 && <span className="text-surface-600"> · +{feat.benefits.length - 2} more</span>}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onToggleVisibility(feat.id, !feat.visibleToPlayers)}
            className={`p-1.5 rounded-lg transition-all duration-150 active:scale-90 ${
              feat.visibleToPlayers
                ? "text-gold-400/80 hover:bg-gold-500/10"
                : "text-surface-600 hover:text-surface-400 hover:bg-surface-800/40"
            }`}
            title={feat.visibleToPlayers ? "Visible to players" : "DM only"}
          >
            {feat.visibleToPlayers ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => onDuplicate(feat)}
            className="p-1.5 rounded-lg text-surface-600 hover:text-gold-400 hover:bg-gold-500/10 active:scale-90 transition-all duration-150 opacity-0 group-hover:opacity-100"
            title="Duplicate"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onEdit(feat)}
            className="p-1.5 rounded-lg text-surface-600 hover:text-gold-400 hover:bg-gold-500/10 active:scale-90 transition-all duration-150 opacity-0 group-hover:opacity-100"
            title="Edit"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(feat.id)}
            className="p-1.5 rounded-lg text-surface-600 hover:text-rose-400 hover:bg-rose-500/10 active:scale-90 transition-all duration-150 opacity-0 group-hover:opacity-100"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
