/* ── Homebrew Library Store ──────────────────────────────────── */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  HomebrewItem,
  HomebrewFeat,
  HomebrewSpell,
  HomebrewLibrary,
} from "@/types/homebrew";

interface HomebrewState extends HomebrewLibrary {
  isLoading: boolean;
  error: string | null;

  // ── Items ──
  addItem: (item: HomebrewItem) => void;
  updateItem: (id: string, updates: Partial<HomebrewItem>) => void;
  removeItem: (id: string) => void;
  getItemById: (id: string) => HomebrewItem | undefined;

  // ── Feats ──
  addFeat: (feat: HomebrewFeat) => void;
  updateFeat: (id: string, updates: Partial<HomebrewFeat>) => void;
  removeFeat: (id: string) => void;
  getFeatById: (id: string) => HomebrewFeat | undefined;

  // ── Spells ──
  addSpell: (spell: HomebrewSpell) => void;
  updateSpell: (id: string, updates: Partial<HomebrewSpell>) => void;
  removeSpell: (id: string) => void;
  getSpellById: (id: string) => HomebrewSpell | undefined;

  // ── General ──
  clearAll: () => void;
  /** @deprecated Use individual `items.length`, `feats.length`, `spells.length` selectors instead to avoid infinite re-renders */
  getStats: () => { totalItems: number; totalFeats: number; totalSpells: number };
}

export const useHomebrewStore = create<HomebrewState>()(
  persist(
    (set, get) => ({
      items: [],
      feats: [],
      spells: [],
      isLoading: false,
      error: null,

      /* ── Items ── */
      addItem: (item) =>
        set((state) => ({ items: [...state.items, item] })),

      updateItem: (id, updates) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id ? { ...i, ...updates, updatedAt: Date.now() } : i,
          ),
        })),

      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        })),

      getItemById: (id) => get().items.find((i) => i.id === id),

      /* ── Feats ── */
      addFeat: (feat) =>
        set((state) => ({ feats: [...state.feats, feat] })),

      updateFeat: (id, updates) =>
        set((state) => ({
          feats: state.feats.map((f) =>
            f.id === id ? { ...f, ...updates, updatedAt: Date.now() } : f,
          ),
        })),

      removeFeat: (id) =>
        set((state) => ({
          feats: state.feats.filter((f) => f.id !== id),
        })),

      getFeatById: (id) => get().feats.find((f) => f.id === id),

      /* ── Spells ── */
      addSpell: (spell) =>
        set((state) => ({ spells: [...state.spells, spell] })),

      updateSpell: (id, updates) =>
        set((state) => ({
          spells: state.spells.map((s) =>
            s.id === id ? { ...s, ...updates, updatedAt: Date.now() } : s,
          ),
        })),

      removeSpell: (id) =>
        set((state) => ({
          spells: state.spells.filter((s) => s.id !== id),
        })),

      getSpellById: (id) => get().spells.find((s) => s.id === id),

      /* ── General ── */
      clearAll: () => set({ items: [], feats: [], spells: [] }),

      /** @deprecated Produces a new object reference on every call.
       *  Use individual `items.length`, `feats.length`, `spells.length` selectors. */
      getStats: () => {
        const { items, feats, spells } = get();
        return {
          totalItems: items.length,
          totalFeats: feats.length,
          totalSpells: spells.length,
        };
      },
    }),
    {
      name: "str-vtt-homebrew",
      // Persist all data
    },
  ),
);
