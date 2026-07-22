/**
 * STᚱ VTT — Inline Stats Editor (Overrrides-Grade Premium)
 *
 * Cycle 40: Consolidated 5.5e stats editing panel.
 * Overrrides/Ventriloc-grade unified stat card with:
 * - HP management (current, max, temporary, quick presets)
 * - XP management (add/award, level progress bar)
 * - Currency quick overview (tap to open full currency bar)
 * - Premium glass gradient with staggered entrance
 * - All mutations Firestore-synced via useInventoryMutations
 *   and useCharacterMutations hooks
 *
 * Replaces: Individual HP/XP/currency inline editors
 * (PlayerSheetPersistentStats XP section was deprecated)
 *
 * Campaign: Arkla — Wendy Swiftfoot, Kehrfuffle Ironheart
 */

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import type { PlayerCharacter } from "@/types";
import { useInventoryMutations } from "@/hooks/useCharacterMutations";
import { useCampaignStore } from "@/stores/campaignStore";
import { getProficiencyBonus } from "@/lib/mechanics/character-derivations";
import InventoryCurrencyBar from "./InventoryCurrencyBar";

interface InlineStatsEditorProps {
  character: PlayerCharacter;
  /** Class name for positioning */
  className?: string;
}

export default function InlineStatsEditor({ character, className = "" }: InlineStatsEditorProps) {
  const updateCharacter = useCampaignStore((s) => s.updateCharacter);
  const { handleSetCurrency } = useInventoryMutations();

  // ── Local state ──
  const [showHpInput, setShowHpInput] = useState(false);
  const [showXpInput, setShowXpInput] = useState(false);
  const [showCurrency, setShowCurrency] = useState(false);
  const [hpInputValue, setHpInputValue] = useState("");
  const [xpInputValue, setXpInputValue] = useState("");
  const [flashMessage, setFlashMessage] = useState<string | null>(null);

  const hpInputRef = useRef<HTMLInputElement>(null);
  const xpInputRef = useRef<HTMLInputElement>(null);

  // ── Derived stats ──
  const hp = character.hitPoints || { current: 0, max: 44, temporary: 0 };
  const xp = character.experiencePoints || 0;
  const level = character.level || 1;
  const pb = getProficiencyBonus(level);
  const hpPercent = hp.max > 0 ? (hp.current / hp.max) * 100 : 0;
  const tempHP = hp.temporary || 0;

  // XP thresholds (5.5e RAW)
  const xpThresholds = [0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000];
  const currentLevel = level;
  const nextLevelExp = xpThresholds[currentLevel] || xpThresholds[xpThresholds.length - 1];
  const currentLevelExp = currentLevel > 1 ? (xpThresholds[currentLevel - 1] || 0) : 0;
  const xpProgress = nextLevelExp > currentLevelExp ? ((xp - currentLevelExp) / (nextLevelExp - currentLevelExp)) * 100 : 0;

  // ── Focus management ──
  useEffect(() => {
    if (showHpInput && hpInputRef.current) { hpInputRef.current.focus(); hpInputRef.current.select(); }
  }, [showHpInput]);
  useEffect(() => {
    if (showXpInput && xpInputRef.current) { xpInputRef.current.focus(); xpInputRef.current.select(); }
  }, [showXpInput]);

  // ── Flash message ──
  const flash = useCallback((msg: string) => {
    setFlashMessage(msg);
    setTimeout(() => setFlashMessage(null), 2000);
  }, []);

  // ── HP mutations ──
  const applyHp = useCallback((delta: number) => {
    const newCurrent = Math.max(0, Math.min(hp.max, hp.current + delta));
    updateCharacter(character.id, { hitPoints: { ...hp, current: newCurrent } } as Partial<PlayerCharacter>);
    const label = delta > 0 ? `+${delta} HP` : `${delta} HP`;
    flash(`❤️ ${label}`);
  }, [character.id, hp, updateCharacter, flash]);

  const applySetHp = useCallback(() => {
    const val = parseInt(hpInputValue);
    if (!isNaN(val) && val >= 0 && val <= hp.max) {
      updateCharacter(character.id, { hitPoints: { ...hp, current: val } } as Partial<PlayerCharacter>);
      flash(`❤️ Set HP to ${val}`);
    }
    setShowHpInput(false);
  }, [character.id, hp, hpInputValue, updateCharacter, flash]);

  const applyTempHp = useCallback((delta: number) => {
    const newTemp = Math.max(0, (hp.temporary || 0) + delta);
    updateCharacter(character.id, { hitPoints: { ...hp, temporary: newTemp } } as Partial<PlayerCharacter>);
    flash(`🛡️ THP ${delta > 0 ? `+${delta}` : delta}`);
  }, [character.id, hp, updateCharacter, flash]);

  // ── XP mutations ──
  const applyXp = useCallback((amount: number) => {
    const newXp = Math.max(0, (character.experiencePoints || 0) + amount);
    updateCharacter(character.id, { experiencePoints: newXp } as Partial<PlayerCharacter>);
    flash(`⭐ +${amount} XP`);
    setShowXpInput(false);
  }, [character.id, character.experiencePoints, updateCharacter, flash]);

  const applySetXp = useCallback(() => {
    const val = parseInt(xpInputValue);
    if (!isNaN(val) && val >= 0) {
      updateCharacter(character.id, { experiencePoints: val } as Partial<PlayerCharacter>);
      flash(`⭐ Set XP to ${val}`);
    }
    setShowXpInput(false);
  }, [character.id, xpInputValue, updateCharacter, flash]);

  // ── HP tier color ──
  const hpColor = hpPercent > 75 ? "from-emerald-500 to-emerald-400" :
    hpPercent > 50 ? "from-emerald-400 to-emerald-300" :
    hpPercent > 25 ? "from-amber-500 to-amber-400" :
    hpPercent > 0 ? "from-red-500 to-red-400" : "from-rose-500 to-rose-400";

  const hpStatusLabel = hpPercent > 75 ? "Healthy" : hpPercent > 50 ? "Scratched" : hpPercent > 25 ? "Bloodied" : hpPercent > 0 ? "Critical" : "Down";

  return (
    <div className={`relative rounded-xl bg-gradient-to-b from-[#14151f]/90 to-[#0f1019]/95 border border-white/[0.04] overflow-hidden ${className}`}>
      {/* Gold edge light */}
      <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-gold-500/20 to-transparent pointer-events-none" />

      {/* Flash message */}
      {flashMessage && (
        <div className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-surface-800/80 backdrop-blur-sm border border-white/[0.04] text-[9px] text-surface-300 z-10 animate-in slide-in-from-right-1 duration-200">
          {flashMessage}
        </div>
      )}

      <div className="p-3 space-y-3">

        {/* ── HP Section ── */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-widest font-black text-gold-500/60">Hit Points</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => { setShowHpInput(true); setHpInputValue(String(hp.current)); }}
                className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-surface-800/40 border border-surface-700/20 text-surface-500 hover:text-surface-300 hover:bg-surface-800/60 transition-all active:scale-95"
              >
                Set
              </button>
              {tempHP > 0 && (
                <button
                  onClick={() => applyTempHp(0)}
                  className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-amber-500/10 border border-amber-500/10 text-amber-400 hover:text-amber-300 transition-all active:scale-95"
                  title="Clear temp HP"
                >
                  Clear THP
                </button>
              )}
            </div>
          </div>

          {/* HP stat card */}
          <div className="relative p-3 rounded-xl bg-surface-900/60 border border-white/[0.03] overflow-hidden group hover:border-gold/10 transition-all duration-200"
            onClick={() => { setShowHpInput(!showHpInput); if (!showHpInput) setHpInputValue(String(hp.current)); }}
          >
            {/* HP bar background */}
            <div className="absolute inset-0 opacity-10">
              <div
                className={`h-full w-full bg-gradient-to-r ${hpColor} transition-all duration-500`}
                style={{ width: `${hpPercent}%` }}
              />
            </div>

            <div className="relative z-10 flex items-center justify-between">
              {/* HP numbers */}
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-black tabular-nums text-white/90">
                  {showHpInput ? (
                    <input
                      ref={hpInputRef}
                      type="number"
                      value={hpInputValue}
                      onChange={(e) => setHpInputValue(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") applySetHp(); if (e.key === "Escape") setShowHpInput(false); }}
                      onBlur={() => setShowHpInput(false)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-16 bg-surface-800/60 border border-gold/15 rounded-lg px-2 py-0.5 text-center text-sm font-bold text-surface-100 focus:outline-none focus:border-gold/30 tabular-nums"
                      min={0}
                      max={hp.max}
                    />
                  ) : (
                    hp.current
                  )}
                </span>
                <span className="text-lg font-black text-surface-500 tabular-nums">/</span>
                <span className="text-lg font-black tabular-nums text-surface-200">{hp.max}</span>
                {tempHP > 0 && (
                  <span className="text-[10px] font-bold text-amber-300 tabular-nums ml-1">
                    (+{tempHP} THP)
                  </span>
                )}
              </div>

              {/* Status badge */}
              <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                hpPercent > 75 ? "text-emerald-400 bg-emerald-500/10" :
                hpPercent > 50 ? "text-emerald-300 bg-emerald-500/8" :
                hpPercent > 25 ? "text-amber-400 bg-amber-500/10" :
                hpPercent > 0 ? "text-red-400 bg-red-500/10" : "text-rose-400 bg-rose-500/10"
              }`}>
                {hpStatusLabel}
              </span>
            </div>

            {/* HP bar */}
            <div className="mt-2 h-2 rounded-full bg-surface-800/60 overflow-hidden">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${hpColor} transition-all duration-500 shadow-[0_0_4px_rgba(16,185,129,0.2)]`}
                style={{ width: `${Math.max(hpPercent, 0)}%` }}
              />
            </div>

            {/* Temp HP overlay bar */}
            {tempHP > 0 && (
              <div className="mt-0.5 h-1 rounded-full bg-amber-500/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500/40 to-amber-400/30 transition-all duration-500"
                  style={{ width: `${Math.min(100, (tempHP / 44) * 100)}%` }}
                />
              </div>
            )}
          </div>

          {/* HP quick presets + temp HP controls */}
          <div className="flex items-center gap-1 flex-wrap">
            {/* Damage buttons */}
            <span className="text-[7px] uppercase text-rose-500/50 tracking-wider font-semibold mr-0.5">DMG</span>
            {[10, 5, 1].map((amt) => (
              <button
                key={`dmg-${amt}`}
                onClick={() => { setShowHpInput(false); applyHp(-amt); }}
                className="px-2 py-1 rounded-lg text-[9px] font-bold bg-gradient-to-r from-rose-500/10 to-rose-600/5 border border-rose-500/15 text-rose-400 hover:from-rose-500/15 hover:to-rose-600/10 active:scale-90 transition-all duration-150"
              >
                -{amt}
              </button>
            ))}
            <span className="w-px h-4 bg-surface-700/30 mx-0.5" />
            {/* Heal buttons */}
            <span className="text-[7px] uppercase text-emerald-500/50 tracking-wider font-semibold mr-0.5">HEAL</span>
            {[1, 5, 10].map((amt) => (
              <button
                key={`heal-${amt}`}
                onClick={() => { setShowHpInput(false); applyHp(amt); }}
                className="px-2 py-1 rounded-lg text-[9px] font-bold bg-gradient-to-r from-emerald-500/10 to-green-500/5 border border-emerald-500/15 text-emerald-400 hover:from-emerald-500/15 hover:to-green-500/10 active:scale-90 transition-all duration-150"
              >
                +{amt}
              </button>
            ))}
            <span className="w-px h-4 bg-surface-700/30 mx-0.5" />
            {/* Full Heal */}
            <button
              onClick={() => { setShowHpInput(false); applyHp(hp.max); }}
              className="px-2 py-1 rounded-lg text-[8px] font-bold bg-gradient-to-r from-emerald-500/15 to-green-500/10 border border-emerald-500/20 text-emerald-300 hover:from-emerald-500/20 hover:to-green-500/15 active:scale-90 transition-all duration-150"
            >
              Full
            </button>
            {/* Temp HP presets */}
            <button
              onClick={() => { setShowHpInput(false); applyTempHp(5); }}
              className="px-2 py-1 rounded-lg text-[8px] font-bold bg-gradient-to-r from-amber-500/10 to-amber-600/5 border border-amber-500/15 text-amber-400 hover:from-amber-500/15 hover:to-amber-600/10 active:scale-90 transition-all duration-150"
            >
              +5 THP
            </button>
            <button
              onClick={() => { setShowHpInput(false); applyTempHp(10); }}
              className="px-2 py-1 rounded-lg text-[8px] font-bold bg-gradient-to-r from-amber-500/10 to-amber-600/5 border border-amber-500/15 text-amber-400 hover:from-amber-500/15 hover:to-amber-600/10 active:scale-90 transition-all duration-150"
            >
              +10 THP
            </button>
          </div>
        </div>

        {/* ── Divider ── */}
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" />

        {/* ── XP Section ── */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-widest font-black text-gold-500/60">
              Experience
            </span>
            <span className="text-[8px] text-surface-600 tabular-nums">
              Lv.{level} · PB +{pb}
            </span>
          </div>

          {/* XP stat card */}
          <div
            className="relative p-3 rounded-xl bg-surface-900/60 border border-white/[0.03] cursor-pointer group hover:border-gold/10 transition-all duration-200"
            onClick={() => { setShowXpInput(!showXpInput); if (!showXpInput) setXpInputValue(String(xp)); }}
          >
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-baseline gap-1.5">
                {showXpInput ? (
                  <input
                    ref={xpInputRef}
                    type="number"
                    value={xpInputValue}
                    onChange={(e) => setXpInputValue(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") applySetXp(); if (e.key === "Escape") setShowXpInput(false); }}
                    onBlur={() => setShowXpInput(false)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-24 bg-surface-800/60 border border-gold/15 rounded-lg px-2 py-0.5 text-center text-xs font-bold text-surface-100 focus:outline-none focus:border-gold/30 tabular-nums"
                    min={0}
                  />
                ) : (
                  <span className="text-sm font-black tabular-nums text-gold-300">{xp.toLocaleString()}</span>
                )}
                <span className="text-[10px] text-surface-500">/ {nextLevelExp.toLocaleString()} XP</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[8px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded tabular-nums">
                  +{nextLevelExp - xp >= 0 ? (nextLevelExp - xp).toLocaleString() : 0} to next
                </span>
              </div>
            </div>

            {/* XP progress bar */}
            <div className="mt-2 h-1.5 rounded-full bg-surface-800/60 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500/40 via-gold-500/50 to-amber-400/40 transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, xpProgress))}%` }}
              />
            </div>
          </div>

          {/* XP quick presets */}
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-[7px] uppercase text-gold-500/50 tracking-wider font-semibold mr-0.5">Award</span>
            {[50, 100, 200, 500, 1000, 2500].map((amt) => (
              <button
                key={`xp-${amt}`}
                onClick={() => { setShowXpInput(false); applyXp(amt); }}
                className="px-2 py-1 rounded-lg text-[8px] font-bold bg-gradient-to-b from-gold-500/10 to-amber-500/5 border border-gold/15 text-gold-400 hover:from-gold-500/15 hover:to-amber-500/10 active:scale-90 transition-all duration-150"
              >
                +{amt}
              </button>
            ))}
          </div>
        </div>

        {/* ── Divider ── */}
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" />

        {/* ── Currency Section (compact preview) ── */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-widest font-black text-gold-500/60">Currency</span>
            <button
              onClick={() => setShowCurrency(!showCurrency)}
              className="text-[8px] text-gold-500/50 hover:text-gold-400 transition-colors active:scale-95"
            >
              {showCurrency ? "Collapse ▲" : "Details ▼"}
            </button>
          </div>

          {/* Compact coin display */}
          <div className="grid grid-cols-5 gap-1.5">
            {[
              { label: "AS", key: "assarions" as const, color: "text-amber-400", icon: "🪙" },
              { label: "QD", key: "quadrants" as const, color: "text-surface-300", icon: "🥈" },
              { label: "LP", key: "leptons" as const, color: "text-amber-600", icon: "🟤" },
            ].map((coin) => (
              <div
                key={coin.key}
                className="flex flex-col items-center py-2 rounded-xl bg-gradient-to-b from-white/[0.02] to-transparent border border-white/[0.04]"
              >
                <span className="text-[7px] uppercase font-bold text-gold-500/50 mb-0.5 tracking-wider">
                  {coin.icon} {coin.label}
                </span>
                <span className={`text-sm font-bold tabular-nums ${coin.color}`}>
                  {(character.currency || {})[coin.key] || 0}
                </span>
              </div>
            ))}
          </div>

          {/* Expanded currency editor */}
          {showCurrency && (
            <div className="animate-in slide-in-from-top-1 duration-200">
              <InventoryCurrencyBar
                currency={character.currency || { leptons: 0, quadrants: 0, assarions: 0 }}
                characterId={character.id}
                character={character}
              />
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
