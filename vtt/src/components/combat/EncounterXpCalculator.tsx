/* ── EncounterXpCalculator ─────────────────────────────────────
 * Calculates raw XP, adjusted XP (with party multiplier), and
 * difficulty classification for encounter building.
 * ─────────────────────────────────────────────────────────────── */

import { getEnemyById, XP_BY_CR } from "@/data/enemy-database";

const PARTY_SIZE_MULTIPLIERS: Record<number, number> = {
  1: 1, 2: 1.5, 3: 2, 4: 2, 5: 2,
  6: 2, 7: 2.5, 8: 2.5, 9: 2.5, 10: 2.5,
  11: 3, 12: 3, 13: 3, 14: 3, 15: 4,
};

const THRESHOLDS: Record<number, { easy: number; medium: number; hard: number; deadly: number }> = {
  1: { easy: 25, medium: 50, hard: 75, deadly: 100 },
  2: { easy: 50, medium: 100, hard: 150, deadly: 200 },
  3: { easy: 75, medium: 150, hard: 225, deadly: 400 },
  4: { easy: 125, medium: 250, hard: 375, deadly: 500 },
  5: { easy: 250, medium: 500, hard: 750, deadly: 1100 },
  6: { easy: 300, medium: 600, hard: 900, deadly: 1400 },
  7: { easy: 350, medium: 750, hard: 1100, deadly: 1700 },
  8: { easy: 450, medium: 900, hard: 1400, deadly: 2100 },
  9: { easy: 550, medium: 1100, hard: 1600, deadly: 2400 },
  10: { easy: 600, medium: 1200, hard: 1900, deadly: 2800 },
  11: { easy: 800, medium: 1600, hard: 2400, deadly: 3600 },
  12: { easy: 1000, medium: 2000, hard: 3000, deadly: 4500 },
  13: { easy: 1100, medium: 2200, hard: 3400, deadly: 5100 },
  14: { easy: 1250, medium: 2500, hard: 3800, deadly: 5700 },
  15: { easy: 1400, medium: 2800, hard: 4300, deadly: 6400 },
  16: { easy: 1600, medium: 3200, hard: 4800, deadly: 7200 },
  17: { easy: 2000, medium: 3900, hard: 5900, deadly: 8800 },
  18: { easy: 2100, medium: 4200, hard: 6300, deadly: 9500 },
  19: { easy: 2400, medium: 4900, hard: 7300, deadly: 10900 },
  20: { easy: 2800, medium: 5700, hard: 8500, deadly: 12700 },
};

export function calculateXp(slots: { enemyId: string; count: number }[]) {
  let rawXp = 0;
  let enemyCount = 0;
  for (const e of slots) {
    const template = getEnemyById(e.enemyId);
    if (template) {
      rawXp += (XP_BY_CR[template.cr] ?? 0) * e.count;
      enemyCount += e.count;
    }
  }
  const multKey = Math.min(Math.max(enemyCount, 1), 15) as keyof typeof PARTY_SIZE_MULTIPLIERS;
  const multiplier = PARTY_SIZE_MULTIPLIERS[multKey] ?? 4;
  const adjustedXp = Math.floor(rawXp * multiplier);
  return { totalXp: rawXp, adjustedXp, multiplier };
}

export function estimateDifficulty(adjustedXp: number, partyLevels: number[]): string {
  if (partyLevels.length === 0) return "unknown";
  const avgLevel = Math.round(partyLevels.reduce((s, l) => s + l, 0) / partyLevels.length);
  const threshold = THRESHOLDS[avgLevel] ?? THRESHOLDS[5];
  const partyDeadly = threshold.deadly * partyLevels.length;
  const partyHard = threshold.hard * partyLevels.length;
  if (adjustedXp >= partyDeadly * 1.25) return "deadly";
  if (adjustedXp >= partyDeadly) return "deadly";
  if (adjustedXp >= partyHard) return "hard";
  if (adjustedXp >= threshold.medium * partyLevels.length) return "medium";
  return "easy";
}

export function getDifficultyColor(difficulty: string): string {
  const colors: Record<string, string> = {
    easy: "text-rogue-400 border-rogue-500/30 bg-rogue-500/10",
    medium: "text-divine-400 border-divine-500/30 bg-divine-500/10",
    hard: "text-warrior-400 border-warrior-500/30 bg-warrior-500/10",
    deadly: "text-warrior-400 border-warrior-500/50 bg-warrior-500/20",
  };
  return colors[difficulty] ?? "text-surface-400 border-surface-700 bg-surface-800";
}
