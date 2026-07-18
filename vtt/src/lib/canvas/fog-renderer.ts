import type { WallSegment } from "@/types";
import { compositeLights } from "./light-compositor";
import type { LightSource } from "@/types";

export function applyFogOfWar(
  ctx: CanvasRenderingContext2D,
  w: number, h: number, size: number,
  visible: Set<string>,
  explored: Set<string>
): void {
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) {
      const key = `${x},${y}`;
      if (explored.has(key) && !visible.has(key)) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
        ctx.fillRect(x * size, y * size, size, size);
      } else if (!explored.has(key)) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.95)";
        ctx.fillRect(x * size, y * size, size, size);
      }
    }
  }
}

export function applyDynamicLighting(
  ctx: CanvasRenderingContext2D,
  w: number, h: number, size: number,
  lights: LightSource[],
  walls: WallSegment[]
): void {
  const imageData = ctx.getImageData(0, 0, w * size, h * size);
  const data = imageData.data;

  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) {
      const px = x * size + size / 2;
      const py = y * size + size / 2;
      const idx = (Math.floor(py) * w * size + Math.floor(px)) * 4;
      const light = compositeLights(x, y, lights, walls, size);

      if (light.intensity > 0) {
        data[idx] = Math.round(data[idx] * 0.3 + light.r * 0.7);
        data[idx + 1] = Math.round(data[idx + 1] * 0.3 + light.g * 0.7);
        data[idx + 2] = Math.round(data[idx + 2] * 0.3 + light.b * 0.7);
        const dimFactor = 0.3 + light.intensity * 0.7;
        data[idx] = Math.round(data[idx] * dimFactor);
        data[idx + 1] = Math.round(data[idx + 1] * dimFactor);
        data[idx + 2] = Math.round(data[idx + 2] * dimFactor);
      } else {
        data[idx] = Math.round(data[idx] * 0.15);
        data[idx + 1] = Math.round(data[idx + 1] * 0.15);
        data[idx + 2] = Math.round(data[idx + 2] * 0.15);
      }
    }
  }
  ctx.putImageData(imageData, 0, 0);
}
