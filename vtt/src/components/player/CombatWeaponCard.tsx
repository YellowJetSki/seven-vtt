/**
 * STᚱ VTT — Combat Weapon Card
 *
 * Reusable weapon attack card for the Combat Tab.
 * Renders a single weapon's attack information including:
 *   - Name with weapon type icon
 *   - Attack bonus (color-coded)
 *   - Damage expression with type
 *   - Range display
 *   - Properties badges
 *   - Melee/Ranged type badges
 *
 * Usage:
 *   <CombatWeaponCard entity={weaponEntity} />
 */

import type { CombatEntity } from "@/types/unified-entities";

interface CombatWeaponCardProps {
  entity: CombatEntity;
}

export default function CombatWeaponCard({ entity }: CombatWeaponCardProps) {
  const {
    name,
    icon,
    attackBonus,
    damageExpression,
    isMelee,
    isRanged,
    range,
    properties,
    colorClass = "text-rose-400",
  } = entity;

  const atkNum = attackBonus ? parseInt(attackBonus.replace(/[+\-]/g, ""), 10) : 0;

  return (
    <div className="rounded-xl bg-obsidian-mid/40 border border-surface-700/20 p-3 hover:border-gold/10 transition-all duration-200 group">
      <div className="flex items-start gap-2.5">
        {/* Icon */}
        <span className="text-lg mt-0.5 flex-shrink-0" aria-hidden="true">
          {icon || "\u2694\uFE0F"}
        </span>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Name + Type badges */}
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <span className="text-sm font-semibold text-surface-200 truncate max-w-[140px]">
              {name}
            </span>
            {isMelee && (
              <span className="px-1 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20">
                Melee
              </span>
            )}
            {isRanged && (
              <span className="px-1 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Ranged
              </span>
            )}
            <span className="px-1 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-surface-700/30 text-surface-400">
              Weapon
            </span>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-3 text-xs">
            {/* Attack Bonus */}
            <div className="flex items-center gap-1">
              <span className="text-[9px] uppercase tracking-wider text-surface-500">ATK</span>
              <span className={`font-bold tabular-nums ${
                atkNum >= 5 ? "text-gold-400" : atkNum >= 0 ? "text-surface-200" : "text-rose-400"
              }`}>
                {attackBonus || "—"}
              </span>
            </div>

            {/* Vertical divider */}
            <span className="w-px h-3 bg-surface-700/30" />

            {/* Damage */}
            <div className="flex items-center gap-1">
              <span className="text-[9px] uppercase tracking-wider text-surface-500">DMG</span>
              <span className={`font-bold tabular-nums ${colorClass}`}>
                {damageExpression || "—"}
              </span>
            </div>

            {/* Range */}
            {range && (
              <>
                <span className="w-px h-3 bg-surface-700/30" />
                <div className="flex items-center gap-1">
                  <span className="text-[9px] uppercase tracking-wider text-surface-500">RNG</span>
                  <span className="text-surface-300 font-medium">{range}</span>
                </div>
              </>
            )}
          </div>

          {/* Properties */}
          {properties && properties.length > 0 && (
            <div className="flex items-center gap-1 mt-1.5 flex-wrap">
              {properties.map((prop) => (
                <span
                  key={prop}
                  className="px-1 py-0.5 rounded text-[7px] font-medium uppercase tracking-wider bg-surface-700/20 text-surface-400 border border-surface-700/20"
                >
                  {prop}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Quick indicator */}
        <span className="text-surface-600 group-hover:text-surface-400 transition-colors text-[9px] mt-0.5">
          {isMelee ? "\u{1F5E1}" : "\uD83C\uDFF9"}
        </span>
      </div>
    </div>
  );
}
