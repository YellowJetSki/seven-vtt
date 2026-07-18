/* ── AoEPlacementMode ──────────────────────────────────────────
 * Interactive overlay that activates when a DM places an AOE
 * template. Shows a magical ghost preview with grid snapping,
 * rotating direction arrows, and an arcane-styled control bar.
 * ─────────────────────────────────────────────────────────────── */

import { useMemo } from "react";
import type { AoETemplate, AoE_Direction } from "@/types/aoe-templates";
import { Button } from "@/components/ui/Button";

interface Props {
  pendingTemplate: AoETemplate | null;
  hoverGridX: number;
  hoverGridY: number;
  gridWidth: number;
  gridHeight: number;
  onPlaceAtCell: (x: number, y: number) => void;
  onCancel: () => void;
  onRotateDirection: () => void;
}

/** Direction cycle for rotation button */
const DIRECTION_CYCLE: AoE_Direction[] = [
  "east", "southeast", "south", "southwest",
  "west", "northwest", "north", "northeast",
];

function isDirectional(shape: AoETemplate["shape"]): boolean {
  return shape !== "circle" && shape !== "sphere" && shape !== "cube";
}

/** Render ghost preview shape */
function GhostShape({ tpl }: { tpl: AoETemplate }) {
  const cells = tpl.size / 5;
  const color = tpl.color ?? "#aa66ff";

  switch (tpl.shape) {
    case "circle":
    case "sphere":
      return <circle cx={0} cy={0} r={cells} fill={color} fillOpacity={0.15} stroke={color} strokeWidth={0.04} strokeDasharray="0.12 0.08" />;
    case "cone":
      return (
        <polygon
          points={`0,0 ${cells},${-cells * 0.5} ${cells},${cells * 0.5}`}
          fill={color} fillOpacity={0.15} stroke={color} strokeWidth={0.04} strokeDasharray="0.12 0.08"
        />
      );
    case "line":
      return (
        <rect x={0} y={-0.3} width={cells} height={0.6} rx={0.08}
          fill={color} fillOpacity={0.15} stroke={color} strokeWidth={0.04} strokeDasharray="0.12 0.08"
        />
      );
    case "cube":
      const half = cells / 2;
      return (
        <rect x={-half} y={-half} width={cells} height={cells} rx={0.08}
          fill={color} fillOpacity={0.15} stroke={color} strokeWidth={0.04} strokeDasharray="0.12 0.08"
        />
      );
    default:
      return null;
  }
}

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

  const needsDir = isDirectional(pendingTemplate.shape);
  const isOffGrid = hoverGridX < 0 || hoverGridX >= gridWidth || hoverGridY < 0 || hoverGridY >= gridHeight;
  const color = pendingTemplate.color ?? "#aa66ff";

  return (
    <div className="pointer-events-none absolute inset-0 z-40">
      {/* Ghost preview on the map */}
      <svg
        className="h-full w-full"
        viewBox={`0 0 ${gridWidth} ${gridHeight}`}
        preserveAspectRatio="none"
      >
        <defs>
          <filter id="ghost-glow">
            <feGaussianBlur stdDeviation="0.08" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {!isOffGrid && (
          <g filter="url(#ghost-glow)">
            {/* Animated ghost shape */}
            <g transform={`translate(${hoverGridX}, ${hoverGridY})`} className="aoe-crosshair">
              <GhostShape tpl={pendingTemplate} />
            </g>

            {/* Outer ring indicator */}
            <circle cx={hoverGridX} cy={hoverGridY} r={0.4}
              fill="none" stroke={color} strokeWidth={0.02} opacity={0.3}
              strokeDasharray="0.05 0.1" className="aoe-crosshair" />

            {/* Corner brackets */}
            {[
              [-1, -1], [1, -1], [-1, 1], [1, 1],
            ].map(([sx, sy]) => (
              <g key={`b-${sx}-${sy}`} transform={`translate(${hoverGridX + sx * 0.3}, ${hoverGridY + sy * 0.3})`}>
                <line x1={0} y1={0} x2={sx * 0.15} y2={0} stroke={color} strokeWidth={0.025} opacity={0.5} />
                <line x1={0} y1={0} x2={0} y2={sy * 0.15} stroke={color} strokeWidth={0.025} opacity={0.5} />
              </g>
            ))}

            {/* Crosshair */}
            <line x1={hoverGridX - 0.2} y1={hoverGridY} x2={hoverGridX + 0.2} y2={hoverGridY}
              stroke="white" strokeWidth={0.02} opacity={0.4} />
            <line x1={hoverGridX} y1={hoverGridY - 0.2} x2={hoverGridX} y2={hoverGridY + 0.2}
              stroke="white" strokeWidth={0.02} opacity={0.4} />

            {/* Grid coordinates */}
            <text x={hoverGridX} y={hoverGridY + 0.65}
              textAnchor="middle" fill={color} fontSize="0.2" opacity={0.7}
              style={{ textShadow: "0 0 4px rgba(0,0,0,0.8)" }}
              className="pointer-events-none select-none font-mono"
            >
              {hoverGridX},{hoverGridY}
            </text>
          </g>
        )}
      </svg>

      {/* Floating control bar */}
      <div className="pointer-events-auto absolute -bottom-14 left-0 right-0 flex items-center justify-center">
        <div className="flex items-center gap-2 rounded-xl border border-accent-500/30 bg-surface-850/90 backdrop-blur-md px-4 py-2.5 shadow-2xl shadow-accent-500/5">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full animate-pulse-glow" style={{ backgroundColor: color }} />
            <span className="text-xs text-accent-300 font-semibold">
              Placing {pendingTemplate.label}
            </span>
          </div>
          <span className="text-[10px] text-surface-500 font-mono">
            ({hoverGridX}, {hoverGridY})
          </span>

          <div className="mx-2 h-4 w-px bg-surface-700/50" />

          {needsDir && (
            <Button size="xs" variant="ghost" onClick={onRotateDirection}>
              ← ↻ Rotate →
            </Button>
          )}

          <Button size="xs" onClick={() => !isOffGrid && onPlaceAtCell(hoverGridX, hoverGridY)} disabled={isOffGrid}>
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
