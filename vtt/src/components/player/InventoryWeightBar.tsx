/**
 * STᚱ VTT — Inventory Weight Bar
 *
 * Visual encumbrance tracker showing:
 * - Gradient progress bar (green → amber → red)
 * - 33%/66%/100% markers
 * - Current load vs capacity
 * - Item count
 * - Speed penalty display
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

export default function InventoryWeightBar({
  totalWeight, carryingCapacity, encumbranceLevel, itemCount, baseSpeed = 30,
}: InventoryWeightBarProps) {
  const pct = carryingCapacity > 0 ? (totalWeight / carryingCapacity) * 100 : 0;
  const penalties = getEncumbrancePenalties(encumbranceLevel);
  const modifiedSpeed = Math.max(5, baseSpeed + penalties.speedReduction);

  return (
    <div className="rounded-xl bg-obsidian-mid/40 border border-surface-700/10 p-3">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className="text-[9px] uppercase tracking-widest font-black text-gold-500/60">Encumbrance</span>
          <span className="text-[8px] text-surface-600">{itemCount} items</span>
        </div>
        <span className={`text-[10px] font-bold tabular-nums ${
          encumbranceLevel === "overencumbered" ? "text-red-400" :
          encumbranceLevel === "heavily_encumbered" ? "text-rose-400" :
          encumbranceLevel === "lightly_encumbered" ? "text-amber-400" :
          "text-emerald-400"
        }`}>
          {totalWeight.toFixed(1)} / {carryingCapacity} lb
        </span>
      </div>

      {/* Progress bar */}
      <div className="relative h-2.5 rounded-full bg-surface-800/60 overflow-hidden border border-white/[0.04]">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${Math.min(pct, 100)}%`,
            background: getBarStyle(pct),
          }}
        />
        {/* Marker lines */}
        <div className="absolute inset-0 flex items-center px-1">
          <div className="w-full h-full relative">
            <div className="absolute left-[33%] top-0 bottom-0 w-px bg-white/10" />
            <div className="absolute left-[66%] top-0 bottom-0 w-px bg-white/10" />
          </div>
        </div>
      </div>

      {/* Labels */}
      <div className="flex justify-between mt-1 text-[7px] text-surface-600">
        <span>0</span>
        <span>33%</span>
        <span>66%</span>
        <span>{carryingCapacity} lb</span>
      </div>

      {/* Status row */}
      <div className="flex items-center justify-between mt-1">
        <span className={`text-[9px] font-medium ${
          encumbranceLevel === "overencumbered" ? "text-red-400" :
          encumbranceLevel === "heavily_encumbered" ? "text-rose-400" :
          encumbranceLevel === "lightly_encumbered" ? "text-amber-400" :
          "text-emerald-400"
        }`}>
          {formatEncumbranceLevel(encumbranceLevel)}
        </span>
        {penalties.speedReduction !== 0 && (
          <div className="flex items-center gap-1">
            <span className="text-[8px] text-red-400/70">🏃</span>
            <span className="text-[9px] text-red-400/70 font-medium">{modifiedSpeed}ft</span>
            <span className="text-[8px] text-surface-600">(was {baseSpeed}ft)</span>
          </div>
        )}
      </div>
    </div>
  );
}
