/**
 * STᚱ VTT — Theatric Display
 *
 * A pure cinematic canvas renderer for the player-facing monitor/TV.
 * Deliberately NO grid overlay, NO HUD, NO UI elements — just the
 * battle map, tokens, lighting, and fog of war rendered beautifully.
 *
 * Architecture: Reads from theatricStore and campaignStore.
 * Optimized for large-screen 4K displays at cinematic 16:9 aspect ratio.
 */

import { useRef, useEffect, useCallback } from "react";
import { useTheatricStore } from "@/stores/theatricStore";
import { useCampaignStore } from "@/stores/campaignStore";
import type { BattleMap, MapToken, LightSource } from "@/types";

export default function TheatricDisplay({
  mapData,
  tokens,
  lights = [],
}: {
  mapData: BattleMap;
  tokens: MapToken[];
  lights?: LightSource[];
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);
  const camera = useTheatricStore((s) => s.camera);
  const showLabels = useTheatricStore((s) => s.showLabels);

  // Load the map image
  const mapImageRef = useRef<HTMLImageElement | null>(null);
  const tokenRefs = useRef<Map<string, { img: HTMLImageElement | null; color: string }>>(new Map());

  useEffect(() => {
    if (!mapData.imageUrl) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = mapData.imageUrl;
    img.onload = () => {
      mapImageRef.current = img;
      renderFrame();
    };
  }, [mapData.imageUrl]);

  // Preload token images
  useEffect(() => {
    tokens.forEach((token) => {
      if (token.imageUrl && !tokenRefs.current.has(token.id)) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = token.imageUrl;
        img.onload = () => {
          tokenRefs.current.set(token.id, { img, color: token.color });
          renderFrame();
        };
      }
    });
  }, [tokens]);

  const renderFrame = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // Match display size to container
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

    // Clear with dark cinematic background
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "#0a0b12";
    ctx.fillRect(0, 0, w, h);

    // Apply camera transform
    const cx = w / 2;
    const cy = h / 2;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(camera.zoom, camera.zoom);
    ctx.rotate(camera.rotation);
    ctx.translate(-cx + camera.x, -cy + camera.y);

    // Draw the map image
    if (mapImageRef.current) {
      const img = mapImageRef.current;
      const mapW = mapData.gridWidth * mapData.gridSize;
      const mapH = mapData.gridHeight * mapData.gridSize;
      ctx.drawImage(img, 0, 0, mapW, mapH);
    }

    // Draw tokens (no grid, just tokens)
    tokens
      .filter((t) => t.visible)
      .forEach((token) => {
        const tx = token.x * mapData.gridSize + mapData.gridSize / 2;
        const ty = token.y * mapData.gridSize + mapData.gridSize / 2;
        const ts = token.size * mapData.gridSize * 0.85;

        // Token shadow
        ctx.save();
        ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
        ctx.shadowBlur = ts * 0.3;
        ctx.shadowOffsetY = ts * 0.05;

        // Token circle
        ctx.beginPath();
        ctx.arc(tx, ty, ts / 2, 0, Math.PI * 2);
        ctx.fillStyle = token.color || "#505270";
        ctx.fill();

        // Inner glow
        const gradient = ctx.createRadialGradient(
          tx - ts * 0.1, ty - ts * 0.1, 0,
          tx, ty, ts / 2
        );
        gradient.addColorStop(0, "rgba(255, 255, 255, 0.15)");
        gradient.addColorStop(1, "rgba(0, 0, 0, 0.2)");
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.restore();

        // Token icon or initial
        ctx.fillStyle = "#ffffff";
        ctx.font = `bold ${ts * 0.45}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(token.icon || token.label[0]?.toUpperCase() || "?", tx, ty + 1);

        // Token label (if enabled)
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

        // HP bar (if token has HP)
        if (token.hp) {
          const barW = ts * 0.8;
          const barH = 4;
          const barX = tx - barW / 2;
          const barY = ty + ts / 2 + 4;
          const ratio = Math.max(0, token.hp.current / Math.max(1, token.hp.max));

          ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
          ctx.fillRect(barX, barY, barW, barH);

          const hpColor = ratio > 0.5 ? "#22c55e" : ratio > 0.25 ? "#f59e0b" : "#ef4444";
          ctx.fillStyle = hpColor;
          ctx.fillRect(barX, barY, barW * ratio, barH);
        }
      });

    ctx.restore();

    // Vignette overlay (cinematic effect)
    const vignette = ctx.createRadialGradient(
      w / 2, h / 2, w * 0.3,
      w / 2, h / 2, w * 0.8
    );
    vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
    vignette.addColorStop(1, "rgba(0, 0, 0, 0.4)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);

    // Letterbox bars (cinematic 21:9 feel)
    const barHeight = h * 0.06;
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(0, 0, w, barHeight);
    ctx.fillRect(0, h - barHeight, w, barHeight);
  }, [camera, mapData, tokens, showLabels, lights]);

  // Re-render on store changes
  useEffect(() => {
    renderFrame();
  }, [renderFrame]);

  // Resize observer
  useEffect(() => {
    const obs = new ResizeObserver(() => {
      renderFrame();
    });
    if (containerRef.current) {
      obs.observe(containerRef.current);
    }
    return () => obs.disconnect();
  }, [renderFrame]);

  // Animation loop for dynamic lights
  useEffect(() => {
    let running = true;
    const animate = () => {
      if (!running) return;
      renderFrame();
      animFrameRef.current = requestAnimationFrame(animate);
    };
    animate();
    return () => {
      running = false;
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [renderFrame]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden bg-[#0a0b12]"
      style={{ width: "100%", height: "100%" }}
    >
      <canvas
        ref={canvasRef}
        className="block w-full h-full"
        style={{ imageRendering: "auto" }}
      />
    </div>
  );
}
