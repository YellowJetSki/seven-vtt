/**
 * STᚱ VTT — useCharacterMutations
 *
 * All character mutation logic centralized into a single hook.
 * Every mutation writes to BOTH:
 *   1. Zustand campaignStore (instant UI feedback)
 *   2. Firestore (real-time sync to other tabs/devices)
 *
 * This eliminates inline updateCharacter() calls scattered across components
 * and ensures every HP change, XP award, spell slot cast, and death save
 * toggle is persisted to Firestore in real-time.
 */

import { useCallback, useRef } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import { setCharacter } from "@/lib/firestore-service";
import type { PlayerCharacter, SpellLevel, SpellSlotsFull, SpellSlots, InventoryItem } from "@/types";
import { FALLBACK_CAMPAIGN_ID } from "./useFirestoreSync";
import { castSpell, restoreSlots } from "@/lib/mechanics/spell-slot-engine";
import {
  applyShortRest,
  applyLongRest,
  computeHitDiceTotal,
  computeAvailableHitDice,
} from "@/lib/mechanics/rest-engine";

/**
 * Writes a character update to both Zustand (instant) and Firestore (async).
 *
 * Uses a microtask-based accumulator that merges rapid writes within a 50ms
 * window into a SINGLE Firestore write. This prevents dropped mutations while
 * still avoiding Firestore write spam during rapid HP/XP/spell slot changes.
 *
 * Example: Player clicks "-5 HP" 4 times rapidly
 *   Write 1: Zustand hits 39, queues Firestore flush (50ms)
 *   Write 2: Zustand hits 34, same queue (50ms not yet elapsed)
 *   Write 3: Zustand hits 29, same queue
 *   Write 4: Zustand hits 24, same queue
 *   After 50ms: Firestore writes { hitPoints: { current: 24 } }
 *
 * All 4 Zustand writes go through instantly (no dropped mutations).
 * Only 1 Firestore write occurs for all 4 rapid actions.
 */
function useWriteCharacter() {
  const updateCharacter = useCampaignStore((s) => s.updateCharacter);
  const pendingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingIds = useRef<Set<string>>(new Set());

  const flushWrites = useCallback(() => {
    const charIds = Array.from(pendingIds.current);
    pendingIds.current.clear();
    pendingTimer.current = null;

    // Fire a single Firestore write per character with the latest Zustand state
    const state = useCampaignStore.getState();
    for (const charId of charIds) {
      const fullChar = state.characters.find((c) => c.id === charId);
      if (fullChar) {
        setCharacter(FALLBACK_CAMPAIGN_ID, charId, fullChar).catch((err) => {
          console.warn(`[Firestore] Write failed for ${charId}:`, err);
        });
      }
    }
  }, []);

  return useCallback(
    (charId: string, updates: Partial<PlayerCharacter>) => {
      // 1. Instant Zustand update — ALWAYS goes through
      updateCharacter(charId, updates);

      // 2. Queue Firestore flush (debounced per character ID)
      pendingIds.current.add(charId);

      if (!pendingTimer.current) {
        pendingTimer.current = setTimeout(flushWrites, 50);
      }
    },
    [updateCharacter, flushWrites]
  );
}

// ── Exported Hooks ──────────────────────────────────────────

/**
 * Hook providing all HP-related mutations.
 *
 * Returns:
 *   - handleHpChange(charId, delta) — Apply ±HP (clamped 0..max)
 *   - handleSetTempHp(charId, amount) — Set temporary HP
 *   - handleDeathSaveToggle(charId, type, index) — Toggle death save slot
 *   - handleResetDeathSaves(charId) — Reset both success/failure to 0
 */
export function useHpMutations() {
  const write = useWriteCharacter();

  const handleHpChange = useCallback(
    (character: PlayerCharacter, delta: number): { newHp: number; maxHp: number } => {
      const hp = character.hitPoints || { current: 0, max: 0, temporary: 0 };
      const newHp = Math.max(0, Math.min(hp.max, hp.current + delta));
      write(character.id, {
        hitPoints: { ...hp, current: newHp },
      });
      return { newHp, maxHp: hp.max };
    },
    [write]
  );

  const handleSetTempHp = useCallback(
    (character: PlayerCharacter, amount: number): { tempHp: number } => {
      const tempHp = Math.max(0, amount);
      write(character.id, {
        temporaryHitPoints: tempHp,
      });
      return { tempHp };
    },
    [write]
  );

  const handleDeathSaveToggle = useCallback(
    (character: PlayerCharacter, type: "successes" | "failures", index: number): { successes: number; failures: number } => {
      const saves = character.deathSaves || { successes: 0, failures: 0 };
      const current = saves[type];
      const newVal = current === index + 1 ? index : current <= index ? index + 1 : index;
      const clamped = Math.min(3, Math.max(0, newVal)) as 0 | 1 | 2 | 3;
      const updatedSaves = { ...saves, [type]: clamped };
      write(character.id, {
        deathSaves: updatedSaves,
      });
      return updatedSaves;
    },
    [write]
  );

  const handleResetDeathSaves = useCallback(
    (character: PlayerCharacter): { successes: 0; failures: 0 } => {
      const reset = { successes: 0 as const, failures: 0 as const };
      write(character.id, {
        deathSaves: reset,
      });
      return reset;
    },
    [write]
  );

  return { handleHpChange, handleSetTempHp, handleDeathSaveToggle, handleResetDeathSaves };
}

/**
 * Hook providing XP-related mutations.
 *
 * Returns:
 *   - handleAddXp(charId, amount) — Add XP
 *   - handleSetXp(charId, amount) — Set exact XP value
 */
export function useXpMutations() {
  const write = useWriteCharacter();

  const handleAddXp = useCallback(
    (character: PlayerCharacter, amount: number): { newXp: number } => {
      const newXp = Math.max(0, (character.experiencePoints || 0) + amount);
      write(character.id, {
        experiencePoints: newXp,
      });
      return { newXp };
    },
    [write]
  );

  const handleSetXp = useCallback(
    (character: PlayerCharacter, amount: number) => {
      write(character.id, {
        experiencePoints: Math.max(0, amount),
      });
    },
    [write]
  );

  return { handleAddXp, handleSetXp };
}

/**
 * Hook providing spell slot mutations.
 *
 * Returns:
 *   - handleCastSpell(charId, slots, level, upcast?) — Deduct a spell slot
 *   - handleRestoreSlots(charId, slots, level?) — Restore one or all slots
 */
/**
 * Converts character's SpellSlots (stored format with {current, max} only)
 * to SpellSlotsFull (engine format with {level, current, max}).
 */
function toFullSlots(slots: SpellSlots): SpellSlotsFull {
  const full = {} as SpellSlotsFull;
  const fullAny = full as unknown as Record<string, { level: number; current: number; max: number }>;
  for (let lvl = 1 as SpellLevel; lvl <= 9; lvl++) {
    const key = `level${lvl}`;
    const pool = slots[key as keyof SpellSlots];
    if (pool) {
      fullAny[key] = { level: lvl, current: pool.current, max: pool.max };
    } else {
      // FIXED (Sprint 17): Ensure all 9 levels are always initialized.
      // Without this, castSpell on high-level slots (e.g., Lv7+) returns
      // undefined pool error when the character simply hasn't unlocked them yet.
      fullAny[key] = { level: lvl, current: 0, max: 0 };
    }
  }
  return full;
}

/**
 * Converts SpellSlotsFull (engine format) back to SpellSlots (stored format).
 */
function toStoredSlots(full: SpellSlotsFull): SpellSlots {
  const stored: Partial<SpellSlots> = {};
  for (let lvl = 1 as SpellLevel; lvl <= 9; lvl++) {
    const key = `level${lvl}` as keyof SpellSlots;
    const pool = full[key];
    if (pool) {
      stored[key] = { current: pool.current, max: pool.max };
    }
  }
  return stored as SpellSlots;
}

export function useSpellSlotMutations() {
  const write = useWriteCharacter();

  const handleCastSpell = useCallback(
    (character: PlayerCharacter, level: SpellLevel, upcast?: SpellLevel): { success: boolean; reason?: string } => {
      if (!character.spellSlots) {
        return { success: false, reason: "Character has no spell slots configured" };
      }
      const fullSlots = toFullSlots(character.spellSlots);
      const result = castSpell(fullSlots, level, upcast);
      if (result.success) {
        write(character.id, {
          spellSlots: toStoredSlots(result.updatedSlots),
        });
        return { success: true };
      }
      return { success: false, reason: `No level ${level} slots remaining` };
    },
    [write]
  );

  const handleRestoreSlots = useCallback(
    (character: PlayerCharacter, level?: SpellLevel): { success: boolean; reason?: string } => {
      if (!character.spellSlots) {
        return { success: false, reason: "Character has no spell slots configured" };
      }
      const fullSlots = toFullSlots(character.spellSlots);
      const updated = restoreSlots(fullSlots, level);
      write(character.id, {
        spellSlots: toStoredSlots(updated),
      });
      return { success: true };
    },
    [write]
  );

  return { handleCastSpell, handleRestoreSlots };
}

/**
 * Hook providing ability score mutations (for level-up / ASI).
 *
 * Returns:
 *   - handleSetAbility(charId, ability, value) — Set a single ability score
 *   - handleSetLevel(charId, level) — Set character level
 */
export function useAbilityMutations() {
  const write = useWriteCharacter();

  type AbilityKey = "strength" | "dexterity" | "constitution" | "intelligence" | "wisdom" | "charisma";

  const handleSetAbility = useCallback(
    (character: PlayerCharacter, ability: AbilityKey, value: number) => {
      write(character.id, {
        [ability]: Math.max(3, Math.min(30, value)),
      } as Partial<PlayerCharacter>);
    },
    [write]
  );

  const handleSetLevel = useCallback(
    (character: PlayerCharacter, level: number) => {
      write(character.id, {
        level: Math.max(1, Math.min(20, level)),
      });
    },
    [write]
  );

  return { handleSetAbility, handleSetLevel };
}

/**
 * Hook providing inspiration mutation.
 */
export function useInspirationMutation() {
  const write = useWriteCharacter();

  const handleToggleInspiration = useCallback(
    (character: PlayerCharacter): { inspiration: boolean } => {
      const newInspiration = !character.inspiration;
      write(character.id, {
        inspiration: newInspiration,
      });
      return { inspiration: newInspiration };
    },
    [write]
  );

  return { handleToggleInspiration };
}

/**
 * Condition ID type for mutation context.
 */
export type ConditionMutationId = string;

/**
 * Hook providing all condition-related mutations.
 *
 * These mutations write to BOTH Zustand (instant UI) and Firestore
 * (real-time cross-device sync), ensuring conditions applied by
 * the DM instantly propagate to player tabs.
 *
 * Returns:
 *   - handleToggleCondition(char, conditionId) — Add or remove a condition
 *   - handleSetConditions(char, conditionIds) — Replace all conditions (used for clear-all)
 *   - handleSetConcentration(char, spellName?) — Set concentration condition
 *   - handleBreakConcentration(char) — Remove concentration condition
 *
 * FIX (Sprint 26): Created this dedicated hook to replace raw
 * updateCharacter() calls in ConditionQuickToggle and ConditionManager,
 * which were writing ONLY to Zustand and not to Firestore.
 */
export function useConditionMutations() {
  const write = useWriteCharacter();

  const handleToggleCondition = useCallback(
    (
      character: PlayerCharacter,
      conditionId: ConditionMutationId
    ): { conditions: string[]; wasAdded: boolean } => {
      const current = Array.isArray(character.conditions) ? character.conditions : [];
      const isActive = current.includes(conditionId);
      const next = isActive
        ? current.filter((c) => c !== conditionId)
        : [...current, conditionId];

      write(character.id, { conditions: next } as Partial<PlayerCharacter>);
      return { conditions: next, wasAdded: !isActive };
    },
    [write]
  );

  const handleSetConditions = useCallback(
    (
      character: PlayerCharacter,
      conditionIds: ConditionMutationId[]
    ): { conditions: string[] } => {
      const next = [...conditionIds];
      write(character.id, { conditions: next } as Partial<PlayerCharacter>);
      return { conditions: next };
    },
    [write]
  );

  const handleClearAllConditions = useCallback(
    (character: PlayerCharacter): { conditions: string[] } => {
      write(character.id, { conditions: [] } as Partial<PlayerCharacter>);
      return { conditions: [] };
    },
    [write]
  );

  const handleSetConcentration = useCallback(
    (
      character: PlayerCharacter,
      spellName?: string
    ): { conditions: string[] } => {
      const current = Array.isArray(character.conditions) ? character.conditions : [];
      if (current.includes("concentration")) {
        return { conditions: current };
      }
      const next = [...current, "concentration"];
      write(character.id, { conditions: next } as Partial<PlayerCharacter>);
      return { conditions: next };
    },
    [write]
  );

  const handleBreakConcentration = useCallback(
    (character: PlayerCharacter): { conditions: string[] } => {
      const current = Array.isArray(character.conditions) ? character.conditions : [];
      const next = current.filter((c) => c !== "concentration");
      if (next.length === current.length) {
        return { conditions: current }; // No change
      }
      write(character.id, { conditions: next } as Partial<PlayerCharacter>);
      return { conditions: next };
    },
    [write]
  );

  return {
    handleToggleCondition,
    handleSetConditions,
    handleClearAllConditions,
    handleSetConcentration,
    handleBreakConcentration,
  };
}

/**
 * Hook providing all inventory-related mutations.
 *
 * These mutations write to BOTH Zustand (instant UI) and Firestore
 * (real-time cross-device sync), ensuring that when a player equips
 * an item or the DM deposits loot, the change propagates instantly
 * to all connected tabs.
 *
 * FIX (Sprint 28): Created this dedicated hook to replace raw
 * updateCharacter() calls in PlayerSheetInventoryTab, which were
 * writing ONLY to Zustand and not to Firestore.
 *
 * Returns:
 *   - handleSetInventory(char, items) — Replace full inventory array
 *   - handleToggleEquip(char, index) — Toggle isEquipped on an item
 *   - handleAddItem(char, item) — Add a new item
 *   - handleEditItem(char, index, item) — Replace item at index
 *   - handleRemoveItem(char, index) — Remove item at index
 *   - handleUseConsumable(char, index) — Decrement/remove consumable
 *   - handleQuickSell(char, index, currency) — Sell item for GP
 *   - handleDropCompendiumItem(char, itemId) — Drop item from compendium
 *   - handleDropCompendiumSpell(char, spellId) — Drop spell from compendium
 *   - handleDropCompendiumFeat(char, featId) — Drop feat from compendium
 *   - handleSetCurrency(char, currency) — Replace currency object
 */
export function useInventoryMutations() {
  const write = useWriteCharacter();
  const updateCharacter = useCampaignStore((s) => s.updateCharacter);

  const handleSetInventory = useCallback(
    (character: PlayerCharacter, items: InventoryItem[]) => {
      write(character.id, { inventory: items } as Partial<PlayerCharacter>);
    },
    [write]
  );

  const handleToggleEquip = useCallback(
    (character: PlayerCharacter, index: number) => {
      const inventory = character.inventory || [];
      const items = [...inventory];
      if (index >= 0 && index < items.length) {
        items[index] = { ...items[index], isEquipped: !items[index].isEquipped };
        write(character.id, { inventory: items } as Partial<PlayerCharacter>);
      }
    },
    [write]
  );

  const handleAddItem = useCallback(
    (character: PlayerCharacter, item: InventoryItem) => {
      const inventory = character.inventory || [];
      write(character.id, { inventory: [...inventory, item] } as Partial<PlayerCharacter>);
    },
    [write]
  );

  const handleEditItem = useCallback(
    (character: PlayerCharacter, index: number, item: InventoryItem) => {
      const inventory = character.inventory || [];
      const items = [...inventory];
      if (index >= 0 && index < items.length) {
        items[index] = { ...item };
        write(character.id, { inventory: items } as Partial<PlayerCharacter>);
      }
    },
    [write]
  );

  const handleRemoveItem = useCallback(
    (character: PlayerCharacter, index: number) => {
      const inventory = character.inventory || [];
      const items = inventory.filter((_, i) => i !== index);
      write(character.id, { inventory: items } as Partial<PlayerCharacter>);
    },
    [write]
  );

  const handleUseConsumable = useCallback(
    (character: PlayerCharacter, index: number) => {
      const inventory = character.inventory || [];
      const items = [...inventory];
      if (index >= 0 && index < items.length) {
        const item = items[index];
        if (item.quantity <= 1) {
          items.splice(index, 1);
        } else {
          items[index] = { ...item, quantity: item.quantity - 1 };
        }
        write(character.id, { inventory: items } as Partial<PlayerCharacter>);
      }
    },
    [write]
  );

  const handleQuickSell = useCallback(
    (character: PlayerCharacter, index: number) => {
      const inventory = character.inventory || [];
      const currency = character.currency || { leptons: 0, quadrants: 0, assarions: 0 };
      if (index >= 0 && index < inventory.length) {
        const item = inventory[index];
        const value = Math.max(1, Math.round((item.weight || 1) * 5));
        const updatedCurrency = { ...currency, gold: currency.gold + value };
        write(character.id, {
          inventory: inventory.filter((_, i) => i !== index),
          currency: updatedCurrency,
        } as Partial<PlayerCharacter>);
      }
    },
    [write]
  );

  const handleDropCompendiumItem = useCallback(
    (character: PlayerCharacter, itemId: string) => {
      // Create a basic inventory item from the compendium item ID
      // The UI should resolve the full item data from the compendium store
      const inventory = character.inventory || [];
      const newItem: InventoryItem = {
        name: itemId, // Will be resolved by the caller
        quantity: 1,
        weight: 0,
        description: "",
        isEquipped: false,
      };
      write(character.id, { inventory: [...inventory, newItem] } as Partial<PlayerCharacter>);
    },
    [write]
  );

  const handleDropCompendiumSpell = useCallback(
    (character: PlayerCharacter, spellId: string) => {
      // Mark spell as known/prepared on the character
      const preparedSpells = character.preparedSpells || [];
      if (!preparedSpells.includes(spellId)) {
        write(character.id, { preparedSpells: [...preparedSpells, spellId] } as Partial<PlayerCharacter>);
      }
    },
    [write]
  );

  const handleDropCompendiumFeat = useCallback(
    (character: PlayerCharacter, featId: string) => {
      const activeFeats = character.activeFeats || [];
      if (!activeFeats.find((f) => f.featId === featId)) {
        write(character.id, {
          activeFeats: [...activeFeats, { featId, featName: featId, isActive: true }],
        } as Partial<PlayerCharacter>);
      }
    },
    [write]
  );

  const handleSetCurrency = useCallback(
    (character: PlayerCharacter, currencyVal: { copper: number; silver: number; electrum: number; gold: number; platinum: number }) => {
      write(character.id, { currency: currencyVal } as Partial<PlayerCharacter>);
    },
    [write]
  );

  return {
    handleSetInventory,
    handleToggleEquip,
    handleAddItem,
    handleEditItem,
    handleRemoveItem,
    handleUseConsumable,
    handleQuickSell,
    handleDropCompendiumItem,
    handleDropCompendiumSpell,
    handleDropCompendiumFeat,
    handleSetCurrency,
  };
}

// ── Rest Mutations (Sprint 25) ──

export function useRestMutations() {
  const write = useWriteCharacter();

  const handleApplyShortRest = useCallback(
    (characters: PlayerCharacter[]) => {
      for (const char of characters) {
        const totalHD = computeHitDiceTotal(char);
        const availHD = computeAvailableHitDice(char);
        const toSpend = Math.min(availHD, totalHD);
        const result = applyShortRest(char, { hitDiceToSpend: toSpend });
        write(char.id, result);
      }
    },
    [write]
  );

  const handleApplyLongRest = useCallback(
    (characters: PlayerCharacter[]) => {
      for (const char of characters) {
        const result = applyLongRest(char);
        write(char.id, result);
      }
    },
    [write]
  );

  return { handleApplyShortRest, handleApplyLongRest };
}

/**
 * Convenience hook that returns ALL character mutations.
 */
export function useAllCharacterMutations() {
  return {
    ...useHpMutations(),
    ...useXpMutations(),
    ...useSpellSlotMutations(),
    ...useAbilityMutations(),
    ...useInspirationMutation(),
    ...useConditionMutations(),
    ...useInventoryMutations(),
  };
}

