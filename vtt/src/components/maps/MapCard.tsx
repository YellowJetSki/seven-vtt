/**
 * STᚱ VTT — Map Card (Premium DM Map Manager)
 *
 * Premium map list card with hover depth, inline rename, delete confirmation,
 * and quick action buttons.
 *
 * Features:
 * - Glass gradient card with edge light + hover elevation
 * - Image preview with gradient overlay for readability
 * - Inline rename with Enter/Escape keyboard support
 * - Two-step delete confirmation
 * - Stats: grid dimensions, cell count, cell size, notes indicator
 * - Gold gradient "Open Map" button
 *
 * Extracted from BattleMaps.tsx monolith for modularity.
 */

import type { BattleMap } from "@/types";

interface MapCardProps {
  map: BattleMap;
  isEditing: boolean;
  editName: string;
  isConfirmingDelete: boolean;
  onStartRename: () => void;
  onEditNameChange: (val: string) => void;
  onSaveRename: () => void;
  onCancelRename: () => void;
  onRequestDelete: () => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
  onSelect: () => void;
}

export default function MapCard({
  map, isEditing, editName, isConfirmingDelete,
  onStartRename, onEditNameChange, onSaveRename, onCancelRename,
  onRequestDelete, onCancelDelete, onConfirmDelete, onSelect,
}: MapCardProps) {
  const gridTotalCells = map.gridWidth * map.gridHeight;
  const gridDimFt = `${map.gridWidth * 5}ft x ${map.gridHeight * 5}ft`;

  return (
    <div className="group relative bg-gradient-to-b from-[#191b2b]/70 to-[#12131e]/85 rounded-2xl overflow-hidden border border-white/[0.04] hover:border-gold-500/12 transition-all duration-200 hover:shadow-[0_8px_32px_rgba(0,0,0,0.35),0_0_30px_rgba(234,179,8,0.03)] hover:-translate-y-0.5">
      {/* Top edge light */}
      <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-gold-500/0 to-transparent group-hover:via-gold-500/15 transition-all duration-500" />

      {/* Hover glow sweep */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-gold-500/5 via-transparent to-amber-500/2" />
      </div>

      {/* Image preview */}
      <div className="h-28 bg-[#07080d] relative overflow-hidden">
        {map.imageUrl ? (
          <img
            src={map.imageUrl}
            alt={map.name}
            className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-300"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-2xl opacity-30">🗺</div>
              <div className="text-[8px] text-surface-700 mt-1">No preview</div>
            </div>
          </div>
        )}
        {/* Gradient overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0b12] via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 p-3 space-y-2">
        {/* Name */}
        {isEditing ? (
          <div className="flex gap-1">
            <input
              type="text"
              value={editName}
              onChange={(e) => onEditNameChange(e.target.value)}
              className="flex-1 py-1 px-2 rounded text-[10px] bg-[#07080d] border border-gold/20 text-gold-200 focus:outline-none focus:border-gold-500/30"
              autoFocus
              onKeyDown={(e) => { if (e.key === "Enter") onSaveRename(); if (e.key === "Escape") onCancelRename(); }}
            />
            <button onClick={onSaveRename} className="text-[9px] px-1.5 py-0.5 rounded bg-gold-500/10 text-gold-400 hover:bg-gold-500/15 active:scale-95 transition-all">Save</button>
            <button onClick={onCancelRename} className="text-[9px] px-1.5 py-0.5 rounded text-surface-500 hover:text-surface-300 active:scale-95 transition-all">✕</button>
          </div>
        ) : (
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-semibold text-surface-200 truncate max-w-[180px]">{map.name}</h3>
              <div className="text-[9px] text-surface-500 mt-0.5">{gridDimFt} · {gridTotalCells.toLocaleString()} cells</div>
            </div>
          </div>
        )}

        {/* Stats row */}
        <div className="flex items-center justify-between text-[8px] text-surface-600">
          <div className="flex gap-2">
            <span>{map.gridSize}px cells</span>
            {map.notes && <span>· Has notes</span>}
          </div>
          <span>Created {new Date(map.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-1.5 pt-1">
          <button
            onClick={onSelect}
            className="flex-1 py-1.5 rounded-lg text-[9px] font-bold bg-gradient-to-br from-gold-500/12 to-amber-500/8 border border-gold-500/20 text-gold-400 hover:from-gold-500/20 hover:to-amber-500/12 hover:border-gold-500/30 active:scale-95 transition-all duration-150"
          >
            Open Map
          </button>
          <button
            onClick={onStartRename}
            className="px-2 py-1.5 rounded-lg text-[9px] text-surface-500 hover:text-surface-300 hover:bg-white/[0.04] active:scale-95 transition-all duration-150"
            title="Rename"
          >
            Rename
          </button>
          {isConfirmingDelete ? (
            <div className="flex gap-1">
              <button
                onClick={onConfirmDelete}
                className="px-2 py-1.5 rounded-lg text-[9px] bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/15 active:scale-95 transition-all duration-150"
              >
                Delete
              </button>
              <button
                onClick={onCancelDelete}
                className="px-2 py-1.5 rounded-lg text-[9px] text-surface-500 hover:text-surface-300 active:scale-95 transition-all"
              >
                No
              </button>
            </div>
          ) : (
            <button
              onClick={onRequestDelete}
              className="px-2 py-1.5 rounded-lg text-[9px] text-surface-500 hover:text-rose-400 hover:bg-rose-500/10 active:scale-95 transition-all duration-150"
              title="Delete"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
