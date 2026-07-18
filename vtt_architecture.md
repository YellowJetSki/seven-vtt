# STᚱ VTT Architecture
**Version:** 4.0.0 — Cycle 4 Complete
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

## Modularity
- **Monolith risk: 0 files**
- **TypeScript: 0 errors**

## Build Metrics
- All source files under 150 lines
- TypeScript compiles clean
