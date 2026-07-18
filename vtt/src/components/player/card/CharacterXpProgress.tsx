/* ── CharacterXpProgress ────────────────────────────────────────
 * Compact XP progress bar showing current XP, XP needed for
 * next level, and a visual progress indicator.
 * ─────────────────────────────────────────────────────────────── */

import type { PlayerCharacter } from "@/types";

/** D&D 5e XP thresholds per level */
const XP_THRESHOLDS: number[] = [
  0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000,
  85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000,
  305000, 355000,
];

function getXpForNextLevel(currentLevel: number): number {
  if (currentLevel >= 20) return Infinity;
  return XP_THRESHOLDS[currentLevel];
}

function getXpForCurrentLevel(currentLevel: number): number {
  if (currentLevel <= 1) return 0;
  return XP_THRESHOLDS[currentLevel - 1];
}

interface Props {
  character: PlayerCharacter;
}

export function CharacterXpProgress({ character }: Props) {
  if (character.level >= 20) {
    return (
      <div className="rounded bg-accent-500/10 px-2 py-1 text-[9px] text-center">
        <span className="text-accent-400 font-semibold">⭐ Level 20 — Maximum Level</span>
      </div>
    );
  }

  const currentXp = character.experiencePoints ?? 0;
  const xpForNext = getXpForNextLevel(character.level);
  const xpForCurrent = getXpForCurrentLevel(character.level);
  const xpNeeded = xpForNext - currentXp;
  const progress = xpForNext > xpForCurrent
    ? ((currentXp - xpForCurrent) / (xpForNext - xpForCurrent)) * 100
    : 0;

  return (
    <div className="rounded bg-surface-800/60 px-2 py-1.5 border border-surface-700/40">
      <div className="flex items-center justify-between text-[9px] mb-0.5">
        <span className="text-surface-400">XP</span>
        <span className="text-surface-300 font-mono">
          {currentXp.toLocaleString()} / {xpForNext.toLocaleString()}
        </span>
      </div>
      <div className="h-1 rounded-full bg-surface-700 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-accent-500 to-rogue-500 transition-all"
          style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
        />
      </div>
      <p className="text-[8px] text-surface-500 mt-0.5 text-right">
        {xpNeeded > 0 ? `${xpNeeded.toLocaleString()} XP to next level` : "Ready to level up!"}
      </p>
    </div>
  );
}
