/**
 * STᚱ VTT — Drag Renderer (Premium)
 *
 * Canvas renderers for token drag-and-drop visual feedback.
 *
 * Features:
 *   - Drag ghost: Semi-transparent token following the cursor during drag
 *   - Drop preview: Gold-highlighted destination cell on the grid
 *   - Snap indicator: Coordinate readout near the ghost token
 *   - Drag trail: Subtle opacity trail from origin to current position
 *   - Grid cell highlight: Gold glow on the target cell before drop
 *
 * All rendering is done in CANVAS coordinates (post-transform).
 * The caller must translate/scale the context before calling these functions.
 */

// ── Drag Ghost ───────────────────────────────────────────

export interface DragPreviewState {
  activeTokenId: string | null;
  /** Grid coordinates the ghost is currently at */
  ghostGridX: number;
  ghostGridY: number;
  /** Whether a drag is actively in progress */
  isDragging: boolean;
  /** Original grid position before drag started (for trail line) */
  originGridX: number;
  originGridY: number;
}

/**
 * Draw the destination cell highlight (gold glow) at the target grid position.
 */
export function drawDropTarget(
  ctx: CanvasRenderingContext2D,
  gridX: number,
  gridY: number,
  gridSize: number
): void {
  const px = gridX * gridSize;
  const py = gridY * gridSize;

  // Outer glow
  ctx.save();
  ctx.shadowColor = "rgba(234, 179, 8, 0.4)";
  ctx.shadowBlur = 12;

  // Fill highlight
  ctx.fillStyle = "rgba(234, 179, 8, 0.12)";
  ctx.fillRect(px, py, gridSize, gridSize);

  // Gold border
  ctx.strokeStyle = "rgba(234, 179, 8, 0.5)";
  ctx.lineWidth = 2;
  ctx.strokeRect(px, py, gridSize, gridSize);
  ctx.restore();

  // Corner accents (premium touch)
  const cornerSize = 4;
  ctx.strokeStyle = "rgba(234, 179, 8, 0.6)";
  ctx.lineWidth = 1.5;
  // Top-left
  ctx.beginPath();
  ctx.moveTo(px, py + cornerSize);
  ctx.lineTo(px, py);
  ctx.lineTo(px + cornerSize, py);
  ctx.stroke();
  // Top-right
  ctx.beginPath();
  ctx.moveTo(px + gridSize - cornerSize, py);
  ctx.lineTo(px + gridSize, py);
  ctx.lineTo(px + gridSize, py + cornerSize);
  ctx.stroke();
  // Bottom-left
  ctx.beginPath();
  ctx.moveTo(px, py + gridSize - cornerSize);
  ctx.lineTo(px, py + gridSize);
  ctx.lineTo(px + cornerSize, py + gridSize);
  ctx.stroke();
  // Bottom-right
  ctx.beginPath();
  ctx.moveTo(px + gridSize - cornerSize, py + gridSize);
  ctx.lineTo(px + gridSize, py + gridSize);
  ctx.lineTo(px + gridSize, py + gridSize - cornerSize);
  ctx.stroke();
}

/**
 * Draw a drag trail line from origin to current ghost position.
 */
export function drawDragTrail(
  ctx: CanvasRenderingContext2D,
  originGridX: number,
  originGridY: number,
  ghostGridX: number,
  ghostGridY: number,
  gridSize: number
): void {
  const ox = originGridX * gridSize + gridSize / 2;
  const oy = originGridY * gridSize + gridSize / 2;
  const gx = ghostGridX * gridSize + gridSize / 2;
  const gy = ghostGridY * gridSize + gridSize / 2;

  ctx.save();
  ctx.setLineDash([3, 4]);
  ctx.strokeStyle = "rgba(234, 179, 8, 0.25)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(ox, oy);
  ctx.lineTo(gx, gy);
  ctx.stroke();
  ctx.restore();
}

/**
 * Draw the ghost token at the current grid position.
 * Uses the token's color with reduced opacity and a gold glow.
 */
export function drawGhostToken(
  ctx: CanvasRenderingContext2D,
  color: string,
  gridX: number,
  gridY: number,
  gridSize: number,
  sizeMultiplier: number = 1,
  label: string = ""
): void {
  const cx = gridX * gridSize + gridSize / 2;
  const cy = gridY * gridSize + gridSize / 2;
  const radius = sizeMultiplier * gridSize * 0.4;

  // Outer glow
  ctx.save();
  ctx.shadowColor = "rgba(234, 179, 8, 0.15)";
  ctx.shadowBlur = 16;

  // Semi-transparent fill
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = hexToRgba(color, 0.3);
  ctx.fill();

  // Gold dashed border
  ctx.setLineDash([2, 3]);
  ctx.strokeStyle = "rgba(234, 179, 8, 0.35)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();

  // Label below ghost
  if (label) {
    ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
    ctx.font = `bold ${Math.max(8, gridSize * 0.15)}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(label, cx, cy + radius + 4);
  }
}

/**
 * Draw a coordinate readout near the ghost token showing the grid destination.
 */
export function drawCoordinateReadout(
  ctx: CanvasRenderingContext2D,
  gridX: number,
  gridY: number,
  gridSize: number
): void {
  const cx = gridX * gridSize + gridSize / 2;
  const cy = gridY * gridSize + gridSize / 2;
  const radius = gridSize * 0.4;

  const text = `(${gridX}, ${gridY})`;

  ctx.save();
  ctx.font = `10px monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";

  // Background pill
  const metrics = ctx.measureText(text);
  const pillW = metrics.width + 8;
  const pillH = 16;
  const pillX = cx - pillW / 2;
  const pillY = cy - radius - 22;

  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  ctx.beginPath();
  ctx.roundRect(pillX, pillY, pillW, pillH, 3);
  ctx.fill();

  ctx.fillStyle = "rgba(234, 179, 8, 0.7)";
  ctx.fillText(text, cx, pillY + pillH - 3);
  ctx.restore();
}

// ── Helpers ──────────────────────────────────────────────

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
