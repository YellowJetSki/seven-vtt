/**
 * STᚱ VTT — Overrrides-Style Section Header (Token-Systematic v2.0)
 *
 * Premium section header with gold accent icon container, Playfair Display
 * typography, count badge, and optional action slot.
 * Uses global design tokens from lib/design-tokens.ts.
 */

import { glassCardWithEdge, goldEdgeLight, staggerEntrance } from "@/lib/design-tokens";

interface OverrridesSectionHeaderProps {
  icon: string;
  title: string;
  description?: string;
  count?: number;
  action?: React.ReactNode;
  index?: number;
}

export default function OverrridesSectionHeader({
  icon,
  title,
  description,
  count,
  action,
  index = 0,
}: OverrridesSectionHeaderProps) {
  return (
    <div
      className="flex items-center justify-between px-4 py-3 border-b border-white/[0.04]"
      style={staggerEntrance(index, 30)}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        {/* Premium gold-accented icon container */}
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-gold-500/10 to-amber-500/5 border border-gold-500/15 flex items-center justify-center shrink-0">
          <span className="text-xs">{icon}</span>
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold text-white/80 uppercase tracking-wider font-sans">
              {title}
            </h3>
            {count !== undefined && (
              <span className="text-[9px] text-surface-500 font-mono bg-[#0c0d15] border border-white/[0.04] px-1.5 py-0.5 rounded-full tabular-nums">
                {count}
              </span>
            )}
          </div>
          {description && (
            <p className="text-[9px] text-surface-500 mt-0.5 leading-relaxed">
              {description}
            </p>
          )}
        </div>
      </div>

      {action && (
        <div className="shrink-0 ml-3">
          {action}
        </div>
      )}
    </div>
  );
}
