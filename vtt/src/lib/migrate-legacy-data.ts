/* ── Legacy Data Migration ─────────────────────────────────────
 *
 * On first load with the new normalized store, this migrates data
 * from the old monolithic localStorage keys to the new format.
 *
 * Old keys:
 *   str-vtt-campaign    → { campaign: Campaign }
 *   str-vtt-combat      → { activeEncounter, combatLog, liveSession }
 *   str-vtt-homebrew    → { items, spells, feats }
 *
 * New keys:
 *   str-vtt-campaign-normalized  → { meta, characters, enemies, encounters, battleMaps, mapTokens, journal }
 *   str-vtt-combat               → (unchanged)
 *   str-vtt-homebrew             → (unchanged)
 * ─────────────────────────────────────────────────────────────── */

import type { Campaign } from "@/types";
import type { CampaignMeta } from "@/types/firestore";

const LEGACY_CAMPAIGN_KEY = "str-vtt-campaign";
const NEW_CAMPAIGN_KEY = "str-vtt-campaign-normalized";

interface LegacyCampaignStorage {
  state: {
    campaign: Campaign | null;
    forcePushCounter: number;
  };
}

interface NewCampaignStorage {
  state: {
    meta: CampaignMeta | null;
    characters: unknown[];
    enemies: unknown[];
    encounters: unknown[];
    battleMaps: unknown[];
    mapTokens: Record<string, unknown[]>;
    journal: unknown[];
    forcePushCounter: number;
  };
}

/**
 * Checks if legacy campaign data exists and migrates it to the new
 * normalized format. Idempotent — safe to call on every app load.
 * Returns true if migration was performed.
 */
export function migrateLegacyCampaignData(): boolean {
  // Skip if already migrated
  const newData = localStorage.getItem(NEW_CAMPAIGN_KEY);
  if (newData) return false;

  // Check for legacy data
  const legacyRaw = localStorage.getItem(LEGACY_CAMPAIGN_KEY);
  if (!legacyRaw) return false;

  try {
    const legacy: LegacyCampaignStorage = JSON.parse(legacyRaw);
    if (!legacy.state?.campaign) return false;

    const campaign = legacy.state.campaign;

    // Build normalized structure
    const normalized: NewCampaignStorage = {
      state: {
        meta: {
          id: campaign.id,
          name: campaign.name,
          description: campaign.description,
          dmName: campaign.dmName,
          settings: campaign.settings || {
            homebrewRules: [],
            experienceSystem: "xp",
            currencyName: "Gold",
            privateDmNotes: "",
          },
          createdAt: campaign.createdAt,
          updatedAt: campaign.updatedAt,
          stats: {
            characterCount: campaign.playerCharacters?.length ?? 0,
            enemyCount: campaign.encounters?.reduce((sum, e) => sum + (e.creatures?.length ?? 0), 0) ?? 0,
            encounterCount: campaign.encounters?.length ?? 0,
            mapCount: campaign.battleMaps?.length ?? 0,
            journalCount: campaign.journal?.length ?? 0,
            sessionCount: 0,
          },
        },
        characters: campaign.playerCharacters ?? [],
        enemies: campaign.encounters?.flatMap((e) =>
          (e.creatures ?? []).filter(
            (c) => !campaign.playerCharacters?.some((pc) => pc.id === c.id),
          ),
        ) ?? [],
        encounters: campaign.encounters ?? [],
        battleMaps: (campaign.battleMaps ?? []).map(({ tokens, fogOfWar, ...rest }) => ({
          ...rest,
          fogOfWar: fogOfWar ?? [],
        })),
        mapTokens: Object.fromEntries(
          (campaign.battleMaps ?? []).map((bm) => [bm.id, bm.tokens ?? []]),
        ),
        journal: campaign.journal ?? [],
        forcePushCounter: Date.now(),
      },
    };

    localStorage.setItem(NEW_CAMPAIGN_KEY, JSON.stringify(normalized));
    console.log("[Migration] Legacy campaign data migrated to normalized format.");
    return true;
  } catch (err) {
    console.error("[Migration] Failed to migrate legacy campaign data:", err);
    return false;
  }
}

/**
 * Checks whether the migration has been done.
 */
export function isMigrationComplete(): boolean {
  return localStorage.getItem(NEW_CAMPAIGN_KEY) !== null;
}
