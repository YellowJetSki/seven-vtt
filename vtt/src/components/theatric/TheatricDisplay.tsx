/**
 * STᚱ VTT — Theatric Display (Premium Cinematic)
 *
 * Pure cinematic canvas renderer for the player-facing monitor/TV.
 * Zero chrome — no grid, no HUD, no DM elements by default.
 * Optional grid overlay toggled via parent TheatricPage.
 * Optimized for 4K displays with HiDPI canvas scaling.
 */

import { useRef } from "react";
import { useTheatricCanvas } from "./useTheatricCanvas";
import type { BattleMap, MapToken } from "@/types";

interface TheatricDisplayProps {
  mapData: BattleMap;
  tokens: MapToken[];
  showGrid?: boolean;
}

export default function TheatricDisplay({ mapData, tokens, showGrid = false }: TheatricDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useTheatricCanvas(canvasRef, containerRef, mapData, tokens, showGrid);

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden bg-[#0a0b12]">
      <canvas ref={canvasRef} className="block w-full h-full" style={{ imageRendering: "auto" }} />
    </div>
  );
}
