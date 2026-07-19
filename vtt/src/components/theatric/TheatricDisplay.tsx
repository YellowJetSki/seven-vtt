/**
 * STᚱ VTT — Theatric Display
 *
 * A pure cinematic canvas renderer for the player-facing monitor/TV.
 * Deliberately NO grid overlay, NO HUD, NO UI elements.
 * Optimized for large-screen 4K displays at cinematic 16:9 aspect ratio.
 */

import { useRef } from "react";
import { useTheatricCanvas } from "./useTheatricCanvas";
import type { BattleMap, MapToken } from "@/types";

interface TheatricDisplayProps {
  mapData: BattleMap;
  tokens: MapToken[];
}

export default function TheatricDisplay({ mapData, tokens }: TheatricDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useTheatricCanvas(canvasRef, containerRef, mapData, tokens);

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden bg-[#0a0b12]">
      <canvas ref={canvasRef} className="block w-full h-full" style={{ imageRendering: "auto" }} />
    </div>
  );
}
