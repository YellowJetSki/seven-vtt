# STᚱ VTT Architecture
**Version:** 1.0.0 — Cycle 1 Complete
**Date:** 2026-07-18

## Overview
STᚱ VTT is a premium, enterprise-grade virtual tabletop for the Arkla campaign. Built with React 19, TypeScript, Vite, Tailwind CSS 4, Firebase 11, and Zustand 5.

## Directory Structure
```
vtt/
├── src/
│   ├── main.tsx                 ← Entry point (BrowserRouter)
│   ├── App.tsx                  ← Route tree
│   ├── index.css                ← Tailwind + custom theme + animations
│   ├── vite-env.d.ts            ← ImportMeta type declarations
│   ├── components/
│   │   ├── auth/                ← AuthGuard (route protection)
│   │   ├── layout/              ← AppShell, Sidebar, Header
│   │   └── ui/                  ← Button, Modal, LoadingSpinner, ToastContainer, EmptyState
│   ├── pages/                   ← LoginPage, DmDashboard, TheatricPage
│   ├── stores/                  ← authStore, campaignStore, combatStore, uiStore
│   ├── lib/                     ← firebase.ts, firestore-service.ts
│   └── types/                   ← index.ts (all data models)
├── tests/                       ← Playwright smoke tests
├── firestore.rules              ← Enterprise security rules
├── .env.example                 ← Documented env vars
└── playwright.config.ts
```

## Firebase Schema (13 Normalized Subcollections)

### campaigns/{campaignId} — CampaignMeta
- Core campaign metadata, settings, stats

### Subcollections:
1. `campaigns/{id}/characters/{charId}` — PlayerCharacter
2. `campaigns/{id}/enemies/{enemyId}` — EnemyDoc
3. `campaigns/{id}/encounters/{encId}` — Encounter
4. `campaigns/{id}/maps/{mapId}` — BattleMap
5. `campaigns/{id}/maps/{mapId}/tokens/{tId}` — MapToken
6. `campaigns/{id}/journal/{entryId}` — JournalEntry
7. `campaigns/{id}/sessions/{sessionId}` — SessionDoc
8. `campaigns/{id}/sessions/{sid}/combatants/{cid}` — SessionCombatantDoc
9. `campaigns/{id}/combatLog/{logId}` — CombatLogEntry

### Root Collections:
10. `homebrew/{campaignId}/items/{itemId}` — HomebrewItem
11. `homebrew/{campaignId}/spells/{spellId}` — HomebrewSpell
12. `homebrew/{campaignId}/feats/{featId}` — HomebrewFeat
13. `liveSessions/{campaignId}/...` — Live session sync

## State Management (Zustand)

| Store | Key | Persisted |
|-------|-----|-----------|
| authStore | `str-vtt-auth` | ✅ |
| campaignStore | `str-vtt-campaign-normalized` | ✅ |
| combatStore | `str-vtt-combat` | ✅ |
| uiStore | (none) | ❌ |

## Security Rules
- Authenticated users: read access to all campaign/homebrew data
- DM-only (role == "dm"): write access to all collections
- Players: write only their own character's HP, deathSaves, conditions, XP, currency, inventory, notes
- Catch-all: deny everything outside specified paths

## Build Info
- TypeScript: 0 errors
- Build: ~850ms
- JS Bundle: ~440KB (121KB gzipped)
- CSS: ~91KB (14KB gzipped)

## Cycle 1 — Workspace Initialization & Robust Firebase Architecture (Updated: 2026-07-18 15:18)
## Cycle 1 (2026-07-18): Complete

### What was Built
1. **vtt/ directory** — Full standalone React + TypeScript + Vite project with dedicated package.json
2. **Firebase Layer** — Enterprise-grade `firebase.ts` with multi-tab persistence, emulator detection, and `firestore-service.ts` with 15+ CRUD functions across 13 normalized subcollections
3. **Zustand Stores (4)** — `authStore` (persisted, role-based), `campaignStore` (persisted, normalized), `combatStore` (persisted, full combat engine), `uiStore` (runtime only)
4. **UI Components (5)** — Button, Modal, LoadingSpinner, ToastContainer, EmptyState
5. **Layout** — AppShell (Sidebar + Header) with glassmorphism styling
6. **Pages (3)** — LoginPage (role-based DM/Player selection), DmDashboard (stats + activity), TheatricPage
7. **TypeScript Definitions** — Complete data models for all 13+ entities (430+ lines)
8. **Security Rules** — Enterprise firestore.rules with DM/player role enforcement, recursive wildcard subcollection support, catch-all deny
9. **Testing** — 7 Playwright smoke tests (auth flow, routing error states)
10. **Documentation** — `vtt_architecture.md` and `vtt_state_schema.md` fully populated

### Build Metrics
- Modules: 18 source + config
- TypeScript: 0 errors
- Build: ~850ms
- JS Bundle: ~440KB

### Key Architectural Decisions
- Local-first with optional Firebase sync (not required)
- Normalized Firestore (13 subcollections, no monolithic docs)
- Multi-tab IndexedDB persistence for offline resilience
- Permission model: DM writes all, players write only own character fields
- No dice rollers (physical dice only — system law)
---
