# Sprint 9, Cycle 3 — Feature Ideation & Improvement List
## Date: 2026-07-17
## Iteration: 3 of 10

### Purpose
Analyze the codebase and application for feature improvements. Compile a ranked list.

---

## Step 4: Feature Improvement Candidates

### Feature 1: ⭐ **Theatric View — DM Scene Notes Panel**
**Current State**: Theatric view shows battle map with tokens + weather. No way for DM to take notes or reference scene descriptions while the map is shown.

**Proposed**: A collapsible notes panel in the Theatric Sidebar where the DM can:
- Type scene-specific notes visible only to DM
- Reference pre-written encounter descriptions
- Quick-access to combat log and conditions

**Why**: DMs often use the Theatric view for climactic moments and need quick reference to their notes without switching tabs.

**Affected Files**: `TheatricSidebar.tsx`, `TheatricPage.tsx`

---

### Feature 2: ⭐ **Player Dashboard — Live Session View**
**Current State**: Player Dashboard shows character sheet with tabs. No real-time view of what the DM is doing — no way to see the session phase, current scene description, or DM announcements.

**Proposed**: Add a "Live Session" indicator bar at the top of the Player Dashboard showing:
- Session phase (color-coded: green for exploration, red for combat, blue for rest)
- Current scene description
- DM announcement (pop-up toast style)
- Weather/lighting/terrain conditions

**Why**: Players need context of what's happening in the session. Currently they just see their character sheet with no session awareness.

**Affected Files**: `PlayerDashboard.tsx`, `PlayerCharacterSheet.tsx`, `usePlayerFirebaseSync.ts`

---

### Feature 3: ⭐ **Dashboard — Recent Activity Feed Enhancements**
**Current State**: Dashboard has stat cards, session status, conditions widget, and quick actions. No timeline of recent activity.

**Proposed**: Add a "Recent Activity" timeline below the quick actions showing:
- Last combat encounter result
- Recent journal entries
- Session start/end times
- Level-ups or important character changes

**Why**: DMs return to the dashboard and need a quick summary of what happened in the last session without navigating to multiple tabs.

**Affected Files**: `DmDashboard.tsx`, potentially new `RecentActivityFeed.tsx` component

---

### Feature 4: ⭐ **Encounter Builder — Quick-Start Presets for Common Encounters**
**Current State**: Encounter Builder has Random Encounter Generator and Encounter Presets with save/load. No quick-start templates for common D&D scenarios.

**Proposed**: Add 6+ pre-built encounter templates:
- Ambush on the Road
- Goblin Camp Raid
- Boss Chamber (single powerful enemy + minions)
- Guard Patrol
- Wilderness Hunt
- Dragon Lair Ambush

Each template pre-fills: appropriate enemy groups, terrain type, difficulty rating, and XP budget.

**Why**: Reduces DM prep time significantly. A new DM can have a balanced encounter ready in 2 clicks.

**Affected Files**: `EncounterPresets.tsx`, `RandomEncounterGenerator.tsx`, new `EncounterTemplates.ts`

---

### Feature 5: ⭐ **Battle Maps — Ambient Sound Per Map**
**Current State**: Ambient sound player is in the Encounters tab (builder view). Not connected to individual battle maps.

**Proposed**: Store a `soundUrl` and `soundName` field on each `MapDoc`, so the DM can assign ambient sound to a specific map. When viewing the map in the Theatric view, the sound auto-plays.

**Why**: Immersive atmosphere — a cave map plays echoing drips, a forest map plays birdsong, etc.

**Affected Files**: `types/firestore.ts` (MapDoc), `MapForm.tsx`, `TheatricMap.tsx`, `TheatricSidebar.tsx`, `normalized-firebase-service.ts`

---

### Feature 6: ✅ **Journal — Rich Text Editor for Entries (Deferred)**
**Current State**: Journal entries use a plain `<textarea>`. No formatting support.

**Proposed**: Integrate a lightweight rich text editor (e.g., TipTap or Slate) for bold, italic, headers, lists, and inline images.

**Why**: DMs write session notes, lore, and quest descriptions that benefit from formatting.

**Deferred**: This would require adding a dependency and significantly reworking the journal form. Keep on the backlog.

---

### Feature 7: ⭐ **Combat Tracker — Import PC Stats for Enemy Groups**
**Current State**: Quick-Start encounter imports all 4 PCs. But when doing Quick-Start with enemy groups, the enemies have generic stats. No "Import from Enemy Database" flow on the Builder.

**Proposed**: Enhance the Encounter Builder's enemy picker to show:
- Enemy database with search/filter by CR, type, environment
- "Drag to encounter" to add as a group with configurable count
- Quick-edit HP/AC/name before adding

**Why**: Currently the enemy picker needs the DM to know the enemy IDs. A proper database search and filter makes encounter building much faster.

**Affected Files**: `EnemyPickerModal.tsx`, `EncounterBuilder.tsx`, `enemy-database.ts`

---

### Feature 8: ⭐ **Settings — Campaign Export/Import to JSON**
**Current State**: Settings page has "Export All" and "Import All" buttons but these are on the Dashboard, not here. No campaign-specific export format.

**Proposed**: Add campaign export/import in Settings that:
- Creates a single JSON file with all campaign data (meta, characters, enemies, encounters, maps, journal, homebrew)
- Includes a version number for future import compatibility
- One-click "Export Campaign" and "Import Campaign"

**Why**: DMs want to backup their entire campaign. Current export is per-entity type and scattered.

**Affected Files**: `CampaignSettings.tsx`, new `campaign-export.ts` lib module

---

## Feature Ranking (Priority for Implementation)

| Rank | Feature | Effort | Impact | Notes |
|------|---------|--------|--------|-------|
| 1 | 🎭 **Theatric Scene Notes** | Small | High | Already have TheatricSidebar, just add a notes textarea |
| 2 | 👤 **Player Live Session View** | Medium | High | Requires UI + Firebase sync changes |
| 3 | ⚔️ **Encounter Builder Presets** | Medium | High | Reduces DM prep time significantly |
| 4 | 📋 **Dashboard Activity Feed** | Small | Medium | Quick wins for DM awareness |
| 5 | 🗺️ **Map-Specific Ambient Sound** | Small | Medium | Already have SpotifyPlayer infrastructure |
| 6 | ⚡ **Enemy Database Search** | Medium | Medium | Enhances existing workflow |
| 7 | 💾 **Settings Campaign Export** | Small | Low-Medium | Nice to have, partial export exists |
| 8 | 📝 **Rich Text Journal** | Large | Medium | Deferred — significant dependency |

---

## Notes for Next Iteration
- Cycle 4 analysis complete — 8 feature candidates identified with rankings
- Top 3 features recommended for implementation:
  1. Theatric Scene Notes
  2. Player Live Session View  
  3. Encounter Builder Presets
- Build: Not modified this cycle (analysis only)
