export function drawGrid(
  ctx: CanvasRenderingContext2D,
  w: number, h: number, size: number,
  color: string, opacity: number
): void {
  ctx.strokeStyle = color;
  ctx.globalAlpha = opacity;
  ctx.lineWidth = 1;
  for (let x = 0; x <= w; x++) {
    ctx.beginPath();
    ctx.moveTo(x * size, 0);
    ctx.lineTo(x * size, h * size);
    ctx.stroke();
  }
  for (let y = 0; y <= h; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * size);
    ctx.lineTo(w * size, y * size);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}
