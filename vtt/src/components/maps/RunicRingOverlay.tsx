/* ── Runic Ring Overlay ────────────────────────────────────────
 * Animated arcane rune circle that rotates around a HazardZone.
 * Uses Elder Futhark rune glyphs per magic school, with a slow
 * rotational animation and pulsing glow.
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
  return glyphs.slice(0, 4).join(" \u00B7 ");
}

export function RunicRingOverlay({ hazard, radiusCells, cx, cy }: Props) {
  const schoolCol = SCHOOL_COLORS[hazard.magicSchool] ?? SCHOOL_COLORS.universal;
  const ringRadius = radiusCells + 0.4;
  const runeRadius = radiusCells + 0.55;
  const runeText = getRuneString(hazard.magicSchool);
  const animDuration = hazard.runeRingSpeed ?? 6;
  const showRing = hazard.showRuneRing !== false;

  if (!showRing) return null;

  return (
    <g transform={`translate(${cx}, ${cy})`} className="runic-ring-group">
      {/* Outer glow ring */}
      <circle
        cx={0} cy={0}
        r={ringRadius}
        fill="none"
        stroke={schoolCol.rune}
        strokeWidth={0.025}
        opacity={0.15}
        style={{ animation: `aoe-runic-rotate ${animDuration}s linear infinite` }}
      />

      {/* Inner rune ring — rune glyphs rotating around the hazard */}
      <text
        x={0}
        y={-runeRadius}
        textAnchor="middle"
        dominantBaseline="central"
        fill={schoolCol.rune}
        fontSize="0.25"
        fontWeight="bold"
        opacity={0.35}
        className="pointer-events-none select-none"
        style={{
          animation: `aoe-runic-rotate ${animDuration}s linear infinite`,
          textShadow: `0 0 6px ${schoolCol.rune}44`,
          transformOrigin: `0 ${runeRadius}px`,
        }}
      >
        {runeText}
      </text>

      {/* Faint secondary runes (reverse rotation) */}
      <text
        x={0}
        y={ringRadius}
        textAnchor="middle"
        dominantBaseline="central"
        fill={schoolCol.secondary}
        fontSize="0.14"
        opacity={0.12}
        className="pointer-events-none select-none"
        style={{
          animation: `aoe-runic-rotate-reverse ${animDuration * 1.5}s linear infinite`,
          transformOrigin: `0 ${-ringRadius}px`,
        }}
      >
        {runeText.split("").reverse().join(" ")}
      </text>

      {/* Cardinal cross-marks at 0, 90, 180, 270 degrees */}
      {[0, 90, 180, 270].map((deg) => {
        const rad = (deg * Math.PI) / 180;
        const x = Math.cos(rad) * ringRadius;
        const y = Math.sin(rad) * ringRadius;
        return (
          <circle
            key={deg}
            cx={x}
            cy={y}
            r={0.025}
            fill={schoolCol.rune}
            opacity={0.4}
          />
        );
      })}

      {/* Concentration link dot (if concentration-bound) */}
      {hazard.requiresConcentration && (
        <circle
          cx={0}
          cy={ringRadius + 0.3}
          r={0.04}
          fill={schoolCol.primary}
          opacity={0.6}
          style={{ animation: "aoe-pulse 1.5s ease-in-out infinite" }}
        />
      )}
    </g>
  );
}
