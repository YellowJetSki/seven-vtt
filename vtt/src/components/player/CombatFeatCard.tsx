/**
 * STᚱ VTT — Combat Feat Card
 *
 * Reusable feat/feature card for the Combat Tab.
 * Renders a single feat's effect including:
 *   - Name with feat icon, source badge (SRD/Homebrew/Inferred)
 *   - Effect description / benefits
 *   - Activation requirement indicator
 *   - Toggle state for active/inactive
 *   - Source badge when showSource is enabled
 */

import type { CombatEntity } from "@/types/unified-entities";
import { getSourceBadge, type EntitySource } from "@/lib/combat/compendium-bridge";

interface CombatFeatCardProps {
  entity: CombatEntity;
  onToggle?: (id: string, active: boolean) => void;
  showSource?: boolean;
}

export default function CombatFeatCard({ entity, onToggle, showSource = false }: CombatFeatCardProps) {
  const {
    id,
    name,
    icon,
    effectDescription,
    requiresActivation,
    isActive,
    colorClass = "text-violet-400",
    sourceType,
  } = entity;

  return (
    <div className={`rounded-xl border p-3 transition-all duration-200 group ${
      isActive
        ? "bg-gold-500/[0.02] border-gold/10"
        : "bg-obsidian-mid/40 border-surface-700/20"
    }`}>
      <div className="flex items-start gap-2.5">
        {/* Icon */}
        <span className={`text-lg mt-0.5 flex-shrink-0 ${isActive ? colorClass : "text-surface-500"}`} aria-hidden="true">
          {icon || "\uD83C\uDFC6"}
        </span>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Name + Source badge + badges */}
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <span className={`text-sm font-semibold truncate max-w-[120px] ${
              isActive ? "text-surface-200" : "text-surface-400"
            }`}>
              {name}
            </span>
            {showSource && sourceType && (
              <span className={`px-1 py-0.5 rounded text-[7px] font-bold uppercase tracking-wider border ${getSourceBadge(sourceType as EntitySource).className}`}>
                {getSourceBadge(sourceType as EntitySource).icon} {getSourceBadge(sourceType as EntitySource).label}
              </span>
            )}
            {requiresActivation && (
              <span className="px-1 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Requires Action
              </span>
            )}
          </div>

          {/* Effect description */}
          {effectDescription && (
            <p className="text-[10px] text-surface-500 leading-relaxed line-clamp-2">
              {effectDescription}
            </p>
          )}
        </div>

        {/* Toggle + indicator */}
        <div className="flex flex-col items-center gap-1">
          {onToggle && (
            <button
              onClick={() => onToggle(id, !isActive)}
              className={`p-1 rounded transition-all ${
                isActive
                  ? "bg-gold-500/10 text-gold-400"
                  : "text-surface-600 hover:text-surface-400"
              }`}
              title={isActive ? "Deactivate" : "Activate"}
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
              </svg>
            </button>
          )}
          <span className={`text-[8px] font-bold uppercase tracking-wider ${
            isActive ? "text-gold-400" : "text-surface-500"
          }`}>
            {isActive ? "ON" : "OFF"}
          </span>
        </div>
      </div>
    </div>
  );
}
