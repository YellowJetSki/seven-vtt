/**
 * STᚱ VTT — useCompendiumBridge
 *
 * React hook that bridges a character's equipment/preparedSpells/activeFeats
 * with the compendium store (SRD + homebrew). Provides resolved entities
 * with source tracking, and mutation helpers for equipping/unequipping.
 *
 * This is the "write side" of the bridge — the entity injector is the "read side."
 *
 * Usage:
 *   const bridge = useCompendiumBridge(character.id);
 *   bridge.equipItem("Longsword +1");       // finds in compendium, adds to character
 *   bridge.unequipItem("Longsword +1");
 *   bridge.prepareSpell("Fireball");
 *   bridge.unprepareSpell("Fireball");
 *   bridge.toggleFeat("Great Weapon Master");
 */

import { useMemo, useCallback } from "react";
import { useCompendiumStore } from "@/stores/compendium/compendiumStore";
import { useCampaignStore } from "@/stores/campaignStore";
import type { PlayerCharacter } from "@/types";
import {
  resolveWeaponWithFallback,
  resolveSpell,
  resolveFeat,
  detectSource,
  normalizeName,
  type EntitySource,
} from "@/lib/combat/compendium-bridge";

export interface ResolvedWeaponInfo {
  /** The weapon's display name */
  name: string;
  /** The slot it occupies (mainhand, offhand, etc.) */
  slot: string;
  /** Whether it is currently equipped */
  isEquipped: boolean;
  /** Source of the weapon definition */
  source: EntitySource;
}

export interface ResolvedSpellInfo {
  /** The spell's display name */
  name: string;
  /** Whether it is currently prepared */
  isPrepared: boolean;
  /** Source of the spell definition */
  source: EntitySource;
}

export interface ResolvedFeatInfo {
  /** The feat's display name */
  name: string;
  /** Whether it is currently active */
  isActive: boolean;
  /** Source of the feat definition */
  source: EntitySource;
}

export interface CompendiumBridgeResult {
  /** Resolved weapons with source tracking */
  weapons: ResolvedWeaponInfo[];
  /** Resolved spells with source tracking */
  spells: ResolvedSpellInfo[];
  /** Resolved feats with source tracking */
  feats: ResolvedFeatInfo[];
  /** Equip an item from the compendium onto a character */
  equipItem: (itemName: string, slot?: string) => void;
  /** Unequip an item from a character */
  unequipItem: (itemName: string) => void;
  /** Prepare a spell for a character */
  prepareSpell: (spellName: string) => void;
  /** Unprepare a spell */
  unprepareSpell: (spellName: string) => void;
  /** Toggle a feat's active state */
  toggleFeat: (featName: string) => void;
  /** Check if an item is already equipped */
  isItemEquipped: (itemName: string) => boolean;
  /** Check if a spell is already prepared */
  isSpellPrepared: (spellName: string) => boolean;
}

export function useCompendiumBridge(character: PlayerCharacter): CompendiumBridgeResult {
  const updateCharacter = useCampaignStore((s) => s.updateCharacter);
  const itemCatalog = useCompendiumStore((s) => s.items);
  const spellCatalog = useCompendiumStore((s) => s.spells);
  const featCatalog = useCompendiumStore((s) => s.feats);

  const characterId = character.id;

  // ── Resolve all entities ──
  const weapons = useMemo<ResolvedWeaponInfo[]>(() => {
    return (character.equipment || [])
      .filter((e) => {
        const name = e.item.toLowerCase();
        return name.includes("sword") || name.includes("axe") || name.includes("bow") ||
               name.includes("mace") || name.includes("hammer") || name.includes("staff") ||
               name.includes("dagger") || name.includes("spear") || name.includes("crossbow") ||
               name.includes("blade") || name.includes("whip") || name.includes("flail") ||
               name.includes("lance") || name.includes("halberd") || name.includes("pike") ||
               name.includes("sling") || name.includes("dart") || name.includes("javelin") ||
               name.includes("club") || name.includes("maul") || name.includes("rapier") ||
               name.includes("scimitar") || name.includes("shortbow") || name.includes("longbow") ||
               name.includes("trident") || name.includes("warhammer") || name.includes("greataxe") ||
               name.includes("greatsword") || name.includes("quarterstaff") ||
               // Also include from slot names
               e.slot === "mainhand" || e.slot === "offhand" || e.slot === "ranged" ||
               e.slot === "ammunition" || e.slot === "twohand";
      })
      .map((e) => {
        const resolved = resolveWeaponWithFallback(e.item, itemCatalog, e.slot);
        return {
          name: e.item,
          slot: e.slot,
          isEquipped: true,
          source: resolved.source,
        };
      });
  }, [character.equipment, itemCatalog]);

  const spells = useMemo<ResolvedSpellInfo[]>(() => {
    const preparedNames: string[] = (character as any).preparedSpells || [];
    const knownNames: string[] = (character as any).knownSpells || [];
    const names = [...new Set([...preparedNames, ...knownNames])];

    return names.map((name) => {
      const resolved = resolveSpell(name, spellCatalog);
      const isPrepared = preparedNames.some(
        (pn) => normalizeName(pn) === normalizeName(name)
      );
      return {
        name,
        isPrepared,
        source: resolved.entity ? detectSource(resolved.entity) : "synthetic",
      };
    });
  }, [character, spellCatalog]);

  const feats = useMemo<ResolvedFeatInfo[]>(() => {
    const featRefs: Array<{ featId?: string; featName?: string; isActive?: boolean }> =
      (character as any).activeFeats || [];
    const features: string[] = (character.features || []).map((f: any) =>
      typeof f === "string" ? f : f.name
    );

    const processed = new Set<string>();
    const result: ResolvedFeatInfo[] = [];

    // From activeFeats
    for (const ref of featRefs) {
      const name = ref.featName || ref.featId || "";
      if (processed.has(normalizeName(name))) continue;
      processed.add(normalizeName(name));
      const resolved = resolveFeat(name, featCatalog);
      result.push({
        name,
        isActive: ref.isActive ?? false,
        source: resolved.entity ? detectSource(resolved.entity) : "synthetic",
      });
    }

    // From features (legacy)
    for (const featName of features) {
      if (processed.has(normalizeName(featName))) continue;
      processed.add(normalizeName(featName));
      const resolved = resolveFeat(featName, featCatalog);
      if (resolved.entity) {
        result.push({
          name: featName,
          isActive: true,
          source: detectSource(resolved.entity),
        });
      }
    }

    return result;
  }, [character, featCatalog]);

  // ── Mutations ──

  const equipItem = useCallback((itemName: string, slot?: string) => {
    const resolved = resolveWeaponWithFallback(itemName, itemCatalog, slot || "mainhand");
    const currentEquip = character.equipment || [];
    const alreadyEquipped = currentEquip.some(
      (e) => normalizeName(e.item) === normalizeName(itemName)
    );
    if (alreadyEquipped) return;

    const inferredSlot = slot || (
      itemName.toLowerCase().includes("bow") || itemName.toLowerCase().includes("crossbow") ||
      itemName.toLowerCase().includes("sling") || itemName.toLowerCase().includes("dart")
      ? "ranged" : "mainhand"
    );

    updateCharacter(characterId, {
      equipment: [
        ...currentEquip,
        {
          item: resolved.entity.name,
          slot: inferredSlot,
          quantity: 1,
          weight: resolved.entity.weight || 1,
          notes: resolved.entity.description || "",
        },
      ],
    } as any);
  }, [character, itemCatalog, updateCharacter, characterId]);

  const unequipItem = useCallback((itemName: string) => {
    updateCharacter(characterId, {
      equipment: (character.equipment || []).filter(
        (e) => normalizeName(e.item) !== normalizeName(itemName)
      ),
    });
  }, [character, updateCharacter, characterId]);

  const prepareSpell = useCallback((spellName: string) => {
    const current: string[] = (character as any).preparedSpells || [];
    if (current.some((s) => normalizeName(s) === normalizeName(spellName))) return;
    updateCharacter(characterId, {
      preparedSpells: [...current, spellName],
    });
  }, [character, updateCharacter, characterId]);

  const unprepareSpell = useCallback((spellName: string) => {
    const current: string[] = (character as any).preparedSpells || [];
    updateCharacter(characterId, {
      preparedSpells: current.filter(
        (s) => normalizeName(s) !== normalizeName(spellName)
      ),
    });
  }, [character, updateCharacter, characterId]);

  const toggleFeat = useCallback((featName: string) => {
    const current: Array<{ featId: string; featName: string; isActive: boolean }> =
      (character as any).activeFeats || [];
    const existing = current.find(
      (f) => normalizeName(f.featName) === normalizeName(featName)
    );

    if (existing) {
      updateCharacter(characterId, {
        activeFeats: current.map((f) =>
          normalizeName(f.featName) === normalizeName(featName)
            ? { ...f, isActive: !f.isActive }
            : f
        ),
      } as any);
    } else {
      updateCharacter(characterId, {
        activeFeats: [...current, { featId: featName, featName, isActive: true }],
      } as any);
    }
  }, [character, updateCharacter, characterId]);

  const isItemEquipped = useCallback((itemName: string): boolean => {
    return (character.equipment || []).some(
      (e) => normalizeName(e.item) === normalizeName(itemName)
    );
  }, [character]);

  const isSpellPrepared = useCallback((spellName: string): boolean => {
    const current: string[] = (character as any).preparedSpells || [];
    return current.some((s) => normalizeName(s) === normalizeName(spellName));
  }, [character]);

  return {
    weapons,
    spells,
    feats,
    equipItem,
    unequipItem,
    prepareSpell,
    unprepareSpell,
    toggleFeat,
    isItemEquipped,
    isSpellPrepared,
  };
}
