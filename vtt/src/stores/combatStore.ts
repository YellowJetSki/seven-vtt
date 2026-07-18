import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createCombatSlice, type CombatSlice } from "./combat/combatSlice";
import { createCombatFlowSlice, type CombatFlowSlice } from "./combat/combatFlowSlice";
import { createCombatHpSlice, type CombatHpSlice } from "./combat/combatHpSlice";
import { createCombatSessionSlice, type CombatSessionSlice } from "./combat/combatSessionSlice";

export type CombatStore = CombatSlice & CombatFlowSlice & CombatHpSlice & CombatSessionSlice;

export const useCombatStore = create<CombatStore>()(
  persist(
    (...args) => ({
      ...createCombatSlice(...args),
      ...createCombatFlowSlice(...args),
      ...createCombatHpSlice(...args),
      ...createCombatSessionSlice(...args),
    }),
    { name: "str-vtt-combat" }
  )
);
