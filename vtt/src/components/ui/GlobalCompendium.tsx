import { useState } from "react";
import { useCompendiumStore, getCompendiumItems, getCompendiumSpells, getCompendiumFeats, ITEM_CATEGORIES, SPELL_SCHOOLS } from "@/stores/compendium";
import CompendiumSearchBar from "./CompendiumSearchBar";
import CompendiumCard from "./CompendiumCard";

export default function GlobalCompendium() {
  const store = useCompendiumStore();
  const { activeTab, searchQuery, categoryFilter, schoolFilter, showSRD, setSearch, setTab, setCategoryFilter, setSchoolFilter, toggleSRD, setDraggedItem } = store;

  const [compact, setCompact] = useState(false);

  const items = getCompendiumItems(store.items, { searchQuery, categoryFilter, schoolFilter, showSRD });
  const spells = getCompendiumSpells(store.spells, { searchQuery, categoryFilter, schoolFilter, showSRD });
  const feats = getCompendiumFeats(store.feats, { searchQuery, categoryFilter, schoolFilter, showSRD });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-lg font-black text-gradient-arcane">Global Compendium</h2>
        <button
          onClick={() => setCompact(!compact)}
          className="ml-auto text-surface-500 hover:text-surface-200 transition-colors text-xs px-2 py-1 rounded-lg border border-surface-700/30"
        >
          {compact ? "Expand" : "Compact"}
        </button>
      </div>

      {/* Search + filters */}
      <div className="space-y-3 mb-4">
        <CompendiumSearchBar value={searchQuery} onChange={setSearch} />
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-widest text-surface-500 font-black">Tab:</span>
          {(["items", "spells", "feats"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                activeTab === tab
                  ? "bg-accent-600/15 text-accent-300 border border-accent-500/20"
                  : "text-surface-400 hover:text-surface-200 border border-transparent hover:border-surface-700/30"
              }`}
            >
              {tab === "items" ? "📦 Items" : tab === "spells" ? "🔮 Spells" : "🏅 Feats"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {activeTab === "items" && (
            <>
              <span className="text-[10px] uppercase tracking-widest text-surface-500 font-black">Category:</span>
              <select
                value={categoryFilter ?? ""}
                onChange={(e) => setCategoryFilter(e.target.value || null)}
                className="input-arcane py-1 px-2 text-xs w-auto"
              >
                <option value="">All</option>
                {ITEM_CATEGORIES.map((c) => (<option key={c} value={c}>{c}</option>))}
              </select>
            </>
          )}
          {activeTab === "spells" && (
            <>
              <span className="text-[10px] uppercase tracking-widest text-surface-500 font-black">School:</span>
              <select
                value={schoolFilter ?? ""}
                onChange={(e) => setSchoolFilter(e.target.value || null)}
                className="input-arcane py-1 px-2 text-xs w-auto"
              >
                <option value="">All</option>
                {SPELL_SCHOOLS.map((s) => (<option key={s} value={s}>{s}</option>))}
              </select>
            </>
          )}
          <div className="flex-1" />
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={showSRD}
              onChange={toggleSRD}
              className="rounded border-surface-600 bg-surface-800 accent-accent-500"
            />
            <span className="text-[10px] text-surface-500 uppercase tracking-wider">Show SRD</span>
          </label>
        </div>
      </div>

      {/* Results */}
      <div className={`flex-1 overflow-y-auto space-y-2 ${compact ? "max-h-64" : ""}`}>
        {activeTab === "items" && (items.length > 0 ? items.map((item) => (
          <CompendiumCard
            key={item.id}
            entry={{ type: "item", data: item }}
            onDragStart={setDraggedItem}
          />
        )) : (
          <p className="text-surface-500 text-sm text-center py-8 italic">No items match your search.</p>
        ))}
        {activeTab === "spells" && (spells.length > 0 ? spells.map((spell) => (
          <CompendiumCard
            key={spell.id}
            entry={{ type: "spell", data: spell }}
            onDragStart={setDraggedItem}
          />
        )) : (
          <p className="text-surface-500 text-sm text-center py-8 italic">No spells match your search.</p>
        ))}
        {activeTab === "feats" && (feats.length > 0 ? feats.map((feat) => (
          <CompendiumCard
            key={feat.id}
            entry={{ type: "feat", data: feat }}
            onDragStart={setDraggedItem}
          />
        )) : (
          <p className="text-surface-500 text-sm text-center py-8 italic">No feats match your search.</p>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-surface-700/20">
        <span className="text-[10px] text-surface-500">
          {activeTab === "items" ? `${items.length} items` : activeTab === "spells" ? `${spells.length} spells` : `${feats.length} feats`}
        </span>
        <span className="text-[10px] text-surface-600">
          Drag items to character sheets
        </span>
      </div>
    </div>
  );
}
