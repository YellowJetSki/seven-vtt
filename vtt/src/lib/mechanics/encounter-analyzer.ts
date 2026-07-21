/**
 * STᚱ VTT — Encounter Analyzer & Party Balance Tool
 *
 * Analyzes an encounter against the party's capabilities beyond
 * raw CR math: average PC level, party synergy, action economy,
 * save targeting, damage type coverage, and encounter adjustment
 * suggestions.
 *
 * Reference: D&D 5.5e DMG encounter-building guidelines
 */

import { getXpForCr, getEffectiveMultiplier, XP_THRESHOLDS } from "./encounter-cr";
import { EnemyDoc } from "@/types/enemy";

// ── Types ──

export interface PartyProfile {
  size: number;
  avgLevel: number;
  levels: number[];
  hasFrontline: boolean;
  hasHealer: boolean;
  hasArcane: boolean;
  hasSkillMonkey: boolean;
  avgAc: number;
  avgHp: number;
  strongSaves: string[];
  weakSaves: string[];
}

export interface EncounterAnalysis {
  party: PartyProfile;
  enemies: EnemyAnalysis[];
  totalXp: number;
  adjustedXp: number;
  difficulty: string;
  difficultyColor: string;
  crRange: { min: number; max: number };
  deadlyThreshold: number;
  hardThreshold: number;
  mediumThreshold: number;
  easyThreshold: number;

  // Deep analysis
  actionEconomyAdvantage: "party" | "enemies" | "balanced";
  partyVsEnemyCountRatio: number;
  avgEnemyCrVsPartyLevel: number;
  saveTargetingWarnings: SaveTargetingWarning[];
  damageTypeCoverage: DamageTypeCoverage;
  recommendations: Recommendation[];
}

export interface EnemyAnalysis {
  name: string;
  type: string;
  cr: number;
  xp: number;
  count: number;
}

export interface SaveTargetingWarning {
  type: "danger" | "info";
  save: string;
  message: string;
}

export interface DamageTypeCoverage {
  highDamage: string[];
  commonResistances: string[];
  commonImmunities: string[];
  missingTypes: string[];
}

export interface Recommendation {
  type: "danger" | "warning" | "info" | "success";
  icon: string;
  message: string;
}

// ── Save strength classification ──

const STRONG_SAVES = ["constitution", "wisdom", "dexterity"];
const WEAK_SAVES = ["strength", "intelligence", "charisma"];

// ── Party analysis ──

export function analyzeCharacters(
  characters: Array<{
    class: string;
    level: number;
    armorClass?: number;
    hitPoints?: { current?: number; max?: number };
    strength?: number;
    dexterity?: number;
    constitution?: number;
    intelligence?: number;
    wisdom?: number;
    charisma?: number;
  }>
): PartyProfile {
  const size = characters.length;
  const levels = characters.map((c) => c.level);
  const avgLevel =
    levels.length > 0
      ? Math.round(levels.reduce((a, b) => a + b, 0) / levels.length)
      : 1;

  const hasFrontline = characters.some((c) =>
    ["Paladin", "Fighter", "Barbarian", "Cleric"].includes(c.class)
  );
  const hasHealer = characters.some((c) =>
    ["Cleric", "Druid", "Paladin", "Bard"].includes(c.class)
  );
  const hasArcane = characters.some((c) =>
    ["Wizard", "Sorcerer", "Warlock", "Bard", "Artificer"].includes(c.class)
  );
  const hasSkillMonkey = characters.some((c) =>
    ["Rogue", "Bard", "Ranger"].includes(c.class)
  );

  const avgAc =
    characters.length > 0
      ? Math.round(
          characters.reduce((s, c) => s + (c.armorClass || 10), 0) /
            characters.length
        )
      : 10;

  const avgHp =
    characters.length > 0
      ? Math.round(
          characters.reduce(
            (s, c) => s + (c.hitPoints?.max || c.hitPoints?.current || 10),
            0
          ) / characters.length
        )
      : 10;

  // Save analysis based on ability scores
  const strongSaves = STRONG_SAVES.filter((save) =>
    characters.some((c) => {
      const score = c[save as keyof typeof c];
      return typeof score === "number" && score >= 14;
    })
  );

  const weakSaves = WEAK_SAVES.filter(
    (save) =>
      !characters.some((c) => {
        const score = c[save as keyof typeof c];
        return typeof score === "number" && score >= 14;
      })
  );

  return {
    size,
    avgLevel,
    levels,
    hasFrontline,
    hasHealer,
    hasArcane,
    hasSkillMonkey,
    avgAc,
    avgHp,
    strongSaves,
    weakSaves,
  };
}

// ── Enemy analysis ──

export function analyzeEnemies(
  enemies: Array<{
    name?: string;
    type?: string;
    challengeRating?: number;
    count?: number;
  }>
): { analyses: EnemyAnalysis[]; totalXp: number } {
  let totalXp = 0;
  const analyses: EnemyAnalysis[] = [];

  for (const e of enemies) {
    const count = e.count || 1;
    const cr = e.challengeRating ?? 0;
    const xp = getXpForCr(cr);
    totalXp += xp * count;

    analyses.push({
      name: e.name || "Unknown",
      type: e.type || "humanoid",
      cr,
      xp,
      count,
    });
  }

  return { analyses, totalXp };
}

// ── Full analysis ──

export function analyzeEncounterComprehensive(
  characters: Parameters<typeof analyzeCharacters>[0],
  enemies: Parameters<typeof analyzeEnemies>[0]
): EncounterAnalysis {
  const party = analyzeCharacters(characters);
  const { analyses: enemyAnalyses, totalXp } = analyzeEnemies(enemies);

  const enemyCount = enemyAnalyses.reduce((s, e) => s + e.count, 0);
  const multiplier = getEffectiveMultiplier(enemyCount, party.size);
  const adjustedXp = Math.round(totalXp * multiplier);

  // CR range
  const crs = enemyAnalyses.flatMap((e) => Array(e.count).fill(e.cr));
  const crRange = {
    min: crs.length > 0 ? Math.min(...crs) : 0,
    max: crs.length > 0 ? Math.max(...crs) : 0,
  };

  // Difficulty thresholds
  const thresholds = XP_THRESHOLDS[Math.min(Math.max(party.avgLevel, 1), 20)];
  const easyThreshold = thresholds.easy * party.size;
  const mediumThreshold = thresholds.medium * party.size;
  const hardThreshold = thresholds.hard * party.size;
  const deadlyThreshold = thresholds.deadly * party.size;

  let difficulty: string;
  let difficultyColor: string;
  if (adjustedXp >= deadlyThreshold * 1.5) {
    difficulty = "Impossible";
    difficultyColor = "text-violet-400";
  } else if (adjustedXp >= deadlyThreshold) {
    difficulty = "Deadly";
    difficultyColor = "text-rose-400";
  } else if (adjustedXp >= hardThreshold) {
    difficulty = "Hard";
    difficultyColor = "text-amber-400";
  } else if (adjustedXp >= mediumThreshold) {
    difficulty = "Medium";
    difficultyColor = "text-gold-400";
  } else {
    difficulty = "Easy";
    difficultyColor = "text-emerald-400";
  }

  // Action economy
  const partyEnemyRatio = party.size / Math.max(enemyCount, 1);
  const actionEconomyAdvantage: "party" | "enemies" | "balanced" =
    partyEnemyRatio >= 2 ? "party" : partyEnemyRatio <= 0.5 ? "enemies" : "balanced";

  // Average enemy CR vs party level
  const avgCr =
    enemyAnalyses.length > 0
      ? enemyAnalyses.reduce((s, e) => s + e.cr * e.count, 0) /
        Math.max(enemyCount, 1)
      : 0;

  // Save targeting warnings
  const saveTargetingWarnings: SaveTargetingWarning[] = [];
  if (party.weakSaves.length > 0) {
    const weakMessage = party.weakSaves
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join("/");
    saveTargetingWarnings.push({
      type: "danger",
      save: party.weakSaves[0],
      message: `Party weak saves: ${weakMessage}. Enemies may target these.`,
    });
  }
  if (party.strongSaves.length > 0) {
    const strongMessage = party.strongSaves
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join("/");
    saveTargetingWarnings.push({
      type: "info",
      save: party.strongSaves[0],
      message: `Party strong saves: ${strongMessage}.`,
    });
  }

  // Recommendations
  const recommendations: Recommendation[] = [];
  if (difficulty === "Deadly" || difficulty === "Impossible") {
    recommendations.push({
      type: "danger",
      icon: "⚠️",
      message: `Encounter is ${difficulty.toLowerCase()}. Consider reducing enemy count or lowering CR.`,
    });
  }
  if (!party.hasFrontline) {
    recommendations.push({
      type: "warning",
      icon: "🛡️",
      message:
        "No frontline class (Paladin/Fighter/Barbarian/Cleric). Party may struggle with melee enemies.",
    });
  }
  if (!party.hasHealer) {
    recommendations.push({
      type: "warning",
      icon: "❤️",
      message:
        "No healer (Cleric/Druid/Paladin/Bard). Rest options are critical.",
    });
  }
  if (!party.hasArcane) {
    recommendations.push({
      type: "info",
      icon: "🧙",
      message:
        "No arcane caster. Magical enemies and barriers will be harder to overcome.",
    });
  }
  if (enemyCount > party.size * 2) {
    recommendations.push({
      type: "warning",
      icon: "⚔️",
      message: `Enemy action economy advantage: ${enemyCount} enemies vs ${party.size} PCs. Consider reducing enemy count.`,
    });
  }
  if (party.avgAc < 14 && avgCr >= 2) {
    recommendations.push({
      type: "info",
      icon: "🎯",
      message: `Party AC is low (avg ${party.avgAc}) for CR ${avgCr.toFixed(1)} enemies. Hits will land frequently.`,
    });
  }
  if (party.weakSaves.includes("dexterity") && avgCr >= 3) {
    recommendations.push({
      type: "warning",
      icon: "💥",
      message:
        "Party DEX saves are weak. Area-of-effect spells (Fireball, Dragon Breath) will be dangerous.",
    });
  }
  if (recommendations.length === 0) {
    recommendations.push({
      type: "success",
      icon: "✅",
      message: "Encounter is well-balanced for this party.",
    });
  }

  return {
    party,
    enemies: enemyAnalyses,
    totalXp,
    adjustedXp,
    difficulty,
    difficultyColor,
    crRange,
    easyThreshold,
    mediumThreshold,
    hardThreshold,
    deadlyThreshold,
    actionEconomyAdvantage,
    partyVsEnemyCountRatio: partyEnemyRatio,
    avgEnemyCrVsPartyLevel: avgCr / Math.max(party.avgLevel, 1),
    saveTargetingWarnings,
    damageTypeCoverage: {
      highDamage: [],
      commonResistances: [],
      commonImmunities: [],
      missingTypes: [],
    },
    recommendations,
  };
}
