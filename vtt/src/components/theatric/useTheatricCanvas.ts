/**
 * STᚱ VTT — useTheatricCanvas (Premium Cinematic)
 *
 * Hook managing the cinematic Canvas rendering loop for the Theatric Display.
 * Supports optional grid overlay, ambient particle field, and gold-tinted
 * cinematic overlays. Handles HiDPI scaling, ResizeObserver, and
 * requestAnimationFrame loop at 60fps.
 */

import { useRef, useEffect, useCallback } from "react";
import { useTheatricStore } from "@/stores/theatricStore";
import {
  drawVignette,
  drawLetterbox,
  drawGrid,
  drawParticles,
  type Particle,
} from "./canvasUtils";
import { drawToken } from "./canvasTokens";
import type { BattleMap, MapToken } from "@/types";

export function useTheatricCanvas(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  containerRef: React.RefObject<HTMLDivElement | null>,
  mapData: BattleMap,
  tokens: MapToken[],
  showGrid: boolean
) {
  const camera = useTheatricStore((s) => s.camera);
  const showLabels = useTheatricStore((s) => s.showLabels);
  const mapImage = useRef<HTMLImageElement | null>(null);
  const particles = useRef<Particle[]>([]);
  const frameRef = useRef(0);

  // Initialize ambient gold particles
  useEffect(() => {
    particles.current = Array.from({ length: 60 }, () => ({
      x: Math.random() * 2000 - 1000,
      y: Math.random() * 1500 - 750,
      vx: (Math.random() - 0.5) * 0.15,
      vy: (Math.random() - 0.5) * 0.15 - 0.05,
      size: Math.random() * 2 + 0.5,
      alpha: Math.random() * 0.25 + 0.05,
      speed: Math.random() * 0.3 + 0.1,
    }));
  }, []);

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
    return () => {
      mapImage.current = null;
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

    // Handle HiDPI — only re-allocate when size changes
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Deep cinematic background
    const bgGrad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.7);
    bgGrad.addColorStop(0, "#12141f");
    bgGrad.addColorStop(0.5, "#0a0b12");
    bgGrad.addColorStop(1, "#06070a");
    ctx.fillStyle = bgGrad;
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

      // Optional grid overlay — gold-tinted, subtle
      if (showGrid) {
        drawGrid(ctx, mapData.gridWidth, mapData.gridHeight, mapData.gridSize);
      }
    }

    // Draw visible tokens with shadow pass
    const visibleTokens = tokens.filter((t) => t.visible);
    visibleTokens.forEach((t) => drawToken(ctx, t, mapData.gridSize, showLabels));
    ctx.restore();

    // Gold ambient particles (in screen space, behind vignette)
    const p = particles.current;
    frameRef.current++;
    p.forEach((pt) => {
      pt.x += pt.vx + Math.sin(frameRef.current * 0.01 + pt.y * 0.01) * 0.05;
      pt.y += pt.vy;
      if (pt.y < -800) { pt.y = 800; pt.x = Math.random() * 2000 - 1000; }
      if (pt.x < -1200) pt.x = 1200;
      if (pt.x > 1200) pt.x = -1200;
    });
    drawParticles(ctx, p, camera.zoom, cx, cy);

    // Cinematic overlays
    drawVignette(ctx, w, h);
    drawLetterbox(ctx, w, h);
  }, [camera, mapData, tokens, showLabels, showGrid]);

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

  // Animation loop — 60fps with RAF
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
