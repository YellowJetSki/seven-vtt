/* ── Ground Effect Overlay ──────────────────────────────────────
 * Renders residual elemental ground effects on the battle map
 * after a HazardZone expires. Delegates shape rendering to
 * render-ground-effect.tsx for modularity.
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
        return (
          <g
            key={effect.id}
            transform={`translate(${effect.gridX}, ${effect.gridY})`}
            className="ground-effect-group"
          >
            {renderGroundEffectShape(effect)}

            {/* Label */}
            <text
              x={0} y={-cells - 0.3}
              textAnchor="middle"
              fill={effect.color}
              fontSize="0.22"
              opacity={0.5}
              className="pointer-events-none select-none"
            >
              {effect.label}
            </text>

            {/* Difficult terrain indicator */}
            {effect.difficultTerrain && (
              <text
                x={0} y={cells + 0.35}
                textAnchor="middle"
                fill="#ff8844"
                fontSize="0.14"
                opacity={0.5}
                className="pointer-events-none select-none"
              >
                ⛰️ Difficult
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
}
