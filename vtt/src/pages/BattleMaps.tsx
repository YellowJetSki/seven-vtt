/**
 * ST R VTT - Battle Maps (Map Management + DM Control Center)
 *
 * Complete battle map workflow:
 * 1. Empty state -> Create Map button opens MapCreatorModal
 * 2. Map list management (rename, delete) from the map list view
 * 3. DmControlCenter launches when a map is active
 *
 * Integrates with campaignStore for CRUD operations.
 */

import { useState, useEffect, useCallback } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import AppShell from "@/components/layout/AppShell";
import DmControlCenter from "@/components/control-center/DmControlCenter";
import MapCreatorModal from "@/components/maps/MapCreatorModal";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";

export default function BattleMaps() {
  const battleMaps = useCampaignStore((s) => s.battleMaps);
  const removeBattleMap = useCampaignStore((s) => s.removeBattleMap);
  const updateBattleMap = useCampaignStore((s) => s.updateBattleMap);

  const [showControlCenter, setShowControlCenter] = useState(false);
  const [showCreator, setShowCreator] = useState(false);
  const [editingMapId, setEditingMapId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Auto-show control center if maps exist
  useEffect(() => {
    if (battleMaps.length > 0 && !showControlCenter) {
      setShowControlCenter(true);
    }
  }, [battleMaps.length, showControlCenter]);

  const handleCreateMap = useCallback(() => {
    setShowCreator(true);
  }, []);

  const handleCreatorClose = useCallback(() => {
    setShowCreator(false);
  }, []);

  const handleStartRename = useCallback((mapId: string, currentName: string) => {
    setEditingMapId(mapId);
    setEditName(currentName);
  }, []);

  const handleSaveRename = useCallback((mapId: string) => {
    if (editName.trim()) {
      updateBattleMap(mapId, { name: editName.trim() });
    }
    setEditingMapId(null);
    setEditName("");
  }, [editName, updateBattleMap]);

  const handleCancelRename = useCallback(() => {
    setEditingMapId(null);
    setEditName("");
  }, []);

  const handleDeleteConfirm = useCallback((mapId: string) => {
    removeBattleMap(mapId);
    setConfirmDelete(null);
  }, [removeBattleMap]);

  if (!showControlCenter || battleMaps.length === 0) {
    return (
      <AppShell>
        <div className="flex flex-col h-full">
          {/* ── Header ── */}
          <div className="shrink-0 glass-gold rounded-2xl m-4 p-4 relative overflow-hidden">
            <div className="corner-ornament corner-tl corner-gold corner-gold-glow" />
            <div className="corner-ornament corner-tr corner-gold corner-gold-glow" />
            <div className="corner-ornament corner-bl corner-gold corner-gold-glow" />
            <div className="corner-ornament corner-br corner-gold corner-gold-glow" />
            <div className="depth-ring absolute inset-0 opacity-20" />
            <div className="relative z-10">
              <h1 className="text-2xl font-black text-gold tracking-tight drop-shadow-[0_0_12px_rgba(234,179,8,0.15)]">
                Battle Maps
              </h1>
              <p className="text-surface-400 text-sm mt-1">Tactical command center for your encounters</p>
              <div className="rune-gold mt-3 w-full max-w-md">* * *</div>
            </div>
          </div>

          {/* ── Empty State ── */}
          <div className="flex-1 mx-4 mb-4 overflow-y-auto">
            <div className="max-w-4xl mx-auto space-y-4 pb-8">
              <EmptyState
                icon="map"
                title="No Battle Maps"
                description="Create your first tactical map to unlock the DM Control Center with tokens, initiative tracking, and encounter tools."
              >
                <div className="flex gap-3 mt-4">
                  <Button variant="gold" size="lg" onClick={handleCreateMap}>
                    Create Map
                  </Button>
                </div>
              </EmptyState>

              {/* Quick start guides */}
              <div className="glass-gold rounded-2xl p-4 border border-gold/5">
                <h3 className="text-[10px] uppercase tracking-widest text-gold-400/60 font-bold mb-3">
                  Getting Started
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-[#07080d] rounded-xl p-3 border border-white/[0.04]">
                    <div className="text-lg mb-1">1</div>
                    <div className="text-[10px] font-semibold text-surface-300">Create a Map</div>
                    <div className="text-[8px] text-surface-600 mt-0.5">Add a name, optional image, and set grid dimensions</div>
                  </div>
                  <div className="bg-[#07080d] rounded-xl p-3 border border-white/[0.04]">
                    <div className="text-lg mb-1">2</div>
                    <div className="text-[10px] font-semibold text-surface-300">Place Tokens</div>
                    <div className="text-[8px] text-surface-600 mt-0.5">Add player tokens and NPCs directly on the map</div>
                  </div>
                  <div className="bg-[#07080d] rounded-xl p-3 border border-white/[0.04]">
                    <div className="text-lg mb-1">3</div>
                    <div className="text-[10px] font-semibold text-surface-300">Run Encounters</div>
                    <div className="text-[8px] text-surface-600 mt-0.5">Track initiative, HP, and conditions in real-time</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Map Creator Modal */}
        <MapCreatorModal isOpen={showCreator} onClose={handleCreatorClose} />
      </AppShell>
    );
  }

  // ── Map List Manager (shown before entering full control center) ──
  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-obsidian">
      {/* Mini top bar for map management */}
      <div className="shrink-0 glass-gold border-b border-gold/10 px-4 py-2 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <span className="text-sm font-black text-gold">Battle Maps</span>
          <span className="text-[10px] text-surface-500 px-1.5 py-0.5 rounded bg-[#07080d]">
            {battleMaps.length} map{battleMaps.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreator(true)}
            className="px-3 py-1 rounded-lg text-[10px] font-bold bg-gold-500/10 border border-gold/15 text-gold-400 hover:bg-gold-500/15 active:scale-95 transition-all duration-150 flex items-center gap-1"
          >
            + New Map
          </button>
        </div>
      </div>

      {/* Main content: map list grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {battleMaps.map((map) => (
              <MapCard
                key={map.id}
                map={map}
                isEditing={editingMapId === map.id}
                editName={editName}
                isConfirmingDelete={confirmDelete === map.id}
                onStartRename={() => handleStartRename(map.id, map.name)}
                onEditNameChange={setEditName}
                onSaveRename={() => handleSaveRename(map.id)}
                onCancelRename={handleCancelRename}
                onRequestDelete={() => setConfirmDelete(map.id)}
                onCancelDelete={() => setConfirmDelete(null)}
                onConfirmDelete={() => handleDeleteConfirm(map.id)}
                onSelect={() => setShowControlCenter(true)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Map Creator Modal */}
      <MapCreatorModal isOpen={showCreator} onClose={handleCreatorClose} />
    </div>
  );
}

// ── Inline MapCard Component ──────────────────────────────────
interface MapCardProps {
  map: import("@/types").BattleMap;
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

function MapCard({
  map, isEditing, editName, isConfirmingDelete,
  onStartRename, onEditNameChange, onSaveRename, onCancelRename,
  onRequestDelete, onCancelDelete, onConfirmDelete, onSelect,
}: MapCardProps) {
  const gridTotalCells = map.gridWidth * map.gridHeight;
  const gridDimFt = `${map.gridWidth * 5}ft x ${map.gridHeight * 5}ft`;

  return (
    <div className="group glass-gold rounded-2xl overflow-hidden border border-gold/5 hover:border-gold/15 transition-all duration-200 hover:shadow-[0_0_15px_rgba(234,179,8,0.03)]">
      <div className="corner-ornament corner-tl corner-gold" />
      <div className="corner-ornament corner-tr corner-gold" />

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
              <div className="text-2xl opacity-30">map</div>
              <div className="text-[8px] text-surface-700 mt-1">No preview</div>
            </div>
          </div>
        )}
        {/* Gradient overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0b12] via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="p-3 space-y-2">
        {/* Name */}
        {isEditing ? (
          <div className="flex gap-1">
            <input
              type="text"
              value={editName}
              onChange={(e) => onEditNameChange(e.target.value)}
              className="flex-1 py-1 px-2 rounded text-[10px] bg-[#07080d] border border-gold/20 text-gold-200 focus:outline-none"
              autoFocus
              onKeyDown={(e) => { if (e.key === "Enter") onSaveRename(); if (e.key === "Escape") onCancelRename(); }}
            />
            <button onClick={onSaveRename} className="text-[9px] px-1.5 py-0.5 rounded bg-gold-500/10 text-gold-400">Save</button>
            <button onClick={onCancelRename} className="text-[9px] px-1.5 py-0.5 rounded text-surface-500">X</button>
          </div>
        ) : (
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gold-200 truncate max-w-[180px]">{map.name}</h3>
              <div className="text-[9px] text-surface-500 mt-0.5">{gridDimFt} &middot; {gridTotalCells.toLocaleString()} cells</div>
            </div>
          </div>
        )}

        {/* Stats row */}
        <div className="flex items-center justify-between text-[8px] text-surface-600">
          <div className="flex gap-2">
            <span>{map.gridSize}px cells</span>
            {map.notes && <span>&middot; Has notes</span>}
          </div>
          <span>Created {new Date(map.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-1.5 pt-1">
          <button
            onClick={onSelect}
            className="flex-1 py-1.5 rounded-lg text-[9px] font-bold bg-gold-500/10 border border-gold/15 text-gold-400 hover:bg-gold-500/15 active:scale-95 transition-all duration-150"
          >
            Open Map
          </button>
          <button
            onClick={onStartRename}
            className="px-2 py-1.5 rounded-lg text-[9px] text-surface-500 hover:text-surface-300 hover:bg-gold-500/10 active:scale-95 transition-all duration-150"
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
