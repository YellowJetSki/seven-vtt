/**
 * STᚱ VTT — Homebrew Import/Export Utilities
 *
 * Pure functions for serializing and deserializing homebrew collections.
 * Handles validation, deduplication, and file I/O.
 */

import type { HomebrewItem, HomebrewSpell, HomebrewFeat, HomebrewExport } from "@/types/homebrew";
import { HOME_EXPORT_VERSION } from "@/types/homebrew";

/**
 * Export all homebrew as a downloadable JSON blob.
 * Triggers a browser download with a descriptive filename.
 */
export function exportHomebrewToJSON(
  items: HomebrewItem[],
  spells: HomebrewSpell[],
  feats: HomebrewFeat[],
  campaignName?: string
): void {
  const payload: HomebrewExport = {
    version: HOME_EXPORT_VERSION,
    exportedAt: Date.now(),
    campaign: campaignName,
    items,
    spells,
    feats,
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
 * Returns parsed data or a descriptive error string.
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
    return { ok: true, data: parsed as HomebrewExport };
  } catch (e) {
    return { ok: false, error: `Parse error: ${(e as Error).message}` };
  }
}

/**
 * Merge imported entries with existing ones.
 * Deduplicates by name (case-insensitive) — existing entries keep their IDs.
 */
/**
 * Merge imported entries with existing ones.
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
    if (existingByName.has(key)) continue; // skip duplicates

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
