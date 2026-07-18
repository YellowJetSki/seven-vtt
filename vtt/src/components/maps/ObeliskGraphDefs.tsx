/* ── Obelisk Graph SVG Defs ─────────────────────────────────────
 * SVG <defs> block containing radial gradients for each obelisk's
 * glow effect. Extracted from ObeliskNetworkGraph to maintain the
 * <150 line limit.
 * ─────────────────────────────────────────────────────────────── */

import type { Obelisk } from "@/types/obelisks";
import { OBELISK_AFFINITIES, AFFINITY_COLORS } from "@/types/obelisks";

/* ── Props ──────────────────────────────────────────────────── */

interface ObeliskGraphDefsProps {
  obelisks: Obelisk[];
}

/* ── Component ───────────────────────────────────────────────── */

export function ObeliskGraphDefs({ obelisks }: ObeliskGraphDefsProps) {
  return (
    <defs>
      {obelisks.map((obelisk) => {
        const col = AFFINITY_COLORS[OBELISK_AFFINITIES[obelisk.id]];
        return (
          <radialGradient key={`glow-${obelisk.id}`} id={`glow-${obelisk.id}`}>
            <stop offset="0%" stopColor={col} stopOpacity={0.3} />
            <stop offset="100%" stopColor={col} stopOpacity={0} />
          </radialGradient>
        );
      })}
    </defs>
  );
}
