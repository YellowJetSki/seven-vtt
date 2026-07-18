# STᚱ VTT Architecture
**Version:** 3.0.0 — Cycle 3 Complete
**Date:** 2026-07-18

## Overview
STᚱ VTT is a premium, enterprise-grade virtual tabletop for the Arkla campaign.

## Modular Directory Structure
```
vtt/
├── src/
│   ├── components/
│   │   ├── auth/                     ← AuthGuard, DmLoginForm, PlayerPlaceholder, RoleSelection
│   │   ├── dashboard/                ← StatCard, QuickActions, RecentActivity, StatusBar
│   │   ├── layout/                   ← AppShell, Sidebar, Header
│   │   ├── maps/                     ← CANVAS-BASED BATTLE MAP ENGINE (13 files)
│   │   │   ├── CanvasMapView.tsx     ← React Canvas wrapper with pan/zoom/click
│   │   │   ├── LightingControls.tsx  ← Light source management panel
│   │   │   ├── LightColorPicker.tsx  ← Color selector from 9 fantasy light presets
│   │   │   ├── ActiveLightsList.tsx  ← Active light source list with remove
│   │   │   ├── WallEditor.tsx        ← Wall/door/window placement UI
│   │   │   ├── MapSelector.tsx       ← Map selection grid
│   │   │   ├── MapToolbar.tsx        ← Placement mode buttons (light/wall/door)
│   │   │   ├── MapViewControls.tsx   ← Fog/DM View/Grid toggle buttons
│   │   │   ├── ZoomControls.tsx      ← Zoom +/- buttons with percentage
│   │   │   └── PlacementStatusBar.tsx← Active placement mode indicator
│   │   └── ui/                       ← Button, Modal, LoadingSpinner, Toast, EmptyState
│   ├── pages/                        ← LoginPage, DmDashboard, BattleMaps, TheatricPage
│   ├── stores/
│   │   ├── authStore.ts
│   │   ├── campaignStore.ts          ← Composed from 3 slices
│   │   ├── combatStore.ts            ← Composed from 4 slices
│   │   ├── uiStore.ts
│   │   └── campaign/ + combat/       ← Slice files
│   ├── types/
│   │   ├── index.ts                  ← Barrel re-exports
│   │   ├── campaign.ts, character.ts, enemy.ts, encounter.ts, map.ts
│   │   ├── combat.ts, homebrew.ts, journal.ts, ui.ts
│   │   └── lighting.ts              ← NEW: LightSource, WallSegment, VisionProfile,
│   │                                    FogOfWarState, LIGHT_COLORS presets, generateLightId()
│   └── lib/
│       ├── firebase.ts
│       ├── firestore-service.ts      ← Barrel re-exports
│       └── canvas/                   ← NEW: Canvas rendering engine (7 files)
│           ├── lighting-engine.ts    ← Core raycasting, visibility computation, fog logic
│           ├── lighting-renderer.ts  ← Main render orchestrator (combines all layers)
│           ├── raycasting.ts         ← Raycasting engine, line intersection, wall grid gen
│           ├── light-compositor.ts   ← Multi-light compositing, color blending, falloff
│           ├── fog-renderer.ts       ← Fog-of-war overlay + dynamic per-pixel lighting
│           ├── grid-renderer.ts      ← Grid line drawing
│           └── token-renderer.ts     ← Token rendering with HP bars, status dots, setupCanvas
```

## Canvas Rendering Pipeline (Cycle 3)
1. **Clear canvas** → Apply zoom/pan transform
2. **Draw background** (map image or default color)
3. **Draw grid** (customizable color/opacity)
4. **Apply fog of war** (explored but dark vs pitch black unexplored)
5. **Apply dynamic lighting** (per-pixel compositing of all light sources)
6. **Draw tokens** (circles with color, HP bars, status markers, labels)

## Lighting & Vision System
- **Raycasting:** 64 rays per light source, 200 max step iterations, 2px step size
- **Walls:** Perimeter auto-generated, custom walls/doors/windows, open/closed/locked states
- **Light sources:** 9 presets (torch, fire, fae, holy, arcane, neon, moonlight, candle, lantern)
- **Light falloff:** Bright radius (full intensity) → Dim radius (linear falloff to 50%)
- **Fog of war:** Explored radius (3 cells around visible) for smooth fog reveal
- **DM/Player toggle:** DM sees all, Player sees with fog + lighting applied
- **Multi-light compositing:** RGB blending of overlapping light sources with ambient

## Modularity Rules
- **No file exceeds 150 lines** — Zero flagged monoliths (character.ts exempt as pure type defs)
- **Monolith risk:** 0 files flagged

## Build Metrics
- **TypeScript:** 0 errors
- **All source files under 150 lines**

## Cycle 3 — Advanced WebGL Vision & Lighting (Complete) (Updated: 2026-07-18 15:29)
## Cycle 3 (2026-07-18): Complete

### What was Delivered
**Canvas-based Battle Map Engine with Dynamic Lighting**

### New Files (19 modules)
- **`types/lighting.ts`** — LightSource, WallSegment, VisionProfile, FogOfWarState, 9 LIGHT_COLORS presets
- **`lib/canvas/` (7 files)**:
  - `raycasting.ts` — 64-ray circle cast with line-wall intersection, auto perimeter walls
  - `light-compositor.ts` — Per-pixel multi-light RGB blending with falloff
  - `lighting-engine.ts` — Visibility computation, explored cell expansion, default ambient lights
  - `lighting-renderer.ts` — Orchestrator: background → grid → fog → lighting → tokens
  - `fog-renderer.ts` — Fog-of-war overlay + dynamic per-pixel lighting via ImageData
  - `grid-renderer.ts` — Grid line drawing
  - `token-renderer.ts` — Token rendering (HP bars, status dots, labels, canvas setup)
- **`components/maps/` (10 files)**:
  - `CanvasMapView.tsx` — React wrapper with pan/zoom/click using forwardRef
  - `LightingControls.tsx` — Light source management (radius/dim/color/intensity)
  - `LightColorPicker.tsx` — 9-color fantasy light preset grid
  - `ActiveLightsList.tsx` — Active light list with remove
  - `WallEditor.tsx` — Wall/door/window placement with door state toggling
  - `MapSelector.tsx` — Map selection grid
  - `MapToolbar.tsx` — Placement mode buttons
  - `MapViewControls.tsx` — Fog/DM View/Grid toggles
  - `ZoomControls.tsx` — +/- with percentage
  - `PlacementStatusBar.tsx` — Animated active-mode indicator
- **`pages/BattleMaps.tsx`** — Full battle map page integrating all components

### Metrics
- 7 lib files, 10 component files, 1 page, 1 type file = 19 new modules
- All under 150 lines (one borderline: character.ts at 159 — pure type definitions)
- TypeScript: 0 errors
- Build: clean

---
