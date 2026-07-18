// ── D&D 5e Status Condition Types Only ───────────────────────

export type ConditionId =
  | "blinded" | "charmed" | "deafened" | "exhaustion"
  | "frightened" | "grappled" | "incapacitated" | "invisible"
  | "paralyzed" | "petrified" | "poisoned" | "prone"
  | "restrained" | "stunned" | "unconscious" | "concentration";

export interface ConditionInfo {
  id: ConditionId;
  name: string;
  description: string;
  icon: string;
  color: string;
  mechanicalEffects: string[];
  appliesAdvantageTo: string[];
  appliesDisadvantageTo: string[];
  preventsActions: boolean;
  preventsMovement: boolean;
  preventsBonusActions: boolean;
  preventsReactions: boolean;
  autoFailsSaves: string[];
  halvesSpeed: boolean;
  setsSpeed: number | null;
  autoFailsAbilityChecks: string[];
  allowsSaveEnd: boolean;
  saveAbility?: string;
  stackable: boolean;
  maxStacks: number;
  durationType: "instant" | "concentration" | "time" | "save_ends" | "permanent";
}
