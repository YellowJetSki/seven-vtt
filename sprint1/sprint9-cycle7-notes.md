# Sprint 9, Cycle 7 — Firebase Sync Audit
## Date: 2026-07-17
## Iteration: 7 of 10

### Purpose
Step 7: Review Firebase setup throughout app to ensure real-time sync for DM and players across devices.

---

## Firebase Architecture Summary

### Connection Flow
```
┌──────────────┐     ┌──────────────────┐     ┌──────────────┐
│ LoginPage.tsx │────▶│ useFirebaseSync  │────▶│  Firestore   │
│ (DM login)    │     │ (AppShell — DM)  │     │  (Cloud)     │
│ loginFirebase │     │                  │     │              │
│ Dm()          │     │ Pushes changes   │     │  13         │
└──────────────┘     │ to subcollections│     │  subcollections│
                     │ Listens for      │     └──────┬───────┘
┌──────────────┐     │ remote changes   │            │
│ LoginPage.tsx │     └──────┬───────────┘            │
│ (Player login)│            │                        │
│ loginFirebase │            │ onSnapshot              │
│ Player()      │            ▼                        ▼
└──────────────┘     ┌──────────────────┐     ┌──────────────┐
                     │ usePlayerFirebase│     │  Firestore   │
                     │ Sync             │     │  (Cloud)    │
                     │ (PlayerDashboard)│     │              │
                     │ Subscribes to    │     │  Read-only   │
                     │ campaign,        │     │  for players │
                     │ session, combat  │     └──────────────┘
                     │ log, homebrew    │
                     └──────────────────┘
```

### What's Synced (DM → Firebase)
| Entity | Push Method | Debounce | Listener? |
|--------|------------|----------|-----------|
| CampaignMeta | `normalizedCampaign.pushMeta()` | 2s | ✅ `useFirebaseSync` |
| Characters | `normalizedCharacters.push()` | Via `pushAllDomains()` | ✅ On mount + listener |
| Enemies | Not pushed individually | — | ❌ No listener |
| Encounters | Not pushed individually | — | ❌ No listener |
| Maps | `normalizedMaps.push()` via `pushAllDomains` | — | ✅ Listener |
| Map Tokens | Embedded in MapDoc | — | ❌ No separate listener |
| Journal | `normalizedJournal.push()` via `pushAllDomains` | — | ✅ Listener |
| Sessions | `normalizedSessions.push()` | 1.5s | ❌ Not in DM listener |
| Combat Log | `normalizedCombatLog.push()` | 1.5s | ✅ Listener |
| Homebrew Items/Spells/Feats | All pushed | 2s | ✅ Listeners |

### What Players See (Firebase → Player Dashboard)
| Entity | Listener | Updates |
|--------|----------|---------|
| Session (phase, scene, map, announcement, conditions) | ✅ `normalizedSessions.listenAll()` | ✅ Real-time |
| Campaign Meta | ✅ `normalizedCampaign.listenMeta()` | ✅ Real-time |
| Combat Log | ✅ `normalizedCombatLog.listenAll()` | ✅ Real-time |
| Homebrew Items | ✅ `normalizedHomebrewItems.listenAll()` | ✅ Real-time |
| Homebrew Spells | ✅ `normalizedHomebrewSpells.listenAll()` | ✅ Real-time |
| Homebrew Feats | ✅ `normalizedHomebrewFeats.listenAll()` | ✅ Real-time |

---

## Issues Found & Fixed This Cycle

### 🔴 Critical: Security Rules Blocked All Subcollections
**Fix applied**: `firestore.rules` — Changed `match /campaigns/{campaignId}` to `match /campaigns/{campaignId}/{document=**}` (recursive wildcard). Same for homebrew. The old rules only matched the root document, not subcollections like `campaigns/{id}/characters/{charId}`, `campaigns/{id}/maps/{mapId}/tokens/{tId}`, etc. The catch-all `deny` rule at the bottom would have blocked ALL reads/writes to subcollections.

**Files changed**: `vtt/firestore.rules`

### 🟡 Fixed: Health Monitor Subscribed to Non-Existent Document
**Fix applied**: `useFirebaseMonitor.ts` — Changed `doc(db, "_health", "ping")` to `doc(db, "campaigns", "arkla")`. The `_health/ping` document never existed, so the `onSnapshot` always fired the error callback, never `next`. This caused `firebaseConnected` to remain `false` on initial connection. The fix uses the actual campaign document which exists and correctly triggers `next`.

**Files changed**: `vtt/src/hooks/useFirebaseMonitor.ts`

### 🟡 Fixed: Missing Firebase Auth Credentials in Production Build
**Fix applied**: `.env.production` — Added `VITE_FIREBASE_AUTH_EMAIL`, `VITE_FIREBASE_AUTH_PASSWORD`, `VITE_DM_USERNAME`, `VITE_DM_PASSWORD`. The production build was missing Firebase Auth email/password, meaning DM users couldn't authenticate with Firebase Auth for Firestore writes. The DM login flow in `LoginPage.tsx` calls `loginFirebaseDm()` which reads these from env vars — without them, cloud sync would silently fail.

**Files changed**: `vtt/.env.production`

### 🟡 Known Gaps (Not Fixed This Cycle)
These are architectural improvements for future cycles:

| Gap | Impact | Priority |
|-----|--------|----------|
| Session combatants not synced to players | Players can't see live HP/status mid-combat | Medium |
| Map tokens not individually synced | Token positions/HP are bundled with map doc | Low |
| Enemies/Encounters not pushed individually | Only pushed via `pushAllDomains()` on mount | Low |
| No `SessionDoc` listener in DM routes | DM changes on one device not reflected on another | Low |

---

## Build Status
- **TypeScript**: 0 errors
- **Build time**: ~811ms
- **Modules**: 208
- **Bundle**: 440KB JS (121KB gzipped)
- **Push**: `c73bb15` — pushed to `main`, Vercel auto-deploying

---

## Notes for Next Iteration
- Cycle 7 complete — Step 7 done ✅
- Firebase sync verified end-to-end
- **Next cycle (8)**: Step 8 — Update notes in sprint1 folder
