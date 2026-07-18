/* ── AoETemplateOverlay ────────────────────────────────────────
 * SVG overlay that renders spell / ability AOE templates on the
 * battle map canvas. Handles shape rendering, color, animation,
 * and visibility toggling.
 * ─────────────────────────────────────────────────────────────── */

import { useMemo } from "react";
import type { AoETemplate } from "@/types/aoe-templates";

interface Props {
  templates: AoETemplate[];
  gridWidth: number;
  gridHeight: number;
  isGmView: boolean;
  onTemplateClick?: (id: string) => void;
}

/** Map shape type to a CSS animation class name */
function getAnimationClass(animation: AoETemplate["animation"]): string {
  switch (animation) {
    case "pulse": return "animate-pulse";
    case "shimmer": return "aoe-shimmer";
    case "burn": return "aoe-burn";
    default: return "";
  }
}

/** Get a human-readable label for a shape */
function getShapeLabel(shape: AoETemplate["shape"], size: number): string {
  const labels: Record<AoETemplate["shape"], string> = {
    circle: `${size}-ft radius`,
    cone: `${size}-ft cone`,
    line: `${size}-ft line`,
    cube: `${size}-ft cube`,
    sphere: `${size}-ft radius sphere`,
  };
  return labels[shape];
}

export function AoETemplateOverlay({ templates, gridWidth, gridHeight, isGmView, onTemplateClick }: Props) {
  // Filter to visible templates (players only see visibleToPlayers ones)
  const visibleTemplates = useMemo(
    () => templates.filter((t) => isGmView || t.visibleToPlayers),
    [templates, isGmView],
  );

  if (visibleTemplates.length === 0) return null;

  return (
    <svg
      className="absolute inset-0 h-full w-full pointer-events-none z-[5]"
      viewBox={`0 0 ${gridWidth} ${gridHeight}`}
      preserveAspectRatio="none"
    >
      {visibleTemplates.map((tpl) => {
        const cellsX = tpl.size / 5;
        const cellsY = tpl.size / 5;
        const color = tpl.color ?? "#aa66ff";
        const opacity = tpl.opacity ?? 0.25;
        const animClass = getAnimationClass(tpl.animation);
        const isInteractive = !!onTemplateClick;

        return (
          <g
            key={tpl.id}
            className={`aoe-template ${animClass} ${isInteractive ? "cursor-pointer" : ""}`}
            transform={`translate(${tpl.gridX}, ${tpl.gridY})`}
            onClick={() => onTemplateClick?.(tpl.id)}
          >
            <title>
              {tpl.label} — {getShapeLabel(tpl.shape, tpl.size)}
              {tpl.damageDice ? ` (${tpl.damageDice}${tpl.damageType ? ` ${tpl.damageType}` : ""})` : ""}
              {tpl.savingThrowDC ? ` | DC ${tpl.savingThrowDC} ${tpl.savingThrowAbility?.toUpperCase() ?? ""}` : ""}
            </title>

            {/* Shape rendering */}
            {renderShape(tpl.shape, cellsX, cellsY, color, opacity)}

            {/* Border outline */}
            {renderShape(tpl.shape, cellsX, cellsY, color, 0.6, true)}

            {/* Label */}
            <text
              x={0} y={-0.3}
              textAnchor="middle"
              fill={color}
              fontSize="0.35"
              fontWeight="bold"
              className="pointer-events-none select-none"
              style={{ textShadow: "0 0 4px rgba(0,0,0,0.8)" }}
            >
              {tpl.label}
            </text>

            {/* Size indicator */}
            <text
              x={0} y={cellsY + 0.3}
              textAnchor="middle"
              fill={color}
              fontSize="0.25"
              opacity={0.7}
              className="pointer-events-none select-none"
              style={{ textShadow: "0 0 3px rgba(0,0,0,0.8)" }}
            >
              {tpl.size}ft
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/** Render a shape fill using SVG primitives */
function renderShape(
  shape: AoETemplate["shape"],
  cellsX: number,
  cellsY: number,
  color: string,
  opacity: number,
  isOutline = false,
) {
  const attrs = isOutline
    ? { fill: "none", stroke: color, strokeWidth: 0.05, strokeOpacity: 0.8 }
    : { fill: color, fillOpacity: opacity, stroke: "none" };

  switch (shape) {
    case "circle": {
      const r = cellsX;
      return <circle cx={0} cy={0} r={r} {...attrs} />;
    }
    case "sphere": {
      // Sphere is rendered as a filled circle with a "3D" highlight arc
      const r = cellsX;
      return (
        <g>
          <circle cx={0} cy={0} r={r} {...attrs} />
          {!isOutline && (
            <>
              <ellipse cx={-r * 0.25} cy={-r * 0.25} rx={r * 0.5} ry={r * 0.35}
                fill="white" opacity={0.12} />
              <path d={`M ${-r} 0 A ${r} ${r} 0 0 1 ${r} 0`}
                fill="none" stroke="white" strokeWidth={0.04} opacity={0.15} />
            </>
          )}
        </g>
      );
    }
    case "cone": {
      // Cone: triangle from origin pointing "right" by default
      const len = cellsX;
      const halfWidth = cellsY * 0.5;
      return (
        <polygon
          points={`0,0 ${len},${-halfWidth} ${len},${halfWidth}`}
          {...attrs}
        />
      );
    }
    case "line": {
      // Line: thin rectangle from origin extending forward
      const w = 0.6; // ~3ft wide in grid units
      return (
        <rect
          x={0}
          y={-w / 2}
          width={cellsX}
          height={w}
          rx={0.1}
          {...attrs}
        />
      );
    }
    case "cube": {
      // Cube: centered square
      const half = cellsX / 2;
      return (
        <rect
          x={-half}
          y={-half}
          width={cellsX}
          height={cellsY}
          rx={0.1}
          {...attrs}
        />
      );
    }
    default:
      return null;
  }
}
