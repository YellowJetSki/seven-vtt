import { useState } from "react";
import type { WallSegment } from "@/types";

interface WallEditorProps {
  walls: WallSegment[];
  onAddWall: (wall: WallSegment) => void;
  onRemoveWall: (id: string) => void;
  onToggleDoorState: (id: string, state: "open" | "closed" | "locked") => void;
}

export default function WallEditor({
  walls,
  onAddWall,
  onRemoveWall,
  onToggleDoorState,
}: WallEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"wall" | "door" | "window">("wall");

  const getWallTypeIcon = (wall: WallSegment) => {
    if (wall.isDoor) return "🚪";
    if (wall.isWindow) return "🪟";
    return "🧱";
  };

  const getDoorStateIcon = (state?: string) => {
    switch (state) {
      case "open": return "🔓 Open";
      case "locked": return "🔒 Locked";
      default: return "🚪 Closed";
    }
  };

  return (
    <div className="space-y-3">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 rounded-lg bg-surface-800/60 border border-surface-600/30 text-xs text-surface-300 hover:bg-surface-700 transition-colors flex items-center justify-between"
      >
        <span>🧱 Wall Editor ({walls.length})</span>
        <span className={`transform transition-transform ${isOpen ? "rotate-180" : ""}`}>▼</span>
      </button>

      {isOpen && (
        <div className="space-y-3 p-3 rounded-lg bg-surface-800/40 border border-surface-700/30">
          {/* Mode Selector */}
          <div className="grid grid-cols-3 gap-1">
            {[
              { value: "wall" as const, label: "🧱 Wall", desc: "Blocks sight & movement" },
              { value: "door" as const, label: "🚪 Door", desc: "Toggleable passage" },
              { value: "window" as const, label: "🪟 Window", desc: "See-through barrier" },
            ].map((item) => (
              <button
                key={item.value}
                onClick={() => setMode(item.value)}
                className={`p-2 rounded-lg text-[10px] transition-all ${
                  mode === item.value
                    ? "bg-accent-600/30 border border-accent-500/30 text-accent-200"
                    : "bg-surface-800/60 text-surface-400 hover:bg-surface-700"
                }`}
              >
                <div className="font-medium">{item.label}</div>
                <div className="text-[8px] opacity-60 mt-0.5">{item.desc}</div>
              </button>
            ))}
          </div>

          <p className="text-[10px] text-surface-500 italic">
            Click two grid cells to place a {mode} between them.
          </p>

          {/* Active Walls List */}
          {walls.length > 0 && (
            <div className="space-y-1 mt-2">
              <label className="text-[10px] uppercase tracking-widest text-surface-500 font-black">
                Active Walls
              </label>
              {walls.map((wall) => (
                <div
                  key={wall.id}
                  className="flex items-center justify-between px-2 py-1.5 rounded bg-surface-800/60"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span>{getWallTypeIcon(wall)}</span>
                    <span className="text-[10px] text-surface-300 truncate">
                      ({Math.round(wall.x1)},{Math.round(wall.y1)}) → ({Math.round(wall.x2)},{Math.round(wall.y2)})
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {wall.isDoor && (
                      <button
                        onClick={() => {
                          const nextState = wall.doorState === "open" ? "closed" : wall.doorState === "closed" ? "locked" : "open";
                          onToggleDoorState(wall.id, nextState);
                        }}
                        className="text-[9px] px-1.5 py-0.5 rounded bg-surface-700/50 text-surface-400 hover:text-surface-200 transition-colors"
                        aria-label={`Toggle door state`}
                      >
                        {getDoorStateIcon(wall.doorState)}
                      </button>
                    )}
                    <button
                      onClick={() => onRemoveWall(wall.id)}
                      className="text-warrior-400 hover:text-warrior-300 text-xs transition-colors"
                      aria-label={`Remove wall ${wall.id}`}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
