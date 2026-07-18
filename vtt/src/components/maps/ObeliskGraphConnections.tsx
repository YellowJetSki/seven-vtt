/* ── Obelisk Graph Connections ──────────────────────────────────
 * Renders ley-line connection paths between obelisks with fantasy
 * shimmer effects, dash-march animation, selected-node glow,
 * and type label. Each connection pulses based on strength.
 * ─────────────────────────────────────────────────────────────── */

import type { ObeliskConnection, ObeliskId } from "@/types/obelisks";
import { blendColors } from "./obelisk-graph-helpers";

/* ── Props ──────────────────────────────────────────────────── */

interface ObeliskGraphConnectionsProps {
  connections: Array<{
    conn: ObeliskConnection;
    src: { x: number; y: number };
    dst: { x: number; y: number };
    color: string;
  }>;
  selectedId: ObeliskId | null;
  zoomLevel: number;
}

/* ── Component ───────────────────────────────────────────────── */

export function ObeliskGraphConnections({
  connections,
  selectedId,
  zoomLevel,
}: ObeliskGraphConnectionsProps) {
  return (
    <g>
      {connections.map(({ conn, src, dst, color }) => {
        const midX = (src.x + dst.x) / 2;
        const midY = (src.y + dst.y) / 2;
        const isSelected =
          selectedId &&
          (conn.sourceId === selectedId || conn.targetId === selectedId);
        const lineWidth = 2 + conn.strength * 3;

        return (
          <g key={`conn-${conn.sourceId}-${conn.targetId}`}>
            {/* Background glow (always visible for ambient effect) */}
            <line
              x1={src.x}
              y1={src.y}
              x2={dst.x}
              y2={dst.y}
              stroke={color}
              strokeWidth={lineWidth + 10}
              strokeOpacity={0.04}
            />

            {/* Main ley line — dash-march animation */}
            <line
              x1={src.x}
              y1={src.y}
              x2={dst.x}
              y2={dst.y}
              stroke={color}
              strokeWidth={lineWidth}
              strokeOpacity={isSelected ? 0.9 : 0.35}
              strokeDasharray={isSelected ? "6 4" : "none"}
              className={`transition-all duration-700 ${
                isSelected ? "obelisk-ley-line" : ""
              }`}
            />

            {/* Glow line — pulsing on selection */}
            <line
              x1={src.x}
              y1={src.y}
              x2={dst.x}
              y2={dst.y}
              stroke={color}
              strokeWidth={isSelected ? 10 : 0}
              strokeOpacity={0.2}
              className="transition-all duration-500"
            />

            {/* Second glow ring for selected connections */}
            {isSelected && (
              <line
                x1={src.x}
                y1={src.y}
                x2={dst.x}
                y2={dst.y}
                stroke="rgba(255,255,255,0.5)"
                strokeWidth={1.5}
                strokeOpacity={0.4}
                strokeDasharray="2 8"
                className="animate-[spin_4s_linear_infinite]"
              />
            )}

            {/* Connection type label — visible at higher zooms */}
            {zoomLevel >= 0.8 && (
              <g>
                {/* Label background pill */}
                <rect
                  x={midX - 30}
                  y={midY - 14}
                  width={60}
                  height={14}
                  rx={4}
                  fill="rgba(24,25,32,0.8)"
                  className="transition-opacity duration-300"
                />
                <text
                  x={midX}
                  y={midY - 4}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className={`fill-current text-[8px] select-none pointer-events-none ${
                    isSelected ? "text-accent-300" : "text-surface-500"
                  }`}
                >
                  {conn.type.replace("_", " ")}
                </text>
              </g>
            )}
          </g>
        );
      })}
    </g>
  );
}
