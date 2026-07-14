/* ── Firestore Collection & Document Schemas ───────────────────
 *
 * This file documents the Firestore data model for the STᚱ VTT.
 * Collections are top-level, with subcollections denoted by "→".
 *
 * ── Collections ──────────────────────────────────────────────
 *
 * campaigns/{campaignId}
 *   ├── name: string
 *   ├── description: string
 *   ├── dmName: string
 *   ├── settings: { homebrewRules, experienceSystem, currencyName, privateDmNotes }
 *   ├── createdAt: Timestamp
 *   └── updatedAt: Timestamp
 *
 * campaigns/{campaignId}/characters/{characterId}
 *   → Full PlayerCharacter type (see @/types)
 *
 * campaigns/{campaignId}/encounters/{encounterId}
 *   → Full Encounter type
 *
 * campaigns/{campaignId}/maps/{mapId}
 *   → Full BattleMap type
 *
 * campaigns/{campaignId}/journal/{entryId}
 *   → Full JournalEntry type
 *
 * ── Security Rules (Index) ───────────────────────────────────
 * All reads/writes require authentication.
 * DM has full read/write. Players read-only for their campaign.
 * ──────────────────────────────────────────────────────────── */

/**
 * Collection path helpers to ensure consistent path construction.
 */
export const COLLECTIONS = {
  campaigns: "campaigns",
  characters: (campaignId: string) =>
    `campaigns/${campaignId}/characters` as const,
  encounters: (campaignId: string) =>
    `campaigns/${campaignId}/encounters` as const,
  maps: (campaignId: string) => `campaigns/${campaignId}/maps` as const,
  journal: (campaignId: string) => `campaigns/${campaignId}/journal` as const,
} as const;

export const SCHEMA_VERSION = "1.0.0";
