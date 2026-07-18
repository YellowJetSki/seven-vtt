/* ── Encounter Preset Types & Storage ───────────────────────────
 * Shared types and localStorage utilities for encounter presets.
 * Extracted from EncounterPresets.tsx to keep files under 150 lines.
 * ─────────────────────────────────────────────────────────────── */

import type { EncounterEnemy } from "@/types";

export interface EncounterPreset {
  name: string;
  difficulty: "easy" | "medium" | "hard" | "deadly";
  environment: string;
  enemies: { enemyId: string; count: number }[];
  description?: string;
}

export const PRESETS_KEY = "vtt-encounter-presets";

/** Load user-saved presets from localStorage */
export function loadUserPresets(): EncounterPreset[] {
  try {
    const raw = localStorage.getItem(PRESETS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/** Save user presets to localStorage */
export function saveUserPresets(presets: EncounterPreset[]): void {
  localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
}

/** Convert an EncounterPreset to EncounterEnemy[] for the store */
export function presetToEnemies(preset: EncounterPreset): EncounterEnemy[] {
  return preset.enemies.map((e) => ({
    enemyId: e.enemyId,
    count: e.count,
    customHp: undefined,
  }));
}
