/* ── ResourcesSection ──────────────────────────────────────────
 * Displays custom resources (Bardic Inspiration, Ki, etc.)
 * ─────────────────────────────────────────────────────────────── */

import type { PlayerCharacter } from "@/types";

interface Resource {
  id: string; name: string; current: number; max: number; recharge: string;
}

interface Props {
  resources: Resource[];
  onEdit: () => void;
}

export function ResourcesSection({ resources, onEdit }: Props) {
  return (
    <section className="rounded-xl border border-surface-700 bg-surface-850 p-4 md:p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-surface-400">⚡ Resources</h2>
        <button onClick={onEdit} className="text-xs text-accent-400 hover:text-accent-300 transition-colors">✏️ Edit</button>
      </div>
      {resources.length === 0 ? (
        <p className="text-xs text-surface-500">No resources tracked yet. Click edit to add abilities like Ki points, Bardic Inspiration, etc.</p>
      ) : (
        <div className="space-y-2">
          {resources.map((res) => (
            <div key={res.id} className="rounded-lg bg-surface-800 px-3 py-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-surface-200">{res.name}</span>
                <span className="text-xs font-bold text-accent-400">{res.current}/{res.max}</span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-surface-700 overflow-hidden">
                <div className="h-full rounded-full bg-accent-500" style={{ width: `${Math.max(0, Math.min(100, (res.current / (res.max || 1)) * 100))}%` }} />
              </div>
              <p className="text-[9px] text-surface-500 mt-0.5">Recharges: {res.recharge === "long" ? "Long Rest" : res.recharge === "short" ? "Short Rest" : res.recharge}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
