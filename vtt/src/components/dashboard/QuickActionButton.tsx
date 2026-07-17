/* ── QuickActionButton ─────────────────────────────────────────
 * Navigation button for quick access to major features.
 * ─────────────────────────────────────────────────────────────── */

import { Link } from "react-router-dom";

interface Props {
  label: string;
  icon: string;
  to: string;
}

export function QuickActionButton({ label, icon, to }: Props) {
  return (
    <Link to={to}
      className="flex flex-col items-center gap-2 rounded-lg border border-surface-700 bg-surface-800 p-4 text-center transition-all hover:border-accent-500/30 hover:bg-surface-700 hover:-translate-y-0.5 active:translate-y-0">
      <span className="text-2xl">{icon}</span>
      <span className="text-xs font-medium text-surface-300">{label}</span>
    </Link>
  );
}
