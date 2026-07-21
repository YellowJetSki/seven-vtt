/**
 * ST R VTT - Enemy Creator (Full Statblock Editor)
 *
 * Complete NPC/Enemy creation suite matching the robustness of the Player creator.
 * - Full ability scores (STR/DEX/CON/INT/WIS/CHA) with standard array/roll presets
 * - Auto-computed stats (AC from DEX, HP from CON, etc.)
 * - Structured attack manager using CombatEntity model
 * - Speed, senses, languages, traits, actions, reactions, legendary actions
 *
 * Replaces EnemyQuickCreate with a full-featured editor.
 */

import { useState, useCallback } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import type { EnemyDoc, CreatureType, CreatureSize, EnemyAttack, AbilityScores } from "@/types/enemy";

interface EnemyCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (enemy: EnemyDoc) => void;
  onSaved?: (enemy: EnemyDoc) => void;
  existingEnemy?: EnemyDoc;
}

const CREATURE_TYPES: CreatureType[] = [
  "Aberration", "Beast", "Celestial", "Construct", "Dragon",
  "Elemental", "Fey", "Fiend", "Giant", "Humanoid",
  "Monstrosity", "Ooze", "Plant", "Undead", "Custom",
];

const SIZES: CreatureSize[] = ["Tiny", "Small", "Medium", "Large", "Huge", "Gargantuan"];

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

function getMod(score: number): string {
  const m = Math.floor((score - 10) / 2);
  return m >= 0 ? String.fromCharCode(43) + String(m) : String(m);
}

function getModNum(score: number): number {
  return Math.floor((score - 10) / 2);
}

function generateId(): string {
  return "att_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6);
}

function crToAvgAc(cr: number): number {
  if (cr <= 0.125) return 12;
  if (cr <= 0.5) return 13;
  if (cr <= 2) return 13;
  if (cr <= 4) return 14;
  if (cr <= 6) return 15;
  if (cr <= 8) return 16;
  if (cr <= 10) return 17;
  if (cr <= 14) return 18;
  if (cr <= 18) return 19;
  return 20;
}

function crToAvgHp(cr: number): number {
  if (cr <= 0) return 10;
  if (cr <= 0.125) return 20;
  if (cr <= 0.5) return 35;
  if (cr <= 1) return 50;
  if (cr <= 2) return 65;
  if (cr <= 3) return 85;
  if (cr <= 4) return 100;
  if (cr <= 5) return 120;
  if (cr <= 6) return 140;
  if (cr <= 7) return 160;
  if (cr <= 8) return 190;
  if (cr <= 9) return 220;
  if (cr <= 10) return 250;
  if (cr <= 12) return 300;
  if (cr <= 14) return 350;
  if (cr <= 16) return 400;
  if (cr <= 18) return 450;
  return 500;
}

function crToProfBonus(cr: number): number {
  if (cr <= 4) return 2;
  if (cr <= 8) return 3;
  if (cr <= 12) return 4;
  if (cr <= 16) return 5;
  if (cr <= 20) return 6;
  return 7;
}

function formatCr(cr: number): string {
  if (cr === 0) return "0";
  if (cr === 0.125) return "1/8";
  if (cr === 0.25) return "1/4";
  if (cr === 0.5) return "1/2";
  return String(cr);
}

export default function EnemyCreator({ isOpen, onClose, onCreated, onSaved, existingEnemy }: EnemyCreatorProps) {
  const isEditMode = !!existingEnemy;
  const enemies = useCampaignStore((s) => s.enemies);
  const setEnemies = useCampaignStore((s) => s.setEnemies);

  const [name, setName] = useState(existingEnemy?.name || "");
  const [creatureType, setCreatureType] = useState<CreatureType>(existingEnemy?.type || "Humanoid");
  const [size, setSize] = useState<CreatureSize>(existingEnemy?.size || "Medium");
  const [speed, setSpeed] = useState(existingEnemy?.speed || 30);
  const [armorClass, setArmorClass] = useState(existingEnemy?.armorClass || 13);
  const [hitPoints, setHitPoints] = useState(existingEnemy?.hitPoints.max || 50);
  const [challengeRating, setChallengeRating] = useState(existingEnemy?.challengeRating || 1);
  const [abilities, setAbilities] = useState<AbilityScores>(
    existingEnemy?.abilities || { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 }
  );
  const [attacks, setAttacks] = useState<EnemyAttack[]>(existingEnemy?.attacks || []);
  const [senses, setSenses] = useState(existingEnemy?.senses || "");
  const [languages, setLanguages] = useState(existingEnemy?.languages || "");
  const [traits, setTraits] = useState(existingEnemy?.traits || "");
  const [actions, setActions] = useState(existingEnemy?.actions || "");
  const [reactions, setReactions] = useState(existingEnemy?.reactions || "");
  const [specialAbilities, setSpecialAbilities] = useState(existingEnemy?.specialAbilities || "");
  const [legendaryActions, setLegendaryActions] = useState(existingEnemy?.legendaryActions || "");
  const [dmgResist, setDmgResist] = useState<string[]>(existingEnemy?.damageResistances || []);
  const [dmgImmune, setDmgImmune] = useState<string[]>(existingEnemy?.damageImmunities || []);
  const [condImmune, setCondImmune] = useState<string[]>(existingEnemy?.conditionImmunities || []);
  // Saving throw proficiency tracking (parent-state, hoisted from SaveRow)
  const [saveProfs, setSaveProfs] = useState<Record<string, boolean>>(() => {
    const saved: Record<string, boolean> = {};
    if (existingEnemy?.savingThrows) {
      Object.keys(existingEnemy.savingThrows).forEach((k) => { saved[k] = true; });
    }
    return saved;
  });
  const [saveBonuses, setSaveBonuses] = useState<Record<string, string>>(() => {
    const saved: Record<string, string> = {};
    if (existingEnemy?.savingThrows) {
      Object.entries(existingEnemy.savingThrows).forEach(([k, v]) => { if (v !== undefined) saved[k] = String(v); });
    }
    return saved;
  });
  const [imageUrl, setImageUrl] = useState(existingEnemy?.imageUrl || "");
  const [showAttackForm, setShowAttackForm] = useState(false);
  const [attName, setAttName] = useState("");
  const [attBonus, setAttBonus] = useState(5);
  const [attDice, setAttDice] = useState("1d8");
  const [attType, setAttType] = useState("slashing");
  const [attMelee, setAttMelee] = useState(true);
  const [attRanged, setAttRanged] = useState(false);
  const [attRange, setAttRange] = useState("5 ft");
  const [attProps, setAttProps] = useState("");
  const [editAttId, setEditAttId] = useState<string | null>(null);
  const [editAbility, setEditAbility] = useState<keyof AbilityScores | null>(null);
  const [editAbilityVal, setEditAbilityVal] = useState(10);

  // ── Spellcasting state ──
  type NonUndefined<T> = T extends undefined ? never : T;
  type SpellcastingType = NonUndefined<EnemyDoc["spellcasting"]>;

  const [showSpellcasting, setShowSpellcasting] = useState(!!existingEnemy?.spellcasting);
  const [spCasterType, setSpCasterType] = useState<SpellcastingType["casterType"]>(existingEnemy?.spellcasting?.casterType || "full");
  const [spAbility, setSpAbility] = useState<SpellcastingType["spellcastingAbility"]>(existingEnemy?.spellcasting?.spellcastingAbility || "intelligence");
  const [spDC, setSpDC] = useState(existingEnemy?.spellcasting?.spellSaveDC || 14);
  const [spATK, setSpATK] = useState(existingEnemy?.spellcasting?.spellAttackBonus || 6);
  const [spSpells, setSpSpells] = useState(existingEnemy?.spellcasting?.spells?.join(", ") || "");
  const [spSlots, setSpSlots] = useState(existingEnemy?.spellcasting?.slotsPerLevel ? JSON.stringify(existingEnemy.spellcasting.slotsPerLevel) : "{}");

  const pb = crToProfBonus(challengeRating);
  const strMod = getModNum(abilities.strength);
  const dexMod = getModNum(abilities.dexterity);
  const conMod = getModNum(abilities.constitution);
  const totalMod = strMod + dexMod + conMod + getModNum(abilities.intelligence)
    + getModNum(abilities.wisdom) + getModNum(abilities.charisma);

  const handleAbilityClick = useCallback((key: keyof AbilityScores) => {
    setEditAbility(key);
    setEditAbilityVal(abilities[key]);
  }, [abilities]);

  const handleAbilitySave = useCallback(() => {
    if (editAbility && editAbilityVal >= 1 && editAbilityVal <= 30) {
      setAbilities((prev) => ({ ...prev, [editAbility]: editAbilityVal }));
    }
    setEditAbility(null);
  }, [editAbility, editAbilityVal]);

  const applyStandardArray = useCallback(() => {
    setAbilities({ strength: 15, dexterity: 14, constitution: 13, intelligence: 12, wisdom: 10, charisma: 8 });
  }, []);

  const applyRollPreset = useCallback(() => {
    const roll = () => {
      const dice = Array(4).fill(0).map(() => Math.floor(Math.random() * 6) + 1);
      dice.sort((a, b) => b - a);
      return dice.slice(0, 3).reduce((s, v) => s + v, 0);
    };
    const scores = Array(6).fill(0).map(() => roll());
    scores.sort((a, b) => b - a);
    setAbilities({
      strength: scores[0], dexterity: scores[1], constitution: scores[2],
      intelligence: scores[3], wisdom: scores[4], charisma: scores[5],
    });
  }, []);

  const autoFillFromCr = useCallback(() => {
    setArmorClass(crToAvgAc(challengeRating));
    setHitPoints(crToAvgHp(challengeRating));
  }, [challengeRating]);

  const addAttack = useCallback(() => {
    if (!attName.trim()) return;
    const newAtt: EnemyAttack = {
      id: generateId(),
      name: attName.trim(),
      attackBonus: attBonus,
      damageDice: attDice,
      damageType: attType,
      isMelee: attMelee,
      isRanged: attRanged,
      range: attRange,
      properties: attProps.split(",").map((p) => p.trim()).filter(Boolean),
    };
    if (editAttId) {
      setAttacks((prev) => prev.map((a) => (a.id === editAttId ? newAtt : a)));
    } else {
      setAttacks((prev) => [...prev, newAtt]);
    }
    setShowAttackForm(false);
    setAttName(""); setAttBonus(5); setAttDice("1d8"); setAttType("slashing");
    setAttMelee(true); setAttRanged(false); setAttRange("5 ft"); setAttProps(""); setEditAttId(null);
  }, [attName, attBonus, attDice, attType, attMelee, attRanged, attRange, attProps, editAttId]);

  const editAttack = useCallback((att: EnemyAttack) => {
    setAttName(att.name); setAttBonus(att.attackBonus); setAttDice(att.damageDice);
    setAttType(att.damageType); setAttMelee(att.isMelee); setAttRanged(att.isRanged);
    setAttRange(att.range); setAttProps(att.properties.join(", "));
    setEditAttId(att.id); setShowAttackForm(true);
  }, []);

  const removeAttack = useCallback((id: string) => {
    setAttacks((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const handleSave = useCallback(() => {
    if (!name.trim()) return;
    let parsedSlots: Record<string, { current: number; max: number }> | undefined;
    try {
      const parsed = JSON.parse(spSlots);
      if (typeof parsed === "object" && !Array.isArray(parsed)) parsedSlots = parsed;
    } catch { /* ignore invalid JSON */ }
    const spellcastingData = showSpellcasting ? {
      casterType: spCasterType,
      spellcastingAbility: spAbility,
      spellSaveDC: spDC,
      spellAttackBonus: spATK,
      spells: spSpells.split(",").map((s) => s.trim()).filter(Boolean),
      slotsPerLevel: parsedSlots && Object.keys(parsedSlots).length > 0 ? parsedSlots : undefined,
    } : undefined;
    const enemy: EnemyDoc = {
      id: existingEnemy?.id || ("enemy_" + Date.now()),
      name: name.trim(), type: creatureType, size, armorClass,
      hitPoints: { current: hitPoints, max: hitPoints, temporary: 0 },
      speed, abilities, savingThrows: Object.fromEntries(
        (["strength","dexterity","constitution","intelligence","wisdom","charisma"] as const)
          .filter((k) => saveProfs[k])
          .map((k) => [k, saveBonuses[k] ? getModNum(abilities[k]) + Number(saveBonuses[k]) : getModNum(abilities[k]) + pb])
      ), skills: {},
      damageVulnerabilities: [], damageResistances: dmgResist,
      damageImmunities: dmgImmune, conditionImmunities: condImmune,
      senses, languages, challengeRating, traits, actions, reactions,
      specialAbilities, legendaryActions,
      attacks: attacks.length > 0 ? attacks : undefined,
      imageUrl: imageUrl || undefined,
      spellcasting: spellcastingData,
      isHomebrew: true, createdAt: existingEnemy?.createdAt || Date.now(), updatedAt: Date.now(),
    };
    if (isEditMode && onSaved) {
      setEnemies(enemies.map((e) => (e.id === enemy.id ? enemy : e)));
      onSaved(enemy);
    } else if (onCreated) {
      onCreated(enemy);
    }
    onClose();
  }, [name, creatureType, size, speed, armorClass, hitPoints, challengeRating,
      abilities, attacks, senses, languages, traits, actions, reactions,
      specialAbilities, legendaryActions, dmgResist, dmgImmune, condImmune,
      imageUrl, isEditMode, existingEnemy, enemies, setEnemies, onCreated, onSaved, onClose,
      showSpellcasting, spCasterType, spAbility, spDC, spATK, spSpells, spSlots,
      saveProfs, saveBonuses, pb]);

  const isValid = name.trim().length > 0;

  if (!isOpen) return null;

  // ── Xp table lookup ──
  const xpValues: Record<number, number> = {
    0: 10, 0.125: 25, 0.25: 50, 0.5: 100, 1: 200, 2: 450, 3: 700,
    4: 1100, 5: 1800, 6: 2300, 7: 2900, 8: 3900, 9: 5000, 10: 5900,
    11: 7200, 12: 8400, 13: 10000, 14: 11500, 15: 13000, 16: 15000,
    17: 18000, 18: 20000, 19: 22000, 20: 25000, 21: 33000, 22: 41000,
    23: 50000, 24: 62000, 25: 75000, 26: 90000, 27: 105000,
    28: 120000, 29: 135000, 30: 155000,
  };
  const xpDisplay = xpValues[challengeRating]?.toLocaleString() || String.fromCharCode(8212);
  const crOpts = [0, 0.125, 0.25, 0.5, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30];
  const totalAbilityMods = ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"] as (keyof AbilityScores)[];

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center pt-6 pb-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto">
      <div className="relative w-full max-w-2xl mx-4 bg-gradient-to-br from-[#14151f] to-[#0f101a] border border-gold/10 rounded-2xl shadow-2xl shadow-gold-500/5 overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-gold-500/20 rounded-tl-2xl pointer-events-none" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-gold-500/20 rounded-tr-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-gold-500/20 rounded-bl-2xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b border-r border-gold-500/20 rounded-br-2xl pointer-events-none" />

        <div className="shrink-0 px-5 py-4 border-b border-gold/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xl">{isEditMode ? String.fromCharCode(9999) : String.fromCharCode(128126)}</span>
              <div>
                <h2 className="text-lg font-black text-gold tracking-tight">{isEditMode ? "Edit Monster" : "Create Monster"}</h2>
                <p className="text-[10px] text-surface-500 mt-0.5">Full statblock editor with ability scores and attacks</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-surface-500 hover:text-surface-200 hover:bg-gold-500/10 active:scale-90 transition-all">{String.fromCharCode(10005)}</button>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[70vh] scrollbar-gold">
          <div className="p-5 space-y-5">

            <Section title="Basic Info" icon={String.fromCharCode(128203)}>
              <div className="space-y-3">
                <div>
                  <label className="block text-[9px] uppercase tracking-widest font-black text-gold-500/60 mb-1">Name</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Goblin Scout" className="w-full py-2 px-3 rounded-lg text-xs bg-[#07080d]/70 border border-white/[0.06] text-white/80 focus:outline-none focus:border-gold/25 placeholder:text-surface-700" autoFocus />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[9px] uppercase tracking-widest font-black text-gold-500/60 mb-1">Type</label>
                    <select value={creatureType} onChange={(e) => setCreatureType(e.target.value as CreatureType)} className="w-full py-2 px-2.5 rounded-lg text-xs bg-[#07080d]/70 border border-white/[0.06] text-white/80 focus:outline-none focus:border-gold/25">
                      {CREATURE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase tracking-widest font-black text-gold-500/60 mb-1">Size</label>
                    <select value={size} onChange={(e) => setSize(e.target.value as CreatureSize)} className="w-full py-2 px-2.5 rounded-lg text-xs bg-[#07080d]/70 border border-white/[0.06] text-white/80 focus:outline-none focus:border-gold/25">
                      {SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase tracking-widest font-black text-gold-500/60 mb-1">Speed (ft)</label>
                    <input type="number" value={speed} onChange={(e) => setSpeed(Math.max(5, parseInt(e.target.value) || 30))} className="w-full py-2 px-2.5 rounded-lg text-xs bg-[#07080d]/70 border border-white/[0.06] text-white/80 focus:outline-none focus:border-gold/25" />
                  </div>
                </div>
                <div>
                  <label className="block text-[9px] uppercase tracking-widest font-black text-gold-500/60 mb-1">Token Image URL</label>
                  <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://example.com/token.png" className="w-full py-2 px-3 rounded-lg text-xs bg-[#07080d]/70 border border-white/[0.06] text-white/80 focus:outline-none focus:border-gold/25 placeholder:text-surface-700" />
                  {imageUrl && (
                    <div className="mt-1.5 flex items-center gap-2">
                      <img src={imageUrl} alt="Token preview" className="w-8 h-8 rounded-lg object-cover border border-white/[0.06]" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      <span className="text-[9px] text-surface-500">Token preview</span>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[9px] uppercase tracking-widest font-black text-gold-500/60 mb-1">CR <button onClick={autoFillFromCr} className="text-surface-600 hover:text-gold-400 ml-1" title="Auto-fill AC/HP from CR">(auto)</button></label>
                    <select value={challengeRating} onChange={(e) => setChallengeRating(parseFloat(e.target.value))} className="w-full py-2 px-2.5 rounded-lg text-xs bg-[#07080d]/70 border border-white/[0.06] text-white/80 focus:outline-none focus:border-gold/25">
                      {crOpts.map((v) => <option key={v} value={v}>{formatCr(v)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase tracking-widest font-black text-gold-500/60 mb-1">AC <span className="text-surface-600 font-normal ml-1">({crToAvgAc(challengeRating)} avg)</span></label>
                    <input type="number" value={armorClass} onChange={(e) => setArmorClass(Math.max(1, parseInt(e.target.value) || 10))} className="w-full py-2 px-2.5 rounded-lg text-xs bg-[#07080d]/70 border border-white/[0.06] text-white/80 focus:outline-none focus:border-gold/25" />
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase tracking-widest font-black text-gold-500/60 mb-1">HP <span className="text-surface-600 font-normal ml-1">({crToAvgHp(challengeRating)} avg)</span></label>
                    <input type="number" value={hitPoints} onChange={(e) => setHitPoints(Math.max(1, parseInt(e.target.value) || 1))} className="w-full py-2 px-2.5 rounded-lg text-xs bg-[#07080d]/70 border border-white/[0.06] text-white/80 focus:outline-none focus:border-gold/25" />
                  </div>
                </div>
                <div className="text-[9px] text-surface-600">
                  PB: <span className="text-gold-400 font-semibold">+{pb}</span>
                  <span className="mx-1.5">middot;</span>
                  XP: <span className="text-gold-400 font-semibold">{xpDisplay}</span>
                </div>
              </div>
            </Section>

            <Section title="Ability Scores" icon={String.fromCharCode(128170)}>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <button onClick={applyStandardArray} className="px-2.5 py-1 rounded text-[9px] font-semibold bg-cyan-500/8 border border-cyan-500/15 text-cyan-400 hover:bg-cyan-500/12 active:scale-95 transition-all">Std Array</button>
                  <button onClick={applyRollPreset} className="px-2.5 py-1 rounded text-[9px] font-semibold bg-amber-500/8 border border-amber-500/15 text-amber-400 hover:bg-amber-500/12 active:scale-95 transition-all">Roll</button>
                  <span className="text-[8px] text-surface-600 ml-auto">Total mod: <span className={totalMod >= 0 ? "text-gold-400" : "text-rose-400"}>{totalMod >= 0 ? "+" : ""}{totalMod}</span></span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {totalAbilityMods.map((key) => {
                    const val = abilities[key];
                    return (
                      <div key={key} className="rounded-xl bg-[#0c0d15] border border-white/[0.04] p-3 text-center">
                        <span className="text-[10px] uppercase tracking-wider text-gold-400/60 font-bold">{ABILITY_LABELS[key]}</span>
                        {editAbility === key ? (
                          <div className="mt-1 flex items-center justify-center gap-1">
                            <input type="number" value={editAbilityVal} min={1} max={30} onChange={(e) => setEditAbilityVal(Math.max(1, Math.min(30, parseInt(e.target.value) || 10)))} onKeyDown={(e) => { if (e.key === "Enter") handleAbilitySave(); if (e.key === "Escape") setEditAbility(null); }} className="w-14 text-center py-1 rounded text-xs bg-[#07080d] border border-gold/25 text-gold-300 focus:outline-none" autoFocus />
                          </div>
                        ) : (
                          <button onClick={() => handleAbilityClick(key)} className="mt-1 w-full text-center group">
                            <span className="text-lg font-black text-white/90 tabular-nums">{val}</span>
                            <span className={"ml-1 text-[10px] font-semibold " + (getModNum(val) >= 0 ? "text-gold-400" : "text-rose-400")}>
                              ({getMod(val)})
                            </span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </Section>

            {/* Saving Throws Section */}
            <Section title={"Saving Throws"} icon={String.fromCharCode(128737)}>
              <p className="text-[9px] text-surface-600 mb-3">Saves are computed from ability scores + proficiency bonus (+{pb}). Toggle to mark proficient.</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(["strength","dexterity","constitution","intelligence","wisdom","charisma"] as const).map((key) => (
                  <SaveRow
                    key={key}
                    ability={key}
                    label={ABILITY_LABELS[key]}
                    score={abilities[key]}
                    pb={pb}
                    isProficient={saveProfs[key] || false}
                    bonusOverride={saveBonuses[key] || ""}
                    onToggle={(v) => setSaveProfs((prev) => ({ ...prev, [key]: v }))}
                    onBonusChange={(v) => setSaveBonuses((prev) => ({ ...prev, [key]: v }))}
                  />
                ))}
              </div>
            </Section>

            <Section title={"Attacks (" + attacks.length + ")"} icon={String.fromCharCode(9876)}>
              <div className="space-y-3">
                {attacks.length > 0 && (
                  <div className="space-y-1.5">
                    {attacks.map((att) => (
                      <div key={att.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#0c0d15] border border-white/[0.04] group">
                        <span className="flex-1 text-[11px] text-surface-200 truncate">
                          <span className="font-semibold">{att.name}</span>
                          <span className="text-gold-400 ml-2">+{att.attackBonus}</span>
                          <span className="text-surface-500 ml-1.5">{att.damageDice} {att.damageType}</span>
                          <span className="text-surface-600 ml-1.5">{att.range}</span>
                        </span>
                        <button onClick={() => editAttack(att)} className="opacity-0 group-hover:opacity-100 px-1.5 py-0.5 rounded text-[8px] text-cyan-400 hover:bg-cyan-500/10 transition-all">Edit</button>
                        <button onClick={() => removeAttack(att.id)} className="opacity-0 group-hover:opacity-100 px-1.5 py-0.5 rounded text-[8px] text-rose-400 hover:bg-rose-500/10 transition-all">Del</button>
                      </div>
                    ))}
                  </div>
                )}
                {showAttackForm ? (
                  <div className="p-3 rounded-xl bg-[#0c0d15] border border-gold/10 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <input value={attName} onChange={(e) => setAttName(e.target.value)} placeholder="Attack name" className="px-2 py-1.5 rounded text-[10px] bg-[#07080d] border border-white/[0.06] text-white/80 focus:outline-none focus:border-gold/25 placeholder:text-surface-700" />
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] text-surface-500">+</span>
                        <input type="number" value={attBonus} onChange={(e) => setAttBonus(parseInt(e.target.value) || 0)} className="w-12 text-center px-1 py-1.5 rounded text-[10px] bg-[#07080d] border border-white/[0.06] text-gold-400 focus:outline-none focus:border-gold/25" />
                        <input value={attDice} onChange={(e) => setAttDice(e.target.value)} placeholder="1d8" className="w-14 text-center px-1 py-1.5 rounded text-[10px] bg-[#07080d] border border-white/[0.06] text-white/80 focus:outline-none focus:border-gold/25" />
                        <select value={attType} onChange={(e) => setAttType(e.target.value)} className="px-1.5 py-1.5 rounded text-[9px] bg-[#07080d] border border-white/[0.06] text-white/60 focus:outline-none">
                          {DAMAGE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1 text-[9px] text-surface-500">
                        <input type="checkbox" checked={attMelee} onChange={(e) => setAttMelee(e.target.checked)} className="accent-gold-500" /> Melee
                      </label>
                      <label className="flex items-center gap-1 text-[9px] text-surface-500">
                        <input type="checkbox" checked={attRanged} onChange={(e) => setAttRanged(e.target.checked)} className="accent-gold-500" /> Ranged
                      </label>
                      <input value={attRange} onChange={(e) => setAttRange(e.target.value)} placeholder="Range" className="flex-1 px-2 py-1 rounded text-[9px] bg-[#07080d] border border-white/[0.06] text-white/60 focus:outline-none focus:border-gold/25 placeholder:text-surface-700" />
                      <input value={attProps} onChange={(e) => setAttProps(e.target.value)} placeholder="Properties" className="flex-1 px-2 py-1 rounded text-[9px] bg-[#07080d] border border-white/[0.06] text-white/60 focus:outline-none focus:border-gold/25 placeholder:text-surface-700" />
                    </div>
                    <div className="flex items-center gap-2 justify-end">
                      <button onClick={() => { setShowAttackForm(false); setEditAttId(null); setAttName(""); }} className="px-2.5 py-1 rounded text-[9px] text-surface-500 hover:text-surface-300">Cancel</button>
                      <button onClick={addAttack} disabled={!attName.trim()} className="px-3 py-1 rounded text-[9px] font-semibold bg-gold-500/10 border border-gold/15 text-gold-400 hover:bg-gold-500/15 disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-all">
                        {editAttId ? "Update" : "Add"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setShowAttackForm(true)} className="flex items-center gap-1.5 text-[10px] text-cyan-400 hover:text-cyan-300 transition-colors">
                    + Add Attack
                  </button>
                )}
              </div>
            </Section>

            <Section title="Defenses" icon={String.fromCharCode(128737)}>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[9px] uppercase tracking-widest font-black text-gold-500/60 mb-1">Resistances</label>
                  <TagInput value={dmgResist} onChange={setDmgResist} options={DAMAGE_TYPES} placeholder="fire" />
                </div>
                <div>
                  <label className="block text-[9px] uppercase tracking-widest font-black text-gold-500/60 mb-1">Immunities</label>
                  <TagInput value={dmgImmune} onChange={setDmgImmune} options={DAMAGE_TYPES} placeholder="poison" />
                </div>
                <div>
                  <label className="block text-[9px] uppercase tracking-widest font-black text-gold-500/60 mb-1">Cond. Immune</label>
                  <TagInput value={condImmune} onChange={setCondImmune} options={["charmed","frightened","poisoned","stunned","unconscious","paralyzed","petrified","blinded","deafened"]} placeholder="charmed" />
                </div>
              </div>
            </Section>

            <Section title="Senses & Languages" icon={String.fromCharCode(128065)}>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] uppercase tracking-widest font-black text-gold-500/60 mb-1">Senses</label>
                  <input value={senses} onChange={(e) => setSenses(e.target.value)} placeholder="darkvision 60 ft, passive Perception 12" className="w-full py-2 px-3 rounded-lg text-xs bg-[#07080d]/70 border border-white/[0.06] text-white/60 focus:outline-none focus:border-gold/25 placeholder:text-surface-700" />
                </div>
                <div>
                  <label className="block text-[9px] uppercase tracking-widest font-black text-gold-500/60 mb-1">Languages</label>
                  <input value={languages} onChange={(e) => setLanguages(e.target.value)} placeholder="Common, Goblin" className="w-full py-2 px-3 rounded-lg text-xs bg-[#07080d]/70 border border-white/[0.06] text-white/60 focus:outline-none focus:border-gold/25 placeholder:text-surface-700" />
                </div>
              </div>
            </Section>

            <Section title="Traits & Abilities" icon={String.fromCharCode(129516)}>
              <div className="space-y-2">
                <div>
                  <label className="block text-[9px] uppercase tracking-widest font-black text-gold-500/60 mb-1">Traits</label>
                  <textarea value={traits} onChange={(e) => setTraits(e.target.value)} rows={2} placeholder="Keen Senses. Advantage on Perception." className="w-full py-2 px-3 rounded-lg text-xs bg-[#07080d]/70 border border-white/[0.06] text-white/60 focus:outline-none focus:border-gold/25 placeholder:text-surface-700 resize-none scrollbar-gold" />
                </div>
                <div>
                  <label className="block text-[9px] uppercase tracking-widest font-black text-gold-500/60 mb-1">Actions</label>
                  <textarea value={actions} onChange={(e) => setActions(e.target.value)} rows={2} placeholder="Shortbow. Ranged: +4, 80/320 ft." className="w-full py-2 px-3 rounded-lg text-xs bg-[#07080d]/70 border border-white/[0.06] text-white/60 focus:outline-none focus:border-gold/25 placeholder:text-surface-700 resize-none scrollbar-gold" />
                </div>
                <div>
                  <label className="block text-[9px] uppercase tracking-widest font-black text-gold-500/60 mb-1">Reactions</label>
                  <textarea value={reactions} onChange={(e) => setReactions(e.target.value)} rows={2} placeholder="Uncanny Dodge." className="w-full py-2 px-3 rounded-lg text-xs bg-[#07080d]/70 border border-white/[0.06] text-white/60 focus:outline-none focus:border-gold/25 placeholder:text-surface-700 resize-none scrollbar-gold" />
                </div>
                <div>
                  <label className="block text-[9px] uppercase tracking-widest font-black text-gold-500/60 mb-1">Special Abilities</label>
                  <textarea value={specialAbilities} onChange={(e) => setSpecialAbilities(e.target.value)} rows={2} placeholder="Innate Spellcasting." className="w-full py-2 px-3 rounded-lg text-xs bg-[#07080d]/70 border border-white/[0.06] text-white/60 focus:outline-none focus:border-gold/25 placeholder:text-surface-700 resize-none scrollbar-gold" />
                </div>
                <div>
                  <label className="block text-[9px] uppercase tracking-widest font-black text-gold-500/60 mb-1">Legendary Actions</label>
                  <textarea value={legendaryActions} onChange={(e) => setLegendaryActions(e.target.value)} rows={2} placeholder="Can take 2 legendary actions." className="w-full py-2 px-3 rounded-lg text-xs bg-[#07080d]/70 border border-white/[0.06] text-white/60 focus:outline-none focus:border-gold/25 placeholder:text-surface-700 resize-none scrollbar-gold" />
                </div>
              </div>
            </Section>

            {/* Spellcasting Section */}
            <Section title={"Spellcasting" + (showSpellcasting ? " \u2713" : "")} icon={String.fromCharCode(128302)}>
              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer mb-2">
                  <input type="checkbox" checked={showSpellcasting} onChange={(e) => setShowSpellcasting(e.target.checked)} className="rounded border-surface-600 bg-surface-800 accent-gold-500" />
                  <span className="text-[10px] text-surface-300">This monster can cast spells</span>
                </label>
                {showSpellcasting && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] uppercase tracking-widest font-black text-gold-500/60 mb-1">Caster Type</label>
                        <select value={spCasterType} onChange={(e) => setSpCasterType(e.target.value as SpellcastingType["casterType"])} className="w-full py-1.5 px-2 rounded-lg text-[10px] bg-[#07080d]/70 border border-white/[0.06] text-white/80 focus:outline-none focus:border-gold/25">
                          <option value="full">Full Caster</option>
                          <option value="half">Half Caster</option>
                          <option value="third">Third Caster</option>
                          <option value="pact">Pact Magic</option>
                          <option value="innate">Innate</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[9px] uppercase tracking-widest font-black text-gold-500/60 mb-1">Spellcasting Ability</label>
                        <select value={spAbility} onChange={(e) => setSpAbility(e.target.value as SpellcastingType["spellcastingAbility"])} className="w-full py-1.5 px-2 rounded-lg text-[10px] bg-[#07080d]/70 border border-white/[0.06] text-white/80 focus:outline-none focus:border-gold/25">
                          <option value="intelligence">INT</option>
                          <option value="wisdom">WIS</option>
                          <option value="charisma">CHA</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[9px] uppercase tracking-widest font-black text-gold-500/60 mb-1">Spell Save DC</label>
                        <input type="number" value={spDC} onChange={(e) => setSpDC(Number(e.target.value) || 10)} className="w-full py-1.5 px-2 rounded-lg text-[10px] bg-[#07080d]/70 border border-white/[0.06] text-white/80 focus:outline-none focus:border-gold/25" />
                      </div>
                      <div>
                        <label className="block text-[9px] uppercase tracking-widest font-black text-gold-500/60 mb-1">Spell Attack Bonus</label>
                        <input type="number" value={spATK} onChange={(e) => setSpATK(Number(e.target.value) || 0)} className="w-full py-1.5 px-2 rounded-lg text-[10px] bg-[#07080d]/70 border border-white/[0.06] text-white/80 focus:outline-none focus:border-gold/25" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase tracking-widest font-black text-gold-500/60 mb-1">Spell List (comma-separated)</label>
                      <input value={spSpells} onChange={(e) => setSpSpells(e.target.value)} placeholder="Fireball, Shield, Counterspell" className="w-full py-1.5 px-2 rounded-lg text-[10px] bg-[#07080d]/70 border border-white/[0.06] text-white/60 focus:outline-none focus:border-gold/25 placeholder:text-surface-700" />
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase tracking-widest font-black text-gold-500/60 mb-1">Spell Slots per Level</label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {[1,2,3,4,5,6,7,8,9].map((lvl) => (
                          <div key={lvl} className="flex items-center gap-1 bg-[#07080d]/70 border border-white/[0.04] rounded-lg px-2 py-1">
                            <span className="text-[8px] text-gold-400/60 w-4">L{lvl}</span>
                            <input type="number" min={0} max={9} value={(() => { try { const p = JSON.parse(spSlots); return (typeof p === "object" && p[String(lvl)]?.max) ?? 0; } catch { return 0; } })()} onChange={(e) => { const v = parseInt(e.target.value) || 0; try { const p = JSON.parse(spSlots); const o = typeof p === "object" ? p : {}; setSpSlots(JSON.stringify({...o, [String(lvl)]: {current: v, max: v}})); } catch { setSpSlots(JSON.stringify({[String(lvl)]: {current: v, max: v}})); } }}
                              className="w-8 text-center py-0.5 rounded text-[9px] bg-[#0c0d15] border border-white/[0.06] text-white/80 focus:outline-none focus:border-gold/25" />
                          </div>
                        ))}
                      </div>
                      <p className="text-[7px] text-surface-600 mt-1">Set max slots per level. Levels without slots can remain 0.</p>
                    </div>
                  </div>
                )}
              </div>
            </Section>

          </div>
        </div>

        <div className="shrink-0 px-5 py-4 border-t border-gold/10 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-[10px] font-semibold text-surface-400 hover:text-surface-200 border border-white/[0.06] hover:border-white/[0.12] active:scale-95 transition-all">Cancel</button>
          <button onClick={handleSave} disabled={!isValid} className="px-5 py-2 rounded-lg text-[10px] font-bold bg-gold-500/10 border border-gold/15 text-gold-400 hover:bg-gold-500/15 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2">
            <span>{isEditMode ? "Save Changes" : "Create Monster"}</span>
            <span className="text-[8px] text-surface-500">({attacks.length} attacks)</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ──

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-gradient-to-br from-[#141520]/50 to-[#0f1019]/50 border border-white/[0.04] p-4">
      <h3 className="text-[9px] uppercase tracking-widest font-black text-gold-500/50 mb-3 flex items-center gap-1.5">
        <span>{icon}</span>
        <span>{title}</span>
      </h3>
      {children}
    </div>
  );
}

function TagInput({ value, onChange, options, placeholder }: {
  value: string[]; onChange: (val: string[]) => void; options: string[]; placeholder?: string;
}) {
  const [input, setInput] = useState("");

  const addTag = useCallback((tag: string) => {
    const t = tag.trim().toLowerCase();
    if (t && !value.includes(t)) {
      onChange([...value, t]);
    }
    setInput("");
  }, [value, onChange]);

  const removeTag = useCallback((tag: string) => {
    onChange(value.filter((v) => v !== tag));
  }, [value, onChange]);

  const filteredOptions = options.filter(
    (o) => o.toLowerCase().includes(input.toLowerCase()) && !value.includes(o)
  );

  return (
    <div className="relative">
      <div className="flex flex-wrap gap-1 mb-1.5">
        {value.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] bg-gold-500/10 border border-gold/15 text-gold-400">
            {tag}
            <button onClick={() => removeTag(tag)} className="text-gold-400/50 hover:text-gold-300">x</button>
          </span>
        ))}
      </div>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(input); } }}
        placeholder={placeholder ?? "Type and press Enter"}
        className="w-full py-1.5 px-2 rounded text-[9px] bg-[#07080d]/70 border border-white/[0.06] text-white/60 focus:outline-none focus:border-gold/25 placeholder:text-surface-700"
      />
      {input && filteredOptions.length > 0 && (
        <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-[#14151f] border border-white/[0.06] rounded-lg max-h-24 overflow-y-auto scrollbar-gold">
          {filteredOptions.slice(0, 6).map((opt) => (
            <button key={opt} onClick={() => addTag(opt)} className="w-full text-left px-2.5 py-1 text-[9px] text-surface-400 hover:text-gold-400 hover:bg-gold-500/5 transition-colors">
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** A single saving throw toggle row — parent-controlled state */
function SaveRow({ ability, label, score, pb, isProficient, bonusOverride, onToggle, onBonusChange }: {
  ability: string; label: string; score: number; pb: number;
  isProficient: boolean; bonusOverride: string;
  onToggle: (v: boolean) => void; onBonusChange: (v: string) => void;
}) {
  const baseMod = getModNum(score);
  const totalBonus = isProficient
    ? (bonusOverride && bonusOverride !== "0" ? baseMod + Number(bonusOverride) : baseMod + pb)
    : undefined;
  return (
    <div className="rounded-xl bg-[#0c0d15] border border-white/[0.04] p-2.5 text-center">
      <span className="text-[9px] uppercase tracking-wider text-gold-400/50 font-bold">{label}</span>
      <div className="flex items-center justify-center gap-1.5 mt-1">
        <label className="flex items-center gap-1 cursor-pointer">
          <input
            type="checkbox"
            checked={isProficient}
            onChange={() => { onToggle(!isProficient); if (isProficient) onBonusChange(""); }}
            className="rounded w-3 h-3 border-surface-600 bg-surface-800 accent-gold-500"
          />
          <span className={`text-[8px] ${isProficient ? "text-gold-400" : "text-surface-600"}`}>Prof</span>
        </label>
        {isProficient && (
          <input
            value={bonusOverride}
            onChange={(e) => onBonusChange(e.target.value)}
            placeholder={"+0"}
            className="w-10 px-1 py-0.5 rounded text-[9px] bg-[#07080d] border border-white/[0.06] text-white/60 text-center focus:outline-none focus:border-gold/25"
          />
        )}
      </div>
      {isProficient && (
        <span className="text-[10px] font-bold text-cyan-400 block mt-0.5">
          {(totalBonus ?? 0) >= 0 ? "+" : ""}{totalBonus}
        </span>
      )}
    </div>
  );
}
