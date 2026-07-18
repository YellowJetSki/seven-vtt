/* ── Obelisk Detail: State Section ──────────────────────────────
 * Extracted from ObeliskDetailPanel.tsx to maintain <150 line limit.
 * Displays the obelisk's current state, progress bar, and action
 * buttons for advancing/managing the state lifecycle.
 * ─────────────────────────────────────────────────────────────── */

import type { Obelisk, ObeliskState } from "@/types/obelisks";
import { OBELISK_AFFINITIES, AFFINITY_COLORS, OBELISK_STATE_ORDER } from "@/types/obelisks";

/* ── Props ──────────────────────────────────────────────────── */

interface ObeliskDetailStateSectionProps {
  obelisk: Obelisk;
  onSetState: (id: string, state: ObeliskState) => void;
  onAdvanceState: (id: string) => void;
}

/* ── Constants ───────────────────────────────────────────────── */

const STATE_LABELS: Record<ObeliskState, string> = {
  undiscovered: "❓ Undiscovered",
  discovered: "🔍 Discovered",
  attuned: "✨ Attuned",
  corrupted: "💀 Corrupted",
  cleansed: "✧ Cleansed",
  shattered: "💥 Shattered",
};

const STATE_COLORS: Record<ObeliskState, string> = {
  undiscovered: "text-surface-500",
  discovered: "text-mage-400",
  attuned: "text-accent-400",
  corrupted: "text-warrior-400",
  cleansed: "text-divine-400",
  shattered: "text-warrior-500",
};

/* ── Component ───────────────────────────────────────────────── */

export function ObeliskDetailStateSection({
  obelisk,
  onSetState,
  onAdvanceState,
}: ObeliskDetailStateSectionProps) {
  const affinity = OBELISK_AFFINITIES[obelisk.id];
  const color = AFFINITY_COLORS[affinity];
  const stateIdx = OBELISK_STATE_ORDER.indexOf(obelisk.state);

  return (
    <section>
      <p className="mb-2 text-[9px] uppercase tracking-wider text-surface-500">State</p>

      {/* State label */}
      <div
        className={`rounded-lg border border-surface-700/50 bg-surface-800/50 p-3 ${STATE_COLORS[obelisk.state]}`}
      >
        <p className="text-xs font-semibold">{STATE_LABELS[obelisk.state]}</p>
        <p className="mt-1 text-[10px] text-surface-500">
          Affinity: {affinity.charAt(0).toUpperCase() + affinity.slice(1)}
        </p>
      </div>

      {/* State progress bar */}
      <div className="mt-2 flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full bg-surface-700 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${(stateIdx / (OBELISK_STATE_ORDER.length - 1)) * 100}%`,
              backgroundColor: color,
            }}
          />
        </div>
        <span className="text-[9px] text-surface-500 shrink-0">
          {stateIdx + 1}/{OBELISK_STATE_ORDER.length}
        </span>
      </div>

      {/* Action buttons */}
      <div className="mt-2 flex gap-1.5">
        {obelisk.state === "undiscovered" && (
          <button
            onClick={() => onSetState(obelisk.id, "discovered")}
            className="flex-1 rounded-md bg-mage-500/20 px-2 py-1.5 text-[10px] font-medium text-mage-300 hover:bg-mage-500/30 transition-all"
          >
            🔍 Discover
          </button>
        )}
        {obelisk.state !== "shattered" && obelisk.state !== "undiscovered" && (
          <button
            onClick={() => onAdvanceState(obelisk.id)}
            className="flex-1 rounded-md bg-accent-500/20 px-2 py-1.5 text-[10px] font-medium text-accent-300 hover:bg-accent-500/30 transition-all"
          >
            ➡ Advance
          </button>
        )}
        <button
          onClick={() => onSetState(obelisk.id, "shattered")}
          className="rounded-md bg-warrior-500/20 px-2 py-1.5 text-[10px] font-medium text-warrior-300 hover:bg-warrior-500/30 transition-all"
          title="Shatter (irreversible)"
        >
          💥
        </button>
      </div>
    </section>
  );
}
