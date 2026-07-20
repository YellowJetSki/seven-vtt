// ── D&D 5e Spell Slot Types ──────────────────────────────────

export type SpellLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export interface SpellSlotPool {
  level: SpellLevel;
  current: number;
  max: number;
}

export interface SpellSlotsFull {
  level1: SpellSlotPool;
  level2: SpellSlotPool;
  level3: SpellSlotPool;
  level4: SpellSlotPool;
  level5: SpellSlotPool;
  level6: SpellSlotPool;
  level7: SpellSlotPool;
  level8: SpellSlotPool;
  level9: SpellSlotPool;
}

export type CasterType = "full" | "half" | "third" | "pact" | "none";

export { getMaxSlots, getCasterType } from "@/data/spell-progression";
