/* ── Breadcrumb Bar — Navigation Context for DM Pages ──────────
 * Displays a clean breadcrumb trail that reflects the current
 * page location within the DM section. Automatically resolves
 * page names from route paths.
 * ─────────────────────────────────────────────────────────────── */

import { Link, useLocation } from "react-router-dom";

const PAGE_LABELS: Record<string, { label: string; icon: string }> = {
  "/dashboard": { label: "Dashboard", icon: "🏠" },
  "/players": { label: "Player Characters", icon: "⚔" },
  "/homebrew": { label: "Homebrew", icon: "⚗️" },
  "/encounters": { label: "Combat Center", icon: "⚔️" },
  "/maps": { label: "Battle Maps", icon: "🗺️" },
  "/journal": { label: "Journal", icon: "📖" },
  "/settings": { label: "Settings", icon: "⚙️" },
};

export function BreadcrumbBar() {
  const location = useLocation();
  const path = location.pathname;

  // Only show on DM pages
  if (path === "/") return null;

  const pageConfig = PAGE_LABELS[path];

  if (!pageConfig) return null;

  return (
    <nav aria-label="Breadcrumb" className="mb-2 flex items-center gap-2 text-xs text-surface-500">
      <Link to="/dashboard" className="transition-colors hover:text-accent-400">
        Dashboard
      </Link>
      {path !== "/dashboard" && (
        <>
          <span className="text-surface-600 select-none">/</span>
          <span className="flex items-center gap-1 text-surface-300 font-medium">
            <span>{pageConfig.icon}</span>
            {pageConfig.label}
          </span>
        </>
      )}
    </nav>
  );
}
