# STᚱ VTT Architecture
**Version:** 2.0.0 — Cycle 2 Complete
**Date:** 2026-07-18

## Overview
STᚱ VTT is a premium, enterprise-grade virtual tabletop for the Arkla campaign. Built with React 19, TypeScript, Vite, Tailwind CSS 4, Firebase 11, and Zustand 5.

## Modular Directory Structure
```
vtt/
├── src/
│   ├── main.tsx                     ← Entry point (BrowserRouter)
│   ├── App.tsx                      ← Route tree
│   ├── index.css                    ← Tailwind + custom theme + animations
│   ├── vite-env.d.ts                ← ImportMeta type declarations
│   ├── components/
│   │   ├── auth/                    ← AuthGuard, DmLoginForm, PlayerPlaceholder, RoleSelection
│   │   ├── dashboard/               ← StatCard, QuickActions, RecentActivity, StatusBar
│   │   ├── layout/                  ← AppShell, Sidebar, Header
│   │   └── ui/                      ← Button, Modal, LoadingSpinner, ToastContainer, EmptyState
│   ├── pages/                       ← LoginPage, DmDashboard, TheatricPage
│   ├── stores/
│   │   ├── authStore.ts
│   │   ├── campaignStore.ts         ← Composed from 3 slices (meta, character, entity)
│   │   ├── combatStore.ts           ← Composed from 4 slices (combat, flow, hp, session)
│   │   ├── uiStore.ts
│   │   ├── campaign/
│   │   │   ├── metaSlice.ts         ← CampaignMeta state + actions
│   │   │   ├── characterSlice.ts    ← PlayerCharacter CRUD
│   │   │   ├── entitySlice.ts       ← Enemies, Encounters, Maps, Tokens, Journal
│   │   │   └── campaignHelpers.ts   ← buildCampaign(), types
│   │   └── combat/
│   │       ├── combatSlice.ts       ← Encounter + combatant management
│   │       ├── combatFlowSlice.ts   ← Combat lifecycle (start/next/prev/end/pause)
│   │       ├── combatHpSlice.ts     ← Damage/heal/status/effects
│   │       ├── combatSessionSlice.ts← Live session management
│   │       └── combat-helpers.ts    ← clampHP, generateId, createLogEntry
│   ├── types/
│   │   ├── index.ts                 ← Barrel re-exports
│   │   ├── campaign.ts              ← CampaignMeta, CampaignSettings, CampaignStats
│   │   ├── character.ts             ← PlayerCharacter, abilities, inventory, spells, buffs
│   │   ├── enemy.ts                 ← EnemyDoc, CreatureType, CreatureSize, AbilityScores
│   │   ├── encounter.ts             ← Encounter, EnemyGroup
│   │   ├── map.ts                   ← BattleMap, MapToken, AoETemplate, MapDrawing
│   │   ├── combat.ts                ← CombatEncounter, Combatant, CombatLog, LiveSession
│   │   ├── homebrew.ts              ← HomebrewItem, HomebrewSpell, HomebrewFeat
│   │   ├── journal.ts               ← JournalEntry, JournalEntryType
│   │   └── ui.ts                    ← Toast, AuthState, UserRole
│   ├── lib/
│   │   ├── firebase.ts              ← Firebase init, auth, persistence
│   │   ├── firestore-service.ts     ← Barrel re-exports
│   │   └── firestore/
│   │       ├── helpers.ts           ← toFirestore, fromFirestore, CAMPAIGN_COLLECTION
│   │       ├── campaign-service.ts  ← CampaignMeta CRUD
│   │       ├── character-service.ts ← PlayerCharacter CRUD + batch
│   │       └── entity-service.ts    ← Enemies, Encounters, Maps, Tokens, Journal
├── tests/
│   └── smoke.spec.ts                ← 7 Playwright smoke tests
├── firestore.rules                  ← Enterprise security rules
├── .env.example
└── playwright.config.ts
```

## Modularity Rules
- **No file exceeds 150 lines** — All source files are under this limit
- **Monolith risk**: 0 files flagged — clean across entire `vtt/src/`
- **Domain-driven splitting**: Types split into 9 domain files, stores into slices, lib into service modules

## Build Metrics
- **Modules:** 37+ source files
- **TypeScript:** 0 errors
- **Build:** ~800ms
- **JS Bundle:** ~440KB (121KB gzipped)

## Cycle 2 — Codebase Audit & Modularity Refactoring (Updated: 2026-07-18 15:24)
## Cycle 2 (2026-07-18): Complete

### What was Accomplished
All 6 monoliths exceeding 150 lines refactored into smaller modules:

1. **`types/index.ts` (515→9 lines)** — Split into 9 domain type files: campaign, character, enemy, encounter, map, combat, homebrew, journal, ui. Each under 150 lines.
2. **`combatStore.ts` (544→composed)** — Split into 4 slice files (combatSlice, combatFlowSlice, combatHpSlice, combatSessionSlice) + combat-helpers.ts utility.
3. **`campaignStore.ts` (272→composed)** — Split into 3 slice files (metaSlice, characterSlice, entitySlice) + campaignHelpers.ts.
4. **`firestore-service.ts` (311→barrel)** — Split into 4 domain files under lib/firestore/: helpers, campaign-service, character-service, entity-service.
5. **`DmDashboard.tsx` (169→<150)** — Extracted StatCard, QuickActions, RecentActivity, StatusBar.
6. **`LoginPage.tsx` (178→<150)** — Extracted RoleSelection, DmLoginForm, PlayerPlaceholder.

### Metrics
- Monolith risk: 6 files → 0 files
- Total modules: 37 source files
- TypeScript: 0 errors
- Build: clean Vite build

---
