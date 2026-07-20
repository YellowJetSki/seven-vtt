/**
 * STᚱ VTT — DM NPC Quick-Create Popover (Sprint 28)
 *
 * A globally accessible floating popover for instantly creating NPCs/monsters
 * and injecting them directly into the active combat encounter — from ANY page.
 *
 * Features:
 *   - Full statblock builder: name, type, size, CR (auto-AC/HP), 6 abilities
 *   - Standard Array preset for ability scores
 *   - Structured attack manager (add name, bonus, damage dice, type)
 *   - Auto-computed AC/HP from CR selection
 *   - One-click "Create & Add to Combat" — writes to campaign store + combat store
 *   - Live preview card during creation
 *   - Premium glass gold styling
 *
 * DM Workflow:
 *   "The wizard summons a Shield Guardian!"
 *   Open sidebar → NPC Quick Create → fills name, CR, one attack
 *   → "Create & Add to Combat" → Guardian appears in initiative tracker
 *   Total time: ~15 seconds
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import { useCombatStore } from "@/stores/combatStore";
import type { EnemyDoc, CreatureType, CreatureSize, EnemyAttack, AbilityScores } from "@/types/enemy";
import type { Combatant } from "@/types/combat";

// ── Constants ──

const CREATURE_TYPES: CreatureType[] = [
  "Aberration", "Beast", "Celestial", "Construct", "Dragon",
  "Elemental", "Fey", "Fiend", "Giant", "Humanoid",
  "Monstrosity", "Ooze", "Plant", "Undead", "Custom",
];

const SIZES: CreatureSize[] = ["Tiny", "Small", "Medium", "Large", "Huge", "Gargantuan"];

const CR_OPTIONS: { value: number; label: string }[] = [
  { value: 0, label: "0" },
  { value: 0.125, label: "1/8" },
  { value: 0.25, label: "1/4" },
  { value: 0.5, label: "1/2" },
  { value: 1, label: "1" },
  { value: 2, label: "2" },
  { value: 3, label: "3" },
  { value: 4, label: "4" },
  { value: 5, label: "5" },
  { value: 6, label: "6" },
  { value: 7, label: "7" },
  { value: 8, label: "8" },
  { value: 9, label: "9" },
  { value: 10, label: "10" },
  { value: 12, label: "12" },
  { value: 14, label: "14" },
  { value: 16, label: "16" },
  { value: 18, label: "18" },
  { value: 20, label: "20" },
];

const DAMAGE_TYPES = [
  "acid", "bludgeoning", "cold", "fire", "force", "lightning",
  "necrotic", "piercing", "poison", "psychic", "radiant", "slashing", "thunder",
];

const ABILITY_KEYS: (keyof AbilityScores)[] = [
  "strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma",
];

const ABILITY_LABELS: Record<string, string> = {
  strength: "STR", dexterity: "DEX", constitution: "CON",
  intelligence: "INT", wisdom: "WIS", charisma: "CHA",
};

function crToAvgHp(cr: number): number {
  if (cr <= 0) return 8;
  if (cr <= 0.125) return 10;
  if (cr <= 0.25) return 12;
  if (cr <= 0.5) return 15;
  if (cr <= 1) return 30;
  if (cr <= 2) return 45;
  if (cr <= 3) return 65;
  if (cr <= 4) return 80;
  if (cr <= 5) return 100;
  if (cr <= 6) return 115;
  if (cr <= 7) return 135;
  if (cr <= 8) return 155;
  if (cr <= 9) return 175;
  if (cr <= 10) return 195;
  if (cr <= 12) return 235;
  if (cr <= 14) return 275;
  if (cr <= 16) return 330;
  if (cr <= 18) return 380;
  return 450;
}

function crToAvgAc(cr: number): number {
  if (cr <= 0) return 10;
  if (cr <= 0.125) return 11;
  if (cr <= 0.25) return 12;
  if (cr <= 0.5) return 12;
  if (cr <= 1) return 13;
  if (cr <= 2) return 13;
  if (cr <= 3) return 14;
  if (cr <= 4) return 14;
  if (cr <= 5) return 15;
  if (cr <= 6) return 15;
  if (cr <= 7) return 15;
  if (cr <= 8) return 16;
  if (cr <= 9) return 16;
  if (cr <= 10) return 17;
  if (cr <= 12) return 17;
  if (cr <= 14) return 18;
  if (cr <= 16) return 18;
  if (cr <= 18) return 19;
  return 20;
}

function getMod(score: number): string {
  const m = Math.floor((score - 10) / 2);
  return m >= 0 ? "+" + m : String(m);
}

function getCrXp(cr: number): number {
  if (cr <= 0) return 10;
  if (cr <= 0.125) return 25;
  if (cr <= 0.25) return 50;
  if (cr <= 0.5) return 100;
  if (cr <= 1) return 200;
  if (cr <= 2) return 450;
  if (cr <= 3) return 700;
  if (cr <= 4) return 1100;
  if (cr <= 5) return 1800;
  if (cr <= 6) return 2300;
  if (cr <= 7) return 2900;
  if (cr <= 8) return 3900;
  if (cr <= 9) return 5000;
  if (cr <= 10) return 5900;
  if (cr <= 11) return 7200;
  if (cr <= 12) return 8400;
  if (cr <= 13) return 10000;
  if (cr <= 14) return 11500;
  if (cr <= 15) return 13000;
  if (cr <= 16) return 15000;
  if (cr <= 17) return 18000;
  if (cr <= 18) return 20000;
  if (cr <= 19) return 22000;
  if (cr <= 20) return 25000;
  return 0;
}

// ── Props ──

interface DmNpcQuickCreatePopoverProps {
  isOpen: boolean;
  onClose: () => void;
}

// ── Component ──

export default function DmNpcQuickCreatePopover({ isOpen, onClose }: DmNpcQuickCreatePopoverProps) {
  const enemies = useCampaignStore((s) => s.enemies);
  const setEnemies = useCampaignStore((s) => s.setEnemies);
  const activeEncounter = useCombatStore((s) => s.activeEncounter);
  const setEncounter = useCombatStore((s) => s.setEncounter);

  // ── Form State ──
  const [name, setName] = useState("");
  const [creatureType, setCreatureType] = useState<CreatureType>("Humanoid");
  const [size, setSize] = useState<CreatureSize>("Medium");
  const [cr, setCr] = useState(1);
  const [ac, setAc] = useState(crToAvgAc(1));
  const [hp, setHp] = useState(crToAvgHp(1));
  const [abilities, setAbilities] = useState<AbilityScores>({
    strength: 10, dexterity: 10, constitution: 10,
    intelligence: 10, wisdom: 10, charisma: 10,
  });
  const [attacks, setAttacks] = useState<EnemyAttack[]>([]);
  const [newAttackName, setNewAttackName] = useState("");
  const [newAttackBonus, setNewAttackBonus] = useState("");
  const [newAttackDice, setNewAttackDice] = useState("");
  const [newAttackType, setNewAttackType] = useState("slashing");
  const [newAttackMelee, setNewAttackMelee] = useState(true);
  const [newAttackRange, setNewAttackRange] = useState("5 ft");
  const [flashMessage, setFlashMessage] = useState<{ text: string; type: "success" | "info" | "warning" } | null>(null);
  const flashTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showFlash = useCallback((text: string, type: "success" | "info" | "warning" = "success") => {
    if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
    setFlashMessage({ text, type });
    flashTimeoutRef.current = setTimeout(() => setFlashMessage(null), 2000);
  }, []);

  const handleCrChange = useCallback((newCr: number) => {
    setCr(newCr);
    setAc(crToAvgAc(newCr));
    setHp(crToAvgHp(newCr));
  }, []);

  const handleStandardArray = useCallback(() => {
    setAbilities({
      strength: 15, dexterity: 14, constitution: 13,
      intelligence: 12, wisdom: 10, charisma: 8,
    });
    showFlash("Applied Standard Array", "info");
  }, [showFlash]);

  const handleAddAttack = useCallback(() => {
    if (!newAttackName.trim()) return;
    const atk: EnemyAttack = {
      id: "atk_" + Date.now(),
      name: newAttackName.trim(),
      attackBonus: parseInt(newAttackBonus) || 0,
      damageDice: newAttackDice.trim() || "1d4",
      damageType: newAttackType,
      isMelee: newAttackMelee,
      isRanged: !newAttackMelee,
      range: newAttackRange,
      properties: [],
    };
    setAttacks((prev) => [...prev, atk]);
    setNewAttackName("");
    setNewAttackBonus("");
    setNewAttackDice("");
    setNewAttackType("slashing");
    setNewAttackMelee(true);
    setNewAttackRange("5 ft");
    showFlash("Attack added", "info");
  }, [newAttackName, newAttackBonus, newAttackDice, newAttackType, newAttackMelee, newAttackRange, showFlash]);

  const handleRemoveAttack = useCallback((id: string) => {
    setAttacks((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const handleCreateAndAdd = useCallback(() => {
    if (!name.trim()) {
      showFlash("NPC name is required", "warning");
      return;
    }

    const enemyId = "npc_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6);

    const newEnemy: EnemyDoc = {
      id: enemyId,
      name: name.trim(),
      type: creatureType,
      size,
      armorClass: ac,
      hitPoints: { current: hp, max: hp, temporary: 0 },
      speed: size === "Tiny" ? 20 : size === "Small" ? 25 : size === "Large" ? 40 : size === "Huge" ? 50 : size === "Gargantuan" ? 60 : 30,
      abilities: { ...abilities },
      challengeRating: cr,
      attacks: attacks.length > 0 ? attacks : undefined,
      damageResistances: [],
      damageImmunities: [],
      damageVulnerabilities: [],
      conditionImmunities: [],
      savingThrows: {},
      skills: {},
      senses: "",
      languages: "",
      traits: "",
      actions: "",
      reactions: "",
      specialAbilities: "",
      legendaryActions: "",
      isHomebrew: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      imageUrl: undefined,
    };

    // Write to campaign store (auto-syncs to Firestore)
    setEnemies([...enemies, newEnemy]);

    // If active encounter exists, add combatant
    if (activeEncounter) {
      const newCombatant: Combatant = {
        id: enemyId,
        name: newEnemy.name,
        type: "enemy",
        initiative: 0,
        armorClass: newEnemy.armorClass,
        hitPoints: {
          current: newEnemy.hitPoints.current,
          max: newEnemy.hitPoints.max,
          temporary: 0,
        },
        statusEffects: [],
        isDead: false,
        isConcentrating: false,
        notes: "",
      };
      setEncounter({
        ...activeEncounter,
        combatants: [...activeEncounter.combatants, newCombatant],
      });
      showFlash("Created & added " + newEnemy.name + " to combat", "success");
    } else {
      showFlash("Created " + newEnemy.name + ". Open Encounters to add to combat.", "success");
    }

    // Reset form
    setName("");
    setCr(1);
    setAc(crToAvgAc(1));
    setHp(crToAvgHp(1));
    setAbilities({ strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 });
    setAttacks([]);
  }, [name, creatureType, size, ac, hp, abilities, attacks, enemies, activeEncounter, setEnemies, setEncounter, showFlash]);

  useEffect(() => {
    return () => {
      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
    };
  }, []);

  const previewAtkStr = attacks.length > 0
    ? attacks[0].name + " +" + attacks[0].attackBonus + " (" + attacks[0].damageDice + " " + attacks[0].damageType + ")"
    : "No attacks";

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
        onClick={onClose}
      >
        <div
          className="pointer-events-auto w-full max-w-[520px] max-h-[90vh] overflow-hidden flex flex-col"
          style={{ animation: "modal-card-enter 0.35s cubic-bezier(0.16,1,0.3,1) both" }}
        >
          <div
            className="relative bg-gradient-to-b from-[#14151f]/95 to-[#0f1019]/95 border border-white/[0.06] rounded-2xl overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.55),0_8px_24px_rgba(0,0,0,0.3)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Edge light */}
            <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-gold-500/25 to-transparent pointer-events-none z-10" />

            {/* ── Header ── */}
            <div className="relative z-[1] p-4 pb-3 border-b border-white/[0.04]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-sm">
                    👾
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-gold-400/90">
                      NPC Quick Create
                    </h2>
                    <p className="text-[9px] text-surface-600">
                      Build a monster &amp; add to combat instantly
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-7 h-7 rounded-lg bg-[#0c0d15]/70 border border-white/[0.04] text-surface-500 hover:text-gold-400 hover:border-gold/15 active:scale-90 transition-all duration-200 flex items-center justify-center"
                  aria-label="Close"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Preview Card */}
              <div className="mt-3 p-2.5 rounded-xl bg-[#0c0d15]/50 border border-white/[0.04]">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{name ? name[0] : "?"}</span>
                    <div>
                      <span className="text-[11px] text-white/80 font-medium">
                        {name || "Unnamed NPC"}
                      </span>
                      <span className="text-[8px] text-surface-500 ml-1">
                        {size} &middot; {creatureType}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] text-amber-400 font-medium tabular-nums">
                    CR {cr}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-cyan-400 tabular-nums">AC {ac}</span>
                  <span className="text-[8px] text-surface-700">|</span>
                  <span className="text-[9px] text-emerald-400 tabular-nums">HP {hp}</span>
                  <span className="text-[8px] text-surface-700">|</span>
                  <span className="text-[9px] text-gold-400 tabular-nums">XP {getCrXp(cr)}</span>
                  <span className="text-[8px] text-surface-700">|</span>
                  <span className="text-[9px] text-surface-400 truncate max-w-[120px]">
                    {previewAtkStr}
                  </span>
                </div>
              </div>
            </div>

            {/* ── Scrollable Form Content ── */}
            <div className="overflow-y-auto scrollbar-gold" style={{ maxHeight: "50vh" }}>

              {/* Basic Info */}
              <div className="p-3 pb-1">
                <h3 className="text-[9px] uppercase tracking-wider text-surface-600 font-medium mb-2">
                  Basic Info
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="col-span-2">
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Monster name"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[#07080d]/70 border border-white/[0.06] text-[10px] text-white/80 placeholder:text-surface-700 focus:outline-none focus:border-gold-500/25 focus:ring-1 focus:ring-gold-500/15 transition-all"
                    />
                  </div>
                  <select
                    value={creatureType}
                    onChange={(e) => setCreatureType(e.target.value as CreatureType)}
                    className="px-2 py-1.5 rounded-lg bg-[#07080d]/70 border border-white/[0.06] text-[10px] text-white/70 focus:outline-none focus:border-gold-500/25 focus:ring-1 focus:ring-gold-500/15 transition-all"
                  >
                    {CREATURE_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <select
                    value={size}
                    onChange={(e) => setSize(e.target.value as CreatureSize)}
                    className="px-2 py-1.5 rounded-lg bg-[#07080d]/70 border border-white/[0.06] text-[10px] text-white/70 focus:outline-none focus:border-gold-500/25 focus:ring-1 focus:ring-gold-500/15 transition-all"
                  >
                    {SIZES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <select
                    value={cr}
                    onChange={(e) => handleCrChange(parseFloat(e.target.value))}
                    className="px-2 py-1.5 rounded-lg bg-[#07080d]/70 border border-white/[0.06] text-[10px] text-white/70 focus:outline-none focus:border-gold-500/25 focus:ring-1 focus:ring-gold-500/15 transition-all"
                  >
                    {CR_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <span className="text-[7px] uppercase tracking-wider text-cyan-500/60 block mb-0.5">AC</span>
                      <input
                        type="number"
                        value={ac}
                        onChange={(e) => setAc(parseInt(e.target.value) || 10)}
                        className="w-full px-2 py-1 rounded-lg bg-[#07080d]/70 border border-white/[0.06] text-[10px] text-white/80 focus:outline-none focus:border-cyan-500/25 focus:ring-1 focus:ring-cyan-500/15 transition-all tabular-nums"
                        min={1}
                        max={40}
                      />
                    </div>
                    <div className="flex-1">
                      <span className="text-[7px] uppercase tracking-wider text-emerald-500/60 block mb-0.5">HP</span>
                      <input
                        type="number"
                        value={hp}
                        onChange={(e) => setHp(parseInt(e.target.value) || 1)}
                        className="w-full px-2 py-1 rounded-lg bg-[#07080d]/70 border border-white/[0.06] text-[10px] text-white/80 focus:outline-none focus:border-emerald-500/25 focus:ring-1 focus:ring-emerald-500/15 transition-all tabular-nums"
                        min={1}
                        max={999}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Ability Scores */}
              <div className="px-3 pb-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[9px] uppercase tracking-wider text-surface-600 font-medium">
                    Ability Scores
                  </h3>
                  <button
                    onClick={handleStandardArray}
                    className="px-1.5 py-0.5 rounded text-[8px] font-medium bg-gold-500/10 border border-gold-500/15 text-gold-500 hover:text-gold-400 active:scale-95 transition-all"
                  >
                    Standard Array
                  </button>
                </div>
                <div className="grid grid-cols-6 gap-1">
                  {ABILITY_KEYS.map((key) => (
                    <div key={key} className="flex flex-col items-center">
                      <span className="text-[7px] uppercase tracking-wider text-surface-600 mb-0.5">
                        {ABILITY_LABELS[key]}
                      </span>
                      <input
                        type="number"
                        value={abilities[key]}
                        onChange={(e) =>
                          setAbilities((prev) => ({ ...prev, [key]: parseInt(e.target.value) || 10 }))
                        }
                        className="w-full text-center px-1 py-1 rounded-lg bg-[#07080d]/70 border border-white/[0.06] text-[10px] text-white/80 focus:outline-none focus:border-gold-500/25 focus:ring-1 focus:ring-gold-500/15 transition-all tabular-nums"
                        min={1}
                        max={30}
                      />
                      <span className="text-[8px] text-surface-600 tabular-nums mt-0.5">
                        {getMod(abilities[key])}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Attacks */}
              <div className="p-3 pb-1">
                <h3 className="text-[9px] uppercase tracking-wider text-surface-600 font-medium mb-2">
                  Attacks
                </h3>

                {attacks.length > 0 && (
                  <div className="space-y-1 mb-2">
                    {attacks.map((atk) => (
                      <div
                        key={atk.id}
                        className="flex items-center justify-between px-2 py-1 rounded-lg bg-[#0c0d15]/50 border border-white/[0.04]"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] text-white/80">{atk.name}</span>
                          <span className="text-[8px] text-rose-400 tabular-nums">+{atk.attackBonus}</span>
                          <span className="text-[8px] text-amber-400 tabular-nums">{atk.damageDice} {atk.damageType}</span>
                        </div>
                        <button
                          onClick={() => handleRemoveAttack(atk.id)}
                          className="text-[9px] text-surface-600 hover:text-rose-400 active:scale-90 transition-all"
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-6 gap-1">
                  <input
                    value={newAttackName}
                    onChange={(e) => setNewAttackName(e.target.value)}
                    placeholder="Name"
                    className="col-span-2 px-2 py-1 rounded-lg bg-[#07080d]/70 border border-white/[0.06] text-[9px] text-white/70 placeholder:text-surface-700 focus:outline-none focus:border-gold-500/25 focus:ring-1 focus:ring-gold-500/15 transition-all"
                  />
                  <input
                    type="number"
                    value={newAttackBonus}
                    onChange={(e) => setNewAttackBonus(e.target.value)}
                    placeholder="Atk"
                    className="px-2 py-1 rounded-lg bg-[#07080d]/70 border border-white/[0.06] text-[9px] text-white/70 placeholder:text-surface-700 focus:outline-none focus:border-gold-500/25 focus:ring-1 focus:ring-gold-500/15 transition-all tabular-nums"
                  />
                  <input
                    value={newAttackDice}
                    onChange={(e) => setNewAttackDice(e.target.value)}
                    placeholder="2d6"
                    className="px-2 py-1 rounded-lg bg-[#07080d]/70 border border-white/[0.06] text-[9px] text-white/70 placeholder:text-surface-700 focus:outline-none focus:border-gold-500/25 focus:ring-1 focus:ring-gold-500/15 transition-all"
                  />
                  <select
                    value={newAttackType}
                    onChange={(e) => setNewAttackType(e.target.value)}
                    className="px-2 py-1 rounded-lg bg-[#07080d]/70 border border-white/[0.06] text-[9px] text-white/70 focus:outline-none focus:border-gold-500/25 focus:ring-1 focus:ring-gold-500/15 transition-all"
                  >
                    {DAMAGE_TYPES.map((d) => (
                      <option key={d} value={d}>{d.slice(0, 4)}</option>
                    ))}
                  </select>
                  <button
                    onClick={handleAddAttack}
                    disabled={!newAttackName.trim()}
                    className="px-2 py-1 rounded-lg text-[9px] font-medium bg-gold-500/10 border border-gold-500/20 text-gold-400 hover:bg-gold-500/15 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    +Add
                  </button>
                </div>

                <div className="flex items-center gap-2 mt-1">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newAttackMelee}
                      onChange={() => setNewAttackMelee(!newAttackMelee)}
                      className="w-2.5 h-2.5 rounded border-white/[0.1] bg-[#07080d] text-gold-500 focus:ring-gold-500/25"
                    />
                    <span className="text-[8px] text-surface-600">Melee</span>
                  </label>
                  <input
                    value={newAttackRange}
                    onChange={(e) => setNewAttackRange(e.target.value)}
                    placeholder="Range (5 ft)"
                    className="flex-1 px-2 py-0.5 rounded-lg bg-[#07080d]/70 border border-white/[0.06] text-[8px] text-white/70 placeholder:text-surface-700 focus:outline-none focus:border-gold-500/25 focus:ring-1 focus:ring-gold-500/15 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* ── Footer ── */}
            <div className="relative z-[1] p-3 pt-2 border-t border-white/[0.04]">
              {flashMessage && (
                <div
                  className={"mb-2 p-1.5 rounded-lg border text-[9px] " + (
                    flashMessage.type === "success"
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                      : flashMessage.type === "warning"
                        ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                        : "bg-violet-500/10 border-violet-500/20 text-violet-400"
                  )}
                  style={{ animation: "slide-in-up 0.15s ease-out both" }}
                >
                  {flashMessage.text}
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-[8px] text-surface-700">
                    {activeEncounter
                      ? "Will be added to active combat"
                      : "Saved to campaign monster list"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={onClose}
                    className="px-3 py-1.5 rounded-xl text-[9px] font-medium text-surface-500 bg-[#0c0d15]/60 border border-white/[0.04] hover:text-surface-400 hover:border-white/[0.08] active:scale-[0.98] transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateAndAdd}
                    disabled={!name.trim()}
                    className="px-3 py-1.5 rounded-xl text-[9px] font-medium bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 active:scale-95 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    {activeEncounter
                      ? "Create &amp; Add to Combat"
                      : "Create NPC"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
