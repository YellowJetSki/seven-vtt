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
import type { PlayerCharacter, SpellLevel, SpellSlotsFull, SpellSlots } from "@/types";
import { FALLBACK_CAMPAIGN_ID } from "./useFirestoreSync";
import { castSpell, restoreSlots } from "@/lib/mechanics/spell-slot-engine";

/**
 * Writes a character update to both Zustand (instant) and Firestore (async).
 * Firestore write is fire-and-forget; errors are logged but not thrown,
 * because the onSnapshot listener will eventually reconcile state.
 */
function useWriteCharacter() {
  const updateCharacter = useCampaignStore((s) => s.updateCharacter);
  const pendingWrites = useRef<Set<string>>(new Set());

  return useCallback(
    (charId: string, updates: Partial<PlayerCharacter>) => {
      // Prevent duplicate rapid writes to same character
      if (pendingWrites.current.has(charId)) return;
      pendingWrites.current.add(charId);

      // 1. Instant Zustand update
      updateCharacter(charId, updates);

      // 2. Async Firestore write
      // We need the full updated character to write to Firestore.
      // Since Zustand is synchronous, we read after set.
      const state = useCampaignStore.getState();
      const fullChar = state.characters.find((c) => c.id === charId);
      if (fullChar) {
        setCharacter(FALLBACK_CAMPAIGN_ID, charId, fullChar).catch((err) => {
          console.warn(`[Firestore] Write failed for ${charId}:`, err);
        });
      }

      // Debounce rapid writes — clear after a tick
      setTimeout(() => {
        pendingWrites.current.delete(charId);
      }, 50);
    },
    [updateCharacter]
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
    (character: PlayerCharacter, delta: number) => {
      const newHp = Math.max(0, Math.min(character.hitPoints.max, character.hitPoints.current + delta));
      write(character.id, {
        hitPoints: { ...character.hitPoints, current: newHp },
      });
    },
    [write]
  );

  const handleSetTempHp = useCallback(
    (character: PlayerCharacter, amount: number) => {
      write(character.id, {
        temporaryHitPoints: Math.max(0, amount),
      });
    },
    [write]
  );

  const handleDeathSaveToggle = useCallback(
    (character: PlayerCharacter, type: "successes" | "failures", index: number) => {
      const current = character.deathSaves[type];
      const newVal = current === index + 1 ? index : current <= index ? index + 1 : index;
      const clamped = Math.min(3, Math.max(0, newVal)) as 0 | 1 | 2 | 3;
      write(character.id, {
        deathSaves: {
          ...character.deathSaves,
          [type]: clamped,
        },
      });
    },
    [write]
  );

  const handleResetDeathSaves = useCallback(
    (character: PlayerCharacter) => {
      write(character.id, {
        deathSaves: { successes: 0, failures: 0 },
      });
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
    (character: PlayerCharacter, amount: number) => {
      write(character.id, {
        experiencePoints: character.experiencePoints + amount,
      });
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
  const full: Partial<SpellSlotsFull> = {};
  for (let lvl = 1 as SpellLevel; lvl <= 9; lvl++) {
    const key = `level${lvl}` as keyof SpellSlots;
    const pool = slots[key];
    if (pool) {
      (full as any)[key] = { level: lvl, current: pool.current, max: pool.max };
    }
  }
  return full as SpellSlotsFull;
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
    (character: PlayerCharacter, level: SpellLevel, upcast?: SpellLevel) => {
      if (!character.spellSlots) return;
      const fullSlots = toFullSlots(character.spellSlots);
      const result = castSpell(fullSlots, level, upcast);
      if (result.success) {
        write(character.id, {
          spellSlots: toStoredSlots(result.updatedSlots),
        });
      }
    },
    [write]
  );

  const handleRestoreSlots = useCallback(
    (character: PlayerCharacter, level?: SpellLevel) => {
      if (!character.spellSlots) return;
      const fullSlots = toFullSlots(character.spellSlots);
      const updated = restoreSlots(fullSlots, level);
      write(character.id, {
        spellSlots: toStoredSlots(updated),
      });
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
    (character: PlayerCharacter) => {
      write(character.id, {
        inspiration: !character.inspiration,
      });
    },
    [write]
  );

  return { handleToggleInspiration };
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
  };
}
