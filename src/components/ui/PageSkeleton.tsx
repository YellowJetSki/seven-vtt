/* ── Page Skeleton — Loading State Pattern ─────────────────────
 * Reusable skeleton loader for data-fetching states.
 * Provides a consistent pulsing placeholder pattern across all pages.
 * ─────────────────────────────────────────────────────────────── */

interface PageSkeletonProps {
  /** Number of rows to show */
  rows?: number;
  /** Type of skeleton layout */
  variant?: "card" | "list" | "table" | "detail";
}

export function PageSkeleton({ rows = 3, variant = "card" }: PageSkeletonProps) {
  if (variant === "list") {
    return (
      <div className="space-y-3 animate-pulse">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 rounded-xl border border-surface-700 bg-surface-850 p-4">
            <div className="h-10 w-10 rounded-lg bg-surface-700" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/5 rounded bg-surface-700" />
              <div className="h-3 w-2/5 rounded bg-surface-700" />
            </div>
            <div className="h-8 w-20 rounded-lg bg-surface-700" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === "table") {
    return (
      <div className="space-y-2 animate-pulse">
        <div className="flex gap-4 px-4 py-3">
          <div className="h-3 w-1/4 rounded bg-surface-700" />
          <div className="h-3 w-1/4 rounded bg-surface-700" />
          <div className="h-3 w-1/4 rounded bg-surface-700" />
          <div className="h-3 w-1/4 rounded bg-surface-700" />
        </div>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4 rounded-xl border border-surface-700 bg-surface-850 px-4 py-3">
            <div className="h-4 w-1/4 rounded bg-surface-700" />
            <div className="h-4 w-1/4 rounded bg-surface-700" />
            <div className="h-4 w-1/4 rounded bg-surface-700" />
            <div className="h-4 w-1/4 rounded bg-surface-700" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === "detail") {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-1/3 rounded bg-surface-700" />
        <div className="h-4 w-2/3 rounded bg-surface-700" />
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-surface-700 bg-surface-850 p-4">
              <div className="h-12 w-12 rounded-lg bg-surface-700 mb-3" />
              <div className="h-4 w-3/4 rounded bg-surface-700 mb-2" />
              <div className="h-3 w-1/2 rounded bg-surface-700" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Card variant (default)
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="rounded-xl border border-surface-700 bg-surface-850 overflow-hidden">
          <div className="h-36 bg-surface-700" />
          <div className="p-4 space-y-2">
            <div className="h-4 w-3/4 rounded bg-surface-700" />
            <div className="h-3 w-1/2 rounded bg-surface-700" />
            <div className="flex gap-2 mt-3">
              <div className="h-6 w-16 rounded-full bg-surface-700" />
              <div className="h-6 w-16 rounded-full bg-surface-700" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
