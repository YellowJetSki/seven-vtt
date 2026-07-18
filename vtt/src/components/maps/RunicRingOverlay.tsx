/* ── Runic Ring Overlay ────────────────────────────────────────
 * Animated arcane rune circle that rotates around a HazardZone.
 * Uses Elder Futhark rune glyphs per magic school, with a slow
 * rotational animation, pulsing SVG drop-shadow glow, and
 * concentration indicator.
 * Coordinate system: grid cells (matches AoETemplateOverlay).
 * ─────────────────────────────────────────────────────────────── */

import type { HazardZone } from "@/types/hazard-zones";
import { SCHOOL_COLORS, RUNE_GLYPHS } from "@/types/hazard-zones";

interface Props {
  hazard: HazardZone;
  /** Radius in grid cells (e.g., 4 for a 20ft fireball) */
  radiusCells: number;
  /** Center x position in grid coords */
  cx: number;
  /** Center y position in grid coords */
  cy: number;
}

/** Pick rune glyphs for the hazard based on its magic school */
function getRuneString(school: HazardZone["magicSchool"]): string {
  const glyphs = RUNE_GLYPHS[school] ?? RUNE_GLYPHS.universal;
  return glyphs.slice(0, 4).join(" · ");
}

export function RunicRingOverlay({ hazard, radiusCells, cx, cy }: Props) {
  const schoolCol = SCHOOL_COLORS[hazard.magicSchool] ?? SCHOOL_COLORS.universal;
  const ringRadius = radiusCells + 0.4;
  const runeRadius = radiusCells + 0.55;
  const runeText = getRuneString(hazard.magicSchool);
  const animDuration = hazard.runeRingSpeed ?? 6;
  const showRing = hazard.showRuneRing !== false;
  const isUrgent = hazard.remainingRounds !== null && hazard.remainingRounds <= 2;

  if (!showRing) return null;

  return (
    <g transform={`translate(${cx}, ${cy})`} className="runic-ring-group">
      {/* SVG Filter: Arcane glow */}
      <defs>
        <filter id={`rune-glow-${hazard.id}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="0.08" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id={`ring-glow-${hazard.id}`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="0.12" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Outer glow ring with arcane shadow */}
      <circle
        cx={0} cy={0}
        r={ringRadius}
        fill="none"
        stroke={schoolCol.rune}
        strokeWidth={0.025}
        opacity={0.12}
        style={{
          animation: `aoe-runic-rotate ${animDuration}s linear infinite`,
          filter: `url(#ring-glow-${hazard.id})`,
        }}
      />

      {/* Secondary outer ring (cardinal marks) */}
      <circle
        cx={0} cy={0}
        r={ringRadius + 0.08}
        fill="none"
        stroke={schoolCol.secondary}
        strokeWidth={0.008}
        opacity={0.08}
        strokeDasharray="0.02 0.12"
        style={{
          animation: `aoe-runic-rotate-reverse ${animDuration * 1.3}s linear infinite`,
        }}
      />

      {/* Rune text ring — primary school glyphs rotating */}
      <text
        x={0}
        y={-runeRadius}
        textAnchor="middle"
        dominantBaseline="central"
        fill={schoolCol.rune}
        fontSize="0.28"
        fontWeight="bold"
        className="pointer-events-none select-none animate-rune-warp"
        style={{
          animation: `aoe-runic-rotate ${animDuration}s linear infinite, rune-glow-pulse ${animDuration * 0.5}s ease-in-out infinite`,
          filter: `url(#rune-glow-${hazard.id})`,
          textShadow: `0 0 8px ${schoolCol.rune}66`,
          transformOrigin: `0 ${runeRadius}`,
        }}
      >
        {runeText}
      </text>

      {/* Secondary faint rune ring — reverse rotation */}
      <text
        x={0}
        y={ringRadius + 0.05}
        textAnchor="middle"
        dominantBaseline="central"
        fill={schoolCol.secondary}
        fontSize="0.14"
        className="pointer-events-none select-none"
        style={{
          animation: `aoe-runic-rotate-reverse ${animDuration * 1.5}s linear infinite`,
          opacity: isUrgent ? 0.3 : 0.12,
          transformOrigin: `0 ${-ringRadius}`,
        }}
      >
        {runeText.split("").reverse().join(" ")}
      </text>

      {/* Cardinal cross-marks at 0°, 90°, 180°, 270° */}
      {[0, 90, 180, 270].map((deg) => {
        const rad = (deg * Math.PI) / 180;
        const x = Math.cos(rad) * ringRadius;
        const y = Math.sin(rad) * ringRadius;
        return (
          <circle
            key={deg}
            cx={x}
            cy={y}
            r={isUrgent ? 0.035 : 0.025}
            fill={isUrgent ? "#ff6644" : schoolCol.rune}
            opacity={isUrgent ? 0.7 : 0.4}
            className={isUrgent ? "animate-rune-glow" : undefined}
          />
        );
      })}

      {/* Urgency pulse ring when ≤2 rounds remain */}
      {isUrgent && (
        <circle
          cx={0} cy={0}
          r={ringRadius + 0.12}
          fill="none"
          stroke={schoolCol.rune}
          strokeWidth={0.015}
          opacity={0.25}
          strokeDasharray="0.04 0.12"
          style={{
            animation: `hazard-countdown-urgent 0.8s ease-in-out infinite`,
          }}
        />
      )}

      {/* Concentration link dot (pulsing) */}
      {hazard.requiresConcentration && (
        <circle
          cx={0}
          cy={ringRadius + 0.35}
          r={0.05}
          fill={schoolCol.primary}
          opacity={0.7}
          className="animate-rune-glow"
        />
      )}

      {/* School-element indicator glow (bottom) */}
      <circle
        cx={0}
        cy={ringRadius + 0.15}
        r={0.02}
        fill={schoolCol.primary}
        opacity={0.3}
      />
    </g>
  );
}
