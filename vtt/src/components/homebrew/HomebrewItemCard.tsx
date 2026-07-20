/**
 * STᚱ VTT — Homebrew Item Card (Premium Glass v3.0)
 *
 * Enhanced with premium glass gradient card, hover elevation,
 * gold edge light on hover, stat display (damage/AC/charges),
 * duplicate action, visible-to-players toggle, and bulk-select checkbox.
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
        {/* Bulk checkbox */}
        {isBulkMode && onToggleSelect && (
          <input
            type="checkbox"
            checked={!!isSelected}
            onChange={() => onToggleSelect(item.id)}
            className="mt-1 rounded border-surface-600 bg-surface-800 accent-gold-500 shrink-0"
          />
        )}

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-surface-200 truncate group-hover:text-gold-200 transition-colors">{item.name}</span>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${RARITY_COLORS[item.rarity] ?? "text-surface-400"}`}>
              {item.rarity}
            </span>
          </div>

          <p className="text-xs text-surface-500 mt-1 line-clamp-2">{item.description}</p>

          {/* Stat Chips */}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="text-[10px] uppercase tracking-wider bg-surface-700/40 text-surface-400 px-1.5 py-0.5 rounded">{item.category}</span>
            {isWeapon && item.damageDice && (
              <span className="text-[10px] text-rose-400 font-medium">{item.damageDice}{item.damageType ? ` ${item.damageType}` : ""}{item.attackBonus ? ` +${item.attackBonus}` : ""}</span>
            )}
            {isArmor && item.acBonus && (
              <span className="text-[10px] text-gold-400 font-medium">AC {item.acBonus}</span>
            )}
            {item.requiresAttunement && <span className="text-[10px] text-gold-400 font-medium">⚡ Attunement</span>}
            {hasCharges && <span className="text-[10px] text-amber-400">⟳ {item.charges}/{item.chargesMax}</span>}
            <span className="text-[10px] text-surface-500">{item.weight} lb</span>
            <span className="text-[10px] text-gold-400">{item.value} gp</span>
          </div>
        </div>

        {/* Action Buttons */}
        {!isBulkMode && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => onToggleVisibility(item.id, !item.visibleToPlayers)}
              className="p-1.5 rounded-lg hover:bg-gold-500/10 text-surface-500 hover:text-gold-400 transition-all active:scale-90"
              title={item.visibleToPlayers ? "Hide from players" : "Show to players"}
            >
              {item.visibleToPlayers ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            </button>
            <button onClick={() => onDuplicate(item)} className="p-1.5 rounded-lg hover:bg-gold-500/10 text-surface-400 hover:text-gold-400 transition-all active:scale-90" title="Duplicate">
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => onEdit(item)} className="p-1.5 rounded-lg hover:bg-gold-500/10 text-surface-400 hover:text-gold-400 transition-all duration-150 active:scale-90">
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => onDelete(item.id)} className="p-1.5 rounded-lg hover:bg-red-500/15 text-surface-400 hover:text-red-400 transition-all active:scale-90">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
