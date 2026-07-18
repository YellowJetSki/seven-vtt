/**
 * STᚱ VTT — Compendium Store
 *
 * Zustand persist store for the global compendium panel.
 * Manages SRD + homebrew items, spells, feats with search/filter.
 * Provides drag-and-drop state for CompendiumCard → CompendiumDropTarget.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { HomebrewItem, HomebrewSpell, HomebrewFeat } from "@/types/homebrew";

export type CompendiumTab = "items" | "spells" | "feats";
export type DraggedEntry = {
  type: "item" | "spell" | "feat";
  data: HomebrewItem | HomebrewSpell | HomebrewFeat;
} | null;

export interface CompendiumState {
  items: HomebrewItem[];
  spells: HomebrewSpell[];
  feats: HomebrewFeat[];
  searchQuery: string;
  activeTab: CompendiumTab;
  categoryFilter: string | null;
  schoolFilter: string | null;
  showSRD: boolean;
  draggedItem: DraggedEntry;

  setSearch: (q: string) => void;
  setTab: (t: CompendiumTab) => void;
  setCategoryFilter: (c: string | null) => void;
  setSchoolFilter: (s: string | null) => void;
  toggleSRD: () => void;
  setDraggedItem: (d: DraggedEntry) => void;
  clearDraggedItem: () => void;

  addItem: (item: HomebrewItem) => void;
  addSpell: (spell: HomebrewSpell) => void;
  addFeat: (feat: HomebrewFeat) => void;
  removeItem: (id: string) => void;
  removeSpell: (id: string) => void;
  removeFeat: (id: string) => void;
}

export const useCompendiumStore = create<CompendiumState>()(
  persist(
    (set) => ({
      items: [],
      spells: [],
      feats: [],
      searchQuery: "",
      activeTab: "items",
      categoryFilter: null,
      schoolFilter: null,
      showSRD: true,
      draggedItem: null,

      setSearch: (q) => set({ searchQuery: q }),
      setTab: (t) => set({ activeTab: t, categoryFilter: null, schoolFilter: null }),
      setCategoryFilter: (c) => set({ categoryFilter: c }),
      setSchoolFilter: (s) => set({ schoolFilter: s }),
      toggleSRD: () => set((p) => ({ showSRD: !p.showSRD })),
      setDraggedItem: (d) => set({ draggedItem: d }),
      clearDraggedItem: () => set({ draggedItem: null }),

      addItem: (item) => set((p) => ({ items: [...p.items, item] })),
      addSpell: (spell) => set((p) => ({ spells: [...p.spells, spell] })),
      addFeat: (feat) => set((p) => ({ feats: [...p.feats, feat] })),
      removeItem: (id) => set((p) => ({ items: p.items.filter((x) => x.id !== id) })),
      removeSpell: (id) => set((p) => ({ spells: p.spells.filter((x) => x.id !== id) })),
      removeFeat: (id) => set((p) => ({ feats: p.feats.filter((x) => x.id !== id) })),
    }),
    { name: "str-vtt-compendium" }
  )
);
