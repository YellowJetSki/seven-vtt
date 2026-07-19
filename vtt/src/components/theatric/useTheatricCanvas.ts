import { useRef, useEffect, useCallback } from "react";
import { useTheatricStore } from "@/stores/theatricStore";
import type { BattleMap, MapToken, LightSource } from "@/types";

function drawVignette(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const vignette = ctx.createRadialGradient(w / 2, h / 2, w * 0.3, w / 2, h / 2, w * 0.8);
  vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
  vignette.addColorStop(1, "rgba(0, 0, 0, 0.4)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);
}

function drawLetterbox(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const barHeight = h * 0.06;
  ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
  ctx.fillRect(0, 0, w, barHeight);
  ctx.fillRect(0, h - barHeight, w, barHeight);
}

function drawToken(ctx: CanvasRenderingContext2D, token: MapToken, gridSize: number, showLabels: boolean) {
  const tx = token.x * gridSize + gridSize / 2;
  const ty = token.y * gridSize + gridSize / 2;
  const ts = token.size * gridSize * 0.85;

  // Shadow
  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
  ctx.shadowBlur = ts * 0.3;
  ctx.shadowOffsetY = ts * 0.05;

  // Circle
  ctx.beginPath();
  ctx.arc(tx, ty, ts / 2, 0, Math.PI * 2);
  ctx.fillStyle = token.color || "#505270";
  ctx.fill();

  // Inner glow
  const gradient = ctx.createRadialGradient(tx - ts * 0.1, ty - ts * 0.1, 0, tx, ty, ts / 2);
  gradient.addColorStop(0, "rgba(255, 255, 255, 0.15)");
  gradient.addColorStop(1, "rgba(0, 0, 0, 0.2)");
  ctx.fillStyle = gradient;
  ctx.fill();
  ctx.restore();

  // Icon
  ctx.fillStyle = "#ffffff";
  ctx.font = `bold ${ts * 0.45}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(token.icon || token.label[0]?.toUpperCase() || "?", tx, ty + 1);

  // Label
  if (showLabels && token.label) {
    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
    ctx.shadowBlur = 4;
    ctx.fillStyle = "#f0f0f0";
    ctx.font = `bold ${ts * 0.3}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText(token.label, tx, ty - ts / 2 - 4);
    ctx.restore();
  }

  // HP bar
  if (token.hp) {
    const barW = ts * 0.8;
    const barH = 4;
    const barX = tx - barW / 2;
    const barY = ty + ts / 2 + 4;
    const ratio = Math.max(0, token.hp.current / Math.max(1, token.hp.max));
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = ratio > 0.5 ? "#22c55e" : ratio > 0.25 ? "#f59e0b" : "#ef4444";
    ctx.fillRect(barX, barY, barW * ratio, barH);
  }
}

export function useTheatricCanvas(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  containerRef: React.RefObject<HTMLDivElement | null>,
  mapData: BattleMap,
  tokens: MapToken[],
) {
  const camera = useTheatricStore((s) => s.camera);
  const showLabels = useTheatricStore((s) => s.showLabels);
  const mapImage = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!mapData.imageUrl) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = mapData.imageUrl;
    img.onload = () => { mapImage.current = img; renderFrame(); };
  }, [mapData.imageUrl]);

  const renderFrame = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const w = rect.width;
    const h = rect.height;

    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "#0a0b12";
    ctx.fillRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.rotate(camera.rotation);
    ctx.translate(-cx + camera.x, -cy + camera.y);

    // Map image
    if (mapImage.current) {
      ctx.drawImage(mapImage.current, 0, 0, mapData.gridWidth * mapData.gridSize, mapData.gridHeight * mapData.gridSize);
    }

    // Tokens
    tokens.filter((t) => t.visible).forEach((t) => drawToken(ctx, t, mapData.gridSize, showLabels));
    ctx.restore();

    // Cinematic overlays
    drawVignette(ctx, w, h);
    drawLetterbox(ctx, w, h);
  }, [camera, mapData, tokens, showLabels]);

  useEffect(() => { renderFrame(); }, [renderFrame]);

  useEffect(() => {
    const obs = new ResizeObserver(() => renderFrame());
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, [renderFrame]);

  useEffect(() => {
    let running = true;
    const animate = () => {
      if (!running) return;
      renderFrame();
      requestAnimationFrame(animate);
    };
    animate();
    return () => { running = false; };
  }, [renderFrame]);
}
