/* ── AoETemplateOverlay ────────────────────────────────────────
 * SVG overlay that renders spell/ability AOE templates with
 * fantasy aesthetic: color-coded shape fills, glow borders,
 * animated runic rings, spell labels with arcane styling.
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

/** Determines an SVG filter for elemental effects */
function getElementalFilter(damageType?: string): string | null {
  switch (damageType) {
    case "fire": return "url(#fire-glow)";
    case "cold": return "url(#frost-glow)";
    case "lightning": return "url(#shock-glow)";
    case "poison": return "url(#venom-glow)";
    case "radiant": return "url(#radiant-glow)";
    case "thunder": return "url(#force-glow)";
    default: return null;
  }
}

/** Get a shape label with size */
function getShapeLabel(shape: AoETemplate["shape"], size: number): string {
  const labels: Record<AoETemplate["shape"], string> = {
    circle: `${size}-ft radius`,
    cone: `${size}-ft cone`,
    line: `${size}-ft line`,
    cube: `${size}-ft cube`,
    sphere: `${size}-ft sphere`,
  };
  return labels[shape];
}

export function AoETemplateOverlay({ templates, gridWidth, gridHeight, isGmView, onTemplateClick }: Props) {
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
      {/* SVG Filter definitions for elemental glows */}
      <defs>
        <filter id="fire-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="0.12" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="frost-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="0.08" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="shock-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="0.15" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="venom-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="0.1" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="radiant-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="0.08" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="force-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="0.1" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Render each template */}
      {visibleTemplates.map((tpl) => {
        const cellsX = tpl.size / 5;
        const cellsY = tpl.size / 5;
        const color = tpl.color ?? "#aa66ff";
        const opacity = tpl.opacity ?? 0.25;
        const glowFilter = getElementalFilter(tpl.damageType);
        const isInteractive = !!onTemplateClick;
        const showRunicRing = tpl.shape === "circle" || tpl.shape === "sphere";
        const showAnim = tpl.animation ?? "none";

        return (
          <g
            key={tpl.id}
            className={`aoe-template ${isInteractive ? "cursor-pointer" : ""}`}
            transform={`translate(${tpl.gridX}, ${tpl.gridY})`}
            onClick={() => onTemplateClick?.(tpl.id)}
            style={showAnim === "pulse" ? { animation: "aoe-pulse 2s ease-in-out infinite" } : undefined}
          >
            <title>
              {tpl.label} — {getShapeLabel(tpl.shape, tpl.size)}
              {tpl.damageDice ? ` (${tpl.damageDice}${tpl.damageType ? ` ${tpl.damageType}` : ""})` : ""}
              {tpl.savingThrowDC ? ` | DC ${tpl.savingThrowDC} ${tpl.savingThrowAbility?.toUpperCase() ?? ""}` : ""}
            </title>

            {/* Outer glow circle for radial shapes */}
            {(showAnim === "burn" || showAnim === "shimmer") && (tpl.shape === "circle" || tpl.shape === "sphere") && (
              <circle cx={0} cy={0} r={cellsX * 1.15}
                fill="none" stroke={color} strokeWidth={0.02}
                opacity={0.15} className={showAnim === "shimmer" ? "aoe-shimmer" : "aoe-burn"} />
            )}

            {/* Runic ring for circle/sphere shapes */}
            {showRunicRing && (
              <circle cx={0} cy={0} r={cellsX + 0.15}
                fill="none" stroke={color} strokeWidth={0.015}
                strokeDasharray="0.1 0.15"
                opacity={0.2} className="aoe-runic-ring" />
            )}

            {/* Shape fill */}
            <g filter={glowFilter ?? undefined}>
              {renderShapeFill(tpl.shape, cellsX, cellsY, color, opacity)}
            </g>

            {/* Shape border outline (brighter for visibility) */}
            {renderShapeOutline(tpl.shape, cellsX, cellsY, color)}

            {/* Inner arc highlight for sphere */}
            {tpl.shape === "sphere" && (
              <ellipse cx={-cellsX * 0.25} cy={-cellsY * 0.25}
                rx={cellsX * 0.5} ry={cellsY * 0.35}
                fill="white" opacity={0.1} />
            )}

            {/* Crosshair center dot */}
            <circle cx={0} cy={0} r={0.06}
              fill={color} opacity={0.5} />

            {/* Spell label — arcane styled */}
            <text
              x={0} y={-cellsY - 0.2}
              textAnchor="middle"
              fill={color}
              fontSize="0.35"
              fontWeight="bold"
              className="pointer-events-none select-none aoe-label-glow"
              style={{ textShadow: "0 0 6px rgba(0,0,0,0.9), 0 0 12px rgba(0,0,0,0.6)" }}
            >
              {tpl.label}
            </text>

            {/* Size / damage indicator */}
            <text
              x={0} y={cellsY + 0.4}
              textAnchor="middle"
              fill={color}
              fontSize="0.2"
              opacity={0.65}
              className="pointer-events-none select-none"
              style={{ textShadow: "0 0 4px rgba(0,0,0,0.8)" }}
            >
              {tpl.size}ft {tpl.damageDice ? `· ${tpl.damageDice}${tpl.damageType ? ` ${damageTypeIcon(tpl.damageType)}` : ""}` : ""}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/** Damage type icon character */
function damageTypeIcon(dt: string): string {
  const icons: Record<string, string> = {
    fire: "🔥", cold: "❄️", lightning: "⚡", poison: "☠️",
    radiant: "✨", thunder: "💥", acid: "🧪", necrotic: "💀",
    psychic: "🧠", force: "🌀",
  };
  return icons[dt] ?? "⚔️";
}

/** Render the filled shape */
function renderShapeFill(
  shape: AoETemplate["shape"], cx: number, cy: number,
  color: string, opacity: number,
) {
  const fillAttrs = { fill: color, fillOpacity: opacity, stroke: "none" };

  switch (shape) {
    case "circle":
    case "sphere":
      return <circle cx={0} cy={0} r={cx} {...fillAttrs} />;
    case "cone": {
      const hw = cy * 0.5;
      return <polygon points={`0,0 ${cx},${-hw} ${cx},${hw}`} {...fillAttrs} />;
    }
    case "line": {
      const w = 0.6;
      return <rect x={0} y={-w / 2} width={cx} height={w} rx={0.08} {...fillAttrs} />;
    }
    case "cube": {
      const half = cx / 2;
      return <rect x={-half} y={-half} width={cx} height={cy} rx={0.08} {...fillAttrs} />;
    }
    default:
      return null;
  }
}

/** Render the shape outline with glow */
function renderShapeOutline(
  shape: AoETemplate["shape"], cx: number, cy: number,
  color: string,
) {
  const outlineAttrs = {
    fill: "none", stroke: color, strokeWidth: 0.04,
    strokeOpacity: 0.5, strokeDasharray: "0.08 0.06",
  };

  switch (shape) {
    case "circle":
    case "sphere":
      return <circle cx={0} cy={0} r={cx} {...outlineAttrs} />;
    case "cone": {
      const hw = cy * 0.5;
      return <polygon points={`0,0 ${cx},${-hw} ${cx},${hw}`} {...outlineAttrs} />;
    }
    case "line": {
      const w = 0.6;
      return <rect x={0} y={-w / 2} width={cx} height={w} rx={0.08} {...outlineAttrs} />;
    }
    case "cube": {
      const half = cx / 2;
      return <rect x={-half} y={-half} width={cx} height={cy} rx={0.08} {...outlineAttrs} />;
    }
    default:
      return null;
  }
}
