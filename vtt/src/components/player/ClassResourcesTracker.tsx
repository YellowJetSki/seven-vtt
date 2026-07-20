/**
 * STᚱ VTT — ClassResourcesTracker (Premium)
 *
 * Spotify/Duolingo-grade class resource tracking with:
 * - Per-resource gauge bars with tier color coding
 * - +/- buttons with spring press feedback
 * - Recharge labels with color-coded badges
 * - Exhausted badge when all resources consumed
 * - Usage percentage text with color tiering
 * - Collapsible with resource count badge
 * - Short Rest recharge button
 * - Staggered entrance animation per resource
 */

import { useState } from "react";

export interface ResourceEntry {
  name: string;
  current: number;
  max: number;
  recharge: "short_rest" | "long_rest" | "dawn";
}

interface ClassResourcesTrackerProps {
  resources: ResourceEntry[];
  onResourceChange: (name: string, delta: number) => void;
  collapsible?: boolean;
  defaultOpen?: boolean;
}

const RECHARGE_LABELS: Record<string, string> = {
  short_rest: "Short Rest",
  long_rest: "Long Rest",
  dawn: "Dawn",
};

const RECHARGE_COLORS: Record<string, string> = {
  short_rest: "text-amber-400 bg-amber-500/8 border-amber-500/15",
  long_rest: "text-cyan-400 bg-cyan-500/8 border-cyan-500/15",
  dawn: "text-rose-400 bg-rose-500/8 border-rose-500/15",
};

function getUsageTier(current: number, max: number): { label: string; barGradient: string; textClass: string } {
  const pct = max > 0 ? current / max : 0;
  if (pct === 0) return { label: "Empty", barGradient: "from-red-500 to-rose-500", textClass: "text-red-400" };
  if (pct <= 0.25) return { label: "Depleted", barGradient: "from-rose-500 to-amber-500", textClass: "text-rose-300" };
  if (pct <= 0.5) return { label: "Moderate", barGradient: "from-amber-500 to-yellow-500", textClass: "text-amber-300" };
  if (pct <= 0.75) return { label: "Plenty", barGradient: "from-yellow-500 to-emerald-400", textClass: "text-emerald-300" };
  return { label: "Full", barGradient: "from-emerald-500 to-emerald-400", textClass: "text-emerald-400" };
}

export default function ClassResourcesTracker({
  resources,
  onResourceChange,
  collapsible = false,
  defaultOpen = true,
}: ClassResourcesTrackerProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (!resources || resources.length === 0) return null;

  const totalUsed = resources.reduce((sum, r) => sum + (r.max - r.current), 0);
  const totalMax = resources.reduce((sum, r) => sum + r.max, 0);
  const isAnyRemaining = resources.some((r) => r.current > 0);
  const usagePct = totalMax > 0 ? Math.round(((totalMax - totalUsed) / totalMax) * 100) : 0;

  return (
    <div className="relative rounded-xl bg-gradient-to-b from-[#14151f]/90 to-[#0f1019]/95 border border-white/[0.04] overflow-hidden group hover:border-white/[0.07] transition-all duration-200">
      {/* Edge light */}
      <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-gold-500/20 to-transparent" />

      {/* ── Header ── */}
      <button
        onClick={() => collapsible && setIsOpen(!isOpen)}
        className={`w-full flex items-center gap-2 px-3 py-2.5 relative z-[1] ${
          collapsible ? "cursor-pointer hover:bg-white/[0.01]" : ""
        } transition-colors duration-200`}
      >
        <span className="text-sm">⚡</span>
        <span className="text-[10px] uppercase tracking-widest font-black text-gold-500/60 flex-1 text-left">
          Class Resources
        </span>

        {/* Exhausted badge */}
        {!isAnyRemaining && (
          <span className="px-1.5 py-0.5 rounded text-[7px] font-bold uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/20">
            Exhausted
          </span>
        )}

        {/* Usage pill */}
        <span className={`text-[9px] font-semibold tabular-nums ${
          usagePct <= 25 ? "text-rose-400" : usagePct <= 50 ? "text-amber-400" : "text-emerald-400"
        }`}>
          {totalMax - totalUsed}/{totalMax}
        </span>

        {collapsible && (
          <span className={`text-surface-500 transition-transform duration-200 text-[8px] ${isOpen ? "rotate-180" : ""}`}>
            ▼
          </span>
        )}
      </button>

      {/* ── Resource rows ── */}
      {isOpen && (
        <div className="px-3 pb-3 space-y-2.5 relative z-[1]">
          {resources.map((res, idx) => {
            const { barGradient, textClass } = getUsageTier(res.current, res.max);
            const pct = res.max > 0 ? Math.round((res.current / res.max) * 100) : 0;

            return (
              <div
                key={res.name}
                style={{ animationDelay: `${idx * 50}ms`, animation: "slide-in-up 0.3s ease-out both" }}
              >
                {/* Resource header */}
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-[11px] font-semibold text-surface-200 truncate">{res.name}</span>
                    <span className={`text-[7px] uppercase tracking-wider px-1 py-0.5 rounded border font-medium ${RECHARGE_COLORS[res.recharge] || "text-surface-500 bg-surface-800/40"}`}>
                      {RECHARGE_LABELS[res.recharge] || res.recharge}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => onResourceChange(res.name, -1)}
                      disabled={res.current <= 0}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-gradient-to-b from-red-500/12 to-red-600/8 border border-red-500/20 text-red-400 text-xs font-bold active:scale-85 transition-all disabled:opacity-20 disabled:cursor-not-allowed hover:from-red-500/20 hover:to-red-600/12"
                    >
                      −
                    </button>
                    <span className={`text-xs font-mono font-bold tabular-nums w-7 text-center ${textClass}`}>
                      {res.current}
                    </span>
                    <span className="text-[8px] text-surface-500">/ {res.max}</span>
                    <button
                      onClick={() => onResourceChange(res.name, 1)}
                      disabled={res.current >= res.max}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-gradient-to-b from-emerald-500/12 to-emerald-600/8 border border-emerald-500/20 text-emerald-400 text-xs font-bold active:scale-85 transition-all disabled:opacity-20 disabled:cursor-not-allowed hover:from-emerald-500/20 hover:to-emerald-600/12"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="relative h-2 bg-gradient-to-b from-surface-900/80 to-[#07080d]/80 rounded-full overflow-hidden border border-white/[0.02] shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)]">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${barGradient} transition-all duration-500 ease-out`}
                    style={{ width: `${pct}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/8 to-transparent rounded-full" />
                  </div>
                  {/* Pct label inside bar */}
                  {pct > 20 && (
                    <div className="absolute inset-0 flex items-center justify-start pl-2 pointer-events-none">
                      <span className="text-[6px] font-bold text-white/60 drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]">
                        {pct}%
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex justify-between mt-0.5">
                  <span className="text-[7px] text-surface-600">{pct}% remaining</span>
                  <span className="text-[7px] text-surface-600">
                    {res.recharge === "short_rest" ? "Recharges on short rest" :
                     res.recharge === "long_rest" ? "Recharges on long rest" :
                     "Recharges at dawn"}
                  </span>
                </div>
              </div>
            );
          })}

          {/* ── Short Rest recharge button ── */}
          <div className="flex justify-center pt-1.5">
            <button
              onClick={() => {
                resources
                  .filter((r) => r.recharge === "short_rest")
                  .forEach((r) => {
                    if (r.current < r.max) onResourceChange(r.name, r.max - r.current);
                  });
              }}
              className="px-3 py-1.5 rounded-lg text-[9px] font-semibold bg-gradient-to-b from-amber-500/10 to-amber-500/3 border border-amber-500/15 text-amber-400 hover:from-amber-500/15 hover:to-amber-500/8 active:scale-95 transition-all duration-200"
            >
              🛏 Recharge Short-Rest Resources
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
