# VTT State & Firebase Schema

## Firestore Normalized Schema (13 Subcollections)

### campaigns/{campaignId} — CampaignMeta
```ts
{
  id: string;                    // e.g. "arkla"
  name: string;                  // "The Obelisks of Arkla"
  description: string;
  dmName: string;                // "MikeJello"
  settings: {
    experienceSystem: "xp" | "milestone";
    currencyName: string;        // "Gold Pieces" or "Assarions"
    privateDmNotes: string;      // Encrypted DM notes (screen-share safe)
    allowedRaces: string[];      // From CampaignWizard
    allowedClasses: string[];
    currencyPreset: string;      // "standard" | "arks" | "platinium"
  };
  stats: {
    characterCount: number;
    enemyCount: number;
    encounterCount: number;
    mapCount: number;
    journalCount: number;
    sessionCount: number;
  };
  createdAt: number;
  updatedAt: number;
}
```

### campaigns/{campaignId}/characters/{charId} — CharacterDoc
```ts
{
  id: string;                    // "pc_<timestamp>_<random>"
  name: string;                  // "Wendy Warmwind"
  playerName: string;            // "Wendy"
  race: string;                  // "Rock Gnome"
  class: string;                 // Legacy: primary class name
  subClass?: string;             // Legacy
  level: number;                 // Total level (sum of classes[].level)
  classes: ClassEntry[];         // Multi-class support
  experiencePoints: number;
  background: string;
  alignment: string;
  inspiration: boolean;
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  savingThrows: Record<string, { proficient: boolean; bonus: number }>;
  skills: Record<string, "none" | "proficient" | "expertise">;
  hitPoints: { current: number; max: number; temporary: number };
  armorClass: number;
  initiative: number;
  speed: { walk: number; fly?: number; swim?: number; climb?: number; burrow?: number; canHover?: boolean };
  hitDice: string;
  proficiencyBonus: number;
  conditions: string[];
  deathSaves: { successes: number; failures: number };
  temporaryHitPoints: number;
  traits: { name: string; description: string; source: string }[];
  proficiencies: { name: string; type: string; isProficient: boolean; notes?: string }[];
  languages: string[];
  features: { name: string; description: string; source: string }[];
  equipment: { slot: string; item: string; quantity: number; weight: number; notes: string }[];
  inventory: { name: string; quantity: number; weight: number; description: string; isEquipped: boolean }[];
  currency: { copper: number; silver: number; electrum: number; gold: number; platinum: number };
  appearance: string;
  backstory: string;
  allies: string;
  characterNotes: string;
  personalityTraits?: string;
  ideals?: string;
  bonds?: string;
  flaws?: string;
  imageUrl?: string;
  isHomebrew: boolean;
  createdAt: number;
  updatedAt: number;
}
```

### campaigns/{campaignId}/enemies/{enemyId} — EnemyDoc
```ts
{
  id: string;                    // "goblin", "skeleton", etc.
  name: string;
  type: "Aberration" | "Beast" | "Celestial" | "Construct" | "Dragon" | "Elemental" | "Fey" | "Fiend" | "Giant" | "Humanoid" | "Monstrosity" | "Ooze" | "Plant" | "Undead" | "Custom";
  size: "Tiny" | "Small" | "Medium" | "Large" | "Huge" | "Gargantuan";
  armorClass: number;
  hitPoints: { current: number; max: number; temporary: number };
  speed: number;
  abilities: { strength: number; dexterity: number; constitution: number; intelligence: number; wisdom: number; charisma: number };
  savingThrows: Partial<Record<string, number>>;
  skills: Record<string, number>;
  damageVulnerabilities: string[];
  damageResistances: string[];
  damageImmunities: string[];
  conditionImmunities: string[];
  senses: string;
  languages: string;
  challengeRating: number;
  traits?: string;
  actions?: string;
  reactions?: string;
  specialAbilities?: string;
  legendaryActions?: string;
  isHomebrew: boolean;
  imageUrl?: string;
  createdAt: number;
  updatedAt: number;
}
```

### campaigns/{campaignId}/encounters/{encounterId} — EncounterDoc
```ts
{
  id: string;
  name: string;
  description: string;
  environment: string;
  difficulty: string;
  isActive: boolean;
  enemyGroups: { enemyId: string; count: number; label?: string }[];
  createdAt: number;
  updatedAt: number;
}
```

### campaigns/{campaignId}/maps/{mapId} — MapDoc
```ts
{
  id: string;
  name: string;
  imageUrl?: string;
  imageFit?: "cover" | "contain" | "stretch";
  gridWidth: number;
  gridHeight: number;
  gridSize: number;
  gridColor?: string;
  gridOpacity?: number;
  notes?: string;
  drawings?: MapDrawingStroke[];
  createdAt: number;
  updatedAt: number;
}
```

### campaigns/{campaignId}/maps/{mapId}/tokens/{tokenId} — MapTokenDoc
```ts
{
  id: string;
  type: "player" | "enemy" | "npc" | "custom";
  label: string;
  x: number;
  y: number;
  color: string;
  size: number;
  visible: boolean;
  icon?: string;
  hp?: { current: number; max: number };
  speed?: number;
  imageUrl?: string;
  initiative?: number;
  statusMarkers?: string[];
  createdAt: number;
  updatedAt: number;
}
```

### campaigns/{campaignId}/journal/{entryId} — JournalEntryDoc
```ts
{
  id: string;
  title: string;
  content: string;
  tags: string[];
  type: "session" | "lore" | "quest" | "note" | "handout";
  sessionNumber?: number;
  createdAt: number;
  updatedAt: number;
}
```

### campaigns/{campaignId}/sessions/{sessionId} — SessionDoc
```ts
{
  id: string;
  name: string;
  phase: "exploration" | "combat" | "rest" | "downtime";
  startedAt: number | null;
  endedAt: number | null;
  currentScene?: string;
  currentMapUrl?: string;
  dmAnnouncement?: string;
  conditions: { weather: string; lighting: string; terrain: string };
  activeEncounterId: string | null;
  createdAt: number;
  updatedAt: number;
}
```

### campaigns/{campaignId}/sessions/{sessionId}/combatants/{combatantId} — SessionCombatantDoc
```ts
{
  id: string;
  name: string;
  type: "player" | "enemy" | "ally";
  initiative: number;
  armorClass: number;
  hitPoints: { current: number; max: number; temporary: number };
  statusEffects: { id: string; effect: string }[];
  isDead: boolean;
  isConcentrating: boolean;
  notes: string;
  imageUrl?: string;
  createdAt: number;
  updatedAt: number;
}
```

### campaigns/{campaignId}/combatLog/{logEntryId} — CombatLogEntryDoc
```ts
{
  id: string;
  timestamp: number;
  type: "damage" | "heal" | "temp_hp" | "status" | "death" | "revive" | "note" | "round_start";
  actorId: string;
  actorName: string;
  targetId?: string;
  targetName?: string;
  value?: number;
  description?: string;
  createdAt: number;
}
```

### homebrew/{campaignId}/items/{itemId} — HomebrewItemDoc
```ts
{
  id: string;
  name: string;
  category: string;            // weapon | armor | potion | scroll | wand | ring | wondrous | tool | ammunition | food | poison | other
  rarity: string;              // common | uncommon | rare | very_rare | legendary | artifact
  description: string;
  flavorText?: string;
  requiresAttunement: boolean;
  attunementDetails?: string;
  charges?: number;
  chargesMax?: number;
  chargesRecharge?: string;
  weight: number;
  value: number;
  isCursed: boolean;
  curseDetails?: string;
  imageUrl?: string;
  weaponData?: Record<string, unknown>;
  armorData?: Record<string, unknown>;
  potionData?: Record<string, unknown>;
  scrollData?: Record<string, unknown>;
  tags: string[];
  source: string;
  isHomebrew: boolean;
  createdAt: number;
  updatedAt: number;
}
```

### homebrew/{campaignId}/spells/{spellId} — HomebrewSpellDoc
```ts
{
  id: string;
  name: string;
  level: number;
  school: string;
  castingTime: string;
  ritual: boolean;
  components: string[];
  materialComponent?: string;
  concentration: boolean;
  duration: string;
  range: string;
  area?: string;
  classes: string[];
  description: string;
  atHigherLevels?: string;
  isHomebrew: boolean;
  source: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}
```

### homebrew/{campaignId}/feats/{featId} — HomebrewFeatDoc
```ts
{
  id: string;
  name: string;
  description: string;
  flavorText?: string;
  prerequisites: { type: string; description: string; ability?: string; minimumValue?: number }[];
  benefits: string[];
  repeatable: boolean;
  tags: string[];
  source: string;
  isHomebrew: boolean;
  createdAt: number;
  updatedAt: number;
}
```

---

## Zustand Client State Shapes

### authStore (persisted: `str-vtt-auth`)
```ts
{
  state: "unauthenticated" | "authenticated";
  role: "dm" | "player" | null;
  username: string | null;
  characterId: string | null;
  playerIdentifiers: { label: string; characterId: string }[];
  firebaseConnected: boolean;      // Runtime only (not persisted)
  firebaseAuthLoading: boolean;     // Runtime only
  firebaseAuthError: string | null; // Runtime only
}
```

### campaignStore (persisted: `str-vtt-campaign-normalized`)
```ts
{
  meta: CampaignMeta | null;
  characters: PlayerCharacter[];
  enemies: EnemyDoc[];
  encounters: Encounter[];
  battleMaps: BattleMap[];
  journal: JournalEntry[];
  mapTokens: Record<string, MapToken[]>;  // mapId → tokens
  campaign: Campaign | null;               // DERIVED — recomputed via buildCampaign()
  forcePushCounter: number;
  isLoading: boolean;                       // Runtime only
  error: string | null;                    // Runtime only
}
```

### combatStore (persisted: `str-vtt-combat`)
```ts
{
  activeEncounter: CombatEncounter | null;
  combatLog: CombatLogEntry[];
  liveSession: LiveSessionState;
}
```

### CombatEncounter
```ts
{
  id: string;
  name: string;
  combatants: Combatant[];
  round: number;
  currentCombatantIndex: number;
  turnStartedAt: number | null;
  phase: "prep" | "active" | "completed";
  startedAt: number | null;
  completedAt: number | null;
  elapsedSeconds: number;
  isPaused: boolean;
}
```

### Combatant
```ts
{
  id: string;
  name: string;
  type: "player" | "enemy" | "ally";
  initiative: number;
  armorClass: number;
  hitPoints: { current: number; max: number; temporary: number };
  statusEffects: { id: string; effect: string }[];
  isDead: boolean;
  isConcentrating: boolean;
  notes: string;
  imageUrl?: string;
}
```

### LiveSessionState
```ts
{
  activeEncounterId: string | null;
  phase: "exploration" | "combat" | "rest" | "downtime";
  currentScene?: string;
  currentMapUrl?: string;
  dmAnnouncement?: string;
  sessionStartedAt: number | null;
  lastShortRestAt: number | null;
  lastLongRestAt: number | null;
  conditions: {
    weather: "clear" | "cloudy" | "rain" | "storm" | "fog" | "snow";
    lighting: "bright" | "dim" | "darkness" | "magical_darkness";
    terrain: "normal" | "difficult" | "extreme" | "water" | "lava";
  };
}
```

### homebrewStore (persisted: `str-vtt-homebrew`)
```ts
{
  items: HomebrewItem[];
  feats: HomebrewFeat[];
  spells: HomebrewSpell[];
}
```

### uiStore (NOT persisted)
```ts
{
  sidebarOpen: boolean;
  activeModal: string | null;
  modalData: unknown;
  toasts: Toast[];       // Array of { id: string, message, type, duration? }
}
```

### sessionAnalyticsStore (NOT persisted)
```ts
{
  startTime: number | null;
  endTime: number | null;
  phaseTime: Record<string, number>;  // ms per phase
  totalDamageDealt: number;
  totalDamageTaken: number;
  encounterLog: { encounterId: string; startTime: number; endTime?: number; roundCount: number }[];
  noteCount: number;
}
```

---

## localStorage Keys Reference

| Key | Store | Content |
|-----|-------|---------|
| `str-vtt-auth` | authStore | Auth state, role, username, characterId |
| `str-vtt-campaign-normalized` | campaignStore | Full campaign state (meta, chars, enemies, encounters, maps, journal) |
| `str-vtt-combat` | combatStore | Active encounter, combat log, live session |
| `str-vtt-homebrew` | homebrewStore | Homebrew items, spells, feats |
| `vtt-sync-queue` | (useFirebaseSync) | Pending Firebase writes (offline queue) |
| `str_vtt_spotify_tokens` | spotifyStore | Spotify OAuth tokens |
| `str-vtt:theatric-data` | TheatricPage | Cross-tab bridge payload `{ mapId, tokenId }` |
| `str-vtt-scratch-pad` | DmQuickReference | Scratch pad text |
| `vtt-encounter-presets` | EncounterPresets | Saved encounter templates |
| `vtt-sync-queue` | useFirebaseSync | Persistent Firebase sync queue |
