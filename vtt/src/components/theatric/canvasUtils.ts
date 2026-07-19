/**
 * STᚱ VTT — Cinematic Canvas FX
 *
 * Pure rendering functions for the Theatric canvas cinematic overlays.
 * Contains vignette, letterbox, grid overlay, and ambient particle field.
 * All functions are pure — no side effects, no state.
 * (< 110 lines — modular)
 */

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  speed: number;
}

/**
 * Draws a cinematic vignette overlay on the canvas edges.
 * Gold-tinted dark gradient fading from center.
 */
export function drawVignette(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number
) {
  const vignette = ctx.createRadialGradient(
    w / 2,
    h / 2,
    w * 0.25,
    w / 2,
    h / 2,
    w * 0.85
  );
  vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
  vignette.addColorStop(0.6, "rgba(0, 0, 0, 0.1)");
  vignette.addColorStop(0.85, "rgba(0, 0, 0, 0.3)");
  vignette.addColorStop(1, "rgba(10, 0, 0, 0.5)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);
}

/**
 * Draws cinematic letterbox bars at top and bottom.
 * Gold-tinted edge glow.
 */
export function drawLetterbox(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number
) {
  const barHeight = h * 0.05;
  const topGrad = ctx.createLinearGradient(0, 0, 0, barHeight);
  topGrad.addColorStop(0, "rgba(0, 0, 0, 0.75)");
  topGrad.addColorStop(0.6, "rgba(0, 0, 0, 0.4)");
  topGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = topGrad;
  ctx.fillRect(0, 0, w, barHeight);

  const bottomGrad = ctx.createLinearGradient(0, h - barHeight, 0, h);
  bottomGrad.addColorStop(0, "rgba(0, 0, 0, 0)");
  bottomGrad.addColorStop(0.4, "rgba(0, 0, 0, 0.4)");
  bottomGrad.addColorStop(1, "rgba(0, 0, 0, 0.75)");
  ctx.fillStyle = bottomGrad;
  ctx.fillRect(0, h - barHeight, w, barHeight);
}

/**
 * Draws a subtle gold-tinted grid overlay on the map.
 * Hidden by default — toggled via DM/Player control.
 */
export function drawGrid(
  ctx: CanvasRenderingContext2D,
  gridWidth: number,
  gridHeight: number,
  gridSize: number
) {
  ctx.save();
  ctx.strokeStyle = "rgba(234, 179, 8, 0.12)";
  ctx.lineWidth = 0.5;
  ctx.setLineDash([2, 4]);

  for (let x = 0; x <= gridWidth; x++) {
    ctx.beginPath();
    ctx.moveTo(x * gridSize, 0);
    ctx.lineTo(x * gridSize, gridHeight * gridSize);
    ctx.stroke();
  }
  for (let y = 0; y <= gridHeight; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * gridSize);
    ctx.lineTo(gridWidth * gridSize, y * gridSize);
    ctx.stroke();
  }

  ctx.setLineDash([]);
  ctx.restore();
}

/**
 * Draws ambient gold dust particles floating upward.
 * Subtle atmospheric effect that adds depth.
 */
export function drawParticles(
  ctx: CanvasRenderingContext2D,
  particles: Particle[],
  _zoom: number,
  cx: number,
  cy: number
) {
  particles.forEach((p) => {
    ctx.save();
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = "#fde047";
    ctx.shadowColor = "rgba(234, 179, 8, 0.15)";
    ctx.shadowBlur = 4;
    const sx = cx + p.x;
    const sy = cy + p.y;
    ctx.beginPath();
    ctx.arc(sx, sy, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}
