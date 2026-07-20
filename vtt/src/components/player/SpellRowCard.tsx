/**
 * STᚱ VTT — SpellRowCard
 *
 * A single collapsible spell row with prepare toggle, level badge,
 * favorite star, name, quick-cast button, damage/heal badge,
 * school badge, concentration/ritual indicators, and expanded details.
 *
 * Extracted from PlayerSheetSpellsTab.tsx monolith (Sprint 7 refactor).
 */

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

  return (
    <div className="rounded-lg bg-obsidian-mid/40 border border-surface-700/10 hover:border-gold/10 transition-all duration-200 group">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-1.5 px-3 py-2 text-left"
      >
        {/* Prepare toggle */}
        <div className="shrink-0 flex items-center" onClick={(e) => e.stopPropagation()}>
          {onTogglePrepare && (
            <SpellPrepareToggle
              isPrepared={isPrepared}
              onChange={onTogglePrepare}
              disabled={spell.level === 0}
              size="sm"
            />
          )}
        </div>

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
              ? "text-amber-400 drop-shadow-[0_0_3px_rgba(251,191,36,0.3)]"
              : "text-surface-700 hover:text-surface-500"
          }`}
          aria-label={isFavorite ? "Unfavorite" : "Favorite"}
        >
          {isFavorite ? "★" : "☆"}
        </button>

        {/* Name */}
        <span className="flex-1 text-xs text-surface-300 truncate">{spell.name}</span>

        {/* Quick-cast button */}
        {spell.level > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onQuickCast();
            }}
            className="px-1.5 py-0.5 rounded text-[8px] bg-gold-500/8 border border-gold/15 text-gold-500/60 hover:bg-gold-500/15 hover:text-gold-400 active:scale-90 transition-all opacity-0 group-hover:opacity-100 shrink-0"
            title="Quick cast (uses 1 slot)"
          >
            Cast
          </button>
        )}

        {/* Damage/heal badge */}
        {hasDamage && (
          <span className="text-[9px] text-rose-400/70 bg-rose-500/10 px-1 py-0.5 rounded border border-rose-500/15 shrink-0 hidden sm:inline">
            {spell.damageDice}
            {spell.damageType ? ` ${spell.damageType}` : ""}
          </span>
        )}
        {hasHeal && !hasDamage && (
          <span className="text-[9px] text-emerald-400/70 bg-emerald-500/10 px-1 py-0.5 rounded border border-emerald-500/15 shrink-0 hidden sm:inline">
            {spell.healDice} heal
          </span>
        )}

        {/* School badge */}
        <span
          className={`text-[8px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded border ${getSchoolStyle(spell.school)} shrink-0 hidden xs:inline`}
        >
          {SCHOOL_ICON[spell.school] || ""} {spell.school}
        </span>

        {/* Concentration / Ritual */}
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

        {/* Expand arrow */}
        <span
          className={`text-surface-500 transform transition-transform duration-150 text-[8px] shrink-0 ${
            isExpanded ? "rotate-180" : ""
          }`}
        >
          ▼
        </span>
      </button>

      {isExpanded && <SpellRowMetaDisplay spell={spell} />}
    </div>
  );
}
