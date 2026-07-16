/* ── Battle Maps ───────────────────────────────────────────────
 * Full battle map management with grid overlay, token placement,
 * fog of war, map CRUD, image picker from /images/battlemaps/,
 * gallery browsing, and a Theatric Tab for dramatic reveals.
 *
 * ── Theatric Tab (new browser window) ────────────────────────
 * Opens a separate tab that shows a full-bleed, no-grid view
 * centered on the selected token. The tab reads map + token data
 * from Firebase in real-time via onSnapshot, so the DM moving a
 * token in the main tab updates the theatric view instantly.
 * Only a tiny { mapId, tokenId } payload is stored in localStorage
 * as a communication bridge to the new tab.
 * ─────────────────────────────────────────────────────────────── */

import { useState, useMemo } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import { useUiStore } from "@/stores/uiStore";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { ImagePicker } from "@/components/ui/ImagePicker";
import { MapEditor } from "@/components/maps/MapEditor";
import type { BattleMap, MapToken } from "@/types";

/* ── Cross-tab communication constant ──────────────────────── */
export const THEATRIC_STORAGE_KEY = "str-vtt:theatric-data";

/**
 * Minimal payload stored in localStorage as a communication bridge
 * to the new theatric tab. The tab then fetches the full map data
 * from Firebase (or falls back to localStorage polling).
 *
 * We keep the full map in the payload as a FALLBACK for when
 * Firebase is not configured — the TheatricPage will read the
 * full map from here if the Firestore listener is unavailable.
 */
export interface TheatricPayload {
  /** Map ID to identify the battle map */
  mapId: string;
  /** Token ID to spotlight */
  tokenId: string;
  /**
   * Full map data — only populated as a fallback when Firebase
   * is not available. In the normal case (Firebase sync active),
   * this is left empty and the TheatricPage subscribes to Firestore.
   */
  map?: BattleMap;
}

function uid(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/* ── Map Form Data ──────────────────────────────────────────── */
interface MapFormData {
  name: string;
  imageUrl: string;
  gridWidth: number;
  gridHeight: number;
  gridSize: number;
}

const TOKEN_COLORS = [
  "#8b30ff", "#3b82f6", "#27ae60", "#f39c12",
  "#e74c3c", "#ec4899", "#14b8a6", "#f97316",
  "#6b7280", "#a855f7",
];

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

  const handleAddToken = (token: MapToken) => {
    if (!selectedMap) return;
    updateBattleMap(selectedMap.id, { tokens: [...selectedMap.tokens, token] });
    closeModal();
    showToast({ message: `Token "${token.label}" added.`, type: "success" });
  };

  /* ── Theatric Tab: Opens a NEW BROWSER TAB ────────────── */
  const handleOpenTheatric = (token: MapToken) => {
    if (!selectedMap) return;

    // Only store the minimal payload: mapId + tokenId
    // The TheatricPage will subscribe to Firebase for the full data
    const payload: TheatricPayload = {
      mapId: selectedMap.id,
      tokenId: token.id,
    };

    try {
      localStorage.setItem(THEATRIC_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      showToast({ message: "Failed to open theatric view.", type: "error" });
      return;
    }

    const theatricUrl = `${window.location.origin}/theatric`;
    window.open(theatricUrl, "str-vtt-theatric", "noopener,noreferrer");
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
              onOpenTheatric={handleOpenTheatric}
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

      {/* Add Token Modal — lives outside MapEditor so it stays open independently */}
      {activeModal === "add-token" && selectedMap && (
        <Modal modalId="add-token" title="Add Token" size="sm">
          <AddTokenForm
            gridWidth={selectedMap.gridWidth}
            gridHeight={selectedMap.gridHeight}
            onAdd={handleAddToken}
            onCancel={() => closeModal()}
          />
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

/* ═══════════════════════════════════════════════════════════════
 * ADD TOKEN FORM — includes ImagePicker for token images
 * from /public/images/tokens/
 * ═══════════════════════════════════════════════════════════════ */

function AddTokenForm({
  gridWidth,
  gridHeight,
  onAdd,
  onCancel,
}: {
  gridWidth: number;
  gridHeight: number;
  onAdd: (token: MapToken) => void;
  onCancel: () => void;
}) {
  const [label, setLabel] = useState("");
  const [type, setType] = useState<MapToken["type"]>("enemy");
  const [x, setX] = useState(Math.floor(gridWidth / 4));
  const [y, setY] = useState(Math.floor(gridHeight / 4));
  const [color, setColor] = useState(TOKEN_COLORS[0]);
  const [size, setSize] = useState(1);
  const [speed, setSpeed] = useState(30);
  const [initiative, setInitiative] = useState(0);
  const [hpMax, setHpMax] = useState(15);
  const [imageUrl, setImageUrl] = useState("");

  const handleAdd = () => {
    if (!label.trim()) return;
    const token: MapToken = {
      id: `tk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type,
      label: label.trim(),
      x: Math.max(0, Math.min(gridWidth - 1, x)),
      y: Math.max(0, Math.min(gridHeight - 1, y)),
      color,
      size,
      speed,
      initiative: initiative > 0 ? initiative : undefined,
      visible: true,
      hp: { current: hpMax, max: hpMax },
      imageUrl: imageUrl || undefined,
    };
    onAdd(token);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-xs font-medium text-surface-400">Label</label>
        <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Goblin Archer"
          className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none" />
      </div>

      {/* Token Image Picker — from /public/images/tokens/ */}
      <ImagePicker
        value={imageUrl}
        onChange={setImageUrl}
        label="Token Image (optional, from library)"
        libraryCategory="tokens"
      />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-surface-400">Type</label>
          <select value={type} onChange={(e) => setType(e.target.value as MapToken["type"])}
            className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 focus:border-accent-500 focus:outline-none">
            <option value="player">Player</option>
            <option value="enemy">Enemy</option>
            <option value="npc">NPC</option>
            <option value="custom">Custom</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-surface-400">Size (cells)</label>
          <input type="number" min={1} max={4} value={size} onChange={(e) => setSize(parseInt(e.target.value) || 1)}
            className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 text-center focus:border-accent-500 focus:outline-none" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-surface-400">Speed (ft)</label>
          <input type="number" min={0} max={120} step={5} value={speed} onChange={(e) => setSpeed(parseInt(e.target.value) || 30)}
            className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 text-center focus:border-accent-500 focus:outline-none" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-surface-400">Initiative</label>
          <input type="number" min={0} max={30} value={initiative} onChange={(e) => setInitiative(parseInt(e.target.value) || 0)}
            className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 text-center focus:border-accent-500 focus:outline-none" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-surface-400">Max HP</label>
          <input type="number" min={1} max={999} value={hpMax} onChange={(e) => setHpMax(parseInt(e.target.value) || 15)}
            className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 text-center focus:border-accent-500 focus:outline-none" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-surface-400">X Position (0-{gridWidth - 1})</label>
          <input type="number" min={0} max={gridWidth - 1} value={x} onChange={(e) => setX(parseInt(e.target.value) || 0)}
            className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 text-center focus:border-accent-500 focus:outline-none" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-surface-400">Y Position (0-{gridHeight - 1})</label>
          <input type="number" min={0} max={gridHeight - 1} value={y} onChange={(e) => setY(parseInt(e.target.value) || 0)}
            className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 text-center focus:border-accent-500 focus:outline-none" />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-surface-400">Color</label>
        <div className="flex flex-wrap gap-2">
          {TOKEN_COLORS.map((c) => (
            <button key={c} onClick={() => setColor(c)}
              className={`h-7 w-7 rounded-full transition-all ${color === c ? "ring-2 ring-white ring-offset-1 ring-offset-surface-850 scale-110" : ""}`}
              style={{ backgroundColor: c }} />
          ))}
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2 border-t border-surface-700">
        <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
        <Button size="sm" onClick={handleAdd} disabled={!label.trim()}>Add Token</Button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
 * MAP FORM — uses ImagePicker with libraryCategory="battlemaps"
 * to showcase the SVGs in /public/images/battlemaps/
 * ═══════════════════════════════════════════════════════════════ */

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
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Cragmaw Hideout"
          className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none" />
      </div>

      {/* Image Picker — uses libraryCategory="battlemaps" to show SVGs from /public/images/battlemaps/ */}
      <ImagePicker
        value={imageUrl}
        onChange={setImageUrl}
        label="Map Image (optional)"
        libraryCategory="battlemaps"
      />

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
