/* ── TokenInspector ────────────────────────────────────────────
 * Inspector panel for a selected token showing stats, movement,
 * HP, visibility controls, and theatric button.
 * ─────────────────────────────────────────────────────────────── */

import type { MapToken } from "@/types";

interface Props {
  token: MapToken;
  showMovement: boolean;
  dashMode: boolean;
  normalRange: number;
  dashRange: number;
  onToggleVisibility: () => void;
  onRemove: () => void;
  onToggleMovement: (dash: boolean) => void;
  onOpenTheatric?: () => void;
}

const STATUS_ICONS: Record<string, string> = {
  blinded: "👁️‍🗨️", charmed: "💖", deafened: "🔇", exhaustion: "😰",
  frightened: "😱", grappled: "🤝", incapacitated: "💫", invisible: "👻",
  paralyzed: "🧊", petrified: "🗿", poisoned: "☠️", prone: "🙇",
  restrained: "⛓️", stunned: "✨", unconscious: "💤", concentration: "🧠",
};

export function TokenInspector({
  token, showMovement, dashMode, normalRange, dashRange,
  onToggleVisibility, onRemove, onToggleMovement, onOpenTheatric,
}: Props) {
  const markers = token.statusMarkers ?? [];

  return (
    <div className="rounded-xl border border-surface-700 bg-surface-850 p-4 animate-slide-up">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-full overflow-hidden shrink-0"
            style={{ backgroundColor: token.imageUrl ? 'transparent' : token.color }}>
            {token.imageUrl ? (
              <img src={token.imageUrl} alt={token.label} className="h-full w-full rounded-full object-cover" style={{ backgroundColor: token.color }} />
            ) : (
              <span className="text-sm font-bold text-white">{token.label.charAt(0)}</span>
            )}
            {markers.length > 0 && (
              <div className="absolute -top-1 -right-1 flex flex-wrap gap-0.5">
                {markers.slice(0, 3).map((m) => <span key={m.id} className="text-[8px]" title={m.type}>{STATUS_ICONS[m.type] || "❓"}</span>)}
                {markers.length > 3 && <span className="text-[7px] text-surface-400">+{markers.length - 3}</span>}
              </div>
            )}
          </div>
          <div>
            <h4 className="font-semibold text-surface-100">{token.label}</h4>
            <p className="text-xs text-surface-400">
              {token.type.charAt(0).toUpperCase() + token.type.slice(1)} · ({token.x},{token.y})
              {token.hp && ` · HP ${token.hp.current}/${token.hp.max}`}
              {token.speed && ` · ${token.speed}ft`}
              {token.initiative !== undefined && ` · Init ${token.initiative}`}
            </p>
          </div>
        </div>
        <div className="flex gap-1">
          {onOpenTheatric && <button onClick={onOpenTheatric} className="rounded-md px-2 py-1 text-xs text-accent-400 hover:bg-accent-500/10">🎭</button>}
          <button onClick={onToggleVisibility} className="rounded-md px-2 py-1 text-xs text-surface-400 hover:bg-surface-700 hover:text-surface-200">
            {token.visible ? "visible" : "hidden"}
          </button>
          <button onClick={onRemove} className="rounded-md px-2 py-1 text-xs text-warrior-400 hover:bg-warrior-500/10">x</button>
        </div>
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-medium text-surface-400">Movement ({token.speed ?? 30}ft)</span>
          <div className="flex gap-1">
            <button onClick={() => onToggleMovement(false)}
              className={`rounded px-2 py-0.5 text-[9px] font-medium transition-colors ${showMovement && !dashMode ? "bg-rogue-500/20 text-rogue-400" : "bg-surface-800 text-surface-400 hover:text-surface-200"}`}>
              Move ({normalRange} cells)
            </button>
            <button onClick={() => onToggleMovement(true)}
              className={`rounded px-2 py-0.5 text-[9px] font-medium transition-colors ${showMovement && dashMode ? "bg-warrior-500/20 text-warrior-400" : "bg-surface-800 text-surface-400 hover:text-surface-200"}`}>
              Dash ({dashRange} cells)
            </button>
          </div>
        </div>
        {showMovement && <p className="text-[10px] text-surface-500 mb-2">{dashMode ? "Double movement (dash)" : "Click a green cell to move"}</p>}
      </div>

      {token.hp && (
        <div className="mt-2">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-surface-400">HP</span>
            <span className="text-surface-300">{token.hp.current} / {token.hp.max}</span>
          </div>
          <div className="h-2 w-full rounded-full bg-surface-800 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-300" style={{
              width: `${Math.max(0, (token.hp.current / token.hp.max) * 100)}%`,
              backgroundColor: token.hp.current > token.hp.max * 0.5 ? "#27ae60" : token.hp.current > 0 ? "#f39c12" : "#e74c3c",
            }} />
          </div>
        </div>
      )}
    </div>
  );
}
