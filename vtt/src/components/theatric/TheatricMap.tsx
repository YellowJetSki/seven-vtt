/* ── Theatric Map Component ────────────────────────────────────
 * Renders a fullscreen battle map with grid overlay, fog of war,
 * and a highlighted token.
 * ─────────────────────────────────────────────────────────────── */

import type { BattleMap } from "@/types";
import { TheatricTokenHighlight } from "./TheatricTokenHighlight";

interface TheatricMapProps {
  map: BattleMap | null;
  tokenId: string;
}

export function TheatricMap({ map, tokenId }: TheatricMapProps) {
  if (!map) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-surface-500">No battle map loaded.</p>
      </div>
    );
  }

  const token = map.tokens?.find((t) => t.id === tokenId);

  return (
    <div className="relative h-full w-full overflow-hidden bg-surface-800">
      {map.imageUrl ? (
        <img
          src={map.imageUrl}
          alt={map.name}
          className="h-full w-full object-contain"
          style={{ imageRendering: "pixelated" }}
        />
      ) : (
        <div className="flex h-full items-center justify-center text-surface-600">
          <span className="text-6xl">🗺️</span>
        </div>
      )}

      {/* Grid overlay */}
      {map.gridSize > 0 && map.gridWidth > 0 && map.gridHeight > 0 && (
        <svg className="pointer-events-none absolute inset-0 h-full w-full" style={{ position: "absolute", top: 0, left: 0 }}>
          <defs>
            <pattern
              id="theatric-grid"
              width={`${(100 / map.gridWidth).toFixed(4)}%`}
              height={`${(100 / map.gridHeight).toFixed(4)}%`}
              patternUnits="userSpaceOnUse"
            >
              <path
                d={`M ${(100 / map.gridWidth).toFixed(4)} 0 L 0 0 0 ${(100 / map.gridHeight).toFixed(4)}`}
                fill="none"
                stroke={map.gridColor ?? "rgba(255,255,255,0.35)"}
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#theatric-grid)" />
        </svg>
      )}

      {/* Token highlight */}
      {token && (
        <TheatricTokenHighlight token={token} />
      )}
    </div>
  );
}
