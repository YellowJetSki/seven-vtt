/**
 * STᚱ VTT — Homebrew Manager
 *
 * Full CRUD panel for homebrew items, spells, and feats.
 * Mobile-first responsive design with tabbed interface.
 * Each entry can be added, edited, and deleted with full detail forms.
 */

import { useState, useCallback, useMemo } from "react";
import { useCompendiumStore } from "@/stores/compendium/compendiumStore";
import { Plus, Edit3, Trash2, X, Check, Search } from "lucide-react";
import type { HomebrewItem, HomebrewSpell, HomebrewFeat, FeatPrerequisite } from "@/types/homebrew";

type TabId = "items" | "spells" | "feats";
type FormMode = "add" | "edit" | null;

interface FormState {
  mode: FormMode;
  type: TabId;
  id?: string;
}

// ── Helpers ──
function generateId(): string {
  return `hb_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

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

const CATEGORIES = ["weapon", "armor", "potion", "scroll", "wand", "ring", "wondrous", "tool", "ammunition", "food", "poison", "other"];
const RARITIES = ["common", "uncommon", "rare", "very rare", "legendary", "artifact"];
const SCHOOLS = ["Abjuration", "Conjuration", "Divination", "Enchantment", "Evocation", "Illusion", "Necromancy", "Transmutation"];
const COMPONENTS = ["V", "S", "M"];

export default function HomebrewManager() {
  const { items, spells, feats, addItem, addSpell, addFeat, removeItem, removeSpell, removeFeat } = useCompendiumStore();
  const [activeTab, setActiveTab] = useState<TabId>("items");
  const [formState, setFormState] = useState<FormState>({ mode: null, type: "items" });
  const [search, setSearch] = useState("");

  // ── Form data ──
  const [itemForm, setItemForm] = useState(emptyItem);
  const [spellForm, setSpellForm] = useState(emptySpell);
  const [featForm, setFeatForm] = useState(emptyFeat);
  const [featBenefitsInput, setFeatBenefitsInput] = useState("");

  // ── Filtered lists ──
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

  // ── Open form for add/edit ──
  const openForm = useCallback((mode: "add" | "edit", type: TabId, existing?: HomebrewItem | HomebrewSpell | HomebrewFeat) => {
    setFormState({ mode, type, id: existing?.id });
    if (type === "items") {
      if (existing) {
        const e = existing as HomebrewItem;
        setItemForm({ name: e.name, category: e.category, rarity: e.rarity, description: e.description, flavorText: e.flavorText || "", requiresAttunement: e.requiresAttunement, weight: e.weight, value: e.value, isCursed: e.isCursed, tags: e.tags, source: e.source, isHomebrew: e.isHomebrew });
      } else {
        setItemForm(emptyItem);
      }
    } else if (type === "spells") {
      if (existing) {
        const e = existing as HomebrewSpell;
        setSpellForm({ name: e.name, level: e.level, school: e.school, castingTime: e.castingTime, ritual: e.ritual, components: e.components, concentration: e.concentration, duration: e.duration, range: e.range, classes: e.classes, description: e.description, isHomebrew: e.isHomebrew, source: e.source, tags: e.tags });
      } else {
        setSpellForm(emptySpell);
      }
    } else {
      if (existing) {
        const e = existing as HomebrewFeat;
        setFeatForm({ name: e.name, description: e.description, prerequisites: e.prerequisites, benefits: e.benefits, repeatable: e.repeatable, tags: e.tags, source: e.source, isHomebrew: e.isHomebrew });
        setFeatBenefitsInput(e.benefits.join("\n"));
      } else {
        setFeatForm(emptyFeat);
        setFeatBenefitsInput("");
      }
    }
  }, []);

  const closeForm = useCallback(() => {
    setFormState({ mode: null, type: "items" });
  }, []);

  // ── Submit form ──
  const submitItem = useCallback(() => {
    if (!itemForm.name.trim()) return;
    const now = Date.now();
    const newItem: HomebrewItem = { ...itemForm, id: formState.id || generateId(), createdAt: now, updatedAt: now };
    if (formState.mode === "edit" && formState.id) {
      removeItem(formState.id);
    }
    addItem(newItem);
    closeForm();
  }, [itemForm, formState, addItem, removeItem, closeForm]);

  const submitSpell = useCallback(() => {
    if (!spellForm.name.trim()) return;
    const now = Date.now();
    const newSpell: HomebrewSpell = { ...spellForm, id: formState.id || generateId(), createdAt: now, updatedAt: now };
    if (formState.mode === "edit" && formState.id) {
      removeSpell(formState.id);
    }
    addSpell(newSpell);
    closeForm();
  }, [spellForm, formState, addSpell, removeSpell, closeForm]);

  const submitFeat = useCallback(() => {
    if (!featForm.name.trim()) return;
    const now = Date.now();
    const benefits = featBenefitsInput.split("\n").map((b) => b.trim()).filter(Boolean);
    const newFeat: HomebrewFeat = { ...featForm, benefits, id: formState.id || generateId(), createdAt: now, updatedAt: now };
    if (formState.mode === "edit" && formState.id) {
      removeFeat(formState.id);
    }
    addFeat(newFeat);
    closeForm();
  }, [featForm, featBenefitsInput, formState, addFeat, removeFeat, closeForm]);

  // ── Render item card ──
  const renderItemCard = (item: HomebrewItem) => (
    <div key={item.id} className="premium-surface rounded-xl p-3 hover-lift group">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-surface-200 truncate">{item.name}</span>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${item.rarity === "legendary" ? "text-amber-400" : item.rarity === "rare" ? "text-mage-400" : item.rarity === "uncommon" ? "text-green-400" : "text-surface-400"}`}>
              {item.rarity}
            </span>
          </div>
          <p className="text-xs text-surface-500 mt-1 line-clamp-2">{item.description}</p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="text-[10px] uppercase tracking-wider bg-surface-700/40 text-surface-400 px-1.5 py-0.5 rounded">{item.category}</span>
            {item.requiresAttunement && <span className="text-[10px] text-accent-400 font-medium">⚡ Attunement</span>}
            <span className="text-[10px] text-surface-500">{item.weight} lb</span>
            <span className="text-[10px] text-divine-400">{item.value} gp</span>
          </div>
        </div>
        <div className="flex items-center gap-1 ml-2 shrink-0">
          <button onClick={() => openForm("edit", "items", item)} className="p-1.5 rounded-lg hover:bg-surface-700/50 text-surface-400 hover:text-accent-300 transition-all active:scale-90">
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => removeItem(item.id)} className="p-1.5 rounded-lg hover:bg-red-500/15 text-surface-400 hover:text-red-400 transition-all active:scale-90">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );

  // ── Render spell card ──
  const renderSpellCard = (spell: HomebrewSpell) => (
    <div key={spell.id} className="premium-surface rounded-xl p-3 hover-lift group">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-surface-200 truncate">{spell.name}</span>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${spell.level === 0 ? "text-surface-400" : spell.level <= 3 ? "text-green-400" : spell.level <= 6 ? "text-mage-400" : "text-red-400"}`}>
              {spell.level === 0 ? "Cantrip" : `Lv ${spell.level}`}
            </span>
          </div>
          <p className="text-xs text-surface-500 mt-1 line-clamp-2">{spell.school} · {spell.castingTime}</p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="text-[10px] uppercase tracking-wider bg-surface-700/40 text-surface-400 px-1.5 py-0.5 rounded">{spell.school}</span>
            <span className="text-[10px] text-surface-500">{spell.range}</span>
            <span className="text-[10px] text-accent-400">{spell.components?.join(" ")}</span>
            {spell.concentration && <span className="text-[10px] text-amber-400">Concentration</span>}
          </div>
        </div>
        <div className="flex items-center gap-1 ml-2 shrink-0">
          <button onClick={() => openForm("edit", "spells", spell)} className="p-1.5 rounded-lg hover:bg-surface-700/50 text-surface-400 hover:text-accent-300 transition-all active:scale-90">
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => removeSpell(spell.id)} className="p-1.5 rounded-lg hover:bg-red-500/15 text-surface-400 hover:text-red-400 transition-all active:scale-90">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );

  // ── Render feat card ──
  const renderFeatCard = (feat: HomebrewFeat) => (
    <div key={feat.id} className="premium-surface rounded-xl p-3 hover-lift group">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-surface-200 truncate">{feat.name}</span>
          </div>
          <p className="text-xs text-surface-500 mt-1 line-clamp-2">{feat.description}</p>
          {feat.prerequisites && feat.prerequisites.length > 0 && (
            <div className="flex gap-1 mt-1.5">
              {feat.prerequisites.map((p, i) => (
                <span key={i} className="text-[10px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded">{p.description}</span>
              ))}
            </div>
          )}
          {feat.benefits && feat.benefits.length > 0 && (
            <p className="text-[10px] text-surface-400 mt-1">✓ {feat.benefits[0]}{feat.benefits.length > 1 ? ` +${feat.benefits.length - 1} more` : ""}</p>
          )}
        </div>
        <div className="flex items-center gap-1 ml-2 shrink-0">
          <button onClick={() => openForm("edit", "feats", feat)} className="p-1.5 rounded-lg hover:bg-surface-700/50 text-surface-400 hover:text-accent-300 transition-all active:scale-90">
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => removeFeat(feat.id)} className="p-1.5 rounded-lg hover:bg-red-500/15 text-surface-400 hover:text-red-400 transition-all active:scale-90">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );

  // ── Render form modal ──
  const renderForm = () => {
    if (!formState.mode) return null;
    const isAdd = formState.mode === "add";
    const title = isAdd ? `New ${formState.type.slice(0, -1)}` : `Edit ${formState.type.slice(0, -1)}`;

    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="w-full sm:max-w-lg bg-surface-900 border border-surface-700/30 rounded-t-2xl sm:rounded-2xl max-h-[85vh] overflow-y-auto shadow-2xl shadow-accent-500/5">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-surface-700/20">
            <span className="text-sm font-bold text-gradient-arcane">{title}</span>
            <button onClick={closeForm} className="p-1.5 rounded-lg hover:bg-surface-700/50 text-surface-400 active:scale-90 transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 space-y-3">
            {formState.type === "items" && (
              <>
                <div>
                  <label className="text-[10px] uppercase tracking-widest font-black text-surface-400 block mb-1">Name</label>
                  <input value={itemForm.name} onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })} className="input-arcane w-full py-2 px-3 text-sm" placeholder="Item name" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-black text-surface-400 block mb-1">Category</label>
                    <select value={itemForm.category} onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })} className="input-arcane w-full py-2 px-3 text-sm">
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-black text-surface-400 block mb-1">Rarity</label>
                    <select value={itemForm.rarity} onChange={(e) => setItemForm({ ...itemForm, rarity: e.target.value })} className="input-arcane w-full py-2 px-3 text-sm">
                      {RARITIES.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest font-black text-surface-400 block mb-1">Description</label>
                  <textarea value={itemForm.description} onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })} className="input-arcane w-full py-2 px-3 text-sm resize-none h-20" placeholder="Item description" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-black text-surface-400 block mb-1">Weight (lb)</label>
                    <input type="number" value={itemForm.weight} onChange={(e) => setItemForm({ ...itemForm, weight: Number(e.target.value) })} className="input-arcane w-full py-2 px-3 text-sm" />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-black text-surface-400 block mb-1">Value (gp)</label>
                    <input type="number" value={itemForm.value} onChange={(e) => setItemForm({ ...itemForm, value: Number(e.target.value) })} className="input-arcane w-full py-2 px-3 text-sm" />
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={itemForm.requiresAttunement} onChange={(e) => setItemForm({ ...itemForm, requiresAttunement: e.target.checked })} className="rounded border-surface-600 bg-surface-800 accent-accent-500" />
                  <span className="text-xs text-surface-300">Requires Attunement</span>
                </label>
                <button onClick={submitItem} className="w-full py-2.5 rounded-xl bg-accent-600/20 border border-accent-500/20 text-accent-300 text-sm font-semibold active:scale-[0.97] transition-all flex items-center justify-center gap-2">
                  <Check className="w-4 h-4" />
                  {isAdd ? "Create Item" : "Update Item"}
                </button>
              </>
            )}

            {formState.type === "spells" && (
              <>
                <div>
                  <label className="text-[10px] uppercase tracking-widest font-black text-surface-400 block mb-1">Name</label>
                  <input value={spellForm.name} onChange={(e) => setSpellForm({ ...spellForm, name: e.target.value })} className="input-arcane w-full py-2 px-3 text-sm" placeholder="Spell name" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-black text-surface-400 block mb-1">Level</label>
                    <input type="number" min={0} max={9} value={spellForm.level} onChange={(e) => setSpellForm({ ...spellForm, level: Number(e.target.value) })} className="input-arcane w-full py-2 px-3 text-sm" />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-black text-surface-400 block mb-1">School</label>
                    <select value={spellForm.school} onChange={(e) => setSpellForm({ ...spellForm, school: e.target.value })} className="input-arcane w-full py-2 px-3 text-sm">
                      {SCHOOLS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest font-black text-surface-400 block mb-1">Description</label>
                  <textarea value={spellForm.description} onChange={(e) => setSpellForm({ ...spellForm, description: e.target.value })} className="input-arcane w-full py-2 px-3 text-sm resize-none h-20" placeholder="Spell description" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-black text-surface-400 block mb-1">Casting Time</label>
                    <input value={spellForm.castingTime} onChange={(e) => setSpellForm({ ...spellForm, castingTime: e.target.value })} className="input-arcane w-full py-2 px-3 text-sm" placeholder="1 action" />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-black text-surface-400 block mb-1">Range</label>
                    <input value={spellForm.range} onChange={(e) => setSpellForm({ ...spellForm, range: e.target.value })} className="input-arcane w-full py-2 px-3 text-sm" placeholder="60 feet" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-black text-surface-400 block mb-1">Duration</label>
                    <input value={spellForm.duration} onChange={(e) => setSpellForm({ ...spellForm, duration: e.target.value })} className="input-arcane w-full py-2 px-3 text-sm" placeholder="Instantaneous" />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-black text-surface-400 block mb-1">Components</label>
                    <div className="flex gap-1 mt-1">
                      {COMPONENTS.map((c) => (
                        <button key={c} onClick={() => setSpellForm({ ...spellForm, components: spellForm.components.includes(c) ? spellForm.components.filter((x) => x !== c) : [...spellForm.components, c] })}
                          className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all ${spellForm.components.includes(c) ? "bg-accent-600/20 border-accent-500/30 text-accent-300" : "bg-surface-800/30 border-surface-700/20 text-surface-400"}`}
                        >{c}</button>
                      ))}
                    </div>
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={spellForm.concentration} onChange={(e) => setSpellForm({ ...spellForm, concentration: e.target.checked })} className="rounded border-surface-600 bg-surface-800 accent-accent-500" />
                  <span className="text-xs text-surface-300">Requires Concentration</span>
                </label>
                <button onClick={submitSpell} className="w-full py-2.5 rounded-xl bg-accent-600/20 border border-accent-500/20 text-accent-300 text-sm font-semibold active:scale-[0.97] transition-all flex items-center justify-center gap-2">
                  <Check className="w-4 h-4" />
                  {isAdd ? "Create Spell" : "Update Spell"}
                </button>
              </>
            )}

            {formState.type === "feats" && (
              <>
                <div>
                  <label className="text-[10px] uppercase tracking-widest font-black text-surface-400 block mb-1">Name</label>
                  <input value={featForm.name} onChange={(e) => setFeatForm({ ...featForm, name: e.target.value })} className="input-arcane w-full py-2 px-3 text-sm" placeholder="Feat name" />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest font-black text-surface-400 block mb-1">Description</label>
                  <textarea value={featForm.description} onChange={(e) => setFeatForm({ ...featForm, description: e.target.value })} className="input-arcane w-full py-2 px-3 text-sm resize-none h-16" placeholder="Feat description" />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest font-black text-surface-400 block mb-1">Benefits (one per line)</label>
                  <textarea value={featBenefitsInput} onChange={(e) => setFeatBenefitsInput(e.target.value)} className="input-arcane w-full py-2 px-3 text-sm resize-none h-20" placeholder="+1 to Strength&#10;Proficiency in Athletics&#10;..." />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest font-black text-surface-400 block mb-1">Prerequisites (optional)</label>
                  <input value={featForm.prerequisites?.[0]?.description || ""} onChange={(e) => setFeatForm({ ...featForm, prerequisites: e.target.value ? [{ type: "other", description: e.target.value }] : [] })} className="input-arcane w-full py-2 px-3 text-sm" placeholder="e.g., Strength 13" />
                </div>
                <button onClick={submitFeat} className="w-full py-2.5 rounded-xl bg-accent-600/20 border border-accent-500/20 text-accent-300 text-sm font-semibold active:scale-[0.97] transition-all flex items-center justify-center gap-2">
                  <Check className="w-4 h-4" />
                  {isAdd ? "Create Feat" : "Update Feat"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  const tabCount = useMemo(() => {
    if (activeTab === "items") return items.length;
    if (activeTab === "spells") return spells.length;
    return feats.length;
  }, [activeTab, items.length, spells.length, feats.length]);

  const activeList = useMemo(() => {
    if (activeTab === "items") return filteredItems;
    if (activeTab === "spells") return filteredSpells;
    return filteredFeats;
  }, [activeTab, filteredItems, filteredSpells, filteredFeats]);

  return (
    <div>
      {/* Tabs */}
      <div className="flex items-center gap-2 mb-4">
        {(["items", "spells", "feats"] as TabId[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 border ${
              activeTab === tab
                ? "bg-accent-600/15 text-accent-300 border-accent-500/20"
                : "text-surface-400 hover:text-surface-200 border-transparent hover:border-surface-700/30"
            }`}
          >
            {tab === "items" ? "📦 Items" : tab === "spells" ? "🔮 Spells" : "🏅 Feats"}
          </button>
        ))}
      </div>

      {/* Search + Add */}
      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-surface-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${activeTab}...`}
            className="input-arcane w-full pl-9 pr-4 py-2 text-xs"
          />
        </div>
        <button
          onClick={() => openForm("add", activeTab)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-accent-600/15 border border-accent-500/20 text-accent-300 text-xs font-semibold active:scale-95 transition-all hover:bg-accent-600/25"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add</span>
        </button>
      </div>

      {/* Count */}
      <div className="text-[10px] text-surface-500 mb-3">
        {tabCount} {activeTab}
      </div>

      {/* List */}
      {activeList.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-surface-500 text-sm">No {activeTab} yet</p>
          <p className="text-surface-600 text-xs mt-1">Create your first {activeTab.slice(0, -1)}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {activeTab === "items" && (filteredItems as HomebrewItem[]).map(renderItemCard)}
          {activeTab === "spells" && (filteredSpells as HomebrewSpell[]).map(renderSpellCard)}
          {activeTab === "feats" && (filteredFeats as HomebrewFeat[]).map(renderFeatCard)}
        </div>
      )}

      {renderForm()}
    </div>
  );
}
