/* ── Obelisk Graph Node ─────────────────────────────────────────
 * Single SVG node in the obelisk network graph. Fantasy-enhanced
 * with rune glow, corruption sheen, discovery burst, and pulsing
 * selection ring animations.
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
  const isCorrupted = obelisk.state === "corrupted";
  const isCleansed = obelisk.state === "cleansed";

  return (
    <g
      data-obelisk-node
      transform={`translate(${cx}, ${cy})`}
      onClick={() => onSelect(obelisk.id)}
      className={`transition-all duration-300 ${
        isUndiscovered
          ? "opacity-30 grayscale"
          : "cursor-pointer hover:scale-110"
      }`}
      style={{
        cursor: isUndiscovered ? "default" : "pointer",
        filter: isCleansed ? "drop-shadow(0 0 8px rgba(243, 199, 113, 0.3))" : "none",
      }}
    >
      {/* Glow circle — enhanced with obelisk-pulse */}
      {!isUndiscovered && (
        <circle
          r={obelisk.isActive ? 60 : 45}
          fill={`url(#glow-${obelisk.id})`}
          className={`obelisk-pulse ${obelisk.isActive ? "animate-pulse" : ""}`}
          style={{ "--obelisk-color": col } as React.CSSProperties}
        />
      )}

      {/* Discovery burst ring */}
      {obelisk.state === "discovered" && (
        <circle
          r={NODE_RADIUS}
          fill="none"
          stroke={col}
          strokeWidth={2}
          className="obelisk-discovery-burst"
        />
      )}

      {/* Outer ring — corruption border with sheen */}
      <circle
        r={NODE_RADIUS + NODE_RING_WIDTH}
        fill="none"
        stroke={corrCol}
        strokeWidth={NODE_RING_WIDTH}
        strokeOpacity={obelisk.corruption > 0 ? 0.8 : 0.1}
        className={isCorrupted ? "obelisk-corruption-sheen" : ""}
      />

      {/* Main circle */}
      <circle
        r={NODE_RADIUS}
        fill={isUndiscovered ? "#2a2a3a" : col}
        fillOpacity={isUndiscovered ? 0.25 : 0.88}
        stroke={isSelected ? "#ffffff" : col}
        strokeWidth={isSelected ? 3 : 1.5}
        className={`transition-all duration-300 ${
          isSelected ? "obelisk-pulse" : ""
        }`}
        style={{
          "--obelisk-color": "#ffffff",
          filter: isCorrupted
            ? `drop-shadow(0 0 6px ${corrCol})`
            : isSelected
              ? "drop-shadow(0 0 8px rgba(255,255,255,0.4))"
              : "none",
        } as React.CSSProperties}
      />

      {/* Selection ring — pulsing dashed arc */}
      {isSelected && (
        <>
          <circle
            r={NODE_RADIUS + 6}
            fill="none"
            stroke="#ffffff"
            strokeWidth={1.5}
            strokeDasharray="6 4"
            className="animate-[spin_3s_linear_infinite]"
            style={{ opacity: 0.7 }}
          />
          <circle
            r={NODE_RADIUS + 9}
            fill="none"
            stroke={col}
            strokeWidth={0.5}
            strokeDasharray="3 6"
            className="animate-[spin_5s_linear_infinite]"
            style={{ opacity: 0.4 }}
          />
        </>
      )}

      {/* State glyph with rune glow */}
      <text
        textAnchor="middle"
        dominantBaseline="central"
        className={`fill-white text-sm font-bold select-none ${
          isCleansed ? "obelisk-rune-glow" : ""
        }`}
      >
        {getObeliskGlyph(obelisk.state)}
      </text>

      {/* Label with affinity-tinted text */}
      <text
        y={NODE_RADIUS + 18}
        textAnchor="middle"
        className={`fill-current text-[10px] font-semibold select-none tracking-wide transition-all duration-300 ${
          isSelected ? "text-white" : "text-surface-300"
        }`}
        fill={isSelected ? "#ffffff" : undefined}
      >
        {OBELISK_NAMES[obelisk.id]}
      </text>

      {/* Corruption badge — enhanced icon */}
      {obelisk.corruption > 0 && (
        <text
          y={-NODE_RADIUS - 12}
          textAnchor="middle"
          className="fill-current text-[9px] font-bold select-none"
          fill={corrCol}
          style={{
            filter: `drop-shadow(0 0 4px ${corrCol})`,
          }}
        >
          ⚠ {obelisk.corruption}%
        </text>
      )}
    </g>
  );
}
