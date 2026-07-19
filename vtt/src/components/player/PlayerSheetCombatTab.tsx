/**
 * STᚱ VTT — Player Sheet Combat Tab
 *
 * Shows all combat-relevant data: weapon attacks, class features,
 * temp HP, hit dice, conditions, passive senses.
 *
 * Spells are handled in the Spells tab — this tab focuses on
 * martial and feature-based combat actions only.
 *
 * Canonical D&D 5e combat layout:
 *   ┌─ Weapons & Attacks ───────────────────────────────┐
 *   │ Name          │ ATK    │ Damage / Type            │
 *   │ Longsword +1  │ +8    │ 1d8+4 slashing           │
 *   │ Javelin       │ +6    │ 1d6+3 piercing           │
 *   └────────────────────────────────────────────────────┘
 *   ┌─ Features & Actions ──────────────────────────────┐
 *   │ Divine Smite  │ 2d8 radiant vs fiends/undead      │
 *   └────────────────────────────────────────────────────┘
 *   ┌─ Temp HP | Hit Dice | Conditions | Passive Senses ┐
 */

import { useMemo, useState, useCallback } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import type { PlayerCharacter } from "@/types";
import { computeAllDerivations } from "@/lib/mechanics/character-derivations";
import PlayerSheetConditions from "./PlayerSheetConditions";

// ── Attack entry type ──────────────────────────────────────

interface AttackEntry {
  name: string;
  atk: string;         // e.g. "+8"
  damage: string;      // e.g. "1d8+4 slashing"
  notes?: string;
  isRanged?: boolean;
  isMelee?: boolean;
  range?: string;
  properties?: string[];
}

// ── Weapon attack builder (spells excluded) ────────────────

function buildWeaponAttacks(c: PlayerCharacter, derived: ReturnType<typeof computeAllDerivations>): AttackEntry[] {
  const attacks: AttackEntry[] = [];
  const dexMod = derived.abilityMods.dexterity;
  const strMod = derived.abilityMods.strength;
  const pb = derived.proficiencyBonus;

  for (const equip of c.equipment) {
    const isMelee = !!(equip.notes?.toLowerCase().includes("melee") || equip.notes?.toLowerCase().includes("finesse") || equip.notes?.toLowerCase().includes("versatile") || equip.slot === "mainhand" || equip.slot === "offhand");
    const isRanged = !!(equip.notes?.toLowerCase().includes("range") || equip.slot === "ranged" || equip.slot === "ammunition");
    const isFinesse = equip.notes?.toLowerCase().includes("finesse");
    const isThrown = equip.notes?.toLowerCase().includes("thrown");
    const isWeapon = isMelee || isRanged;

    if (!isWeapon) continue;

    const abilityMod = isRanged && !isThrown ? dexMod : isFinesse ? Math.max(strMod, dexMod) : strMod;
    const magicMatch = equip.item.match(/\+(\d+)/);
    const magicBonus = magicMatch ? parseInt(magicMatch[1], 10) : 0;
    const dmgTypes = ["slashing", "piercing", "bludgeoning", "fire", "cold", "acid", "lightning", "radiant", "necrotic", "poison", "force", "psychic", "thunder"];
    const dmgType = dmgTypes.find(t => equip.notes?.toLowerCase().includes(t)) || "slashing";
    const rangeMatch = equip.notes?.match(/range\s*(\d+)\/(\d+)/i) || equip.item.match(/range\s*(\d+)\/(\d+)/i);
    const rangeStr = rangeMatch ? `${rangeMatch[1]}/${rangeMatch[2]} ft` : isRanged ? "—" : undefined;
    const atkBonus = abilityMod + pb + magicBonus;
    const dmgBonus = abilityMod + magicBonus;
    const isTwoHanded = equip.notes?.toLowerCase().includes("two-handed") || equip.notes?.toLowerCase().includes("versatile");
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

// ── Main component ─────────────────────────────────────────

interface PlayerSheetCombatTabProps {
  character: PlayerCharacter;
}

export default function PlayerSheetCombatTab({ character }: PlayerSheetCombatTabProps) {
  const c = character;
  const updateCharacter = useCampaignStore((s) => s.updateCharacter);
  const derived = useMemo(() => computeAllDerivations(c), [c]);

  const weaponAttacks = useMemo(() => buildWeaponAttacks(c, derived), [c, derived]);

  const handleTempHp = useCallback(
    (amount: number) => {
      updateCharacter(c.id, { temporaryHitPoints: Math.max(0, (c.temporaryHitPoints || 0) + amount) });
    },
    [c, updateCharacter]
  );

  // Passive scores
  const wisMod = derived.abilityMods.wisdom;
  const intMod = derived.abilityMods.intelligence;
  const pb = derived.proficiencyBonus;
  const passivePP = 10 + wisMod + (c.skills?.perception === "proficient" ? pb : c.skills?.perception === "expertise" ? pb * 2 : 0);
  const passivePI = 10 + intMod + (c.skills?.investigation === "proficient" ? pb : c.skills?.investigation === "expertise" ? pb * 2 : 0);
  const passivePS = 10 + wisMod + (c.skills?.insight === "proficient" ? pb : c.skills?.insight === "expertise" ? pb * 2 : 0);

  return (
    <div className="space-y-4 px-3 py-3">
      {/* ── WEAPONS & ATTACKS (spells excluded — see Spells tab) ── */}
      <div>
        <h3 className="text-[10px] uppercase tracking-widest font-black text-gold-500/60 mb-2 flex items-center gap-2">
          <span className="w-1 h-3 rounded-full bg-gold-500/40" />
          Weapons & Attacks
        </h3>

        {weaponAttacks.length === 0 ? (
          <div className="rounded-xl bg-obsidian-mid/40 border border-surface-700/20 p-4 text-center text-surface-500 text-xs">
            No weapons equipped. Visit the Items tab to equip weapons.
          </div>
        ) : (
          <div className="space-y-1">
            {weaponAttacks.map((attack, idx) => (
              <div
                key={`${attack.name}-${idx}`}
                className="rounded-xl bg-obsidian-mid/40 border border-surface-700/20 p-3 hover:border-gold/10 transition-all duration-200"
              >
                {/* Top row: Name + Type Badge */}
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-sm font-bold text-surface-200 truncate">{attack.name}</span>
                    <span className="shrink-0 text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/15 text-red-400">Weapon</span>
                    {attack.isRanged && (
                      <span className="shrink-0 text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/15 text-cyan-400">Ranged</span>
                    )}
                    {attack.isMelee && (
                      <span className="shrink-0 text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-orange-500/10 border border-orange-500/15 text-orange-400">Melee</span>
                    )}
                  </div>
                </div>

                {/* Stats row: ATK | Damage */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] uppercase tracking-wider text-surface-500 font-semibold">ATK</span>
                    <span className="text-base font-black tabular-nums font-mono text-gold-300">{attack.atk}</span>
                  </div>
                  <div className="flex items-center gap-1.5 justify-end">
                    <span className="text-[9px] uppercase tracking-wider text-surface-500 font-semibold">DMG</span>
                    <span className="text-sm font-bold tabular-nums font-mono text-surface-200 truncate">{attack.damage}</span>
                  </div>
                </div>

                {/* Bottom details */}
                <div className="flex items-center gap-2 flex-wrap mt-1.5">
                  {attack.range && (
                    <span className="text-[9px] text-surface-500">Range: {attack.range}</span>
                  )}
                  {attack.properties && attack.properties.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {attack.properties.map((prop) => (
                        <span key={prop} className="text-[8px] px-1 py-0.5 rounded bg-surface-700/30 text-surface-400 uppercase tracking-wider">{prop}</span>
                      ))}
                    </div>
                  )}
                  {attack.notes && (
                    <span className="text-[9px] text-surface-500 italic">{attack.notes}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── CLASS FEATURES (combat-relevant actions) ── */}
      {c.features.length > 0 && (
        <div>
          <h3 className="text-[10px] uppercase tracking-widest font-black text-gold-500/60 mb-2 flex items-center gap-2">
            <span className="w-1 h-3 rounded-full bg-gold-500/40" />
            Features & Actions
          </h3>
          <div className="space-y-1">
            {c.features.map((feat, idx) => {
              const featName = typeof feat === "string" ? feat : feat.name;
              const featDesc = typeof feat !== "string" && feat.description ? feat.description : "";
              return (
                <div
                  key={`feat-${featName}-${idx}`}
                  className="rounded-xl bg-obsidian-mid/40 border border-surface-700/20 p-3 hover:border-gold/10 transition-all duration-200"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-surface-200">{featName}</span>
                  </div>
                  {featDesc && (
                    <p className="text-[10px] text-surface-500 mt-1 leading-relaxed">{featDesc}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TEMP HP ── */}
      <div className="flex items-center justify-between rounded-xl bg-obsidian-mid/40 border border-surface-700/20 p-3 hover:border-gold/10 transition-all duration-200">
        <span className="text-[10px] uppercase tracking-widest font-black text-gold-500/60 flex items-center gap-1.5">
          <span>🛡</span> Temporary HP
        </span>
        <div className="flex items-center gap-2">
          <button onClick={() => handleTempHp(-5)}
            className="px-2.5 py-1 rounded-lg bg-obsidian-mid/60 border border-surface-700/20 text-surface-400 text-xs active:scale-90 transition-all duration-150 hover:border-gold/20 hover:text-gold-300"
          >−5</button>
          <span className="text-sm font-mono font-bold text-gold-400 w-8 text-center tabular-nums">{c.temporaryHitPoints || 0}</span>
          <button onClick={() => handleTempHp(5)}
            className="px-2.5 py-1 rounded-lg bg-gold-500/10 border border-gold/15 text-gold-400 text-xs active:scale-90 transition-all duration-150 hover:bg-gold-500/15"
          >+5</button>
        </div>
      </div>

      {/* ── CONDITIONS ── */}
      <PlayerSheetConditions character={character} />

      {/* ── HIT DICE ── */}
      <div className="flex items-center justify-between rounded-xl bg-obsidian-mid/40 border border-surface-700/20 p-3 hover:border-gold/10 transition-all duration-200">
        <span className="text-[10px] uppercase tracking-widest font-black text-gold-500/60 flex items-center gap-1.5">
          <span>🎲</span> Hit Dice
        </span>
        <span className="text-sm font-mono font-bold tabular-nums text-gold-300">{c.hitDice}</span>
      </div>

      {/* ── PASSIVE SKILLS ── */}
      <div>
        <h3 className="text-[10px] uppercase tracking-widest font-black text-gold-500/60 mb-2 flex items-center gap-2">
          <span className="w-1 h-3 rounded-full bg-gold-500/40" />
          Passive Senses
        </h3>
        <div className="grid grid-cols-3 gap-1.5">
          <div className="flex flex-col items-center px-2 py-2 rounded-lg bg-obsidian-mid/40 border border-surface-700/10">
            <span className="text-[8px] uppercase tracking-widest text-gold-500/50">Perception</span>
            <span className="text-base font-bold tabular-nums text-cyan-300">{passivePP}</span>
          </div>
          <div className="flex flex-col items-center px-2 py-2 rounded-lg bg-obsidian-mid/40 border border-surface-700/10">
            <span className="text-[8px] uppercase tracking-widest text-gold-500/50">Investigation</span>
            <span className="text-base font-bold tabular-nums text-mage-300">{passivePI}</span>
          </div>
          <div className="flex flex-col items-center px-2 py-2 rounded-lg bg-obsidian-mid/40 border border-surface-700/10">
            <span className="text-[8px] uppercase tracking-widest text-gold-500/50">Insight</span>
            <span className="text-base font-bold tabular-nums text-gold-300">{passivePS}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
