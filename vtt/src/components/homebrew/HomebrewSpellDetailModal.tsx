/**
 * STᚱ VTT — Homebrew Spell Detail Modal (Cycle 26 — The Homebrew Forge)
 *
 * Premium Lusion-grade glass popover displaying the FULL statblock
 * for a homebrew spell, including school, casting info, damage/healing,
 * AoE stats, save/attack info, concentration, ritual, tags, and flavor text.
 *
 * Matches the pattern established by HomebrewItemDetailModal.tsx
 */

import { X } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";
import type { HomebrewSpell } from "@/types/homebrew";

interface HomebrewSpellDetailModalProps {
  spell: HomebrewSpell;
  isOpen: boolean;
  onClose: () => void;
}

const SCHOOL_COLORS: Record<string, { badge: string; bg: string }> = {
  Abjuration: { badge: "bg-cyan-500/10 border-cyan-500/20 text-cyan-400", bg: "from-cyan-500/5 to-transparent" },
  Conjuration: { badge: "bg-amber-500/10 border-amber-500/20 text-amber-400", bg: "from-amber-500/5 to-transparent" },
  Divination: { badge: "bg-violet-500/10 border-violet-500/20 text-violet-400", bg: "from-violet-500/5 to-transparent" },
  Enchantment: { badge: "bg-pink-500/10 border-pink-500/20 text-pink-400", bg: "from-pink-500/5 to-transparent" },
  Evocation: { badge: "bg-rose-500/10 border-rose-500/20 text-rose-400", bg: "from-rose-500/5 to-transparent" },
  Illusion: { badge: "bg-indigo-500/10 border-indigo-500/20 text-indigo-400", bg: "from-indigo-500/5 to-transparent" },
  Necromancy: { badge: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400", bg: "from-emerald-500/5 to-transparent" },
  Transmutation: { badge: "bg-orange-500/10 border-orange-500/20 text-orange-400", bg: "from-orange-500/5 to-transparent" },
};

const LEVEL_LABELS: Record<number, string> = {
  0: "Cantrip", 1: "1st Level", 2: "2nd Level", 3: "3rd Level",
  4: "4th Level", 5: "5th Level", 6: "6th Level", 7: "7th Level",
  8: "8th Level", 9: "9th Level",
};

export default function HomebrewSpellDetailModal({ spell, isOpen, onClose }: HomebrewSpellDetailModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const schoolMeta = SCHOOL_COLORS[spell.school] || { badge: "bg-surface-800/60 border-white/[0.06] text-surface-400", bg: "" };
  const hasAoe = spell.shape && spell.areaSize;
  const hasDamage = spell.damageDice && spell.damageType;
  const hasHealing = spell.healDice;

  return (
    <div
      className="fixed inset-0 z-[75] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-lg mx-4 bg-gradient-to-br from-[#14151f] to-[#0f101a] border border-gold/10 rounded-2xl shadow-2xl shadow-gold-500/5 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Corner ornaments */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-gold-500/20 rounded-tl-2xl pointer-events-none" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-gold-500/20 rounded-tr-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-gold-500/20 rounded-bl-2xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b border-r border-gold-500/20 rounded-br-2xl pointer-events-none" />

        {/* Header */}
        <div className="px-5 py-4 border-b border-gold/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gold-500/10 to-amber-500/5 border border-gold/15 flex items-center justify-center text-sm">
              {spell.level === 0 ? "✨" : "🔮"}
            </div>
            <div>
              <h2 className="text-base font-bold text-gold drop-shadow-[0_0_6px_rgba(234,179,8,0.1)]">{spell.name}</h2>
              <p className="text-[9px] text-surface-500 mt-0.5">{LEVEL_LABELS[spell.level] || `Level ${spell.level}`}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-surface-500 hover:text-surface-200 hover:bg-gold-500/10 active:scale-90 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto scrollbar-gold">
          {/* School + Concentration + Ritual badges */}
          <div className="flex items-center gap-2 flex-wrap">
            {spell.school && (
              <span className={`text-[9px] px-2 py-0.5 rounded-full border ${schoolMeta.badge}`}>
                {spell.school}
              </span>
            )}
            {spell.concentration && (
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400">
                🧘 Concentration
              </span>
            )}
            {spell.ritual && (
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400">
                📜 Ritual
              </span>
            )}
          </div>

          {/* Casting Info Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-[#0c0d15] border border-white/[0.04] p-3">
              <span className="text-[8px] uppercase tracking-wider text-surface-500 block mb-0.5">Casting Time</span>
              <span className="text-xs font-semibold text-surface-200">{spell.castingTime}</span>
            </div>
            <div className="rounded-xl bg-[#0c0d15] border border-white/[0.04] p-3">
              <span className="text-[8px] uppercase tracking-wider text-surface-500 block mb-0.5">Range</span>
              <span className="text-xs font-semibold text-surface-200">{spell.range}</span>
            </div>
            <div className="rounded-xl bg-[#0c0d15] border border-white/[0.04] p-3">
              <span className="text-[8px] uppercase tracking-wider text-surface-500 block mb-0.5">Duration</span>
              <span className="text-xs font-semibold text-surface-200">{spell.duration}</span>
            </div>
          </div>

          {/* Components */}
          {spell.components && spell.components.length > 0 && (
            <div>
              <h3 className="text-[9px] uppercase tracking-widest font-black text-gold-500/50 mb-1.5">Components</h3>
              <div className="flex items-center gap-1.5">
                {spell.components.includes("V") && <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-800/60 border border-white/[0.04] text-surface-400">Verbal</span>}
                {spell.components.includes("S") && <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-800/60 border border-white/[0.04] text-surface-400">Somatic</span>}
                {spell.components.includes("M") && <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-800/60 border border-white/[0.04] text-surface-400">Material</span>}
                {spell.materialComponent && (
                  <span className="text-[9px] text-surface-500 italic">({spell.materialComponent})</span>
                )}
              </div>
            </div>
          )}

          {/* Description */}
          {spell.description && (
            <div>
              <h3 className="text-[9px] uppercase tracking-widest font-black text-gold-500/50 mb-1.5">Description</h3>
              <p className="text-[11px] text-surface-300 leading-relaxed">{spell.description}</p>
            </div>
          )}
          {spell.flavorText && (
            <p className="text-[10px] text-gold-400/60 italic leading-relaxed">"{spell.flavorText}"</p>
          )}

          {/* Damage / Healing / AoE Stats */}
          {(hasDamage || hasHealing || hasAoe || spell.saveDC || spell.spellAttackBonus !== undefined) && (
            <div className="rounded-xl bg-[#0c0d15] border border-white/[0.04] p-4 space-y-3">
              <h3 className="text-[9px] uppercase tracking-widest font-black text-gold-500/50">🎯 Spell Mechanics</h3>
              <div className="grid grid-cols-2 gap-3">
                {hasDamage && (
                  <div className="space-y-1">
                    <span className="text-[8px] uppercase tracking-wider text-surface-500 block">Damage</span>
                    <span className="text-sm font-bold text-rose-400 tabular-nums">
                      💥 {spell.damageDice}{" "}
                      {spell.damageType ? spell.damageType.charAt(0).toUpperCase() + spell.damageType.slice(1) : ""}
                    </span>
                  </div>
                )}
                {hasHealing && (
                  <div className="space-y-1">
                    <span className="text-[8px] uppercase tracking-wider text-surface-500 block">Healing</span>
                    <span className="text-sm font-bold text-emerald-400 tabular-nums">❤ {spell.healDice}</span>
                  </div>
                )}
                {hasAoe && (
                  <div className="space-y-1">
                    <span className="text-[8px] uppercase tracking-wider text-surface-500 block">Area of Effect</span>
                    <span className="text-sm font-bold text-amber-400 tabular-nums">
                      ◯ {spell.shape} · {spell.areaSize}ft
                    </span>
                  </div>
                )}
                {spell.saveDC && spell.saveAbility && (
                  <div className="space-y-1">
                    <span className="text-[8px] uppercase tracking-wider text-surface-500 block">Saving Throw</span>
                    <span className="text-sm font-bold text-indigo-400">
                      🛡 DC {spell.saveDC} {spell.saveAbility.charAt(0).toUpperCase() + spell.saveAbility.slice(1)}
                    </span>
                  </div>
                )}
                {spell.spellAttackBonus !== undefined && (
                  <div className="space-y-1">
                    <span className="text-[8px] uppercase tracking-wider text-surface-500 block">Attack Bonus</span>
                    <span className="text-sm font-bold text-amber-400 tabular-nums">🎯 +{spell.spellAttackBonus}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tags */}
          {spell.tags && spell.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {spell.tags.map((tag) => (
                <span key={tag} className="text-[8px] px-1.5 py-0.5 rounded bg-surface-800/60 border border-white/[0.04] text-surface-500">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* At Higher Levels */}
          {spell.atHigherLevels && (
            <div>
              <h3 className="text-[9px] uppercase tracking-widest font-black text-gold-500/50 mb-1.5">At Higher Levels</h3>
              <p className="text-[10px] text-surface-400 italic leading-relaxed">{spell.atHigherLevels}</p>
            </div>
          )}

          {/* Classes */}
          {spell.classes && spell.classes.length > 0 && (
            <div>
              <h3 className="text-[9px] uppercase tracking-widest font-black text-gold-500/50 mb-1.5">Classes</h3>
              <div className="flex flex-wrap gap-1.5">
                {spell.classes.map((cls) => (
                  <span key={cls} className="text-[8px] px-1.5 py-0.5 rounded bg-gold-500/8 border border-gold-500/10 text-gold-400/80">
                    {cls}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Source + Timestamps */}
          <div className="text-[8px] text-surface-600 pt-2 border-t border-white/[0.04]">
            {spell.source && spell.source !== "homebrew" && <span>Source: {spell.source} · </span>}
            {spell.isHomebrew && <span>Homebrew · </span>}
            {spell.visibleToPlayers ? "Visible to players" : "DM only"}
          </div>
        </div>
      </div>
    </div>
  );
}
