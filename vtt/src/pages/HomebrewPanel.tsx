/* ── Premium Homebrew Library Panel ────────────────────────────
 * Full CRUD interface for custom items, feats, and spells with
 * search, filtering, modal forms, image viewer, and import/export.
 * ─────────────────────────────────────────────────────────────── */

import { useState, useEffect, useRef, useMemo } from "react";
import { useHomebrewStore } from "@/stores/homebrewStore";
import { useUiStore } from "@/stores/uiStore";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { ItemForm } from "@/components/homebrew/ItemForm";
import { FeatForm } from "@/components/homebrew/FeatForm";
import { SpellForm } from "@/components/homebrew/SpellForm";
import { ItemCard } from "@/components/homebrew/ItemCard";
import { FeatCard } from "@/components/homebrew/FeatCard";
import { SpellCard } from "@/components/homebrew/SpellCard";
import { ImageViewerModal } from "@/components/homebrew/ImageViewerModal";
import { exportHomebrew, importHomebrew } from "@/lib/homebrew-io";
import type {
  HomebrewItem,
  HomebrewFeat,
  HomebrewSpell,
} from "@/types/homebrew";

type Tab = "items" | "feats" | "spells";

const FORM_MODAL_ID = "homebrew-form";

export function HomebrewPanel() {
  const showToast = useUiStore((s) => s.showToast);
  const openModal = useUiStore((s) => s.openModal);
  const closeModal = useUiStore((s) => s.closeModal);

  // Use individual length selectors to avoid infinite re-render
  const items = useHomebrewStore((s) => s.items);
  const feats = useHomebrewStore((s) => s.feats);
  const spells = useHomebrewStore((s) => s.spells);
  const addItem = useHomebrewStore((s) => s.addItem);
  const updateItem = useHomebrewStore((s) => s.updateItem);
  const removeItem = useHomebrewStore((s) => s.removeItem);
  const addFeat = useHomebrewStore((s) => s.addFeat);
  const updateFeat = useHomebrewStore((s) => s.updateFeat);
  const removeFeat = useHomebrewStore((s) => s.removeFeat);
  const addSpell = useHomebrewStore((s) => s.addSpell);
  const updateSpell = useHomebrewStore((s) => s.updateSpell);
  const removeSpell = useHomebrewStore((s) => s.removeSpell);

  const [activeTab, setActiveTab] = useState<Tab>("items");
  const [searchQuery, setSearchQuery] = useState("");

  const [editingItem, setEditingItem] = useState<HomebrewItem | undefined>();
  const [editingFeat, setEditingFeat] = useState<HomebrewFeat | undefined>();
  const [editingSpell, setEditingSpell] = useState<HomebrewSpell | undefined>();
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [viewingImage, setViewingImage] = useState<{ url: string; name: string } | null>(null);

  const importInputRef = useRef<HTMLInputElement>(null);

  const totalItems = items.length;
  const totalFeats = feats.length;
  const totalSpells = spells.length;
  const grandTotal = totalItems + totalFeats + totalSpells;

  const handleExport = () => {
    if (totalItems === 0 && totalFeats === 0 && totalSpells === 0) {
      showToast({ message: "Nothing to export. Add some homebrew data first.", type: "warning" });
      return;
    }
    exportHomebrew(items, feats, spells);
    showToast({ message: `Exported ${grandTotal} items.`, type: "success" });
  };

  const handleImport = () => {
    importInputRef.current?.click();
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const result = importHomebrew(data, addItem, addFeat, addSpell);
      if (result.success) {
        showToast({ message: `Imported ${result.itemsAdded} items, ${result.featsAdded} feats, ${result.spellsAdded} spells.`, type: "success" });
      }
      if (result.errors.length > 0) {
        showToast({ message: `${result.errors.length} warning(s) during import. Check console.`, type: "warning" });
        console.warn("Import errors:", result.errors);
      }
    } catch {
      showToast({ message: "Failed to parse file. Ensure it's valid JSON.", type: "error" });
    }
    e.target.value = "";
  };

  const activeModal = useUiStore((s) => s.activeModal);
  const isFormOpen = activeModal === FORM_MODAL_ID;

  useEffect(() => {
    if (!isFormOpen) {
      const timer = setTimeout(() => {
        setEditingItem(undefined);
        setEditingFeat(undefined);
        setEditingSpell(undefined);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isFormOpen]);

  const openCreateForm = () => {
    setFormMode("create");
    setEditingItem(undefined);
    setEditingFeat(undefined);
    setEditingSpell(undefined);
    openModal(FORM_MODAL_ID);
  };

  const handleItemEdit = (item: HomebrewItem) => {
    setFormMode("edit");
    setEditingItem(item);
    setEditingFeat(undefined);
    setEditingSpell(undefined);
    openModal(FORM_MODAL_ID);
  };

  const handleFeatEdit = (feat: HomebrewFeat) => {
    setFormMode("edit");
    setEditingFeat(feat);
    setEditingItem(undefined);
    setEditingSpell(undefined);
    openModal(FORM_MODAL_ID);
  };

  const handleSpellEdit = (spell: HomebrewSpell) => {
    setFormMode("edit");
    setEditingSpell(spell);
    setEditingItem(undefined);
    setEditingFeat(undefined);
    openModal(FORM_MODAL_ID);
  };

  const handleFormSubmit = (data: HomebrewItem | HomebrewFeat | HomebrewSpell) => {
    if (formMode === "create") {
      if ("weaponData" in data || "armorData" in data || "potionData" in data || "scrollData" in data) {
        addItem(data as HomebrewItem);
      } else if ("prerequisites" in data && "benefits" in data) {
        addFeat(data as HomebrewFeat);
      } else if ("school" in data && "components" in data) {
        addSpell(data as HomebrewSpell);
      }
      showToast({ message: `"${data.name}" created.`, type: "success" });
    } else {
      if ("weaponData" in data || "armorData" in data || "potionData" in data || "scrollData" in data) {
        updateItem(data.id, data as HomebrewItem);
      } else if ("prerequisites" in data && "benefits" in data) {
        updateFeat(data.id, data as HomebrewFeat);
      } else if ("school" in data && "components" in data) {
        updateSpell(data.id, data as HomebrewSpell);
      }
      showToast({ message: `"${data.name}" updated.`, type: "success" });
    }
    closeModal();
  };

  const handleFormCancel = () => closeModal();

  const handleDeleteItem = (id: string) => {
    const item = items.find((i) => i.id === id);
    removeItem(id);
    showToast({ message: `"${item?.name}" deleted.`, type: "info" });
  };

  const handleDeleteFeat = (id: string) => {
    const feat = feats.find((f) => f.id === id);
    removeFeat(id);
    showToast({ message: `"${feat?.name}" deleted.`, type: "info" });
  };

  const handleDeleteSpell = (id: string) => {
    const spell = spells.find((s) => s.id === id);
    removeSpell(id);
    showToast({ message: `"${spell?.name}" deleted.`, type: "info" });
  };

  const formTitle = (() => {
    if (formMode === "create") {
      const labels: Record<Tab, string> = { items: "Create New Item", feats: "Create New Feat", spells: "Create New Spell" };
      return labels[activeTab];
    }
    const editLabels: Record<Tab, string> = { items: `Edit: ${editingItem?.name ?? "Item"}`, feats: `Edit: ${editingFeat?.name ?? "Feat"}`, spells: `Edit: ${editingSpell?.name ?? "Spell"}` };
    return editLabels[activeTab];
  })();

  const query = searchQuery.toLowerCase().trim();

  const filteredItems = useMemo(
    () => query
      ? items.filter((i) => i.name.toLowerCase().includes(query) || i.tags.some((t) => t.toLowerCase().includes(query)) || i.category.toLowerCase().includes(query))
      : items,
    [items, query],
  );

  const filteredFeats = useMemo(
    () => query
      ? feats.filter((f) => f.name.toLowerCase().includes(query) || f.tags.some((t) => t.toLowerCase().includes(query)))
      : feats,
    [feats, query],
  );

  const filteredSpells = useMemo(
    () => query
      ? spells.filter((s) => s.name.toLowerCase().includes(query) || s.school.toLowerCase().includes(query) || s.tags.some((t) => t.toLowerCase().includes(query)))
      : spells,
    [spells, query],
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Homebrew Library"
        subtitle={grandTotal > 0 ? `${grandTotal} custom ${grandTotal === 1 ? "item" : "items"} in your library` : "Create and manage custom items, feats, and spells"}
        icon="⚗️"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={handleImport}>📥 Import</Button>
            <input ref={importInputRef} type="file" accept=".json" className="hidden" onChange={handleImportFile} />
            <Button variant="secondary" size="sm" onClick={handleExport}>📤 Export</Button>
            <Button size="sm" onClick={openCreateForm}>+ New {activeTab === "items" ? "Item" : activeTab === "feats" ? "Feat" : "Spell"}</Button>
          </div>
        }
      />

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-3">
        {(["items", "feats", "spells"] as const).map((tab) => {
          const count = tab === "items" ? totalItems : tab === "feats" ? totalFeats : totalSpells;
          return (
            <div
              key={tab}
              className={`cursor-pointer rounded-xl border p-4 text-center transition-all ${activeTab === tab ? "border-accent-500/50 bg-accent-500/10 shadow-lg shadow-accent-500/5" : "border-surface-700/60 bg-surface-850/80 hover:border-surface-600 glass-card"}`}
              onClick={() => setActiveTab(tab)}
            >
              <p className="text-2xl font-bold text-surface-100">{count}</p>
              <p className="text-xs text-surface-400 capitalize">{tab}</p>
            </div>
          );
        })}
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 rounded-lg bg-surface-850 p-1">
          {(["items", "feats", "spells"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-all ${activeTab === tab ? "bg-accent-600 text-white shadow-sm" : "text-surface-400 hover:text-surface-200"}`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-72">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-500 text-sm">🔍</span>
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={`Search ${activeTab}...`}
            className="w-full rounded-lg border border-surface-700 bg-surface-800 py-2 pl-9 pr-3 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:ring-1 focus:ring-accent-500 focus:outline-none" />
        </div>
      </div>

      {/* Content */}
      {((activeTab === "items" && filteredItems.length === 0) || (activeTab === "feats" && filteredFeats.length === 0) || (activeTab === "spells" && filteredSpells.length === 0)) ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-surface-700/60 bg-surface-850/60 glass py-16 text-center">
          <span className="text-5xl text-surface-600 mb-4">{activeTab === "items" ? "📦" : activeTab === "feats" ? "⭐" : "📖"}</span>
          <h3 className="text-lg font-semibold text-surface-200 mb-1">No {activeTab} yet</h3>
          <p className="text-sm text-surface-500 mb-6 max-w-sm">{query ? `No ${activeTab} match your search.` : `Your homebrew ${activeTab} library is empty.`}</p>
          {!query && <Button onClick={openCreateForm} variant="secondary">+ Create {activeTab === "items" ? "Item" : activeTab === "feats" ? "Feat" : "Spell"}</Button>}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {activeTab === "items" && filteredItems.map((item) => (
            <ItemCard key={item.id} item={item} onEdit={handleItemEdit} onDelete={handleDeleteItem} onViewImage={(url) => setViewingImage({ url, name: item.name })} />
          ))}
          {activeTab === "feats" && filteredFeats.map((feat) => (
            <FeatCard key={feat.id} feat={feat} onEdit={handleFeatEdit} onDelete={handleDeleteFeat} />
          ))}
          {activeTab === "spells" && filteredSpells.map((spell) => (
            <SpellCard key={spell.id} spell={spell} onEdit={handleSpellEdit} onDelete={handleDeleteSpell} />
          ))}
        </div>
      )}

      {/* Form Modal */}
      <Modal modalId={FORM_MODAL_ID} title={formTitle} size="lg">
        {activeTab === "items" && <ItemForm key={editingItem?.id ?? "new-item"} initialData={editingItem} onSubmit={handleFormSubmit} onCancel={handleFormCancel} />}
        {activeTab === "feats" && <FeatForm key={editingFeat?.id ?? "new-feat"} initialData={editingFeat} onSubmit={handleFormSubmit} onCancel={handleFormCancel} />}
        {activeTab === "spells" && <SpellForm key={editingSpell?.id ?? "new-spell"} initialData={editingSpell} onSubmit={handleFormSubmit} onCancel={handleFormCancel} />}
      </Modal>

      {/* Image Viewer */}
      {viewingImage && (
        <ImageViewerModal
          imageUrl={viewingImage.url}
          itemName={viewingImage.name}
          onClose={() => setViewingImage(null)}
        />
      )}
    </div>
  );
}
