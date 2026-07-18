/* ── AoEPlacementMode ──────────────────────────────────────────
 * An overlay that activates when a DM clicks a tile on the map
 * to place an AOE template at that grid location.
 * Shows a crosshair/ghost preview of the template shape before
 * confirming placement.
 * ─────────────────────────────────────────────────────────────── */

import { useMemo } from "react";
import type { AoETemplate, AoE_Direction } from "@/types/aoe-templates";
import { Button } from "@/components/ui/Button";

interface Props {
  /** The partially-filled template waiting for grid placement */
  pendingTemplate: AoETemplate | null;
  /** Current mouse grid cell (or keyboard-navigated) */
  hoverGridX: number;
  hoverGridY: number;
  gridWidth: number;
  gridHeight: number;
  onPlaceAtCell: (x: number, y: number) => void;
  onCancel: () => void;
  onRotateDirection: () => void;
}

/** Direction arrows for rotation */
const DIRECTION_CYCLE: AoE_Direction[] = [
  "east", "southeast", "south", "southwest",
  "west", "northwest", "north", "northeast",
];

export function AoEPlacementMode({
  pendingTemplate,
  hoverGridX,
  hoverGridY,
  gridWidth,
  gridHeight,
  onPlaceAtCell,
  onCancel,
  onRotateDirection,
}: Props) {
  if (!pendingTemplate) return null;

  const needsDirection = pendingTemplate.shape !== "circle" && pendingTemplate.shape !== "sphere" && pendingTemplate.shape !== "cube";

  const isOffGrid = hoverGridX < 0 || hoverGridX >= gridWidth || hoverGridY < 0 || hoverGridY >= gridHeight;

  return (
    <div className="pointer-events-none absolute inset-0 z-40">
      {/* Placement preview showing on the map as an SVG overlay */}
      <svg
        className="h-full w-full"
        viewBox={`0 0 ${gridWidth} ${gridHeight}`}
        preserveAspectRatio="none"
      >
        {!isOffGrid && (
          <g transform={`translate(${hoverGridX}, ${hoverGridY})`} opacity={0.5}>
            {pendingTemplate.shape === "circle" && (
              <circle cx={0} cy={0} r={pendingTemplate.size / 5}
                fill={pendingTemplate.color ?? "#aa66ff"} fillOpacity={0.3}
                stroke={pendingTemplate.color ?? "#aa66ff"} strokeWidth={0.05} strokeDasharray="0.15 0.1" />
            )}
            {pendingTemplate.shape === "sphere" && (
              <circle cx={0} cy={0} r={pendingTemplate.size / 5}
                fill={pendingTemplate.color ?? "#aa66ff"} fillOpacity={0.3}
                stroke={pendingTemplate.color ?? "#aa66ff"} strokeWidth={0.05} strokeDasharray="0.15 0.1" />
            )}
            {(pendingTemplate.shape === "cone") && (
              <polygon
                points={`0,0 ${pendingTemplate.size / 5},${-(pendingTemplate.size / 10)} ${pendingTemplate.size / 5},${pendingTemplate.size / 10}`}
                fill={pendingTemplate.color ?? "#aa66ff"} fillOpacity={0.3}
                stroke={pendingTemplate.color ?? "#aa66ff"} strokeWidth={0.05} strokeDasharray="0.15 0.1" />
            )}
            {(pendingTemplate.shape === "line") && (
              <rect x={0} y={-0.3} width={pendingTemplate.size / 5} height={0.6} rx={0.1}
                fill={pendingTemplate.color ?? "#aa66ff"} fillOpacity={0.3}
                stroke={pendingTemplate.color ?? "#aa66ff"} strokeWidth={0.05} strokeDasharray="0.15 0.1" />
            )}
            {(pendingTemplate.shape === "cube") && (
              <rect x={-(pendingTemplate.size / 10)} y={-(pendingTemplate.size / 10)}
                width={pendingTemplate.size / 5} height={pendingTemplate.size / 5} rx={0.1}
                fill={pendingTemplate.color ?? "#aa66ff"} fillOpacity={0.3}
                stroke={pendingTemplate.color ?? "#aa66ff"} strokeWidth={0.05} strokeDasharray="0.15 0.1" />
            )}

            {/* Crosshair at center */}
            <line x1={-0.3} y1={0} x2={0.3} y2={0} stroke="white" strokeWidth={0.03} opacity={0.6} />
            <line x1={0} y1={-0.3} x2={0} y2={0.3} stroke="white" strokeWidth={0.03} opacity={0.6} />
          </g>
        )}
      </svg>

      {/* Control bar pinned below the map */}
      <div className="pointer-events-auto absolute -bottom-12 left-0 right-0 flex items-center justify-center gap-3">
        <div className="flex items-center gap-2 rounded-lg border border-accent-500/30 bg-surface-850 px-4 py-2 shadow-xl">
          <span className="text-xs text-accent-400 font-medium">
            Placing: {pendingTemplate.label}
          </span>
          <span className="text-[10px] text-surface-500">
            ({hoverGridX}, {hoverGridY})
          </span>
          {needsDirection && (
            <Button size="xs" variant="ghost" onClick={onRotateDirection}>
              ↻ Rotate
            </Button>
          )}
          <Button size="xs" onClick={() => !isOffGrid && onPlaceAtCell(hoverGridX, hoverGridY)}>
            ✓ Place
          </Button>
          <Button size="xs" variant="danger" onClick={onCancel}>
            ✕ Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
