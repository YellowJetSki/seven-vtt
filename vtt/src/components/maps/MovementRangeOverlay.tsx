import { useMemo } from "react";
import type { MapToken } from "@/types";

interface MovementRangeOverlayProps {
  token: MapToken;
  gridWidth: number;
  gridHeight: number;
  movementSpeed: number; // in feet
  dashMultiplier?: number; // 1 = normal, 2 = dash
  cellSize?: number; // feet per cell (default 5)
}

/**
 * Visualizes movement range and dash range on the battle map.
 * Highlights reachable cells with a color gradient:
 *   - Green: normal movement range
 *   - Yellow: dash range (double movement)
 */
export function MovementRangeOverlay({
  token,
  gridWidth,
  gridHeight,
  movementSpeed,
  dashMultiplier = 1,
  cellSize = 5,
}: MovementRangeOverlayProps) {
  const cells = useMemo(() => {
    const totalCells = Math.floor((movementSpeed * dashMultiplier) / cellSize);
    const reachable: { x: number; y: number; isDash: boolean }[] = [];

    for (let dx = -totalCells; dx <= totalCells; dx++) {
      for (let dy = -totalCells; dy <= totalCells; dy++) {
        const dist = Math.abs(dx) + Math.abs(dy);
        if (dist === 0) continue; // skip origin
        if (dist > totalCells) continue;

        const x = token.x + dx;
        const y = token.y + dy;
        if (x < 0 || x >= gridWidth || y < 0 || y >= gridHeight) continue;

        const normalRange = Math.floor(movementSpeed / cellSize);
        reachable.push({ x, y, isDash: dist > normalRange });
      }
    }
    return reachable;
  }, [token.x, token.y, token.size, gridWidth, gridHeight, movementSpeed, dashMultiplier, cellSize]);

  return (
    <>
      {cells.map((cell) => (
        <div
          key={`mv-${cell.x}-${cell.y}`}
          className="absolute pointer-events-none z-5"
          style={{
            left: `${(cell.x / gridWidth) * 100}%`,
            top: `${(cell.y / gridHeight) * 100}%`,
            width: `${(100 / gridWidth)}%`,
            height: `${(100 / gridHeight)}%`,
            backgroundColor: cell.isDash
              ? "rgba(250, 204, 21, 0.15)" // yellow for dash
              : "rgba(34, 197, 94, 0.2)",  // green for normal
            border: `1px solid ${cell.isDash ? "rgba(250, 204, 21, 0.3)" : "rgba(34, 197, 94, 0.35)"}`,
          }}
        />
      ))}
    </>
  );
}
