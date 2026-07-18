/* ── Hazard Timeline Item ──────────────────────────────────────
 * A single row in the HazardTimeline panel showing a placed
 * hazard zone with round countdown, tick counter, quick action
 * buttons, and fantasy-styled card with school-color aesthetics.
 * ─────────────────────────────────────────────────────────────── */

import type { HazardZone } from "@/types/hazard-zones";
import { SCHOOL_COLORS } from "@/types/hazard-zones";
import { totalHazardDamage, durationLabel } from "@/lib/hazard-tick-engine";

interface Props {
  hazard: HazardZone;
  currentRound: number;
  onExpire: (id: string) => void;
  onExtend: (id: string, rounds: number) => void;
  onToggleVisibility: (id: string) => void;
  onSelect: (id: string) => void;
  isSelected: boolean;
}

/** Shape icon matching AoE types */
function shapeIcon(shape: HazardZone["shape"]): string {
  const icons: Record<string, string> = {
    circle: "\u25CB", cone: "\u25B3", line: "\u25AC", cube: "\u25A3", sphere: "\u25C9",
  };
  return icons[shape] ?? "?";
}

/** Altitude tag */
function altitudeTag(alt: HazardZone["altitude"]): string {
  const tags = { ground: "GND", waist: "WST", aerial: "AIR" };
  return tags[alt];
}

export function HazardTimelineItem({
  hazard, currentRound, onExpire, onExtend, onToggleVisibility, isSelected,
}: Props) {
  const schoolCol = SCHOOL_COLORS[hazard.magicSchool] ?? SCHOOL_COLORS.universal;
  const totalDmg = totalHazardDamage(hazard);
  const roundsRemaining = hazard.remainingRounds;
  const ticksSoFar = hazard.ticks.length;
  const isUrgent = roundsRemaining !== null && roundsRemaining <= 2;
  const isExpiring = roundsRemaining !== null && roundsRemaining <= 0;

  return (
    <div
      onClick={() => onSelect(hazard.id)}
      className={`group flex items-start gap-2.5 rounded-xl px-3 py-2.5 transition-all duration-200 cursor-pointer
        ${
          isSelected
            ? "border border-accent-500/40 bg-accent-600/10 shadow-[0_0_12px_rgba(139,48,255,0.08)]"
            : "border border-transparent bg-surface-800/30 hover:bg-surface-800/60 hover:border-surface-600/40 hover:shadow-lg hover:-translate-y-0.5"
        }
        ${isExpiring ? "opacity-40 pointer-events-none" : ""}
        ${isUrgent && !isSelected ? "animate-countdown-urgent border-warrior-500/30" : ""}
        animate-scale-in`}
      style={{
        borderLeftColor: isSelected ? schoolCol.primary : "transparent",
        borderLeftWidth: isSelected ? 2 : 0,
      }}
    >
      {/* School colour indicator — floating gem */}
      <div
        className="mt-0.5 h-3 w-3 shrink-0 rounded-full animate-rune-glow shadow-lg"
        style={{
          backgroundColor: schoolCol.primary,
          boxShadow: `0 0 8px ${schoolCol.primary}44, 0 0 16px ${schoolCol.primary}22`,
        }}
      />

      {/* Info column */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-semibold text-surface-200 truncate group-hover:text-accent-200 transition-colors">
            {shapeIcon(hazard.shape)} {hazard.label}
          </span>
          <span
            className="text-[7px] font-mono px-1.5 py-0.5 rounded-full uppercase tracking-wider font-bold"
            style={{
              backgroundColor: `${schoolCol.primary}18`,
              color: schoolCol.primary,
              border: `1px solid ${schoolCol.primary}30`,
            }}
          >
            {altitudeTag(hazard.altitude)}
          </span>
          {isUrgent && (
            <span className="text-[7px] font-mono px-1.5 py-0.5 rounded-full uppercase tracking-wider font-bold bg-warrior-500/20 text-warrior-400 border border-warrior-500/30">
              URGENT
            </span>
          )}
        </div>

        {/* Info row */}
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
          {hazard.savingThrowDC && (
            <span className="text-[9px] font-mono text-surface-500">
              DC {hazard.savingThrowDC}
              <span className="text-surface-600 mx-0.5">·</span>
              {hazard.savingThrowAbility?.toUpperCase() ?? ""}
            </span>
          )}
          {hazard.tickDamage && (
            <span className="text-[9px] font-mono text-surface-500">
              <span className="text-warrior-400">⚔</span> {hazard.tickDamage}/tick
            </span>
          )}
          {ticksSoFar > 0 && (
            <span className="text-[9px] font-mono text-surface-500">
              <span className="text-accent-400">◆</span> {ticksSoFar} tick{ticksSoFar !== 1 ? "s" : ""}
            </span>
          )}
          {totalDmg > 0 && (
            <span className="text-[9px] font-mono text-warrior-400 font-semibold">
              {totalDmg} dmg
            </span>
          )}
        </div>

        {/* Remaining rounds progress bar */}
        {roundsRemaining !== null && hazard.durationRounds && hazard.durationRounds > 0 && (
          <div className="mt-2 flex items-center gap-2">
            <div className="h-1.5 flex-1 rounded-full bg-surface-700/60 overflow-hidden shadow-inner">
              <div
                className={`h-full rounded-full transition-all duration-500 ease-out ${
                  isUrgent ? "animate-rune-glow" : ""
                }`}
                style={{
                  width: `${Math.max(2, Math.min(100, (roundsRemaining / hazard.durationRounds) * 100))}%`,
                  background: isUrgent
                    ? `linear-gradient(90deg, #ff6644, #ff8844)`
                    : `linear-gradient(90deg, ${schoolCol.primary}, ${schoolCol.secondary})`,
                  boxShadow: `0 0 6px ${isUrgent ? "#ff664466" : `${schoolCol.primary}44`}`,
                }}
              />
            </div>
            <span className={`text-[9px] font-mono shrink-0 ${isUrgent ? "text-warrior-400 font-bold" : "text-surface-500"}`}>
              {durationLabel(roundsRemaining)}
            </span>
          </div>
        )}
      </div>

      {/* Quick action buttons — revealed on hover */}
      <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-all duration-200 shrink-0">
        {/* Visibility toggle */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggleVisibility(hazard.id); }}
          className="rounded-lg p-1 text-[11px] bg-surface-800/80 hover:bg-surface-700/80 text-surface-500 hover:text-surface-200 transition-all border border-transparent hover:border-accent-500/30"
          title={hazard.visibleToPlayers ? "Visible to players" : "DM-only"}
          aria-label={hazard.visibleToPlayers ? "Toggle player visibility off" : "Toggle player visibility on"}
        >
          {hazard.visibleToPlayers ? "\uD83D\uDC41" : "\uD83D\uDE48"}
        </button>

        {/* Extend by 1 round */}
        <button
          onClick={(e) => { e.stopPropagation(); onExtend(hazard.id, 1); }}
          className="rounded-lg p-1 text-[11px] bg-surface-800/80 hover:bg-surface-700/80 text-surface-500 hover:text-accent-400 transition-all border border-transparent hover:border-accent-500/30"
          title="Extend by 1 round"
          aria-label="Extend hazard duration by 1 round"
        >
          +1
        </button>

        {/* Expire now (dismiss) */}
        <button
          onClick={(e) => { e.stopPropagation(); onExpire(hazard.id); }}
          className="rounded-lg p-1 text-[11px] bg-surface-800/80 hover:bg-warrior-500/20 text-surface-500 hover:text-warrior-400 transition-all border border-transparent hover:border-warrior-500/30"
          title="Expire now"
          aria-label="Expire hazard immediately"
        >
          ✕
        </button>
      </div>

      {/* Concentration indicator — absolute positioned */}
      {hazard.requiresConcentration && (
        <div
          className="absolute -top-1 -right-1 h-3 w-3 rounded-full border border-surface-900/50 animate-rune-glow"
          style={{
            backgroundColor: schoolCol.primary,
            boxShadow: `0 0 8px ${schoolCol.primary}66`,
          }}
          title="Requires concentration"
        />
      )}
    </div>
  );
}
