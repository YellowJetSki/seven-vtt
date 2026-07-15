/* ── Battle Maps ───────────────────────────────────────────────
 * Full battle map management with grid overlay, token placement,
 * fog of war, map CRUD, image picker, and gallery browsing.
 * ─────────────────────────────────────────────────────────────── */

import { useState, useMemo } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import { useUiStore } from "@/stores/uiStore";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { MapEditor } from "@/components/maps/MapEditor";
import type { BattleMap, MapToken } from "@/types";

function uid(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

const TOKEN_TYPE_LABELS: Record<MapToken["type"], string> = {
  player: "PC",
  enemy: "Enemy",
  npc: "NPC",
  custom: "Custom",
};

/* ── Map Form Data ──────────────────────────────────────────── */
interface MapFormData {
  name: string;
  imageUrl: string;
  gridWidth: number;
  gridHeight: number;
  gridSize: number;
}

export function BattleMaps() {
  const maps = useCampaignStore((s) => s.campaign?.battleMaps ?? []);
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

  const handleCreateMap = (data: MapFormData) => {
    const map: BattleMap = {
      id: uid("map"),
      name: data.name,
      imageUrl: data.imageUrl || undefined,
      gridWidth: data.gridWidth,
      gridHeight: data.gridHeight,
      gridSize: data.gridSize,
      fogOfWar: [],
      tokens: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    addBattleMap(map);
    closeModal();
    showToast({ message: `Map "${map.name}" created!`, type: "success" });
  };

  const handleUpdateMap = (data: MapFormData) => {
    if (!editingMap) return;
    updateBattleMap(editingMap.id, {
      name: data.name,
      imageUrl: data.imageUrl || undefined,
      gridWidth: data.gridWidth,
      gridHeight: data.gridHeight,
      gridSize: data.gridSize,
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

  const openCreateForm = () => {
    setEditingMap(undefined);
    openModal("map-form");
  };

  const openEditForm = (map: BattleMap) => {
    setEditingMap(map);
    openModal("map-form");
    setSelectedMap(null);
  };

  const openMapViewer = (map: BattleMap) => {
    setSelectedMap(map);
    openModal("map-viewer");
  };

  const closeMapViewer = () => {
    setSelectedMap(null);
    closeModal();
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Battle Maps"
        subtitle={`${maps.length} map${maps.length !== 1 ? "s" : ""} in your campaign`}
        icon="🗺️"
        actions={
          <Button size="sm" onClick={openCreateForm}>+ New Map</Button>
        }
      />

      {/* Search */}
      <div className="relative max-w-md">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-surface-500 text-sm">🔍</span>
        <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search maps..."
          className="w-full rounded-lg border border-surface-700 bg-surface-800 py-2 pl-9 pr-3 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none" />
        {searchQuery && (
          <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-surface-500 hover:text-surface-300">✕</button>
        )}
      </div>

      {/* Map Gallery or Empty State */}
      {filteredMaps.length === 0 ? (
        <EmptyState
          icon={searchQuery ? "🔍" : "🗺️"}
          title={searchQuery ? "No maps found" : "No battle maps yet"}
          description={searchQuery ? `No maps match "${searchQuery}".` : "Create your first battle map to get started with tactical combat."}
          action={!searchQuery ? { label: "Create Map", onClick: openCreateForm } : undefined}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredMaps.map((map) => (
            <button key={map.id} onClick={() => openMapViewer(map)}
              className="group relative w-full text-left rounded-xl border border-surface-700 bg-surface-850 overflow-hidden transition-all hover:border-accent-500/30 hover:-translate-y-0.5 active:translate-y-0">
              {/* Thumbnail */}
              <div className="relative h-36 w-full bg-surface-800 flex items-center justify-center">
                {map.imageUrl ? (
                  <img src={map.imageUrl} alt={map.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-surface-500">
                    <span className="text-3xl">🗺️</span>
                    <span className="text-[10px]">No image set</span>
                  </div>
                )}
                {/* Token count badge */}
                <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-surface-900/70 px-2 py-0.5 text-[10px] text-surface-300 backdrop-blur-sm">
                  <span>{map.tokens.length}</span>
                  <span>tokens</span>
                </div>
              </div>
              <div className="p-3">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-surface-200 group-hover:text-accent-300 transition-colors truncate">{map.name}</h3>
                    <p className="text-xs text-surface-500 mt-0.5">{map.gridWidth}×{map.gridHeight} grid · {map.tokens.length} tokens</p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); openEditForm(map); }}
                    className="ml-2 shrink-0 rounded bg-surface-800 px-2 py-1 text-[10px] text-surface-500 hover:text-surface-200 opacity-0 group-hover:opacity-100 transition-all">
                    ✏️
                  </button>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Map Viewer Modal */}
      {activeModal === "map-viewer" && selectedMap && (
        <Modal modalId="map-viewer" title={selectedMap.name} size="xl">
          <div className="space-y-4">
            <MapEditor
              map={selectedMap}
              onUpdate={(updates) => updateBattleMap(selectedMap.id, updates)}
            />
            <div className="flex justify-between border-t border-surface-700 pt-3">
              <div className="flex gap-2">
                <Button variant="ghost" size="xs" onClick={() => setConfirmDelete(selectedMap)}>🗑️ Delete Map</Button>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="xs" onClick={() => openEditForm(selectedMap)}>⚙️ Edit Details</Button>
                <Button variant="ghost" size="xs" onClick={closeMapViewer}>Close</Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Create/Edit Map Form Modal */}
      {activeModal === "map-form" && (
        <Modal modalId="map-form" title={editingMap ? `Edit: ${editingMap.name}` : "New Battle Map"} size="md">
          <MapForm
            existingMap={editingMap}
            onSave={editingMap ? handleUpdateMap : handleCreateMap}
            onCancel={() => { closeModal(); setEditingMap(undefined); }}
          />
        </Modal>
      )}

      {/* Confirm Delete */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setConfirmDelete(null)}>
          <div className="w-full max-w-sm rounded-xl border border-surface-700 bg-surface-850 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-surface-100 mb-2">Delete Map?</h3>
            <p className="text-sm text-surface-400 mb-4">
              Are you sure you want to delete "{confirmDelete.name}" and all its tokens? This cannot be undone.
            </p>
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

/* ── Map Form ────────────────────────────────────────────────── */

function MapForm({
  existingMap,
  onSave,
  onCancel,
}: {
  existingMap?: BattleMap;
  onSave: (data: MapFormData) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(existingMap?.name ?? "");
  const [imageUrl, setImageUrl] = useState(existingMap?.imageUrl ?? "");
  const [gridWidth, setGridWidth] = useState(existingMap?.gridWidth ?? 20);
  const [gridHeight, setGridHeight] = useState(existingMap?.gridHeight ?? 15);
  const [gridSize, setGridSize] = useState(existingMap?.gridSize ?? 40);

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      imageUrl: imageUrl.trim(),
      gridWidth,
      gridHeight,
      gridSize,
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-xs font-medium text-surface-400">Map Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Goblin Cave"
          className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-surface-400">Image URL (optional)</label>
        <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://example.com/map.jpg"
          className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none" />
        {imageUrl && (
          <img src={imageUrl} alt="Preview" className="mt-2 h-24 w-full rounded-lg object-cover bg-surface-800"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
        )}
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-surface-400">Grid Width</label>
          <input type="number" value={gridWidth} onChange={(e) => setGridWidth(parseInt(e.target.value) || 20)} min={1}
            className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 text-center focus:border-accent-500 focus:outline-none" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-surface-400">Grid Height</label>
          <input type="number" value={gridHeight} onChange={(e) => setGridHeight(parseInt(e.target.value) || 15)} min={1}
            className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 text-center focus:border-accent-500 focus:outline-none" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-surface-400">Cell Size</label>
          <input type="number" value={gridSize} onChange={(e) => setGridSize(parseInt(e.target.value) || 40)} min={10} max={100}
            className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 text-center focus:border-accent-500 focus:outline-none" />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
        <Button size="sm" onClick={handleSubmit} disabled={!name.trim()}>
          {existingMap ? "Update Map" : "Create Map"}
        </Button>
      </div>
    </div>
  );
}
