/**
 * STᚱ VTT — Spell Utilities
 *
 * Shared constants, types, and pure functions for spell display.
 * Extracted from PlayerSheetSpellsTab.tsx monolith (Sprint 7 refactor).
 */

// ── Spell interface ──

export interface KnownSpell {
  name: string;
  level: number;
  school: string;
  castingTime: string;
  range: string;
  components: string;
  duration: string;
  description: string;
  ritual: boolean;
  concentration: boolean;
  damageDice?: string;
  damageType?: string;
  healDice?: string;
  saveDC?: number;
  saveAbility?: string;
  attackRoll?: boolean;
}

// ── School colors ──

export const SCHOOL_COLORS: Record<string, string> = {
  Abjuration: "text-cyan-300 bg-cyan-500/10 border-cyan-500/20",
  Conjuration: "text-amber-300 bg-amber-500/10 border-amber-500/20",
  Divination: "text-violet-300 bg-violet-500/10 border-violet-500/20",
  Enchantment: "text-pink-300 bg-pink-500/10 border-pink-500/20",
  Evocation: "text-rose-300 bg-rose-500/10 border-rose-500/20",
  Illusion: "text-indigo-300 bg-indigo-500/10 border-indigo-500/20",
  Necromancy: "text-emerald-300 bg-emerald-500/10 border-emerald-500/20",
  Transmutation: "text-orange-300 bg-orange-500/10 border-orange-500/20",
};

export function getSchoolStyle(school: string): string {
  return SCHOOL_COLORS[school] || "text-surface-400 bg-surface-800/40 border-surface-700/30";
}

// ── School emoji icons ──

export const SCHOOL_ICON: Record<string, string> = {
  Abjuration: "🛡",
  Conjuration: "✨",
  Divination: "👁",
  Enchantment: "💫",
  Evocation: "💥",
  Illusion: "🌀",
  Necromancy: "💀",
  Transmutation: "🔮",
};

// ── Spell level names ──

export const LEVEL_NAMES: Record<number, string> = {
  0: "Cantrip",
  1: "1st Level",
  2: "2nd Level",
  3: "3rd Level",
  4: "4th Level",
  5: "5th Level",
  6: "6th Level",
  7: "7th Level",
  8: "8th Level",
  9: "9th Level",
};

// ── Damage / healing extractors ──

export function extractDamageDice(description: string): string | undefined {
  const match = description.match(/(\d+d\d+)(?:\s*\+\s*\d+)?/);
  return match ? match[0] : undefined;
}

export function extractDamageType(description: string): string | undefined {
  const types = [
    "fire", "cold", "lightning", "thunder", "acid", "poison",
    "necrotic", "radiant", "force", "psychic", "piercing",
    "slashing", "bludgeoning",
  ];
  const lower = description.toLowerCase();
  for (const t of types) {
    if (lower.includes(t)) return t;
  }
  return undefined;
}

export function extractHealDice(description: string): string | undefined {
  const match = description.match(/restores?\s*(\d+d\d+)/i);
  return match ? match[1] : undefined;
}
