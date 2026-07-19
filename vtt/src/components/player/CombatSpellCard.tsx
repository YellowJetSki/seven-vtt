/**
 * STᚱ VTT — Combat Spell Card
 *
 * Reusable spell attack card for the Combat Tab.
 * Renders a single spell's information including:
 *   - Name with school icon, source badge (SRD/Homebrew/Inferred)
 *   - Level/school badge
 *   - Attack bonus or save DC
 *   - Damage or healing expression
 *   - Range, concentration, casting time
 *   - Component badges
 */

import type { CombatEntity } from "@/types/unified-entities";
import { getSourceBadge } from "@/lib/combat/compendium-bridge";

interface CombatSpellCardProps {
  entity: CombatEntity;
  showSource?: boolean;
}

export default function CombatSpellCard({ entity, showSource = false }: CombatSpellCardProps) {
  const {
    name,
    icon,
    spellLevel,
    spellSchool,
    attackBonus,
    damageExpression,
    range,
    requiresConcentration,
    hasSave,
    saveDC,
    saveAbility,
    colorClass = "text-amber-400",
    sourceType,
  } = entity;

  const isCantrip = spellLevel === 0;

  return (
    <div className="rounded-xl bg-obsidian-mid/40 border border-surface-700/20 p-3 hover:border-amber-500/10 transition-all duration-200 group">
      <div className="flex items-start gap-2.5">
        {/* Icon */}
        <span className="text-lg mt-0.5 flex-shrink-0" aria-hidden="true">
          {icon || "\uD83D\uDD2E"}
        </span>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Name + Source badge + Level/School */}
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <span className="text-sm font-semibold text-surface-200 truncate max-w-[120px]">
              {name}
            </span>
            {showSource && sourceType && (
              <span className={`px-1 py-0.5 rounded text-[7px] font-bold uppercase tracking-wider border ${getSourceBadge(sourceType as any).className}`}>
                {getSourceBadge(sourceType as any).icon} {getSourceBadge(sourceType as any).label}
              </span>
            )}
            <span className={`px-1 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
              isCantrip
                ? "bg-surface-700/30 text-surface-400 border border-surface-700/20"
                : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
            }`}>
              {isCantrip ? "Cantrip" : `Lv.${spellLevel}`}
            </span>
            {spellSchool && (
              <span className="px-1 py-0.5 rounded text-[8px] font-medium uppercase tracking-wider bg-violet-500/10 text-violet-400 border border-violet-500/20">
                {spellSchool}
              </span>
            )}
            {requiresConcentration && (
              <span className="px-1 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                \uD83E\uDDD8 Concentration
              </span>
            )}
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-3 text-xs flex-wrap">
            {/* Attack Bonus (if applicable) */}
            {attackBonus && (
              <div className="flex items-center gap-1">
                <span className="text-[9px] uppercase tracking-wider text-surface-500">ATK</span>
                <span className="font-bold tabular-nums text-amber-400">{attackBonus}</span>
              </div>
            )}

            {/* Save DC (if applicable) */}
            {hasSave && saveDC && (
              <div className="flex items-center gap-1">
                <span className="text-[9px] uppercase tracking-wider text-surface-500">Save</span>
                <span className="font-bold tabular-nums text-indigo-400">
                  DC {saveDC}{saveAbility ? ` ${saveAbility}` : ""}
                </span>
              </div>
            )}

            {/* Damage/Healing */}
            {damageExpression && (
              <>
                <span className="w-px h-3 bg-surface-700/30" />
                <div className="flex items-center gap-1">
                  <span className="text-[9px] uppercase tracking-wider text-surface-500">Effect</span>
                  <span className={`font-bold tabular-nums ${colorClass}`}>
                    {damageExpression}
                  </span>
                </div>
              </>
            )}

            {/* Range */}
            {range && (
              <>
                <span className="w-px h-3 bg-surface-700/30" />
                <div className="flex items-center gap-1">
                  <span className="text-[9px] uppercase tracking-wider text-surface-500">Range</span>
                  <span className="text-surface-300 font-medium">{range}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* School icon indicator */}
        <span className={`text-surface-500 group-hover:${colorClass.replace("text-", "text-")} transition-colors text-[10px] mt-0.5`}>
          {icon || "\u2728"}
        </span>
      </div>
    </div>
  );
}
