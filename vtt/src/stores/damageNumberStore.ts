/**
 * STᚱ VTT — Damage Number Store
 *
 * A lightweight Zustand store that collects floating damage/heal
 * numbers to be rendered on the canvas. When the DM deals damage
 * or heals a token, this store tracks:
 *
 *   - tokenId (for positioning)
 *   - value (+ for heal, - for damage)
 *   - damageType (for color coding: fire=orange, cold=blue, etc.)
 *   - timestamp (for animation lifecycle: born → float → fade → die)
 *
 * The canvas rendering layer reads this store and draws floating
 * numbers that rise and fade over ~2 seconds.
 */

import { create } from "zustand";

export type DamageNumberType = "damage" | "heal" | "temp" | "death" | "crit" | "kill";

export interface DamageNumber {
  /** Unique ID for this floating number */
  id: string;
  /** Token ID this number is associated with (for canvas positioning) */
  tokenId: string;
  /** Numeric value (positive = heal, negative = damage) */
  value: number;
  /** Display type (determines color) */
  type: DamageNumberType;
  /** Optional damage type for color (e.g., "fire", "cold", "slashing") */
  damageType?: string;
  /** Birth timestamp for animation lifecycle */
  createdAt: number;
  /** Duration in ms before removal */
  duration: number;
  /** Random horizontal offset (prevents stacking) */
  xOffset: number;
}

interface DamageNumberState {
  /** Active floating numbers */
  numbers: DamageNumber[];
}

interface DamageNumberActions {
  /** Add a new floating number */
  addNumber: (num: Omit<DamageNumber, "id" | "createdAt" | "xOffset">) => void;
  /** Remove numbers that have expired */
  cleanExpired: (now: number) => void;
  /** Clear all numbers */
  clearAll: () => void;
}

let _counter = 0;

export const useDamageNumberStore = create<DamageNumberState & DamageNumberActions>()((set, get) => ({
  numbers: [],

  addNumber: (num) => {
    _counter++;
    const newNum: DamageNumber = {
      ...num,
      id: `dn_${_counter}_${Date.now()}`,
      createdAt: Date.now(),
      xOffset: (Math.random() - 0.5) * 0.6, // -0.3 to 0.3 grid cells
    };
    set((state) => ({
      numbers: [...state.numbers, newNum],
    }));
  },

  cleanExpired: (now: number) => {
    set((state) => ({
      numbers: state.numbers.filter((n) => now - n.createdAt < n.duration),
    }));
  },

  clearAll: () => set({ numbers: [] }),
}));

/**
 * Convenience helper to add a damage number from any context.
 * Used by combat store HP mutation handlers.
 */
export function addDamageFloater(
  tokenId: string,
  value: number,
  type: DamageNumberType = "damage",
  damageType?: string,
  duration: number = 2000
) {
  useDamageNumberStore.getState().addNumber({
    tokenId,
    value,
    type,
    damageType,
    duration,
  });
}
