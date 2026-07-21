/**
 * STᚱ VTT — Player Sheet Persistent Stats Bar (Refactored)
 *
 * Orchestrator — BELOW header and ABOVE tab content on ALL tabs.
 * Shows core resources that matter every session:
 *   AC · HP (expandable → DMG/HEAL controls + death saves) · XP · Init · Speed · PB+Insp
 *
 * Refactored Sprint 1: Uses sub-components CharacterStatBadge, CharacterHpGauge,
 *   ExperienceGauge, DeathSavesCompact — all <80 lines each.
 * All mutations → Zustand + Firestore via centralized hooks.
 * 44px+ touch targets. Zero purple tokens.
 */

import { useState, useCallback } from "react";
import type { PlayerCharacter } from "@/types";
import { computeAllDerivations } from "@/lib/mechanics/character-derivations";
import { useHpMutations, useXpMutations, useInspirationMutation } from "@/hooks/useCharacterMutations";
import CharacterStatBadge from "./CharacterStatBadge";
import CharacterHpGauge from "./CharacterHpGauge";
import ExperienceGauge from "./ExperienceGauge";
import DeathSavesCompact from "./DeathSavesCompact";

function modStr(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

interface PlayerSheetPersistentStatsProps {
  character: PlayerCharacter;
}

export default function PlayerSheetPersistentStats({ character }: PlayerSheetPersistentStatsProps) {
  const c = character;
  const derived = computeAllDerivations(c);

  const [showHpControls, setShowHpControls] = useState(false);
  const [showXpControls, setShowXpControls] = useState(false);

  const { handleHpChange, handleDeathSaveToggle, handleResetDeathSaves } = useHpMutations();
  const { handleAddXp } = useXpMutations();
  const { handleToggleInspiration } = useInspirationMutation();

  const isAtZero = c.hitPoints.current <= 0;

  const onHpChange = useCallback(
    (delta: number) => handleHpChange(c, delta),
    [c, handleHpChange]
  );

  return (
    <div className="shrink-0 px-3 pt-2 pb-2 border-b border-gold/8 bg-obsidian/70 backdrop-blur-sm">
      {/* ── TOP ROW: 7-column stat grid ── */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {/* AC — Large, prominent gold */}
        <CharacterStatBadge
          label="AC"
          value={derived.ac}
          variant="gold"
        />

        {/* HP — Tappable, col-span-2 */}
        <div
          onClick={() => { setShowHpControls(!showHpControls); setShowXpControls(false); }}
          className="flex flex-col items-center justify-center bg-surface-800/50 rounded-xl border border-surface-700/30 py-2 cursor-pointer active:scale-95 transition-all duration-150 col-span-2 relative overflow-hidden"
        >
          <span className="text-[8px] uppercase tracking-widest font-black text-surface-500">HP</span>
          <span className="text-xl font-black tabular-nums leading-none mt-0.5 text-surface-100">
            {isAtZero ? (
              <span className="text-surface-500 italic">0</span>
            ) : (
              c.hitPoints.current
            )}
            <span className="text-surface-500 font-bold text-sm">/{c.hitPoints.max}</span>
            {(c.temporaryHitPoints || 0) > 0 && (
              <span className="text-gold-400 text-[10px] ml-0.5">+{c.temporaryHitPoints}t</span>
            )}
          </span>
        </div>

        {/* XP — Tappable, premium Overrrides-grade gold stat */}
        <div
          onClick={() => { setShowXpControls(!showXpControls); setShowHpControls(false); }}
          className="flex flex-col items-center justify-center bg-gradient-to-br from-amber-500/8 to-gold-500/5 rounded-xl border border-gold/15 py-2 cursor-pointer active:scale-[0.97] transition-all duration-150 relative overflow-hidden group"
        >
          {/* Hover glow */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-gold-500/[0.03] via-transparent to-amber-500/[0.03]" />
          {/* Edge light on hover */}
          <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-gold-500/0 group-hover:via-gold-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300" />
          
          {c.level < 20 && (
            <div
              className="absolute bottom-0 left-0 h-[3px] bg-gradient-to-r from-amber-600 via-amber-500 to-gold-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, c.level < 20 ? (c.experiencePoints / (c.level * 1000)) * 100 : 100)}%` }}
            />
          )}
          <span className="text-[8px] uppercase tracking-widest font-black text-amber-400/60">XP</span>
          <span className="text-sm font-black tabular-nums leading-none mt-0.5 text-amber-300">
            {c.experiencePoints.toLocaleString()}
          </span>
          {/* Next level hint */}
          {c.level < 20 && (
            <span className="text-[6px] text-amber-500/30 mt-0.5 tabular-nums">
              / {(c.level * 1000).toLocaleString()} next
            </span>
          )}
        </div>

        {/* Initiative */}
        <CharacterStatBadge
          label="Init"
          value={modStr(derived.initiative)}
        />

        {/* Speed */}
        <CharacterStatBadge
          label="Speed"
          value={`${Math.max(0, derived.speed.walk - derived.encumbrance.speedReduction)}ft`}
        />

        {/* PB + Inspiration */}
        <div className="flex flex-col items-center justify-center bg-surface-800/40 rounded-xl border border-surface-700/20 py-2 gap-0">
          <span className="text-[8px] uppercase tracking-widest font-black text-gold-500/50">PB</span>
          <div className="flex items-center gap-1">
            <span className="text-lg font-black tabular-nums leading-none text-gold-300">+{derived.proficiencyBonus}</span>
            <button
              onClick={(e) => { e.stopPropagation(); handleToggleInspiration(c); }}
              className={`text-base leading-none transition-all duration-200 active:scale-90 ${
                c.inspiration ? "text-gold-400 drop-shadow-[0_0_4px_rgba(234,179,8,0.4)]" : "text-surface-600 hover:text-surface-400"
              }`}
            >
              ✦
            </button>
          </div>
        </div>
      </div>

      {/* ── EXPANDABLE HP CONTROLS ── */}
      {showHpControls && (
        <div className="animate-slide-in-up space-y-1.5 mb-1">
          <CharacterHpGauge character={c} onHpChange={onHpChange} showControls />

          {/* Level + XP info for context */}
          <div className="flex items-center justify-between px-0.5">
            <span className="text-[9px] text-surface-500">Level {c.level}</span>
            {c.level < 20 && (
              <span className="text-[9px] text-surface-500">
                {Math.max(0, (c.level * 1000) - c.experiencePoints).toLocaleString()} XP to level {c.level + 1}
              </span>
            )}
            {c.level >= 20 && (
              <span className="text-[9px] text-gold-400 font-semibold">✦ MAX LEVEL</span>
            )}
          </div>

          {/* DMG section */}
          <div>
            <span className="text-[8px] uppercase tracking-widest font-bold text-red-400/60 block mb-1">Damage</span>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => onHpChange(-1)}
                className="py-2.5 rounded-lg bg-red-500/15 border border-red-500/20 text-red-400 text-sm font-bold active:scale-90 transition-all duration-150 hover:bg-red-500/25"
              >−1 DMG</button>
              <button
                onClick={() => onHpChange(-5)}
                className="py-2.5 rounded-lg bg-red-500/12 border border-red-500/15 text-red-400/80 text-sm font-bold active:scale-90 transition-all duration-150 hover:bg-red-500/20"
              >−5 DMG</button>
            </div>
          </div>

          {/* HEAL section */}
          <div>
            <span className="text-[8px] uppercase tracking-widest font-bold text-green-400/60 block mb-1">Healing</span>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => onHpChange(1)}
                className="py-2.5 rounded-lg bg-green-500/15 border border-green-500/20 text-green-400 text-sm font-bold active:scale-90 transition-all duration-150 hover:bg-green-500/25"
              >+1 HEAL</button>
              <button
                onClick={() => onHpChange(5)}
                className="py-2.5 rounded-lg bg-green-500/12 border border-green-500/15 text-green-400/80 text-sm font-bold active:scale-90 transition-all duration-150 hover:bg-green-500/20"
              >+5 HEAL</button>
            </div>
          </div>

          {/* Custom HP Input */}
          <HpCustomInput onApply={onHpChange} />

          {/* Death Saves — only when HP = 0 */}
          <DeathSavesCompact
            character={c}
            onToggle={(type, index) => handleDeathSaveToggle(c, type, index)}
            onReset={() => handleResetDeathSaves(c)}
          />
        </div>
      )}

      {/* ── EXPANDABLE XP CONTROLS ── */}
      {showXpControls && (
        <div className="animate-slide-in-up mb-1">
          <ExperienceGauge character={c} onAddXp={(amount) => handleAddXp(c, amount)} expandable />
        </div>
      )}

      {/* ── Tap hints ── */}
      {!showHpControls && !showXpControls && (
        <div className="flex items-center justify-center gap-3">
          <span className="text-[7px] uppercase tracking-widest text-surface-500">Tap HP to manage HP</span>
          <span className="text-[7px] uppercase tracking-widest text-surface-600">·</span>
          <span className="text-[7px] uppercase tracking-widest text-surface-500">Tap XP to add XP</span>
        </div>
      )}
    </div>
  );
}

/* ── Inline sub-component for custom HP input ── */
function HpCustomInput({ onApply }: { onApply: (delta: number) => void }) {
  const [value, setValue] = useState("");

  const handleSubmit = () => {
    const val = parseInt(value, 10);
    if (isNaN(val)) return;
    onApply(val);
    setValue("");
  };

  return (
    <div>
      <span className="text-[8px] uppercase tracking-widest font-bold text-gold-400/60 block mb-1">Custom Amount</span>
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
          placeholder="+ or − value"
          className="flex-1 py-2.5 px-2 text-[11px] bg-obsidian-mid/60 border border-surface-700/30 rounded-lg text-surface-200 placeholder-surface-600 focus:outline-none focus:border-gold/30 focus:ring-1 focus:ring-gold/20 transition-all"
        />
        <button
          onClick={handleSubmit}
          className="px-5 py-2.5 bg-gold-500/10 border border-gold/20 text-gold-400 text-[11px] font-semibold rounded-lg active:scale-90 transition-all duration-150 hover:bg-gold-500/15"
        >Apply</button>
      </div>
    </div>
  );
}
