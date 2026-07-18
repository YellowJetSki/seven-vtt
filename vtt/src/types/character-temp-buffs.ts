// ── Temp Buffs Types ─────────────────────────────────────────

export type BuffTarget = "AC" | "Attack" | "Speed" | "SavingThrow" | "Damage";

export interface TempBuff {
  id: string;
  name: string;
  target: BuffTarget;
  value: number;
  isDebuff: boolean;
  source?: string;
  duration?: string;
  notes?: string;
}
