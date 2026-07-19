/**
 * STᚱ VTT — Homebrew Manager
 *
 * Full CRUD panel for homebrew items, spells, and feats.
 * Composed of HomebrewTabs, HomebrewSearchBar, HomebrewTabPanel,
 * and form sub-components. Uses useHomebrewForms hook for state.
 */

import { useState, useMemo } from "react";
import { useCompendiumStore } from "@/stores/compendium/compendiumStore";
import HomebrewTabs, { type HomebrewTabId } from "./HomebrewTabs";
import HomebrewSearchBar from "./HomebrewSearchBar";
import HomebrewTabPanel from "./HomebrewTabPanel";
import HomebrewItemForm from "./HomebrewItemForm";
import HomebrewSpellForm from "./HomebrewSpellForm";
import HomebrewFeatForm from "./HomebrewFeatForm";
import { useHomebrewForms } from "./useHomebrewForms";

export default function HomebrewManager() {
  const { items, spells, feats } = useCompendiumStore();
  const [activeTab, setActiveTab] = useState<HomebrewTabId>("items");
  const [search, setSearch] = useState("");

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

  const filteredItems = useMemo(
    () =>
      search
        ? items.filter((i) =>
            i.name.toLowerCase().includes(search.toLowerCase())
          )
        : items,
    [items, search]
  );
  const filteredSpells = useMemo(
    () =>
      search
        ? spells.filter((s) =>
            s.name.toLowerCase().includes(search.toLowerCase())
          )
        : spells,
    [spells, search]
  );
  const filteredFeats = useMemo(
    () =>
      search
        ? feats.filter((f) =>
            f.name.toLowerCase().includes(search.toLowerCase())
          )
        : feats,
    [feats, search]
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

  return (
    <div>
      <HomebrewTabs activeTab={activeTab} onChange={setActiveTab} />
      <HomebrewSearchBar
        search={search}
        onSearchChange={setSearch}
        onAdd={() => openForm("add", activeTab)}
        placeholder={tabPlaceholder}
      />

      <div className="text-[10px] text-surface-500 mb-3">{tabCount} {activeTab}</div>

      <HomebrewTabPanel
        activeTab={activeTab}
        items={filteredItems}
        spells={filteredSpells}
        feats={filteredFeats}
        onEditItem={(i) => openForm("edit", "items", i)}
        onEditSpell={(s) => openForm("edit", "spells", s)}
        onEditFeat={(f) => openForm("edit", "feats", f)}
        onDeleteItem={(id) => useCompendiumStore.getState().removeItem(id)}
        onDeleteSpell={(id) => useCompendiumStore.getState().removeSpell(id)}
        onDeleteFeat={(id) => useCompendiumStore.getState().removeFeat(id)}
      />

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
