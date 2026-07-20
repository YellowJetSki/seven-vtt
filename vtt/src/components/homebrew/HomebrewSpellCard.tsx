/**
 * STᚱ VTT — Homebrew Spell Card (Premium Glass v3.1)
 *
 * Premium spell card with gold gradient hover effects, staggered entrance,
 * AoE shape/size display, damage/healing stats, duplicate, visibility toggle,
 * and bulk-select checkbox. Hover actions fade in elegantly.
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
  const schoolColor = getSchoolColor(spell.school);
  const hasAoe = spell.shape && spell.areaSize;
  const hasDamage = spell.damageDice && spell.damageType;
  const hasHealing = spell.healDice;

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
            onChange={() => onToggleSelect(spell.id)}
            className="mt-1 rounded border-surface-600 bg-surface-800 accent-gold-500 w-3.5 h-3.5 shrink-0"
          />
        )}

        <div className="flex-1 min-w-0">
          {/* Name + Level + School */}
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-semibold text-white/80 truncate group-hover:text-gold-200 transition-colors">
              {spell.name}
            </h4>
            <span className={`text-[9px] uppercase tracking-wider ${LEVEL_COLORS[String(spell.level)] || "text-surface-400"}`}>
              {spell.level === 0 ? "Cantrip" : `Lv.${spell.level}`}
            </span>
            {spell.school && (
              <span className={`text-[9px] px-1 py-0.5 rounded border ${schoolColor}`}>
                {spell.school}
              </span>
            )}
          </div>

          {/* Casting Info */}
          <div className="flex items-center gap-1.5 text-[9px] text-surface-500 flex-wrap">
            <span>{spell.castingTime}</span>
            <span>·</span>
            <span>{spell.range}</span>
            <span>·</span>
            <span>{spell.duration}</span>
            {spell.concentration && (
              <>
                <span>·</span>
                <span className="text-violet-400">🧘 Concentration</span>
              </>
            )}
            {spell.ritual && (
              <>
                <span>·</span>
                <span className="text-amber-400">📜 Ritual</span>
              </>
            )}
          </div>

          {/* Damage/Healing/AoE Chips */}
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            {hasDamage && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/15 text-rose-400 font-mono">
                💥 {spell.damageDice} {spell.damageType}
              </span>
            )}
            {hasHealing && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/15 text-emerald-400 font-mono">
                ❤ {spell.healDice} healing
              </span>
            )}
            {hasAoe && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/15 text-amber-400 font-mono">
                ◯ {spell.shape} {spell.areaSize}ft
              </span>
            )}
            {(spell as any).saveDC && (spell as any).savingThrowAbility && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/15 text-indigo-400">
                🛡 DC {(spell as any).saveDC} {capitalize((spell as any).savingThrowAbility)}
              </span>
            )}
          </div>

          {/* Description */}
          {spell.description && (
            <p className="text-[10px] text-surface-500 mt-1.5 line-clamp-2 leading-relaxed">
              {spell.description}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onToggleVisibility(spell.id, !spell.visibleToPlayers)}
            className={`p-1.5 rounded-lg transition-all duration-150 active:scale-90 ${
              spell.visibleToPlayers
                ? "text-gold-400/80 hover:bg-gold-500/10"
                : "text-surface-600 hover:text-surface-400 hover:bg-surface-800/40"
            }`}
            title={spell.visibleToPlayers ? "Visible to players" : "DM only"}
          >
            {spell.visibleToPlayers ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => onDuplicate(spell)}
            className="p-1.5 rounded-lg text-surface-600 hover:text-gold-400 hover:bg-gold-500/10 active:scale-90 transition-all duration-150 opacity-0 group-hover:opacity-100"
            title="Duplicate"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onEdit(spell)}
            className="p-1.5 rounded-lg text-surface-600 hover:text-gold-400 hover:bg-gold-500/10 active:scale-90 transition-all duration-150 opacity-0 group-hover:opacity-100"
            title="Edit"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(spell.id)}
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

function getSchoolColor(school?: string): string {
  const colors: Record<string, string> = {
    Abjuration: "bg-cyan-500/10 border-cyan-500/15 text-cyan-400",
    Conjuration: "bg-amber-500/10 border-amber-500/15 text-amber-400",
    Divination: "bg-violet-500/10 border-violet-500/15 text-violet-400",
    Enchantment: "bg-pink-500/10 border-pink-500/15 text-pink-400",
    Evocation: "bg-rose-500/10 border-rose-500/15 text-rose-400",
    Illusion: "bg-indigo-500/10 border-indigo-500/15 text-indigo-400",
    Necromancy: "bg-emerald-500/10 border-emerald-500/15 text-emerald-400",
    Transmutation: "bg-orange-500/10 border-orange-500/15 text-orange-400",
  };
  return colors[school || ""] || "bg-surface-800/60 border-white/[0.04] text-surface-500";
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
