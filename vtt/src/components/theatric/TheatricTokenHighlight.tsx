/* ── Theatric Token Highlight ──────────────────────────────────
 * Renders a pulsing highlight around the active token on the theatric map.
 * ─────────────────────────────────────────────────────────────── */

import type { MapToken } from "@/types";

interface TheatricTokenHighlightProps {
  token: MapToken;
}

export function TheatricTokenHighlight({ token }: TheatricTokenHighlightProps) {
  return (
    <div
      className="pointer-events-none absolute animate-pulse"
      style={{
        left: `${token.x}%`,
        top: `${token.y}%`,
        width: `${token.size}px`,
        height: `${token.size}px`,
        transform: "translate(-50%, -50%)",
        borderRadius: "50%",
        border: `3px solid ${token.color}`,
        boxShadow: `0 0 20px ${token.color}88, 0 0 60px ${token.color}44`,
        transition: "all 0.3s ease",
      }}
    />
  );
}
