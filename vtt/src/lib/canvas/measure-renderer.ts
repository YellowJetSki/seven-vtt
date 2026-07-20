/**
 * STᚱ VTT — Measurement/Ruler Renderer (Premium)
 *
 * Canvas rendering for the DM measurement tool (ruler).
 * DMs click-and-drag to measure distances between two points on the grid.
 *
 * Features:
 *   - Ruler line: Gold dashed line from origin to current cursor position.
 *   - Distance readout: Shows exact grid distance in 5ft units (D&D 5e).
 *   - Grid snap: Both endpoints snap to grid cell centers.
 *   - Distance breakdown: Shows grid units + feet (e.g., "6 cells | 30 ft").
 *   - Measurement markers: Small tick marks at each cell interval.
 *   - Angle indicator: Shows direction angle from origin.
 *   - Multiple measurements: Previous measurements persist as faint lines
 *     with distance labels until cleared.
 *
 * Usage:
 *   1. DM clicks "Ruler" tool in the toolbar
 *   2. DM clicks on grid to set origin point
 *   3. DM drags/releases to set destination → distance displayed
 *   4. Measurement persists on canvas until cleared
 *
 * Cycle 24 (Premium Battlemap Overhaul):
 *   - Ruler/measurement tool for grid distance calculation
 *   - D&D 5e distance in 5ft increments
 *   - Persistent measurement annotations
 */

// ── Types ────────────────────────────────────────────────

export interface Measurement {
  id: string;
  originX: number;
  originY: number;
  destX: number;
  destY: number;
  /** Distance in grid cells (center-to-center) */
  gridDistance: number;
  /** Distance in feet (5e: gridDistance × 5) */
  feetDistance: number;
  /** Angle in degrees from origin to dest */
  angle: number;
  /** Whether this is an active (in-progress) measurement */
  isActive: boolean;
}

export interface RulerState {
  /** Whether ruler mode is active */
  rulerMode: boolean;
  /** Origin point of the current measurement (null if not started) */
  originX: number | null;
  originY: number | null;
  /** Current cursor position during drag */
  currentX: number;
  currentY: number;
  /** Whether the user is currently dragging */
  isDragging: boolean;
  /** Previous completed measurements */
  measurements: Measurement[];
}

// ── Helpers ──────────────────────────────────────────────

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16) || 0;
  const g = parseInt(hex.slice(3, 5), 16) || 0;
  const b = parseInt(hex.slice(5, 7), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Calculate Euclidean distance between two grid cells.
 */
export function calcDistance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

/**
 * Calculate angle between two points in degrees.
 */
export function calcAngle(x1: number, y1: number, x2: number, y2: number): number {
  const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);
  return ((angle % 360) + 360) % 360; // Normalize to 0-360
}

// ── Ruler Renderers ─────────────────────────────────────

/**
 * Draw a measurement line with distance readout.
 */
function drawMeasurementLine(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  dx: number,
  dy: number,
  gridDistance: number,
  feetDistance: number,
  angle: number,
  isActive: boolean,
  gridSize: number
): void {
  const px1 = ox * gridSize + gridSize / 2;
  const py1 = oy * gridSize + gridSize / 2;
  const px2 = dx * gridSize + gridSize / 2;
  const py2 = dy * gridSize + gridSize / 2;

  ctx.save();

  const opacity = isActive ? 0.8 : 0.35;

  // ── Main ruler line ──
  ctx.beginPath();
  ctx.moveTo(px1, py1);
  ctx.lineTo(px2, py2);
  ctx.strokeStyle = hexToRgba(isActive ? "#eab308" : "#94a3b8", opacity);
  ctx.lineWidth = isActive ? 1.5 : 1;
  ctx.setLineDash(isActive ? [4, 4] : [2, 4]);
  ctx.shadowColor = hexToRgba(isActive ? "#eab308" : "#94a3b8", opacity * 0.2);
  ctx.shadowBlur = 4;
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.shadowBlur = 0;

  // ── Origin dot ──
  ctx.beginPath();
  ctx.arc(px1, py1, isActive ? 4 : 3, 0, Math.PI * 2);
  ctx.fillStyle = hexToRgba(isActive ? "#eab308" : "#94a3b8", opacity);
  ctx.fill();

  // ── Destination dot ──
  ctx.beginPath();
  ctx.arc(px2, py2, isActive ? 4 : 3, 0, Math.PI * 2);
  ctx.fillStyle = hexToRgba(isActive ? "#eab308" : "#94a3b8", opacity);
  ctx.fill();

  // ── Tick marks at each grid interval ──
  if (gridDistance >= 2) {
    const steps = Math.floor(gridDistance);
    for (let s = 1; s < steps; s++) {
      const t = s / gridDistance;
      const tx = px1 + (px2 - px1) * t;
      const ty = py1 + (py2 - py1) * t;

      // Small tick cross
      ctx.strokeStyle = hexToRgba(isActive ? "#eab308" : "#94a3b8", opacity * 0.4);
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(tx - 2, ty);
      ctx.lineTo(tx + 2, ty);
      ctx.moveTo(tx, ty - 2);
      ctx.lineTo(tx, ty + 2);
      ctx.stroke();
    }
  }

  // ── Distance readout pill ──
  const midX = (px1 + px2) / 2;
  const midY = (py1 + py2) / 2 - 12;

  const label = `${gridDistance.toFixed(1)} cells | ${feetDistance} ft`;
  ctx.font = `${isActive ? 'bold ' : ''}10px monospace`;
  const metrics = ctx.measureText(label);
  const pillW = metrics.width + 10;
  const pillH = 16;
  const pillX = midX - pillW / 2;
  const pillY = midY - pillH / 2;

  // Background pill
  ctx.fillStyle = isActive
    ? "rgba(15, 16, 26, 0.85)"
    : "rgba(15, 16, 26, 0.5)";
  ctx.beginPath();
  ctx.roundRect(pillX, pillY, pillW, pillH, 3);
  ctx.fill();

  // Border
  ctx.strokeStyle = hexToRgba(isActive ? "#eab308" : "#94a3b8", opacity * 0.3);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(pillX, pillY, pillW, pillH, 3);
  ctx.stroke();

  // Text
  ctx.fillStyle = isActive ? "#eab308" : "#94a3b8";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, midX, midY);

  // ── Angle indicator (at origin, small arc) ──
  if (isActive && gridDistance >= 1) {
    const arcRadius = 12;
    const startAngle = 0; // Right (east)
    const endAngle = (angle * Math.PI) / 180;

    ctx.beginPath();
    ctx.arc(px1, py1, arcRadius, 0, endAngle);
    ctx.strokeStyle = hexToRgba("#94a3b8", 0.3);
    ctx.lineWidth = 0.5;
    ctx.stroke();

    const angleLabel = `${Math.round(angle)}°`;
    ctx.fillStyle = hexToRgba("#94a3b8", 0.4);
    ctx.font = "8px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const angleMidAngle = endAngle / 2;
    ctx.fillText(
      angleLabel,
      px1 + Math.cos(angleMidAngle) * (arcRadius + 8),
      py1 + Math.sin(angleMidAngle) * (arcRadius + 8)
    );
  }

  ctx.restore();
}

/**
 * Render all measurements (active + persisted).
 */
export function renderMeasurements(
  ctx: CanvasRenderingContext2D,
  rulerState: RulerState,
  gridSize: number
): void {
  // ── Previous completed measurements ──
  for (const m of rulerState.measurements) {
    if (m.isActive) continue;
    drawMeasurementLine(
      ctx,
      m.originX, m.originY,
      m.destX, m.destY,
      m.gridDistance,
      m.feetDistance,
      m.angle,
      false,
      gridSize
    );
  }

  // ── Active measurement (in progress) ──
  if (rulerState.originX !== null && rulerState.originY !== null && rulerState.isDragging) {
    const gridDist = calcDistance(
      rulerState.originX, rulerState.originY,
      rulerState.currentX, rulerState.currentY
    );
    const feetDist = Math.round(gridDist * 5);
    const angle = calcAngle(
      rulerState.originX, rulerState.originY,
      rulerState.currentX, rulerState.currentY
    );

    drawMeasurementLine(
      ctx,
      rulerState.originX, rulerState.originY,
      rulerState.currentX, rulerState.currentY,
      gridDist,
      feetDist,
      angle,
      true,
      gridSize
    );
  }

  // ── Static origin dot (when not dragging but origin set) ──
  if (rulerState.originX !== null && rulerState.originY !== null && !rulerState.isDragging) {
    const px = rulerState.originX * gridSize + gridSize / 2;
    const py = rulerState.originY * gridSize + gridSize / 2;

    ctx.save();
    ctx.beginPath();
    ctx.arc(px, py, 4, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(234, 179, 8, 0.5)";
    ctx.fill();
    ctx.strokeStyle = "rgba(234, 179, 8, 0.3)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }
}

/**
 * Create a completed measurement from current ruler state.
 */
export function completeMeasurement(rulerState: RulerState): Measurement {
  const gridDist = calcDistance(
    rulerState.originX!, rulerState.originY!,
    rulerState.currentX, rulerState.currentY
  );
  const feetDist = Math.round(gridDist * 5);
  const angle = calcAngle(
    rulerState.originX!, rulerState.originY!,
    rulerState.currentX, rulerState.currentY
  );

  return {
    id: `measure_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    originX: rulerState.originX!,
    originY: rulerState.originY!,
    destX: rulerState.currentX,
    destY: rulerState.currentY,
    gridDistance: gridDist,
    feetDistance: feetDist,
    angle,
    isActive: false,
  };
}

/**
 * Snap a pixel coordinate to the nearest grid cell.
 */
export function snapToGrid(pixelX: number, pixelY: number, gridSize: number): { gridX: number; gridY: number } {
  return {
    gridX: Math.round(pixelX / gridSize),
    gridY: Math.round(pixelY / gridSize),
  };
}
