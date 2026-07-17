/* ── StatCard ──────────────────────────────────────────────────
 * Reusable card for displaying a labeled numeric stat with icon/color.
 * ─────────────────────────────────────────────────────────────── */

interface Props {
  label: string;
  value: number | string;
  icon: string;
  color: string;
  detail?: string;
}

export function StatCard({ label, value, icon, color, detail }: Props) {
  return (
    <div className={`rounded-lg border border-surface-700 bg-surface-850 p-4 border-l-4 ${color} transition-all hover:-translate-y-0.5 hover:shadow-lg`}>
      <div className="flex items-center justify-between">
        <span className="text-xl">{icon}</span>
        <span className="text-2xl font-bold text-surface-100">{value}</span>
      </div>
      <p className="mt-1 text-xs font-medium text-surface-400">{label}</p>
      {detail && <p className="mt-0.5 text-[11px] text-surface-500">{detail}</p>}
    </div>
  );
}
