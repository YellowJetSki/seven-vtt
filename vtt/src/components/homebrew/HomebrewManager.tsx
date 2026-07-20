/**
 * STᚱ VTT — Homebrew Manager (Premium v3.1 — Lusion-Grade Orchestrator)
 *
 * Full CRUD panel for homebrew items, spells, and feats with bulk operations,
 * export/import, SRD reference display, visibility control, and duplicate.
 * Enhanced with staggered entrance animations and premium micro-interactions.
 */

import { useState, useMemo, useCallback, useRef } from "react";
import { useCompendiumStore } from "@/stores/compendium/compendiumStore";
import { SRD_ITEMS, SRD_SPELLS, SRD_FEATS } from "@/stores/compendium/compendiumData";
import { exportHomebrewToJSON, parseHomebrewJSON, mergeHomebrewImport } from "@/lib/homebrew-io";
import HomebrewTabs, { type HomebrewTabId } from "./HomebrewTabs";
import HomebrewSearchBar from "./HomebrewSearchBar";
import HomebrewTabPanel from "./HomebrewTabPanel";
import HomebrewItemForm from "./HomebrewItemForm";
import HomebrewSpellForm from "./HomebrewSpellForm";
import HomebrewFeatForm from "./HomebrewFeatForm";
import { useHomebrewForms } from "./useHomebrewForms";
import { showToast } from "@/components/ui/ToastContainer";
import type { HomebrewItem, HomebrewSpell, HomebrewFeat } from "@/types/homebrew";

export default function HomebrewManager() {
  const store = useCompendiumStore();
  const { items, spells, feats } = store;
  const [activeTab, setActiveTab] = useState<HomebrewTabId>("items");
  const [search, setSearch] = useState("");
  const [showSRD, setShowSRD] = useState(true);
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    formMode,
    formType,
    itemForm,
    spellForm,
    featForm,
    featBenefitsInput,
    setItemForm,
    setSpellForm,
    setFeatForm,
    setFeatBenefitsInput,
    openForm,
    closeForm,
    submitItem,
    submitSpell,
    submitFeat,
  } = useHomebrewForms();

  // ── Merge SRD + homebrew if showSRD is on ──
  const allItems = useMemo(() => {
    const homebrew = items;
    return showSRD ? [...SRD_ITEMS, ...homebrew] : homebrew;
  }, [items, showSRD]);

  const allSpells = useMemo(() => {
    const homebrew = spells;
    return showSRD ? [...SRD_SPELLS, ...homebrew] : homebrew;
  }, [spells, showSRD]);

  const allFeats = useMemo(() => {
    const homebrew = feats;
    return showSRD ? [...SRD_FEATS, ...homebrew] : homebrew;
  }, [feats, showSRD]);

  // ── Filtered lists ──
  const filteredItems = useMemo(
    () => filterList(allItems, search),
    [allItems, search]
  );
  const filteredSpells = useMemo(
    () => filterList(allSpells, search),
    [allSpells, search]
  );
  const filteredFeats = useMemo(
    () => filterList(allFeats, search),
    [allFeats, search]
  );

  const tabPlaceholder =
    activeTab === "items"
      ? "Search items..."
      : activeTab === "spells"
        ? "Search spells..."
        : "Search feats...";

  const tabCount =
    activeTab === "items"
      ? filteredItems.length
      : activeTab === "spells"
        ? filteredSpells.length
        : filteredFeats.length;

  // ── Duplicate ──
  const handleDuplicateItem = useCallback(
    (item: HomebrewItem) => {
      const now = Date.now();
      const copy: HomebrewItem = {
        ...item,
        id: `dup_${now}_${Math.random().toString(36).slice(2, 6)}`,
        name: `${item.name} (Copy)`,
        isHomebrew: true,
        source: "homebrew",
        createdAt: now,
        updatedAt: now,
      };
      store.addItem(copy);
      showToast({ message: `"${item.name}" duplicated`, type: "success" });
    },
    [store]
  );

  const handleDuplicateSpell = useCallback(
    (spell: HomebrewSpell) => {
      const now = Date.now();
      const copy: HomebrewSpell = {
        ...spell,
        id: `dup_${now}_${Math.random().toString(36).slice(2, 6)}`,
        name: `${spell.name} (Copy)`,
        isHomebrew: true,
        source: "homebrew",
        createdAt: now,
        updatedAt: now,
      };
      store.addSpell(copy);
      showToast({ message: `"${spell.name}" duplicated`, type: "success" });
    },
    [store]
  );

  const handleDuplicateFeat = useCallback(
    (feat: HomebrewFeat) => {
      const now = Date.now();
      const copy: HomebrewFeat = {
        ...feat,
        id: `dup_${now}_${Math.random().toString(36).slice(2, 6)}`,
        name: `${feat.name} (Copy)`,
        isHomebrew: true,
        source: "homebrew",
        createdAt: now,
        updatedAt: now,
      };
      store.addFeat(copy);
      showToast({ message: `"${feat.name}" duplicated`, type: "success" });
    },
    [store]
  );

  // ── Visibility toggle ──
  const toggleItemVisibility = useCallback(
    (id: string, visible: boolean) => {
      const item = items.find((i) => i.id === id);
      if (item) {
        store.removeItem(id);
        store.addItem({ ...item, visibleToPlayers: visible, updatedAt: Date.now() });
      }
    },
    [items, store]
  );
  const toggleSpellVisibility = useCallback(
    (id: string, visible: boolean) => {
      const spell = spells.find((s) => s.id === id);
      if (spell) {
        store.removeSpell(id);
        store.addSpell({ ...spell, visibleToPlayers: visible, updatedAt: Date.now() });
      }
    },
    [spells, store]
  );
  const toggleFeatVisibility = useCallback(
    (id: string, visible: boolean) => {
      const feat = feats.find((f) => f.id === id);
      if (feat) {
        store.removeFeat(id);
        store.addFeat({ ...feat, visibleToPlayers: visible, updatedAt: Date.now() });
      }
    },
    [feats, store]
  );

  // ── Export ──
  const handleExport = useCallback(() => {
    exportHomebrewToJSON(items, spells, feats, "Arkla");
    showToast({ message: `Exported ${items.length + spells.length + feats.length} entries`, type: "info" });
  }, [items, spells, feats]);

  // ── Import ──
  const handleImport = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const result = parseHomebrewJSON(text);
        if (!result.ok) {
          showToast({ message: `Import failed: ${result.error}`, type: "error", duration: 6000 });
          return;
        }
        const data = result.data;
        const mergedItems = mergeHomebrewImport(items, data.items, true);
        const mergedSpells = mergeHomebrewImport(spells, data.spells, true);
        const mergedFeats = mergeHomebrewImport(feats, data.feats, true);

        if (mergedItems.length > items.length || mergedSpells.length > spells.length || mergedFeats.length > feats.length) {
          mergedItems.forEach((item) => {
            if (!items.find((i) => i.id === item.id)) store.addItem(item as HomebrewItem);
          });
          mergedSpells.forEach((spell) => {
            if (!spells.find((s) => s.id === spell.id)) store.addSpell(spell as HomebrewSpell);
          });
          mergedFeats.forEach((feat) => {
            if (!feats.find((f) => f.id === feat.id)) store.addFeat(feat as HomebrewFeat);
          });
          showToast({
            message: `Imported ${mergedItems.length - items.length} items, ${mergedSpells.length - spells.length} spells, ${mergedFeats.length - feats.length} feats`,
            type: "success",
          });
        } else {
          showToast({ message: "No new entries found to import (duplicates skipped)", type: "info" });
        }
      };
      reader.onerror = () => {
        showToast({ message: "Import failed: Could not read file. Try a smaller file or different format.", type: "error", duration: 6000 });
      };
      reader.readAsText(file);
    },
    [items, spells, feats, store]
  );

  // ── Bulk delete ──
  const handleBulkDelete = useCallback(() => {
    const count = selectedIds.size;
    if (count === 0) return;

    let deletedNames: string[] = [];
    selectedIds.forEach((id) => {
      const item = items.find((i) => i.id === id);
      const spell = spells.find((s) => s.id === id);
      const feat = feats.find((f) => f.id === id);
      if (item) {
        store.removeItem(id);
        deletedNames.push(item.name);
      } else if (spell) {
        store.removeSpell(id);
        deletedNames.push(spell.name);
      } else if (feat) {
        store.removeFeat(id);
        deletedNames.push(feat.name);
      }
    });

    setSelectedIds(new Set());
    setIsBulkMode(false);
    showToast({
      message: `Deleted ${count} entr${count === 1 ? "y" : "ies"}: ${deletedNames.slice(0, 3).join(", ")}${count > 3 ? ` +${count - 3} more` : ""}`,
      type: "warning",
    });
  }, [selectedIds, items, spells, feats, store]);

  const handleToggleSelect = useCallback(
    (id: string) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    },
    []
  );

  const handleToggleBulkMode = useCallback(() => {
    setIsBulkMode((prev) => !prev);
    setSelectedIds(new Set());
  }, []);

  return (
    <div style={{ animation: "slide-in-up 0.35s ease-out both" }}>
      {/* ── Tab Bar + SRD Toggle ── */}
      <div className="flex items-center justify-between mb-3">
        <HomebrewTabs activeTab={activeTab} onChange={setActiveTab} />
        <label className="flex items-center gap-1.5 cursor-pointer group">
          <input
            type="checkbox"
            checked={showSRD}
            onChange={(e) => setShowSRD(e.target.checked)}
            className="rounded border-surface-600 bg-surface-800 accent-gold-500 w-3.5 h-3.5 transition-all duration-150"
          />
          <span className="text-[10px] text-surface-500 uppercase tracking-wider group-hover:text-surface-300 transition-colors">SRD</span>
        </label>
      </div>

      {/* ── Search + Actions Bar ── */}
      <HomebrewSearchBar
        search={search}
        onSearchChange={setSearch}
        onAdd={() => openForm("add", activeTab)}
        onExport={handleExport}
        onImport={handleImport}
        placeholder={tabPlaceholder}
        bulkDeleteCount={selectedIds.size}
        onBulkDelete={handleBulkDelete}
        isBulkMode={isBulkMode}
        onToggleBulkMode={handleToggleBulkMode}
      />

      {/* ── Tab Count Label ── */}
      <div className="text-[10px] text-surface-500 mb-3 tabular-nums">
        {tabCount} {activeTab}
      </div>

      {/* ── Tab Panel ── */}
      <HomebrewTabPanel
        activeTab={activeTab}
        items={filteredItems}
        spells={filteredSpells}
        feats={filteredFeats}
        onEditItem={(i) => openForm("edit", "items", i)}
        onEditSpell={(s) => openForm("edit", "spells", s)}
        onEditFeat={(f) => openForm("edit", "feats", f)}
        onDeleteItem={(id) => {
          const name = items.find((i) => i.id === id)?.name ?? "Item";
          store.removeItem(id);
          showToast({ message: `"${name}" deleted`, type: "warning" });
        }}
        onDeleteSpell={(id) => {
          const name = spells.find((s) => s.id === id)?.name ?? "Spell";
          store.removeSpell(id);
          showToast({ message: `"${name}" deleted`, type: "warning" });
        }}
        onDeleteFeat={(id) => {
          const name = feats.find((f) => f.id === id)?.name ?? "Feat";
          store.removeFeat(id);
          showToast({ message: `"${name}" deleted`, type: "warning" });
        }}
        onDuplicateItem={handleDuplicateItem}
        onDuplicateSpell={handleDuplicateSpell}
        onDuplicateFeat={handleDuplicateFeat}
        onToggleItemVisibility={toggleItemVisibility}
        onToggleSpellVisibility={toggleSpellVisibility}
        onToggleFeatVisibility={toggleFeatVisibility}
        isBulkMode={isBulkMode}
        selectedIds={selectedIds}
        onToggleSelect={handleToggleSelect}
      />

      {/* ── Form Modals ── */}
      {formMode && formType === "items" && (
        <HomebrewItemForm
          form={itemForm}
          onChange={setItemForm}
          onSubmit={submitItem}
          onClose={closeForm}
          isEdit={formMode === "edit"}
        />
      )}
      {formMode && formType === "spells" && (
        <HomebrewSpellForm
          form={spellForm}
          onChange={setSpellForm}
          onSubmit={submitSpell}
          onClose={closeForm}
          isEdit={formMode === "edit"}
        />
      )}
      {formMode && formType === "feats" && (
        <HomebrewFeatForm
          form={featForm}
          benefitsInput={featBenefitsInput}
          onBenefitsChange={setFeatBenefitsInput}
          onChange={setFeatForm}
          onSubmit={submitFeat}
          onClose={closeForm}
          isEdit={formMode === "edit"}
        />
      )}
    </div>
  );
}

/** Search filter that matches name, description, tags, category, and school */
function filterList<T extends { name: string; description: string; tags?: string[]; category?: string; school?: string }>(
  list: T[],
  search: string
): T[] {
  const q = search.toLowerCase().trim();
  if (!q) return list;
  return list.filter((entry) => {
    if (entry.name.toLowerCase().includes(q)) return true;
    if (entry.description.toLowerCase().includes(q)) return true;
    if (entry.tags?.some((t) => t.includes(q))) return true;
    if (entry.category?.toLowerCase().includes(q)) return true;
    if (entry.school?.toLowerCase().includes(q)) return true;
    return false;
  });
}
