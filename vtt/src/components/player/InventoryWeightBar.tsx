/**
 * STᚱ VTT — Inventory Weight Bar (Premium)
 *
 * Duolingo/Spotify-grade encumbrance visualization:
 * - Animated gradient progress bar with tier thresholds
 * - 33/66/100% marker lines with labels
 * - Multi-layer depth with edge lighting
 * - Color-coded status with icon indicators
 * - Speed penalty display with visual diff
 */

import type { EncumbranceState } from "@/types";
import { getEncumbrancePenalties } from "@/types";
import { formatEncumbranceLevel } from "@/lib/mechanics/encumbrance-engine";

interface InventoryWeightBarProps {
  totalWeight: number;
  carryingCapacity: number;
  encumbranceLevel: EncumbranceState["encumbranceLevel"];
  itemCount: number;
  baseSpeed?: number;
}

function getBarStyle(pct: number): string {
  if (pct <= 33) return "linear-gradient(90deg, #34d399, #10b981)";
  if (pct <= 66) return "linear-gradient(90deg, #fbbf24, #f59e0b)";
  if (pct <= 100) return "linear-gradient(90deg, #f87171, #ef4444)";
  return "linear-gradient(90deg, #ef4444, #dc2626)";
}

function getStatusColor(level: EncumbranceState["encumbranceLevel"]): string {
  switch (level) {
    case "overencumbered": return "text-red-400";
    case "heavily_encumbered": return "text-rose-400";
    case "lightly_encumbered": return "text-amber-400";
    default: return "text-emerald-400";
  }
}

function getStatusIcon(level: EncumbranceState["encumbranceLevel"]): string {
  switch (level) {
    case "overencumbered": return "🔴";
    case "heavily_encumbered": return "🟠";
    case "lightly_encumbered": return "🟡";
    default: return "🟢";
  }
}

const TIER_LABELS = [
  { pct: 33, label: "Light Load" },
  { pct: 66, label: "Medium Load" },
  { pct: 100, label: "Heavy Load" },
];

export default function InventoryWeightBar({
  totalWeight, carryingCapacity, encumbranceLevel, itemCount, baseSpeed = 30,
}: InventoryWeightBarProps) {
  const pct = carryingCapacity > 0 ? (totalWeight / carryingCapacity) * 100 : 0;
  const penalties = getEncumbrancePenalties(encumbranceLevel);
  const modifiedSpeed = Math.max(5, baseSpeed + penalties.speedReduction);
  const statusColor = getStatusColor(encumbranceLevel);
  const statusIcon = getStatusIcon(encumbranceLevel);

  return (
    <div className="relative rounded-xl bg-gradient-to-b from-[#14151f]/90 to-[#0f1019]/95 border border-white/[0.04] p-3 overflow-hidden">
      {/* Gold edge light */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-500/20 to-transparent" />

      {/* Header row */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase tracking-widest font-black text-gold-500/60">
              Encumbrance
            </span>
            <span className="w-px h-3 bg-gold-500/15" />
            <span className="text-[8px] text-surface-600 tabular-nums">{itemCount} item{itemCount !== 1 ? "s" : ""}</span>
          </div>
        </div>
        <span className={`text-[11px] font-bold tabular-nums ${statusColor} drop-shadow-[0_0_4px_rgba(234,179,8,0.1)]`}>
          {totalWeight.toFixed(1)}
          <span className="text-surface-600 font-normal text-[9px]"> / {carryingCapacity} </span>
          <span className="text-[8px] text-surface-500 font-normal">lb</span>
        </span>
      </div>

      {/* Progress bar container with depth */}
      <div className="relative h-3 rounded-full bg-gradient-to-b from-surface-900/80 to-[#07080d]/80 overflow-hidden border border-white/[0.03] shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)]">
        {/* Animated fill */}
        <div
          className="h-full rounded-full transition-all duration-700 ease-out relative"
          style={{
            width: `${Math.min(pct, 100)}%`,
            background: getBarStyle(pct),
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1), 0 2px 4px rgba(0,0,0,0.2)",
          }}
        >
          {/* Shimmer overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent rounded-full animate-pulse" />
        </div>

        {/* Tier marker lines */}
        <div className="absolute inset-0 flex items-center pointer-events-none">
          {TIER_LABELS.map(({ pct: tierPct }) => (
            <div
              key={tierPct}
              className="absolute top-0 bottom-0"
              style={{ left: `${tierPct}%` }}
            >
              <div className="w-px h-full bg-white/8" />
            </div>
          ))}
        </div>
      </div>

      {/* Tier labels row */}
      <div className="flex justify-between mt-1 text-[7px] text-surface-600 tracking-wider">
        <span>0%</span>
        {TIER_LABELS.map(({ pct: tierPct, label }) => (
          <span key={tierPct} className="tabular-nums">{tierPct}% · {label}</span>
        ))}
      </div>

      {/* Status & speed penalty row */}
      <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-white/[0.03]">
        <div className="flex items-center gap-1.5">
          <span className={`text-[9px] font-semibold ${statusColor}`}>
            {statusIcon} {formatEncumbranceLevel(encumbranceLevel)}
          </span>
          {penalties.disadvantageOnChecks && (
            <span className="text-[8px] text-rose-400/60 bg-rose-500/8 px-1.5 py-0.5 rounded border border-rose-500/10">
              ⚠️ Disadvantage on checks
            </span>
          )}
        </div>
        {penalties.speedReduction !== 0 && (
          <div className="flex items-center gap-1.5 bg-rose-500/5 border border-rose-500/10 rounded-lg px-1.5 py-0.5">
            <span className="text-[7px] text-rose-400/70">🏃</span>
            <span className="text-[9px] text-rose-400/80 font-medium tabular-nums">{modifiedSpeed}ft</span>
            <span className="text-[8px] text-surface-600">(was {baseSpeed}ft)</span>
          </div>
        )}
      </div>
    </div>
  );
}
