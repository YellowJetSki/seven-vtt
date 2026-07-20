/**
 * STᚱ VTT — useTheatricCanvas (Premium Cinematic) [FIXED]
 *
 * Hook managing the cinematic Canvas rendering loop for the Theatric Display.
 * Supports optional grid overlay, ambient particle field, and gold-tinted
 * cinematic overlays. Handles HiDPI scaling, ResizeObserver, and
 * requestAnimationFrame loop at 60fps.
 *
 * FIXED (Sprint 16): RAF loop accumulation — now uses stable ref-based
 * render callback to prevent concurrent RAF loops on dependency changes.
 * FIXED: ResizeObserver now stable — only mounted once, disconnects on unmount.
 * FIXED: HiDPI canvas reallocation only triggers on actual size changes.
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
  const rafRef = useRef<number>(0);
  const obsRef = useRef<ResizeObserver | null>(null);

  // Sticky refs to prevent stale closures in RAF loop
  const cameraRef = useRef(camera);
  const mapDataRef = useRef(mapData);
  const tokensRef = useRef(tokens);
  const showLabelsRef = useRef(showLabels);
  const showGridRef = useRef(showGrid);

  // Keep refs in sync with reactive values
  cameraRef.current = camera;
  mapDataRef.current = mapData;
  tokensRef.current = tokens;
  showLabelsRef.current = showLabels;
  showGridRef.current = showGrid;

  // Initialize ambient gold particles — stable (runs once)
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

  // Load map image — stable by mapData.imageUrl (runs when URL changes)
  useEffect(() => {
    if (!mapData.imageUrl) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = mapData.imageUrl;
    img.onload = () => {
      mapImage.current = img;
      renderOnce();
    };
    img.onerror = () => {
      // Silently fail — canvas will show dark background
      mapImage.current = null;
    };
    return () => {
      mapImage.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapData.imageUrl]);

  // ── Single stable render function (reads from refs) ──
  const renderOnce = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const w = rect.width;
    const h = rect.height;

    // Only re-allocate HiDPI canvas when size actually changes
    const targetW = Math.round(w * dpr);
    const targetH = Math.round(h * dpr);
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      canvas.width = targetW;
      canvas.height = targetH;
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
    const cam = cameraRef.current;
    const cx = w / 2;
    const cy = h / 2;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(cam.zoom, cam.zoom);
    ctx.rotate(cam.rotation);
    ctx.translate(-cx + cam.x, -cy + cam.y);

    // Draw map image
    const mData = mapDataRef.current;
    if (mapImage.current) {
      ctx.drawImage(
        mapImage.current,
        0,
        0,
        mData.gridWidth * mData.gridSize,
        mData.gridHeight * mData.gridSize
      );

      // Optional grid overlay — gold-tinted, subtle
      if (showGridRef.current) {
        drawGrid(ctx, mData.gridWidth, mData.gridHeight, mData.gridSize);
      }
    }

    // Draw visible tokens with shadow pass
    const visibleTokens = tokensRef.current.filter((t) => t.visible);
    visibleTokens.forEach((t) => drawToken(ctx, t, mData.gridSize, showLabelsRef.current));
    ctx.restore();

    // Gold ambient particles (in screen space, behind vignette)
    const p = particles.current;
    frameRef.current++;
    const fIdx = frameRef.current;
    p.forEach((pt) => {
      pt.x += pt.vx + Math.sin(fIdx * 0.01 + pt.y * 0.01) * 0.05;
      pt.y += pt.vy;
      if (pt.y < -800) { pt.y = 800; pt.x = Math.random() * 2000 - 1000; }
      if (pt.x < -1200) pt.x = 1200;
      if (pt.x > 1200) pt.x = -1200;
    });
    drawParticles(ctx, p, cam.zoom, cx, cy);

    // Cinematic overlays
    drawVignette(ctx, w, h);
    drawLetterbox(ctx, w, h);
  }, []); // ← stable reference: no dependencies, reads from refs

  // ── Single RAF loop — stable, runs once on mount ──
  useEffect(() => {
    let running = true;
    const animate = () => {
      if (!running) return;
      renderOnce();
      rafRef.current = requestAnimationFrame(animate);
    };
    animate();
    return () => {
      running = false;
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }
    };
  }, [renderOnce]); // renderOnce is stable (empty deps)

  // ── Single ResizeObserver — stable, runs once on mount ──
  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new ResizeObserver(() => renderOnce());
    obs.observe(containerRef.current);
    obsRef.current = obs;
    return () => {
      obs.disconnect();
      obsRef.current = null;
    };
  }, [renderOnce]); // renderOnce is stable (empty deps)
}
