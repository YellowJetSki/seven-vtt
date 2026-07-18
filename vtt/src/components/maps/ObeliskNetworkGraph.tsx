/* ── Obelisk Network Graph ──────────────────────────────────────
 * Interactive SVG visualization of the 7 Arkla obelisks with
 * ley-line connections, state-based styling, pulsing animations,
 * zoom/pan support, and click-to-select.
 * ─────────────────────────────────────────────────────────────── */

import { useMemo, useRef, useState, useCallback } from "react";
import type { Obelisk, ObeliskConnection, ObeliskId } from "@/types/obelisks";
import { OBELISK_AFFINITIES, AFFINITY_COLORS } from "@/types/obelisks";
import { GRAPH_WIDTH, GRAPH_HEIGHT } from "./obelisk-graph-helpers";
import { ObeliskGraphDefs } from "./ObeliskGraphDefs";
import { ObeliskGraphConnections } from "./ObeliskGraphConnections";
import { ObeliskGraphNode } from "./ObeliskGraphNode";
import type { ConnectionPath } from "./obelisk-graph-connection-paths";
import { buildConnectionPaths } from "./obelisk-graph-connection-paths";

/* ── Props ──────────────────────────────────────────────────── */

interface ObeliskNetworkGraphProps {
  obelisks: Obelisk[];
  connections: ObeliskConnection[];
  zoomLevel: number;
  selectedId: ObeliskId | null;
  onSelectObelisk: (id: ObeliskId) => void;
  className?: string;
}

/* ── Component ───────────────────────────────────────────────── */

export function ObeliskNetworkGraph({
  obelisks,
  connections,
  zoomLevel,
  selectedId,
  onSelectObelisk,
  className = "",
}: ObeliskNetworkGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  /** Normalise obelisk position into SVG coordinates */
  const positions = useMemo(() => {
    const map: Record<ObeliskId, { x: number; y: number }> = {};
    for (const obelisk of obelisks) {
      map[obelisk.id] = {
        x: (obelisk.mapPositionX / 100) * GRAPH_WIDTH,
        y: (obelisk.mapPositionY / 100) * GRAPH_HEIGHT,
      };
    }
    return map;
  }, [obelisks]);

  /** Compute connection line paths */
  const connectionPaths: ConnectionPath[] = useMemo(
    () => buildConnectionPaths(connections, positions, obelisks),
    [connections, positions, obelisks],
  );

  /* ── Pan handlers ─────────────────────────── */

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("[data-obelisk-node]")) return;
    setIsPanning(true);
    setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  }, [panOffset]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning) return;
    setPanOffset({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
  }, [isPanning, panStart]);

  const handleMouseUp = useCallback(() => setIsPanning(false), []);

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-surface-700/50 bg-surface-900/95 card-glow ${className}`}
      style={{
        backgroundImage: `
          radial-gradient(ellipse at 20% 30%, rgba(139, 48, 255, 0.03) 0%, transparent 50%),
          radial-gradient(ellipse at 80% 70%, rgba(59, 130, 246, 0.03) 0%, transparent 50%),
          radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.02) 1px, transparent 0)
        `,
        backgroundSize: '100% 100%, 100% 100%, 20px 20px',
      }}
    >
      {/* Subtle grid pattern background */}
      <svg className="absolute inset-0 h-full w-full pointer-events-none opacity-5" viewBox={`0 0 ${GRAPH_WIDTH} ${GRAPH_HEIGHT}`}>
        <defs>
          <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(139, 48, 255, 0.15)" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-pattern)" />
      </svg>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${GRAPH_WIDTH} ${GRAPH_HEIGHT}`}
        className="relative h-full w-full cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <ObeliskGraphDefs obelisks={obelisks} isPulsing={selectedId !== null} />

        {/* Transform group for zoom/pan */}
        <g
          transform={`translate(${panOffset.x}, ${panOffset.y}) scale(${zoomLevel})`}
          style={{ transformOrigin: `${GRAPH_WIDTH / 2}px ${GRAPH_HEIGHT / 2}px` }}
        >
          <ObeliskGraphConnections
            connections={connectionPaths}
            selectedId={selectedId}
            zoomLevel={zoomLevel}
          />

          {/* Obelisk Nodes */}
          {obelisks.map((obelisk) => {
            const pos = positions[obelisk.id];
            if (!pos) return null;

            return (
              <ObeliskGraphNode
                key={obelisk.id}
                obelisk={obelisk}
                cx={pos.x}
                cy={pos.y}
                isSelected={selectedId === obelisk.id}
                onSelect={onSelectObelisk}
              />
            );
          })}
        </g>
      </svg>
    </div>
  );
}
