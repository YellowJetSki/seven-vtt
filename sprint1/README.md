# Sprint 9 — Master Index
## Total Cycles: 10 of 10
## Status: ✅ Sprint 9 Complete
## Date: 2026-07-17

---

## Cycle Overview

| Cycle | Step | File | Status | Description |
|-------|------|------|--------|-------------|
| 1 | Step 2-3 | `sprint9-cycle1-notes.md` | ✅ Done | E2E regression test + Feature improvements (Weather overlay, Animated logo) |
| 2 | Step 6 | `sprint9-cycle2-notes.md` | ✅ Done | Fix issues from new features + Firebase sync audit |
| 3 | Step 4-5 | `sprint9-cycle3-notes.md` | ✅ Done | Feature identification + Implementation (Animated logo, Weather overlay) |
| 4 | Step 4-6 | `sprint9-cycle4-notes.md` | ✅ Done | E2E testing + Bug fixes (Weather overlay rerenders, Firebase hardcoded IDs) |
| 5 | Step 5 | `sprint9-cycle5-notes.md` | ✅ Done | Feature implementation (Theatric notes, Player conditions, 6 new presets) |
| 6 | Step 6 | `sprint9-cycle6-notes.md` | ✅ Done | Address issues from new features, verify production deployment |
| 7 | Step 7 | `sprint9-cycle7-notes.md` | ✅ Done | Firebase sync architecture audit (security rules, health monitor, env vars) |
| 8 | Step 8 | `sprint9-cycle8-notes.md` | ✅ Done | Consolidate notes, create index |
| 9 | Extra Harden | `sprint9-cycle9-notes.md` | ✅ Done | Session combatant sync to players, HP callback registration |
| 10 | Final Verify | `sprint9-cycle10-notes.md` | ✅ Done | Full E2E regression, production verification, Sprint 9 wrap |

---

## Fix History

### Critical Fixes
| Fix | Cycle | Description |
|-----|-------|-------------|
| Firestore security rules | 7 | Changed to recursive wildcard `{document=**}` for subcollections |
| Firebase health monitor | 7 | Changed `_health/ping` to `campaigns/arkla` |
| Production env vars | 7 | Added Firebase Auth + DM credentials to `.env.production` |
| Campaign ID | 2 | Replaced hardcoded `"arkla"` with dynamic `getCampaignId()` |
| Derived campaign | 2 | Removed `buildCampaign()` from Firebase listeners (caused infinite re-renders) |
| WeatherOverlay math.random | 2 | Extracted pre-computed rain streaks to module-level constant |

### Minor Fixes
| Fix | Cycle | Description |
|-----|-------|-------------|
| Player sync subscriptions | 2 | Added combat log + homebrew to player listeners |

### Known Gaps (Deferred)
| Gap | Priority | Description |
|-----|----------|-------------|
| ~~Session combatant sync to players~~ | ✅ FIXED | Players now see live HP/status mid-combat (Cycle 9) |
| Map tokens individually synced | Low | Token positions/HP bundled with MapDoc |
| Enemies/Encounters individual push | Low | Only pushed via `pushAllDomains()` on mount |
| Debounce-per-domain | Low | Single `pushTimerRef` shared across domains |

---

## Build Snapshot (Latest)
- **Modules**: 208
- **Build time**: ~811ms
- **JS Bundle**: 440KB (121KB gzipped)
- **CSS**: 90KB (14KB gzipped)
- **TypeScript errors**: 0
- **Console errors**: 0 on all pages
- **Last commit**: `c73bb15` — `main`
- **Production URL**: `https://vtt-seven.vercel.app`

---

---

## Sprint 10 — Character Card Redesign
See `sprint2/sprint10-cycle1-notes.md` for full details.

### Changes
| File | Status | Description |
|------|--------|-------------|
| `CharacterCard.tsx` | ✅ Redesigned | Portrait, HP bar, stats grid, saves/skills, actions |
| `CharacterDetailModal.tsx` | ✅ Redesigned | 4 tabs (Combat/Abilities/Features/Bio), fullscreen portrait |
| `FullscreenImageModal.tsx` | ✅ NEW | Dismissible fullscreen image viewer |
| **Build** | ✅ 0 TS errors, 210 modules, 751ms | |

---

## Quick Reference — Key Files

### Firebase Architecture
| File | Purpose |
|------|---------|
| `vtt/src/lib/firebase.ts` | Firebase init, Auth helpers (loginFirebaseDm, loginFirebasePlayer) |
| `vtt/src/lib/firestore-helpers.ts` | Generic CRUD: writeDoc, readDoc, readAllDocs, listenCollection |
| `vtt/src/lib/normalized-firebase-service.ts` | Domain stubs for 13 subcollections + SyncManager |
| `vtt/src/lib/sync-queue.ts` | Persistent localStorage queue with exponential backoff |
| `vtt/src/hooks/useFirebaseSync.ts` | DM-side push + listen for campaign, combat, homebrew |
| `vtt/src/hooks/usePlayerFirebaseSync.ts` | Player-side listeners for session, combat log, homebrew |
| `vtt/src/hooks/useFirebaseMonitor.ts` | Connection health monitor with auto-reconnect |
| `vtt/src/types/firestore.ts` | All 13 document schemas + Paths constants |
| `vtt/firestore.rules` | Security rules (recursive wildcard for subcollections) |
| `vtt/storage.rules` | Storage rules (auth required, image only, 10MB max) |

### Auth Flow
| File | Purpose |
|------|---------|
| `vtt/src/stores/authStore.ts` | Zustand persist: login(), loginAsPlayer(), logout() |
| `vtt/src/pages/LoginPage.tsx` | DM login (Firebase Auth Email/Password) + Player login (anonymous) |

### Stores
| Store | Key | Persists |
|-------|-----|----------|
| `campaignStore` | `str-vtt-campaign-normalized` | ✅ Yes |
| `combatStore` | `str-vtt-combat` | ✅ Yes |
| `homebrewStore` | `str-vtt-homebrew` | ✅ Yes |
| `authStore` | `str-vtt-auth` | ✅ Yes |
| `uiStore` | — | ❌ No |
| `sessionAnalyticsStore` | — | ❌ No |
| `spotifyStore` | — | ❌ No |

---

## Quick Reference — Environment Variables

| Variable | .env | .env.production | Purpose |
|----------|------|-----------------|---------|
| `VITE_DM_USERNAME` | MikeJello | MikeJello | App-level DM login |
| `VITE_DM_PASSWORD` | Jello1 | Jello1 | App-level DM login |
| `VITE_FIREBASE_API_KEY` | ✅ Set | ✅ Set | Firebase project config |
| `VITE_FIREBASE_AUTH_DOMAIN` | ✅ Set | ✅ Set | Firebase project config |
| `VITE_FIREBASE_PROJECT_ID` | ✅ Set | ✅ Set | Firebase project config |
| `VITE_FIREBASE_STORAGE_BUCKET` | ✅ Set | ✅ Set | Firebase project config |
| `VITE_FIREBASE_APP_ID` | ✅ Set | ✅ Set | Firebase project config |
| `VITE_FIREBASE_AUTH_EMAIL` | ✅ Set | ✅ Set | Firebase Auth DM login |
| `VITE_FIREBASE_AUTH_PASSWORD` | ✅ Set | ✅ Set | Firebase Auth DM login |
| `VITE_USE_EMULATORS` | **true** ❗ | false ✅ | Must be false in production |
| `VITE_SPOTIFY_CLIENT_ID` | ✅ Set | ❌ Not set | Spotify integration |
| `VITE_SPOTIFY_CLIENT_SECRET` | ✅ Set | ❌ Not set | Spotify integration |
| `VITE_DEEPSEEK_API_KEY` | ✅ Set | ❌ Not set | (Rotated — not in use) |
