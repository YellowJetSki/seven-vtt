/**
 * STᚱ VTT — SpellRowMetaDisplay (Premium)
 *
 * Lusion-grade expanded spell metadata:
 * - 2-column info grid with gold label accents
 * - Mechanical effect badges with color coding
 * - Full description with proper leading
 * - Smooth slide-in entrance animation
 * - School color scheme accent border
 */

import type { KnownSpell } from "@/lib/spell-utils";
import { getSchoolStyle, SCHOOL_ICON } from "@/lib/spell-utils";

interface SpellRowMetaDisplayProps {
  spell: KnownSpell;
}

export default function SpellRowMetaDisplay({ spell }: SpellRowMetaDisplayProps) {
  const hasDamage = !!spell.damageDice;
  const hasHeal = !!spell.healDice;
  const hasSave = !!spell.saveDC;

  return (
    <div className="relative px-3 pb-3 pt-1 space-y-2">
      {/* Subtle left border school accent */}
      <div
        className={`absolute left-[14px] top-0 bottom-3 w-0.5 rounded-full opacity-20 ${
          getSchoolStyle(spell.school).includes("border")
            ? getSchoolStyle(spell.school).replace("border", "bg")
            : "bg-gold-500/20"
        }`}
      />

      {/* Meta info grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] text-surface-500 pl-4">
        <span>
          <span className="text-gold-500/50 font-semibold">Casting:</span>{" "}
          <span className="text-surface-400">{spell.castingTime}</span>
        </span>
        <span>
          <span className="text-gold-500/50 font-semibold">Range:</span>{" "}
          <span className="text-surface-400">{spell.range}</span>
        </span>
        <span>
          <span className="text-gold-500/50 font-semibold">Components:</span>{" "}
          <span className="text-surface-400">{spell.components}</span>
        </span>
        <span>
          <span className="text-gold-500/50 font-semibold">Duration:</span>{" "}
          <span className="text-surface-400">{spell.duration}</span>
        </span>
      </div>

      {/* Mechanical detail badges */}
      {(hasDamage || hasHeal || hasSave || spell.attackRoll) && (
        <div className="flex flex-wrap gap-1.5 pl-4">
          {hasDamage && (
            <span className="text-[9px] font-medium bg-rose-500/8 border border-rose-500/12 text-rose-400 px-2 py-0.5 rounded-lg">
              💥 {spell.damageDice}
              {spell.damageType ? ` ${spell.damageType}` : ""}
            </span>
          )}
          {hasHeal && (
            <span className="text-[9px] font-medium bg-emerald-500/8 border border-emerald-500/12 text-emerald-400 px-2 py-0.5 rounded-lg">
              ❤ {spell.healDice} healing
            </span>
          )}
          {hasSave && (
            <span className="text-[9px] font-medium bg-indigo-500/8 border border-indigo-500/12 text-indigo-400 px-2 py-0.5 rounded-lg">
              🛡 DC {spell.saveDC} {spell.saveAbility}
            </span>
          )}
          {spell.attackRoll && (
            <span className="text-[9px] font-medium bg-amber-500/8 border border-amber-500/12 text-amber-400 px-2 py-0.5 rounded-lg">
              🎯 Spell attack
            </span>
          )}
        </div>
      )}

      {/* Description */}
      <div className="pl-4">
        <p className="text-[10px] text-surface-400 leading-relaxed">
          {spell.description || "No description available."}
        </p>
      </div>
    </div>
  );
}
