/**
 * STᚱ VTT — Enemy Quick Create (Premium Glass)
 *
 * Compact form for DMs to quickly create NPC/monster entries
 * without leaving the Encounters page.
 *
 * Features:
 *   - Glass gradient modal with gold edge light + corner ornaments
 *   - Minimal 5-field form: name, type, size, CR, AC, HP
 *   - Auto-computed AC/HP from CR selection
 *   - Live preview card showing AC/HP/CR/size/type
 *   - Staggered entrance via animate-in classes
 *
 * Replaced `glass-gold` with direct glass gradient.
 */

import { useState, useCallback } from "react";
import type { EnemyDoc, CreatureType, CreatureSize } from "@/types";

interface EnemyQuickCreateProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (enemy: EnemyDoc) => void;
}

const CREATURE_TYPES: CreatureType[] = [
  "Aberration", "Beast", "Celestial", "Construct", "Dragon",
  "Elemental", "Fey", "Fiend", "Giant", "Humanoid",
  "Monstrosity", "Ooze", "Plant", "Undead", "Custom",
];

const SIZES: CreatureSize[] = ["Tiny", "Small", "Medium", "Large", "Huge", "Gargantuan"];

const CR_OPTIONS = [0, 0.125, 0.25, 0.5, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 16, 18, 20];

function crToAvgHp(cr: number): number {
  if (cr <= 0) return 8;
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

export default function EnemyQuickCreate({ isOpen, onClose, onCreated }: EnemyQuickCreateProps) {
  const [name, setName] = useState("");
  const [creatureType, setCreatureType] = useState<CreatureType>("Humanoid");
  const [size, setSize] = useState<CreatureSize>("Medium");
  const [cr, setCr] = useState<number>(1);
  const [ac, setAc] = useState(crToAvgAc(1));
  const [hp, setHp] = useState(crToAvgHp(1));

  const handleCrChange = useCallback((newCr: number) => {
    setCr(newCr);
    setAc(crToAvgAc(newCr));
    setHp(crToAvgHp(newCr));
  }, []);

  const handleCreate = useCallback(() => {
    if (!name.trim()) return;

    const enemy: EnemyDoc = {
      id: `enemy_${Date.now()}`,
      name: name.trim(),
      type: creatureType,
      size,
      armorClass: ac,
      hitPoints: { current: hp, max: hp, temporary: 0 },
      speed: 30,
      abilities: { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 },
      savingThrows: {},
      skills: {},
      damageVulnerabilities: [],
      damageResistances: [],
      damageImmunities: [],
      conditionImmunities: [],
      senses: "",
      languages: "",
      challengeRating: cr,
      isHomebrew: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    onCreated(enemy);
    onClose();
  }, [name, creatureType, size, cr, ac, hp, onCreated, onClose]);

  const isValid = name.trim().length > 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="relative bg-gradient-to-b from-[#14151f]/95 to-[#0f1019]/90 border border-gold-500/15 rounded-2xl w-full max-w-sm mx-4 overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.55),0_8px_24px_rgba(0,0,0,0.3)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gold edge light */}
        <div className="absolute top-0 left-[15%] right-[15%] h-px bg-gradient-to-r from-transparent via-gold-500/30 to-transparent" />
        <div className="corner-ornament corner-tl corner-gold" />
        <div className="corner-ornament corner-tr corner-gold" />

        {/* Header */}
        <div className="shrink-0 px-4 py-3 border-b border-gold-500/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">👾</span>
              <h2 className="text-sm font-black text-gold-400 tracking-tight">Quick Monster</h2>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-surface-500 hover:text-surface-200 hover:bg-gold-500/10 active:scale-90 transition-all"
            >
              ✕
            </button>
          </div>
          <p className="text-[10px] text-surface-500 mt-0.5">Create a quick NPC for this encounter</p>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3">
          {/* Name */}
          <div>
            <label className="block text-[9px] uppercase tracking-widest font-black text-gold-500/60 mb-1">
              Monster Name <span className="text-rose-400">*</span>
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Goblin"
              className="w-full bg-[#07080d]/70 border border-white/[0.06] rounded-lg px-3 py-2 text-xs text-surface-200 placeholder-surface-600 focus:outline-none focus:border-gold-500/25 focus:ring-1 focus:ring-gold-500/15 transition-all"
              autoFocus
            />
          </div>

          {/* Type + Size row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[9px] uppercase tracking-widest font-black text-gold-500/60 mb-1">Type</label>
              <select
                value={creatureType}
                onChange={(e) => setCreatureType(e.target.value as CreatureType)}
                className="w-full bg-[#07080d]/70 border border-white/[0.06] rounded-lg px-2.5 py-2 text-xs text-surface-200 focus:outline-none focus:border-gold-500/25 focus:ring-1 focus:ring-gold-500/15 appearance-none cursor-pointer transition-all"
              >
                {CREATURE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[9px] uppercase tracking-widest font-black text-gold-500/60 mb-1">Size</label>
              <select
                value={size}
                onChange={(e) => setSize(e.target.value as CreatureSize)}
                className="w-full bg-[#07080d]/70 border border-white/[0.06] rounded-lg px-2.5 py-2 text-xs text-surface-200 focus:outline-none focus:border-gold-500/25 focus:ring-1 focus:ring-gold-500/15 appearance-none cursor-pointer transition-all"
              >
                {SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* CR + AC + HP row */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[9px] uppercase tracking-widest font-black text-gold-500/60 mb-1">CR</label>
              <select
                value={cr}
                onChange={(e) => handleCrChange(parseFloat(e.target.value))}
                className="w-full bg-[#07080d]/70 border border-white/[0.06] rounded-lg px-2 py-2 text-xs text-surface-200 focus:outline-none focus:border-gold-500/25 focus:ring-1 focus:ring-gold-500/15 appearance-none cursor-pointer transition-all"
              >
                {CR_OPTIONS.map((v) => (
                  <option key={v} value={v}>{v < 1 ? (v === 0 ? "0" : v === 0.125 ? "1/8" : v === 0.25 ? "1/4" : "1/2") : v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[9px] uppercase tracking-widest font-black text-gold-500/60 mb-1">AC</label>
              <input
                type="number"
                value={ac}
                onChange={(e) => setAc(Math.max(1, parseInt(e.target.value) || 10))}
                className="w-full bg-[#07080d]/70 border border-white/[0.06] rounded-lg px-2.5 py-2 text-xs text-surface-200 focus:outline-none focus:border-gold-500/25 focus:ring-1 focus:ring-gold-500/15 transition-all"
              />
            </div>
            <div>
              <label className="block text-[9px] uppercase tracking-widest font-black text-gold-500/60 mb-1">HP</label>
              <input
                type="number"
                value={hp}
                onChange={(e) => setHp(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-[#07080d]/70 border border-white/[0.06] rounded-lg px-2.5 py-2 text-xs text-surface-200 focus:outline-none focus:border-gold-500/25 focus:ring-1 focus:ring-gold-500/15 transition-all"
              />
            </div>
          </div>

          {/* Auto-computed preview */}
          <div className="rounded-lg bg-gradient-to-br from-gold-500/8 to-amber-500/5 border border-gold-500/15 p-2.5">
            <div className="flex items-center gap-4 text-[10px]">
              <span className="text-surface-500">Auto: <span className="text-cyan-300 font-semibold">{ac} AC</span></span>
              <span className="text-surface-500">· <span className="text-green-400 font-semibold">{hp} HP</span></span>
              <span className="text-surface-500">· CR <span className="text-gold-400 font-semibold">{cr}</span></span>
              <span className="text-surface-500">· <span className="text-surface-300">{size} {creatureType}</span></span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 px-4 py-3 border-t border-gold-500/10 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-[10px] font-semibold text-surface-400 hover:text-surface-200 border border-white/[0.06] hover:border-white/[0.12] active:scale-95 transition-all duration-150"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!isValid}
            className="px-4 py-1.5 rounded-lg text-[10px] font-bold bg-gradient-to-br from-gold-500/12 to-amber-500/8 border border-gold-500/20 text-gold-400 hover:from-gold-500/20 hover:to-amber-500/12 active:scale-95 transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Create & Add
          </button>
        </div>
      </div>
    </div>
  );
}
