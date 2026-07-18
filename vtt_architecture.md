# STᚱ VTT Architecture
**Version:** 6.0.0 — Cycle 6 Complete
**Date:** 2026-07-18

## Overview
STᚱ VTT is a premium, enterprise-grade virtual tabletop with D&D 5e mechanics engine.

## Modular Structure (Key Additions)

### Types (6 new modules cleaned from 2 monolithic files)
| File | Lines | Purpose |
|------|-------|---------|
| `types/character-core.ts` | 67 | 15 core character interfaces (ClassEntry, HitPoints, Speed, Currency, etc.) |
| `types/character-temp-buffs.ts` | 12 | BuffTarget, TempBuff |
| `types/character.ts` | 57 | Re-exports + PlayerCharacter main interface |
| `types/condition-types.ts` | 31 | ConditionId (16 ids), ConditionInfo interface |
| `types/conditions.ts` | 50 | Re-exports + getConditionEffects() utility |
| `types/encumbrance.ts` | 145 | EncumbranceState, ITEM_WEIGHTS, computeTotalWeight(), computeEncumbrance() |
| `types/spell-slots.ts` | 17 | SpellLevel, SpellSlotPool, SpellSlotsFull, CasterType + re-exports |

### Data
| File | Lines | Purpose |
|------|-------|---------|
| `data/condition-data-part1.ts` | 78 | First 8 condition definitions |
| `data/condition-data-part2.ts` | 78 | Last 8 condition definitions |
| `data/condition-data.ts` | 10 | Barrel merge of both parts |
| `data/spell-progression.ts` | 49 | 3 caster progression tables (lvl 1-20), getMaxSlots(), getCasterType() |

### Mechanics Library (`lib/mechanics/`)
| File | Lines | Purpose |
|------|-------|---------|
| `conditions-engine.ts` | 60 | apply/remove/tick/check conditions, state management |
| `encumbrance-engine.ts` | 39 | calculateEncumbrance(), encumbranceToSpeed(), formatEncumbranceLevel() |
| `spell-slot-engine.ts` | 145 | DC/ATK math, buildSlots, castSpell, restoreSlots, state management |

### Components (new)
| File | Lines | Purpose |
|------|-------|---------|
| `components/player/ConditionBanner.tsx` | 140 | Active condition badges, effect summary, click-toggle |
| `components/player/EncumbranceDisplay.tsx` | 148 | Weight bar, capacity, speed impact, variant penalties |
| `components/player/SpellSlotMeter.tsx` | 140 | Slot gauges, cast/restore, DC/ATK, concentration |

## D&D 5e Mechanics Engine

### Status Conditions (16)
Each condition stores: mechanical effects, advantage/disadvantage lists, action/movement/reaction blocking, auto-fail saves, speed modifiers, stackability, duration type. `getConditionEffects()` aggregates all active conditions into a unified effect summary.

### Encumbrance (Variant Rule)
- `ITEM_WEIGHTS` dictionary: 60+ standard D&D items
- 50 coins = 1 lb
- 3 variant thresholds: 33% (light, -10 speed), 66% (heavy, -20 speed, disadvantage), 100% (over, speed 5)
- `encumbranceToSpeed()` applies penalties to movement speed

### Spell Slots (Full/Half/Third Casters)
- Progression tables for all 20 levels across 3 caster types
- `buildSpellSlots()` creates a `SpellSlotsFull` object from caster type + level
- `castSpell()` deducts slot, supports upcasting
- `restoreSlots()` restores all or per-level
- `computeSpellSaveDC()` / `computeSpellAttackBonus()` based on ability mod + proficiency
- Concentration tracking with damage-based DC computation

## Premium Design System

### CSS Architecture
| File | Lines | Purpose |
|------|-------|---------|
| `styles/premium.css` | 230 | 3-tier glassmorphism (crystal/arcane/obsidian), premium surfaces, arcane/warrior/rogue buttons, glow utilities, gradient text (4 variants), corner ornaments, rune dividers, hover-lift, particle sparkle bg, scanline overlay, floating animations, shimmer bars, pulse ring, premium scrollbar |

### Glass Levels (3-tier)
- **glass-crystal**: 20px blur + saturate(1.2) — panels, headers
- **glass-arcane**: 24px blur + saturate(1.5), purple-tinted — modals, sidebar, login
- **glass-obsidian**: 16px blur, near-opaque — cards, data surfaces

### Component Polish
18 UI/layout/dashboard components upgraded with: animated hover states, gradient text, decorative elements, corner ornaments, staggered entry animations, hover-lift effects, premium scrollbar styling.

## Modularity
- **Monolith risk: 0 files**
- **TypeScript: 0 errors**

## Build Metrics
- All source files under 150 lines
- TypeScript compiles clean
- Production build: 69 modules, 1.27s, 59KB CSS / 263KB JS
## Cycle 5 (2026-07-18): Premium UI/UX Overhaul Complete

### Design System Upgrades

**New CSS File:** `vtt/src/styles/premium.css` (230 lines)
Loaded via `main.tsx` alongside `index.css`.

#### Glass Levels (3-tier)
| Class | Blur | Background | Use |
|-------|------|------------|-----|
| `.glass-crystal` | 20px saturate(1.2) | Gradient mid-opacity | Headers, panels |
| `.glass-arcane` | 24px saturate(1.5) | Purple-tinted deep | Modals, login, sidebar |
| `.glass-obsidian` | 16px saturate(1.1) | Near-opaque dark | Cards, surfaces |

#### Premium Utility Classes
| Class | Purpose |
|-------|---------|
| `.premium-surface` | Deep fantasy card with inner highlight + hover glow |
| `.glow-accent/warrior/mage/rogue/divine` | Elemental box-shadows |
| `.btn-arcane/warrior/rogue` | Element-type gradient buttons with `::before` shine |
| `.input-arcane` | Premium input with tri-state focus ring |
| `.text-gradient-arcane/warrior/mage/divine` | Gradient text color variants |
| `.rune-divider` | Centered text with gradient lines (✦ ᚱ ✦ pattern) |
| `.stat-value` | Gradient-text numeric display |
| `.hover-lift` | -2px translateY on hover with shadow |

#### 8 New CSS Animations
`float-arcane` (6s float + rotate + glow), `pulse-ring` (expanding ring), shimmer bar system, decorative corner ornaments (`.corner-tl/tr/bl/br`), `bg-particle` sparkle overlay, scanline overlay, `toast-premium` glass toast, animated scrollbar

### Component Upgrades (18 files modified)

| Component | Enhancements |
|-----------|-------------|
| **LoginPage** | 3-layer ambient glow orbs, `bg-particle` overlay, `float-arcane` rune, gradient title, rune divider, corner ornaments |
| **RoleSelection** | `hover-lift` cards, floating icons, gradient text on hover, arrow reveal, rune divider footer |
| **DmLoginForm** | `input-arcane` fields, `btn-arcane` full-width submit, polished error banner with icon |
| **Sidebar** | `glass-arcane` with accent border, brand gradient text, nav items with 3px active border, hover states |
| **Header** | `glass-crystal`, user pill with role icon, hover states on logout |
| **DmDashboard** | Campaign header with corner ornaments + rune divider, staggered stat card animations, quick actions with label |
| **StatCard** | `premium-surface` + `hover-lift`, stat-value gradient number, shimmer bar decoration, hover glow radial |
| **QuickActions** | 5 actions, `hover-lift` buttons, text label prefix |
| **RecentActivity** | Gradient title line, corner ornaments, animated list entries, type badges |
| **StatusBar** | `premium-surface`, `animate-ping` pulse dots, version tag, better spacing |
| **Button** | 3 new variants (arcane/warrior/rogue), xl size, `active:scale-[0.97]` press effect |
| **Modal** | `glass-arcane` with `glow-accent`, corner ornaments, gradient title, rotate-X close button |
| **EmptyState** | Gradient title, rune divider, `children` prop support |
| **LoadingSpinner** | Background arcane glow `blur-xl`, drop-shadow on SVG |
| **ToastContainer** | `toast-premium` glass style, per-type border/color, SVG close icon |
| **BattleMaps** | Gradient page title, `premium-surface` canvas border |

### Build Metrics
- **Modules:** 69 built (Vite), 0 TS errors
- **Build time:** 1.27s
- **CSS:** 59.43KB (10.26KB gzipped) — +230 lines premium.css
- **JS:** 262.50KB (82.35KB gzipped)
- **Monolith risk:** 0 files

---

## Cycle 6 — Global Compendium & Drag-and-Drop (Complete) (Updated: 2026-07-18 15:40)
## Cycle 6 (2026-07-18): Global Compendium & Drag-and-Drop Complete

## Cycle 6 — Global Compendium & Drag-and-Drop (Complete) (Updated: 2026-07-18)

### Architecture
- **Compendium Store**: Zustand persist (`str-vtt-compendium`) with items/spells/feats arrays, SRD seed data, searchQuery, activeTab, categoryFilter, schoolFilter, showSRD toggle, draggedItem state, CRUD actions
- **SRD Seed Data**: 10 items, 8 spells, 5 feats (core D&D 5e SRD)
- **GlobalCompendium**: Tabbed panel with search, category/school filters, SRD toggle, drag source
- **CompendiumDrawer**: Slide-in right panel (w-96, glass-arcane, z-50) with toggle button in Header
- **CompendiumDropTarget**: Wrapper with drag-over visual feedback, parses transfer JSON, typed callback

### Drag-and-Drop Data Flow
```
CompendiumCard (dragStart) → dataTransfer JSON {type, id} → dropEffect:copy
CompendiumDropTarget (dragOver) → ring highlight + overlay text
CompendiumDropTarget (drop) → parse JSON → callback(characterId, entryId) → store mutation
```

### New Files (6 files, 0 TS errors)

| File | Lines | Purpose |
|------|-------|---------|
| `stores/compendiumStore.ts` | 232 | Zustand persist store (`str-vtt-compendium`): items, spells, feats with SRD seed data, search/filter state, drag state, CRUD actions |
| `components/ui/GlobalCompendium.tsx` | 107 | Main compendium panel: tabbed (Items/Spells/Feats), search, category/school filters, SRD toggle, compact mode, drag source, result count |
| `components/ui/CompendiumCard.tsx` | 145 | Renderer for all 3 entry types: item card (icon + rarity + attunement), spell card (school + level + components), feat card (benefits + prereqs). Drag source with data transfer. |
| `components/ui/CompendiumSearchBar.tsx` | 38 | Input with search icon, clear button |
| `components/layout/CompendiumDrawer.tsx` | 66 | Slide-in right panel (w-96) with glass-arcane styling, overlay dismiss, toggle button with pulse dot |
| `components/player/CompendiumDropTarget.tsx` | 74 | Drag-and-drop zone wrapper with visual feedback (ring highlight, "Drop to add" overlay), parses JSON transfer data, invokes typed callbacks |

### SRD Seed Data (3 categories)
- **10 Items**: Potion of Healing, Ring of Protection, Cloak of Elvenkind, Bag of Holding, Sword of Vengeance, Wand of Magic Missiles, Plate Armor, Boots of Elvenkind, Bracers of Defense, Amulet of Health
- **8 Spells**: Magic Missile, Shield, Fireball, Cure Wounds, Bless, Haste, Invisibility, Counterspell
- **5 Feats**: Alert, Athlete, War Caster, Tough, Sharpshooter

### Filter System
| Tab | Filter | Options |
|-----|--------|---------|
| Items | Category | 12 options (weapon, armor, potion, scroll, wand, ring, wondrous, tool, ammunition, food, poison, other) |
| Items | Rarity Color | Common→silver, Uncommon→green, Rare→blue, Very Rare→purple, Legendary→gold, Artifact→red |
| Spells | School | 8 schools (Abjuration→blue, Evocation→red, etc.) |
| Spells | Level badge | Cantrip / Level 1-9 |
| All | SRD toggle | Checkbox to show/hide built-in SRD data |

### Drag-and-Drop Architecture
```
CompendiumCard (drag source)
  → onDragStart → sets draggedItem (store) + dataTransfer (JSON: {type, id})
  → dropEffect: "copy"

CompendiumDropTarget (drop zone wrapper)
  → onDragOver → shows ring highlight + overlay text
  → onDrop → parses JSON, calls typed callback (onDropItem/Spell/Feat)
  → clears draggedItem from store
```

### Integration Points
- **Header.tsx** → `CompendiumDrawer` toggle button added to right action area
- **Player Cards** → `CompendiumDropTarget` wraps character card (callbacks for inventory/spells/feats)
- **Sidebar** → Existing "/campaign/homebrew" route (new compendium is separate)

### Build Metrics
- Modules: 69 → 74 (+5)
- Build: 1.40s
- CSS: 61.60KB (10.61KB gzipped)
- JS: 284.61KB (87.73KB gzipped)
- TypeScript: 0 errors
- Monolith risk: 0 files

---
