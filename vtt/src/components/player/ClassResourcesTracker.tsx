/**
 * STᚱ VTT — Class Resources Tracker
 *
 * Reusable component for displaying and managing class resources
 * (Rage, Ki, Channel Divinity, Action Surge, etc.)
 *
 * Features:
 * - +/- buttons with disabled states
 * - Progress bar with usage percentage
 * - Recharge label (Short Rest / Long Rest / Dawn)
 * - Color-coded by usage tier (<25% green, <50% amber, >50% red)
 * - Collapsible section with resource count badge
 *
 * Usage:
 *   <ClassResourcesTracker
 *     resources={character.resources}
 *     onResourceChange={(name, delta) => updateCharacter(...)}
 *   />
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
  /** Optional collapsible container */
  collapsible?: boolean;
  /** Default open state if collapsible */
  defaultOpen?: boolean;
}

const RECHARGE_LABELS: Record<string, string> = {
  short_rest: "Short Rest",
  long_rest: "Long Rest",
  dawn: "Dawn",
};

const RECHARGE_COLORS: Record<string, string> = {
  short_rest: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  long_rest: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  dawn: "text-rose-400 bg-rose-500/10 border-rose-500/20",
};

function getUsageTier(current: number, max: number): { label: string; barClass: string; textClass: string } {
  const pct = max > 0 ? current / max : 0;
  if (pct === 0) return { label: "Empty", barClass: "bg-red-500", textClass: "text-red-400" };
  if (pct <= 0.25) return { label: "Low", barClass: "bg-red-400", textClass: "text-red-300" };
  if (pct <= 0.5) return { label: "Moderate", barClass: "bg-amber-400", textClass: "text-amber-300" };
  if (pct <= 0.75) return { label: "Plenty", barClass: "bg-emerald-400", textClass: "text-emerald-300" };
  return { label: "Full", barClass: "bg-emerald-500", textClass: "text-emerald-400" };
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

  return (
    <div className="rounded-xl bg-obsidian-mid/40 border border-surface-700/20 overflow-hidden">
      {/* ── Header ── */}
      <button
        onClick={() => collapsible && setIsOpen(!isOpen)}
        className={`w-full flex items-center gap-2 px-3 py-2.5 ${
          collapsible ? "cursor-pointer hover:bg-surface-800/30" : ""
        } transition-colors duration-200`}
      >
        <span className="text-sm">⚡</span>
        <span className="text-[10px] uppercase tracking-widest font-black text-gold-500/60 flex-1 text-left">
          Class Resources
        </span>
        <span className="text-[9px] text-surface-500 font-mono tabular-nums">
          {totalMax - totalUsed}/{totalMax}
        </span>
        {!isAnyRemaining && (
          <span className="px-1 py-0.5 rounded text-[7px] font-bold uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/20">
            Exhausted
          </span>
        )}
        {collapsible && (
          <span className={`text-surface-500 transition-transform duration-200 text-[8px] ${isOpen ? "rotate-180" : ""}`}>
            ▼
          </span>
        )}
      </button>

      {/* ── Resource rows ── */}
      {isOpen && (
        <div className="px-3 pb-3 space-y-2">
          {resources.map((res) => {
            const { barClass, textClass } = getUsageTier(res.current, res.max);
            const pct = res.max > 0 ? Math.round((res.current / res.max) * 100) : 0;

            return (
              <div key={res.name}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-[11px] font-semibold text-surface-200 truncate">{res.name}</span>
                    <span className={`text-[7px] uppercase tracking-wider px-1 py-0.5 rounded border font-medium ${RECHARGE_COLORS[res.recharge] || "text-surface-500 bg-surface-800/40"}`}>
                      {RECHARGE_LABELS[res.recharge] || res.recharge}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => onResourceChange(res.name, -1)}
                      disabled={res.current <= 0}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold active:scale-90 transition-all disabled:opacity-20 disabled:cursor-not-allowed hover:bg-red-500/15"
                      title={`Use one ${res.name}`}
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
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold active:scale-90 transition-all disabled:opacity-20 disabled:cursor-not-allowed hover:bg-emerald-500/15"
                      title={`Regain one ${res.name}`}
                    >
                      +
                    </button>
                  </div>
                </div>
                {/* Mini progress bar */}
                <div className="h-1.5 rounded-full bg-obsidian/60 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${barClass}`}
                    style={{ width: `${pct}%` }}
                  />
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

          {/* ── Short Rest button ── */}
          <div className="flex justify-center pt-1">
            <button
              onClick={() => {
                // Recharge all short-rest resources
                resources
                  .filter((r) => r.recharge === "short_rest")
                  .forEach((r) => {
                    if (r.current < r.max) onResourceChange(r.name, r.max - r.current);
                  });
              }}
              className="px-3 py-1.5 rounded-lg text-[9px] font-semibold bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/15 active:scale-95 transition-all"
            >
              🛏 Recharge Short-Rest Resources
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
