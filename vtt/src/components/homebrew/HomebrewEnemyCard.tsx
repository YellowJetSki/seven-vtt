/**
 * STᚱ VTT — Homebrew Enemy Card (Premium Homebrew Forge v3.0)
 *
 * Premium glass gradient card for displaying NPC/monster entries
 * in the Homebrew panel. Matches ItemCard/SpellCard/FeatCard
 * styling with gold edge light, hover elevation, and CR badges.
 */

import { useState } from "react";
import { Eye, EyeOff, Copy, Edit2, Trash2 } from "lucide-react";
import type { EnemyDoc } from "@/types";

interface HomebrewEnemyCardProps {
  enemy: EnemyDoc;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: (enemy: EnemyDoc) => void;
  onToggleVisibility: (id: string, visible: boolean) => void;
  onViewDetail: (enemy: EnemyDoc) => void;
  isBulkMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
}

function formatCr(cr: number): string {
  if (cr === 0) return "0";
  if (cr === 0.125) return "1/8";
  if (cr === 0.25) return "1/4";
  if (cr === 0.5) return "1/2";
  return String(cr);
}

function getTypeColor(type: string): string {
  const colors: Record<string, string> = {
    Aberration: "text-violet-400 bg-violet-500/10 border-violet-500/15",
    Beast: "text-amber-400 bg-amber-500/10 border-amber-500/15",
    Celestial: "text-gold-400 bg-gold-500/10 border-gold/15",
    Construct: "text-cyan-400 bg-cyan-500/10 border-cyan-500/15",
    Dragon: "text-rose-400 bg-rose-500/10 border-rose-500/15",
    Elemental: "text-blue-400 bg-blue-500/10 border-blue-500/15",
    Fey: "text-emerald-400 bg-emerald-500/10 border-emerald-500/15",
    Fiend: "text-red-400 bg-red-500/10 border-red-500/15",
    Giant: "text-orange-400 bg-orange-500/10 border-orange-500/15",
    Humanoid: "text-sky-400 bg-sky-500/10 border-sky-500/15",
    Monstrosity: "text-rose-400 bg-rose-500/10 border-rose-500/15",
    Ooze: "text-lime-400 bg-lime-500/10 border-lime-500/15",
    Plant: "text-green-400 bg-green-500/10 border-green-500/15",
    Undead: "text-indigo-400 bg-indigo-500/10 border-indigo-500/15",
    Custom: "text-surface-400 bg-surface-500/10 border-surface-500/15",
  };
  return colors[type] || "text-surface-400 bg-surface-500/10 border-surface-500/15";
}

function getTypeIcon(type: string): string {
  switch (type) {
    case "Humanoid": return "🧑";
    case "Beast": return "🐺";
    case "Dragon": return "🐉";
    case "Undead": return "💀";
    case "Fiend": return "👿";
    case "Celestial": return "😇";
    case "Construct": return "🤖";
    case "Elemental": return "🌪";
    case "Fey": return "🧚";
    case "Giant": return "🦶";
    case "Monstrosity": return "👹";
    case "Ooze": return "🟢";
    case "Plant": return "🌿";
    case "Aberration": return "👁";
    default: return "❓";
  }
}

export default function HomebrewEnemyCard({
  enemy, onEdit, onDelete, onDuplicate, onToggleVisibility, onViewDetail,
  isBulkMode, isSelected, onToggleSelect,
}: HomebrewEnemyCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleCardClick = () => {
    if (isBulkMode && onToggleSelect) {
      onToggleSelect(enemy.id);
    } else {
      onViewDetail(enemy);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className={`relative group bg-gradient-to-b from-[#14151f]/70 to-[#0f101a]/85 border rounded-xl p-3.5 transition-all duration-200 cursor-pointer overflow-hidden ${
        isSelected
          ? "border-gold-500/30 shadow-[0_0_12px_rgba(234,179,8,0.04)]"
          : "border-white/[0.04] hover:border-gold-500/12"
      } hover:-translate-y-0.5 active:scale-[0.99]`}
    >
      {/* Gold edge light on hover */}
      <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-gold-500/0 group-hover:via-gold-500/15 to-transparent transition-all duration-500 pointer-events-none" />

      <div className="flex items-start gap-3 relative z-10">
        {/* Bulk mode checkbox */}
        {isBulkMode && onToggleSelect && (
          <div className="shrink-0 pt-0.5" onClick={(e) => e.stopPropagation()}>
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggleSelect(enemy.id)}
              className="w-4 h-4 rounded border-surface-600 bg-surface-800 accent-gold-500 cursor-pointer"
            />
          </div>
        )}

        {/* Type icon */}
        <div className={`shrink-0 w-9 h-9 rounded-xl ${getTypeColor(enemy.type)} flex items-center justify-center text-sm`}>
          {getTypeIcon(enemy.type)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Name + CR */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white/90 truncate group-hover:text-gold-200 transition-colors duration-200">
              {enemy.name}
            </span>
            <span className="shrink-0 text-[9px] px-1.5 py-0.5 rounded bg-gradient-to-br from-gold-500/12 to-amber-500/8 border border-gold-500/20 text-gold-400 font-semibold tabular-nums">
              CR {formatCr(enemy.challengeRating)}
            </span>
            {enemy.imageUrl && (
              <span className="shrink-0 w-5 h-5 rounded overflow-hidden border border-white/[0.04]">
                <img
                  src={enemy.imageUrl}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              </span>
            )}
          </div>

          {/* Meta row */}
          <div className="flex items-center gap-2 mt-1 text-[10px] text-surface-500">
            <span>{enemy.size}</span>
            <span>·</span>
            <span className={`px-1 py-0 rounded text-[9px] ${getTypeColor(enemy.type)}`}>
              {enemy.type}
            </span>
            <span>·</span>
            <span className="text-cyan-300 tabular-nums">{enemy.armorClass} AC</span>
            <span>·</span>
            <span className="text-emerald-400 tabular-nums">{enemy.hitPoints.max} HP</span>
            <span>·</span>
            <span className="text-surface-500 tabular-nums">{enemy.speed}ft</span>
          </div>

          {/* Abilities strip */}
          <div className="flex items-center gap-1.5 mt-1.5">
            {(["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"] as const).map((ab) => {
              const val = enemy.abilities[ab];
              const mod = Math.floor((val - 10) / 2);
              return (
                <span key={ab} className="text-[8px] text-surface-600 font-mono tabular-nums">
                  {ab.slice(0, 3).toUpperCase()} {val}
                  <span className={mod >= 0 ? "text-gold-400/50" : "text-rose-400/50"}>
                    ({mod >= 0 ? "+" : ""}{mod})
                  </span>
                </span>
              );
            })}
          </div>

          {/* Traits preview */}
          {enemy.traits && (
            <div className="mt-1.5 text-[9px] text-surface-600 truncate leading-relaxed">
              {enemy.traits.slice(0, 100)}{enemy.traits.length > 100 ? "..." : ""}
            </div>
          )}
        </div>

        {/* Action buttons (hover-reveal) */}
        {!isBulkMode && (
          <div className="shrink-0 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={(e) => { e.stopPropagation(); onToggleVisibility(enemy.id, true); }}
              className="p-1.5 rounded-lg text-surface-500 hover:text-gold-400 hover:bg-gold-500/10 active:scale-90 transition-all"
              title={enemy.imageUrl ? "Has token image" : "Toggle visibility"}
            >
              {enemy.imageUrl ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDuplicate(enemy); }}
              className="p-1.5 rounded-lg text-surface-500 hover:text-gold-400 hover:bg-gold-500/10 active:scale-90 transition-all"
              title="Duplicate"
            >
              <Copy className="w-3 h-3" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="p-1.5 rounded-lg text-surface-500 hover:text-amber-400 hover:bg-amber-500/10 active:scale-90 transition-all"
              title="Edit"
            >
              <Edit2 className="w-3 h-3" />
            </button>
            {showDeleteConfirm ? (
              <div className="flex items-center gap-0.5">
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(); setShowDeleteConfirm(false); }}
                  className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 active:scale-90 transition-all text-[9px] font-bold"
                >
                  ✓
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(false); }}
                  className="p-1.5 rounded-lg text-surface-500 hover:text-surface-300 active:scale-90 transition-all text-[9px]"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(true); }}
                className="p-1.5 rounded-lg text-surface-500 hover:text-red-400 hover:bg-red-500/10 active:scale-90 transition-all"
                title="Delete"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
