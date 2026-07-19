/**
 * STᚱ VTT — Canvas Token Renderer
 *
 * Pure rendering function for drawing map tokens on the Theatric canvas.
 * Extracted from canvasUtils for modularity (<150 lines).
 * Draws token circles with glow, icon, label, and HP bar.
 */

import type { MapToken } from "@/types";

/**
 * Draws a single map token on the canvas with shadow, icon, label, and HP bar.
 */
export function drawToken(
  ctx: CanvasRenderingContext2D,
  token: MapToken,
  gridSize: number,
  showLabels: boolean
) {
  const tx = token.x * gridSize + gridSize / 2;
  const ty = token.y * gridSize + gridSize / 2;
  const ts = token.size * gridSize * 0.85;

  // Shadow
  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
  ctx.shadowBlur = ts * 0.3;
  ctx.shadowOffsetY = ts * 0.05;

  // Circle
  ctx.beginPath();
  ctx.arc(tx, ty, ts / 2, 0, Math.PI * 2);
  ctx.fillStyle = token.color || "#505270";
  ctx.fill();

  // Inner glow
  const gradient = ctx.createRadialGradient(
    tx - ts * 0.1,
    ty - ts * 0.1,
    0,
    tx,
    ty,
    ts / 2
  );
  gradient.addColorStop(0, "rgba(255, 255, 255, 0.15)");
  gradient.addColorStop(1, "rgba(0, 0, 0, 0.2)");
  ctx.fillStyle = gradient;
  ctx.fill();
  ctx.restore();

  // Icon
  ctx.fillStyle = "#ffffff";
  ctx.font = `bold ${ts * 0.45}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(
    token.icon || token.label[0]?.toUpperCase() || "?",
    tx,
    ty + 1
  );

  // Label
  if (showLabels && token.label) {
    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
    ctx.shadowBlur = 4;
    ctx.fillStyle = "#f0f0f0";
    ctx.font = `bold ${ts * 0.3}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText(token.label, tx, ty - ts / 2 - 4);
    ctx.restore();
  }

  // HP bar
  if (token.hp) {
    const barW = ts * 0.8;
    const barH = 4;
    const barX = tx - barW / 2;
    const barY = ty + ts / 2 + 4;
    const ratio = Math.max(0, token.hp.current / Math.max(1, token.hp.max));
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle =
      ratio > 0.5 ? "#22c55e" : ratio > 0.25 ? "#f59e0b" : "#ef4444";
    ctx.fillRect(barX, barY, barW * ratio, barH);
  }
}
