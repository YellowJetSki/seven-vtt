/* ── PlayerCharacterSheetPremium (v5 — Foundry-Level) ─────────
 * Premium redesign of the Player Character Sheet with Foundry VTT
 * information density. Features combat roundel, weapon attacks,
 * spell slots with gauges, passive scores, speed breakdown,
 * conditions, and glassmorphism cards.
 * ─────────────────────────────────────────────────────────────── */

import { useState, useMemo, useCallback } from "react";
import type { PlayerCharacter } from "@/types";
import { useCampaignStore } from "@/stores/campaignStore";
import { useUiStore } from "@/stores/uiStore";
import {
  PortraitSection,
  PrimaryStatsRow,
  HpBarSection,
  XpProgressSection,
  AbilityScoreGrid,
  SavingThrowsSection,
  SkillsSection,
  WeaponsSection,
  SpellcastingSection,
  ResourcesSection,
  InventorySection,
  CurrencySection,
  FeaturesSection,
  RestAndLevelSection,
  DeathSaveTrackerSection,
  BackstorySection,
  PassiveStats,
  SpeedBreakdown,
  ConditionsSection
} from "./premium-sheet";

interface Props {
  character: PlayerCharacter;
}

export function PlayerCharacterSheetPremium({ character }: Props) {
  const updateCharacter = useCampaignStore((s) => s.updateCharacter);
  const showToast = useUiStore((s) => s.showToast);

  const [showHpEditor, setShowHpEditor] = useState(false);
  const [showXpEditor, setShowXpEditor] = useState(false);
  const [showInventoryEditor, setShowInventoryEditor] = useState(false);
  const [showCurrencyEditor, setShowCurrencyEditor] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);

  const hpPercent = useMemo(() => {
    if (character.hitPoints.max <= 0) return 0;
    return (character.hitPoints.current / character.hitPoints.max) * 100;
  }, [character.hitPoints]);

  const handleShortRest = useCallback(() => {
    const healAmt = Math.floor(character.hitPoints.max * 0.25);
    const newHp = Math.min(character.hitPoints.max, character.hitPoints.current + healAmt);
    updateCharacter(character.id, {
      hitPoints: { ...character.hitPoints, current: newHp },
      updatedAt: Date.now()
    });
    const resources = character.resources ?? [];
    const updatedResources = resources.map((r: any) =>
      r.recharge === "short" ? { ...r, current: r.max } : r
    );
    if (updatedResources.length > 0) {
      updateCharacter(character.id, { resources: updatedResources, updatedAt: Date.now() });
    }
    showToast({ message: `Short rest! Healed ${healAmt} HP. Resources restored.`, type: "success" });
  }, [character, updateCharacter, showToast]);

  const handleLongRest = useCallback(() => {
    updateCharacter(character.id, {
      hitPoints: { ...character.hitPoints, current: character.hitPoints.max, temporary: 0 },
      updatedAt: Date.now()
    });
    const resources = character.resources ?? [];
    const updatedResources = resources.map((r: any) => ({ ...r, current: r.max }));
    if (updatedResources.length > 0) {
      updateCharacter(character.id, { resources: updatedResources, updatedAt: Date.now() });
    }
    showToast({ message: "Long rest! Fully healed. All resources restored.", type: "success" });
  }, [character, updateCharacter, showToast]);

  const weaponAttacks = useMemo(() => {
    return (character.equipment ?? [])
      .filter((e: any) => {
        const item = (e.item || "").toLowerCase();
        return item.includes("sword") || item.includes("axe") || item.includes("bow") ||
               item.includes("staff") || item.includes("dagger") || item.includes("mace") ||
               item.includes("spear") || item.includes("hammer") || item.includes("rapier") ||
               item.includes("scimitar") || item.includes("crossbow");
      })
      .map((e: any) => ({
        name: e.item,
        damage: e.notes?.includes("d") ? e.notes : "1d6",
        type: "slashing",
        attackBonus: (character.proficiencyBonus ?? 2) + Math.floor((character.strength - 10) / 2),
        ability: "STR"
      }));
  }, [character]);

  const conditions = character.conditions ?? [];

  return (
    <div className="mx-auto max-w-3xl space-y-4 pb-12">
      {/* Top Section: Portrait + Primary Stats + HP */}
      <div className="grid grid-cols-[auto_1fr] gap-4">
        <PortraitSection character={character} />
        <div className="space-y-3">
          <PrimaryStatsRow character={character} />
          <HpBarSection
            character={character}
            hpPercent={hpPercent}
            onEditHp={() => setShowHpEditor(true)}
          />
        </div>
      </div>

      {/* Passive Stats + Speed + Conditions */}
      <div className="grid grid-cols-3 gap-3">
        <PassiveStats character={character} />
        <SpeedBreakdown character={character} />
        <ConditionsSection conditions={conditions} />
      </div>

      {/* XP Progress */}
      <XpProgressSection character={character} onEditXp={() => setShowXpEditor(true)} />

      {/* Core Stats Grid */}
      <AbilityScoreGrid character={character} />

      {/* Saving Throws + Skills */}
      <div className="grid gap-4 md:grid-cols-2">
        <SavingThrowsSection character={character} />
        <SkillsSection character={character} />
      </div>

      {/* Weapons */}
      <WeaponsSection weapons={weaponAttacks} />

      {/* Spellcasting */}
      <SpellcastingSection character={character} />

      {/* Resources */}
      <ResourcesSection character={character} />

      {/* Inventory + Currency */}
      <div className="grid gap-4 md:grid-cols-2">
        <InventorySection
          character={character}
          onEdit={() => setShowInventoryEditor(true)}
        />
        <CurrencySection
          character={character}
          onEdit={() => setShowCurrencyEditor(true)}
        />
      </div>

      {/* Features */}
      <FeaturesSection character={character} />

      {/* Death Saves — only when downed */}
      {character.hitPoints.current <= 0 && (
        <DeathSaveTrackerSection character={character} />
      )}

      {/* Rest & Level */}
      <RestAndLevelSection
        onShortRest={handleShortRest}
        onLongRest={handleLongRest}
        onLevelUp={() => setShowLevelUp(true)}
      />

      {/* Backstory */}
      {character.backstory && <BackstorySection character={character} />}

      {/* Modals */}
      {showHpEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowHpEditor(false)}>
          <div className="w-full max-w-sm rounded-xl border border-surface-700 bg-surface-850 p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-semibold text-surface-100 mb-3">Edit Hit Points</h3>
            <div className="space-y-2">
              <div>
                <label className="text-xs text-surface-400">Current HP</label>
                <input type="number" defaultValue={character.hitPoints.current}
                  className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100" id="hp-current" />
              </div>
              <div>
                <label className="text-xs text-surface-400">Max HP</label>
                <input type="number" defaultValue={character.hitPoints.max}
                  className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100" id="hp-max" />
              </div>
              <div>
                <label className="text-xs text-surface-400">Temp HP</label>
                <input type="number" defaultValue={character.hitPoints.temporary}
                  className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100" id="hp-temp" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setShowHpEditor(false)} className="rounded-lg px-3 py-1.5 text-xs text-surface-400 hover:text-surface-200">Cancel</button>
              <button onClick={() => {
                const c = parseInt((document.getElementById("hp-current") as HTMLInputElement)?.value || "0");
                const m = parseInt((document.getElementById("hp-max") as HTMLInputElement)?.value || "1");
                const t = parseInt((document.getElementById("hp-temp") as HTMLInputElement)?.value || "0");
                updateCharacter(character.id, {
                  hitPoints: { current: c, max: m, temporary: t },
                  updatedAt: Date.now()
                });
                setShowHpEditor(false);
                showToast({ message: "HP updated", type: "success" });
              }} className="rounded-lg bg-accent-600 px-3 py-1.5 text-xs text-white hover:bg-accent-500">Save</button>
            </div>
          </div>
        </div>
      )}

      {showXpEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowXpEditor(false)}>
          <div className="w-full max-w-sm rounded-xl border border-surface-700 bg-surface-850 p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-semibold text-surface-100 mb-3">Edit XP</h3>
            <input type="number" defaultValue={character.experiencePoints ?? 0}
              className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100" id="xp-value" />
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setShowXpEditor(false)} className="rounded-lg px-3 py-1.5 text-xs text-surface-400 hover:text-surface-200">Cancel</button>
              <button onClick={() => {
                const v = parseInt((document.getElementById("xp-value") as HTMLInputElement)?.value || "0");
                updateCharacter(character.id, { experiencePoints: v, updatedAt: Date.now() });
                setShowXpEditor(false);
                showToast({ message: "XP updated", type: "success" });
              }} className="rounded-lg bg-accent-600 px-3 py-1.5 text-xs text-white hover:bg-accent-500">Save</button>
            </div>
          </div>
        </div>
      )}

      {showInventoryEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowInventoryEditor(false)}>
          <div className="w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-xl border border-surface-700 bg-surface-850 p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-semibold text-surface-100 mb-3">Edit Inventory</h3>
            <div className="space-y-2">
              {character.equipment.map((item: any, i: number) => (
                <div key={i} className="flex items-center gap-2 rounded-lg bg-surface-800 p-2">
                  <input defaultValue={item.item} className="flex-1 rounded bg-surface-700 px-2 py-1 text-xs text-surface-100" data-inv-name={i} />
                  <input type="number" defaultValue={item.quantity} className="w-16 rounded bg-surface-700 px-2 py-1 text-xs text-surface-100 text-center" data-inv-qty={i} />
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setShowInventoryEditor(false)} className="rounded-lg px-3 py-1.5 text-xs text-surface-400">Cancel</button>
              <button onClick={() => {
                const items = character.equipment.map((item: any, i: number) => ({
                  ...item,
                  item: (document.querySelector(`[data-inv-name="${i}"]`) as HTMLInputElement)?.value || item.item,
                  quantity: parseInt((document.querySelector(`[data-inv-qty="${i}"]`) as HTMLInputElement)?.value || "1")
                }));
                updateCharacter(character.id, { equipment: items, updatedAt: Date.now() });
                setShowInventoryEditor(false);
                showToast({ message: "Inventory updated", type: "success" });
              }} className="rounded-lg bg-accent-600 px-3 py-1.5 text-xs text-white hover:bg-accent-500">Save</button>
            </div>
          </div>
        </div>
      )}

      {showCurrencyEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowCurrencyEditor(false)}>
          <div className="w-full max-w-sm rounded-xl border border-surface-700 bg-surface-850 p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-semibold text-surface-100 mb-3">Edit Currency</h3>
            <div className="space-y-2">
              {[["PP", "platinum", "amber"], ["GP", "gold", "amber"], ["EP", "electrum", "surface"], ["SP", "silver", "surface"], ["CP", "copper", "surface"]].map(([label, key, color]) => (
                <div key={key} className="flex items-center gap-2">
                  <span className={`w-8 text-xs font-bold text-${color === "amber" ? "amber-300" : "surface-400"}`}>{label}</span>
                  <input type="number" defaultValue={(character.currency as any)?.[key] ?? 0}
                    className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-1.5 text-sm text-surface-100"
                    data-currency={key} />
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setShowCurrencyEditor(false)} className="rounded-lg px-3 py-1.5 text-xs text-surface-400">Cancel</button>
              <button onClick={() => {
                const currency = {
                  copper: parseInt((document.querySelector('[data-currency="copper"]') as HTMLInputElement)?.value || "0"),
                  silver: parseInt((document.querySelector('[data-currency="silver"]') as HTMLInputElement)?.value || "0"),
                  electrum: parseInt((document.querySelector('[data-currency="electrum"]') as HTMLInputElement)?.value || "0"),
                  gold: parseInt((document.querySelector('[data-currency="gold"]') as HTMLInputElement)?.value || "0"),
                  platinum: parseInt((document.querySelector('[data-currency="platinum"]') as HTMLInputElement)?.value || "0"),
                };
                updateCharacter(character.id, { currency, updatedAt: Date.now() });
                setShowCurrencyEditor(false);
                showToast({ message: "Currency updated", type: "success" });
              }} className="rounded-lg bg-accent-600 px-3 py-1.5 text-xs text-white hover:bg-accent-500">Save</button>
            </div>
          </div>
        </div>
      )}

      {showLevelUp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowLevelUp(false)}>
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-surface-700 bg-surface-850 p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-surface-100">Level Up</h3>
              <button onClick={() => setShowLevelUp(false)} className="text-surface-500 hover:text-surface-300">✕</button>
            </div>
            <p className="text-xs text-surface-400">Level up from level {character.level} to level {character.level + 1}</p>
            <button onClick={() => {
              updateCharacter(character.id, {
                level: character.level + 1,
                updatedAt: Date.now()
              });
              setShowLevelUp(false);
              showToast({ message: `${character.name} is now level ${character.level + 1}!`, type: "success" });
            }} className="mt-4 w-full rounded-lg bg-accent-600 px-3 py-2 text-xs text-white hover:bg-accent-500">
              Confirm Level Up
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
