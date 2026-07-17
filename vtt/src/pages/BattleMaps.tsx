/* ── Battle Maps ───────────────────────────────────────────────
 * Full battle map management with grid overlay, token placement,
 * fog of war, map CRUD, image picker, and theatric tab.
 * ─────────────────────────────────────────────────────────────── */

import { useState, useMemo } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import { useUiStore } from "@/stores/uiStore";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { MapEditor } from "@/components/maps/MapEditor";
import { MapForm } from "@/components/maps/MapForm";
import { AddTokenForm } from "@/components/maps/AddTokenForm";
import type { BattleMap, MapToken } from "@/types";

export const THEATRIC_STORAGE_KEY = "str-vtt:theatric-data";

export interface TheatricPayload {
  mapId: string;
  tokenId: string;
  map?: BattleMap;
}

function uid(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function BattleMaps() {
  const maps = useCampaignStore((s) => s.battleMaps);
  const addBattleMap = useCampaignStore((s) => s.addBattleMap);
  const updateBattleMap = useCampaignStore((s) => s.updateBattleMap);
  const removeBattleMap = useCampaignStore((s) => s.removeBattleMap);
  const showToast = useUiStore((s) => s.showToast);
  const openModal = useUiStore((s) => s.openModal);
  const closeModal = useUiStore((s) => s.closeModal);
  const activeModal = useUiStore((s) => s.activeModal);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMap, setSelectedMap] = useState<BattleMap | null>(null);
  const [editingMap, setEditingMap] = useState<BattleMap | undefined>();
  const [confirmDelete, setConfirmDelete] = useState<BattleMap | null>(null);

  const filteredMaps = useMemo(() => {
    if (!searchQuery.trim()) return maps;
    const q = searchQuery.toLowerCase();
    return maps.filter((m) => m.name.toLowerCase().includes(q));
  }, [maps, searchQuery]);

  /* ── Handlers ── */
  const handleCreateMap = (data: { name: string; imageUrl?: string; gridWidth: number; gridHeight: number; gridSize: number }) => {
    const map: BattleMap = {
      id: uid("map"), name: data.name, imageUrl: data.imageUrl || undefined,
      gridWidth: data.gridWidth, gridHeight: data.gridHeight, gridSize: data.gridSize,
      fogOfWar: [], tokens: [], createdAt: Date.now(), updatedAt: Date.now(),
    };
    addBattleMap(map);
    closeModal();
    showToast({ message: `Map "${map.name}" created!`, type: "success" });
  };

  const handleUpdateMap = (data: { name: string; imageUrl?: string; gridWidth: number; gridHeight: number; gridSize: number }) => {
    if (!editingMap) return;
    updateBattleMap(editingMap.id, {
      name: data.name, imageUrl: data.imageUrl || undefined,
      gridWidth: data.gridWidth, gridHeight: data.gridHeight, gridSize: data.gridSize,
      updatedAt: Date.now(),
    });
    setEditingMap(undefined);
    closeModal();
    showToast({ message: `Map "${data.name}" updated.`, type: "success" });
  };

  const handleDeleteMap = (map: BattleMap) => {
    removeBattleMap(map.id);
    setSelectedMap(null);
    setConfirmDelete(null);
    closeModal();
    showToast({ message: `"${map.name}" deleted.`, type: "info" });
  };

  const handleAddToken = (token: MapToken) => {
    if (!selectedMap) return;
    updateBattleMap(selectedMap.id, { tokens: [...selectedMap.tokens, token] });
    closeModal();
    showToast({ message: `Token "${token.label}" added.`, type: "success" });
  };

  const handleOpenTheatric = (token: MapToken) => {
    if (!selectedMap) return;
    const payload: TheatricPayload = { mapId: selectedMap.id, tokenId: token.id };
    try {
      localStorage.setItem(THEATRIC_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      showToast({ message: "Failed to open theatric view.", type: "error" });
      return;
    }
    window.open(`${window.location.origin}/theatric`, "str-vtt-theatric", "noopener,noreferrer");
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader title="Battle Maps" subtitle={`${maps.length} map${maps.length !== 1 ? "s" : ""}`} icon="🗺️"
        actions={<Button size="sm" onClick={() => { setEditingMap(undefined); openModal("map-form"); }}>+ New Map</Button>}
      />

      {/* Search */}
      <div className="relative max-w-md">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-surface-500 text-sm">🔍</span>
        <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search maps..."
          className="w-full rounded-lg border border-surface-700 bg-surface-800 py-2 pl-9 pr-3 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none" />
        {searchQuery && <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-surface-500 hover:text-surface-300">✕</button>}
      </div>

      {/* Gallery */}
      {filteredMaps.length === 0 ? (
        <EmptyState icon={searchQuery ? "🔍" : "🗺️"} title={searchQuery ? "No maps found" : "No battle maps yet"}
          description={searchQuery ? `No maps match "${searchQuery}".` : "Create your first battle map to get started with tactical combat."}
          action={!searchQuery ? { label: "Create Map", onClick: () => openModal("map-form") } : undefined} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredMaps.map((map) => (
            <button key={map.id} onClick={() => { setSelectedMap(map); openModal("map-viewer"); }}
              className="group relative w-full text-left rounded-xl border border-surface-700 bg-surface-850 overflow-hidden transition-all hover:border-accent-500/30 hover:-translate-y-0.5">
              <div className="relative h-36 w-full bg-surface-800 flex items-center justify-center">
                {map.imageUrl ? (
                  <img src={map.imageUrl} alt={map.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-surface-500">
                    <span className="text-3xl">🗺️</span>
                    <span className="text-[10px]">No image set</span>
                  </div>
                )}
                <div className="absolute top-2 right-2 rounded-full bg-surface-900/70 px-2 py-0.5 text-[10px] text-surface-300 backdrop-blur-sm">
                  {map.tokens.length} tokens
                </div>
              </div>
              <div className="p-3">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-surface-200 group-hover:text-accent-300 truncate">{map.name}</h3>
                    <p className="text-xs text-surface-500 mt-0.5">{map.gridWidth}×{map.gridHeight} grid · {map.tokens.length} tokens</p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); setEditingMap(map); openModal("map-form"); }}
                    className="ml-2 shrink-0 rounded bg-surface-800 px-2 py-1 text-[10px] text-surface-500 hover:text-surface-200 opacity-0 group-hover:opacity-100">✏️</button>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Modals */}
      {activeModal === "map-viewer" && selectedMap && (
        <Modal modalId="map-viewer" title={selectedMap.name} size="xl">
          <div className="space-y-4">
            <MapEditor map={selectedMap} onUpdate={(updates) => updateBattleMap(selectedMap.id, updates)} onOpenTheatric={handleOpenTheatric} />
            <div className="flex justify-between border-t border-surface-700 pt-3">
              <div className="flex gap-2">
                <Button variant="ghost" size="xs" onClick={() => setConfirmDelete(selectedMap)}>🗑️ Delete Map</Button>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="xs" onClick={() => { setEditingMap(selectedMap); openModal("map-form"); }}>⚙️ Edit Details</Button>
                <Button variant="ghost" size="xs" onClick={() => { setSelectedMap(null); closeModal(); }}>Close</Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {activeModal === "add-token" && selectedMap && (
        <Modal modalId="add-token" title="Add Token" size="sm">
          <AddTokenForm gridWidth={selectedMap.gridWidth} gridHeight={selectedMap.gridHeight} onAdd={handleAddToken} onCancel={() => closeModal()} />
        </Modal>
      )}

      {activeModal === "map-form" && (
        <Modal modalId="map-form" title={editingMap ? `Edit: ${editingMap.name}` : "New Battle Map"} size="md">
          <MapForm existingMap={editingMap} onSave={editingMap ? handleUpdateMap : handleCreateMap} onCancel={() => { closeModal(); setEditingMap(undefined); }} />
        </Modal>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setConfirmDelete(null)}>
          <div className="w-full max-w-sm rounded-xl border border-surface-700 bg-surface-850 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-surface-100 mb-2">Delete Map?</h3>
            <p className="text-sm text-surface-400 mb-4">Are you sure you want to delete "{confirmDelete.name}" and all its tokens?</p>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(null)}>Cancel</Button>
              <Button variant="danger" size="sm" onClick={() => handleDeleteMap(confirmDelete)}>Delete</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
