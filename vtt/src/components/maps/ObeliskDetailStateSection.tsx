/* ── Obelisk Detail: State Section ──────────────────────────────
 * Fantasy-polished state panel showing the obelisk's lifecycle
 * position with a gradient progress bar, affinity-styled indicator,
 * and action buttons with hover glow effects.
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
    <section className="animate-slide-in-right">
      <p className="mb-2 text-[9px] uppercase tracking-wider text-surface-500 font-semibold">State</p>

      {/* State label card with border accent */}
      <div
        className={`rounded-lg border p-3 relative overflow-hidden ${STATE_COLORS[obelisk.state]}`}
        style={{
          borderColor: `${color}44`,
          backgroundColor: `${color}0a`,
          boxShadow: `0 0 12px ${color}11, inset 0 0 20px ${color}06`,
        }}
      >
        {/* Affinity accent stripe */}
        <div
          className="absolute left-0 top-0 bottom-0 w-0.5"
          style={{ backgroundColor: color }}
        />
        <p className="text-xs font-bold pl-2">{STATE_LABELS[obelisk.state]}</p>
        <p className="mt-1 text-[10px] text-surface-500 pl-2">
          Affinity: <span className="text-surface-300 font-medium">{affinity.charAt(0).toUpperCase() + affinity.slice(1)}</span>
        </p>
      </div>

      {/* State progress bar with gradient */}
      <div className="mt-2.5 flex items-center gap-2">
        <div className="flex-1 h-2 rounded-full bg-surface-700/70 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out relative"
            style={{
              width: `${(stateIdx / (OBELISK_STATE_ORDER.length - 1)) * 100}%`,
              background: `linear-gradient(90deg, ${color}88, ${color})`,
              boxShadow: `0 0 6px ${color}44`,
            }}
          >
            {/* Progress shimmer */}
            <div className="absolute inset-0 animate-shimmer rounded-full" />
          </div>
        </div>
        <span className="text-[9px] text-surface-500 shrink-0 font-mono">
          {stateIdx + 1}/{OBELISK_STATE_ORDER.length}
        </span>
      </div>

      {/* Action buttons with hover glow — use dynamic color from context */}
      <div className="mt-2.5 flex gap-1.5">
        {obelisk.state === "undiscovered" && (
          <button
            onClick={() => onSetState(obelisk.id, "discovered")}
            className="flex-1 rounded-md px-2.5 py-1.5 text-[10px] font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-95"
            style={{
              backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)`,
              color: color,
              boxShadow: `0 0 8px ${color}11`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = `color-mix(in srgb, ${color} 25%, transparent)`;
              e.currentTarget.style.boxShadow = `0 0 16px ${color}33`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = `color-mix(in srgb, ${color} 15%, transparent)`;
              e.currentTarget.style.boxShadow = `0 0 8px ${color}11`;
            }}
          >
            🔍 Discover
          </button>
        )}
        {obelisk.state !== "shattered" && obelisk.state !== "undiscovered" && (
          <button
            onClick={() => onAdvanceState(obelisk.id)}
            className="flex-1 rounded-md px-2.5 py-1.5 text-[10px] font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-95"
            style={{
              backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)`,
              color: color,
              boxShadow: `0 0 8px ${color}11`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = `color-mix(in srgb, ${color} 25%, transparent)`;
              e.currentTarget.style.boxShadow = `0 0 16px ${color}33`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = `color-mix(in srgb, ${color} 15%, transparent)`;
              e.currentTarget.style.boxShadow = `0 0 8px ${color}11`;
            }}
          >
            ➡ Advance
          </button>
        )}
        <button
          onClick={() => onSetState(obelisk.id, "shattered")}
          className="rounded-md px-2.5 py-1.5 text-[10px] font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-95"
          style={{
            backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)`,
            color: color,
            boxShadow: `0 0 8px ${color}11`,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = `color-mix(in srgb, ${color} 25%, transparent)`;
            e.currentTarget.style.boxShadow = `0 0 16px ${color}33`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = `color-mix(in srgb, ${color} 15%, transparent)`;
            e.currentTarget.style.boxShadow = `0 0 8px ${color}11`;
          }}
          title="Shatter (irreversible)"
        >
          💥
        </button>
      </div>
    </section>
  );
}
