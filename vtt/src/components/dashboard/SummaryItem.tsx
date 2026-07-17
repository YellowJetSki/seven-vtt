/* ── SummaryItem ───────────────────────────────────────────────
 * Displays a single labeled numeric item in a grid.
 * ─────────────────────────────────────────────────────────────── */

interface Props {
  label: string;
  value: number;
}

export function SummaryItem({ label, value }: Props) {
  return (
    <div className="text-center">
      <p className="text-2xl font-bold text-surface-100">{value}</p>
      <p className="mt-1 text-xs text-surface-500">{label}</p>
    </div>
  );
}
