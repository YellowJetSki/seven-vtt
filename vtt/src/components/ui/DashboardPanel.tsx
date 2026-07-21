/**
 * STᚱ VTT — DashboardPanel (Overrrides/Ventriloc-Grade Reusable Glass)
 *
 * Reusable premium glass gradient panel for the DM Dashboard.
 * Eliminates the repeated `bg-gradient-to-b from-[#141520] to-[#0f1019] 
 * border border-white/[0.04] rounded-xl overflow-hidden` pattern.
 *
 * Features:
 * - Optional header slot with icon, title, count badge, and action
 * - Gold edge light on top (auto)
 * - Bottom edge light on hover (auto)
 * - Staggered entrance via `animation-delay` in ms
 * - Consistent spacing and hover feedback
 * - Corner ambient glow pocket
 */

import type { ReactNode } from "react";

interface DashboardPanelProps {
  /** Header icon emoji */
  icon?: string;
  /** Header title */
  title?: string;
  /** Optional count badge value */
  count?: number;
  /** Optional right-side action element */
  action?: ReactNode;
  /** Children content */
  children: ReactNode;
  /** Entrance animation delay in ms. Default 0 (no stagger or auto 50ms per instance) */
  delay?: number;
  /** Optional extra className for the outer wrapper */
  className?: string;
  /** Smaller variant for tight spaces */
  compact?: boolean;
}

export default function DashboardPanel({
  icon,
  title,
  count,
  action,
  children,
  delay = 0,
  className = "",
  compact = false,
}: DashboardPanelProps) {
  return (
    <div
      className={`relative group/panel animate-in fade-in slide-in-from-bottom-3 duration-500 ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Glass gradient card */}
      <div className="bg-gradient-to-b from-[#141520] to-[#0f1019] border border-white/[0.04] rounded-xl overflow-hidden">
        {/* Gold edge light */}
        <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-gold-500/20 to-transparent pointer-events-none" />

        {/* Bottom edge light on hover */}
        <div className="absolute bottom-0 left-[20%] right-[20%] h-px bg-gradient-to-r from-transparent via-gold-500/0 group-hover/panel:via-gold-500/10 to-transparent transition-all duration-500 pointer-events-none" />

        {/* Corner ambient glow */}
        <div className="absolute -top-8 -right-8 w-20 h-20 bg-gold-500/[0.03] rounded-full blur-[40px] pointer-events-none" />

        {/* Optional Header */}
        {(icon || title || action !== undefined) && (
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.04] relative z-10">
            {(icon || title) && (
              <div className="flex items-center gap-2">
                {icon && <span className={`text-sm ${compact ? "text-xs" : ""}`}>{icon}</span>}
                {title && (
                  <span className={`font-bold text-white/70 uppercase tracking-wider ${compact ? "text-[9px]" : "text-[10px]"}`}>
                    {title}
                  </span>
                )}
                {count !== undefined && count > 0 && (
                  <span className="text-[9px] font-mono tabular-nums px-1.5 py-0.5 rounded bg-gold-500/8 border border-gold/15 text-gold-400">
                    {count}
                  </span>
                )}
              </div>
            )}
            {action && <div className="flex items-center gap-2">{action}</div>}
          </div>
        )}

        {/* Content area */}
        <div className={`relative z-10 ${compact ? "p-3" : "p-4"}`}>
          {children}
        </div>
      </div>
    </div>
  );
}
