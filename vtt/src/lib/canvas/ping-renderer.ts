/**
 * STᚱ VTT — Ping/Ripple Animation Renderer (Premium)
 *
 * Canvas rendering for DM ping/ripple animations on the battle map.
 * DMs can click to ping a location, creating an expanding gold ring
 * that fades out — communicating points of interest to players.
 *
 * Features:
 *   - Ping ring: Expanding gold circle that radiates outward from click point.
 *   - Ping trail: Subtle vertical trail that rises from the ping point.
 *   - Multiple simultaneous pings: Each ping is tracked independently.
 *   - Ping lifetime: ~2 seconds (expand + fade).
 *   - Layer: Rendered as a separate canvas pass on top of everything.
 *
 * Architecture:
 *   DM clicks → ping added to activePings[] array with timestamp
 *   RAF loop → each ping: age = now - timestamp
 *     age < 2s → draw expanding ring + trail
 *     age ≥ 2s → remove from array
 *
 * Cycle 24 (Premium Battlemap Overhaul):
 *   - Ping/ripple animation system for DM communication
 *   - Expand + fadeout animation curve
 *   - Supports keyboard shortcut (hold Alt + click) for quick pings
 */

// ── Types ────────────────────────────────────────────────

export interface PingEffect {
  /** Unique ID for this ping */
  id: string;
  /** Grid X position */
  gridX: number;
  /** Grid Y position */
  gridY: number;
  /** Timestamp when ping was created */
  createdAt: number;
  /** Color of the ping ring (default: gold #eab308) */
  color: string;
}

export interface PingState {
  /** Active ping effects */
  activePings: PingEffect[];
  /** Whether ping mode is currently active */
  pingMode: boolean;
}

// ── Helpers ──────────────────────────────────────────────

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16) || 0;
  const g = parseInt(hex.slice(3, 5), 16) || 0;
  const b = parseInt(hex.slice(5, 7), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ── Ping Renderer ───────────────────────────────────────

/**
 * Render a single ping effect: expanding ring + vertical trail.
 * Ping duration is ~2 seconds with ease-out expansion and opacity fade.
 *
 * Animation curve:
 *   t=0.0 → ring at 0px radius, full opacity
 *   t=0.5 → ring at 50% max radius, 60% opacity
 *   t=1.0 → ring at 100% max radius, 0% opacity  (fade out complete)
 *   t=1.0 → trail disappears
 */
function drawPing(
  ctx: CanvasRenderingContext2D,
  ping: PingEffect,
  now: number,
  gridSize: number
): void {
  const age = (now - ping.createdAt) / 1000; // seconds
  const duration = 2.0; // total lifetime

  if (age > duration) return; // expired

  const progress = age / duration; // 0 → 1

  // ── Ease-out curve (quadratic) ──
  const easeOut = 1 - Math.pow(1 - progress, 2);

  const maxRadius = gridSize * 2.5;
  const currentRadius = maxRadius * easeOut;

  // Opacity: starts at 0.7, fades to 0
  const opacity = Math.max(0, 0.7 * (1 - easeOut));

  const px = ping.gridX * gridSize + gridSize / 2;
  const py = ping.gridY * gridSize + gridSize / 2;

  ctx.save();

  // ── Outer ring ──
  ctx.beginPath();
  ctx.arc(px, py, currentRadius, 0, Math.PI * 2);
  ctx.strokeStyle = hexToRgba(ping.color, opacity);
  ctx.lineWidth = 2;
  ctx.shadowColor = hexToRgba(ping.color, opacity * 0.4);
  ctx.shadowBlur = 12;
  ctx.stroke();

  // ── Inner ring (half radius, brighter) ──
  if (currentRadius > gridSize * 0.5) {
    ctx.beginPath();
    ctx.arc(px, py, currentRadius * 0.4, 0, Math.PI * 2);
    ctx.strokeStyle = hexToRgba(ping.color, opacity * 0.5);
    ctx.lineWidth = 1;
    ctx.shadowBlur = 0;
    ctx.stroke();
  }

  // ── Trailing vertical beam ──
  const beamHeight = Math.min(gridSize * 1.5, currentRadius * 0.8);
  if (beamHeight > 2) {
    ctx.beginPath();
    ctx.moveTo(px, py - currentRadius);
    ctx.lineTo(px, py - currentRadius - beamHeight);
    ctx.strokeStyle = hexToRgba(ping.color, opacity * 0.3);
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 3]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // ── Center dot ──
  if (opacity > 0.1) {
    ctx.beginPath();
    ctx.arc(px, py, 3, 0, Math.PI * 2);
    ctx.fillStyle = hexToRgba(ping.color, opacity * 0.8);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Render all active ping effects.
 * Expired pings (age > duration) are removed after rendering.
 */
export function renderPings(
  ctx: CanvasRenderingContext2D,
  pings: PingEffect[],
  gridSize: number
): PingEffect[] {
  const now = Date.now();

  for (const ping of pings) {
    drawPing(ctx, ping, now, gridSize);
  }

  // Return only non-expired pings
  return pings.filter((p) => (now - p.createdAt) / 1000 < 2.0);
}

/**
 * Create a new ping effect at grid coordinates.
 */
export function createPing(
  gridX: number,
  gridY: number,
  color: string = "#eab308"
): PingEffect {
  return {
    id: `ping_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    gridX,
    gridY,
    createdAt: Date.now(),
    color,
  };
}
