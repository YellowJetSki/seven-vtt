/**
 * STᚱ VTT — Initiative Overlay Renderer (Premium)
 *
 * Canvas rendering for the initiative turn order bar that's rendered
 * directly on the battle map canvas.
 *
 * Features:
 *   - Active turn indicator: Gold glow ring + animated pulse on current combatant's token
 *   - Turn ribbon: A subtle gold/top "current turn" banner above the active token
 *   - Dead/downed tokens: Red X overlay + reduced opacity
 *   - Wait indicator: Pulsing amber dot on the NEXT token in turn order
 *
 * This is supplementary to the DOM-based InitiativeOverlay component.
 * Rendering happens AFTER tokens so it overlays properly.
 *
 * Cycle 23 (Premium Battlemap Overhaul):
 *   - Initiative & Turn Order rendered directly on canvas
 *   - Active turn token highlighted with animated gold banner
 *   - Next-up token shown with amber pulse indicator
 *   - Dead tokens get red X overlay
 */

import type { CombatEncounter } from "@/types";

// ── Helpers ──────────────────────────────────────────────

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16) || 0;
  const g = parseInt(hex.slice(3, 5), 16) || 0;
  const b = parseInt(hex.slice(5, 7), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ── Turn Banner ─────────────────────────────────────────

/**
 * Draw a gold "current turn" ribbon banner above the active token.
 * Shows "⚔ [Name]'s Turn" or "[Round N] ⚔ [Name]'s Turn".
 */
export function drawTurnBanner(
  ctx: CanvasRenderingContext2D,
  name: string,
  gridX: number,
  gridY: number,
  gridSize: number,
  round: number
): void {
  const cx = gridX * gridSize + gridSize / 2;
  const bannerY = gridY * gridSize - gridSize * 0.15;

  const roundText = round > 0 ? `R${round} · ` : "";
  const label = `${roundText}⚔ ${name}'s Turn`;

  ctx.save();
  ctx.font = `bold ${Math.max(10, gridSize * 0.2)}px sans-serif`;
  const metrics = ctx.measureText(label);
  const pad = 8;
  const bw = metrics.width + pad * 2.5; // extra for the emoji
  const bh = Math.max(18, gridSize * 0.28);
  const bx = cx - bw / 2;
  const by = bannerY - bh;

  // ── Banner background (gold glass) ──
  ctx.shadowColor = "rgba(234, 179, 8, 0.35)";
  ctx.shadowBlur = 12;
  ctx.fillStyle = "rgba(15, 16, 26, 0.85)";
  ctx.beginPath();
  ctx.roundRect(bx, by, bw, bh, 4);
  ctx.fill();

  // ── Gold left accent stripe ──
  ctx.fillStyle = "#eab308";
  ctx.beginPath();
  ctx.roundRect(bx, by, 3, bh, 2);
  ctx.fill();

  // ── Border ──
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgba(234, 179, 8, 0.25)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(bx, by, bw, bh, 4);
  ctx.stroke();

  // ── Text ──
  ctx.fillStyle = "#eab308";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, cx, by + bh / 2);

  ctx.restore();
}

// ── Next-Up Indicator ───────────────────────────────────

/**
 * Draw an amber pulse dot above the next token in initiative order.
 */
export function drawNextUpIndicator(
  ctx: CanvasRenderingContext2D,
  gridX: number,
  gridY: number,
  gridSize: number,
  time: number
): void {
  const cx = gridX * gridSize + gridSize / 2;
  const cy = gridY * gridSize - gridSize * 0.25;

  // Pulsing opacity
  const pulse = Math.sin(time * 2.5) * 0.35 + 0.65;

  ctx.save();
  ctx.shadowColor = `rgba(251, 191, 36, ${pulse * 0.5})`;
  ctx.shadowBlur = 8;

  ctx.beginPath();
  ctx.arc(cx, cy, 4, 0, Math.PI * 2);
  ctx.fillStyle = hexToRgba("#fbbf24", pulse);
  ctx.fill();

  ctx.restore();
}

// ── Dead Marker ─────────────────────────────────────────

/**
 * Draw a red X overlay on dead/downed tokens.
 */
export function drawDeadMarker(
  ctx: CanvasRenderingContext2D,
  gridX: number,
  gridY: number,
  gridSize: number
): void {
  const cx = gridX * gridSize + gridSize / 2;
  const cy = gridY * gridSize + gridSize / 2;
  const size = gridSize * 0.15;

  ctx.save();
  ctx.strokeStyle = "rgba(239, 68, 68, 0.6)";
  ctx.lineWidth = 2;
  ctx.lineCap = "round";

  ctx.beginPath();
  ctx.moveTo(cx - size, cy - size);
  ctx.lineTo(cx + size, cy + size);
  ctx.moveTo(cx + size, cy - size);
  ctx.lineTo(cx - size, cy + size);
  ctx.stroke();

  ctx.restore();
}

// ── Status Effect Chip ──────────────────────────────────

/**
 * Draw a small chip below the token showing active status effects.
 */
export function drawStatusChip(
  ctx: CanvasRenderingContext2D,
  text: string,
  gridX: number,
  gridY: number,
  gridSize: number,
  color: string = "#eab308"
): void {
  const cx = gridX * gridSize + gridSize / 2;
  const cy = gridY * gridSize + gridSize * 0.6;

  ctx.save();
  ctx.font = `bold ${Math.max(7, gridSize * 0.12)}px sans-serif`;
  const metrics = ctx.measureText(text);
  const pad = 4;
  const bw = metrics.width + pad * 2;
  const bh = Math.max(12, gridSize * 0.18);
  const bx = cx - bw / 2;
  const by = cy;

  // Background
  ctx.fillStyle = hexToRgba(color, 0.15);
  ctx.beginPath();
  ctx.roundRect(bx, by, bw, bh, 2);
  ctx.fill();

  // Border
  ctx.strokeStyle = hexToRgba(color, 0.3);
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.roundRect(bx, by, bw, bh, 2);
  ctx.stroke();

  // Text
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, cx, by + bh / 2);

  ctx.restore();
}

// ── Main Initiative Overlay Renderer ────────────────────

export interface InitiativeOverlayState {
  activeEncounter: CombatEncounter | null;
  /** Animation time in seconds */
  time: number;
  /** Whether DM view (shows dead overlays always) */
  dmView: boolean;
}

/**
 * Render all initiative-related overlays on the canvas.
 * Must be called AFTER token rendering so overlays sit on top.
 */
export function renderInitiativeOverlay(
  ctx: CanvasRenderingContext2D,
  tokens: { gridX: number; gridY: number; id: string }[],
  state: InitiativeOverlayState,
  gridSize: number
): void {
  const { activeEncounter, time, dmView } = state;

  if (!activeEncounter || activeEncounter.phase !== "active") return;

  const { combatants, currentCombatantIndex, round } = activeEncounter;
  if (combatants.length === 0) return;

  // Current turn combatant
  const current = combatants[currentCombatantIndex];
  if (!current) return;

  // Find the corresponding token on map
  const currentToken = tokens.find((t) => t.id === current.id);
  if (currentToken) {
    // Draw turn banner above current token
    drawTurnBanner(ctx, current.name, currentToken.gridX, currentToken.gridY, gridSize, round);
  }

  // Next-up indicator
  if (combatants.length > 1) {
    const nextIndex = (currentCombatantIndex + 1) % combatants.length;
    if (nextIndex !== currentCombatantIndex) {
      const next = combatants[nextIndex];
      const nextToken = tokens.find((t) => t.id === next.id);
      if (nextToken && !next.isDead) {
        drawNextUpIndicator(ctx, nextToken.gridX, nextToken.gridY, gridSize, time);
      }
    }
  }

  // Dead/downed markers for all dead combatants
  if (dmView) {
    for (const combatant of combatants) {
      if (!combatant.isDead) continue;
      const deadToken = tokens.find((t) => t.id === combatant.id);
      if (deadToken) {
        drawDeadMarker(ctx, deadToken.gridX, deadToken.gridY, gridSize);
      }
    }
  }

  // Concentration status chips
  for (const combatant of combatants) {
    if (!combatant.isConcentrating) continue;
    const concToken = tokens.find((t) => t.id === combatant.id);
    if (concToken) {
      drawStatusChip(ctx, "🧘 Conc", concToken.gridX, concToken.gridY, gridSize, "#a78bfa");
    }
  }
}
