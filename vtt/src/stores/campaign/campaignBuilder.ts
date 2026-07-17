/* ── Campaign Builder ──────────────────────────────────────────
 * Cached campaign builder to prevent infinite re-render loops.
 * Only returns a new Campaign object when underlying data changes.
 * Uses content-based hashing (names + counts) rather than timestamps
 * to avoid spurious rebuilds from `setCampaign` with new Date.now().
 * ─────────────────────────────────────────────────────────────── */

import type { Campaign, MapToken, JournalEntry, BattleMap } from "@/types";
import type { CampaignMeta } from "@/types/firestore";
import { buildCampaign } from "./normalization";

interface BuildInput {
  meta: CampaignMeta | null;
  characters: unknown[];
  encounters: unknown[];
  battleMaps: BattleMap[];
  mapTokens: Record<string, MapToken[]>;
  journal: JournalEntry[];
}

/**
 * Compute a stable content hash from campaign data inputs.
 * Uses character/enemy/encounter names + counts rather than timestamps.
 */
function computeHash(input: BuildInput): string {
  const metaId = input.meta?.id ?? "none";
  const charNames = (input.characters as Array<{id: string; name: string; level: number}>)
    .map(c => `${c.id}:${c.name}:${c.level}`).join(",");
  const encNames = (input.encounters as Array<{id: string; name: string}>)
    .map(e => `${e.id}:${e.name}`).join(",");
  const mapNames = (input.battleMaps as Array<{id: string; name: string}>)
    .map(m => `${m.id}:${m.name}`).join(",");
  const jNames = (input.journal as Array<{id: string; title: string}>)
    .map(j => `${j.id}:${j.title}`).join(",");
  return `${metaId}|${charNames}|${encNames}|${mapNames}|${jNames}`;
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
  const built = buildCampaign(input as Parameters<typeof buildCampaign>[0]);
  return { campaign: built, hash };
}
