/* ── Obelisk Graph Helpers ──────────────────────────────────────
 * Pure utility functions extracted from ObeliskNetworkGraph.tsx
 * to keep the component under 150 lines.
 * ─────────────────────────────────────────────────────────────── */

/** Blend two hex colors by averaging their RGB channels */
export function blendColors(c1: string, c2: string): string {
  const p1 = parseInt(c1.slice(1), 16);
  const p2 = parseInt(c2.slice(1), 16);
  const r = Math.round((((p1 >> 16) & 0xff) + ((p2 >> 16) & 0xff)) / 2);
  const g = Math.round((((p1 >> 8) & 0xff) + ((p2 >> 8) & 0xff)) / 2);
  const b = Math.round(((p1 & 0xff) + (p2 & 0xff)) / 2);
  return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, "0")}`;
}

/** Get the monogram glyph for a given obelisk state */
export function getObeliskGlyph(state: string): string {
  switch (state) {
    case "undiscovered": return "?";
    case "discovered": return "◈";
    case "attuned": return "✦";
    case "corrupted": return "⬟";
    case "cleansed": return "✧";
    case "shattered": return "⬡";
    default: return "◇";
  }
}

/** SVG graph dimensions — used by both graph and position calculations */
export const GRAPH_WIDTH = 800;
export const GRAPH_HEIGHT = 600;
export const NODE_RADIUS = 22;
export const NODE_RING_WIDTH = 4;
