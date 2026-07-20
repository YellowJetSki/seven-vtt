/**
 * STᚱ VTT — useHomebrewForms
 *
 * Extracted form state management hook for the Homebrew Manager.
 * Handles form open/close, field state, and submission for items, spells, and feats.
 */

import { useState, useCallback } from "react";
import { useCompendiumStore } from "@/stores/compendium/compendiumStore";
import type { HomebrewItem, HomebrewSpell, HomebrewFeat } from "@/types/homebrew";
import type { HomebrewTabId } from "./HomebrewTabs";

type FormMode = "add" | "edit" | null;

const emptyItem: Omit<HomebrewItem, "id" | "createdAt" | "updatedAt"> = {
  name: "", category: "other", rarity: "common", description: "",
  flavorText: "", requiresAttunement: false, weight: 0, value: 0,
  isCursed: false, tags: [], visibleToPlayers: true,
  source: "homebrew", isHomebrew: true,
};

const emptySpell: Omit<HomebrewSpell, "id" | "createdAt" | "updatedAt"> = {
  name: "", level: 1, school: "Evocation", castingTime: "1 action",
  ritual: false, components: ["V", "S"], concentration: false,
  duration: "Instantaneous", range: "60 feet", classes: [], description: "",
  visibleToPlayers: true, isHomebrew: true, source: "homebrew", tags: [],
};

const emptyFeat: Omit<HomebrewFeat, "id" | "createdAt" | "updatedAt"> = {
  name: "", description: "", prerequisites: [], benefits: [],
  repeatable: false, visibleToPlayers: true,
  tags: [], source: "homebrew", isHomebrew: true,
};

export function useHomebrewForms() {
  const { addItem, addSpell, addFeat, removeItem, removeSpell, removeFeat } = useCompendiumStore();

  const [formMode, setFormMode] = useState<FormMode>(null);
  const [formType, setFormType] = useState<HomebrewTabId>("items");
  const [editId, setEditId] = useState<string | undefined>();

  const [itemForm, setItemForm] = useState(emptyItem);
  const [spellForm, setSpellForm] = useState(emptySpell);
  const [featForm, setFeatForm] = useState(emptyFeat);
  const [featBenefitsInput, setFeatBenefitsInput] = useState("");
  // Track original createdAt for preserving timestamps on edit
  const [originalCreatedAt, setOriginalCreatedAt] = useState<number | undefined>();

  const openForm = useCallback(
    (mode: "add" | "edit", type: HomebrewTabId, existing?: HomebrewItem | HomebrewSpell | HomebrewFeat) => {
      setFormMode(mode);
      setFormType(type);
      setEditId(existing?.id);
      setOriginalCreatedAt(existing?.createdAt);
      if (type === "items") {
        const e = existing as HomebrewItem | undefined;
        setItemForm(e ? { ...emptyItem, ...e } : emptyItem);
      } else if (type === "spells") {
        const e = existing as HomebrewSpell | undefined;
        setSpellForm(e ? { ...emptySpell, ...e } : emptySpell);
      } else {
        const e = existing as HomebrewFeat | undefined;
        setFeatForm(e ? { ...emptyFeat, ...e } : emptyFeat);
        setFeatBenefitsInput(e ? e.benefits.join("\n") : "");
      }
    },
    []
  );

  const closeForm = useCallback(() => {
    setFormMode(null);
    setFormType("items");
    setEditId(undefined);
    setOriginalCreatedAt(undefined);
  }, []);

  const submitItem = useCallback(() => {
    if (!itemForm.name.trim()) return;
    const now = Date.now();
    const newItem: HomebrewItem = {
      ...itemForm,
      id: editId || `hb_${now}_${Math.random().toString(36).slice(2, 6)}`,
      createdAt: originalCreatedAt || now,
      updatedAt: now,
    };
    if (editId) removeItem(editId);
    addItem(newItem);
    closeForm();
  }, [itemForm, editId, originalCreatedAt, addItem, removeItem, closeForm]);

  const submitSpell = useCallback(() => {
    if (!spellForm.name.trim()) return;
    const now = Date.now();
    const newSpell: HomebrewSpell = {
      ...spellForm,
      id: editId || `hb_${now}_${Math.random().toString(36).slice(2, 6)}`,
      createdAt: originalCreatedAt || now,
      updatedAt: now,
    };
    if (editId) removeSpell(editId);
    addSpell(newSpell);
    closeForm();
  }, [spellForm, editId, originalCreatedAt, addSpell, removeSpell, closeForm]);

  const submitFeat = useCallback(() => {
    if (!featForm.name.trim()) return;
    const now = Date.now();
    const benefits = featBenefitsInput
      .split("\n")
      .map((b) => b.trim())
      .filter(Boolean);
    const newFeat: HomebrewFeat = {
      ...featForm,
      benefits,
      id: editId || `hb_${now}_${Math.random().toString(36).slice(2, 6)}`,
      createdAt: originalCreatedAt || now,
      updatedAt: now,
    };
    if (editId) removeFeat(editId);
    addFeat(newFeat);
    closeForm();
  }, [featForm, featBenefitsInput, editId, addFeat, removeFeat, closeForm]);

  return {
    formMode,
    formType,
    editId,
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
  };
}
