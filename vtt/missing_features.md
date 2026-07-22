# STᚱ VTT — Missing Features & Gap Analysis
**Generated:** 2026-07-21 — Phase 3 E2E Audit
**Target:** Premium VTT parity (Foundry, Roll20, D&D Beyond standards)

---

## 🔴 CRITICAL GAPS (Must-Have for a Premium VTT)

### 1. Weapon Mastery System (5.5e — Missing entirely)
**Severity:** 🔴 Critical (5.5e RAW)
**Evidence:** Zero matches for `weaponMastery`, `cleave`, `graze`, `push`, `sap`, `slow`, `topple`, `vex`, `nick` in codebase.
**Description:** D&D 5.5e introduced Weapon Mastery — each weapon has a mastery property (Cleave, Graze, Push, Sap, Slow, Topple, Vex, Nick) that martial characters can use. The entire system is absent.
**Affects:** Player combat tab, attack system, character sheet

### 2. Character Builder / Level-Up Wizard
**Severity:** 🔴 Critical
**Description:** Characters are manually created with flat JSON fields. There's no guided step-by-step character builder that walks through:
- Race selection (with subrace)
- Class selection (with subclass at Lv1-3)
- Background selection
- Ability score assignment (point buy / standard array / roll)
- Equipment packages (starting gear)
**Affects:** PlayerCreateModal, PlayerCardManager

### 3. Multi-Class Spell Slot Visual Grid (PHB 164)
**Severity:** 🔴 Critical (5e RAW violation)
**Description:** The multi-class spell slot engine exists (`multiclass-spell-slots.ts`) but there's no UI for multi-class characters. When a character has Wizard 3 / Cleric 1 (effective caster level 4), the spell slot display shows Wizard slots, not the combined pool. The Player Sheet has no way to add multiple classes.
**Affects:** PlayerSheetSpellsTab, SpellSlotMeter, SpellSlotStatus

---

## 🟡 HIGH PRIORITY (Strong Quality-of-Life Impact)

### 4. Background System
**Severity:** 🟡 High
**Description:** Character backgrounds (Acolyte, Criminal, Folk Hero, Sage, etc.) provide skill proficiencies, tool proficiencies, languages, and feature. There's no structured background system — the `background` field is a plain string on `PlayerCharacter`.
**Affects:** PlayerCreateModal, character data model

### 5. Death Save Roll Auto-Resolution
**Severity:** 🟡 High
**Description:** The TokenHpPopover has death save roll simulation (via `Math.random()`), but there's no proper "Roll Death Save" button in the Player Sheet that the player can use. The Death Saves section in the Combat tab shows circles but has no roll button.
**Affects:** PlayerSheetCombatTab, PlayerSheetDeathSaves

### 6. Saving Throw UI on Character Sheet
**Severity:** 🟡 High
**Description:** Saving throws exist in data but there's no visual "Roll Saving Throw" button on the player sheet or player companion view. The DM must track saves manually.
**Affects:** PlayerSheet (all tabs), PlayerCompanionResources

### 7. Player Level-Up Notification
**Severity:** 🟡 High
**Description:** When the DM levels up a character via `LevelUpPanel`, the player has no notification. The XP bar changes but there's no "You've reached level X!" celebration/cinematic.
**Affects:** PlayerSheet, PlayerSheetPage

### 8. Favorites / Quick-Access Bar
**Severity:** 🟡 High
**Description:** No favorites bar for often-used actions (most-used attacks, most-used spells, skills). Players scroll through full lists every session.
**Affects:** PlayerSheetCombatTab, PlayerSheetSpellsTab

### 9. Character Portrait Full Integration
**Severity:** 🟡 High
**Description:** `imageUrl` exists on `PlayerCharacter` and works in some places, but:
- Not shown in the PlayerSheet header as a full hero banner (144-176px)
- Not shown in the companion encounter view
- Not shown in the DmQuickActionPopover target selector
**Affects:** PlayerSheetHeader, PlayerLiveEncounterView, DmQuickActionPopover

### 10. Ready Action / Delay / Hold Turn
**Severity:** 🟡 High
**Description:** In 5e combat, players can Ready an action, Delay, or Hold their turn. The initiative tracker has no mechanism for this — no "Holding" state, no reordering for delayed turns.
**Affects:** DmInitiativeDraft, InitiativeTracker, combatStore

---

## 🟡 MEDIUM PRIORITY

### 11. Spell Scroll & Magic Item Crafting
**Description:** No system for scribing spell scrolls (PHB costs/time) or crafting magic items (XGtE rules). Homebrew items can be created but the crafting process isn't modeled.

### 12. Disease & Poison Trackers
**Description:** No disease tracker, no poison severity system. Conditions cover the basics but diseases (Sewer Plague, Cackle Fever) have mechanical effects not modeled.

### 13. Madness Effects (DMG 258-260)
**Description:** Short-term / long-term / indefinite madness tables and effects not implemented. High-horror campaigns need this.

### 14. Chases (DMG 252-255)
**Description:** Chase rules (dashing, fatigue, obstacles, quarry escapes) not implemented. Common in adventures.

### 15. Siege Equipment & Vehicular Combat Improvements
**Description:** Basic siege weapons exist in `DmShipCombatGuide` but not as standalone combat tools. Ballista, cannon, trebuchet crew actions not integrated into combat tracker.

### 16. Morale System
**Description:** Monsters don't have morale checks for fleeing/surrender. DMs must homebrew it.

### 17. Traps & Hazard Designer
**Description:** No visual tool for placing traps on maps, configuring trigger conditions, or auto-applying trap damage/saving throws.

### 18. Rest Variants (DMG 267)
**Description:** Only standard Short/Long rests implemented. No "Epic Heroism" (5 min / 1 hour) or "Gritty Realism" (8 hours / 7 days) variants.

### 19. Group Checks & Passive Score Tools
**Description:** The Skill Check popover covers individual checks. No "Group Check" (half must succeed) roll-all-at-once button. Passive Perception calculator is in Companion but not globally accessible.

### 20. Encounter Builder — Drag-to-Add from Bestiary
**Description:** Adding enemies to an encounter requires clicking + then searching. Drag-and-drop from bestiary list to encounter builder would be faster.

---

## 🟢 LOW PRIORITY

### 21. Soundboard / Ambient Audio
**Description:** No audio tracks per map (dungeon ambience, forest birds, battle music). Foundry/Roll20 have this.

### 22. Dice Tower / 3D Dice Visualizer
**Description:** No dice rendering whatsoever (by design — physical dice mandate). Listed for completeness.

### 23. Dark Mode Toggle
**Description:** The app is permanently dark mode. No light mode exists. This is intentional.

### 24. Print-Friendly Character Sheet
**Description:** No printable character sheet (PDF) export. Players must use D&D Beyond for physical sheets.

### 25. Initiative Tracker — Search/Filter
**Description:** Initiative tracker shows all combatants. No search/filter for large encounters (30+ combatants).

### 26. Token Aura System
**Description:** Auras (Paladin Aura of Protection, Spirit Guardians radius) not rendered on canvas. Tokens have no configurable visual radius rings.

### 27. Fog of War — Manual Reveal Tool
**Description:** Fog of war exists as automatic vision-based reveal. No "click to reveal" tool for DM to manually uncover areas during exploration.

### 28. Measurement — Area Templates
**Description:** AoE templates exist (Fireball sphere, cone, line) but no grid-highlight preview on the canvas when placing them. The DM must manually count cells.

### 29. Combat Log — Search/Filter
**Description:** Combat log shows all entries. No search by combatant name, no filter by damage type.

### 30. JSON Import — Campaign Import/Export
**Description:** Only Homebrew items/spells/feats can be exported/imported. The full campaign state (characters, maps, journal, encounters) has no export/import.

---

## ARCHITECTURAL NOTES (from audit)

### A. HP Sync Bridge — Now Fixed
**Gap identified & fixed in Phase 2:** `syncCombatantToCharacter()` bridge now ensures DM combat-tracker HP changes propagate to the campaign store (player cards, sheet, dashboard). Previously, combat HP changes only affected the combat store.

### B. Initiative Draft — Exclude Absent PCs — Now Fixed
**Gap identified & fixed in Phase 2:** `DmInitiativeDraft.tsx` now has `includedPcIds` set and `handleTogglePc()` for excluding absent players from an encounter.

### C. Theatric Auto-Follow — Now Fixed
**Gap identified & fixed in Phase 2:** Theatric auto-follow camera now uses direct dependencies (`activeEncounter`, `mapTokens`) instead of stale refs, ensuring the camera centers on the correct token when the turn changes.

### D. Currency Backward-Compatibility Gap
**Remaining Issue:** Some test files and old data still reference `Currency { copper, silver, electrum, gold, platinum }` instead of the new `{ leptons, quadrants, assarions }` system. Found in:
- `end-to-end-smoke.test.ts` — uses old gold-based currency
- `character-derivations-qa.test.ts` — uses old copper-based currency
- `condition-application.test.ts` — uses old copper/gold currency
- `DmQuickActionPopover.tsx` — deposit still references "Assarion Coins" as item name

### E. Vercel Free Tier Rate Limit
Free tier limits to **100 deployments per day**. This is reached frequently during active development sprints. No workaround.

---

**Total: 30 gaps identified** (3 critical, 7 high, 14 medium, 6 low)
**Fixed in Phase 2:** 3 architectural gaps (A, B, C)
**Remaining:** 30 features + 1 data migration (D)
