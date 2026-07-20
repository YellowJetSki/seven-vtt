/**
 * STᚱ VTT — Token Visual State Overlays (Premium)
 *
 * Premium visual state overlays for map tokens:
 *   - Bloodied: A cracked/fractured red glow ring that pulses around the token
 *     when HP is at or below 50%. Deep crimson glow + animated fracture arcs.
 *   - Restrained: Chain links rendered around the token border, with metallic
 *     silver chains and locked padlock indicator.
 *   - Concentrating: Soft violet halo + diamond icon above the token.
 *   - Prone: Rotated/skewed token with a small "zzz" indicator.
 *   - Invisible: Translucent outline with shimmer effect.
 *   - Stunned: Spiral/starburst overlay + stars circling the token.
 *
 * Each overlay is a pure canvas rendering function that accepts the token's
 * grid position and the animation time for pulse effects.
 *
 * Usage: These are called from token-renderer.ts AFTER the base token is drawn.
 * Each function operates on the same translated/zoomed canvas context.
 *
 * Cycle 24 (Premium Battlemap Overhaul):
 *   - Visual state overlays for common 5e conditions
 *   - Bloodied state: cracks + red pulse ring (HP ≤ 50%)
 *   - Restrained state: chain links + padlock
 *   - Concentrating state: violet halo with diamond icon
 *   - Prone state: Zzz indicator + flat shadow
 *   - Stunned state: starburst + circling stars
 *   - Invisible state: shimmer outline
 */

import type { MapToken } from "@/types";

// ── Helpers ──────────────────────────────────────────────

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16) || 0;
  const g = parseInt(hex.slice(3, 5), 16) || 0;
  const b = parseInt(hex.slice(5, 7), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ── Bloodied State ──────────────────────────────────────

/**
 * Draw a bloodied overlay on a token.
 * Shows deep red cracked glow when HP ≤ 50% of max.
 * Renders: pulsing red ring + fracture arcs + blood drip indicator.
 */
export function drawBloodiedOverlay(
  ctx: CanvasRenderingContext2D,
  gridX: number,
  gridY: number,
  gridSize: number,
  hpRatio: number,
  time: number
): void {
  const cx = gridX * gridSize + gridSize / 2;
  const cy = gridY * gridSize + gridSize / 2;
  const radius = gridSize * 0.4;

  // Only show when bloodied (≤ 50% HP)
  if (hpRatio > 0.5) return;

  const intensity = Math.max(0, 1 - hpRatio * 2); // 0 at 50%, 1 at 0%
  const pulse = Math.sin(time * 2.5) * 0.15 + 0.35;

  ctx.save();

  // ── Pulsing red outer ring ──
  const ringRadius = radius + 6 + Math.sin(time * 3) * 2;
  ctx.beginPath();
  ctx.arc(cx, cy, ringRadius, 0, Math.PI * 2);
  ctx.strokeStyle = hexToRgba("#dc2626", pulse * intensity);
  ctx.lineWidth = 2;
  ctx.shadowColor = hexToRgba("#dc2626", pulse * intensity * 0.5);
  ctx.shadowBlur = 8;
  ctx.stroke();

  // ── Inner glow ring ──
  const innerRing = radius * 0.85;
  ctx.beginPath();
  ctx.arc(cx, cy, innerRing, 0, Math.PI * 2);
  ctx.shadowBlur = 0;
  ctx.strokeStyle = hexToRgba("#ef4444", 0.15 * intensity);
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // ── Fracture arcs (crack lines) ──
  const crackCount = 3 + Math.floor(intensity * 3);
  ctx.strokeStyle = hexToRgba("#dc2626", 0.3 * intensity);
  ctx.lineWidth = 1;
  ctx.shadowBlur = 0;

  for (let i = 0; i < crackCount; i++) {
    const angle = (i / crackCount) * Math.PI * 2 + time * 0.5;
    const startR = radius * 0.6;
    const endR = radius + 4;

    ctx.beginPath();
    // Fracture line (zigzag from inner to outer)
    const segments = 3;
    let cx2 = cx + Math.cos(angle) * startR;
    let cy2 = cy + Math.sin(angle) * startR;

    for (let s = 1; s <= segments; s++) {
      const t = s / segments;
      const r = startR + (endR - startR) * t;
      const a = angle + (s % 2 === 0 ? 0.15 : -0.15);
      const nx = cx + Math.cos(a) * r;
      const ny = cy + Math.sin(a) * r;
      ctx.lineTo(nx, ny);
      cx2 = nx;
      cy2 = ny;
    }
    ctx.stroke();
  }

  // ── Blood drip indicator (bottom) ──
  if (intensity > 0.5) {
    const dripY = cy + radius + 5;
    const dripPhase = Math.sin(time * 4 + gridX) * 0.3;

    ctx.fillStyle = hexToRgba("#dc2626", 0.4);
    ctx.beginPath();
    ctx.arc(cx + dripPhase, dripY, 2, 0, Math.PI * 2);
    ctx.fill();

    // Second drip
    const drip2X = cx + 3 + Math.sin(time * 3.5) * 2;
    const drip2Y = cy + radius + 8;
    ctx.beginPath();
    ctx.arc(drip2X, drip2Y, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

// ── Restrained State ────────────────────────────────────

/**
 * Draw a restrained overlay on a token.
 * Renders: chain links arranged around the token border + padlock icon.
 */
export function drawRestrainedOverlay(
  ctx: CanvasRenderingContext2D,
  gridX: number,
  gridY: number,
  gridSize: number,
  time: number
): void {
  const cx = gridX * gridSize + gridSize / 2;
  const cy = gridY * gridSize + gridSize / 2;
  const radius = gridSize * 0.4;

  ctx.save();

  // ── Chain links around the token ──
  const chainCount = 6;
  const chainRadius = radius + 4;
  const linkSize = 3;

  for (let i = 0; i < chainCount; i++) {
    const angle = (i / chainCount) * Math.PI * 2 + Math.sin(time * 0.5) * 0.05;
    const lx = cx + Math.cos(angle) * chainRadius;
    const ly = cy + Math.sin(angle) * chainRadius;

    // Chain link (rounded rectangle rotated by angle)
    ctx.save();
    ctx.translate(lx, ly);
    ctx.rotate(angle + Math.PI / 4);
    ctx.shadowColor = "rgba(200, 200, 200, 0.1)";
    ctx.shadowBlur = 2;

    ctx.strokeStyle = "#9ca3af";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(-linkSize, -linkSize / 2, linkSize * 2, linkSize, 1);
    ctx.stroke();

    // Link highlight
    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.roundRect(-linkSize + 0.5, -linkSize / 2 + 0.5, linkSize * 2 - 1, linkSize - 1, 1);
    ctx.stroke();

    ctx.restore();
  }

  // ── Connecting diagonal chains (criss-cross pattern) ──
  ctx.strokeStyle = "rgba(156, 163, 175, 0.2)";
  ctx.lineWidth = 0.5;
  ctx.setLineDash([2, 3]);

  // Top-left to bottom-right
  ctx.beginPath();
  ctx.moveTo(cx - chainRadius - 2, cy - chainRadius - 2);
  ctx.lineTo(cx + chainRadius + 2, cy + chainRadius + 2);
  ctx.stroke();

  // Top-right to bottom-left
  ctx.beginPath();
  ctx.moveTo(cx + chainRadius + 2, cy - chainRadius - 2);
  ctx.lineTo(cx - chainRadius - 2, cy + chainRadius + 2);
  ctx.stroke();

  ctx.setLineDash([]);

  // ── Padlock icon at bottom-right ──
  const lockX = cx + radius * 0.6;
  const lockY = cy + radius * 0.6;
  const lockSize = 4;

  ctx.strokeStyle = "#fbbf24";
  ctx.lineWidth = 1.5;
  ctx.shadowColor = "rgba(251, 191, 36, 0.2)";
  ctx.shadowBlur = 4;

  // Lock body
  ctx.beginPath();
  ctx.roundRect(lockX - lockSize / 2, lockY, lockSize, lockSize * 0.7, 1);
  ctx.stroke();

  // Lock shackle (arc)
  ctx.beginPath();
  ctx.arc(lockX, lockY, lockSize / 2, Math.PI, 0);
  ctx.stroke();

  // Keyhole
  ctx.fillStyle = "#fbbf24";
  ctx.beginPath();
  ctx.arc(lockX, lockY + lockSize * 0.3, 1, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// ── Concentrating State ─────────────────────────────────

/**
 * Draw a concentrating overlay on a token.
 * Renders: violet pulsing halo + diamond icon above token.
 */
export function drawConcentratingOverlay(
  ctx: CanvasRenderingContext2D,
  gridX: number,
  gridY: number,
  gridSize: number,
  time: number
): void {
  const cx = gridX * gridSize + gridSize / 2;
  const cy = gridY * gridSize + gridSize / 2;
  const radius = gridSize * 0.4;
  const pulse = Math.sin(time * 2) * 0.15 + 0.45;

  ctx.save();

  // ── Violet halo ──
  const haloRadius = radius + 8 + Math.sin(time * 1.5) * 2;
  ctx.beginPath();
  ctx.arc(cx, cy, haloRadius, 0, Math.PI * 2);
  ctx.strokeStyle = hexToRgba("#a78bfa", pulse);
  ctx.lineWidth = 1.5;
  ctx.shadowColor = hexToRgba("#a78bfa", pulse * 0.3);
  ctx.shadowBlur = 6;
  ctx.stroke();

  // ── Diamond icon above token ──
  const diamondY = cy - radius - 8 - Math.sin(time * 2) * 1.5;
  const diamondSize = 3;

  ctx.shadowBlur = 0;
  ctx.fillStyle = hexToRgba("#a78bfa", pulse + 0.2);

  ctx.beginPath();
  ctx.moveTo(cx, diamondY - diamondSize);
  ctx.lineTo(cx + diamondSize, diamondY);
  ctx.lineTo(cx, diamondY + diamondSize);
  ctx.lineTo(cx - diamondSize, diamondY);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

// ── Prone State ─────────────────────────────────────────

/**
 * Draw a prone overlay on a token.
 * Renders: flat shadow + "zzz" indicator.
 */
export function drawProneOverlay(
  ctx: CanvasRenderingContext2D,
  gridX: number,
  gridY: number,
  gridSize: number,
  time: number
): void {
  const cx = gridX * gridSize + gridSize / 2;
  const cy = gridY * gridSize + gridSize / 2;
  const radius = gridSize * 0.4;

  ctx.save();

  // ── Flat shadow (oval) ──
  ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
  ctx.beginPath();
  ctx.ellipse(cx, cy + radius * 0.6, radius * 0.5, radius * 0.08, 0, 0, Math.PI * 2);
  ctx.fill();

  // ── Zzz floating indicator ──
  const zzzY = cy - radius - 6 - (Math.sin(time * 2) * 4);
  const zzzOpacity = 0.5 + Math.sin(time * 2.5) * 0.3;

  ctx.fillStyle = hexToRgba("#a1a1aa", zzzOpacity);
  ctx.font = `bold 10px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillText("😴", cx, zzzY);

  ctx.restore();
}

// ── Stunned State ───────────────────────────────────────

/**
 * Draw a stunned overlay on a token.
 * Renders: starburst lines + circling stars.
 */
export function drawStunnedOverlay(
  ctx: CanvasRenderingContext2D,
  gridX: number,
  gridY: number,
  gridSize: number,
  time: number
): void {
  const cx = gridX * gridSize + gridSize / 2;
  const cy = gridY * gridSize + gridSize / 2;
  const radius = gridSize * 0.4;

  ctx.save();

  // ── Starburst lines ──
  const burstRadius = radius + 10 + Math.sin(time * 2) * 3;
  const rayCount = 8;
  const rayAngle = (Math.PI * 2) / rayCount;

  ctx.strokeStyle = hexToRgba("#ec4899", 0.3);
  ctx.lineWidth = 1;

  for (let i = 0; i < rayCount; i++) {
    const angle = rayAngle * i + time * 0.5;
    const x1 = cx + Math.cos(angle) * radius;
    const y1 = cy + Math.sin(angle) * radius;
    const x2 = cx + Math.cos(angle) * burstRadius;
    const y2 = cy + Math.sin(angle) * burstRadius;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  // ── Circling stars ──
  const starCount = 3;
  const starRadius = radius + 14;

  for (let i = 0; i < starCount; i++) {
    const angle = (i / starCount) * Math.PI * 2 + time;
    const sx = cx + Math.cos(angle) * starRadius;
    const sy = cy + Math.sin(angle) * starRadius;

    ctx.fillStyle = hexToRgba("#ec4899", 0.5 + Math.sin(time * 3 + i) * 0.3);
    ctx.font = "8px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("✦", sx, sy);
  }

  ctx.restore();
}

// ── Invisible State ─────────────────────────────────────

/**
 * Draw an invisible overlay on a token.
 * Renders: translucent outline with shimmer effect.
 */
export function drawInvisibleOverlay(
  ctx: CanvasRenderingContext2D,
  gridX: number,
  gridY: number,
  gridSize: number,
  time: number
): void {
  const cx = gridX * gridSize + gridSize / 2;
  const cy = gridY * gridSize + gridSize / 2;
  const radius = gridSize * 0.4;
  const shimmer = Math.sin(time * 1.5) * 0.3 + 0.4;

  ctx.save();

  // ── Translucent outline ──
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.setLineDash([3, 4]);
  ctx.strokeStyle = hexToRgba("#8b5cf6", shimmer);
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.setLineDash([]);

  // ── Shimmer highlight arc ──
  const shimmerAngle = time * 0.8;
  ctx.beginPath();
  ctx.arc(cx, cy, radius - 2, shimmerAngle, shimmerAngle + 0.8);
  ctx.strokeStyle = hexToRgba("#c4b5fd", shimmer * 0.5);
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.restore();
}

// ── Main Visual State Renderer ──────────────────────────

export interface VisualStateOverlayState {
  /** Whether this token has hp data and is bloodied (≤ 50%) */
  isBloodied: boolean;
  hpRatio: number;
  /** Whether this token has a "restrained" status marker */
  isRestrained: boolean;
  /** Whether this token has a "concentrating" status marker */
  isConcentrating: boolean;
  /** Whether this token has a "prone" status marker */
  isProne: boolean;
  /** Whether this token has a "stunned" status marker */
  isStunned: boolean;
  /** Whether this token has an "invisible" status marker */
  isInvisible: boolean;
}

/**
 * Build visual state overlay state from a token's data.
 */
export function buildVisualStateOverlayState(token: MapToken): VisualStateOverlayState {
  const markers = token.statusMarkers?.map((m) => m.toLowerCase()) ?? [];
  const hp = token.hp;
  const hpRatio = hp ? hp.current / hp.max : 1;

  return {
    isBloodied: !!hp && hpRatio <= 0.5,
    hpRatio,
    isRestrained: markers.includes("restrained"),
    isConcentrating: markers.includes("concentrating"),
    isProne: markers.includes("prone"),
    isStunned: markers.includes("stunned"),
    isInvisible: markers.includes("invisible"),
  };
}

/**
 * Render all applicable visual state overlays for a single token.
 * Called AFTER the base token has been drawn.
 */
export function drawVisualStateOverlays(
  ctx: CanvasRenderingContext2D,
  token: MapToken,
  gridSize: number,
  time: number
): void {
  const state = buildVisualStateOverlayState(token);

  if (state.isBloodied) {
    drawBloodiedOverlay(ctx, token.x, token.y, gridSize, state.hpRatio, time);
  }

  if (state.isRestrained) {
    drawRestrainedOverlay(ctx, token.x, token.y, gridSize, time);
  }

  if (state.isConcentrating) {
    drawConcentratingOverlay(ctx, token.x, token.y, gridSize, time);
  }

  if (state.isProne) {
    drawProneOverlay(ctx, token.x, token.y, gridSize, time);
  }

  if (state.isStunned) {
    drawStunnedOverlay(ctx, token.x, token.y, gridSize, time);
  }

  if (state.isInvisible) {
    drawInvisibleOverlay(ctx, token.x, token.y, gridSize, time);
  }
}
