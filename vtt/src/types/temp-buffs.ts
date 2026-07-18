/* ══════════════════════════════════════════════════════════════
   Temp Buffs — Temporary modifiers for combat encounters.
   Mirrors the pedal-sheet's tempBuffs system:
   • Target: "AC" | "Attack" | "Speed" | "SavingThrow" | "Damage"
   • Value: numeric modifier
   • Duration: optional description of how long it lasts
   • Source: what caused it (spell, item, feature)
   ══════════════════════════════════════════════════════════════ */

export type BuffTarget = "AC" | "Attack" | "Speed" | "SavingThrow" | "Damage";

export interface TempBuff {
  id: string;
  target: BuffTarget;
  value: number;
  label: string;
  source?: string;
  duration?: string;
  /** Optional: set when this buff will expire (timestamp) */
  expiresAt?: number;
  /** True if this is a penalty (debuff) vs a buff */
  isDebuff?: boolean;
}

export const BUFF_TARGETS: { key: BuffTarget; label: string; icon: string }[] = [
  { key: "AC", label: "Armor Class", icon: "🛡️" },
  { key: "Attack", label: "Attack Rolls", icon: "⚔️" },
  { key: "Speed", label: "Speed", icon: "👟" },
  { key: "SavingThrow", label: "Saving Throws", icon: "🔮" },
  { key: "Damage", label: "Damage", icon: "💥" },
];

export const BUFF_PRESETS: TempBuff[] = [
  { id: "preset_shield", target: "AC", value: 5, label: "Shield of Faith", source: "Spell", duration: "10 min" },
  { id: "preset_bark", target: "AC", value: 2, label: "Barkskin", source: "Spell", duration: "1 hr" },
  { id: "preset_haste", target: "Speed", value: 60, label: "Haste", source: "Spell", duration: "1 min", isDebuff: false },
  { id: "preset_haste_ac", target: "AC", value: 2, label: "Haste (AC)", source: "Spell", duration: "1 min" },
  { id: "preset_bless", target: "Attack", value: 4, label: "Bless", source: "Spell", duration: "1 min" },
  { id: "preset_bane", target: "Attack", value: -4, label: "Bane", source: "Spell", duration: "1 min", isDebuff: true },
  { id: "preset_rage_ac", target: "AC", value: -2, label: "Rage (Reckless)", source: "Feature", duration: "1 min", isDebuff: true },
  { id: "preset_half_cover", target: "AC", value: 2, label: "Half Cover", source: "Environment", duration: "Until move" },
  { id: "preset_three_quarters", target: "AC", value: 5, label: "Three-Quarters Cover", source: "Environment", duration: "Until move" },
  { id: "preset_slow", target: "Speed", value: -20, label: "Slow", source: "Spell", duration: "1 min", isDebuff: true },
];

/** Calculate the total modifier for a specific target type */
export function getBuffTotal(buffs: TempBuff[], target: BuffTarget): number {
  return buffs.filter(b => b.target === target).reduce((sum, b) => sum + b.value, 0);
}

/** Get a display string for the total buff */
export function getBuffDisplay(total: number): string {
  if (total === 0) return ""; 
  return total > 0 ? `+${total}` : `${total}`;
}
