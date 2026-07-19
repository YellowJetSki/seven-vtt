# STᚱ VTT State & Schema Reference
**Version:** 2.0.0 — Theatric View & Modular Overhaul
**Deployed at:** https://arkla.vercel.app
**Last updated:** 2026-07-18 (Cycle 9)

---

## Dual-Screen Data Flow

```
DM Tab (Master)                    Theatric Tab (Slave)
─────────────────                  ─────────────────
campaignStore ──writes──►   same campaignStore ◄──reads── canvas
  (Zustand persist)           (in-memory sync via        (useTheatricCanvas)
   battleMaps[]                same JS runtime,
   mapTokens{}                 Zustand subscription)
   aoeTemplates[]

theatricStore (no persist)
  ├── activeMapId
  ├── camera {x, y, zoom, rotation}
  ├── showFog, showLabels
  └── isConnected
```

### Sync Mechanism
Both DM and Theatric tabs run in the same browser, sharing Zustand stores in-memory. No Firebase real-time sync is needed for single-machine setups. The theatric store's `isConnected` flag provides UI feedback for the connection state.

---

## Zustand Store Keys (localStorage)

| Key | Store | Persist | Purpose |
|-----|-------|---------|---------|
| `str-vtt-auth` | authStore | ✅ | Auth state, role, username |
| `str-vtt-campaign-normalized` | campaignStore | ✅ | Full campaign state (meta, characters, enemies, maps, tokens) |
| `str-vtt-combat` | combatStore | ✅ | Encounter, combatants, log, session |
| `str-vtt-compendium` | compendiumStore | ✅ | SRD items, spells, monsters for drag-and-drop |
| *(none)* | theatricStore | ❌ | Theatric camera, mapId, connection state (volatile) |
| *(none)* | uiStore | ❌ | UI state (toasts, modals, sidebar open) |
| `vtt-sync-queue` | sync-queue | ✅ | Pending Firebase writes (offline queue) |

---

## TheatricStore Schema (Volatile — No Persist)

```typescript
interface TheatricState {
  activeMapId: string | null;
  camera: {
    x: number;          // Pan offset (pixels)
    y: number;
    zoom: number;       // Zoom level (1 = default)
    rotation: number;   // Camera rotation (radians)
  };
  showFog: boolean;             // Fog of war visibility on theatric
  showLabels: boolean;          // Token label visibility
  isConnected: boolean;         // Connection status for UI indicator
  lastSyncAt: number | null;    // Last timestamp

  // Actions
  setActiveMap(mapId: string | null): void;
  setCamera(camera: Partial<TheatricCamera>): void;
  setShowFog(show: boolean): void;
  setShowLabels(show: boolean): void;
  setConnected(connected: boolean): void;
  setLastSync(): void;
  reset(): void;
}
```

### State Lifecycle
1. **DM tab open** → `isConnected = false`, `activeMapId = null`
2. **DM selects map** → `setActiveMap(mapId)` → theatric tab picks up via shared store
3. **Theatric tab opens** → reads `activeMapId`, subscribes to `campaignStore.battleMaps`
4. **During session** → `camera` updates on canvas interactions
5. **Tab close** → state lost (no persist) → fresh start on reopen

---

## CampaignStore Schema (Sliced Architecture)

### Slices (3 modular slices composed in campaignStore.ts)

```
campaignStore = metaSlice + characterSlice + entitySlice

metaSlice
├── meta: CampaignMeta
├── campaign: CampaignMeta     // duplicate for compatibility
└── setMeta, updateMeta

characterSlice
├── characters: PlayerCharacter[]
├── mapTokens: Record<string, MapToken[]>
├── forcePushCounter: number
├── addCharacter, updateCharacter, removeCharacter
├── addMapToken, updateMapToken, removeMapToken
└── forcePush // increments counter for UI refresh

entitySlice
├── enemies: EnemyDoc[]
├── encounters: Encounter[]
├── battleMaps: BattleMap[]
├── journal: JournalEntry[]
├── addEnemy, updateEnemy, removeEnemy
├── addEncounter, updateEncounter, removeEncounter
├── addBattleMap, updateBattleMap, removeBattleMap
├── addJournalEntry, updateJournalEntry, removeJournalEntry
├── addAoETemplate, updateAoETemplate, removeAoETemplate
└── setCampaignFromFull // bulk load from Firestore
```

### CampaignMeta
```
campaigns/{campaignId}
├── id: string
├── name: string
├── description: string
├── dmName: string
├── settings: {
│   ├── experienceSystem: "xp" | "milestone"
│   ├── currencyName: string
│   ├── privateDmNotes: string
│   ├── allowedRaces: string[]
│   ├── allowedClasses: string[]
│   └── currencyPreset: string
├── stats: {
│   ├── characterCount, enemyCount, encounterCount
│   ├── mapCount, journalCount, sessionCount
├── createdAt: number
└── updatedAt: number
```

### PlayerCharacter
```
characters/{charId}
├── id, name, playerName, race, class, subClass, level
├── classes: [{name, level, subclass?}]
├── experiencePoints, background, alignment, inspiration
├── strength..charisma (6 abilities, 3-30)
├── savingThrows: { [ability]: {proficient: boolean, bonus: number} }
├── skills: { [skillName]: "none"|"proficient"|"expertise" }
├── hitPoints: {current, max, temporary}
├── armorClass, initiative (number)
├── speed: {walk, fly?, swim?, climb?, burrow?, canHover?}
├── hitDice, proficiencyBonus
├── conditions: ConditionId[]
├── deathSaves: {successes: 0-3, failures: 0-3}
├── temporaryHitPoints
├── traits, proficiencies, languages, features: string[]
├── equipment: [{slot, item, quantity, weight, notes}]
├── inventory: [{name, quantity, weight, description, isEquipped}]
├── currency: {copper, silver, electrum, gold, platinum}
├── appearance, backstory, allies, characterNotes
├── personalityTraits?, ideals?, bonds?, flaws?
├── imageUrl?, isHomebrew
├── spellSlots?: {level1..9: {current, max}}
├── resources?: [{name, current, max, recharge}]
└── createdAt, updatedAt
```

### BattleMap + MapToken
```
maps/{mapId}
├── id, name, imageUrl?, imageFit?
├── gridWidth, gridHeight, gridSize
├── gridColor?, gridOpacity?, notes?
├── drawings?: [{id, points, color, width, tool}]
├── aoeTemplates?: AoETemplate[]
└── createdAt, updatedAt

maps/{mapId}/tokens/{tokenId}
├── id, type ("player"|"enemy"|"npc"), label
├── x, y (grid coordinates)
├── color, size (1-4), visible
├── icon?, hp?: {current, max}, speed?, imageUrl?
├── initiative?, statusMarkers?: string[]
└── createdAt, updatedAt
```

### AoETemplate
```
AoETemplate
├── id: string
├── label: string
├── shape: "circle" | "cone" | "line" | "cube" | "sphere"
├── size: number (feet)
├── gridX, gridY: number
├── direction: "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw"
├── color: string (hex)
├── opacity: number (0-1)
├── savingThrowDC?: number
├── savingThrowAbility?: "strength" | "dexterity" | "constitution" | ...
├── damageDice?: string (e.g. "8d6")
├── damageType?: string
└── visibleToPlayers: boolean
```

### AoE Preset Spells (8 built-in)
| Spell | Shape | Size | Color | Damage |
|-------|-------|------|-------|--------|
| Fireball | sphere | 20ft | #FF6B35 | Fire |
| Burning Hands | cone | 15ft | #FF4500 | Fire |
| Lightning Bolt | line | 100ft | #FFD700 | Lightning |
| Cone of Cold | cone | 60ft | #00BFFF | Cold |
| Bless | circle | 30ft | #FFD700 | — |
| Spirit Guardians | circle | 15ft | #8B5CF6 | Radiant |
| Moonbeam | circle | 5ft | #C8D8FF | Radiant |
| Hypnotic Pattern | cube | 30ft | #FF69B4 | — |

### EnemyDoc
```
enemies/{enemyId}
├── id, name, type, size
├── armorClass, hitPoints, speed
├── abilities: {strength..charisma}
├── savingThrows, skills, damageVulnerabilities/Resistances/Immunities
├── conditionImmunities, senses, languages
├── challengeRating
├── traits?, actions?, reactions?, specialAbilities?, legendaryActions?
└── isHomebrew, imageUrl?, createdAt, updatedAt
```

### Encounter
```
encounters/{encId}
├── id, name, description, environment, difficulty, isActive
├── enemyGroups: [{enemyId, count, label?}]
└── createdAt, updatedAt
```

### JournalEntry
```
journal/{entryId}
├── id, title, content, tags
├── type: "session" | "lore" | "quest" | "note" | "handout"
├── sessionNumber?, createdAt, updatedAt
```

### CombatEncounter (Zustand only — no Firestore)
```
activeEncounter: {
  id, name
  combatants: Combatant[]
  round, currentCombatantIndex, turnStartedAt
  phase: "prep" | "active" | "completed"
  startedAt, completedAt, elapsedSeconds, isPaused
}
```

### Combatant
```
Combatant {
  id, name, type ("player"|"enemy"|"ally")
  initiative, armorClass
  hitPoints: {current, max, temporary}
  statusEffects: [{id, effect}]
  isDead, isConcentrating, notes, imageUrl?
}
```

---

## Firestore Security Rules

### Access Matrix (13+ paths)

| Path | Read | Create | Update | Delete |
|------|------|--------|--------|--------|
| `campaigns/{id}` | ✅ Auth | ✅ DM | ✅ DM | ✅ DM |
| `campaigns/{id}/characters/{charId}` | ✅ Auth | ✅ DM | ✅ DM or Player-own | ✅ DM |
| `campaigns/{id}/enemies/{id}` | ✅ Auth | ✅ DM | ✅ DM | ✅ DM |
| `campaigns/{id}/encounters/{id}` | ✅ Auth | ✅ DM | ✅ DM | ✅ DM |
| `campaigns/{id}/maps/{id}` | ✅ Auth | ✅ DM | ✅ DM | ✅ DM |
| `campaigns/{id}/maps/{id}/tokens/{*}` | ✅ Auth | ✅ DM | ✅ DM | ✅ DM |
| `campaigns/{id}/journal/{id}` | ✅ Auth | ✅ DM | ✅ DM | ✅ DM |
| `campaigns/{id}/sessions/{id}` | ✅ Auth | ✅ DM | ✅ DM | ✅ DM |
| `homebrew/{id}/**` | ✅ Auth | ✅ DM | ✅ DM | ✅ DM |
| `liveSessions/{id}/**` | ✅ Auth | ✅ DM | ✅ DM | ✅ DM |
| `/**` (fallthrough) | ❌ Deny | ❌ Deny | ❌ Deny | ❌ Deny |

### Player Write Restrictions (10 fields only)
Enforced by `isPlayerUpdatingOwnFields()` using Firestore `hasOnly()`:
`hitPoints`, `deathSaves`, `conditions`, `temporaryHitPoints`,
`experiencePoints`, `inspiration`, `currency`, `inventory`,
`equipment`, `characterNotes`

---

## Production Sign-Off

### Deployed at: https://arkla.vercel.app

| Metric | Cycle 8-9 Value |
|--------|-----------------|
| **TypeScript errors** | 0 (1933 modules) |
| **Build time** | 5.43s |
| **JS Bundle** | 595 KB (164 KB gzipped) |
| **CSS Bundle** | 87 KB (14 KB gzipped) |
| **Playwright tests** | 9/9 passing (11.4s) |
| **Component count** | 57 exported UI components |
| **Sub-components** | 21 created (monolith → module refactoring) |

### System Law Compliance

| Law | Status | Evidence |
|-----|--------|----------|
| 🎲 No dice rollers | ✅ | Physical dice — zero RNG in codebase |
| ⚔️ High fantasy purity | ✅ | No occult/undead; vibrant heroism |
| 🎨 Canvas mandate | ✅ | CanvasMapView, useTheatricCanvas |
| 📖 Living documentation | ✅ | Updated Cycle 9 |
