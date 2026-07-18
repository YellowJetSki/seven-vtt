# STᚱ VTT — Security Audit & Anti-Cheat Architecture

## Overview

The VTT uses a **layered security model** with two independent auth systems:

| Layer | Auth Type | Active | Purpose |
|-------|-----------|--------|---------|
| **Layer 1** | Zustand persist (localStorage) | ✅ **Always** | Controls UI access, page routing, action permissions |
| **Layer 2** | Firebase Auth + Firestore Rules | ✅ **When configured** | Protects Firestore data at the database level |

### Key Principle: Local-First

The app works **fully offline** without Firebase. All data is persisted to localStorage
via Zustand's persist middleware. Firebase sync is an **optional enhancement** — when
Firebase is configured, data syncs between DM and players in real-time.

---

## Layer 1: App-Level Access Control (Always Active)

### DM Auth
- **Mechanism:** String comparison against `VITE_DM_USERNAME` / `VITE_DM_PASSWORD`
- **Default credentials:** `MikeJello` / `Jello1` (configurable via `.env`)
- **Enforced by:** `AuthGuard` component wrapping all `/campaign/*` routes
- **Anti-tamper:** Protected by React build process (env vars are compile-time constants)

### Player Auth
- **Mechanism:** Name-entry form that matches against `playerIdentifiers[]`
- **Identifiers synced from:** `campaign.characters[].playerName`
- **Enforced by:** Route-level guard in `App.tsx`

### Protected Routes

| Route | Auth Required | Role |
|-------|---------------|------|
| `/campaign/*` | ✅ | DM only |
| `/player` | ✅ | Player only |
| `/login` | ❌ | Public |
| `/theatric` | ❌ | Public |

---

## Layer 2: Firebase Security Rules (Active When Configured)

### Authentication Flow

```
DM Login (username/password)
  ├── Layer 1: Zustand auth (always) ─────► App grants UI access
  └── Layer 2: Firebase Auth (async)
        ├── If Firebase configured:
        │     signInWithEmailAndPassword()
        │     └── Firebase Auth token with custom claim { role: "dm" }
        │         └── Firestore rules grant write access
        └── If Firebase NOT configured:
              └── App continues in offline mode (no Firestore access needed)
```

### Custom Claims Setup

To enable Firebase Auth, run the claims script ONCE after creating the DM user:

```bash
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json \
DM_AUTH_EMAIL=dm@arkla.com \
node scripts/set-dm-claims.js
```

This sets `request.auth.token.role = "dm"` on the DM's Firebase Auth UID.

### Rules Summary (`firestore.rules`)

| Path | Read | Create | Update | Delete |
|------|------|--------|--------|--------|
| `campaigns/{id}` | Authenticated | DM only | DM only | DM only |
| `campaigns/{id}/characters/{charId}` | Authenticated | DM only | DM **or** Player-own | DM only |
| `campaigns/{id}/enemies/*` | Authenticated | DM only | DM only | DM only |
| `campaigns/{id}/encounters/*` | Authenticated | DM only | DM only | DM only |
| `campaigns/{id}/maps/*` | Authenticated | DM only | DM only | DM only |
| `campaigns/{id}/maps/*/tokens/*` | Authenticated | DM only | DM only | DM only |
| `campaigns/{id}/journal/*` | Authenticated | DM only | DM only | DM only |
| `campaigns/{id}/sessions/*` | Authenticated | DM only | DM only | DM only |
| `campaigns/{id}/sessions/*/combatants/*` | Authenticated | DM only | DM only | DM only |
| `campaigns/{id}/combatLog/*` | Authenticated | DM only | DM only | DM only |
| `homebrew/{id}/*` | Authenticated | DM only | DM only | DM only |
| `liveSessions/{id}/*` | Authenticated | DM only | DM only | DM only |
| `catch-all /**` | Denied | Denied | Denied | Denied |

### Player Write Restrictions

Players can only **update** their OWN character document (where `charId == auth.uid`),
and only these specific fields:

| Field | Purpose | Why Allowed |
|-------|---------|-------------|
| `hitPoints` | HP tracking during combat | Player rolls physical dice |
| `deathSaves` | Death save tracking | Player rolls physical dice |
| `conditions` | Status effects | Player tracks own state |
| `temporaryHitPoints` | Temp HP from spells | Player tracks own buffs |
| `experiencePoints` | XP tracking | Player may track XP |
| `inspiration` | Inspiration points | Player may spend inspiration |
| `currency` | Coin tracking | Player manages inventory |
| `inventory` | Items in possession | Player manages inventory |
| `equipment` | Equipped items | Player changes equipment |
| `characterNotes` | Personal notes | Player writes notes |

**Players CANNOT:**
- Create or delete character documents
- Modify ability scores, level, class, race, or other permanent stats
- Modify other players' characters
- Write to any other subcollection (enemies, maps, journal, etc.)

---

## Anti-Cheat Protections

### 1. Data Boundary Enforcement
- Character data flows **DM → Player** (one-way broadcast for reads)
- Player writes are **firewalled** to specific gameplay fields
- The DM is the **single source of truth** for permanent character data

### 2. Visual Anti-Cheat
- **Physical dice mandate:** No virtual dice rollers (System Law #1)
- Players roll physical dice and input results manually
- DM can audit HP changes in the combat log

### 3. App-Level Guard
- `AuthGuard` component wraps ALL DM routes
- If Zustand state is tampered with (localStorage edit), app re-authenticates
- Route guards prevent URL manipulation to access DM pages

### 4. Firestore Defense in Depth
- Even if a player obtains a Firebase Auth token:
  - They can only update their own character
  - They can only update allowed fields
  - They cannot escalate to other collections
  - Catch-all deny rule blocks any path not explicitly listed

---

## Deployment Checklist for Rules

```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Storage rules
firebase deploy --only storage:rules

# Set DM custom claims (one-time)
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json \
DM_AUTH_EMAIL=dm@arkla.com \
node scripts/set-dm-claims.js

# Verify rules locally
firebase emulators:start --only firestore,auth
```

---

## Breach Simulation Matrix

| Attack Vector | Mitigation | Risk |
|---------------|------------|------|
| Edit localStorage auth state | AuthGuard re-checks on route change; data integrity checks | Low |
| URL manipulation to access DM routes | AuthGuard redirects to `/login` | Low |
| Forge Firebase Auth token | Token validation by Firebase servers | None |
| Player writes to wrong path | Firestore rules deny | None |
| Player modifies another character | `charId == auth.uid` check in rules | None |
| Player modifies forbidden fields | `hasOnly()` check in rules | None |
| Unauthenticated read of campaign data | `request.auth != null` check | None |
| Unauthenticated write of campaign data | `isDm()` check | None |

---

## Rules File Reference

- `vtt/firestore.rules` — 170 lines, Firestore security rules
- `vtt/storage.rules` — 28 lines, Storage security rules
- `vtt/scripts/set-dm-claims.js` — 103 lines, Custom claims setup script
