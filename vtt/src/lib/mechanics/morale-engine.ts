/**
 * STᚱ VTT — Morale Engine
 *
 * Optional morale checks for monsters and NPCs.
 * When creatures suffer casualties, they may flee or surrender.
 * DM can roll a morale check at any time.
 *
 * Based on traditional D&D morale rules (adaptable to 5e).
 */

export interface MoraleThreshold {
  /** Percentage of casualties (0.0 - 1.0) that triggers this check */
  casualtyThreshold: number;
  /** DC for the Wisdom saving throw */
  saveDC: number;
  /** Description of what happens on failure */
  onFailure: "flee" | "surrender" | "cower";
}

const DEFAULT_MORALE: MoraleThreshold[] = [
  { casualtyThreshold: 0.25, saveDC: 10, onFailure: "cower" },     // First 25% casualties
  { casualtyThreshold: 0.5,  saveDC: 12, onFailure: "flee" },      // Half the group down
  { casualtyThreshold: 0.75, saveDC: 14, onFailure: "surrender" }, // Most of the group down
];

export interface MoraleConfig {
  thresholds: MoraleThreshold[];
  /** Creature type modifier: some creatures never flee */
  neverFlees: boolean;
  /** Modifier to all morale DCs (e.g., +2 for fanatical, -2 for cowardly) */
  difficultyModifier: number;
}

const MORALE_CONFIGS: Record<string, Partial<MoraleConfig>> = {
  beast:      { neverFlees: false, difficultyModifier: 0 },
  dragon:     { neverFlees: false, difficultyModifier: 2 },
  fiend:      { neverFlees: true,  difficultyModifier: 2 },
  celestial:  { neverFlees: true,  difficultyModifier: 2 },
  construct:  { neverFlees: true,  difficultyModifier: 0 },
  undead:     { neverFlees: true,  difficultyModifier: 1 },
  humanoid:   { neverFlees: false, difficultyModifier: 0 },
  monstrosity:{ neverFlees: false, difficultyModifier: 1 },
  plant:      { neverFlees: true,  difficultyModifier: -1 },
  ooze:       { neverFlees: true,  difficultyModifier: -1 },
  fey:        { neverFlees: false, difficultyModifier: 0 },
  giant:      { neverFlees: false, difficultyModifier: 1 },
};

export interface MoraleResult {
  shouldCheck: boolean;
  checkDC: number;
  outcome?: "flee" | "surrender" | "cower" | "hold";
  reason: string;
}

/**
 * Evaluates whether a group of creatures should make a morale check.
 */
export function evaluateMorale(
  creatureType: string,
  totalGroup: number,
  casualties: number,
  beenDamagedThisRound: boolean,
): MoraleResult {
  if (totalGroup <= 0) return { shouldCheck: false, checkDC: 0, reason: "No creatures remaining" };

  const config = MORALE_CONFIGS[creatureType.toLowerCase()] ?? { neverFlees: false, difficultyModifier: 0 };
  if (config.neverFlees) {
    // Undead, constructs, fanatics never flee
    return { shouldCheck: false, checkDC: 0, reason: `${creatureType} never flee` };
  }

  const ratio = casualties / totalGroup;
  for (const threshold of DEFAULT_MORALE) {
    if (ratio >= threshold.casualtyThreshold && beenDamagedThisRound) {
      const adjustedDC = threshold.saveDC + (config.difficultyModifier ?? 0);
      return {
        shouldCheck: true,
        checkDC: adjustedDC,
        outcome: threshold.onFailure,
        reason: `${Math.round(ratio * 100)}% casualties — morale check DC ${adjustedDC}`,
      };
    }
  }

  return { shouldCheck: false, checkDC: 0, reason: "Morale holding" };
}

/**
 * Rolls a morale check (d20 + WIS mod vs DC).
 */
export function rollMorale(wisdomScore: number, dc: number): boolean {
  const wisMod = Math.floor((wisdomScore - 10) / 2);
  const roll = Math.floor(Math.random() * 20) + 1;
  return roll + wisMod >= dc;
}
