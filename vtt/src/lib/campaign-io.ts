/* ── Campaign Import/Export Utilities ──────────────────────────
 * Handles import and export of campaign data including
 * full backup bundles with homebrew data integrated.
 * ─────────────────────────────────────────────────────────────── */

import type { Campaign, HomebrewItem, HomebrewFeat, HomebrewSpell } from "@/types";

/* ── Export Bundle Format ───────────────────────────────────── */

export interface FullExportBundle {
  exportedAt: number;
  appVersion: string;
  campaign: Campaign;
  homebrew: HomebrewBundle;
}

export interface HomebrewBundle {
  items: HomebrewItem[];
  feats: HomebrewFeat[];
  spells: HomebrewSpell[];
}

/**
 * Triggers a browser download of the campaign as a JSON file.
 */
export function exportCampaign(campaign: Campaign): void {
  const blob = new Blob([JSON.stringify(campaign, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${campaign.name.replace(/\s+/g, "-").toLowerCase()}-campaign-${new Date().toISOString().split("T")[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Reads a JSON file from a File object and parses it as a Campaign.
 * Returns the parsed Campaign or throws a descriptive error.
 */
export async function importCampaignFromFile(file: File): Promise<Campaign> {
  const text = await file.text();
  const data = JSON.parse(text);

  // Check if this is a full bundle with campaign + homebrew
  if (data.campaign && data.campaign.name && data.campaign.id) {
    return data.campaign as Campaign;
  }

  // Validate required campaign fields
  if (!data.name || !data.id) {
    throw new Error("Invalid campaign file: missing required fields (name, id).");
  }

  // Validate timestamps
  if (!data.createdAt) data.createdAt = Date.now();
  if (!data.updatedAt) data.updatedAt = Date.now();

  // Ensure sub-arrays exist
  data.playerCharacters = data.playerCharacters ?? [];
  data.encounters = data.encounters ?? [];
  data.battleMaps = data.battleMaps ?? [];
  data.journal = data.journal ?? [];

  // Ensure settings exist
  if (!data.settings) {
    data.settings = {
      experienceSystem: "milestone",
      currencyName: "Gold Pieces",
      privateDmNotes: "",
    };
  }

  return data as Campaign;
}

/**
 * Tries to extract homebrew data from a full export bundle.
 * Returns null if no homebrew data is present.
 */
export function extractHomebrewFromBundle(data: unknown): HomebrewBundle | null {
  if (!data || typeof data !== "object") return null;
  const bundle = data as Record<string, unknown>;
  if (!bundle.homebrew || typeof bundle.homebrew !== "object") return null;
  const hb = bundle.homebrew as Record<string, unknown>;
  return {
    items: Array.isArray(hb.items) ? hb.items as HomebrewItem[] : [],
    feats: Array.isArray(hb.feats) ? hb.feats as HomebrewFeat[] : [],
    spells: Array.isArray(hb.spells) ? hb.spells as HomebrewSpell[] : [],
  };
}
