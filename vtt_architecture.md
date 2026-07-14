
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
