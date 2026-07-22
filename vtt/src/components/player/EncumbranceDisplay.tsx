/**
 * STᚱ VTT — Encumbrance Display (Premium Upgrade)
 *
 * Live weight tracking with:
 * - Gradient progress bar (emerald → amber → rose → red)
 * - Speed penalty display with aninated indicators
 * - Weight breakdown with expandable sections
 * - Color-coded encumbrance levels
 * - Visual carry capacity rings at 33/66/100%
 * - Item count + currency weight preview
 */

import { useState } from "react";
import { calculateEncumbrance, encumbranceToSpeed, formatEncumbranceLevel } from "@/lib/mechanics/encumbrance-engine";
import type { EncumbranceState } from "@/types";

interface EncumbranceDisplayProps {
  strength: number;
  equipment: { item: string; quantity: number; weight: number }[];
  inventory: { name: string; quantity: number; weight: number }[];
  currency: { leptons: number; quadrants: number; assarions: number };
  baseSpeed?: number;
  variant?: "standard" | "variant";
}

const LEVEL_STYLES: Record<string, { bar: string; text: string; icon: string; ring: string }> = {
  unencumbered: {
    bar: "linear-gradient(90deg, #34d399, #10b981)",
    text: "text-emerald-400",
    icon: "✅",
    ring: "shadow-[0_0_4px_rgba(52,211,153,0.15)]",
  },
  lightly_encumbered: {
    bar: "linear-gradient(90deg, #fbbf24, #f59e0b)",
    text: "text-amber-400",
    icon: "⚠️",
    ring: "shadow-[0_0_4px_rgba(251,191,36,0.15)]",
  },
  heavily_encumbered: {
    bar: "linear-gradient(90deg, #f87171, #ef4444)",
    text: "text-rose-400",
    icon: "🔴",
    ring: "shadow-[0_0_6px_rgba(248,113,113,0.2)]",
  },
  overencumbered: {
    bar: "linear-gradient(90deg, #ef4444, #dc2626)",
    text: "text-red-400",
    icon: "🚫",
    ring: "shadow-[0_0_8px_rgba(239,68,68,0.25)]",
  },
};

export default function EncumbranceDisplay({
  strength, equipment, inventory, currency,
  baseSpeed = 30, variant = "variant",
}: EncumbranceDisplayProps) {
  const [showBreakdown, setShowBreakdown] = useState(false);

  const result = calculateEncumbrance(strength, equipment, inventory, currency, variant);
  const modifiedSpeed = encumbranceToSpeed(baseSpeed, result.encumbrance);
  const pct = result.encumbrance.carryingCapacity > 0
    ? (result.encumbrance.totalWeight / result.encumbrance.carryingCapacity) * 100
    : 0;

  const level = result.encumbrance.encumbranceLevel;
  const style = LEVEL_STYLES[level] || LEVEL_STYLES.unencumbered;
  const hasSpeedPenalty = modifiedSpeed !== baseSpeed;

  // Total items count
  const itemCount = equipment.length + inventory.reduce((s, i) => s + i.quantity, 0);

  return (
    <div className={`space-y-2 p-3 rounded-xl bg-obsidian-mid/40 border border-surface-700/20 hover:border-gold/10 transition-all duration-200 ${style.ring}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] uppercase tracking-widest text-gold-500/60 font-black">Encumbrance</span>
          <span className="text-[8px] text-surface-600">{itemCount} items</span>
        </div>
        <span className={`text-[9px] font-semibold ${style.text}`}>
          {style.icon} {formatEncumbranceLevel(level)}
        </span>
      </div>

      {/* Weight summary */}
      <div className="grid grid-cols-2 gap-2">
        <div className="px-2 py-1.5 rounded-lg bg-obsidian-mid/50 border border-surface-700/20">
          <span className="text-[8px] text-surface-600 block">Load</span>
          <span className="text-sm font-bold tabular-nums text-surface-200">{result.weight.total.toFixed(1)}</span>
          <span className="text-[9px] text-surface-600 ml-0.5">lb</span>
        </div>
        <div className="px-2 py-1.5 rounded-lg bg-obsidian-mid/50 border border-surface-700/20">
          <span className="text-[8px] text-surface-600 block">Capacity</span>
          <span className="text-sm font-bold tabular-nums text-gold-300">{result.encumbrance.carryingCapacity}</span>
          <span className="text-[9px] text-surface-600 ml-0.5">lb</span>
        </div>
      </div>

      {/* Progress bar — premium */}
      <div className="relative h-3 rounded-full bg-surface-800/60 overflow-hidden border border-white/[0.04]">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${Math.min(pct, 100)}%`,
            background: style.bar,
          }}
        />
        {/* Marker lines */}
        <div className="absolute inset-0 flex items-center">
          <div className="w-full h-full relative">
            <div className="absolute left-[33%] top-0 bottom-0 w-px bg-white/8" />
            <div className="absolute left-[66%] top-0 bottom-0 w-px bg-white/8" />
          </div>
        </div>
        {/* Center percentage */}
        {pct > 10 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[7px] font-bold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
              {Math.round(pct)}%
            </span>
          </div>
        )}
      </div>

      {/* Marker labels */}
      <div className="flex justify-between text-[7px] text-surface-600 -mt-1">
        <span>0</span>
        <span>33%</span>
        <span>66%</span>
        <span>100%</span>
      </div>

      {/* Speed penalty alert */}
      {hasSpeedPenalty && (
        <div className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-rose-500/8 border border-rose-500/15">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px]">🏃</span>
            <span className="text-[10px] text-rose-400/80 font-medium">Speed penalty</span>
          </div>
          <span className="text-[11px] font-bold text-rose-400 tabular-nums">
            {modifiedSpeed}ft
            <span className="text-[9px] text-rose-400/50 ml-1">(was {baseSpeed}ft)</span>
          </span>
        </div>
      )}

      {/* Weight breakdown (collapsible) */}
      <button
        onClick={() => setShowBreakdown(!showBreakdown)}
        className="w-full flex items-center justify-between text-[10px] text-surface-500 hover:text-surface-300 transition-colors"
      >
        <span>Weight breakdown</span>
        <span className={`transition-transform duration-200 ${showBreakdown ? "rotate-180" : ""}`}>▼</span>
      </button>

      {showBreakdown && (
        <div className="space-y-0.5 pl-2 border-l border-surface-700/30 animate-in slide-in-from-top-1 duration-150">
          <div className="flex justify-between text-[10px] text-surface-400">
            <span>Equipment</span>
            <span className="tabular-nums">{result.weight.baseItems.toFixed(1)} lb</span>
          </div>
          <div className="flex justify-between text-[10px] text-surface-400">
            <span>Inventory ({inventory.length} items)</span>
            <span className="tabular-nums">{result.weight.inventory.toFixed(1)} lb</span>
          </div>
          <div className="flex justify-between text-[10px] text-surface-400">
            <span>Currency</span>
            <span className="tabular-nums">{result.weight.currency.toFixed(2)} lb</span>
          </div>
          <div className="flex justify-between text-xs font-medium text-surface-200 pt-1.5 border-t border-surface-700/20 mt-1.5">
            <span>Total load</span>
            <span className="tabular-nums">{result.weight.total.toFixed(1)} lb</span>
          </div>

          {/* Remaining capacity */}
          <div className="flex justify-between text-[10px] pt-1">
            <span className="text-surface-500">Remaining</span>
            <span className={`tabular-nums font-medium ${pct < 90 ? "text-emerald-400" : "text-rose-400"}`}>
              {(result.encumbrance.carryingCapacity - result.weight.total).toFixed(1)} lb
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
