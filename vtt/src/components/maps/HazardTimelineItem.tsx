/* ── Hazard Timeline Item ──────────────────────────────────────
 * A single row in the HazardTimeline panel showing a placed
 * hazard zone with round countdown, tick counter, and quick
 * action buttons for expiration and visibility toggling.
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

/** Altitude label */
function altitudeTag(alt: HazardZone["altitude"]): string {
  const tags = { ground: "GND", waist: "WST", aerial: "AIR" };
  return tags[alt];
}

export function HazardTimelineItem({
  hazard, currentRound, onExpire, onExtend, onToggleVisibility, isSelected,
}: Props) {
  const schoolCol = SCHOOL_COLORS[hazard.magicSchool] ?? SCHOOL_COLORS.universal;
  const totalDmg = totalHazardDamage(hazard);
  const roundsRemaining = hazard.remainingRounds !== null
    ? hazard.remainingRounds
    : null;
  const ticksSoFar = hazard.ticks.length;

  return (
    <div
      onClick={() => onSelect(hazard.id)}
      className={`group flex items-start gap-2 rounded-lg px-2.5 py-2 transition-all cursor-pointer ${
        isSelected
          ? "bg-accent-600/10 border border-accent-500/30"
          : "bg-surface-800/30 border border-transparent hover:bg-surface-800/50 hover:border-surface-600/50"
      }`}
    >
      {/* School colour indicator */}
      <div
        className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-white/10"
        style={{ backgroundColor: schoolCol.primary }}
      />

      {/* Info column */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-semibold text-surface-200 truncate">
            {shapeIcon(hazard.shape)} {hazard.label}
          </span>
          <span
            className="text-[7px] font-mono px-1 py-0.5 rounded uppercase"
            style={{ backgroundColor: `${schoolCol.primary}20`, color: schoolCol.primary }}
          >
            {altitudeTag(hazard.altitude)}
          </span>
        </div>

        {/* Info row */}
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="text-[9px] font-mono text-surface-500">
            DC {hazard.savingThrowDC ?? "—"} {hazard.savingThrowAbility?.toUpperCase() ?? ""}
          </span>
          {hazard.tickDamage && (
            <span className="text-[9px] font-mono text-surface-500">
              {hazard.tickDamage}/tick
            </span>
          )}
          {ticksSoFar > 0 && (
            <span className="text-[9px] font-mono text-surface-500">
              {ticksSoFar} tick{ticksSoFar !== 1 ? "s" : ""}
            </span>
          )}
          {totalDmg > 0 && (
            <span className="text-[9px] font-mono text-warrior-400">
              {totalDmg} dmg
            </span>
          )}
        </div>

        {/* Remaining rounds bar */}
        {roundsRemaining !== null && (
          <div className="mt-1.5 flex items-center gap-1.5">
            <div className="h-1 flex-1 rounded-full bg-surface-700/50 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(100, (roundsRemaining / (hazard.durationRounds ?? roundsRemaining)) * 100)}%`,
                  backgroundColor: roundsRemaining <= 2 ? "#ff6644" : schoolCol.primary,
                }}
              />
            </div>
            <span className="text-[8px] font-mono text-surface-500 shrink-0">
              {durationLabel(roundsRemaining)}
            </span>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex flex-col gap-0.5 opacity-30 group-hover:opacity-100 transition-all shrink-0">
        {/* Visibility toggle */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggleVisibility(hazard.id); }}
          className="rounded p-0.5 text-[10px] text-surface-500 hover:text-surface-300 transition-colors"
          title={hazard.visibleToPlayers ? "Visible to players" : "DM-only"}
        >
          {hazard.visibleToPlayers ? "\uD83D\uDC41" : "\uD83D\uDE48"}
        </button>

        {/* Extend by 1 round */}
        <button
          onClick={(e) => { e.stopPropagation(); onExtend(hazard.id, 1); }}
          className="rounded p-0.5 text-[10px] text-surface-500 hover:text-accent-400 transition-colors"
          title="Extend by 1 round"
        >
          +1
        </button>

        {/* Expire now */}
        <button
          onClick={(e) => { e.stopPropagation(); onExpire(hazard.id); }}
          className="rounded p-0.5 text-[10px] text-surface-500 hover:text-warrior-400 transition-colors"
          title="Expire now"
        >
          ✕
        </button>
      </div>

      {/* Concentration indicator */}
      {hazard.requiresConcentration && (
        <div
          className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: schoolCol.primary, animation: "aoe-pulse 1.5s ease-in-out infinite" }}
          title="Requires concentration"
        />
      )}
    </div>
  );
}
