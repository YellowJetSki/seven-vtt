/**
 * STᚱ VTT — Player Sheet Combat Tab (Premium Tactical Hub)
 *
 * Comprehensive single-source combat reference with:
 * - **Combat Status Banner**: Condition-based with HP ratio visualization
 * - **Weapon Attack Cards**: Full stat block with ATK/DMG/Range/Properties
 * - **Death Saves**: Integrated at HP=0 with quick-record circles
 * - **Class Resource Gauges**: Color-coded bars with +/- controls
 * - **HP Management**: Damage/heal keypad with custom input + temp HP
 * - **Hit Dice Display**: Current/max with short-rest spending
 * - **Passive Senses**: 3-grid Perception/Investigation/Insight
 * - **Conditions**: Always-visible toggle badges
 * - **Short Rest**: Auto-heal + recharge short-rest resources
 *
 * Zero purple tokens — all gold/amber/rose/emerald/enhanced tokens.
 */

import { useMemo, useState, useCallback } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import { useCompendiumStore } from "@/stores/compendium/compendiumStore";
import type { PlayerCharacter, ClassResource, SpellLevel } from "@/types";
import { computeAllDerivations, getAbilityMod } from "@/lib/mechanics/character-derivations";
import { useHpMutations, useSpellSlotMutations } from "@/hooks/useCharacterMutations";
import { injectCombatEntities } from "@/lib/combat/entity-injector";
import CombatWeaponCard from "./CombatWeaponCard";
import CombatSpellCard from "./CombatSpellCard";
import CombatFeatCard from "./CombatFeatCard";
import PlayerFeatsSection from "./PlayerFeatsSection";
import ClassResourcesTracker from "./ClassResourcesTracker";
import SpellSlotStatus from "./SpellSlotStatus";
import PlayerSheetConditions from "./PlayerSheetConditions";
import PlayerSheetDeathSaves from "./PlayerSheetDeathSaves";
import PlayerSheetCharacterStats from "./PlayerSheetCharacterStats";
interface AttackEntry {
  name: string;
  atk: string;
  damage: string;
  notes?: string;
  isRanged?: boolean;
  isMelee?: boolean;
  range?: string;
  properties?: string[];
}

function buildWeaponAttacks(c: PlayerCharacter, derived: ReturnType<typeof computeAllDerivations>): AttackEntry[] {
  const attacks: AttackEntry[] = [];
  const dexMod = derived.abilityMods.dexterity;
  const strMod = derived.abilityMods.strength;
  const pb = derived.proficiencyBonus;

  for (const equip of c.equipment) {
    const isMelee = !!(equip.notes?.toLowerCase().includes("melee") ||
      equip.notes?.toLowerCase().includes("finesse") ||
      equip.notes?.toLowerCase().includes("versatile") ||
      equip.slot === "mainhand" || equip.slot === "offhand");
    const isRanged = !!(equip.notes?.toLowerCase().includes("range") ||
      equip.slot === "ranged" || equip.slot === "ammunition");
    const isFinesse = equip.notes?.toLowerCase().includes("finesse");
    const isThrown = equip.notes?.toLowerCase().includes("thrown");
    const isWeapon = isMelee || isRanged;

    if (!isWeapon) continue;

    const abilityMod = isRanged && !isThrown ? dexMod : isFinesse ? Math.max(strMod, dexMod) : strMod;
    const magicMatch = equip.item.match(/\+(\d+)/);
    const magicBonus = magicMatch ? parseInt(magicMatch[1], 10) : 0;
    const dmgTypes = ["slashing","piercing","bludgeoning","fire","cold","acid","lightning","radiant","necrotic","poison","force","psychic","thunder"];
    const dmgType = dmgTypes.find(t => equip.notes?.toLowerCase().includes(t)) || "slashing";
    const rangeMatch = equip.notes?.match(/range\s*(\d+)\/(\d+)/i) || equip.item.match(/range\s*(\d+)\/(\d+)/i);
    const rangeStr = rangeMatch ? `${rangeMatch[1]}/${rangeMatch[2]} ft` : isRanged ? "\u2014" : undefined;
    const atkBonus = abilityMod + pb + magicBonus;
    const dmgBonus = abilityMod + magicBonus;
    const dice = "1d8";
    const damageStr = `${dice}${dmgBonus >= 0 ? "+" : ""}${dmgBonus} ${dmgType}`;

    const props: string[] = [];
    if (equip.notes?.toLowerCase().includes("finesse")) props.push("Finesse");
    if (equip.notes?.toLowerCase().includes("light")) props.push("Light");
    if (equip.notes?.toLowerCase().includes("heavy")) props.push("Heavy");
    if (equip.notes?.toLowerCase().includes("reach")) props.push("Reach");
    if (equip.notes?.toLowerCase().includes("versatile")) props.push("Versatile");
    if (equip.notes?.toLowerCase().includes("two-handed")) props.push("Two-Handed");
    if (equip.notes?.toLowerCase().includes("thrown")) props.push("Thrown");
    if (isRanged && !isThrown) props.push("Ammunition");
    if (magicBonus > 0) props.push(`+${magicBonus} Magic`);

    attacks.push({
      name: equip.item,
      atk: `${atkBonus >= 0 ? "+" : ""}${atkBonus}`,
      damage: damageStr,
      isMelee,
      isRanged,
      range: rangeStr,
      properties: props.length > 0 ? props : undefined,
      notes: equip.notes?.replace(/range\s*\d+\/\d+/i, "").replace(/\+?\d+\s*(to\s*)?\s*(attack|damage)/gi, "").trim(),
    });
  }

  return attacks;
}

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
  const itemCatalog = compendiumState.items;
  const spellCatalog = compendiumState.spells;
  const featCatalog = compendiumState.feats;

  const combatEntities = useMemo(() => injectCombatEntities({
    character: c,
    derived: {
      proficiencyBonus: derived.proficiencyBonus,
      abilityMods: derived.abilityMods,
      spellSaveDC: derived.spellcasting.spellSaveDC,
      spellAttackBonus: derived.spellcasting.spellAttackBonus,
      spellcastingAbility: derived.spellcasting.spellcastingAbility,
    },
    itemCatalog,
    spellCatalog,
    featCatalog,
  }), [c, derived, itemCatalog, spellCatalog, featCatalog]);
  const [hpInput, setHpInput] = useState("");
  const [hpQuickMode, setHpQuickMode] = useState<"damage" | "heal">("damage");
  const [showFeatsManager, setShowFeatsManager] = useState(false);

  // ── Combat status ──
  const hpRatio = c.hitPoints.max > 0 ? c.hitPoints.current / c.hitPoints.max : 0;
  const isAtZero = c.hitPoints.current <= 0;
  const isDead = c.deathSaves.failures >= 3;
  const isBloodied = !isAtZero && hpRatio <= 0.5;
  const isHealthy = !isAtZero && hpRatio > 0.5;

  const combatStatus = useMemo(() => {
    if (isDead) return { label: "Dead", color: "text-red-400", bg: "bg-red-500/15 border-red-500/25", icon: "✕" };
    if (isAtZero) return { label: "Unconscious", color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/20", icon: "💤" };
    if (isBloodied) return { label: "Bloodied", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", icon: "⚔️" };
    return { label: "Healthy", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", icon: "🛡️" };
  }, [isDead, isAtZero, isBloodied]);

  const hpColor = hpRatio > 0.5 ? "bg-emerald-500" : hpRatio > 0.25 ? "bg-amber-500" : "bg-red-500";
  const hasTemp = (c.temporaryHitPoints || 0) > 0;

  // ── HP handlers ──
  const onHpChange = useCallback(
    (delta: number) => handleHpChange(c, delta),
    [c, handleHpChange]
  );

  const onHpInput = useCallback(() => {
    const val = parseInt(hpInput, 10);
    if (isNaN(val)) return;
    onHpChange(val);
    setHpInput("");
  }, [hpInput, onHpChange]);

  const handleTempHp = useCallback(
    (amount: number) => {
      handleSetTempHp(c, Math.max(0, (c.temporaryHitPoints || 0) + amount));
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
  const resources: ClassResource[] = useMemo(() => {
    const derivedResources: ClassResource[] = [];
    const features = c.features.map(f => typeof f === "string" ? f : f.name);

    if (features.some(f => f.toLowerCase().includes("rage"))) {
      const existing = c.resources?.find(r => r.name === "Rage");
      derivedResources.push({ name: "Rage", current: existing?.current ?? 2, max: existing?.max ?? 2, recharge: "long_rest" as const });
    }
    if (features.some(f => f.toLowerCase().includes("channel divinity") || f === "Channel Divinity")) {
      const existing = c.resources?.find(r => r.name === "Channel Divinity");
      derivedResources.push({ name: "Channel Divinity", current: existing?.current ?? 1, max: existing?.max ?? 1, recharge: "short_rest" as const });
    }
    if (features.some(f => f.toLowerCase().includes("action surge"))) {
      const existing = c.resources?.find(r => r.name === "Action Surge");
      derivedResources.push({ name: "Action Surge", current: existing?.current ?? 1, max: existing?.max ?? 1, recharge: "short_rest" as const });
    }
    if (features.some(f => f.toLowerCase().includes("second wind"))) {
      const existing = c.resources?.find(r => r.name === "Second Wind");
      derivedResources.push({ name: "Second Wind", current: existing?.current ?? 1, max: existing?.max ?? 1, recharge: "short_rest" as const });
    }
    if (features.some(f => f.toLowerCase().includes("wild shape"))) {
      const existing = c.resources?.find(r => r.name === "Wild Shape");
      derivedResources.push({ name: "Wild Shape", current: existing?.current ?? 2, max: existing?.max ?? 2, recharge: "short_rest" as const });
    }
    if (features.some(f => f.toLowerCase().includes("ki point") || f === "Ki")) {
      const existing = c.resources?.find(r => r.name === "Ki Points");
      derivedResources.push({ name: "Ki Points", current: existing?.current ?? 4, max: existing?.max ?? 4, recharge: "short_rest" as const });
    }
    if (features.some(f => f.toLowerCase().includes("bardic inspiration"))) {
      const existing = c.resources?.find(r => r.name === "Bardic Inspiration");
      derivedResources.push({ name: "Bardic Inspiration", current: existing?.current ?? 3, max: existing?.max ?? 3, recharge: "long_rest" as const });
    }
    if (features.some(f => f.toLowerCase().includes("sorcery point"))) {
      const existing = c.resources?.find(r => r.name === "Sorcery Points");
      derivedResources.push({ name: "Sorcery Points", current: existing?.current ?? 2, max: existing?.max ?? 2, recharge: "long_rest" as const });
    }
    return derivedResources;
  }, [c.features, c.resources]);

  const handleResourceChange = useCallback(
    (resName: string, delta: number) => {
      const resource = resources.find(r => r.name === resName);
      if (!resource) return;
      const newCurrent = Math.max(0, Math.min(resource.max, resource.current + delta));
      const updatedResources = [...(c.resources || [])];
      const idx = updatedResources.findIndex(r => r.name === resName);
      if (idx >= 0) {
        updatedResources[idx] = { ...updatedResources[idx], current: newCurrent };
      } else {
        updatedResources.push({ ...resource, current: newCurrent });
      }
      updateCharacter(c.id, { resources: updatedResources });
    },
    [c.id, c.resources, resources, updateCharacter]
  );

  // ── Passive scores ──
  const wisMod = derived.abilityMods.wisdom;
  const intMod = derived.abilityMods.intelligence;
  const pb = derived.proficiencyBonus;

  return (
    <div className="space-y-4 px-3 py-3">
      {/* ── COMBAT STATUS BANNER ── */}
      <div className={`rounded-xl border p-3 flex items-center justify-between transition-all duration-300 ${combatStatus.bg}`}>
        <div className="flex items-center gap-2.5">
          <span className="text-xl">{combatStatus.icon}</span>
          <div>
            <span className={`text-[10px] uppercase tracking-widest font-black ${combatStatus.color}`}>
              {combatStatus.label}
            </span>
            {!isDead && (
              <span className="text-[10px] text-surface-500 ml-2">
                {c.hitPoints.current}/{c.hitPoints.max} HP
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {isAtZero && !isDead && (
            <span className="text-[9px] text-rose-400/60 font-mono">
              DS {c.deathSaves.successes}/{c.deathSaves.failures}
            </span>
          )}
          {isBloodied && (
            <span className="px-1.5 py-0.5 rounded text-[9px] bg-amber-500/10 border border-amber-500/15 text-amber-400 font-semibold">
              Bloodied
            </span>
          )}
        </div>
      </div>

      {/* ── DEATH SAVES (always visible, expanded at zero) ── */}
      {!isDead && (
        <PlayerSheetDeathSaves
          character={character}
          urgent={isAtZero}
          showRollButton={isAtZero}
        />
      )}

      {/* ── WEAPONS & ATTACKS ── */}
      <div>
        <h3 className="text-[10px] uppercase tracking-widest font-black text-gold-500/60 mb-2 flex items-center gap-2">
          <span className="w-1 h-3 rounded-full bg-gold-500/40" />
          Weapons & Attacks
          {combatEntities.weapons.length > 0 && (
            <span className="text-[9px] font-normal text-surface-500">({combatEntities.weapons.length})</span>
          )}
        </h3>

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

      {/* ── CLASS RESOURCES TRACKER ── */}
      <ClassResourcesTracker
        resources={resources}
        onResourceChange={handleResourceChange}
        collapsible
        defaultOpen={true}
      />

      {/* ── SPELLS (COMBAT QUICK-REFERENCE) ── */}
      {combatEntities.spells.length > 0 && (
        <div>
          <h3 className="text-[10px] uppercase tracking-widest font-black text-gold-500/60 mb-2 flex items-center gap-2">
            <span className="w-1 h-3 rounded-full bg-amber-500/40" />
            Prepared Spells
            <span className="text-[9px] font-normal text-surface-500">({combatEntities.spells.length})</span>
          </h3>
          <div className="space-y-1">
            {combatEntities.spells.map((spell) => (
              <CombatSpellCard key={spell.id} entity={spell} showSource />
            ))}
          </div>
        </div>
      )}

      {/* ── FEATS & ACTIVE EFFECTS ── */}
      <div>
        <h3 className="text-[10px] uppercase tracking-widest font-black text-gold-500/60 mb-2 flex items-center gap-2">
          <span className="w-1 h-3 rounded-full bg-violet-500/40" />
          Feats &amp; Effects
          <span className="text-[9px] font-normal text-surface-500">({combatEntities.feats.length})</span>
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
        </h3>

        {showFeatsManager ? (
          <PlayerFeatsSection character={character} />
        ) : combatEntities.feats.length > 0 ? (
          <div className="space-y-1">
            {combatEntities.feats.map((feat) => (
              <CombatFeatCard
                key={feat.id}
                entity={feat}
                onToggle={handleFeatToggle}
                showSource
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl bg-obsidian-mid/40 border border-surface-700/20 p-4 text-center text-surface-500 text-xs">
            No active feats. Manage your feats to activate them.
          </div>
        )}
      </div>

      {/* ── SPELL SLOT STATUS ── */}
      {derived.spellcasting.spellSlots && (() => {
        const slots = derived.spellcasting.spellSlots;
        const hasSlots = slots && Object.values(slots).some((s: any) => s?.max > 0);
        if (!hasSlots) return null;
        return (
          <div className="mb-3">
            <SpellSlotStatus
              slots={derived.spellcasting.spellSlots}
              spellcastingAbility={derived.spellcasting.spellcastingAbility}
              spellSaveDC={derived.spellcasting.spellSaveDC}
              spellAttackBonus={derived.spellcasting.spellAttackBonus}
              onCast={(level) => handleCastSpell(c, level)}
              onRestore={(level) => handleRestoreSlots(c, level as any)}
            />
          </div>
        );
      })()}

      {/* ── CLASS FEATURES ── */}
      {c.features.length > 0 && (
        <div>
          <h3 className="text-[10px] uppercase tracking-widest font-black text-gold-500/60 mb-2 flex items-center gap-2">
            <span className="w-1 h-3 rounded-full bg-gold-500/40" />
            Features & Actions
            <span className="text-[9px] font-normal text-surface-500">({c.features.length})</span>
          </h3>
          <div className="space-y-1">
            {c.features.map((feat, idx) => {
              const featName = typeof feat === "string" ? feat : feat.name;
              const featDesc = typeof feat !== "string" && feat.description ? feat.description : "";
              return (
                <div key={`feat-${featName}-${idx}`} className="rounded-xl bg-obsidian-mid/40 border border-surface-700/20 p-3 hover:border-gold/10 transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-surface-200">{featName}</span>
                  </div>
                  {featDesc && <p className="text-[10px] text-surface-500 mt-1 leading-relaxed">{featDesc}</p>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── HP MANAGEMENT ── */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <h3 className="text-[10px] uppercase tracking-widest font-black text-gold-500/60 flex items-center gap-2">
            <span className="w-1 h-3 rounded-full bg-gold-500/40" />
            Hit Points
          </h3>
          <div className="flex items-center gap-1">
            <span className="text-lg font-black tabular-nums font-mono text-gold-300">{c.hitPoints.current}</span>
            <span className="text-xs text-surface-500 font-mono">/{c.hitPoints.max}</span>
            {hasTemp && <span className="text-[10px] text-amber-400 font-mono ml-1">+{c.temporaryHitPoints}</span>}
          </div>
        </div>

        {/* HP Bar */}
        <div className="h-4 bg-surface-700/60 rounded-full overflow-hidden relative shadow-inner">
          <div className={`h-full ${hpColor} rounded-full transition-all duration-500`} style={{ width: `${Math.max(0, hpRatio * 100)}%` }} />
          {hasTemp && (
            <div className="absolute top-0 h-full bg-amber-500/30 rounded-full" style={{
              left: `${Math.min(100, hpRatio * 100)}%`,
              width: `${Math.min(100 - hpRatio * 100, ((c.temporaryHitPoints || 0) / c.hitPoints.max) * 100)}%`,
            }} />
          )}
        </div>

        {/* Quick Damage/Heal Keypad */}
        <div className="flex items-center gap-1.5 mt-2">
          <button onClick={() => { setHpQuickMode("damage"); onHpChange(-10); }} className="flex-1 py-3.5 rounded-xl bg-red-500/15 border border-red-500/20 text-red-400 text-lg font-bold active:scale-95 transition-all duration-150 hover:bg-red-500/20">-10</button>
          <button onClick={() => { setHpQuickMode("damage"); onHpChange(-5); }} className="flex-1 py-3.5 rounded-xl bg-red-500/15 border border-red-500/20 text-red-400 text-lg font-bold active:scale-95 transition-all duration-150 hover:bg-red-500/20">-5</button>
          <button onClick={() => { setHpQuickMode("damage"); onHpChange(-1); }} className="flex-1 py-3.5 rounded-xl bg-rose-500/10 border border-rose-500/15 text-rose-400 text-lg font-bold active:scale-95 transition-all duration-150 hover:bg-rose-500/15">-1</button>
          <button onClick={() => { setHpQuickMode("heal"); onHpChange(1); }} className="flex-1 py-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/15 text-emerald-400 text-lg font-bold active:scale-95 transition-all duration-150 hover:bg-emerald-500/15">+1</button>
          <button onClick={() => { setHpQuickMode("heal"); onHpChange(5); }} className="flex-1 py-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 text-lg font-bold active:scale-95 transition-all duration-150 hover:bg-emerald-500/20">+5</button>
          <button onClick={() => { setHpQuickMode("heal"); onHpChange(10); }} className="flex-1 py-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 text-lg font-bold active:scale-95 transition-all duration-150 hover:bg-emerald-500/20">+10</button>
        </div>

        {/* Custom HP input */}
        <div className="flex items-center gap-2 mt-2">
          <input type="number" value={hpInput} onChange={(e) => setHpInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") onHpInput(); }}
            placeholder="Custom HP amount (+/-)"
            className="flex-1 py-3 px-3 text-sm bg-obsidian-mid/60 border border-surface-700/30 rounded-xl text-surface-200 placeholder:text-surface-500 focus:outline-none focus:border-gold/30 focus:ring-1 focus:ring-gold/20 transition-all" />
          <button onClick={onHpInput}
            className="px-5 py-3 bg-gold-500/10 border border-gold/20 text-gold-400 text-sm font-semibold rounded-xl active:scale-95 transition-all duration-150 hover:bg-gold-500/15">
            Apply
          </button>
        </div>

        {/* Temp HP */}
        <div className="mt-2 pt-2 border-t border-surface-700/20">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[9px] uppercase tracking-widest font-black text-gold-500/60">Temporary HP</span>
            <span className="text-xs font-mono text-gold-300 tabular-nums">{c.temporaryHitPoints || 0}</span>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {[1, 5, 10, 0].map((amount) => (
              <button
                key={`tmp-${amount}`}
                onClick={() => amount === 0 ? handleSetTempHp(c, 0) : handleSetTempHp(c, amount + (c.temporaryHitPoints || 0))}
                className={`py-2 rounded-lg text-xs font-bold active:scale-90 transition-all duration-150 ${
                  amount === 0
                    ? "bg-surface-800/40 border border-surface-700/30 text-surface-500 hover:border-surface-600/40"
                    : "bg-gold-500/8 border border-gold/15 text-gold-400 hover:bg-gold-500/12"
                }`}
              >
                {amount === 0 ? "Clear" : `+${amount} THP`}
              </button>
            ))}
          </div>
        </div>

        {/* Short Rest */}
        <button
          onClick={() => {
            const halfMax = Math.floor(c.hitPoints.max / 2);
            onHpChange(halfMax);
            for (const res of resources) {
              if (res.recharge === "short_rest") {
                handleResourceChange(res.name, res.max - res.current);
              }
            }
          }}
          className="w-full mt-2 py-2.5 rounded-xl bg-gold-500/8 border border-gold/15 text-gold-400 text-xs font-semibold active:scale-95 transition-all duration-150 hover:bg-gold-500/12"
        >
          🛏 Short Rest (heal ½ max HP + recharge short-rest resources)
        </button>
      </div>

      {/* ── CONDITIONS ── */}
      <PlayerSheetConditions character={character} />

      {/* ── CHARACTER STATS PANEL (PB, Init, AC, HP, Speed, HD, Senses) ── */}
      <div className="pt-3 border-t border-white/[0.04]">
        <PlayerSheetCharacterStats character={c} />
      </div>
    </div>
  );
}
