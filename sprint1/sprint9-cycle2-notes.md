# Sprint 9, Cycle 2 — Feature Refinements + Firebase Sync Audit
## Date: 2026-07-17
## Iteration: 2 of 10

### Purpose
Address new issues from Cycle 1 features, audit Firebase sync architecture.

---

## Step 6: Addressed Issues From New Features

### Issue 1: WeatherOverlay — Inline JSX random values causing rerenders
**Fix**: Extracted `RAIN_STREAK_LINES` as a module-level constant (pre-computed). Removed `Math.random()` from JSX rendering to prevent hydration mismatches and infinite re-renders.

**File**: `vtt/src/components/theatric/WeatherOverlay.tsx`
- Added `RAIN_STREAK_LINES` constant (8 pre-computed streak lines)
- SVG pattern now references the constant instead of generating lines inline
- Added `pointer-events-none` class for consistency with the parent overlay

---

## Step 7: Firebase Sync Architecture Audit

### Issues Found & Fixed

#### Issue A: Hardcoded `CAMPAIGN_ID = "arkla"` (3 files)
**Severity**: 🔴 Critical — Would fail for any campaign not named "arkla"
**Files affected**:
- `vtt/src/hooks/useFirebaseSync.ts`
- `vtt/src/hooks/usePlayerFirebaseSync.ts`
- `vtt/src/lib/sync-queue.ts`

**Fix**: Replaced with `getCampaignId()` / `getQueueCampaignId()` that reads `meta.id` from the campaign store, falling back to `"arkla"` as a safe default.

#### Issue B: Derived `store.campaign` usage in listener callbacks
**Severity**: 🔴 Critical — Calls `buildCampaign()` on every Firestore update, was the root cause of Sprint 3's infinite re-render crash.
**File**: `vtt/src/hooks/useFirebaseSync.ts`

**Fix**: Replaced all `store.setCampaign({ ...store.campaign, ... })` with targeted `useCampaignStore.setState({ characters: merged })`, `useCampaignStore.setState({ battleMaps: merged })`, and `useCampaignStore.setState({ journal: merged })`. Listener callbacks now:
1. Compare incoming IDs with store IDs
2. Merge new items (add + update existing)
3. Set state directly via `setState({ field: value })` — no `buildCampaign()` call

#### Issue C: Player sync only subscribed to sessions + metadata
**Severity**: 🟡 Medium — Players couldn't see combat log or homebrew data in real-time
**File**: `vtt/src/hooks/usePlayerFirebaseSync.ts`

**Fix**: Added subscriptions for:
- `normalizedCombatLog.listenAll()` → combat log entries
- `normalizedHomebrewItems.listenAll()` → homebrew items
- `normalizedHomebrewSpells.listenAll()` → homebrew spells
- `normalizedHomebrewFeats.listenAll()` → homebrew feats

All listeners properly cleanup on unmount.

#### Issue D: Debounced push timer race condition
**Severity**: 🟡 Medium — Single `pushTimerRef` shared across all domains
**File**: `vtt/src/hooks/useFirebaseSync.ts`

**Note**: Not fixed in this cycle. The current implementation cancels the previous timer on every new push, so rapid changes to different domains can overwrite each other. A debounce-per-domain approach would be better but requires more refactoring.

#### Issue E: `normalizedSync.start()` SyncManager is never called
**Severity**: 🟢 Low — Defined but never invoked. The hook sets up its own listeners.
**File**: `vtt/src/lib/normalized-firebase-service.ts`

**Note**: `normalizedSync.start()` is defined but never called anywhere in the app. It duplicates the listener setup in `useFirebaseSync.ts`. Consider removing in a future refactor.

---

## Build Metrics
- Modules: 208 (unchanged)
- Build time: ~776ms
- Bundle: ~440KB JS (121KB gzipped)
- CSS: ~90KB (14KB gzipped)
- TypeScript: **0 errors**
- Files changed: 4 (`useFirebaseSync.ts`, `usePlayerFirebaseSync.ts`, `sync-queue.ts`, `WeatherOverlay.tsx`)
- Git commit: `1932b6f`

---

## Notes for Next Iteration
- Production deployment of Cycle 2 changes pushed to `main`; Vercel auto-deploy pending
- 4 critical/medium Firebase issues fixed
- Debounce-per-domain improvement deferred to future cycle
- Player login flow still needs DM-side character name setup verification
- Consider removing `normalizedSync.start()` SyncManager (dead code)
