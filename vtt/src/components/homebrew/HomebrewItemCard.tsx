/**
 * STᚱ VTT — Homebrew Item Card (Premium Glass v3.1)
 *
 * Enhanced with premium glass gradient card, hover elevation,
 * gold edge light on hover, stat display (damage/AC/charges),
 * duplicate action, visible-to-players toggle, bulk-select checkbox,
 * staggered entrance and premium micro-interactions.
 */

import { Edit3, Trash2, Copy, Eye, EyeOff } from "lucide-react";
import type { HomebrewItem } from "@/types/homebrew";

interface HomebrewItemCardProps {
  item: HomebrewItem;
  onEdit: (item: HomebrewItem) => void;
  onDelete: (id: string) => void;
  onDuplicate: (item: HomebrewItem) => void;
  onToggleVisibility: (id: string, visible: boolean) => void;
  isBulkMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
}

const RARITY_COLORS: Record<string, string> = {
  common: "text-surface-400",
  uncommon: "text-amber-400",
  rare: "text-gold-400",
  "very rare": "text-rose-400",
  legendary: "text-violet-400",
  artifact: "text-emerald-400",
};

export default function HomebrewItemCard({
  item,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleVisibility,
  isBulkMode,
  isSelected,
  onToggleSelect,
}: HomebrewItemCardProps) {
  const isWeapon = item.category === "weapon";
  const isArmor = item.category === "armor";
  const hasCharges = item.charges !== undefined && item.chargesMax !== undefined;

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
            onChange={() => onToggleSelect(item.id)}
            className="mt-1 rounded border-surface-600 bg-surface-800 accent-gold-500 w-3.5 h-3.5 shrink-0"
          />
        )}

        <div className="flex-1 min-w-0">
          {/* Name + Tags Row */}
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-semibold text-white/80 truncate group-hover:text-gold-200 transition-colors">
              {item.name}
            </h4>
            {item.rarity && (
              <span className={`shrink-0 text-[9px] uppercase tracking-wider ${RARITY_COLORS[item.rarity] || "text-surface-400"}`}>
                {item.rarity}
              </span>
            )}
            {item.requiresAttunement && (
              <span className="shrink-0 text-[8px] px-1 py-0.5 rounded bg-gold-500/10 border border-gold-500/15 text-gold-400/80">
                Attune
              </span>
            )}
          </div>

          {/* Category + Tags */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[9px] text-surface-500 uppercase tracking-wider">{item.category}</span>
            {item.tags && item.tags.length > 0 && item.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="text-[8px] px-1 py-0.5 rounded bg-surface-800/60 border border-white/[0.04] text-surface-500">
                #{tag}
              </span>
            ))}
          </div>

          {/* Stat Chips */}
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            {isWeapon && item.damageDice && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/15 text-rose-400 font-mono">
                💥 {item.damageDice} {item.damageType || ""}
              </span>
            )}
            {isWeapon && item.attackBonus !== undefined && item.attackBonus !== 0 && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/15 text-amber-400 font-mono">
                +{item.attackBonus} ATK
              </span>
            )}
            {isArmor && item.acBonus !== undefined && item.acBonus !== 0 && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/15 text-cyan-400 font-mono">
                🛡 AC +{item.acBonus}
              </span>
            )}
            {item.weight > 0 && (
              <span className="text-[8px] text-surface-500">{item.weight} lb</span>
            )}
            {hasCharges && (
              <span className="text-[8px] px-1 py-0.5 rounded bg-gold-500/10 text-gold-400/80 font-mono">
                ⚡ {item.charges}/{item.chargesMax}
              </span>
            )}
          </div>

          {/* Description */}
          {item.description && (
            <p className="text-[10px] text-surface-500 mt-1.5 line-clamp-2 leading-relaxed">
              {item.description}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Visibility toggle */}
          <button
            onClick={() => onToggleVisibility(item.id, !item.visibleToPlayers)}
            className={`p-1.5 rounded-lg transition-all duration-150 active:scale-90 ${
              item.visibleToPlayers
                ? "text-gold-400/80 hover:bg-gold-500/10"
                : "text-surface-600 hover:text-surface-400 hover:bg-surface-800/40"
            }`}
            title={item.visibleToPlayers ? "Visible to players" : "DM only"}
          >
            {item.visibleToPlayers ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </button>

          {/* Duplicate */}
          <button
            onClick={() => onDuplicate(item)}
            className="p-1.5 rounded-lg text-surface-600 hover:text-gold-400 hover:bg-gold-500/10 active:scale-90 transition-all duration-150 opacity-0 group-hover:opacity-100"
            title="Duplicate"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          {/* Edit */}
          <button
            onClick={() => onEdit(item)}
            className="p-1.5 rounded-lg text-surface-600 hover:text-gold-400 hover:bg-gold-500/10 active:scale-90 transition-all duration-150 opacity-0 group-hover:opacity-100"
            title="Edit"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>

          {/* Delete */}
          <button
            onClick={() => onDelete(item.id)}
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
