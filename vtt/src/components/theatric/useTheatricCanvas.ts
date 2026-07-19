/**
 * STᚱ VTT — useTheatricCanvas
 *
 * Hook managing the cinematic Canvas rendering loop for the Theatric Display.
 * Uses pure utility functions from canvasUtils for drawing operations.
 * Handles fullscreen resize, camera transforms, token rendering,
 * and cinematic overlays (vignette, letterbox).
 */

import { useRef, useEffect, useCallback } from "react";
import { useTheatricStore } from "@/stores/theatricStore";
import { drawVignette, drawLetterbox, drawToken } from "./canvasUtils";
import type { BattleMap, MapToken } from "@/types";

export function useTheatricCanvas(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  containerRef: React.RefObject<HTMLDivElement | null>,
  mapData: BattleMap,
  tokens: MapToken[]
) {
  const camera = useTheatricStore((s) => s.camera);
  const showLabels = useTheatricStore((s) => s.showLabels);
  const mapImage = useRef<HTMLImageElement | null>(null);

  // Load map image
  useEffect(() => {
    if (!mapData.imageUrl) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = mapData.imageUrl;
    img.onload = () => {
      mapImage.current = img;
      renderFrame();
    };
  }, [mapData.imageUrl]);

  // Render frame function
  const renderFrame = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const w = rect.width;
    const h = rect.height;

    // Handle HiDPI
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

    // Camera transform
    const cx = w / 2;
    const cy = h / 2;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.rotate(camera.rotation);
    ctx.translate(-cx + camera.x, -cy + camera.y);

    // Draw map image
    if (mapImage.current) {
      ctx.drawImage(
        mapImage.current,
        0,
        0,
        mapData.gridWidth * mapData.gridSize,
        mapData.gridHeight * mapData.gridSize
      );
    }

    // Draw visible tokens
    tokens
      .filter((t) => t.visible)
      .forEach((t) => drawToken(ctx, t, mapData.gridSize, showLabels));
    ctx.restore();

    // Cinematic overlays
    drawVignette(ctx, w, h);
    drawLetterbox(ctx, w, h);
  }, [camera, mapData, tokens, showLabels]);

  // Render on dependency change
  useEffect(() => {
    renderFrame();
  }, [renderFrame]);

  // Resize observer
  useEffect(() => {
    const obs = new ResizeObserver(() => renderFrame());
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, [renderFrame]);

  // Animation loop
  useEffect(() => {
    let running = true;
    const animate = () => {
      if (!running) return;
      renderFrame();
      requestAnimationFrame(animate);
    };
    animate();
    return () => {
      running = false;
    };
  }, [renderFrame]);
}
