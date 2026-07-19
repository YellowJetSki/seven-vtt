/**
 * STᚱ VTT — Character HP Gauge
 *
 * Premium HP display component used in BOTH the player sheet (persistent bar)
 * and the DM-facing player cards.
 *
 * Features:
 * - Color-coded tier: Healthy (emerald), Scratched (yellow), Injured (amber),
 *   Critical (rose), Down (red)
 * - Animated gradient HP bar with percentage label
 * - Temporary HP overlay bar
 * - Optional compact mode (for DM card)
 * - Optional expandable controls (for player sheet)
 *
 * Zero purple tokens. Color system: emerald, yellow, amber, rose, red, gold.
 */

import { useState, useCallback } from "react";
import type { PlayerCharacter } from "@/types";

interface CharacterHpGaugeProps {
  character: PlayerCharacter;
  compact?: boolean;
  onHpChange?: (delta: number) => void;
  showControls?: boolean;
}

export interface HpColorTier {
  text: string;
  bg: string;
  bar: string;
  border: string;
  label: string;
}

export function getHpTier(current: number, max: number): HpColorTier {
  const pct = max > 0 ? current / max : 0;
  if (current <= 0) return { text: "text-red-400", bg: "bg-red-500/15", bar: "bg-red-500", border: "border-red-500/15", label: "Down" };
  if (pct <= 0.25) return { text: "text-rose-400", bg: "bg-rose-500/15", bar: "bg-rose-500", border: "border-rose-500/15", label: "Critical" };
  if (pct <= 0.5) return { text: "text-amber-400", bg: "bg-amber-500/15", bar: "bg-amber-500", border: "border-amber-500/15", label: "Injured" };
  if (pct <= 0.75) return { text: "text-yellow-400", bg: "bg-yellow-500/15", bar: "bg-yellow-500", border: "border-yellow-500/15", label: "Scratched" };
  return { text: "text-emerald-400", bg: "bg-emerald-500/15", bar: "bg-emerald-500", border: "border-emerald-500/15", label: "Healthy" };
}

function Bar({
  current,
  max,
  temporary,
  tier,
}: {
  current: number;
  max: number;
  temporary: number;
  tier: HpColorTier;
}) {
  const hpPct = max > 0 ? Math.round((current / max) * 100) : 0;
  const tempBarWidth = max > 0 ? Math.min((temporary / max) * 100, 100 - hpPct) : 0;
  const isAtZero = current <= 0;

  return (
    <div className="relative h-2 bg-surface-800/60 rounded-full overflow-hidden shadow-inner">
      {/* Main HP bar */}
      <div
        className={`h-full rounded-full transition-all duration-500 ease-out ${tier.bar} ${isAtZero ? "animate-pulse-soft" : ""}`}
        style={{ width: `${isAtZero ? 0 : Math.max(hpPct, 3)}%` }}
      />
      {/* Temp HP overlay */}
      {temporary > 0 && !isAtZero && (
        <div
          className="absolute top-0 h-full rounded-r-full bg-gold-500/30"
          style={{
            left: `${Math.min(hpPct, 100)}%`,
            width: `${Math.min(tempBarWidth, 100 - hpPct)}%`,
          }}
        />
      )}
      {/* Percentage label */}
      <span className="absolute inset-0 flex items-center justify-center text-[7px] font-bold text-white/30 tabular-nums">
        {isAtZero ? "" : `${hpPct}%`}
      </span>
    </div>
  );
}

function Controls({
  current,
  max,
  onHpChange,
}: {
  current: number;
  max: number;
  onHpChange: (delta: number) => void;
}) {
  return (
    <div className="flex gap-1">
      <button
        onClick={(e) => { e.stopPropagation(); onHpChange(-10); }}
        className="flex-1 py-1 rounded text-[9px] font-bold bg-red-500/20 text-red-400 border border-red-500/20 hover:bg-red-500/30 active:scale-95 transition-all"
      >-10</button>
      <button
        onClick={(e) => { e.stopPropagation(); onHpChange(-5); }}
        className="flex-1 py-1 rounded text-[9px] font-bold bg-red-500/15 text-red-400/80 border border-red-500/15 hover:bg-red-500/25 active:scale-95 transition-all"
      >-5</button>
      <button
        onClick={(e) => { e.stopPropagation(); onHpChange(-1); }}
        className="flex-1 py-1 rounded text-[9px] font-bold bg-rose-500/10 text-rose-400/70 border border-rose-500/10 hover:bg-rose-500/20 active:scale-95 transition-all"
      >-1</button>
      <button
        onClick={(e) => { e.stopPropagation(); onHpChange(1); }}
        className="flex-1 py-1 rounded text-[9px] font-bold bg-emerald-500/15 text-emerald-400/80 border border-emerald-500/15 hover:bg-emerald-500/25 active:scale-95 transition-all"
      >+1</button>
      <button
        onClick={(e) => { e.stopPropagation(); onHpChange(5); }}
        className="flex-1 py-1 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/30 active:scale-95 transition-all"
      >+5</button>
      <button
        onClick={(e) => { e.stopPropagation(); onHpChange(max); }}
        disabled={current >= max}
        className="px-1.5 py-1 rounded text-[9px] font-bold bg-gold-500/10 text-gold-400 border border-gold-500/15 hover:bg-gold-500/20 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        title="Full heal"
      >↺</button>
    </div>
  );
}

export default function CharacterHpGauge({
  character: c,
  compact = false,
  onHpChange,
  showControls = false,
}: CharacterHpGaugeProps) {
  const tempHP = c.temporaryHitPoints || 0;
  const tier = getHpTier(c.hitPoints.current, c.hitPoints.max);
  const hasTemp = tempHP > 0;

  if (compact) {
    return (
      <div className="w-full">
        {/* HP label row */}
        <div className="flex items-center justify-between mb-0.5">
          <div className="flex items-center gap-1">
            <span className={`text-[9px] font-bold uppercase tracking-wider ${tier.text}`}>
              {tier.label}
            </span>
            {hasTemp && (
              <span className="px-1 py-0.5 rounded text-[7px] bg-amber-500/15 text-amber-400 border border-amber-500/15">
                +{tempHP} THP
              </span>
            )}
          </div>
          <span className="text-[10px] font-bold tabular-nums">
            <span className={tier.text}>{c.hitPoints.current}</span>
            <span className="text-surface-600">/{c.hitPoints.max}</span>
          </span>
        </div>
        <Bar current={c.hitPoints.current} max={c.hitPoints.max} temporary={tempHP} tier={tier} />
        {showControls && onHpChange && (
          <div className="mt-1.5">
            <Controls current={c.hitPoints.current} max={c.hitPoints.max} onHpChange={onHpChange} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`rounded-lg p-2 border transition-all duration-200 ${tier.bg} ${tier.border}`}>
      {/* Status + fraction */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <span className={`text-[10px] font-bold uppercase tracking-wider ${tier.text}`}>
            {tier.label}
          </span>
          {hasTemp && (
            <span className="px-1 py-0.5 rounded text-[8px] bg-amber-500/15 text-amber-400 border border-amber-500/15">
              +{tempHP} THP
            </span>
          )}
        </div>
        <span className="text-xs font-bold tabular-nums">
          <span className={tier.text}>{c.hitPoints.current}</span>
          <span className="text-surface-600">/{c.hitPoints.max}</span>
        </span>
      </div>

      <Bar current={c.hitPoints.current} max={c.hitPoints.max} temporary={tempHP} tier={tier} />

      {showControls && onHpChange && (
        <div className="mt-1.5">
          <Controls current={c.hitPoints.current} max={c.hitPoints.max} onHpChange={onHpChange} />
        </div>
      )}
    </div>
  );
}
