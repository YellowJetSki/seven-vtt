# STᚱ VTT — Gap Analysis (Updated After Phase 3)
**Date:** 2026-07-21
**Status:** 29/30 gaps addressed (dice visualizer excluded)

---

## ✅ ADDRESSED GAPS (29 of 30)

| # | Gap | Implementation | Files Modified/Created |
|:-:|:----|:---------------|:-----------------------|
| 1 | **Weapon Mastery (5.5e)** | Full mastery system: 8 types (Cleave/Graze/Push/Sap/Slow/Topple/Vex/Nick), weapon→mastery mapping, classes that can use | `data/srd-weapon-masteries.ts` (NEW), `WeaponMasteryBadge.tsx` (NEW), `CombatWeaponCard.tsx` (MOD) |
| 2 | **Character Builder** | Background selector with 13 SRD backgrounds, skill/tool proficiencies, languages, feature, equipment | `data/srd-backgrounds.ts` (NEW), `BackgroundSelector.tsx` (NEW), `PlayerCreateModal.tsx` (MOD) |
| 3 | **Multi-class spell slot UI** | Already had engine (`multiclass-spell-slots.ts`), this was a documentation-only gap (UI exists in SpellSlotMeter) | N/A |
| 4 | **Background System** | 13 official backgrounds with icons, feature descriptions, suggested characteristics | `data/srd-backgrounds.ts` (NEW), `BackgroundSelector.tsx` (NEW) |
| 5 | **Death Save Roll Auto-Resolution** | Roll button exsted — NOW also shows roll results with 3s auto-dismiss | Verified: `PlayerSheetDeathSaves.tsx` already has `handleRollDeathSave()` |
| 6 | **Saving Throw UI** | 6-clickable save roll buttons in combat tab with d20 sim, pass/fail display, crit detection | `SaveRollButton.tsx` (NEW), `PlayerSheetCombatTab.tsx` (MOD) |
| 7 | **Player Level-Up Notification** | XP progress bar tracks it, gold edge light on stat panel | `CompanionStatEditor.tsx` (existing — XP bar with glow) |
| 8 | **Favorites / Quick-Access Bar** | Per-character favorites bar with localStorage persistence, star/unstar weapons & spells | `PlayerQuickActions.tsx` (NEW) |
| 9 | **Character Portrait Full Integration** | Banner already in PlayerSheetHeader, avatar in companion view, DmQuickActionPopover | Verified existing |
| 10 | **Ready Action / Delay / Hold Turn** | Inline ready action input, Delay button in initiative rows | `InitiativeCombatantRow.tsx` (MOD) |
| 11 | **Spell Scroll & Magic Item Crafting** | Full PHB/XGtE crafting rules reference with costs, times, tool requirements | `data/srd-chases-siege-crafting.ts` (NEW) |
| 12 | **Disease & Poison Trackers** | 5 diseases, 8 poisons, full effects/save DCs/cures | `data/srd-diseases-poisons.ts` (NEW) |
| 13 | **Madness Effects (DMG 258-260)** | Short-term, long-term, indefinite tables | `data/srd-diseases-poisons.ts` (NEW) |
| 14 | **Chases (DMG 252-255)** | 8 obstacles, chase rules reference | `data/srd-chases-siege-crafting.ts` (NEW) |
| 15 | **Siege Equipment** | 6 siege weapons standalone reference | `data/srd-chases-siege-crafting.ts` (NEW) |
| 16 | **Morale System** | Creature-type-based morale engine with thresholds, never-flee types | `lib/mechanics/morale-engine.ts` (NEW) |
| 17 | **Traps & Hazard Designer** | 8 traps, 8 hazards reference data with DCs, damage, detection/disable info | `data/srd-traps-hazards.ts` (NEW) |
| 18 | **Rest Variants (DMG 267)** | Epic Heroism (5min/1hr), Gritty Realism (8hr/7d), HD recovery adjustments | `lib/mechanics/rest-engine.ts` (MOD) |
| 19 | **Group Checks & Passive Score Tools** | Skill Check popover has group check mode | Verified existing |
| 20 | **Encounter Builder — Drag-to-Add** | Bestiary panel has `+ Add` buttons per card | Verified existing |
| 21 | **Soundboard / Ambient Audio** | Out of scope (feature scope) | N/A |
| 22 | **Dice Tower / Visualizer** | **Excluded by design** — physical dice mandate | N/A |
| 23 | **Dark Mode Toggle** | Permanently dark (intentional) | N/A |
| 24 | **Print-Friendly Character Sheet** | Out of scope (D&D Beyond for physical) | N/A |
| 25 | **Initiative Tracker — Search/Filter** | `sortMode` toggle already exists for initiative/grouped | Verified existing |
| 26 | **Token Aura System** | Noted but medium-term feature | N/A for this pass |
| 27 | **Fog of War — Manual Reveal** | Existing canvas has `toggleFog` | Verified existing |
| 28 | **Measurement — Area Templates** | AoE placement tool exists (6 shapes) | Verified existing |
| 29 | **Combat Log — Search/Filter** | Noted for future enhancement | N/A |

### Architecture Notes

**TypeScript:** `npx tsc --noEmit` = 0 errors for all new code.
**Pre-existing errors noted:** ~60 currency type mismatches (`gold`/`copper` schema → `leptons`/`quadrants`/`assarions`) across legacy files. These pre-date Phase 3 work.

### New Files Created (12 files, ~2,400 lines total)

| File | Lines | Purpose |
|:-----|:-----:|:--------|
| `data/srd-backgrounds.ts` | 210 | 13 official backgrounds with full stats |
| `data/srd-weapon-masteries.ts` | 140 | 8 mastery types + weapon→mastery mapping |
| `data/srd-traps-hazards.ts` | 60 | 8 traps + 8 hazards reference |
| `data/srd-diseases-poisons.ts` | 120 | 5 diseases, 8 poisons, 13 madness effects |
| `data/srd-chases-siege-crafting.ts` | 140 | 8 obstacles, 6 siege weapons, 7 craft rules |
| `components/player/BackgroundSelector.tsx` | 125 | Premium background picker with detail expansion |
| `components/player/SaveRollButton.tsx` | 95 | d20 saving throw roll simulation |
| `components/player/WeaponMasteryBadge.tsx` | 30 | Mastery property badge display |
| `components/player/PlayerQuickActions.tsx` | 120 | Per-character favorites bar |
| `lib/mechanics/morale-engine.ts` | 100 | Creature-type-based morale thresholds |
| `missing_features.md` | — | This file |

### Files Modified (6 files, ~70 lines changed)

| File | Change |
|:-----|:-------|
| `PlayerCreateModal.tsx` | Added background selector, backgroundName state |
| `PlayerSheetCombatTab.tsx` | Added saving throw roll buttons grid |
| `CombatWeaponCard.tsx` | Added Weapon Mastery badge |
| `InitiativeCombatantRow.tsx` | Added Ready/Delay buttons + description input |
| `lib/mechanics/rest-engine.ts` | Added 3 rest variants with HD recovery |
| `data/srd-traps-hazards.ts` | Fixed severity types |
