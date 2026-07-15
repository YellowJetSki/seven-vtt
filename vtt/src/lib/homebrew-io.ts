/* ── Homebrew Import & Export Utilities ────────────────────────
 * Functions for importing/exporting homebrew data as JSON files.
 * Supports items, feats, and spells.
 * ─────────────────────────────────────────────────────────────── */

import type { HomebrewItem, HomebrewFeat, HomebrewSpell } from "@/types/homebrew";

export interface HomebrewExport {
  version: 1;
  exportedAt: string;
  source: "STᚱ VTT";
  items: HomebrewItem[];
  feats: HomebrewFeat[];
  spells: HomebrewSpell[];
}

/**
 * Exports the entire homebrew library as a downloadable JSON file.
 */
export function exportHomebrew(
  items: HomebrewItem[],
  feats: HomebrewFeat[],
  spells: HomebrewSpell[],
): void {
  const data: HomebrewExport = {
    version: 1,
    exportedAt: new Date().toISOString(),
    source: "STᚱ VTT",
    items,
    feats,
    spells,
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `homebrew-library-${new Date().toISOString().split("T")[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export interface ImportResult {
  success: boolean;
  itemsAdded: number;
  featsAdded: number;
  spellsAdded: number;
  errors: string[];
}

/**
 * Imports homebrew data from a parsed JSON file.
 * Validates structure and returns a count of what was added.
 */
export function importHomebrew(
  data: unknown,
  addItem: (item: HomebrewItem) => void,
  addFeat: (feat: HomebrewFeat) => void,
  addSpell: (spell: HomebrewSpell) => void,
): ImportResult {
  const result: ImportResult = {
    success: false,
    itemsAdded: 0,
    featsAdded: 0,
    spellsAdded: 0,
    errors: [],
  };

  // Validate structure
  if (!data || typeof data !== "object") {
    result.errors.push("Invalid format: expected a JSON object.");
    return result;
  }

  const payload = data as Record<string, unknown>;

  // Check version
  if (payload.version !== 1) {
    result.errors.push(`Unsupported version: ${payload.version}. Expected version 1.`);
    return result;
  }

  // Import items
  if (Array.isArray(payload.items)) {
    for (const item of payload.items) {
      if (isValidItem(item)) {
        addItem(item as HomebrewItem);
        result.itemsAdded++;
      } else {
        result.errors.push(`Skipped invalid item: "${(item as Record<string, unknown>)?.name ?? "unknown"}"`);
      }
    }
  }

  // Import feats
  if (Array.isArray(payload.feats)) {
    for (const feat of payload.feats) {
      if (isValidFeat(feat)) {
        addFeat(feat as HomebrewFeat);
        result.featsAdded++;
      } else {
        result.errors.push(`Skipped invalid feat: "${(feat as Record<string, unknown>)?.name ?? "unknown"}"`);
      }
    }
  }

  // Import spells
  if (Array.isArray(payload.spells)) {
    for (const spell of payload.spells) {
      if (isValidSpell(spell)) {
        addSpell(spell as HomebrewSpell);
        result.spellsAdded++;
      } else {
        result.errors.push(`Skipped invalid spell: "${(spell as Record<string, unknown>)?.name ?? "unknown"}"`);
      }
    }
  }

  result.success = result.errors.length === 0 || result.itemsAdded + result.featsAdded + result.spellsAdded > 0;
  return result;
}

/* ── Validation Helpers ─────────────────────────────────────── */

function isValidItem(obj: unknown): boolean {
  if (!obj || typeof obj !== "object") return false;
  const item = obj as Record<string, unknown>;
  return (
    typeof item.id === "string" &&
    typeof item.name === "string" &&
    typeof item.category === "string" &&
    typeof item.rarity === "string" &&
    typeof item.description === "string"
  );
}

function isValidFeat(obj: unknown): boolean {
  if (!obj || typeof obj !== "object") return false;
  const feat = obj as Record<string, unknown>;
  return (
    typeof feat.id === "string" &&
    typeof feat.name === "string" &&
    typeof feat.description === "string" &&
    Array.isArray(feat.prerequisites) &&
    Array.isArray(feat.benefits)
  );
}

function isValidSpell(obj: unknown): boolean {
  if (!obj || typeof obj !== "object") return false;
  const spell = obj as Record<string, unknown>;
  return (
    typeof spell.id === "string" &&
    typeof spell.name === "string" &&
    typeof spell.level === "number" &&
    typeof spell.school === "string" &&
    typeof spell.castingTime === "string" &&
    Array.isArray(spell.components) &&
    typeof spell.description === "string"
  );
}
