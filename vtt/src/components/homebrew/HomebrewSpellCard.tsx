/**
 * STᚱ VTT — Homebrew Spell Card (Premium Glass v3.0)
 *
 * Enhanced with premium glass gradient card, hover elevation,
 * gold edge light on hover, AoE shape/size display, damage/healing stats,
 * duplicate action, visible toggle, and bulk-select checkbox.
 */

import { Edit3, Trash2, Copy, Eye, EyeOff } from "lucide-react";
import type { HomebrewSpell } from "@/types/homebrew";

interface HomebrewSpellCardProps {
  spell: HomebrewSpell;
  onEdit: (spell: HomebrewSpell) => void;
  onDelete: (id: string) => void;
  onDuplicate: (spell: HomebrewSpell) => void;
  onToggleVisibility: (id: string, visible: boolean) => void;
  isBulkMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
}

const LEVEL_COLORS: Record<string, string> = {
  "0": "text-surface-400",
  "1": "text-emerald-400",
  "2": "text-emerald-400",
  "3": "text-emerald-400",
  "4": "text-gold-400",
  "5": "text-gold-400",
  "6": "text-gold-400",
  "7": "text-rose-400",
  "8": "text-rose-400",
  "9": "text-violet-400",
};

export default function HomebrewSpellCard({ spell, onEdit, onDelete, onDuplicate, onToggleVisibility, isBulkMode, isSelected, onToggleSelect }: HomebrewSpellCardProps) {
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
            checked={!!isSelected}
            onChange={() => onToggleSelect(spell.id)}
            className="mt-1 rounded border-surface-600 bg-surface-800 accent-gold-500 shrink-0"
          />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-surface-200 truncate group-hover:text-gold-200 transition-colors">{spell.name}</span>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${LEVEL_COLORS[String(spell.level)] ?? "text-surface-400"}`}>
              {spell.level === 0 ? "Cantrip" : `Lv ${spell.level}`}
            </span>
          </div>

          <p className="text-xs text-surface-500 mt-1 line-clamp-2">
            {spell.school} · {spell.castingTime}
          </p>

          {/* Stat Chips */}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="text-[10px] uppercase tracking-wider border border-white/[0.06] text-surface-400 px-1.5 py-0.5 rounded">{spell.school}</span>
            <span className="text-[10px] text-surface-500">{spell.range}</span>
            {spell.concentration && <span className="text-[10px] text-amber-400">Concentration</span>}
            {spell.ritual && <span className="text-[10px] text-violet-400">Ritual</span>}

            {/* Damage/Healing */}
            {spell.damageDice && (
              <span className="text-[10px] text-rose-400 font-medium">
                {spell.damageDice}{spell.damageType ? ` ${spell.damageType}` : ""}
              </span>
            )}
            {spell.healDice && (
              <span className="text-[10px] text-emerald-400 font-medium">+{spell.healDice} healing</span>
            )}

            {/* AoE */}
            {spell.shape && spell.areaSize && (
              <span className="text-[10px] text-amber-400">{spell.areaSize}ft {spell.shape}</span>
            )}

            {/* Save DC / Attack */}
            {spell.saveDC && <span className="text-[10px] text-gold-400">DC {spell.saveDC}</span>}
            {spell.spellAttackBonus && <span className="text-[10px] text-gold-400">+{spell.spellAttackBonus} ATK</span>}
          </div>

          {spell.classes && spell.classes.length > 0 && (
            <div className="flex gap-1 mt-1.5 flex-wrap">
              {spell.classes.map((cls, i) => (
                <span key={i} className="text-[9px] bg-gold-500/10 text-gold-400 px-1.5 py-0.5 rounded">{cls}</span>
              ))}
            </div>
          )}
        </div>

        {!isBulkMode && (
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={() => onToggleVisibility(spell.id, !spell.visibleToPlayers)} className="p-1.5 rounded-lg hover:bg-gold-500/10 text-surface-500 hover:text-gold-400 transition-all active:scale-90" title={spell.visibleToPlayers ? "Hide from players" : "Show to players"}>
              {spell.visibleToPlayers ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            </button>
            <button onClick={() => onDuplicate(spell)} className="p-1.5 rounded-lg hover:bg-gold-500/10 text-surface-400 hover:text-gold-400 transition-all active:scale-90" title="Duplicate">
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => onEdit(spell)} className="p-1.5 rounded-lg hover:bg-gold-500/10 text-surface-400 hover:text-gold-400 transition-all duration-150 active:scale-90">
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => onDelete(spell.id)} className="p-1.5 rounded-lg hover:bg-red-500/15 text-surface-400 hover:text-red-400 transition-all active:scale-90">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
