// ── D&D 5e Spell Slot Progression Tables ─────────────────────

import type { SpellLevel } from "@/types";

export const FULL_CASTER_SLOTS: Record<number, Partial<Record<SpellLevel, number>>> = {
  1: { 1: 2 }, 2: { 1: 3 }, 3: { 1: 4, 2: 2 }, 4: { 1: 4, 2: 3 },
  5: { 1: 4, 2: 3, 3: 2 }, 6: { 1: 4, 2: 3, 3: 3 }, 7: { 1: 4, 2: 3, 3: 3, 4: 1 },
  8: { 1: 4, 2: 3, 3: 3, 4: 2 }, 9: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 1 },
  10: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2 },
  11: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1 },
  12: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1 },
  13: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1 },
  14: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1 },
  15: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1 },
  16: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1 },
  17: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1, 9: 1 },
  18: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 1, 7: 1, 8: 1, 9: 1 },
  19: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 2, 7: 1, 8: 1, 9: 1 },
  20: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 2, 7: 2, 8: 1, 9: 1 },
};

export const HALF_CASTER_SLOTS: Record<number, Partial<Record<SpellLevel, number>>> = {
  2: { 1: 2 }, 3: { 1: 3 }, 4: { 1: 3 }, 5: { 1: 4, 2: 2 },
  6: { 1: 4, 2: 2 }, 7: { 1: 4, 2: 3 }, 8: { 1: 4, 2: 3 },
  9: { 1: 4, 2: 3, 3: 2 }, 10: { 1: 4, 2: 3, 3: 2 },
  11: { 1: 4, 2: 3, 3: 3 }, 12: { 1: 4, 2: 3, 3: 3 },
  13: { 1: 4, 2: 3, 3: 3, 4: 1 }, 14: { 1: 4, 2: 3, 3: 3, 4: 1 },
  15: { 1: 4, 2: 3, 3: 3, 4: 2 }, 16: { 1: 4, 2: 3, 3: 3, 4: 2 },
  17: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 1 }, 18: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 1 },
  19: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2 }, 20: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2 },
};

export const THIRD_CASTER_SLOTS: Record<number, Partial<Record<SpellLevel, number>>> = {
  3: { 1: 2 }, 4: { 1: 3 }, 5: { 1: 3 }, 6: { 1: 3 }, 7: { 1: 4, 2: 2 },
  8: { 1: 4, 2: 2 }, 9: { 1: 4, 2: 2 }, 10: { 1: 4, 2: 3 },
  11: { 1: 4, 2: 3 }, 12: { 1: 4, 2: 3 }, 13: { 1: 4, 2: 3, 3: 2 },
  14: { 1: 4, 2: 3, 3: 2 }, 15: { 1: 4, 2: 3, 3: 2 },
  16: { 1: 4, 2: 3, 3: 3 }, 17: { 1: 4, 2: 3, 3: 3 },
  18: { 1: 4, 2: 3, 3: 3 }, 19: { 1: 4, 2: 3, 3: 3, 4: 1 },
  20: { 1: 4, 2: 3, 3: 3, 4: 1 },
};

export function getMaxSlots(casterType: "full" | "half" | "third", level: number): Partial<Record<SpellLevel, number>> {
  switch (casterType) {
    case "full": return FULL_CASTER_SLOTS[level] ?? {};
    case "half": return HALF_CASTER_SLOTS[level] ?? {};
    case "third": return THIRD_CASTER_SLOTS[level] ?? {};
  }
}

export function getCasterType(className: string): "full" | "half" | "third" {
  const fullCasters = ["wizard", "cleric", "druid", "sorcerer", "bard"];
  const halfCasters = ["paladin", "ranger", "artificer"];
  const thirdCasters = ["eldritch knight", "arcane trickster"];
  const lower = className.toLowerCase();
  if (fullCasters.includes(lower)) return "full";
  if (halfCasters.includes(lower)) return "half";
  if (thirdCasters.includes(lower)) return "third";
  return "half";
}
