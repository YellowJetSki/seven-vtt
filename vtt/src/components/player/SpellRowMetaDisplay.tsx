/**
 * STᚱ VTT — SpellRowMetaDisplay
 *
 * Expanded metadata section for a spell row: casting info, damage/heal/save
 * mechanical badges, and full description.
 *
 * Extracted from PlayerSheetSpellsTab.tsx monolith (Sprint 7 refactor).
 */

import type { KnownSpell } from "@/lib/spell-utils";

interface SpellRowMetaDisplayProps {
  spell: KnownSpell;
}

export default function SpellRowMetaDisplay({ spell }: SpellRowMetaDisplayProps) {
  const hasDamage = !!spell.damageDice;
  const hasHeal = !!spell.healDice;
  const hasSave = !!spell.saveDC;

  return (
    <div className="px-3 pb-2.5 space-y-2 animate-slide-in-up">
      {/* Meta info grid */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[10px] text-surface-500">
        <span>
          <span className="text-gold-500/50">Casting:</span> {spell.castingTime}
        </span>
        <span>
          <span className="text-gold-500/50">Range:</span> {spell.range}
        </span>
        <span>
          <span className="text-gold-500/50">Components:</span> {spell.components}
        </span>
        <span>
          <span className="text-gold-500/50">Duration:</span> {spell.duration}
        </span>
      </div>

      {/* Mechanical detail badges */}
      {(hasDamage || hasHeal || hasSave || spell.attackRoll) && (
        <div className="flex flex-wrap gap-1">
          {hasDamage && (
            <span className="text-[9px] bg-rose-500/8 border border-rose-500/15 text-rose-400 px-1.5 py-0.5 rounded">
              💥 {spell.damageDice}
              {spell.damageType ? ` ${spell.damageType}` : ""}
            </span>
          )}
          {hasHeal && (
            <span className="text-[9px] bg-emerald-500/8 border border-emerald-500/15 text-emerald-400 px-1.5 py-0.5 rounded">
              ❤ {spell.healDice} healing
            </span>
          )}
          {hasSave && (
            <span className="text-[9px] bg-indigo-500/8 border border-indigo-500/15 text-indigo-400 px-1.5 py-0.5 rounded">
              🛡 DC {spell.saveDC} {spell.saveAbility}
            </span>
          )}
          {spell.attackRoll && (
            <span className="text-[9px] bg-amber-500/8 border border-amber-500/15 text-amber-400 px-1.5 py-0.5 rounded">
              🎯 Spell attack
            </span>
          )}
        </div>
      )}

      {/* Full description */}
      <p className="text-[11px] text-surface-400 leading-relaxed">
        {spell.description || "No description available."}
      </p>
    </div>
  );
}
