/**
 * STᚱ VTT — Settings Section Wrapper
 *
 * Reusable card container for campaign settings sections.
 * Provides consistent gold glass styling, corner ornaments, and section layout.
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
    <div className="glass-gold rounded-2xl p-5 space-y-4 relative border border-gold/5">
      <div className="corner-ornament corner-tl corner-gold" />
      <div className="corner-ornament corner-tr corner-gold" />
      <div>
        <h2 className="text-sm font-bold text-gold uppercase tracking-wider flex items-center gap-2">
          {icon && <span>{icon}</span>}
          {title}
        </h2>
        {description && (
          <p className="text-[10px] text-surface-500 mt-1">{description}</p>
        )}
      </div>
      <div className="h-px bg-gradient-to-r from-transparent via-gold-500/10 to-transparent" />
      {children}
    </div>
  );
}
