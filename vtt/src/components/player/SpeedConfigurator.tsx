/**
 * STᚱ VTT — Speed Configurator
 *
 * Interactive speed display with type-based movement detection.
 * Shows walk, fly, swim, climb, burrow speeds with color-coded badges.
 * Supports race/class base speed overrides and encumbrance penalties.
 *
 * Usage:
 *   <SpeedConfigurator
 *     speeds={{ walk: 30, fly: 60, swim: 15 }}
 *     canHover={false}
 *     encumbrancePenalty={-10}
 *   />
 */

import { useMemo } from "react";

interface SpeedConfiguratorProps {
  speeds: {
    walk: number;
    fly?: number;
    swim?: number;
    climb?: number;
    burrow?: number;
    canHover?: boolean;
  };
  /** Encumbrance speed penalty (e.g., -10 for light encumbrance) */
  encumbrancePenalty?: number;
  /** Class/race bonus to specific speed type */
  bonuses?: Partial<Record<"walk" | "fly" | "swim" | "climb" | "burrow", number>>;
  className?: string;
  /** If true, shows in a compact horizontal strip */
  compact?: boolean;
}

const SPEED_TYPES: { key: string; label: string; icon: string; color: string }[] = [
  { key: "walk", label: "Walk", icon: "👟", color: "text-emerald-400" },
  { key: "fly", label: "Fly", icon: "🪽", color: "text-cyan-400" },
  { key: "swim", label: "Swim", icon: "🏊", color: "text-blue-400" },
  { key: "climb", label: "Climb", icon: "🧗", color: "text-amber-400" },
  { key: "burrow", label: "Burrow", icon: "⛏️", color: "text-rose-400" },
];

export default function SpeedConfigurator({
  speeds,
  encumbrancePenalty = 0,
  bonuses = {},
  className = "",
  compact = false,
}: SpeedConfiguratorProps) {
  const activeSpeeds = useMemo(
    () => SPEED_TYPES.filter((st) => {
      const val = (speeds as any)[st.key];
      return typeof val === "number" && val > 0;
    }),
    [speeds]
  );

  const hasEncumbrance = encumbrancePenalty < 0;

  if (compact) {
    return (
      <div className={`flex items-center gap-1.5 ${className}`}>
        {activeSpeeds.map((st) => {
          const base = (speeds as any)[st.key] as number;
          const bonus = (bonuses as any)[st.key] || 0;
          const effective = Math.max(0, base + bonus + (st.key === "walk" ? encumbrancePenalty : 0));
          return (
            <div
              key={st.key}
              className="flex items-center gap-1 py-0.5 px-1.5 rounded-md bg-[#0c0d15] border border-white/[0.04]"
            >
              <span className="text-[9px]">{st.icon}</span>
              <span className={`text-[10px] font-bold tabular-nums ${effective > 0 ? st.color : "text-rose-400"}`}>
                {effective}ft
              </span>
            </div>
          );
        })}
        {speeds.canHover && (
          <div className="flex items-center gap-1 py-0.5 px-1.5 rounded-md bg-[#0c0d15] border border-cyan-500/10">
            <span className="text-[9px]">✨</span>
            <span className="text-[8px] font-bold text-cyan-400">Hover</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <p className="text-[9px] font-bold uppercase tracking-wider text-white/50 mb-1">
        Movement Speed
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
        {activeSpeeds.map((st) => {
          const base = (speeds as any)[st.key] as number;
          const bonus = (bonuses as any)[st.key] || 0;
          const effective = Math.max(0, base + bonus + (st.key === "walk" ? encumbrancePenalty : 0));
          const isPenalized = st.key === "walk" && hasEncumbrance && effective < base;

          return (
            <div
              key={st.key}
              className={`
                relative flex items-center gap-2 py-1.5 px-2.5 rounded-lg
                border transition-all duration-200
                ${isPenalized
                  ? "bg-rose-500/5 border-rose-500/10"
                  : "bg-[#0c0d15] border-white/[0.04] hover:border-gold/10"
                }
              `}
            >
              <span className="text-[14px]">{st.icon}</span>
              <div className="min-w-0">
                <span className="text-[9px] font-medium uppercase tracking-wider text-surface-500 block leading-tight">
                  {st.label}
                  {bonus > 0 && (
                    <span className="text-emerald-400 ml-1 text-[8px] font-bold">+{bonus}</span>
                  )}
                  {isPenalized && (
                    <span className="text-rose-400 ml-1 text-[8px] font-bold">{encumbrancePenalty}</span>
                  )}
                </span>
                <div className="flex items-center gap-1">
                  <span className={`text-sm font-black tabular-nums ${st.color}`}>
                    {effective}
                  </span>
                  <span className="text-[9px] text-surface-500">ft</span>
                  {isPenalized && (
                    <span className="text-[8px] text-rose-400/60 line-through ml-1">{base}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Hover indicator */}
        {speeds.canHover && (
          <div className="flex items-center gap-2 py-1.5 px-2.5 rounded-lg bg-[#0c0d15] border border-cyan-500/10">
            <span className="text-[14px]">✨</span>
            <div className="min-w-0">
              <span className="text-[9px] font-medium uppercase tracking-wider text-surface-500 block leading-tight">
                Hover
              </span>
              <span className="text-xs font-medium text-cyan-400">Can hover</span>
            </div>
          </div>
        )}
      </div>

      {/* Encumbrance warning */}
      {hasEncumbrance && (
        <div className="flex items-center gap-1.5 py-1 px-2 rounded-lg bg-rose-500/5 border border-rose-500/10">
          <span className="text-[10px]">⚠️</span>
          <span className="text-[9px] text-rose-400">
            Encumbered: Walk speed reduced by {Math.abs(encumbrancePenalty)}ft
          </span>
        </div>
      )}

      {/* HP to speed conversion note */}
      <p className="text-[7px] text-surface-600">
        Base speed from race/class · Modified by armor, encumbrance, and conditions
      </p>
    </div>
  );
}
