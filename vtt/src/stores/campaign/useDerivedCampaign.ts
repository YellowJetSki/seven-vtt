/* ── Derived Campaign Selector ─────────────────────────────────
 * Stable selector that returns a memoized Campaign object.
 * Only recomputes when the underlying normalized data changes.
 * Prevents the infinite re-render loop caused by storing `campaign`
 * as a derived field in the Zustand state (which creates new refs on
 * every state update).
 * ─────────────────────────────────────────────────────────────── */

import { useRef } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import { buildCampaign } from "./normalization";
import type { Campaign } from "@/types";

export function useDerivedCampaign(): Campaign | null {
  const meta = useCampaignStore((s) => s.meta);
  const characters = useCampaignStore((s) => s.characters);
  const encounters = useCampaignStore((s) => s.encounters);
  const battleMaps = useCampaignStore((s) => s.battleMaps);
  const mapTokens = useCampaignStore((s) => s.mapTokens);
  const journal = useCampaignStore((s) => s.journal);

  const prevRef = useRef<{ json: string; campaign: Campaign | null }>({ json: "", campaign: null });

  const currentJson = JSON.stringify({ meta, characters, encounters, battleMaps, mapTokens, journal });
  if (currentJson !== prevRef.current.json) {
    const built = buildCampaign({ meta, characters, encounters, battleMaps, mapTokens, journal });
    prevRef.current = { json: currentJson, campaign: built };
  }

  return prevRef.current.campaign;
}
