/* ── Firestore Collection & Document Schemas ───────────────────
 *
 * This file documents the Firestore data model for the STᚱ VTT.
 * Collections are top-level, with embedded arrays for sub-data.
 *
 * ── Collections ──────────────────────────────────────────────
 *
 * campaigns/{campaignId}
 *   ─ Single document containing all campaign data (embedded arrays).
 *   ─ 1MB Firestore doc limit is sufficient for a single campaign.
 *   ├── name: string
 *   ├── description: string
 *   ├── dmName: string
 *   ├── settings: { homebrewRules, experienceSystem, currencyName, privateDmNotes }
 *   ├── playerCharacters: PlayerCharacter[] (embedded)
 *   ├── encounters: Encounter[] (embedded)
 *   ├── battleMaps: BattleMap[] (embedded)
 *   ├── journal: JournalEntry[] (embedded)
 *   ├── createdAt: number
 *   └── updatedAt: number
 *
 * liveSessions/{campaignId}
 *   ─ Real-time combat & session state for player-facing sync.
 *   ├── activeEncounter: CombatEncounter | null
 *   ├── combatLog: CombatLogEntry[]
 *   ├── liveSession: LiveSessionState
 *   ├── updatedAt: number
 *   └── updatedBy: string (UID)
 *
 * homebrew/{campaignId}
 *   ─ Homebrew library per campaign.
 *   ├── items: HomebrewItem[]
 *   ├── feats: HomebrewFeat[]
 *   ├── spells: HomebrewSpell[]
 *   └── updatedAt: number
 *
 * ── Security Rules ───────────────────────────────────────────
 * All reads require authentication.
 * DM (email ending with @strvtt.local) has full write access.
 * Players can read campaign, liveSession, and homebrew data.
 * ──────────────────────────────────────────────────────────── */

/**
 * Collection path helpers to ensure consistent path construction.
 * Note: All sub-data is now embedded in single documents,
 * so only top-level collection paths are needed.
 */
export const COLLECTIONS = {
  campaigns: "campaigns",
  liveSessions: "liveSessions",
  homebrew: "homebrew",
} as const;

/**
 * Helper to build a full Firestore document path.
 */
export function docPath(collection: string, docId: string): string {
  return `${collection}/${docId}`;
}

export const SCHEMA_VERSION = "2.0.0";
