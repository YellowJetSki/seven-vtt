/* ── Obelisk Graph Node ─────────────────────────────────────────
 * Single SVG node in the obelisk network graph. Renders the
 * glow circle, corruption ring, affinity circle, selection ring,
 * state glyph, label, and corruption badge.
 * Extracted from ObeliskNetworkGraph to maintain <150 line limit.
 * ─────────────────────────────────────────────────────────────── */

import type { Obelisk, ObeliskId } from "@/types/obelisks";
import { OBELISK_NAMES, OBELISK_AFFINITIES, AFFINITY_COLORS, corruptionColor } from "@/types/obelisks";
import { NODE_RADIUS, NODE_RING_WIDTH, getObeliskGlyph } from "./obelisk-graph-helpers";

/* ── Props ──────────────────────────────────────────────────── */

interface ObeliskGraphNodeProps {
  obelisk: Obelisk;
  cx: number;
  cy: number;
  isSelected: boolean;
  onSelect: (id: ObeliskId) => void;
}

/* ── Component ───────────────────────────────────────────────── */

export function ObeliskGraphNode({
  obelisk,
  cx,
  cy,
  isSelected,
  onSelect,
}: ObeliskGraphNodeProps) {
  const col = AFFINITY_COLORS[OBELISK_AFFINITIES[obelisk.id]];
  const corrCol = corruptionColor(obelisk.corruption);
  const isUndiscovered = obelisk.state === "undiscovered";

  return (
    <g
      data-obelisk-node
      transform={`translate(${cx}, ${cy})`}
      onClick={() => onSelect(obelisk.id)}
      className={`transition-transform duration-200 ${
        isUndiscovered ? "opacity-30" : "cursor-pointer hover:scale-110"
      }`}
      style={{ cursor: isUndiscovered ? "default" : "pointer" }}
    >
      {/* Glow circle */}
      {!isUndiscovered && (
        <circle
          r={obelisk.isActive ? 60 : 45}
          fill={`url(#glow-${obelisk.id})`}
          className={obelisk.isActive ? "animate-pulse" : ""}
        />
      )}

      {/* Outer ring — corruption border */}
      <circle
        r={NODE_RADIUS + NODE_RING_WIDTH}
        fill="none"
        stroke={corrCol}
        strokeWidth={NODE_RING_WIDTH}
        strokeOpacity={obelisk.corruption > 0 ? 0.7 : 0.1}
      />

      {/* Main circle */}
      <circle
        r={NODE_RADIUS}
        fill={isUndiscovered ? "#333344" : col}
        fillOpacity={isUndiscovered ? 0.3 : 0.85}
        stroke={isSelected ? "#ffffff" : col}
        strokeWidth={isSelected ? 3 : 1}
        className="transition-all duration-300"
      />

      {/* Selection ring */}
      {isSelected && (
        <circle
          r={NODE_RADIUS + 6}
          fill="none"
          stroke="#ffffff"
          strokeWidth={1}
          strokeDasharray="4 3"
          className="animate-[spin_4s_linear_infinite]"
        />
      )}

      {/* State glyph */}
      <text
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-white text-sm font-bold select-none"
      >
        {getObeliskGlyph(obelisk.state)}
      </text>

      {/* Label */}
      <text
        y={NODE_RADIUS + 18}
        textAnchor="middle"
        className={`fill-current text-[10px] font-medium select-none ${
          isSelected ? "text-accent-300" : "text-surface-300"
        }`}
      >
        {OBELISK_NAMES[obelisk.id]}
      </text>

      {/* Corruption badge */}
      {obelisk.corruption > 0 && (
        <text
          y={-NODE_RADIUS - 12}
          textAnchor="middle"
          className="fill-current text-[9px] font-bold select-none"
          fill={corrCol}
        >
          {obelisk.corruption}%
        </text>
      )}
    </g>
  );
}
