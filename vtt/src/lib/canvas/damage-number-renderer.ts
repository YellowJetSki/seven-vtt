/**
 * STᚱ VTT — Damage Number Renderer
 *
 * Renders animated floating damage/heal numbers on the canvas.
 * Numbers rise upward, scale out slightly, and fade over ~2 seconds.
 *
 * Rendering pipeline:
 *   1. Compute grid position from tokenId + xOffset
 *   2. Compute animation progress (0→1) from createdAt vs now
 *   3. Apply easing: opacity fade + translateY rise + scale pop
 *   4. Draw colored text with drop shadow
 *
 * Color coding:
 *   - damage:  rose-400 (#fb7185)
 *   - heal:    emerald-400 (#34d399)
 *   - temp:    amber-400 (#fbbf24)
 *   - death:   rose-600 (#e11d48)
 *   - crit:    gold (#eab308) with larger font
 *   - kill:    rose-500 + "💀" prefix
 */

import type { DamageNumber } from "@/stores/damageNumberStore";
import type { MapToken } from "@/types";

// ── Color mapping ──
const DAMAGE_TYPE_COLORS: Record<string, string> = {
  fire: "#f97316",    // orange
  cold: "#60a5fa",    // blue
  lightning: "#eab308", // gold
  acid: "#22c55e",    // green
  poison: "#4ade80",  // emerald
  psychic: "#a78bfa", // violet
  necrotic: "#881337", // dark red
  radiant: "#fde047", // bright gold
  force: "#e879f9",   // pink
  thunder: "#38bdf8", // sky
  slashing: "#fb7185", // rose
  piercing: "#fb7185", // rose
  bludgeoning: "#fb7185", // rose
};

function getNumberColor(num: DamageNumber): string {
  // If we have a damage type override, use it
  if (num.type === "damage" && num.damageType && DAMAGE_TYPE_COLORS[num.damageType]) {
    return DAMAGE_TYPE_COLORS[num.damageType];
  }
  // Type-based defaults
  switch (num.type) {
    case "damage": return "#fb7185";       // rose-400
    case "heal": return "#34d399";         // emerald-400
    case "temp": return "#fbbf24";         // amber-400
    case "death": return "#e11d48";        // rose-600
    case "crit": return "#eab308";          // gold
    case "kill": return "#f43f5e";          // rose-500
    default: return "#fb7185";
  }
}

function getNumberPrefix(num: DamageNumber): string {
  switch (num.type) {
    case "kill": return "💀 ";
    case "death": return "✕ ";
    case "crit": return "⚡ ";
    case "heal": return "+";
    case "temp": return "🛡 ";
    default: return "-";
  }
}

function getNumberSize(num: DamageNumber): number {
  switch (num.type) {
    case "crit": return 28;
    case "kill": return 26;
    default: return 22;
  }
}

export interface DamageNumberState {
  /** Active floating damage/heal numbers */
  damageNumbers: DamageNumber[];
}

/**
 * Draw all active floating damage numbers on the canvas.
 * Called from the main renderCanvas pipeline.
 */
export function renderDamageNumbers(
  ctx: CanvasRenderingContext2D,
  numbers: DamageNumber[],
  tokens: MapToken[],
  gridSize: number,
  panX: number,
  panY: number,
  zoom: number,
  time: number
): void {
  const now = Date.now();
  const expired: string[] = [];

  for (const num of numbers) {
    const age = now - num.createdAt;
    const duration = num.duration || 2000;
    const progress = Math.min(1, age / duration);

    // Remove expired
    if (progress >= 1) {
      expired.push(num.id);
      continue;
    }

    // Find token position
    const token = tokens.find((t) => t.id === num.tokenId);
    if (!token) continue;

    // Compute grid position (center of token, with xOffset)
    const tokenCenterX = ((token.x || 0) + 0.5) * gridSize;
    const tokenCenterY = ((token.y || 0) + 0.5) * gridSize;

    // Animation: float up + fade out
    const risePx = -progress * gridSize * 0.6; // Rise ~0.6 grid cells
    const baseAlpha = Math.max(0, 1 - progress * 1.2); // Fade faster at end
    const scale = 1 + progress * 0.15; // Slight scale out

    const color = getNumberColor(num);
    const prefix = getNumberPrefix(num);
    const absValue = Math.abs(num.value);
    const displayText = `${prefix}${absValue}`;
    const fontSize = getNumberSize(num);
    const xOffsetPx = num.xOffset * gridSize;

    ctx.save();
    ctx.translate(
      tokenCenterX + xOffsetPx,
      tokenCenterY + risePx - gridSize * 0.3
    );
    ctx.scale(scale, scale);

    // Text styling
    ctx.font = `bold ${fontSize}px 'JetBrains Mono', 'Fira Code', monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Drop shadow (glow effect)
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;
    ctx.fillStyle = color;
    ctx.globalAlpha = baseAlpha;

    // Draw main text
    ctx.fillText(displayText, 0, 0);

    // Shadow pass (larger blur for glow)
    ctx.shadowBlur = 20;
    ctx.globalAlpha = baseAlpha * 0.3;
    ctx.fillText(displayText, 0, 0);

    ctx.restore();
  }
}

/**
 * Cleans up expired damage numbers from the store.
 */
export function cleanExpiredNumbers(numbers: DamageNumber[]): string[] {
  const now = Date.now();
  const expired: string[] = [];
  for (const num of numbers) {
    const age = now - num.createdAt;
    if (age >= (num.duration || 2000)) {
      expired.push(num.id);
    }
  }
  return expired;
}
