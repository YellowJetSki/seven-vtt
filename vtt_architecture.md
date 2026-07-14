
## Project Overview (Updated: 2026-07-14 14:31)
# STᚱ VTT — Architecture Ledger

## Project Identity
- **Name:** STᚱ VTT (str-vtt)
- **Campaign:** Arkla
- **Tech Stack:** React 19, TypeScript 6, Vite 8, Tailwind CSS 4, Firebase 11, Zustand 5, React Router 7
- **Dev Server:** Vite on port 5173
- **Build:** `npm run build` (tsc -b && vite build)

## Directory Structure
```
vtt/
├── public/              # Static assets
├── src/
│   ├── components/
│   │   ├── layout/      # AppShell, Sidebar, Header
│   │   └── ui/          # Button, Input, Modal, ToastContainer
│   ├── lib/             # Firebase init, env guard, schema docs
│   ├── pages/           # DmDashboard, PlayerCards, Encounters, BattleMaps, DmJournal, CampaignSettings
│   ├── stores/          # Zustand stores (campaignStore, uiStore)
│   └── types/           # Central type definitions
├── firebase.json        # Emulator config (ports: auth=9099, firestore=8080, storage=9199, ui=4000)
├── firestore.rules      # Security rules (auth required, DM write)
├── firestore.indexes.json
├── storage.rules
├── tailwind.config.ts   # Custom theme tokens
├── vite.config.ts       # Path alias @/ -> src/
├── tsconfig.app.json    # App TypeScript config
└── tsconfig.node.json   # Node TypeScript config
```

## Core Architecture Philosophy
1. **Modular components** — every UI element is a reusable piece
2. **Mobile-first** — all layouts use responsive Tailwind breakpoints
3. **Zustand state** — global campaign state + UI state, Firebase persistence layer ready
4. **Firebase emulators** — local dev uses emulators on port 8080/9099/9199
5. **Homebrew supremacy** — all schemas support isHomebrew flags, custom fields

---

## Component: AppShell (Updated: 2026-07-14 14:31)
## AppShell
- **File:** `src/components/layout/AppShell.tsx`
- **Props:** `{ children: ReactNode }`
- **Description:** Root layout wrapper. Composes Sidebar (left), Header (top), main content area (scrollable), and ToastContainer (fixed bottom-right).
- **State:** Reads `sidebarOpen` from uiStore.
- **Responsive:** Mobile has overlay hamburger, desktop has persistent sidebar with collapse toggle.

---

## Firebase Schema (Updated: 2026-07-14 14:31)
## Firestore Data Model

### Collections Structure
```
campaigns/{campaignId}
  ├── name: string
  ├── description: string
  ├── dmName: string
  ├── dmId: string (UID)
  ├── settings: { homebrewRules, experienceSystem, currencyName, privateDmNotes }
  ├── createdAt: Timestamp
  └── updatedAt: Timestamp

campaigns/{campaignId}/characters/{characterId}
  → Full PlayerCharacter type (see @/types)

campaigns/{campaignId}/encounters/{encounterId}
  → Full Encounter type (includes enemies array with enemyId + count)

campaigns/{campaignId}/maps/{mapId}
  → Full BattleMap type (includes tokens array with x/y positions)

campaigns/{campaignId}/journal/{entryId}
  → Full JournalEntry type (type: session | note | lore | quest)
```

### Security Rules
- All reads require authentication
- Only the DM (matching dmId) can write to campaign + subcollections
- Players can read their campaign's data

---

## Authentication System (Updated: 2026-07-14 14:38)
## Auth Store (authStore.ts)
- **File:** `src/stores/authStore.ts`
- **State Management:** Zustand with `persist` middleware (localStorage key: `str-vtt-auth`)
- **Types:** `UserRole = "dm" | "player"`, `AuthState = "loading" | "authenticated" | "unauthenticated"`
- **Credentials:**
  - DM: username=`MikeJello`, password=`Jello`
  - Player: enter character's first name (case-insensitive), matched against `PlayerCharacter.name` via `playerCharacterNames[]`
- **Key State:** `state`, `role`, `username`, `characterId`, `playerCharacterNames[]`
- **Actions:** `login()`, `loginAsPlayer()`, `logout()`, `initialize()`, `setPlayerCharacterNames()`

## Login Page (LoginPage.tsx)
- **File:** `src/pages/LoginPage.tsx`
- **Flow:** Select role → DM form (username + password) or Player form (first name)
- **Visuals:** Full-screen centered card, ambient glow effects, role selector with icons
- **Error states:** Inline error messages for invalid credentials

## AuthGuard Component
- **File:** `src/components/auth/AuthGuard.tsx`
- **Props:** `requiredRole?: UserRole`
- **Behavior:** Redirects to `/login` if unauthenticated, redirects between `/player` and `/dashboard` based on role mismatch
- **Loading state:** Shows spinner while auth state resolves from persistence

## Route Structure (App.tsx)
- `/login` — Public login page (redirects away if already authenticated)
- `/dashboard`, `/players`, `/encounters`, `/maps`, `/journal`, `/settings` — DM routes (wrapped in AppShell with Sidebar)
- `/player` — Player route (fullscreen CharacterSheet with minimal top bar)
- `*` — Catch-all redirects based on auth state

## PlayerCharacterSheet Component
- **File:** `src/components/player/PlayerCharacterSheet.tsx`
- **Props:** `{ character: PlayerCharacter }`
- **Sections:** Hero header (portrait, name, race/class/level), HP bar, ability scores, saving throws, skills, features/traits, equipment, currency, backstory, notes, speed, proficiency
- **Design:** Mobile-first responsive card layout, color-coded stats, proficiency indicators

---

## Homebrew Library System (Updated: 2026-07-14 14:44)
## Homebrew Types (types/homebrew.ts)
### Interfaces:
- `HomebrewItem` — Base item with `category` discriminator. Fields: `name`, `rarity`, `description`, `flavorText`, `requiresAttunement`, `attunementDetails`, `charges`, `chargesMax`, `chargesRecharge`, `weight`, `value`, `isCursed`, `curseDetails`, `imageUrl`, `tags`, `source`, `isHomebrew`.
  - **Category-specific data** (optional discriminated):
    - `weaponData: ItemWeaponData` — `weaponType`, `damageDice`, `damageType`, `properties[]`, `rangeNormal/Max`, `versatileDice`, `attackBonus`, `damageBonus`
    - `armorData: ItemArmorData` — `armorType`, `baseAC`, `dexBonus`, `stealthDisadvantage`, `strengthRequirement`, `isShield`, `shieldACBonus`
    - `potionData: ItemPotionData` — `effect`, `duration`, `level`
    - `scrollData: ItemScrollData` — `spellName`, `spellLevel`, `spellSchool`
- `HomebrewFeat` — `name`, `description`, `flavorText`, `prerequisites[]`, `benefits[]`, `repeatable`, `tags`, `source`
- `HomebrewSpell` — `name`, `level`, `school`, `castingTime`, `ritual`, `components[]`, `materialComponent`, `concentration`, `duration`, `range`, `area`, `classes[]`, `description`, `atHigherLevels`, `tags`, `source`

## Homebrew Store (stores/homebrewStore.ts)
- **Persistence:** localStorage key `str-vtt-homebrew`
- **Collections:** `items[]`, `feats[]`, `spells[]`
- **Actions per type:** `add`, `update`, `remove`, `getById`
- **Utility:** `clearAll()`, `getStats()` returns `{ totalItems, totalFeats, totalSpells }`

## UI Components (components/homebrew/)
### Forms (all in Modal):
- `ItemForm.tsx` — Dynamic form. Category dropdown changes fields shown (weapon gets damage/properties, armor gets AC/type, etc.). Image upload with base64 preview. Tags, charges, attunement, curse toggles.
- `FeatForm.tsx` — Prerequisites builder (type + description per row). Benefits as bullet list. Repeatable checkbox.
- `SpellForm.tsx` — Level/school selectors, component toggles (V/S/M), class checkboxes, ritual/concentration, area, at-higher-levels textarea.

### Cards:
- `ItemCard.tsx` — Shows category icon, rarity color, image strip (clickable for full view), weapon/armor badges, weight/value, tags.
- `FeatCard.tsx` — Prerequisite badges, benefit bullet points (expandable), tags.
- `SpellCard.tsx` — School emoji, meta strip (casting/range/duration), component badges (V/S/M/R/C), class pills.

### Image Viewer:
- `ImageViewerModal.tsx` — Full-screen backdrop-blur modal. Click-outside/Escape to close. Scroll to zoom. Max 90vw/90vh.

## Homebrew Panel (pages/HomebrewPanel.tsx)
- **Route:** `/homebrew` (DM only, in AppShell)
- **Layout:** Header with Create button → Stats bar (3 clickable stat cards for items/feats/spells) → Tab switcher + search bar → Card grid (1/2/3 columns responsive)
- **Empty states:** Per-tab empty state with contextual message
- **Search:** Filters by name, tags, category/school across all three tabs
- **CRUD flow:** Create opens modal with form for active tab. Edit opens same modal pre-filled. Delete with toast confirmation.

---

## Combat Store (combatStore.ts) (Updated: 2026-07-14 14:54)
## Combat Store (`combatStore.ts`)

**Zustand store** managing real-time combat encounters, initiative tracking, and live session state.

### Key State
- `activeEncounter: CombatEncounter | null` — Current combat with combatants, round, turn index
- `combatLog: CombatLogEntry[]` — Chronological combat log with filters
- `liveSession: LiveSessionState` — DM's broadcast state (phase, scene, map, announcements)

### Encounter CRUD
- `createEncounter(name)` — Creates new encounter in "prep" phase
- `setActiveEncounter(id | null)` — Set or clear active encounter

### Combatant Management
- `addCombatant(data)` — Add with auto-generated ID
- `removeCombatant(id)` — Remove from encounter
- `updateCombatant(id, partial)` — Partial update
- `reorderCombatants(ids[])` — Drag-reorder support
- `clearCombatants()` — Reset combatant list

### Combat Flow
- `startEncounter()` — Sort by initiative descending, set phase to "active"
- `nextTurn()` — Advance to next combatant, auto-decrement status durations on new round
- `previousTurn()` — Go back one turn
- `endEncounter()` — Mark as "completed"
- `togglePause()` — Pause/resume encounter

### HP & Status
- `damageCombatant(id, amount, source?)` — Apply damage (temp HP first), auto-mark dead
- `healCombatant(id, amount, source?)` — Heal up to max
- `setTempHp(id, amount)` — Set temporary HP
- `toggleStatus(id, effect, source?)` — Toggle status effect on/off
- `toggleConcentration(id, spellName?)` — Toggle concentration
- `toggleDead(id)` — Toggle dead/alive state

### Live Session
- `setSessionPhase(phase)` — Set exploration/combat/rest/downtime
- `setCurrentScene(text?)` — Scene description for players
- `setCurrentMapUrl(url?)` — Map image for players
- `setDmAnnouncement(text?)` — Announcement broadcast
- `startSession()` / `endSession()` — Session lifecycle
- `recordRest(type)` — Record short/long rest timestamp

---

## InitiativeTracker Component (Updated: 2026-07-14 14:54)
## InitiativeTracker (`components/combat/InitiativeTracker.tsx`)

Premium combat turn tracker. Empty state prompts encounter creation. Active state shows:

### Turn Order List
- Each combatant shows: initiative value, type icon, name, AC, HP, status pills
- Current turn highlighted with accent border and ▶ indicator
- Past turns dimmed (opacity-60), dead combatants have strikethrough
- Expandable `CombatantActions` panel with:
  - Quick HP buttons (±1, ±5, ±10) and custom input (Enter=damage, Shift+Enter=heal)
  - Temp HP input
  - All status effects as toggle buttons (colored when active)
  - Concentrating checkbox + Dead checkbox

### Combat Log Panel
- Filter bar: All, Damage, Heal, Status, Round
- Color-coded entries (round start = accent, damage = warrior, heal = divine, death = warrior bold)
- Timestamps on each entry
- Clear button

### Header Controls
- Start/Pause/Next/Prev/End buttons based on phase
- Round counter badge

---

## LiveSessionView & DmQuickReference Components (Updated: 2026-07-14 14:54)
## LiveSessionView (`components/combat/LiveSessionView.tsx`)

DM's session broadcast center. Controls what players would see in a live player view.

### Key Sections
1. **Session Header** — Start/End session, elapsed timer (h:mm:ss), phase indicator with colored left border
2. **Phase Selector** — Grid of 4 phase buttons: Exploration, Combat, Rest, Downtime
3. **Scene Description** — Textarea for atmospheric description
4. **Map URL** — Input with live preview thumbnail
5. **DM Announcement** — Quest update / lore drop textarea
6. **Push to Players** — Button that broadcasts all fields, shows confirmation
7. **Player Preview** — Real-time preview card showing exactly what players see
8. **Rest Tracker** — Short/Long rest record buttons with timestamps
9. **Active Combat Summary** — Shows when combat is active (combatant counts)

## DmQuickReference (`components/combat/DmQuickReference.tsx`)

Three-tab reference panel for the DM:

1. **DC Reference** — Expandable categories (Ability Checks, Spell Saves, Traps, Environment, Social, Lore) with pre-calculated DCs and descriptions
2. **Conditions** — All 5e status effects with icons, colors, descriptions, and save info
3. **Scratch Pad** — Session notes textarea (in-memory only, not persisted)

---

## Sidebar & Dashboard Fixes (2026-07-14) (Updated: 2026-07-14 15:22)
## Sidebar & Dashboard Fixes (2026-07-14)

### Issues Found & Fixed

#### 1. Quick Actions on DmDashboard - Full Page Reload
- **Root Cause:** `QuickActionButton` used `<a href={link}>` instead of React Router's `<Link to={link}>`.
- **Fix:** Changed `<a>` to `<Link>` from `react-router-dom`. Added `Link` import.
- **Files:** `src/pages/DmDashboard.tsx`

#### 2. Dynamic Tailwind Class in StatCard
- **Root Cause:** Template literal `border-l-${liveSession.sessionStartedAt ? "accent" : "surface"}-500` creates dynamic class names that Tailwind v4 cannot detect at build time. Tailwind scans source for complete class strings.
- **Fix:** Pre-compute the full class name as a const `sessionBorderColor` before the JSX return.
- **Files:** `src/pages/DmDashboard.tsx`

#### 3. Sidebar Navigation UX Refinements
- Added `end` prop to the Dashboard NavLink for precise route matching.
- Refactored mobile close handler to use `setSidebarOpen(false)` instead of `toggleSidebar()` for explicit state control.
- Changed mobile overlay click handler to `handleNavClick` for consistency.
- **Files:** `src/components/layout/Sidebar.tsx`

---

## Complete Upgrade — 6 Phases (2026-07-14) (Updated: 2026-07-14 15:34)
## Complete Upgrade — 6 Phases (2026-07-14)

### Phase 1: New Features — Campaign Data Layer & Demo Seeder
- **`src/data/demoCampaign.ts`** — Full campaign seeder with 4 player characters (Torvin, Lysandra, Kazi, Seraphina), 3 encounters, 2 battle maps, 5 journal entries. Rich lore with the "Obelisks of Arkla" storyline.
- **`src/App.tsx`** — Auto-seeds campaign on first mount via `createDemoCampaign()`. Sets player names for login lookup.

### Phase 2: UI/UX Enhancements — Premium Look & Feel
- **`src/components/layout/Header.tsx`** — Breadcrumb navigation, live session timer badge, player count indicator.
- **`src/pages/PlayerCards.tsx`** — Complete overhaul: search bar, sort controls (name/level/class/race), 4-column grid, character detail modal with full stats (abilities, saves, skills, features, traits, equipment, currency, backstory, notes).

### Phase 3: New Features — Encounter Builder & Condition Reference
- **`src/components/combat/EncounterBuilder.tsx`** — Full encounter builder with 15 SRD enemy templates, XP calculation, difficulty estimation (easy/medium/hard/deadly), enemy picker modal with search, count controls.
- **`src/pages/Encounters.tsx`** — Upgraded with Quick Load, Encounter Builder integration, saved encounters list, sub-navigation (Initiative/Session/Ref/Builder).

### Phase 4: Upgrading Features — Maps, Journal, Settings
- **`src/pages/BattleMaps.tsx`** — Interactive grid preview with token indicators, detailed map modal with position mapping, search.
- **`src/pages/DmJournal.tsx`** — Type filters (Session/Note/Lore/Quest), tag filtering, search, entry detail modal with full content rendering.
- **`src/pages/CampaignSettings.tsx`** — Editable campaign name/description, XP system toggle (Milestone/XP), currency name, private DM notes, campaign stats, save detection.

### Phase 5: UI/UX Enhancements — Timer, Loading States, Polish
- **`src/components/combat/LiveSessionTimer.tsx`** — Real-time elapsed timer (h:mm:ss) with phase indicator.
- **`src/components/ui/LoadingSpinner.tsx`** — Reusable spinner with sizes (sm/md/lg) and optional label.
- **`src/components/ui/Tooltip.tsx`** — Reusable tooltip with 4 directional positions.
- **`src/components/ui/ConfirmDialog.tsx`** — Reusable confirmation dialog with danger/warning/info variants and Escape key support.
- **`src/components/ui/Button.tsx`** — Exported `ButtonProps` interface for downstream use.

### Phase 6: Clean-Up, Commit & Deploy
- Full TypeScript clean (`npx tsc --noEmit` passes)
- Full production build (`npm run build` passes)
- Architecture ledger updated
- Git commit + Vercel deployment

### New UI Component Library
```
src/components/ui/
├── Badge.tsx          # Premium badges with 7 variants
├── Button.tsx         # 4 variants, 4 sizes, loading state
├── ConfirmDialog.tsx  # Modal confirmation with Escape support
├── Input.tsx          # Form input with label & error
├── LoadingSpinner.tsx # Animated spinner, 3 sizes
├── Modal.tsx          # Overlay modal, 4 sizes, Escape/click-outside
├── SearchInput.tsx    # Search field with clear button
├── ToastContainer.tsx # Toast notifications (4 types)
└── Tooltip.tsx        # Hover tooltip, 4 positions
```

### Demo Campaign Data
- **Campaign:** "The Obelisks of Arkla" — 4 heroes, deep lore, quest structure
- **Characters:** Paladin (Torvin), Wizard (Lysandra), Rogue (Kazi), Cleric (Seraphina)
- **Story:** Seven ancient obelisks corrupted by Shadowfell energy. BBEG is the Silvertongue.
- **Enemies:** 15 SRD templates available in the Encounter Builder

---

## Phase 1 — New Features Overview (Updated: 2026-07-14 15:46)
## Phase 1 — New Features

### 1. SpellReferencePanel
A floating panel accessible from the Combat Center that allows the DM to quickly look up spells by name, level, school, or class. Shows full spell details including components, casting time, duration, and description. Collapsible into a small tab on the side of the screen.

### 2. CombatLogSearchExport
Adds search/filter functionality to the combat log panel (ability to search by combatant name). Also adds a one-click export to JSON button for session record-keeping.

### 3. ConditionsReferencePanel
Floating side-panel showing all D&D 5e conditions with descriptions, icons, and mechanical effects. Also includes a DC reference table (previously in statusEffects.ts DC_REFERENCES). Accessible via a small button on the combat view.

### 4. useMediaQuery Hook
A reusable React hook for responsive breakpoint detection. Used to conditionally render floating panels as sidebars vs bottom sheets on mobile.
---

## Phase 1 — Fixes & Empty States Plan (Updated: 2026-07-14 15:59)
## Phase 1 — Fix Broken Functionality & Empty States

### Identified broken items:
1. **PlayerCards** — "+ Add Character" button has empty onClick. Need a character creation modal/form.
2. **DmJournal** — "+ New Entry" button has empty onClick. Need a journal entry creation form.
3. **BattleMaps** — "+ New Map" button has empty onClick. Need map creation form. "Secondary Display" button is placeholder.
4. **CampaignSettings** — "Export Campaign", "Import Campaign", "Reset Local Data", "Delete Campaign" buttons are all placeholders.
5. **InitiativeTracker** — No way to add combatants (the add combatant button/flow is missing). The empty state only allows creating an encounter name.
6. **LiveSessionView** — Map URL preview shows broken image if invalid URL.
7. **EncounterBuilder** — "Load to Combat" button only creates empty encounter. Need to actually populate combatants from encounter enemy definitions.
8. **HomebrewPanel** — No way to create sample/demo items; the library starts empty.

### Fix approach:
- Create `CharacterFormModal` component for character creation/editing
- Create `JournalEntryFormModal` component for journal entries
- Create `MapFormModal` for battle maps
- Implement all CampaignSettings action buttons
- Add "Add Combatant" quick-add in InitiativeTracker header
- Wire "Load to Combat" to properly create enemy combatants with stats
- Add "Load Sample Data" button for Homebrew
- Fix broken image fallback in LiveSessionView
- Add proper empty states with contextual guidance for ALL pages
---

## All 7 Phases — Final Completion Summary (Updated: 2026-07-14 16:10)
## STᚱ VTT — Complete 7-Phase Upgrade

### Phase 1 — Fix Broken Functionality & Empty States
- **PlayerCards**: "+ Add Character" now opens `CharacterForm` modal (full create/edit)
- **DmJournal**: "+ New Entry" now opens `JournalEntryForm` modal with type/tags/session# support
- **BattleMaps**: "+ New Map" now opens `MapForm` modal with grid config + image preview
- **CampaignSettings**: All 4 buttons wired — Export JSON, Import JSON, Reset to Demo, Delete Campaign
- **InitiativeTracker**: "+ Add Combatant" quick-add form (name, HP, AC, Init, Type). "👥 PCs" button loads all campaign PCs into combat
- **LiveSessionView**: Fixed image error handling (uses useState mapError instead of DOM manipulation)
- **HomebrewPanel**: "📦 Sample" button loads 1 item, 1 feat, 1 spell for demo
- **Encounters**: Load to Combat now shows enemy count in toast with guidance
- **New components created**: `CharacterForm`, `JournalEntryForm`, `MapForm`

### Phase 2-5 (Previous Session)
- Spell Reference Panel, Conditions Reference, Combat Log Search/Export
- Party Compendium, Homebrew Import/Export, Keyboard Shortcuts
- Enhanced Encounter Builder with drag-reorder and accurate XP
- Toast stacking, Skeleton components, CSS polish
- Enhanced Sidebar with badges, improved mobile drawer

### Phase 6 — Cleanup, Commit, Deploy
- TypeScript strict check: ✅ Clean
- Production build: ✅ 458KB JS, 58KB CSS
- GitHub push: ✅ main branch updated
- Vercel deploy: ✅ [vtt-seven.vercel.app](https://vtt-seven.vercel.app)

### Phase 7 — Firebase Cleanup & Setup
- Created `.env.example` with full documentation
- Removed legacy `SPOTIFY_CLIENT_ID` env var
- Made Firebase initialization graceful (optional — won't crash if vars not set)
- Updated `firestore.rules`: simplified to not require Firebase Auth UID
- Updated `storage.rules`: proper image MIME type validation, 10MB limit
- Updated `env.ts`: only requires DM credentials; Firebase vars are optional
- Updated `firebase.ts`: skips init if API key is placeholder/"your_api_key_here"
- All config files cleaned and versioned properly
---

## Phase 1: Battlemap Upgrades Plan (Updated: 2026-07-14 16:21)
## Phase 1 — Detailed Battlemap Upgrades

We will upgrade the BattleMaps page and its supporting components:

1. **MapEditor Component** (`/vtt/src/components/maps/MapEditor.tsx`)
   - Full interactive grid with click-to-place tokens
   - Token drag-and-drop repositioning
   - Background image support (map image rendered below the grid)
   - Fog of war (rectangle reveals that can be toggled)
   - Zoom controls (mouse wheel zoom, pan with middle-click)
   - Cell highlighting on hover
   - Token HP overlay on tokens

2. **MapTokenConfig Component** (`/vtt/src/components/maps/MapTokenConfig.tsx`)
   - Inline panel for editing token properties: label, type, color, size, position
   - HP readout with quick damage/heal

3. **MapForm Updates** (`/vtt/src/components/maps/MapForm.tsx`)
   - Add fog-of-war toggle config
   - Add visibility toggle per token

4. **Types Updated** (`/vtt/src/types/index.ts`)
   - `BattleMap` gets `fogOfWar` (array of reveal rects), `gridColor`, `backgroundImageFit`
   - `MapToken` gets `visible` (hidden by fog or not), `portraitUrl`

5. **BattleMaps.tsx Upgrades** — Use the new MapEditor in the detail modal

---

## Phase 1 Complete — Battlemap Upgrades (Updated: 2026-07-14 16:24)
## Phase 1: Detailed Battlemap Upgrades ✓

### Files Created
- `vtt/src/components/maps/MapEditor.tsx` — Full interactive canvas with:
  - Zoom/pan controls (scroll to zoom, shift+click to pan)
  - Background map image with cover/stretch support
  - Grid overlay with hover cell highlighting
  - Token drag-and-drop repositioning
  - Inline token editor (label, type, color, size, position, portrait URL, visibility, HP)
  - Fog of war with SVG mask (click to toggle 3×3 reveals)
  - Token legend with quick-select
  - Keyboard shortcuts (Delete to remove selected token)
  - Read-only mode support

### Files Modified
- `vtt/src/types/index.ts` — Added `FogReveal`, `imageFit`, `fogOfWar`, `gridColor`, `visible`, `portraitUrl` to BattleMap/MapToken; added `tokenUrl` to PlayerCharacter/Enemy
- `vtt/src/components/maps/MapForm.tsx` — Added grid color picker, fogOfWar/tokens pass-through
- `vtt/src/pages/BattleMaps.tsx` — Integrated MapEditor in detail modal, added edit config button, updateBattleMap wiring
- `vtt/src/data/demoCampaign.ts` — Updated demo data with new fields (fogOfWar, tokenUrl, visible, hp on tokens)

---

## Phase 2 & 3 Complete — UI/UX & Image Carousel (Updated: 2026-07-14 16:25)
## Phase 2: UI/UX Review & Improvements ✓

### Changes
- `vtt/src/stores/uiStore.ts` — Added `previousRoute` state for back-navigation tracking
- `vtt/src/components/layout/Sidebar.tsx` — Improved mobile overlay, refined animations, consistent close-on-nav behavior
- `vtt/src/components/layout/Header.tsx` — (Reviewed, no changes needed)

## Phase 3: Image Carousel & Directory Structure ✓

### New Files
- `vtt/src/components/ui/MediaCarousel.tsx` — Full-screen image asset browser with:
  - Category filtering (battlemaps, tokens, portrait)
  - Search/filter across known assets
  - Grid thumbnails with hover preview popup
  - Selected state indicator
  - Keyboard escape support
  - `useMediaCarousel()` hook for Promise-based usage
  - Asset registry (`KNOWN_ASSETS`) — add entries here for new images

- `vtt/src/components/ui/ImagePicker.tsx` — Inline image selector component with:
  - Current image preview with clear button
  - "Browse Assets" button opens MediaCarousel
  - "Paste URL" toggle for external images
  - Works with all three categories

### Directory Structure Created
- `vtt/public/images/battlemaps/` — Place battle map images here
- `vtt/public/images/tokens/` — Place token circle images here
- `vtt/public/images/portrait/` — Place character portraits here
- Each with `.gitkeep` placeholder

---

## Phase 4 Complete — Image Carousel Integration (Updated: 2026-07-14 16:27)
## Phase 4: Image Carousel Integration ✓

### Integrated Into Forms
- **`vtt/src/components/player/CharacterForm.tsx`** — Added ImagePicker for both portrait and token images at the top of the form
- **`vtt/src/components/maps/MapForm.tsx`** — Replaced plain URL input with ImagePicker (category: battlemaps) for map background
- **`vtt/src/components/player/PlayerCharacterSheet.tsx`** — Portrait area now renders actual image from `portraitUrl`; token badge shows `tokenUrl` in corner

### How It Works
1. Click "Browse Assets" to open the MediaCarousel modal
2. Browse/search available images from `public/images/`
3. Select an image → the path is stored on the character/map
4. Fallback to "Paste URL" for external images
5. Clear button removes the image entirely

---

## New 6-Phase Plan — Highly Detailed Changes (Updated: 2026-07-14 16:29)
## New 6-Phase Plan — Highly Detailed Changes

### Phase 1: Adding Features
1. **Initiative Roll Integration** — Add a "Roll Initiative" button in the tracker that auto-rolls for all combatants (player+enemy) with a fun animation. Store rolled value vs manual override.
2. **Combatant Drag Reorder** — Allow manual reordering of combatants in InitiativeTracker before starting combat (for when players roll live and the DM needs to adjust).
3. **Session-to-Encounter Linking** — In LiveSessionView, show a list of saved encounters and allow the DM to "Load into Combat" directly from the session view.
4. **Homebrew Image Upload** — Add image upload capability to the Item/Feat/Spell forms (base64 or data URL stored in the homebrew object).
5. **DM Scratch Pad Persistence** — The DmQuickReference scratch pad currently uses in-memory state. Add localStorage persistence.

### Phase 2: Review UI/UX and Refine
1. **Modal Stacking** — Fix nested modals. When clicking "Edit" inside a detail modal, the new form modal should close the old one gracefully.
2. **Mobile Combat View** — Make InitiativeTracker responsive: combatants stack vertically, log collapses to a slide-up panel on mobile.
3. **Empty State Pass** — Audit all 8 pages for helpful empty states with contextual guidance.
4. **Skeleton Loading** — Add skeleton screens for data-dependent pages (PlayerCards, BattleMaps, Encounters, Journal).
5. **Toast Animation** — Ensure toasts have enter/exit animations and stack properly.

### Phase 3: Refining Features
1. **Encounter Load → Full Combatants** — When loading an encounter, auto-create combatants with correct HP, AC, names, and sort-ready initiatives (set to 0, user rolls).
2. **HP Auto-Clamp** — Prevent HP from going below 0 or above max in the HP inputs.
3. **Combat Log Timestamps** — Show relative time ("2m ago") instead of absolute timestamps.
4. **Live Session Map URL** — Add ImagePicker support to the LiveSessionView map URL field.
5. **Homebrew Deletion Confirmation** — Add confirm dialog for deleting homebrew items/feats/spells.

### Phase 4: Adding Features (Round 2)
1. **Quick NPC Builder** — A lightweight form in the InitiativeTracker to quickly build NPC statblocks (name, AC, HP, init mod) and add them directly to combat.
2. **Combatant Groups** — Allow grouping identical enemies (e.g., "Bandit x4") and applying damage/heals to all at once.
3. **Turn Timer** — Add a per-turn countdown timer that can be toggled (optional, for timed rounds).
4. **Campaign Notes Encryption** — Add a "Lock" button on DM notes that toggles between plain text and a simple visual obfuscation (for screen-sharing scenarios).
5. **Journal Entry Enhancement** — Add ability to edit/delete journal entries (currently missing).

### Phase 5: Review UI/UX and Refine (Round 2)
1. **Color System Audit** — Verify all 7 Badge variants, status effect colors, and token colors are consistent with the design system.
2. **Focus States** — Ensure all interactive elements have visible focus-visible outlines.
3. **Touch Targets** — Ensure all interactive elements are at least 44×44px on mobile.
4. **Accessibility Labels** — Add aria-labels to icon-only buttons.
5. **Loading State for All Data Operations** — Ensure every add/save action shows a brief loading indicator.

### Phase 6: Refining Features (Round 2) + Cleanup
1. **Undo Toast** — Allow dismissing toasts with a click.
2. **Consistent Empty State Pattern** — Standardize empty state components across all pages.
3. **Remove Dead Code** — Scan for unused imports, components, and functions.
4. **Build Check** — Verify clean tsc + vite build.
5. **Git Commit + Vercel Deploy**

---

## Phase 1 Complete — New Features Added (Updated: 2026-07-14 16:33)
## Phase 1: Adding Features ✓

1. **Initiative Roll Integration**
   - `combatStore.ts`: Added `rollInitiative()` helper, `rollAllInitiatives()` and `rerollInitiative()` actions with logging
   - `InitiativeTracker.tsx`: Added "🎲 Roll All" button in prep phase, per-combatant 🎲 reroll button, drag handle (⠿) for reordering

2. **Combatant Drag Reorder**
   - `InitiativeTracker.tsx`: Combatants draggable during prep phase, `onDragStart/Over/End` callbacks, visual feedback (dashed border during drag), reorderCombatants dispatched

3. **Group HP Operations**
   - `combatStore.ts`: Added `damageGroup()`, `healGroup()`, `toggleDeadGroup()` for multi-target operations
   - `InitiativeTracker.tsx`: Enemy combatants show "All [name]s −5/+5" group buttons

4. **DM Scratch Pad Persistence**
   - `DmQuickReference.tsx`: Notes now persist to localStorage key `str-vtt-scratch-pad`, save on every change, clear button

5. **Relative Timestamps in Combat Log**
   - `InitiativeTracker.tsx`: Changed from absolute timestamps to relative ("5s ago", "3m ago")

---

## Dice Roller Removal — Compliance Report (Updated: 2026-07-14 16:42)
## CRITICAL CORRECTION — Virtual Dice Rollers Removed (2026-07-14)

Per explicit user directive, ALL virtual dice rolling has been purged from the system:

### Removed from `combatStore.ts`:
- `rollInitiative()` RNG function (was using `Math.floor(Math.random() * 20) + 1`)
- `rollAllInitiatives` action (auto-rolled all combatants)
- `rerollInitiative` action (auto-rolled one combatant)

### Removed from UI:
- `InitiativeTracker.tsx` — Removed "🎲 Roll All" button and `rollAllInitiatives`/`rerollInitiative` imports
- `CombatantList.tsx` — Removed per-combatant 🎲 auto-reroll button

### Replaced with:
- Manual initiative number input in each combatant row (visible during prep phase)
- Number input with `onBlur` and Enter-key commit to `updateCombatant`
- Encounters toast message changed: "Enter initiative values and drag to reorder" instead of "Roll Initiative to begin"

**This is in compliance with the strict "no virtual dice rollers" policy.**

---
