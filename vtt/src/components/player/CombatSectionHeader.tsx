/**
 * STᚱ VTT — CombatSectionHeader (Premium)
 *
 * Duolingo/Spotify-grade section header with:
 * - Gold accent pill (not just a line)
 * - Label with tracking
 * - Count badge with premium styling
 * - Right-aligned children slot for action buttons
 * - Decorative divider that extends full width
 * - Hover state for interactive parents
 */

import type { ReactNode } from "react";

interface CombatSectionHeaderProps {
  label: string;
  count?: number;
  accentColor?: string;
  children?: ReactNode;
}

export default function CombatSectionHeader({
  label,
  count,
  accentColor = "bg-gold-500/40",
  children,
}: CombatSectionHeaderProps) {
  return (
    <div className="flex items-center gap-2 mb-2">
      {/* Accent pill */}
      <span className={`w-1 h-3.5 rounded-full shrink-0 ${accentColor}`} />

      {/* Label */}
      <span className="text-[10px] uppercase tracking-widest font-black text-gold-500/60">
        {label}
      </span>

      {/* Count badge */}
      {count !== undefined && count >= 0 && (
        <span className="text-[8px] font-semibold text-surface-500 bg-surface-800/50 px-1.5 py-0.5 rounded-full tabular-nums border border-surface-700/20">
          {count}
        </span>
      )}

      {/* Spacer */}
      <div className="flex-1 min-w-0" />

      {/* Children slot (action buttons) */}
      {children}
    </div>
  );
}
