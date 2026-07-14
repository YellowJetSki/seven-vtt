/* ── Battle Maps ───────────────────────────────────────────────
 * Full battle map management with grid overlay, token placement,
 * fog of war, and map CRUD. Uses the MapEditor for interactive
 * editing and a card view for gallery-style browsing.
 * ─────────────────────────────────────────────────────────────── */

import { useState, useMemo } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import { useUiStore } from "@/stores/uiStore";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
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

export function BattleMaps() {
  const maps = useCampaignStore((s) => s.campaign?.battleMaps ?? []);
  const addBattleMap = useCampaignStore((s) => s.addBattleMap);
  const updateBattleMap = useCampaignStore((s) => s.updateBattleMap);
  const removeBattleMap = useCampaignStore((s) => s.removeBattleMap);
  const showToast = useUiStore((s) => s.showToast);

  const [selectedMap, setSelectedMap] = useState<BattleMap | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingMap, setEditingMap] = useState<BattleMap | undefined>();

  const filteredMaps = useMemo(() => {
    if (!searchQuery.trim()) return maps;
    const q = searchQuery.toLowerCase();
    return maps.filter((m) => m.name.toLowerCase().includes(q));
  }, [maps, searchQuery]);

  const handleCreateOrUpdate = (data: Partial<BattleMap> & { name: string }) => {
    if (editingMap) {
      updateBattleMap(editingMap.id, data);
      showToast({ message: `"${data.name}" updated.`, type: "success" });
    } else {
      const newMap: BattleMap = {
        id: uid("map"),
        name: data.name,
        imageUrl: data.imageUrl ?? "",
        imageFit: data.imageFit ?? "cover",
        gridWidth: data.gridWidth ?? 24,
        gridHeight: data.gridHeight ?? 18,
        gridSize: data.gridSize ?? 50,
        gridColor: data.gridColor ?? "#444",
        fogOfWar: data.fogOfWar ?? [],
        tokens: data.tokens ?? [],
        notes: data.notes ?? "",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      addBattleMap(newMap);
      showToast({ message: `"${newMap.name}" created!`, type: "success" });
    }
    setShowCreateForm(false);
    setEditingMap(undefined);
  };

  const handleDeleteMap = (map: BattleMap) => {
    removeBattleMap(map.id);
    setSelectedMap(null);
    showToast({ message: `"${map.name}" deleted.`, type: "info" });
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-surface-100 md:text-2xl">Battle Maps</h2>
          <p className="mt-1 text-sm text-surface-400">{maps.length} map{maps.length !== 1 ? "s" : ""} in your campaign</p>
        </div>
        <div className="flex items-center gap-2">
          {searchQuery && (
            <Button variant="ghost" size="xs" onClick={() => setSearchQuery("")}>Clear</Button>
          )}
          <Button size="sm" onClick={() => { setEditingMap(undefined); setShowCreateForm(true); }}>+ New Map</Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-surface-500 text-sm">🔍</span>
        <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search maps..."
          className="w-full rounded-lg border border-surface-700 bg-surface-800 py-2 pl-9 pr-3 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none" />
      </div>

      {/* Map Gallery or Empty State */}
      {filteredMaps.length === 0 ? (
        <EmptyState
          icon={searchQuery ? "🔍" : "🗺️"}
          title={searchQuery ? "No maps found" : "No battle maps yet"}
          description={searchQuery ? `No maps match "${searchQuery}".` : "Create your first battle map to get started with tactical combat."}
          action={!searchQuery ? { label: "Create Map", onClick: () => { setEditingMap(undefined); setShowCreateForm(true); } } : undefined}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredMaps.map((map) => (
            <button key={map.id} onClick={() => setSelectedMap(map)}
              className="group relative w-full text-left rounded-xl border border-surface-700 bg-surface-850 overflow-hidden transition-all hover:border-accent-500/30 hover:-translate-y-0.5 active:translate-y-0">
              {/* Thumbnail placeholder */}
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
                <h3 className="text-sm font-semibold text-surface-200 group-hover:text-accent-300 transition-colors">{map.name}</h3>
                <p className="text-xs text-surface-500 mt-0.5">{map.gridWidth}×{map.gridHeight} grid</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Map Editor Modal */}
      {selectedMap && (
        <Modal modalId="map-editor" title={selectedMap.name} size="xl">
          <div className="space-y-4">
            <MapEditor
              map={selectedMap}
              onUpdate={(updates) => updateBattleMap(selectedMap.id, updates)}
            />
            <div className="flex justify-between border-t border-surface-700 pt-3">
              <div className="flex gap-2">
                <Button variant="ghost" size="xs" onClick={() => handleDeleteMap(selectedMap)}>🗑️ Delete Map</Button>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="xs" onClick={() => { setEditingMap(selectedMap); setShowCreateForm(true); setSelectedMap(null); }}>⚙️ Edit Details</Button>
                <Button variant="ghost" size="xs" onClick={() => setSelectedMap(null)}>Close</Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Create/Edit Map Form */}
      {showCreateForm && (
        <Modal modalId="map-form" title={editingMap ? `Edit: ${editingMap.name}` : "New Battle Map"} size="md">
          <MapForm
            initialData={editingMap}
            onSubmit={handleCreateOrUpdate}
            onCancel={() => { setShowCreateForm(false); setEditingMap(undefined); }}
          />
        </Modal>
      )}
    </div>
  );
}

/* ── Map Form ───────────────────────────────────────────────── */

interface MapFormData {
  name: string;
  imageUrl?: string;
  imageFit?: "cover" | "contain" | "stretch";
  gridWidth: number;
  gridHeight: number;
  gridSize: number;
  notes?: string;
}

function MapForm({
  initialData,
  onSubmit,
  onCancel,
}: {
  initialData?: BattleMap;
  onSubmit: (data: MapFormData) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initialData?.name ?? "");
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl ?? "");
  const [imageFit, setImageFit] = useState(initialData?.imageFit ?? "cover");
  const [gridWidth, setGridWidth] = useState(initialData?.gridWidth ?? 24);
  const [gridHeight, setGridHeight] = useState(initialData?.gridHeight ?? 18);
  const [gridSize, setGridSize] = useState(initialData?.gridSize ?? 50);
  const [notes, setNotes] = useState(initialData?.notes ?? "");

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSubmit({
      name: name.trim(),
      imageUrl: imageUrl || undefined,
      imageFit: imageFit as "cover" | "contain" | "stretch",
      gridWidth: Math.max(4, Math.min(100, gridWidth)),
      gridHeight: Math.max(4, Math.min(100, gridHeight)),
      gridSize: Math.max(20, Math.min(100, gridSize)),
      notes: notes.trim() || undefined,
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-xs font-medium text-surface-400">Map Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Merchant's Way Crossroads"
          className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-surface-400">Image URL (optional)</label>
        <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://example.com/map.png"
          className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-surface-400">Grid Width</label>
          <input type="number" min={4} max={100} value={gridWidth} onChange={(e) => setGridWidth(parseInt(e.target.value) || 24)}
            className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 text-center focus:border-accent-500 focus:outline-none" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-surface-400">Grid Height</label>
          <input type="number" min={4} max={100} value={gridHeight} onChange={(e) => setGridHeight(parseInt(e.target.value) || 18)}
            className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 text-center focus:border-accent-500 focus:outline-none" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-surface-400">Pixel Size</label>
          <input type="number" min={20} max={100} value={gridSize} onChange={(e) => setGridSize(parseInt(e.target.value) || 50)}
            className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 text-center focus:border-accent-500 focus:outline-none" />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-surface-400">Image Fit</label>
        <div className="flex gap-2">
          {(["cover", "contain", "stretch"] as const).map((fit) => (
            <button key={fit} onClick={() => setImageFit(fit)}
              className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                imageFit === fit ? "border-accent-500 bg-accent-500/10 text-accent-300" : "border-surface-700 bg-surface-800 text-surface-400 hover:text-surface-200"
              }`}>
              {fit.charAt(0).toUpperCase() + fit.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-surface-400">Notes (optional)</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Terrain notes, room descriptions, etc."
          className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none resize-none" />
      </div>
      <div className="flex justify-end gap-3 pt-2 border-t border-surface-700">
        <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
        <Button size="sm" onClick={handleSubmit} disabled={!name.trim()}>
          {initialData ? "Update Map" : "Create Map"}
        </Button>
      </div>
    </div>
  );
}
