/**
 * STᚱ VTT — CompendiumDrawer (Lusion-Grade Orchestrator)
 *
 * Premium slide-in drawer for the global SRD/homebrew compendium.
 * All sub-components are extracted for reusability:
 *   - CompendiumToggleButton  — floating book icon with pulse dot
 *   - CompendiumHeader        — title bar with close button
 *   - CompendiumSearchBar     — premium search with focus glow
 *   - CompendiumTabBar        — animated gold pill tab bar
 *   - CompendiumFilters       — category/school chip filters + SRD toggle
 *   - CompendiumResultList    — scrollable results with empty state
 *
 * Features:
 * - Glass-gold multi-layer depth with edge lighting
 * - Staggered entrance animations
 * - Drag-and-drop support for player sheets
 * - Smooth slide-in/out transition (300ms cubic-bezier)
 * - Backdrop dismiss on overlay click
 */

import { useState } from "react";
import { useCompendiumStore, getCompendiumItems, getCompendiumSpells, getCompendiumFeats } from "@/stores/compendium";
import CompendiumToggleButton from "@/components/ui/CompendiumToggleButton";
import CompendiumHeader from "@/components/ui/CompendiumHeader";
import CompendiumSearchBar from "@/components/ui/CompendiumSearchBar";
import CompendiumTabBar from "@/components/ui/CompendiumTabBar";
import CompendiumFilters from "@/components/ui/CompendiumFilters";
import CompendiumResultList from "@/components/ui/CompendiumResultList";

const TABS = [
  { id: "items", label: "Items", icon: "📦" },
  { id: "spells", label: "Spells", icon: "🔮" },
  { id: "feats", label: "Feats", icon: "🏅" },
];

export default function CompendiumDrawer() {
  const [open, setOpen] = useState(false);

  const store = useCompendiumStore();
  const {
    activeTab, searchQuery, categoryFilter, schoolFilter, showSRD,
    setSearch, setTab, setCategoryFilter, setSchoolFilter, toggleSRD, setDraggedItem,
  } = store;

  const items = getCompendiumItems(store.items, { searchQuery, categoryFilter, schoolFilter, showSRD });
  const spells = getCompendiumSpells(store.spells, { searchQuery, categoryFilter, schoolFilter, showSRD });
  const feats = getCompendiumFeats(store.feats, { searchQuery, categoryFilter, schoolFilter, showSRD });

  const handleClose = () => setOpen(false);

  return (
    <>
      {/* ── Toggle Button ── */}
      <CompendiumToggleButton isOpen={open} onClick={() => setOpen(!open)} />

      {/* ── Backdrop Overlay ── */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm animate-slide-in-from-right"
          onClick={handleClose}
          aria-hidden="true"
        />
      )}

      {/* ── Drawer Panel ── */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[420px] z-50
          bg-gradient-to-bl from-[#14151f]/[0.95] to-[#0f101a]/[0.98]
          backdrop-blur-2xl border-l border-white/[0.06]
          shadow-[-8px_0_48px_rgba(0,0,0,0.3)]
          transform transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
          ${open ? "translate-x-0" : "translate-x-full"}
          flex flex-col`}
      >
        {/* Gold edge light on left side */}
        <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-gold-500/15 to-transparent pointer-events-none" />

        {/* Ambient glow at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-gold-500/[0.015] to-transparent pointer-events-none" />

        <div className="flex flex-col h-full min-h-0 p-5 relative z-10">
          {/* ── Header ── */}
          <CompendiumHeader onClose={handleClose} />

          {/* ── Tab Bar ── */}
          <div className="animate-slide-in-from-bottom" style={{ animationDelay: "40ms" }}>
            <CompendiumTabBar
              tabs={TABS}
              activeTab={activeTab}
              onTabChange={(tabId: string) => setTab(tabId as "items" | "spells" | "feats")}
            />
          </div>

          {/* ── Search ── */}
          <div className="mt-3 animate-slide-in-from-bottom" style={{ animationDelay: "60ms" }}>
            <CompendiumSearchBar value={searchQuery} onChange={setSearch} />
          </div>

          {/* ── Filters ── */}
          <div className="mt-3 mb-3">
            <CompendiumFilters
              activeTab={activeTab}
              categoryFilter={categoryFilter}
              schoolFilter={schoolFilter}
              showSRD={showSRD}
              onCategoryChange={setCategoryFilter}
              onSchoolChange={setSchoolFilter}
              onToggleSRD={toggleSRD}
            />
          </div>

          {/* ── Results ── */}
          <div className="flex-1 overflow-hidden animate-slide-in-from-bottom" style={{ animationDelay: "100ms" }}>
            {activeTab === "items" && (
              <CompendiumResultList
                entries={items.map((i) => ({ type: "item" as const, data: i }))}
                onDragStart={setDraggedItem}
                countLabel={`${items.length} items`}
                emptyMessage="No items match your search."
              />
            )}
            {activeTab === "spells" && (
              <CompendiumResultList
                entries={spells.map((s) => ({ type: "spell" as const, data: s }))}
                onDragStart={setDraggedItem}
                countLabel={`${spells.length} spells`}
                emptyMessage="No spells match your search."
              />
            )}
            {activeTab === "feats" && (
              <CompendiumResultList
                entries={feats.map((f) => ({ type: "feat" as const, data: f }))}
                onDragStart={setDraggedItem}
                countLabel={`${feats.length} feats`}
                emptyMessage="No feats match your search."
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
