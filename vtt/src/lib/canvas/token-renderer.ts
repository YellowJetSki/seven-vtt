import type { MapToken } from "@/types";

export function drawToken(
  ctx: CanvasRenderingContext2D,
  token: MapToken,
  gridSize: number,
  isSelected: boolean = false
): void {
  const tx = token.x * gridSize + gridSize / 2;
  const ty = token.y * gridSize + gridSize / 2;
  const radius = (token.size || 1) * gridSize * 0.4;

  ctx.beginPath();
  ctx.arc(tx, ty, radius, 0, Math.PI * 2);
  ctx.fillStyle = token.color || "#4a9eff";
  ctx.fill();

  ctx.strokeStyle = isSelected ? "#FFD700" : token.type === "player" ? "#FFD700" : "#ff4444";
  ctx.lineWidth = isSelected ? 3 : 2;
  ctx.stroke();

  ctx.fillStyle = "#ffffff";
  ctx.font = `bold ${Math.max(10, gridSize * 0.2)}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillText(token.label, tx, ty - radius - 2);

  if (token.hp) {
    const barWidth = radius * 2;
    const barHeight = 4;
    const barY = ty + radius + 4;
    const hpRatio = Math.max(0, token.hp.current / token.hp.max);
    ctx.fillStyle = "#333333";
    ctx.fillRect(tx - barWidth / 2, barY, barWidth, barHeight);
    const hpColor = hpRatio > 0.5 ? "#44cc44" : hpRatio > 0.25 ? "#ffaa00" : "#ff4444";
    ctx.fillStyle = hpColor;
    ctx.fillRect(tx - barWidth / 2, barY, barWidth * hpRatio, barHeight);
  }

  if (token.statusMarkers && token.statusMarkers.length > 0) {
    const dotRadius = 3;
    token.statusMarkers.slice(0, 4).forEach((_marker, i) => {
      const angle = (i / Math.min(4, token.statusMarkers!.length)) * Math.PI * 2 - Math.PI / 2;
      const dx = Math.cos(angle) * (radius + 8);
      const dy = Math.sin(angle) * (radius + 8);
      ctx.beginPath();
      ctx.arc(tx + dx, ty + dy, dotRadius, 0, Math.PI * 2);
      ctx.fillStyle = "#ff4444";
      ctx.fill();
    });
  }
}

export function drawTokens(
  ctx: CanvasRenderingContext2D,
  tokens: MapToken[],
  gridSize: number,
  dmView: boolean,
  selectedTokenId?: string
): void {
  for (const token of tokens) {
    if (!token.visible && !dmView) continue;
    drawToken(ctx, token, gridSize, token.id === selectedTokenId);
  }
}

export function setupCanvas(canvas: HTMLCanvasElement, container: HTMLElement): void {
  const resize = () => {
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
  };
  resize();
  window.addEventListener("resize", resize);
  const ctx = canvas.getContext("2d");
  if (ctx) ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
}
