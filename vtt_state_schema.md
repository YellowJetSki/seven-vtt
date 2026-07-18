# STᚱ VTT State & Schema Reference
**Version:** 1.0.0 — Cycle 1 Complete

## Firestore Schema

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
├── strength..charisma (6 abilities)
├── savingThrows: {ability: {proficient, bonus}}
├── skills: {skill: "none"|"proficient"|"expertise"}
├── hitPoints: {current, max, temporary}
├── armorClass, initiative
├── speed: {walk, fly?, swim?, climb?, burrow?, canHover?}
├── hitDice, proficiencyBonus
├── conditions: string[]
├── deathSaves: {successes, failures}
├── temporaryHitPoints
├── traits, proficiencies, languages, features: [...]
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

### BattleMap
```
maps/{mapId}
├── id, name, imageUrl?, imageFit?
├── gridWidth, gridHeight, gridSize
├── gridColor?, gridOpacity?, notes?
├── drawings?: [{id, points, color, width, tool}]
├── aoeTemplates?: AoETemplate[]
└── createdAt, updatedAt
```

### MapToken
```
maps/{mapId}/tokens/{tokenId}
├── id, type, label, x, y, color, size, visible
├── icon?, hp?: {current, max}, speed?, imageUrl?
├── initiative?, statusMarkers?: string[]
└── createdAt, updatedAt
```

### JournalEntry
```
journal/{entryId}
├── id, title, content, tags
├── type: "session" | "lore" | "quest" | "note" | "handout"
├── sessionNumber?, createdAt, updatedAt
```

### CombatEncounter (Zustand only)
```
activeEncounter: {
  id, name, combatants: Combatant[]
  round, currentCombatantIndex, turnStartedAt
  phase: "prep" | "active" | "completed"
  startedAt, completedAt, elapsedSeconds, isPaused
}
```

### Combatant
```
{ id, name, type, initiative, armorClass
  hitPoints: {current, max, temporary}
  statusEffects: [{id, effect}]
  isDead, isConcentrating, notes, imageUrl? }
```

### LiveSessionState
```
{ activeEncounterId, phase, currentScene?, currentMapUrl?
  dmAnnouncement?, sessionStartedAt?
  lastShortRestAt?, lastLongRestAt?
  conditions: {weather, lighting, terrain} }
```

## Firestore Security Rules

### Access Matrix

| Path | Read | Create | Update | Delete |
|------|------|--------|--------|--------|
| `campaigns/{id}` | Auth | DM | DM | DM |
| `campaigns/{id}/characters/{charId}` | Auth | DM | DM **or** Player-own | DM |
| `campaigns/{id}/enemies/{id}` | Auth | DM | DM | DM |
| `campaigns/{id}/encounters/{id}` | Auth | DM | DM | DM |
| `campaigns/{id}/maps/{id}` | Auth | DM | DM | DM |
| `campaigns/{id}/maps/{id}/tokens/{id}` | Auth | DM | DM | DM |
| `campaigns/{id}/maps/{id}/{doc=**}` | Auth | DM | DM | DM |
| `campaigns/{id}/journal/{id}` | Auth | DM | DM | DM |
| `campaigns/{id}/sessions/{id}` | Auth | DM | DM | DM |
| `campaigns/{id}/sessions/{id}/combatants/{id}` | Auth | DM | DM | DM |
| `campaigns/{id}/sessions/{id}/{doc=**}` | Auth | DM | DM | DM |
| `campaigns/{id}/combatLog/{id}` | Auth | DM (create) | DM | DM |
| `campaigns/{id}/{doc=**}` (catch-all) | Auth | DM | DM | DM |
| `homebrew/{id}/{doc=**}` | Auth | DM | DM | DM |
| `liveSessions/{id}/{doc=**}` | Auth | DM | DM | DM |
| `/**` (global catch-all) | Denied | Denied | Denied | Denied |

### Player Write Restrictions
Only 10 fields on own character document (`charId == auth.uid`):
`hitPoints`, `deathSaves`, `conditions`, `temporaryHitPoints`,
`experiencePoints`, `inspiration`, `currency`, `inventory`,
`equipment`, `characterNotes`

Enforced by `isPlayerUpdatingOwnFields()` using `hasOnly()` check.

### Auth Flow
```
DM Login (Zustand) ──► App-level access granted (always)
DM Login (Firebase) ──► signInWithEmailAndPassword() (non-blocking)
                      └── custom claim { role: "dm" }
                          └── Firestore rules allow writes
```

## Zustand Store Keys (localStorage)

| Key | Store | Content |
|-----|-------|---------|
| `str-vtt-auth` | authStore | Auth state, role, username |
| `str-vtt-campaign-normalized` | campaignStore | Full campaign state |
| `str-vtt-combat` | combatStore | Encounter, log, session |
