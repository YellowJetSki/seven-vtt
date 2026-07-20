/**
 * STᚱ VTT — Global Compendium (Premium Edition v3)
 *
 * Premium global compendium panel with:
 * - Glass gradient header with edge light
 * - Tab navigation (Items/Spells/Feats) with gold active state
 * - Category + school filter selects with gold focus
 * - Show SRD toggle
 * - Draggable card list with premium cards
 * - Compact/expand toggle
 * - Footer with count + hint
 * - Uniform glass gradient consistent with design system
 * - Staggered entrance animations
 * - Consistent with premium design system glass tokens
 */

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
      {/* ── Header ── */}
      <div className="relative mb-4 pb-3 border-b border-white/[0.04]">
        <div className="absolute top-0 left-[20%] right-[20%] h-px bg-gradient-to-r from-transparent via-gold-500/15 to-transparent" />
        <div className="flex items-center gap-3 pt-1">
          <div className="flex items-center gap-2">
            <span className="w-1 h-4 rounded-full bg-amber-500/40" />
            <h2 className="text-lg font-black text-gold drop-shadow-[0_0_8px_rgba(234,179,8,0.1)]">
              Global Compendium
            </h2>
          </div>
          <button
            onClick={() => setCompact(!compact)}
            className="ml-auto text-surface-500 hover:text-surface-200 transition-colors text-xs px-2 py-1 rounded-lg border border-surface-700/30 hover:border-gold/15 active:scale-95"
          >
            {compact ? "Expand" : "Compact"}
          </button>
        </div>
      </div>

      {/* ── Search + filters ── */}
      <div className="space-y-3 mb-4">
        <CompendiumSearchBar value={searchQuery} onChange={setSearch} />

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] uppercase tracking-widest text-surface-500 font-black">Tab:</span>
          {(["items", "spells", "feats"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 active:scale-90 ${
                activeTab === tab
                  ? "bg-gold-500/10 text-gold-400 border border-gold/25"
                  : "text-surface-400 hover:text-surface-200 border border-transparent hover:border-gold/15"
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
                className="bg-gradient-to-b from-[#0c0d15]/80 to-[#07080d]/90 border border-surface-700/30 rounded-lg text-surface-200 text-xs py-1.5 px-2 focus:outline-none focus:border-gold/25 focus:ring-1 focus:ring-gold/15"
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
                className="bg-gradient-to-b from-[#0c0d15]/80 to-[#07080d]/90 border border-surface-700/30 rounded-lg text-surface-200 text-xs py-1.5 px-2 focus:outline-none focus:border-gold/25 focus:ring-1 focus:ring-gold/15"
              >
                <option value="">All</option>
                {SPELL_SCHOOLS.map((s) => (<option key={s} value={s}>{s}</option>))}
              </select>
            </>
          )}
          <div className="flex-1" />
          <label className="flex items-center gap-1.5 cursor-pointer group">
            <input
              type="checkbox"
              checked={showSRD}
              onChange={toggleSRD}
              className="rounded border-surface-600 bg-surface-800 accent-gold-500 transition-all duration-200"
            />
            <span className="text-[10px] text-surface-500 uppercase tracking-wider group-hover:text-surface-400 transition-colors">Show SRD</span>
          </label>
        </div>
      </div>

      {/* ── Results ── */}
      <div className={`flex-1 overflow-y-auto space-y-2 scrollbar-gold ${compact ? "max-h-64" : ""}`}>
        {activeTab === "items" && (
          items.length > 0
            ? items.map((item, idx) => (
                <CompendiumCard
                  key={item.id}
                  entry={{ type: "item", data: item }}
                  onDragStart={setDraggedItem}
                  index={idx}
                />
              ))
            : <p className="text-surface-500 text-sm text-center py-8 italic">No items match your search.</p>
        )}
        {activeTab === "spells" && (
          spells.length > 0
            ? spells.map((spell, idx) => (
                <CompendiumCard
                  key={spell.id}
                  entry={{ type: "spell", data: spell }}
                  onDragStart={setDraggedItem}
                  index={idx}
                />
              ))
            : <p className="text-surface-500 text-sm text-center py-8 italic">No spells match your search.</p>
        )}
        {activeTab === "feats" && (
          feats.length > 0
            ? feats.map((feat, idx) => (
                <CompendiumCard
                  key={feat.id}
                  entry={{ type: "feat", data: feat }}
                  onDragStart={setDraggedItem}
                  index={idx}
                />
              ))
            : <p className="text-surface-500 text-sm text-center py-8 italic">No feats match your search.</p>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.04]">
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
