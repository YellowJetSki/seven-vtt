/**
 * STᚱ VTT — Homebrew Import/Export Utilities (v2 — Enemies Integration)
 *
 * Pure functions for serializing and deserializing homebrew collections.
 * Handles validation, deduplication, and file I/O.
 * Extended to support enemies/NPCs alongside items/spells/feats.
 */

import type { HomebrewItem, HomebrewSpell, HomebrewFeat, HomebrewExport } from "@/types/homebrew";
import type { EnemyDoc } from "@/types";
import { HOME_EXPORT_VERSION } from "@/types/homebrew";

/**
 * Export homebrew + enemies as a downloadable JSON blob.
 */
export function exportHomebrewToJSON(
  items: HomebrewItem[],
  spells: HomebrewSpell[],
  feats: HomebrewFeat[],
  campaignName?: string,
  enemies?: EnemyDoc[]
): void {
  const payload: HomebrewExport = {
    version: HOME_EXPORT_VERSION,
    exportedAt: Date.now(),
    campaign: campaignName,
    items,
    spells,
    feats,
    enemies: enemies && enemies.length > 0 ? enemies : undefined,
  };

  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const date = new Date().toISOString().slice(0, 10);
  a.download = `homebrew_${campaignName ?? "export"}_${date}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Parse and validate a homebrew JSON export.
 */
export function parseHomebrewJSON(json: string): { ok: true; data: HomebrewExport } | { ok: false; error: string } {
  try {
    const parsed = JSON.parse(json);
    if (!parsed || typeof parsed !== "object") {
      return { ok: false, error: "Invalid JSON: expected an object." };
    }
    if (!Array.isArray(parsed.items) || !Array.isArray(parsed.spells) || !Array.isArray(parsed.feats)) {
      return { ok: false, error: "Invalid format: expected items, spells, and feats arrays." };
    }
    // Basic field validation
    for (const item of parsed.items) {
      if (!item.name) return { ok: false, error: `Item missing name: ${JSON.stringify(item).slice(0, 80)}` };
    }
    for (const spell of parsed.spells) {
      if (!spell.name) return { ok: false, error: `Spell missing name: ${JSON.stringify(spell).slice(0, 80)}` };
    }
    for (const feat of parsed.feats) {
      if (!feat.name) return { ok: false, error: `Feat missing name: ${JSON.stringify(feat).slice(0, 80)}` };
    }
    if (parsed.enemies !== undefined && !Array.isArray(parsed.enemies)) {
      return { ok: false, error: "Invalid format: enemies must be an array." };
    }
    if (parsed.enemies) {
      for (const enemy of parsed.enemies) {
        if (!enemy.name) return { ok: false, error: `Enemy missing name: ${JSON.stringify(enemy).slice(0, 80)}` };
      }
    }
    return { ok: true, data: parsed as HomebrewExport };
  } catch (e) {
    return { ok: false, error: `Parse error: ${(e as Error).message}` };
  }
}

/**
 * Merge imported items with existing ones.
 * Deduplicates by name (case-insensitive) — existing entries keep their IDs.
 */
export function mergeHomebrewImport<T extends { id: string; name: string; createdAt: number; updatedAt: number }>(
  existing: T[],
  imported: T[],
  isHomebrew: boolean
): T[] {
  const existingByName = new Set(existing.map((e) => e.name.toLowerCase().trim()));
  const now = Date.now();
  const newEntries: T[] = [];

  for (const entry of imported) {
    const key = entry.name.toLowerCase().trim();
    if (existingByName.has(key)) continue;

    const merged = {
      ...entry,
      id: `imp_${now}_${Math.random().toString(36).slice(2, 8)}`,
      isHomebrew,
      source: (isHomebrew ? "homebrew" : (entry as Record<string, unknown>).source ?? "import") as string,
      createdAt: now,
      updatedAt: now,
    } as unknown as T;
    newEntries.push(merged);
    existingByName.add(key);
  }

  return [...existing, ...newEntries];
}

/**
 * Merge imported enemies with existing ones.
 * Deduplicates by name (case-insensitive).
 */
export function mergeEnemyImport(
  existing: EnemyDoc[],
  imported: EnemyDoc[]
): EnemyDoc[] {
  const existingByName = new Set(existing.map((e) => e.name.toLowerCase().trim()));
  const now = Date.now();
  const newEntries: EnemyDoc[] = [];

  for (const entry of imported) {
    const key = entry.name.toLowerCase().trim();
    if (existingByName.has(key)) continue;

    const merged: EnemyDoc = {
      ...entry,
      id: `imp_enemy_${now}_${Math.random().toString(36).slice(2, 8)}`,
      isHomebrew: true,
      createdAt: now,
      updatedAt: now,
    };
    newEntries.push(merged);
    existingByName.add(key);
  }

  return [...existing, ...newEntries];
}
