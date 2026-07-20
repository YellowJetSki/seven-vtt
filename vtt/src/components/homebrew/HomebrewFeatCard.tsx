/**
 * STᚱ VTT — Homebrew Feat Card (v2.0)
 *
 * Enhanced with ability score increase display, skill proficiency display,
 * duplicate action, visible toggle, and bulk-select checkbox.
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
    <div className={`premium-surface rounded-xl p-3 hover-lift group transition-all duration-200 ${isSelected ? "ring-2 ring-gold/30 bg-gold-500/5" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        {isBulkMode && onToggleSelect && (
          <input
            type="checkbox"
            checked={!!isSelected}
            onChange={() => onToggleSelect(feat.id)}
            className="mt-1 rounded border-surface-600 bg-surface-800 accent-gold-500 shrink-0"
          />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-surface-200 truncate">{feat.name}</span>
            {feat.repeatable && <span className="text-[10px] text-amber-400">↻ Repeatable</span>}
            <span className={`text-[10px] ${feat.visibleToPlayers ? "text-gold-400" : "text-surface-600"}`} title={feat.visibleToPlayers ? "Visible to players" : "DM only"}>
              {feat.visibleToPlayers ? <Eye className="w-3 h-3 inline" /> : <EyeOff className="w-3 h-3 inline" />}
            </span>
          </div>

          <p className="text-xs text-surface-500 mt-1 line-clamp-2">{feat.description}</p>

          {/* Ability Score Increases */}
          {abilityIncreaseList.length > 0 && (
            <div className="flex gap-1 mt-1.5">
              {abilityIncreaseList.map((ab, i) => (
                <span key={i} className="text-[10px] bg-gold-500/10 text-gold-400 px-1.5 py-0.5 rounded font-medium">
                  +1 {ab.slice(0, 3).toUpperCase()}
                </span>
              ))}
            </div>
          )}

          {/* Skill Proficiencies */}
          {feat.skillProficiencies && feat.skillProficiencies.length > 0 && (
            <div className="flex gap-1 mt-1.5 flex-wrap">
              {feat.skillProficiencies.map((sk, i) => (
                <span key={i} className="text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded">
                  {sk.replace(/_/g, " ")}
                </span>
              ))}
            </div>
          )}

          {/* Prerequisites */}
          {feat.prerequisites && feat.prerequisites.length > 0 && (
            <div className="flex gap-1 mt-1.5 flex-wrap">
              {feat.prerequisites.map((p, i) => (
                <span key={i} className="text-[10px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded">
                  {p.ability ? `${p.ability.slice(0, 3).toUpperCase()} ${p.minimumValue}+` : p.description}
                </span>
              ))}
            </div>
          )}

          {/* Benefits Preview */}
          {feat.benefits && feat.benefits.length > 0 && (
            <p className="text-[10px] text-surface-400 mt-1">
              ✓ {feat.benefits[0]}{feat.benefits.length > 1 ? ` +${feat.benefits.length - 1} more` : ""}
            </p>
          )}
        </div>

        {!isBulkMode && (
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={() => onToggleVisibility(feat.id, !feat.visibleToPlayers)} className="p-1.5 rounded-lg hover:bg-gold-500/10 text-surface-500 hover:text-gold-400 transition-all active:scale-90" title={feat.visibleToPlayers ? "Hide from players" : "Show to players"}>
              {feat.visibleToPlayers ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            </button>
            <button onClick={() => onDuplicate(feat)} className="p-1.5 rounded-lg hover:bg-gold-500/10 text-surface-400 hover:text-gold-400 transition-all active:scale-90" title="Duplicate">
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => onEdit(feat)} className="p-1.5 rounded-lg hover:bg-gold-500/10 text-surface-400 hover:text-gold-400 transition-all duration-150 active:scale-90">
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => onDelete(feat.id)} className="p-1.5 rounded-lg hover:bg-red-500/15 text-surface-400 hover:text-red-400 transition-all active:scale-90">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
