/* ── Obelisk Graph Connection Paths Builder ─────────────────────
 * Pure utility that computes connection line data for the SVG
 * obelisk network graph. Extracted to keep components under 150
 * lines while keeping graph logic testable and reusable.
 * ─────────────────────────────────────────────────────────────── */

import type { Obelisk, ObeliskConnection, ObeliskId } from "@/types/obelisks";
import { OBELISK_AFFINITIES, AFFINITY_COLORS } from "@/types/obelisks";
import { blendColors } from "./obelisk-graph-helpers";

/* ── Computed connection path data ───────────────────────────── */

export interface ConnectionPath {
  conn: ObeliskConnection;
  src: { x: number; y: number };
  dst: { x: number; y: number };
  color: string;
}

/** Build all connection paths for the graph */
export function buildConnectionPaths(
  connections: ObeliskConnection[],
  positions: Record<ObeliskId, { x: number; y: number }>,
  obelisks: Obelisk[],
): ConnectionPath[] {
  return connections
    .map((conn) => {
      const src = positions[conn.sourceId];
      const dst = positions[conn.targetId];
      if (!src || !dst) return null;

      const source = obelisks.find((o) => o.id === conn.sourceId);
      const target = obelisks.find((o) => o.id === conn.targetId);
      const color =
        source && target
          ? blendColors(
              AFFINITY_COLORS[OBELISK_AFFINITIES[source.id]],
              AFFINITY_COLORS[OBELISK_AFFINITIES[target.id]],
            )
          : "#555555";

      return { conn, src, dst, color };
    })
    .filter((c): c is ConnectionPath => c !== null);
}
