/* ── RestTracker ───────────────────────────────────────────────
 * Track short and long rests with timestamps.
 * ─────────────────────────────────────────────────────────────── */

import { Button } from "@/components/ui/Button";

interface Props {
  lastShortRestAt: number | null;
  lastLongRestAt: number | null;
  onRecordRest: (type: "short" | "long") => void;
}

export function RestTracker({ lastShortRestAt, lastLongRestAt, onRecordRest }: Props) {
  return (
    <div className="rounded-xl border border-surface-700 bg-surface-850 p-4">
      <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-surface-400">Rest Tracker</h4>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-surface-700 bg-surface-800 p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-surface-200">Short Rest</span>
            <Button size="xs" variant="secondary" onClick={() => onRecordRest("short")}>Record</Button>
          </div>
          {lastShortRestAt && <p className="mt-1 text-[11px] text-surface-500">Last: {new Date(lastShortRestAt).toLocaleTimeString()}</p>}
        </div>
        <div className="rounded-lg border border-surface-700 bg-surface-800 p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-surface-200">Long Rest</span>
            <Button size="xs" variant="secondary" onClick={() => onRecordRest("long")}>Record</Button>
          </div>
          {lastLongRestAt && <p className="mt-1 text-[11px] text-surface-500">Last: {new Date(lastLongRestAt).toLocaleTimeString()}</p>}
        </div>
      </div>
    </div>
  );
}
