/**
 * STᚱ VTT — SpellRowCard (Premium)
 *
 * Ventriloc/Overrrides-grade collapsible spell row:
 * - Multi-layer depth card with edge lighting
 * - Hover elevation lift with directional glow sweep
 * - Prepare toggle with gold dot animation
 * - Favorite star with pulse glow
 * - Quick-cast button with "now casting" feedback style
 * - Damage/heal badges with color-coded backgrounds
 * - School badge with school-specific color scheme
 * - Concentration/ritual indicators with tooltip
 * - Expandable meta display with smooth slide
 */

import { useState } from "react";
import type { KnownSpell } from "@/lib/spell-utils";
import { getSchoolStyle, SCHOOL_ICON } from "@/lib/spell-utils";
import SpellPrepareToggle from "./SpellPrepareToggle";
import SpellRowMetaDisplay from "./SpellRowMetaDisplay";

interface SpellRowCardProps {
  spell: KnownSpell;
  isExpanded: boolean;
  onToggle: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onQuickCast: () => void;
  isPrepared?: boolean;
  onTogglePrepare?: (prepared: boolean) => void;
}

export default function SpellRowCard({
  spell,
  isExpanded,
  onToggle,
  isFavorite,
  onToggleFavorite,
  onQuickCast,
  isPrepared = false,
  onTogglePrepare,
}: SpellRowCardProps) {
  const hasDamage = !!spell.damageDice;
  const hasHeal = !!spell.healDice;
  const hasSave = !!spell.saveDC;
  const [castClicked, setCastClicked] = useState(false);

  const handleQuickCast = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCastClicked(true);
    onQuickCast();
    setTimeout(() => setCastClicked(false), 1000);
  };

  return (
    <div
      className={`relative rounded-xl bg-gradient-to-b from-white/[0.02] to-transparent border transition-all duration-200 overflow-hidden group ${
        isExpanded
          ? "border-gold/20 bg-gold-500/[0.02]"
          : "border-white/[0.04] hover:border-gold/15 hover:-translate-y-0.5"
      } active:scale-[0.99]`}
    >
      {/* Directional glow sweep */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none bg-gradient-to-br from-gold-500/[0.02] via-transparent to-amber-500/[0.02]" />

      {/* Edge light */}
      <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-gold-500/0 group-hover:via-gold-500/15 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300" />

      {/* Main clickable row */}
      <button
        onClick={onToggle}
        className="relative w-full flex items-center gap-1.5 px-3 py-2.5 text-left z-[1]"
      >
        {/* Prepare toggle */}
        {onTogglePrepare && (
          <div className="shrink-0 flex items-center" onClick={(e) => e.stopPropagation()}>
            <SpellPrepareToggle
              isPrepared={isPrepared}
              onChange={onTogglePrepare}
              disabled={spell.level === 0}
              size="sm"
            />
          </div>
        )}

        {/* Level badge */}
        <span
          className={`text-[10px] w-5 text-center font-mono font-bold shrink-0 ${
            spell.level === 0 ? "text-surface-500" : "text-gold-400"
          }`}
        >
          {spell.level === 0 ? "C" : spell.level}
        </span>

        {/* Favorite star */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
          className={`text-[10px] transition-all duration-150 shrink-0 ${
            isFavorite
              ? "text-amber-400 drop-shadow-[0_0_3px_rgba(251,191,36,0.3)] animate-pulse-soft"
              : "text-surface-700 hover:text-surface-500"
          }`}
          aria-label={isFavorite ? "Unfavorite" : "Favorite"}
        >
          {isFavorite ? "★" : "☆"}
        </button>

        {/* Name — gold accent when prepared */}
        <span
          className={`flex-1 text-[11px] truncate transition-colors ${
            isPrepared ? "text-gold-400 font-semibold" : "text-surface-300"
          }`}
        >
          {spell.name}
        </span>

        {/* Quick-cast button — "Cast" on hover */}
        {spell.level > 0 && (
          <button
            onClick={handleQuickCast}
            className={`px-2 py-0.5 rounded-lg text-[8px] font-semibold transition-all duration-150 border opacity-0 group-hover:opacity-100 active:scale-90 shrink-0 ${
              castClicked
                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20"
                : "bg-gradient-to-b from-gold-500/8 to-gold-500/3 text-gold-500/60 border-gold/15 hover:from-gold-500/15 hover:to-gold-500/8 hover:text-gold-400"
            }`}
            title="Quick cast (uses 1 slot)"
          >
            {castClicked ? "✨" : "Cast"}
          </button>
        )}

        {/* Damage/heal badge — inline chip */}
        {hasDamage && (
          <span className="text-[8px] text-rose-400/70 bg-rose-500/8 px-1.5 py-0.5 rounded border border-rose-500/12 shrink-0 hidden sm:inline">
            {spell.damageDice}
            {spell.damageType ? ` ${spell.damageType.charAt(0).toUpperCase()}` : ""}
          </span>
        )}
        {hasHeal && !hasDamage && (
          <span className="text-[8px] text-emerald-400/70 bg-emerald-500/8 px-1.5 py-0.5 rounded border border-emerald-500/12 shrink-0 hidden sm:inline">
            ❤ {spell.healDice}
          </span>
        )}

        {/* School badge */}
        <span
          className={`text-[7px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded border ${getSchoolStyle(spell.school)} shrink-0 hidden xs:inline`}
        >
          {SCHOOL_ICON[spell.school] || ""} {spell.school}
        </span>

        {/* Concentration / Ritual icons */}
        {spell.concentration && (
          <span className="text-[10px] shrink-0" title="Concentration">
            🧘
          </span>
        )}
        {spell.ritual && (
          <span className="text-[10px] shrink-0" title="Ritual">
            📜
          </span>
        )}

        {/* Expand chevron */}
        <span
          className={`text-surface-500 transform transition-transform duration-200 text-[8px] shrink-0 ${
            isExpanded ? "rotate-180" : ""
          }`}
        >
          ▼
        </span>
      </button>

      {/* Expanded metadata */}
      {isExpanded && (
        <div className="animate-slide-in-up">
          <SpellRowMetaDisplay spell={spell} />
        </div>
      )}
    </div>
  );
}
