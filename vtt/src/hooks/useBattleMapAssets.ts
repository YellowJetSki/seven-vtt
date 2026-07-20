/**
 * STᚱ VTT — useBattleMapAssets
 *
 * Hook for accessing the full battlemap asset pipeline.
 * Returns categorized asset arrays for:
 *   - Map thumbnails (_enc.png → public/images/maps/)
 *   - Token icons (_bm.png → public/images/tokens/)
 *   - Portrait images (_portrait.png → public/images/portraits/)
 *   - Item icons (_item.png → public/images/items/)
 *
 * Each asset references a PNG via imageUrl path that's served by Vite
 * from the public/ directory. The copy-assets Vite plugin ensures
 * all PNGs are synced from /images/ to /public/images/ on every build.
 *
 * Usage:
 *   const { mapAssets, tokenAssets, portraitAssets, itemAssets, allMaps } = useBattleMapAssets();
 *
 *   // Get a map by ID for loading onto canvas:
 *   const mapImage = mapAssets.find(m => m.id === "pmap-boathouse-01");
 *   // mapImage.imageUrl = "/images/maps/boathouse_enc.png"
 */

import { useMemo } from "react";
import {
  getAllAssetsForCategory,
  findAsset,
  type AssetEntry,
} from "@/images/assetCatalog";

export interface BattleMapAssetsResult {
  /** All map thumbnail assets (_enc.png) */
  mapAssets: AssetEntry[];
  /** All token icon assets (_bm.png) */
  tokenAssets: AssetEntry[];
  /** All portrait assets (_portrait.png) */
  portraitAssets: AssetEntry[];
  /** All item icon assets (_item.png) */
  itemAssets: AssetEntry[];
  /** All PNG assets across all categories (flat array) */
  allPngAssets: AssetEntry[];
  /** Get a specific asset by ID */
  getAssetById: (id: string) => AssetEntry | undefined;
  /** Get a specific asset by label */
  getAssetByLabel: (label: string) => AssetEntry | undefined;
  /** Get all battlemap-relevant assets (maps + tokens) */
  battlemapRelevant: AssetEntry[];
}

export function useBattleMapAssets(): BattleMapAssetsResult {
  const result = useMemo(() => {
    const mapAssets = getAllAssetsForCategory("map").filter(
      (a) => a.imageUrl && a.imageUrl.length > 0
    );
    const tokenAssets = getAllAssetsForCategory("token").filter(
      (a) => a.imageUrl && a.imageUrl.length > 0
    );
    const portraitAssets = getAllAssetsForCategory("portrait").filter(
      (a) => a.imageUrl && a.imageUrl.length > 0
    );
    const itemAssets = getAllAssetsForCategory("item").filter(
      (a) => a.imageUrl && a.imageUrl.length > 0
    );

    const allPngAssets = [...mapAssets, ...tokenAssets, ...portraitAssets, ...itemAssets];

    return {
      mapAssets,
      tokenAssets,
      portraitAssets,
      itemAssets,
      allPngAssets,
      getAssetById: (id: string) => findAsset(id),
      getAssetByLabel: (label: string) =>
        allPngAssets.find(
          (a) => a.label.toLowerCase() === label.toLowerCase()
        ),
      battlemapRelevant: [...mapAssets, ...tokenAssets],
    };
  }, []);

  return result;
}
