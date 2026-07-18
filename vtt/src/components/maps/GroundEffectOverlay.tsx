/* ── Ground Effect Overlay ──────────────────────────────────────
 * Renders residual elemental ground effects on the battle map
 * after a HazardZone expires. Each effect type has a distinct
 * SVG visual: scorch marks, ice patches, gas clouds, etc.
 * Fades out over time via fadeProgress with dissolve animation.
 * Fantasy-styled with glow filters and elemental color grading.
 * ─────────────────────────────────────────────────────────────── */

import type { GroundEffect } from "@/types/hazard-zones";
import { renderGroundEffectShape } from "@/lib/render-ground-effect";

interface Props {
  effects: GroundEffect[];
  gridWidth: number;
  gridHeight: number;
  isGmView: boolean;
}

export function GroundEffectOverlay({ effects, isGmView }: Props) {
  const visible = effects.filter((e) => isGmView || e.visibleToPlayers);

  if (visible.length === 0) return null;

  return (
    <g className="ground-effect-overlay">
      {visible.map((effect) => {
        const cells = Math.round(effect.radius / 5);
        const isFading = effect.fadeProgress > 0.5;

        return (
          <g
            key={effect.id}
            transform={`translate(${effect.gridX}, ${effect.gridY})`}
            className={`ground-effect-group ${isFading ? "animate-ground-fade" : ""}`}
            opacity={isFading ? 1 - effect.fadeProgress : undefined}
          >
            {renderGroundEffectShape(effect)}

            {/* Elemental glow ring */}
            <circle
              cx={0} cy={0}
              r={cells + 0.2}
              fill="none"
              stroke={effect.color}
              strokeWidth={0.015}
              opacity={0.15}
              strokeDasharray="0.04 0.08"
              className={isFading ? "" : "animate-rune-glow"}
              style={{
                filter: `drop-shadow(0 0 4px ${effect.color}33)`,
              }}
            />

            {/* Label with school-accent styling */}
            <text
              x={0} y={-cells - 0.35}
              textAnchor="middle"
              fill={effect.color}
              fontSize="0.22"
              fontWeight="bold"
              opacity={0.6}
              className="pointer-events-none select-none"
              style={{
                textShadow: `0 0 6px ${effect.color}44`,
                filter: `drop-shadow(0 0 2px ${effect.color}22)`,
              }}
            >
              {effect.label}
            </text>

            {/* Difficult terrain marker */}
            {effect.difficultTerrain && (
              <g>
                <text
                  x={0} y={cells + 0.4}
                  textAnchor="middle"
                  fill="#ff8844"
                  fontSize="0.14"
                  fontWeight="semibold"
                  opacity={0.55}
                  className="pointer-events-none select-none"
                  style={{
                    textShadow: `0 0 4px #ff884444`,
                  }}
                >
                  ⛰️ Difficult
                </text>
                {/* Broken ground lines */}
                <line x1={-cells * 0.4} y1={cells * 0.1} x2={cells * 0.4} y2={cells * 0.15}
                  stroke="#ff8844" strokeWidth={0.012} opacity={0.15} strokeDasharray="0.02 0.04" />
              </g>
            )}

            {/* Remaining rounds indicator */}
            {effect.remainingRounds !== null && effect.remainingRounds > 0 && (
              <text
                x={cells + 0.3}
                y={-cells + 0.3}
                textAnchor="start"
                fill={effect.remainingRounds <= 2 ? "#ff6644" : effect.color}
                fontSize="0.1"
                opacity={0.5}
                className="pointer-events-none select-none font-mono"
              >
                {effect.remainingRounds}r
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
}
