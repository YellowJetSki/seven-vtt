/* ── Legacy Data Migration ─────────────────────────────────────
 * Utility to convert legacy monolithic Campaign objects stored in
 * the old Zustand persist middleware into the new normalized format.
 *
 * This runs once and marks the migration in localStorage so it
 * doesn't run again on subsequent page loads.
 * ─────────────────────────────────────────────────────────────── */

import { useCampaignStore } from "@/stores/campaignStore";
import type { Campaign } from "@/types";
import type { CampaignMeta, MapTokenDoc } from "@/types/firestore";

const MIGRATION_KEY = "vtt-migration-v2-complete";

/**
 * Check if migration has already been performed.
 */
export function isMigrated(): boolean {
  try {
    return localStorage.getItem(MIGRATION_KEY) === "true";
  } catch {
    return false;
  }
}

/**
 * Mark migration as complete.
 */
export function markMigrated(): void {
  try {
    localStorage.setItem(MIGRATION_KEY, "true");
  } catch {
    // localStorage unavailable — skip
  }
}

/**
 * Migrate a legacy Campaign object into the new normalized store format.
 * This calls setCampaign on the campaign store which handles normalization.
 */
export function migrateLegacyCampaign(campaign: Campaign): void {
  if (!campaign) return;

  const store = useCampaignStore.getState();

  // Build normalized state from legacy campaign
  const meta: CampaignMeta = {
    id: campaign.id,
    name: campaign.name,
    description: campaign.description,
    dmName: campaign.dmName,
    settings: campaign.settings ?? {
      homebrewRules: [],
      experienceSystem: "xp" as const,
      currencyName: "Gold",
      privateDmNotes: "",
    },
    createdAt: campaign.createdAt,
    updatedAt: campaign.updatedAt,
    stats: {
      characterCount: campaign.playerCharacters?.length ?? 0,
      enemyCount: campaign.encounters?.reduce((sum, e) => sum + (e.enemies?.reduce((s, ee) => s + (ee.count || 1), 0) ?? 0), 0) ?? 0,
      encounterCount: campaign.encounters?.length ?? 0,
      mapCount: campaign.battleMaps?.length ?? 0,
      journalCount: campaign.journal?.length ?? 0,
      sessionCount: 0,
    },
  };

  const characters = campaign.playerCharacters ?? [];

  const encounters = campaign.encounters ?? [];

  const battleMaps = (campaign.battleMaps ?? []).map((bm) => ({
    id: bm.id,
    name: bm.name,
    imageUrl: bm.imageUrl,
    imageFit: (bm.imageFit ?? "cover") as "cover" | "contain" | "stretch",
    gridWidth: bm.gridWidth,
    gridHeight: bm.gridHeight,
    gridSize: bm.gridSize,
    gridColor: bm.gridColor ?? "rgba(255,255,255,0.35)",
    fogOfWar: bm.fogOfWar ?? [],
    tokens: bm.tokens ?? [],
    notes: bm.notes,
    createdAt: bm.createdAt,
    updatedAt: bm.updatedAt,
  }));

  const mapTokens: Record<string, MapTokenDoc[]> = Object.fromEntries(
    (campaign.battleMaps ?? []).map((bm) => [bm.id, (bm.tokens ?? []) as unknown as MapTokenDoc[]]),
  );

  const journal = campaign.journal ?? [];

  // Push to store
  store.setMeta(meta);
  store.setCampaign(campaign);

  // Mark migration
  markMigrated();
}

/**
 * Run migration automatically if needed.
 * Call this in App.tsx on mount.
 */
export function runMigrationIfNeeded(): void {
  if (isMigrated()) return;

  try {
    // Check old localStorage key for legacy campaign data
    const oldData = localStorage.getItem("vtt-campaign-store");
    if (oldData) {
      try {
        const parsed = JSON.parse(oldData);
        const state = parsed?.state;
        if (state?.campaign) {
          migrateLegacyCampaign(state.campaign);
          return;
        }
      } catch {
        // Ignore parse errors
      }
    }

    // Also check for a standalone "campaign" key
    const standalone = localStorage.getItem("vtt-campaign");
    if (standalone) {
      try {
        const campaign = JSON.parse(standalone);
        if (campaign?.id) {
          migrateLegacyCampaign(campaign);
          return;
        }
      } catch {
        // Ignore
      }
    }

    // No data to migrate — mark as done
    markMigrated();
  } catch {
    markMigrated();
  }
}
