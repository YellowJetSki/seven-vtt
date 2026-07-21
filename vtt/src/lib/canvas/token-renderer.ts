/**
 * STᚱ VTT — Token Renderer (Premium)
 *
 * Canvas rendering for map tokens with premium visual states:
 *   - Selected token: Gold glow ring + animated pulse
 *   - Current turn token: Enhanced gold glow + pulsing border
 *   - DM-only visibility: Ghosted tokens when in DM view
 *   - HP bars: Color-coded (green/amber/red) with background
 *   - Status markers: Colored dots around the token
 *   - Label rendering with shadow for readability
 *   - Type-based icons inside token circle
 *   - Visual state overlays (Cycle 24): bloodied cracks, restrained chains,
 *     concentrating halo, prone Zzz, stunned starburst, invisible shimmer
 *
 * Cycle 22 Enhancement:
 *   - Ghost token rendering during drag (handled by drag-renderer.ts)
 *   - Enhanced selected state with animated pulse border
 *   - Token type icon integrated into the token circle
 *
 * Cycle 23 Enhancement:
 *   - Current turn token highlighting (gold glow + animated border)
 *   - Active token ID passed via drawTokens for turn highlighting
 *
 * Cycle 24 Enhancement:
 *   - Visual state overlays for common 5e conditions
 *   - Bloodied cracks (HP ≤ 50%), restrained chains, concentrating halo
 *   - Prone Zzz, stunned starburst, invisible shimmer
 *   - drawVisualStateOverlays called after base token rendering
 */

import type { MapToken } from "@/types";
import { drawVisualStateOverlays } from "./restrained-renderer";

// ── Constants ────────────────────────────────────────────

/** Token type → border color mapping */
const TYPE_BORDER: Record<string, string> = {
  player: "#FFD700",
  enemy: "#ff4444",
  npc: "#4ade80",
  custom: "#eab308",
};

/** Token type → icon mapping */
const TYPE_ICON: Record<string, string> = {
  player: "🛡",
  enemy: "👹",
  npc: "🧙",
  custom: "✦",
};

// ── Helpers ──────────────────────────────────────────────

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16) || 0;
  const g = parseInt(hex.slice(3, 5), 16) || 0;
  const b = parseInt(hex.slice(5, 7), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getHpBarColor(ratio: number): string {
  if (ratio > 0.5) return "rgba(68, 204, 68, 0.8)";
  if (ratio > 0.25) return "rgba(255, 170, 0, 0.8)";
  return "rgba(255, 68, 68, 0.8)";
}

// ── Token Renderer ───────────────────────────────────────

export function drawToken(
  ctx: CanvasRenderingContext2D,
  token: MapToken,
  gridSize: number,
  isSelected: boolean = false,
  isDmView: boolean = true,
  time: number = 0,
  isCurrentTurn: boolean = false
): void {
  const tx = token.x * gridSize + gridSize / 2;
  const ty = token.y * gridSize + gridSize / 2;
  const radius = (token.size || 1) * gridSize * 0.4;
  const showGhosted = !token.visible && isDmView;

  ctx.save();

  // ── Outer glow ──
  if (isCurrentTurn) {
    // Enhanced glow for current turn combatant
    const pulse = Math.sin(time * 3) * 0.2 + 0.4;
    ctx.shadowColor = hexToRgba("#eab308", pulse);
    ctx.shadowBlur = 20;
  } else if (isSelected) {
    // Standard selected glow
    const pulse = Math.sin(time * 3) * 0.15 + 0.35;
    ctx.shadowColor = hexToRgba("#FFD700", pulse);
    ctx.shadowBlur = 16;
  } else if (token.type === "player") {
    ctx.shadowColor = hexToRgba("#FFD700", 0.1);
    ctx.shadowBlur = 6;
  }

  // ── Token body ──
  ctx.beginPath();
  ctx.arc(tx, ty, radius, 0, Math.PI * 2);

  if (showGhosted) {
    ctx.fillStyle = hexToRgba(token.color || "#4a9eff", 0.15);
    ctx.fill();
    ctx.strokeStyle = hexToRgba(TYPE_BORDER[token.type] || "#808080", 0.2);
    ctx.lineWidth = 1;
    ctx.stroke();
  } else {
    ctx.fillStyle = token.color || "#4a9eff";
    ctx.fill();

    // Border
    if (isCurrentTurn) {
      ctx.strokeStyle = "#eab308";
      ctx.lineWidth = 3;
    } else if (isSelected) {
      ctx.strokeStyle = "#FFD700";
      ctx.lineWidth = 3;
    } else {
      ctx.strokeStyle = TYPE_BORDER[token.type] || "#808080";
      ctx.lineWidth = 2;
    }
    ctx.stroke();

    // Extra ring for current turn
    if (isCurrentTurn) {
      const ringPulse = Math.sin(time * 4) * 2 + 4;
      ctx.beginPath();
      ctx.arc(tx, ty, radius + ringPulse, 0, Math.PI * 2);
      ctx.strokeStyle = hexToRgba("#eab308", 0.15);
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Token icon
    const icon = token.icon || TYPE_ICON[token.type] || "✦";
    ctx.font = `${radius * 0.7}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#ffffff";
    ctx.fillText(icon, tx, ty + 0.5);
  }

  ctx.restore();

  // ── Label ──
  ctx.save();
  if (!showGhosted) {
    ctx.fillStyle = isCurrentTurn ? "#fde047" : "#ffffff";
    ctx.font = `bold ${Math.max(9, gridSize * 0.18)}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
    ctx.shadowBlur = 4;
    ctx.fillText(token.label, tx, ty - radius - 2);
  }
  ctx.restore();

  // ── HP bar ──
  if (token.hp && !showGhosted) {
    const barWidth = radius * 2;
    const barHeight = 4;
    const barY = ty + radius + 4;
    const hpRatio = Math.max(0, Math.min(1, token.hp.current / token.hp.max));

    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
    ctx.beginPath();
    ctx.roundRect(tx - barWidth / 2, barY, barWidth, barHeight, 2);
    ctx.fill();

    ctx.fillStyle = getHpBarColor(hpRatio);
    ctx.beginPath();
    ctx.roundRect(tx - barWidth / 2, barY, barWidth * hpRatio, barHeight, 2);
    ctx.fill();
    ctx.restore();
  }

  // ── Status markers ──
  if (token.statusMarkers && token.statusMarkers.length > 0 && !showGhosted) {
    const dotRadius = 3;
    const count = Math.min(4, token.statusMarkers.length);
    token.statusMarkers.slice(0, count).forEach((marker, i) => {
      const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
      const dx = Math.cos(angle) * (radius + 7);
      const dy = Math.sin(angle) * (radius + 7);

      let dotColor = "#eab308";
      switch (marker.toLowerCase()) {
        case "poisoned": dotColor = "#22c55e"; break;
        case "paralyzed": dotColor = "#f59e0b"; break;
        case "unconscious": dotColor = "#ef4444"; break;
        case "invisible": dotColor = "#8b5cf6"; break;
        case "concentrating": dotColor = "#eab308"; break;
        case "restrained": dotColor = "#f97316"; break;
        case "prone": dotColor = "#a1a1aa"; break;
        case "stunned": dotColor = "#ec4899"; break;
        case "frightened": dotColor = "#06b6d4"; break;
        case "blinded": dotColor = "#64748b"; break;
        case "charmed": dotColor = "#d946ef"; break;
        default: dotColor = "#eab308";
      }

      ctx.beginPath();
      ctx.arc(tx + dx, ty + dy, dotRadius, 0, Math.PI * 2);
      ctx.fillStyle = dotColor;
      ctx.fill();
      ctx.strokeStyle = "rgba(0, 0, 0, 0.3)";
      ctx.lineWidth = 0.5;
      ctx.stroke();
    });
  }

  // ── Cycle 24: Visual State Overlays ──
  if (!showGhosted) {
    drawVisualStateOverlays(ctx, token, gridSize, time);
  }
}

/**
 * Render all visible tokens on the canvas.
 * Accepts an optional activeTurnTokenId for highlighting the current combatant.
 */
export function drawTokens(
  ctx: CanvasRenderingContext2D,
  tokens: MapToken[],
  gridSize: number,
  dmView: boolean,
  selectedTokenId?: string,
  time: number = 0,
  activeTurnTokenId?: string | null
): void {
  for (const token of tokens) {
    if (!token.visible && !dmView) continue;
    const isCurrentTurn = token.id === activeTurnTokenId;
    drawToken(ctx, token, gridSize, token.id === selectedTokenId, dmView, time, isCurrentTurn);
  }
}

/**
 * Resize and scale the canvas to match its container.
 */
export function setupCanvas(canvas: HTMLCanvasElement, container: HTMLElement): void {
  const resize = () => {
    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
  };
  resize();
  // NOTE: Caller is responsible for resize listener cleanup.
  // The resize listener is managed by the CanvasMapView useEffect to prevent
  // leaked listeners when renderFrame dependencies change.

  const ctx = canvas.getContext("2d");
  if (ctx) {
    const dpr = window.devicePixelRatio || 1;
    ctx.scale(dpr, dpr);
  }
}
