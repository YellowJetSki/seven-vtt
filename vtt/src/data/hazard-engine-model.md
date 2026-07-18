# Hazard Zone Engine — Component Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    MapEditor.tsx                          │
│  Orchestrates all sub-panels and holds shared state      │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────────────────────┐  ┌──────────────────────┐  │
│  │   AoEPresetPanel.tsx    │  │  HazardTimeline.tsx   │  │
│  │   (Select + place       │  │  (NEW — Cycle 2)      │  │
│  │    templates →          │  │  Active hazards list  │  │
│  │    onAddTemplate cb)    │  │  Round countdown,     │  │
│  │                         │  │  tick buttons,        │  │
│  │  344 lines (REFACTOR)   │  │  expire controls)     │  │
│  └─────────────────────────┘  └──────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │               MapCanvas.tsx                       │   │
│  │  Renders: grid, tokens, FogOfWar, etc.            │   │
│  │                                                    │   │
│  │  ┌────────────────────────────────────────────┐   │   │
│  │  │   AoETemplateOverlay.tsx                    │   │   │
│  │  │   (SVG shapes, glow filters, animations)    │   │   │
│  │  │   Now calls RunicRingOverlay for each tpl   │   │   │
│  │  │   243 lines (REFACTOR)                      │   │   │
│  │  └────────────────────────────────────────────┘   │   │
│  │                                                    │   │
│  │  ┌────────────────────────────────────────────┐   │   │
│  │  │   GroundEffectOverlay.tsx                   │   │   │
│  │  │   (NEW — Cycle 2)                          │   │   │
│  │  │   Render residual ground effects with      │   │   │
│  │  │   elemental particle styling + fade-out    │   │   │
│  │  │   Each effect type has distinct visual:    │   │   │
│  │  │   • Scorch: dark burn pattern              │   │   │
│  │  │   • Ice: crystalline blue surface          │   │   │
│  │  │   • Gas: green radial gradient + drift     │   │   │
│  │  │   • Static: yellow arc lines               │   │   │
│  │  │   • Radiant: white-gold glow ring          │   │   │
│  │  │   • Shadow: purple-black vortex            │   │   │
│  │  +────────────────────────────────────────────+   │   │
│  │                                                    │   │
│  │  ┌────────────────────────────────────────────┐   │   │
│  │  │   RunicRingOverlay.tsx                      │   │   │
│  │  │   (NEW — Cycle 2)                          │   │   │
│  │  │   SVG circle with Elder Futhark rune chars │   │   │
│  │  │   rotating around the hazard. Typeface      │   │   │
│  │  │   color matches magic school.               │   │   │
│  │  │   Animation: rotate 360° over speed sec    │   │   │
│  │  └────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │   HazardTickEngine.tsx                           │   │
│  │   (NEW — Cycle 2, utility module)                │   │
│  │   Pure functions for:                            │   │
│  │   • processHazardTicks(hazards[], currentRound)  │   │
│  │   • shouldTick(hazard, currentRound) → bool      │   │
│  │   • expireHazards(hazards[], currentRound)       │   │
│  │   • spawnGroundEffect(hazard) → GroundEffect     │   │
│  │   • fadeGroundEffects(effects[], currentRound)   │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

## File Dependency Graph

```
hazard-zones.ts (types)
       │
       └─── hazard-tick-engine.ts
                │
        ┌───────┼───────────┐
        │       │           │
  HazardTimeline  GroundEffect  RunicRing
       │       Overlay      Overlay
        └───────┼───────────┘
                │
         AoETemplateOverlay.tsx
         (imports RunicRingOverlay
          and GroundEffectOverlay)
                │
          MapEditor.tsx
          (imports HazardTimeline,
           AoEPresetPanel,
           AoEPlacementMode,
           AoETemplateOverlay)
```

## New Files Created in Cycle 2 (planned)

| File | Purpose | Est. Lines |
|------|---------|-----------|
| `src/types/hazard-zones.ts` | All HazardZone, GroundEffect types | 134 (DONE) |
| `src/lib/hazard-tick-engine.ts` | Pure tick/expire/fade functions | <150 |
| `src/components/maps/HazardTimeline.tsx` | Sidebar list of active hazards | <150 |
| `src/components/maps/GroundEffectOverlay.tsx` | SVG ground effect renderer | <150 |
| `src/components/maps/RunicRingOverlay.tsx` | Animated rune circle SVG | <150 |
| `src/components/maps/HazardTimelineItem.tsx` | Single hazard row for timeline | <150 |

## Zero Firestore Exposure

Hazard zones stored as `AoETemplate[]` (extended with HazardZone fields) on BattleMap. Persisted only to localStorage. No new Firestore collections. Security rules already use catch-all deny outside `/campaigns/{id}/**` and `/homebrew/{id}/**`.
