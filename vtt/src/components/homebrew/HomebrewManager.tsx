/**
 * STᚱ VTT — Homebrew Manager
 *
 * Full CRUD panel for homebrew items, spells, and feats.
 * Orchestrates sub-components for cards, forms, and filtering.
 */

import { useState, useMemo, useCallback } from "react";
import { useCompendiumStore } from "@/stores/compendium/compendiumStore";
import { Plus, Search } from "lucide-react";
import type { HomebrewItem, HomebrewSpell, HomebrewFeat } from "@/types/homebrew";
import HomebrewItemCard from "./HomebrewItemCard";
import HomebrewSpellCard from "./HomebrewSpellCard";
import HomebrewFeatCard from "./HomebrewFeatCard";
import HomebrewItemForm from "./HomebrewItemForm";
import HomebrewSpellForm from "./HomebrewSpellForm";
import HomebrewFeatForm from "./HomebrewFeatForm";

type TabId = "items" | "spells" | "feats";
type FormMode = "add" | "edit" | null;

const emptyItem: Omit<HomebrewItem, "id" | "createdAt" | "updatedAt"> = {
  name: "", category: "other", rarity: "common", description: "",
  flavorText: "", requiresAttunement: false, weight: 0, value: 0,
  isCursed: false, tags: [], source: "homebrew", isHomebrew: true,
};

const emptySpell: Omit<HomebrewSpell, "id" | "createdAt" | "updatedAt"> = {
  name: "", level: 1, school: "Evocation", castingTime: "1 action",
  ritual: false, components: ["V", "S"], concentration: false,
  duration: "Instantaneous", range: "60 feet", classes: [], description: "",
  isHomebrew: true, source: "homebrew", tags: [],
};

const emptyFeat: Omit<HomebrewFeat, "id" | "createdAt" | "updatedAt"> = {
  name: "", description: "", prerequisites: [], benefits: [],
  repeatable: false, tags: [], source: "homebrew", isHomebrew: true,
};

export default function HomebrewManager() {
  const { items, spells, feats, addItem, addSpell, addFeat, removeItem, removeSpell, removeFeat } = useCompendiumStore();
  const [activeTab, setActiveTab] = useState<TabId>("items");
  const [search, setSearch] = useState("");

  // Form state
  const [formMode, setFormMode] = useState<FormMode>(null);
  const [formType, setFormType] = useState<TabId>("items");
  const [editId, setEditId] = useState<string | undefined>();

  const [itemForm, setItemForm] = useState(emptyItem);
  const [spellForm, setSpellForm] = useState(emptySpell);
  const [featForm, setFeatForm] = useState(emptyFeat);
  const [featBenefitsInput, setFeatBenefitsInput] = useState("");

  const filteredItems = useMemo(() => {
    if (!search) return items;
    return items.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()));
  }, [items, search]);

  const filteredSpells = useMemo(() => {
    if (!search) return spells;
    return spells.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()));
  }, [spells, search]);

  const filteredFeats = useMemo(() => {
    if (!search) return feats;
    return feats.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()));
  }, [feats, search]);

  const openForm = useCallback((mode: "add" | "edit", type: TabId, existing?: HomebrewItem | HomebrewSpell | HomebrewFeat) => {
    setFormMode(mode);
    setFormType(type);
    setEditId(existing?.id);
    if (type === "items") {
      const e = existing as HomebrewItem | undefined;
      setItemForm(e ? { name: e.name, category: e.category, rarity: e.rarity, description: e.description, flavorText: e.flavorText || "", requiresAttunement: e.requiresAttunement, weight: e.weight, value: e.value, isCursed: e.isCursed, tags: e.tags, source: e.source, isHomebrew: e.isHomebrew } : emptyItem);
    } else if (type === "spells") {
      const e = existing as HomebrewSpell | undefined;
      setSpellForm(e ? { name: e.name, level: e.level, school: e.school, castingTime: e.castingTime, ritual: e.ritual, components: e.components, concentration: e.concentration, duration: e.duration, range: e.range, classes: e.classes, description: e.description, isHomebrew: e.isHomebrew, source: e.source, tags: e.tags } : emptySpell);
    } else {
      const e = existing as HomebrewFeat | undefined;
      setFeatForm(e ? { name: e.name, description: e.description, prerequisites: e.prerequisites, benefits: e.benefits, repeatable: e.repeatable, tags: e.tags, source: e.source, isHomebrew: e.isHomebrew } : emptyFeat);
      setFeatBenefitsInput(e ? e.benefits.join("\n") : "");
    }
  }, []);

  const closeForm = useCallback(() => {
    setFormMode(null);
    setFormType("items");
    setEditId(undefined);
  }, []);

  const submitItem = useCallback(() => {
    if (!itemForm.name.trim()) return;
    const now = Date.now();
    const newItem: HomebrewItem = { ...itemForm, id: editId || `hb_${now}_${Math.random().toString(36).slice(2, 6)}`, createdAt: now, updatedAt: now };
    if (editId) removeItem(editId);
    addItem(newItem);
    closeForm();
  }, [itemForm, editId, addItem, removeItem, closeForm]);

  const submitSpell = useCallback(() => {
    if (!spellForm.name.trim()) return;
    const now = Date.now();
    const newSpell: HomebrewSpell = { ...spellForm, id: editId || `hb_${now}_${Math.random().toString(36).slice(2, 6)}`, createdAt: now, updatedAt: now };
    if (editId) removeSpell(editId);
    addSpell(newSpell);
    closeForm();
  }, [spellForm, editId, addSpell, removeSpell, closeForm]);

  const submitFeat = useCallback(() => {
    if (!featForm.name.trim()) return;
    const now = Date.now();
    const benefits = featBenefitsInput.split("\n").map((b) => b.trim()).filter(Boolean);
    const newFeat: HomebrewFeat = { ...featForm, benefits, id: editId || `hb_${now}_${Math.random().toString(36).slice(2, 6)}`, createdAt: now, updatedAt: now };
    if (editId) removeFeat(editId);
    addFeat(newFeat);
    closeForm();
  }, [featForm, featBenefitsInput, editId, addFeat, removeFeat, closeForm]);

  const activeList = activeTab === "items" ? filteredItems : activeTab === "spells" ? filteredSpells : filteredFeats;
  const tabCount = activeList.length;

  return (
    <div>
      {/* Tabs */}
      <div className="flex items-center gap-2 mb-4">
        {(["items", "spells", "feats"] as TabId[]).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 border ${
              activeTab === tab ? "bg-accent-600/15 text-accent-300 border-accent-500/20" : "text-surface-400 hover:text-surface-200 border-transparent hover:border-surface-700/30"
            }`}>
            {tab === "items" ? "📦 Items" : tab === "spells" ? "🔮 Spells" : "🏅 Feats"}
          </button>
        ))}
      </div>

      {/* Search + Add */}
      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-surface-500" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`Search ${activeTab}...`} className="input-arcane w-full pl-9 pr-4 py-2 text-xs" />
        </div>
        <button onClick={() => openForm("add", activeTab)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-accent-600/15 border border-accent-500/20 text-accent-300 text-xs font-semibold active:scale-95 transition-all hover:bg-accent-600/25">
          <Plus className="w-3.5 h-3.5" />
          <span>Add</span>
        </button>
      </div>

      <div className="text-[10px] text-surface-500 mb-3">{tabCount} {activeTab}</div>

      {/* List */}
      {activeList.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-surface-500 text-sm">No {activeTab} yet</p>
          <p className="text-surface-600 text-xs mt-1">Create your first {activeTab.slice(0, -1)}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {activeTab === "items" && (filteredItems as HomebrewItem[]).map((item) => (
            <HomebrewItemCard key={item.id} item={item} onEdit={(i) => openForm("edit", "items", i)} onDelete={removeItem} />
          ))}
          {activeTab === "spells" && (filteredSpells as HomebrewSpell[]).map((spell) => (
            <HomebrewSpellCard key={spell.id} spell={spell} onEdit={(s) => openForm("edit", "spells", s)} onDelete={removeSpell} />
          ))}
          {activeTab === "feats" && (filteredFeats as HomebrewFeat[]).map((feat) => (
            <HomebrewFeatCard key={feat.id} feat={feat} onEdit={(f) => openForm("edit", "feats", f)} onDelete={removeFeat} />
          ))}
        </div>
      )}

      {/* Form Modals */}
      {formMode && formType === "items" && (
        <HomebrewItemForm form={itemForm} onChange={setItemForm} onSubmit={submitItem} onClose={closeForm} isEdit={formMode === "edit"} />
      )}
      {formMode && formType === "spells" && (
        <HomebrewSpellForm form={spellForm} onChange={setSpellForm} onSubmit={submitSpell} onClose={closeForm} isEdit={formMode === "edit"} />
      )}
      {formMode && formType === "feats" && (
        <HomebrewFeatForm form={featForm} benefitsInput={featBenefitsInput} onBenefitsChange={setFeatBenefitsInput} onChange={setFeatForm} onSubmit={submitFeat} onClose={closeForm} isEdit={formMode === "edit"} />
      )}
    </div>
  );
}
