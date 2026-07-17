/* ── Campaign Builder ──────────────────────────────────────────
 * Cached campaign builder to prevent infinite re-render loops.
 * Only returns a new Campaign object when underlying data changes.
 * ─────────────────────────────────────────────────────────────── */

import type { CampaignBattleMap, Campaign, MapToken, JournalEntry } from "@/types";
import type { CampaignMeta } from "@/types/firestore";
import { buildCampaign } from "./normalization";

interface BuildInput {
  meta: CampaignMeta | null;
  characters: unknown[];
  encounters: unknown[];
  battleMaps: CampaignBattleMap[];
  mapTokens: Record<string, MapToken[]>;
  journal: JournalEntry[];
}

/**
 * Compute a stable hash from campaign data inputs.
 * Used to detect changes without deep equality checks.
 */
function computeHash(input: BuildInput): string {
  const parts = [
    input.meta?.updatedAt ?? 0,
    input.characters.length,
    input.encounters.length,
    input.battleMaps.length,
    Object.keys(input.mapTokens).length,
    input.journal.length,
  ];
  return parts.join(":");
}

/**
 * Build campaign with caching — only creates new object on actual data change.
 * Use this in Zustand `set()` callbacks instead of direct `buildCampaign()`.
 */
export function buildCampaignCached(
  input: BuildInput,
  prevHash: string,
): { campaign: Campaign | null; hash: string } {
  const hash = computeHash(input);
  if (hash === prevHash) {
    return { campaign: null, hash: prevHash };
  }
  return {
    campaign: buildCampaign(input as Parameters<typeof buildCampaign>[0]),
    hash,
  };
}
