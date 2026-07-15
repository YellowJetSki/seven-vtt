/* ── Empty State ────────────────────────────────────────────────
 * A standardized empty state component for all pages.
 * Provides a consistent look for when data is missing or filters
 * return no results.
 * ─────────────────────────────────────────────────────────────── */

import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";

interface EmptyStateProps {
  /** Emoji/icon to display */
  icon: string;
  /** Primary heading */
  title: string;
  /** Secondary description */
  description: string;
  /** Optional action button */
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Optional secondary action */
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  /** Extra content below the description */
  children?: ReactNode;
}

export function EmptyState({ icon, title, description, action, secondaryAction, children }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-surface-700 bg-surface-850 py-16 px-6 text-center">
      <span className="text-5xl text-surface-600 mb-4">{icon}</span>
      <h3 className="text-lg font-semibold text-surface-200 mb-1">{title}</h3>
      <p className="text-sm text-surface-500 mb-6 max-w-md">{description}</p>
      <div className="flex items-center gap-3">
        {action && <Button size="sm" onClick={action.onClick}>{action.label}</Button>}
        {secondaryAction && <Button variant="ghost" size="sm" onClick={secondaryAction.onClick}>{secondaryAction.label}</Button>}
      </div>
      {children}
    </div>
  );
}
