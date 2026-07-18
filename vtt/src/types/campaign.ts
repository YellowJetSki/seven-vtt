// ── Campaign Data Models ──────────────────────────────────────

export interface CampaignMeta {
  id: string;
  name: string;
  description: string;
  dmName: string;
  settings: CampaignSettings;
  stats: CampaignStats;
  createdAt: number;
  updatedAt: number;
}

export interface CampaignSettings {
  experienceSystem: "xp" | "milestone";
  currencyName: string;
  privateDmNotes: string;
  allowedRaces: string[];
  allowedClasses: string[];
  currencyPreset: string;
}

export interface CampaignStats {
  characterCount: number;
  enemyCount: number;
  encounterCount: number;
  mapCount: number;
  journalCount: number;
  sessionCount: number;
}
