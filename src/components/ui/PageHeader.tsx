/* ── Page Header — Consistent Header Pattern ──────────────────
 * Standardized page header with title, subtitle, and action slot.
 * Provides a unified look across all DM pages.
 * ─────────────────────────────────────────────────────────────── */

import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: string;
  actions?: ReactNode;
  /** Show a 'back to parent' breadcrumb link (e.g. Dashboard) */
  parentPage?: { label: string; to: string };
}

export function PageHeader({ title, subtitle, icon, actions, parentPage }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        {parentPage && (
          <div className="mb-1 flex items-center gap-1.5 text-xs text-surface-500">
            <a
              href={parentPage.to}
              className="transition-colors hover:text-accent-400"
              onClick={(e) => {
                e.preventDefault();
                window.history.pushState({}, "", parentPage.to);
                window.dispatchEvent(new PopStateEvent("popstate"));
              }}
            >
              {parentPage.label}
            </a>
            <span className="text-surface-600 select-none">/</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          {icon && <span className="text-2xl shrink-0">{icon}</span>}
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-surface-100 md:text-2xl truncate">{title}</h2>
            {subtitle && <p className="mt-1 text-sm text-surface-400 truncate">{subtitle}</p>}
          </div>
        </div>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
