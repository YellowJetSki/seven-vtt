/**
 * STᚱ VTT — CombatSectionHeader
 *
 * Reusable section header for combat tab sections with gold accent
 * line, label, optional count badge, and optional right action button.
 *
 * Extracted from PlayerSheetCombatTab.tsx monolith (Sprint 9 refactor).
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
    <h3 className="text-[10px] uppercase tracking-widest font-black text-gold-500/60 mb-2 flex items-center gap-2">
      <span className={`w-1 h-3 rounded-full ${accentColor}`} />
      {label}
      {count !== undefined && (
        <span className="text-[9px] font-normal text-surface-500">({count})</span>
      )}
      {children}
    </h3>
  );
}
