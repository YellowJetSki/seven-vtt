/* ── Loading Skeleton ───────────────────────────────────────────
 * Pulse-animated skeleton placeholders for loading states.
 * Used in dashboards and pages while data hydrates.
 * ─────────────────────────────────────────────────────────────── */

/* ═══════════════════════════════════════════════════════════════
 * USAGE:
 *   <Skeleton className="h-8 w-48" />
 *   <Skeleton variant="circle" className="h-12 w-12" />
 *   <Skeleton variant="card" count={3} />
 * ═══════════════════════════════════════════════════════════════ */

interface SkeletonProps {
  /** Height & width via Tailwind classes */
  className?: string;
  /** Pre-designed shapes */
  variant?: "text" | "circle" | "card" | "stat";
  /** How many skeleton items to render (for lists) */
  count?: number;
}

export function Skeleton({ className = "", variant, count = 1 }: SkeletonProps) {
  const baseClass = "animate-pulse rounded-md bg-surface-700/60";

  const variantClasses: Record<string, string> = {
    text: "h-4 w-full",
    circle: "h-10 w-10 rounded-full",
    card: "h-32 w-full rounded-xl",
    stat: "h-24 w-full rounded-xl",
  };

  const resolvedClass = variant ? variantClasses[variant] ?? "" : "";
  const combinedClass = `${baseClass} ${resolvedClass} ${className}`.trim();

  if (count > 1) {
    return (
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className={combinedClass} />
        ))}
      </div>
    );
  }

  return <div className={combinedClass} />;
}

/* ── Specialized Skeleton Compositions ──────────────────────── */

export function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} variant="stat" />
        ))}
      </div>
      <Skeleton variant="card" />
      <Skeleton variant="card" />
    </div>
  );
}

export function CombatSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-16 w-full rounded-xl" />
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    </div>
  );
}
