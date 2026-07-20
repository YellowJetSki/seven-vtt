/**
 * STᚱ VTT — Settings Section Wrapper (Premium Glass v3.0)
 *
 * Reusable card container for campaign settings sections.
 * Replaced glass-gold + corner-ornament with premium glass gradient + edge light.
 */

import type { ReactNode } from "react";

interface SettingsSectionProps {
  icon?: string;
  title: string;
  description?: string;
  children: ReactNode;
}

export default function SettingsSection({ icon, title, description, children }: SettingsSectionProps) {
  return (
    <div className="relative rounded-2xl p-5 space-y-4 bg-gradient-to-b from-[#14151f]/85 to-[#0f1019]/90 border border-white/[0.04] overflow-hidden group">
      {/* Gold edge light */}
      <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-gold-500/20 group-hover:via-gold-500/30 to-transparent transition-all duration-700" />
      {/* Subtle bottom ambient */}
      <div className="absolute -bottom-8 left-[30%] right-[30%] h-16 bg-gold-500/[0.02] rounded-full blur-[40px] pointer-events-none" />

      <div className="relative z-10">
        <h2 className="text-sm font-bold text-gold uppercase tracking-wider flex items-center gap-2">
          {icon && <span>{icon}</span>}
          {title}
        </h2>
        {description && (
          <p className="text-[10px] text-surface-500 mt-1">{description}</p>
        )}
      </div>
      <div className="h-px bg-gradient-to-r from-transparent via-gold-500/10 to-transparent" />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
