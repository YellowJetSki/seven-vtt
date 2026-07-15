import { useState, useMemo, useCallback } from "react";
import type { BattleMap, FogZone } from "@/types";

interface FogOfWarLayerProps {
  map: BattleMap;
  isGmView: boolean;
  cellWidth: number;
  cellHeight: number;
}

const PLAYER_VISION_RADIUS = 8;
const DARKVISION_RADIUS = 12;
const TORCH_RADIUS = 6;

export function FogOfWarLayer({ map, isGmView, cellWidth, cellHeight }: FogOfWarLayerProps) {
  const [visionMode, setVisionMode] = useState<"normal" | "darkvision" | "torch">("normal");

  const playerTokens = useMemo(() => {
    return map.tokens.filter((t) => t.type === "player" && t.visible);
  }, [map.tokens]);

  const visionMaskId = `fog-vision-${map.id.replace(/[^a-zA-Z0-9]/g, "_")}`;
  const visionRadius = visionMode === "darkvision" ? DARKVISION_RADIUS : visionMode === "torch" ? TORCH_RADIUS : PLAYER_VISION_RADIUS;

  if (isGmView || playerTokens.length === 0) return null;

  return (
    <>
      <div className="absolute top-2 right-2 z-20 flex gap-1">
        {(["normal", "darkvision", "torch"] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => setVisionMode(mode)}
            className={`rounded px-1.5 py-0.5 text-[9px] font-medium transition-all ${
              visionMode === mode
                ? "bg-accent-600 text-white"
                : "bg-black/50 text-surface-300 hover:bg-black/70"
            }`}
          >
            {mode === "normal" ? "sight" : mode === "darkvision" ? "dark" : "torch"}
          </button>
        ))}
      </div>

      <svg
        className="absolute inset-0 pointer-events-none z-10"
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid meet"
        style={{ position: "absolute", top: 0, left: 0 }}
      >
        <defs>
          <mask id={visionMaskId}>
            <rect width="100%" height="100%" fill="white" />
            {playerTokens.map((token) => {
              const r = visionRadius * cellWidth;
              const cx = token.x * cellWidth + (token.size * cellWidth) / 2;
              const cy = token.y * cellHeight + (token.size * cellHeight) / 2;
              return (
                <circle key={`vision-${token.id}`} cx={cx} cy={cy} r={r} fill="black" />
              );
            })}
            {map.fogOfWar.map((fog) => (
              <rect
                key={fog.id}
                x={fog.x * cellWidth}
                y={fog.y * cellHeight}
                width={fog.width * cellWidth}
                height={fog.height * cellHeight}
                fill="black"
              />
            ))}
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(0, 0, 0, 0.75)" mask={`url(#${visionMaskId})`} className="transition-opacity duration-500" />
        {playerTokens.map((token) => {
          const r = visionRadius * cellWidth;
          const cx = token.x * cellWidth + (token.size * cellWidth) / 2;
          const cy = token.y * cellHeight + (token.size * cellHeight) / 2;
          return (
            <circle
              key={`glow-${token.id}`}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke="rgba(168, 85, 247, 0.25)"
              strokeWidth={3}
              mask={`url(#${visionMaskId})`}
            />
          );
        })}
      </svg>
    </>
  );
}

export function FogOfWarControls({
  map,
  onUpdate,
  isGmView,
}: {
  map: BattleMap;
  onUpdate: (updates: Partial<BattleMap>) => void;
  isGmView: boolean;
}) {
  const [newRevealLabel, setNewRevealLabel] = useState("");
  const [newRevealX, setNewRevealX] = useState(0);
  const [newRevealY, setNewRevealY] = useState(0);
  const [newRevealW, setNewRevealW] = useState(4);
  const [newRevealH, setNewRevealH] = useState(4);

  const handleAddReveal = useCallback(() => {
    const reveal: FogZone = {
      id: `fog_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      x: newRevealX,
      y: newRevealY,
      width: newRevealW,
      height: newRevealH,
      label: newRevealLabel || undefined,
    };
    onUpdate({ fogOfWar: [...map.fogOfWar, reveal] });
    setNewRevealX(0);
    setNewRevealY(0);
    setNewRevealW(4);
    setNewRevealH(4);
    setNewRevealLabel("");
  }, [map.fogOfWar, newRevealLabel, newRevealX, newRevealY, newRevealW, newRevealH, onUpdate]);

  const handleRemoveReveal = useCallback((id: string) => {
    onUpdate({ fogOfWar: map.fogOfWar.filter((f) => f.id !== id) });
  }, [map.fogOfWar, onUpdate]);

  if (!isGmView) return null;

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-surface-400">Fog Reveal Zones</h4>
      {map.fogOfWar.length === 0 ? (
        <p className="text-xs text-surface-500">No reveal zones. Add one below.</p>
      ) : (
        <div className="max-h-40 space-y-1 overflow-y-auto">
          {map.fogOfWar.map((fog) => (
            <div key={fog.id} className="flex items-center justify-between rounded bg-surface-800 px-3 py-1.5">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[10px] text-surface-500">rect</span>
                <span className="text-xs text-surface-300 truncate">
                  {fog.label ?? `Zone (${fog.x},${fog.y})`}
                </span>
                <span className="text-[10px] text-surface-500">{fog.width}x{fog.height}</span>
              </div>
              <button onClick={() => handleRemoveReveal(fog.id)} className="text-[10px] text-warrior-400 hover:text-warrior-300 shrink-0">x</button>
            </div>
          ))}
        </div>
      )}
      <div className="border-t border-surface-700 pt-3">
        <p className="mb-2 text-[10px] font-medium text-surface-500">Add Reveal Zone</p>
        <div className="flex gap-2 mb-2">
          <input value={newRevealLabel} onChange={(e) => setNewRevealLabel(e.target.value)} placeholder="Room label" className="flex-1 rounded-lg border border-surface-700 bg-surface-800 px-2.5 py-1.5 text-xs text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none" />
        </div>
        <div className="grid grid-cols-4 gap-2 mb-2">
          <div>
            <label className="block text-[9px] text-surface-500">X</label>
            <input type="number" min={0} value={newRevealX} onChange={(e) => setNewRevealX(parseInt(e.target.value) || 0)} className="w-full rounded border border-surface-700 bg-surface-800 px-1.5 py-1 text-xs text-surface-100 text-center" />
          </div>
          <div>
            <label className="block text-[9px] text-surface-500">Y</label>
            <input type="number" min={0} value={newRevealY} onChange={(e) => setNewRevealY(parseInt(e.target.value) || 0)} className="w-full rounded border border-surface-700 bg-surface-800 px-1.5 py-1 text-xs text-surface-100 text-center" />
          </div>
          <div>
            <label className="block text-[9px] text-surface-500">W</label>
            <input type="number" min={1} value={newRevealW} onChange={(e) => setNewRevealW(parseInt(e.target.value) || 1)} className="w-full rounded border border-surface-700 bg-surface-800 px-1.5 py-1 text-xs text-surface-100 text-center" />
          </div>
          <div>
            <label className="block text-[9px] text-surface-500">H</label>
            <input type="number" min={1} value={newRevealH} onChange={(e) => setNewRevealH(parseInt(e.target.value) || 1)} className="w-full rounded border border-surface-700 bg-surface-800 px-1.5 py-1 text-xs text-surface-100 text-center" />
          </div>
        </div>
        <button onClick={handleAddReveal} className="w-full rounded-lg bg-accent-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-accent-500 transition-colors">+ Add Reveal Zone</button>
      </div>
    </div>
  );
}
