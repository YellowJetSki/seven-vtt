/* ── Obelisk Graph SVG Defs ─────────────────────────────────────
 * SVG <defs> block with enhanced fantasy gradients — richer glow
 * effects with multi-stop radial gradients, ley-line gradient
 * definitions, and pulsing filter primitives.
 * ─────────────────────────────────────────────────────────────── */

import type { Obelisk } from "@/types/obelisks";
import { OBELISK_AFFINITIES, AFFINITY_COLORS } from "@/types/obelisks";

/* ── Props ──────────────────────────────────────────────────── */

interface ObeliskGraphDefsProps {
  obelisks: Obelisk[];
  isPulsing?: boolean;
}

/* ── Component ───────────────────────────────────────────────── */

export function ObeliskGraphDefs({ obelisks, isPulsing = false }: ObeliskGraphDefsProps) {
  return (
    <defs>
      {/* Rich gradient glow for each obelisk */}
      {obelisks.map((obelisk) => {
        const col = AFFINITY_COLORS[OBELISK_AFFINITIES[obelisk.id]];
        return (
          <radialGradient
            key={`glow-${obelisk.id}`}
            id={`glow-${obelisk.id}`}
            cx="50%"
            cy="50%"
            r="50%"
          >
            <stop offset="0%" stopColor={col} stopOpacity={0.45} />
            <stop offset="30%" stopColor={col} stopOpacity={0.2} />
            <stop offset="60%" stopColor={col} stopOpacity={0.08} />
            <stop offset="100%" stopColor={col} stopOpacity={0} />
          </radialGradient>
        );
      })}

      {/* Selection glow filter */}
      <filter id="obelisk-selection-glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      {/* Corruption pulse filter */}
      <filter id="obelisk-corruption-glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
        <feComponentTransfer in="blur" result="glow">
          <feFuncA type="linear" slope={isPulsing ? 1.5 : 0.8} />
        </feComponentTransfer>
        <feMerge>
          <feMergeNode in="glow" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      {/* Ley-line glow filter */}
      <filter id="ley-line-glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  );
}
