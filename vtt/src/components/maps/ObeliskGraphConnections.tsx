/* ── Obelisk Graph Connections ──────────────────────────────────
 * Renders the ley-line connection paths between obelisks.
 * Each connection is a line + glow line + text label.
 * Extracted from ObeliskNetworkGraph to maintain <150 line limit.
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

        return (
          <g key={`conn-${conn.sourceId}-${conn.targetId}`}>
            {/* Main line */}
            <line
              x1={src.x}
              y1={src.y}
              x2={dst.x}
              y2={dst.y}
              stroke={color}
              strokeWidth={2 + conn.strength * 3}
              strokeOpacity={isSelected ? 0.8 : 0.3}
              className="transition-all duration-500"
            />
            {/* Glow line */}
            <line
              x1={src.x}
              y1={src.y}
              x2={dst.x}
              y2={dst.y}
              stroke={color}
              strokeWidth={isSelected ? 8 : 0}
              strokeOpacity={0.15}
              className="transition-all duration-500"
            />
            {/* Connection type label */}
            {zoomLevel >= 0.8 && (
              <text
                x={midX}
                y={midY}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-surface-600 text-[8px] select-none pointer-events-none"
                dy="-12"
              >
                {conn.type.replace("_", " ")}
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
}
