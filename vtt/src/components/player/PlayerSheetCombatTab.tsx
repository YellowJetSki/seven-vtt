/**
 * STᚱ VTT — Player Sheet Combat Tab (Refactored Orchestrator)
 *
 * REFACTOR (Sprint 9): Monolith of 577 lines broken into 5 reusable sub-components
 * + 1 utility module + 6 existing sub-components:
 *
 * EXTRACTED (NEW):
 *   - CombatStatusBanner           → Condition-aware HP status display
 *   - HpKeypadSection              → Full HP management (keypad, input, temp HP, rest)
 *   - CombatSectionHeader          → Reusable section header with accent line
 *   - ClassFeatureList             → Feature cards with descriptions
 *   - lib/combat/combat-resource-deriver → buildWeaponAttacks, deriveClassResources, computeCombatStatus
 *
 * KEPT (Existing):
 *   - CombatWeaponCard, CombatSpellCard, CombatFeatCard
 *   - PlayerFeatsSection
 *   - ClassResourcesTracker
 *   - SpellSlotStatus
 *   - PlayerSheetConditions / ConditionManager
 *   - PlayerSheetDeathSaves
 *   - PlayerSheetCharacterStats
 *   - RestBreakdown / ShortRestDialog / LongRestDialog
 *
 * Orchestrator now handles: state wiring, mutation callbacks, derived data.
 * All rendering delegated to sub-components.
 */

import { useMemo, useState, useCallback } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import { useCompendiumStore } from "@/stores/compendium/compendiumStore";
import type { PlayerCharacter } from "@/types";
import { computeAllDerivations } from "@/lib/mechanics/character-derivations";
import { useHpMutations, useSpellSlotMutations } from "@/hooks/useCharacterMutations";
import { injectCombatEntities } from "@/lib/combat/entity-injector";
import {
  deriveClassResources,
} from "@/lib/combat/combat-resource-deriver";
import CombatStatusBanner from "./CombatStatusBanner";
import CombatSectionHeader from "./CombatSectionHeader";
import CombatWeaponCard from "./CombatWeaponCard";
import CombatSpellCard from "./CombatSpellCard";
import CombatFeatCard from "./CombatFeatCard";
import ClassFeatureList from "./ClassFeatureList";
import HpKeypadSection from "./HpKeypadSection";
import PlayerFeatsSection from "./PlayerFeatsSection";
import ClassResourcesTracker from "./ClassResourcesTracker";
import SpellSlotStatus from "./SpellSlotStatus";
import PlayerSheetConditions from "./PlayerSheetConditions";
import PlayerSheetDeathSaves from "./PlayerSheetDeathSaves";
import PlayerSheetCharacterStats from "./PlayerSheetCharacterStats";
import RestBreakdown from "./RestBreakdown";
import ShortRestDialog from "./ShortRestDialog";
import LongRestDialog from "./LongRestDialog";
import ConditionManager from "./ConditionManager";

interface PlayerSheetCombatTabProps {
  character: PlayerCharacter;
}

export default function PlayerSheetCombatTab({ character }: PlayerSheetCombatTabProps) {
  const c = character;
  const updateCharacter = useCampaignStore((s) => s.updateCharacter);
  const { handleHpChange, handleSetTempHp } = useHpMutations();
  const { handleCastSpell, handleRestoreSlots } = useSpellSlotMutations();
  const derived = useMemo(() => computeAllDerivations(c), [c]);

  // ── Unified Entity Injection ──
  const compendiumState = useCompendiumStore();
  const combatEntities = useMemo(
    () =>
      injectCombatEntities({
        character: c,
        derived: {
          proficiencyBonus: derived.proficiencyBonus,
          abilityMods: derived.abilityMods,
          spellSaveDC: derived.spellcasting.spellSaveDC,
          spellAttackBonus: derived.spellcasting.spellAttackBonus,
          spellcastingAbility: derived.spellcasting.spellcastingAbility,
        },
        itemCatalog: compendiumState.items,
        spellCatalog: compendiumState.spells,
        featCatalog: compendiumState.feats,
      }),
    [c, derived, compendiumState.items, compendiumState.spells, compendiumState.feats]
  );

  // ── UI State ──
  const [showFeatsManager, setShowFeatsManager] = useState(false);
  const [showRestSheet, setShowRestSheet] = useState(false);
  const [showShortRestDialog, setShowShortRestDialog] = useState(false);
  const [showLongRestDialog, setShowLongRestDialog] = useState(false);
  const [showConditionManager, setShowConditionManager] = useState(false);

  // ── Combat status ──
  const hpRatio = c.hitPoints.max > 0 ? c.hitPoints.current / c.hitPoints.max : 0;
  const isAtZero = c.hitPoints.current <= 0;
  const isDead = c.deathSaves.failures >= 3;
  const isBloodied = !isAtZero && hpRatio <= 0.5;

  const hpColor =
    hpRatio > 0.5 ? "bg-emerald-500" : hpRatio > 0.25 ? "bg-amber-500" : "bg-red-500";
  const hasTemp = (c.temporaryHitPoints || 0) > 0;

  // ── HP handlers ──
  const onHpChange = useCallback((delta: number) => handleHpChange(c, delta), [c, handleHpChange]);

  const onSetTempHp = useCallback(
    (amount: number) => {
      if (amount === 0) {
        handleSetTempHp(c, 0);
      } else {
        handleSetTempHp(c, amount + (c.temporaryHitPoints || 0));
      }
    },
    [c, handleSetTempHp]
  );

  // ── Feat toggle handler ──
  const handleFeatToggle = useCallback(
    (featId: string, newActive: boolean) => {
      const current: Array<{ featId: string; featName: string; isActive: boolean }> =
        (c as any).activeFeats || [];
      const existing = current.findIndex((a) => a.featId === featId);
      let next: Array<{ featId: string; featName: string; isActive: boolean }>;
      if (existing >= 0) {
        next = [...current];
        next[existing] = { ...next[existing], isActive: newActive };
      } else {
        const feat = combatEntities.feats.find((f) => f.sourceId === featId || f.id === featId);
        next = [...current, { featId, featName: feat?.name || featId, isActive: newActive }];
      }
      updateCharacter(c.id, { activeFeats: next } as any);
    },
    [c, combatEntities.feats, updateCharacter]
  );

  // ── Class resource tracking ──
  const resources = useMemo(() => deriveClassResources(c.features, c.resources), [c.features, c.resources]);

  const handleResourceChange = useCallback(
    (resName: string, delta: number) => {
      const resource = resources.find((r) => r.name === resName);
      if (!resource) return;
      const newCurrent = Math.max(0, Math.min(resource.max, resource.current + delta));
      const updatedResources = [...(c.resources || [])];
      const idx = updatedResources.findIndex((r) => r.name === resName);
      if (idx >= 0) {
        updatedResources[idx] = { ...updatedResources[idx], current: newCurrent };
      } else {
        updatedResources.push({ ...resource, current: newCurrent });
      }
      updateCharacter(c.id, { resources: updatedResources });
    },
    [c.id, c.resources, resources, updateCharacter]
  );

  return (
    <div className="space-y-4 px-3 py-3">
      {/* Combat Status Banner */}
      <CombatStatusBanner
        character={character}
        hpRatio={hpRatio}
        isAtZero={isAtZero}
        isDead={isDead}
        isBloodied={isBloodied}
      />

      {/* Death Saves (always visible, urgent at zero) */}
      {!isDead && <PlayerSheetDeathSaves character={character} urgent={isAtZero} showRollButton={isAtZero} />}

      {/* Weapons & Attacks */}
      <div>
        <CombatSectionHeader label="Weapons &amp; Attacks" count={combatEntities.weapons.length} />
        {combatEntities.weapons.length === 0 ? (
          <div className="rounded-xl bg-obsidian-mid/40 border border-surface-700/20 p-4 text-center text-surface-500 text-xs">
            No weapons equipped. Visit the Items tab to equip weapons.
          </div>
        ) : (
          <div className="space-y-1">
            {combatEntities.weapons.map((weapon) => (
              <CombatWeaponCard key={weapon.id} entity={weapon} />
            ))}
          </div>
        )}
      </div>

      {/* Class Resources Tracker */}
      <ClassResourcesTracker
        resources={resources}
        onResourceChange={handleResourceChange}
        collapsible
        defaultOpen
      />

      {/* Prepared Spells (Combat Quick-Reference) */}
      {combatEntities.spells.length > 0 && (
        <div>
          <CombatSectionHeader label="Prepared Spells" count={combatEntities.spells.length} accentColor="bg-amber-500/40" />
          <div className="space-y-1">
            {combatEntities.spells.map((spell) => (
              <CombatSpellCard key={spell.id} entity={spell} showSource />
            ))}
          </div>
        </div>
      )}

      {/* Feats & Active Effects */}
      <div>
        <CombatSectionHeader label="Feats &amp; Effects" count={combatEntities.feats.length} accentColor="bg-violet-500/40">
          <button
            onClick={() => setShowFeatsManager(!showFeatsManager)}
            className={`ml-auto px-1.5 py-0.5 rounded text-[8px] font-semibold uppercase tracking-wider transition-all ${
              showFeatsManager
                ? "bg-gold-500/10 text-gold-400 border border-gold/20"
                : "bg-surface-700/20 text-surface-500 hover:bg-surface-700/30 border border-surface-700/20"
            }`}
          >
            {showFeatsManager ? "Close" : "Manage"}
          </button>
        </CombatSectionHeader>

        {showFeatsManager ? (
          <PlayerFeatsSection character={character} />
        ) : combatEntities.feats.length > 0 ? (
          <div className="space-y-1">
            {combatEntities.feats.map((feat) => (
              <CombatFeatCard key={feat.id} entity={feat} onToggle={handleFeatToggle} showSource />
            ))}
          </div>
        ) : (
          <div className="rounded-xl bg-obsidian-mid/40 border border-surface-700/20 p-4 text-center text-surface-500 text-xs">
            No active feats. Manage your feats to activate them.
          </div>
        )}
      </div>

      {/* Spell Slot Status */}
      {(() => {
        const slots = derived.spellcasting.spellSlots;
        const hasSlots =
          slots && Object.values(slots).some((s: any) => s?.max > 0);
        if (!hasSlots) return null;
        return (
          <SpellSlotStatus
            slots={slots!}
            spellcastingAbility={derived.spellcasting.spellcastingAbility}
            spellSaveDC={derived.spellcasting.spellSaveDC}
            spellAttackBonus={derived.spellcasting.spellAttackBonus}
            onCast={(level) => handleCastSpell(c, level)}
            onRestore={(level) => handleRestoreSlots(c, level as any)}
          />
        );
      })()}

      {/* Class Features */}
      <ClassFeatureList features={c.features} />

      {/* HP Management */}
      <HpKeypadSection
        character={character}
        hpRatio={hpRatio}
        hpColor={hpColor}
        hasTemp={hasTemp}
        onHpChange={onHpChange}
        onSetTempHp={onSetTempHp}
        onShortRest={() => setShowShortRestDialog(true)}
        onLongRest={() => setShowLongRestDialog(true)}
        onQuickRest={() => setShowRestSheet(true)}
      />

      {/* Conditions */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] uppercase tracking-widest font-black text-gold-500/60">Conditions</h3>
          <button
            onClick={() => setShowConditionManager(!showConditionManager)}
            className={`px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all duration-150 ${
              showConditionManager
                ? "bg-gold-500/10 text-gold-400 border border-gold/20"
                : "bg-white/[0.03] text-surface-500 border border-surface-700/20 hover:text-surface-300 hover:border-surface-600/30"
            }`}
          >
            {showConditionManager ? "\u2715 Close" : "\u2699 Manage"}
          </button>
        </div>
        {showConditionManager ? (
          <ConditionManager character={character} showModifiers />
        ) : (
          <PlayerSheetConditions character={character} />
        )}
      </div>

      {/* Character Stats Panel */}
      <div className="pt-3 border-t border-white/[0.04]">
        <PlayerSheetCharacterStats character={c} />
      </div>

      {/* Modals / Dialogs */}
      {showShortRestDialog && <ShortRestDialog character={character} onClose={() => setShowShortRestDialog(false)} />}
      {showLongRestDialog && <LongRestDialog character={character} onClose={() => setShowLongRestDialog(false)} />}
      {showRestSheet && <RestBreakdown character={character} onClose={() => setShowRestSheet(false)} initialMode="short" />}
    </div>
  );
}
