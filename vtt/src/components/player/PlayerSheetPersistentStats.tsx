/**
 * STᚱ VTT — Player Sheet Persistent Stats Bar
 *
 * Renders BELOW the header and ABOVE the tab content on ALL tabs.
 * Shows core resources that matter every session regardless of tab:
 *   AC · HP (expandable → DMG/HEAL controls + death saves) · XP · Init · Speed · PB+Insp
 *
 * Refactored for Cycle 1: ALL mutations now route through useCharacterMutations hook,
 * which writes to BOTH Zustand (instant) and Firestore (real-time sync).
 *
 * XP is here because players track XP advancement across sessions,
 * no matter what tab they're on — it's a persistent character resource.
 * 44px+ touch targets, swipeable tabs, no horizontal overflow.
 */

import { useState, useCallback } from "react";
import type { PlayerCharacter } from "@/types";
import { computeAllDerivations } from "@/lib/mechanics/character-derivations";
import { useHpMutations, useXpMutations, useInspirationMutation } from "@/hooks/useCharacterMutations";

function modStr(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

interface PlayerSheetPersistentStatsProps {
  character: PlayerCharacter;
}

export default function PlayerSheetPersistentStats({ character }: PlayerSheetPersistentStatsProps) {
  const c = character;
  const derived = computeAllDerivations(c);

  // ── State ──
  const [hpInput, setHpInput] = useState("");
  const [showHpControls, setShowHpControls] = useState(false);
  const [xpInput, setXpInput] = useState("");
  const [showXpControls, setShowXpControls] = useState(false);

  // ── Mutations (writes to Zustand + Firestore) ──
  const { handleHpChange, handleDeathSaveToggle, handleResetDeathSaves } = useHpMutations();
  const { handleAddXp } = useXpMutations();
  const { handleToggleInspiration } = useInspirationMutation();

  // ── Derived Values ──
  const hpRatio = c.hitPoints.max > 0 ? c.hitPoints.current / c.hitPoints.max : 1;
  const hasTemp = (c.temporaryHitPoints || 0) > 0;
  const isAtZero = c.hitPoints.current <= 0;
  const isDead = isAtZero && c.deathSaves.failures >= 3;
  const hpColor = isAtZero ? "bg-surface-600" : hpRatio > 0.5 ? "bg-green-500" : hpRatio > 0.25 ? "bg-amber-500" : "bg-red-500";

  const xpForNext = c.level < 20 ? c.level * 1000 : 0;
  const xpProgress = c.level < 20 ? Math.min(100, (c.experiencePoints / xpForNext) * 100) : 100;
  const xpToNext = Math.max(0, xpForNext - c.experiencePoints);

  // ── Handlers ──
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

  const onDeathSaveToggle = useCallback(
    (type: "successes" | "failures", index: number) => handleDeathSaveToggle(c, type, index),
    [c, handleDeathSaveToggle]
  );

  const onResetDeathSaves = useCallback(
    () => handleResetDeathSaves(c),
    [c, handleResetDeathSaves]
  );

  const onInspirationToggle = useCallback(
    () => handleToggleInspiration(c),
    [c, handleToggleInspiration]
  );

  const onXpAdd = useCallback(
    (amount: number) => handleAddXp(c, amount),
    [c, handleAddXp]
  );

  const onXpInput = useCallback(() => {
    const val = parseInt(xpInput, 10);
    if (isNaN(val) || val <= 0) return;
    onXpAdd(val);
    setXpInput("");
  }, [xpInput, onXpAdd]);

  return (
    <div className="shrink-0 px-3 pt-2 pb-2 border-b border-gold/8 bg-obsidian/70 backdrop-blur-sm">
      {/* ── TOP ROW: AC | HP | XP | Init | Speed | PB+Insp ── */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {/* AC — Large & Prominent */}
        <div
          onClick={() => { setShowHpControls(false); setShowXpControls(false); }}
          className="flex flex-col items-center justify-center bg-gold-500/10 rounded-xl border border-gold/20 py-2 cursor-default transition-all duration-150"
        >
          <span className="text-[8px] uppercase tracking-widest font-black text-gold-500/60">AC</span>
          <span className="text-xl font-black tabular-nums leading-none mt-0.5 text-gold-200 drop-shadow-[0_0_6px_rgba(234,179,8,0.08)]">
            {derived.ac}
          </span>
        </div>

        {/* HP — Tappable to expand controls */}
        <div
          onClick={() => { setShowHpControls(!showHpControls); setShowXpControls(false); }}
          className="flex flex-col items-center justify-center bg-surface-800/50 rounded-xl border border-surface-700/30 py-2 cursor-pointer active:scale-95 transition-all duration-150 col-span-2 relative overflow-hidden"
        >
          <div
            className={`absolute bottom-0 left-0 h-[3px] ${hpColor} rounded-full transition-all duration-500`}
            style={{ width: `${isAtZero ? 0 : Math.max(0, hpRatio * 100)}%` }}
          />
          <span className="text-[8px] uppercase tracking-widest font-black text-surface-500">HP</span>
          <span className="text-xl font-black tabular-nums leading-none mt-0.5 text-surface-100">
            {isAtZero ? (
              <span className="text-surface-500 italic">0</span>
            ) : (
              c.hitPoints.current
            )}
            <span className="text-surface-500 font-bold text-sm">/{c.hitPoints.max}</span>
            {hasTemp && <span className="text-gold-400 text-[10px] ml-0.5">+{c.temporaryHitPoints}t</span>}
          </span>
        </div>

        {/* XP — Tappable to expand controls */}
        <div
          onClick={() => { setShowXpControls(!showXpControls); setShowHpControls(false); }}
          className="flex flex-col items-center justify-center bg-gold-500/8 rounded-xl border border-gold/15 py-2 cursor-pointer active:scale-95 transition-all duration-150 relative overflow-hidden"
        >
          {c.level < 20 && (
            <div
              className="absolute bottom-0 left-0 h-[3px] bg-amber-400/50 rounded-full transition-all duration-500"
              style={{ width: `${xpProgress}%` }}
            />
          )}
          <span className="text-[8px] uppercase tracking-widest font-black text-amber-400/60">XP</span>
          <span className="text-sm font-black tabular-nums leading-none mt-0.5 text-amber-300">
            {c.experiencePoints.toLocaleString()}
          </span>
        </div>

        {/* Initiative */}
        <div className="flex flex-col items-center justify-center bg-surface-800/40 rounded-xl border border-surface-700/20 py-2">
          <span className="text-[8px] uppercase tracking-widest font-black text-gold-500/50">Init</span>
          <span className="text-xl font-black tabular-nums leading-none mt-0.5 text-gold-200">{modStr(derived.initiative)}</span>
        </div>

        {/* Speed */}
        <div className="flex flex-col items-center justify-center bg-surface-800/40 rounded-xl border border-surface-700/20 py-2">
          <span className="text-[8px] uppercase tracking-widest font-black text-gold-500/50">Speed</span>
          <span className="text-xl font-black tabular-nums leading-none mt-0.5 text-gold-200">
            {derived.speed.walk - derived.encumbrance.speedReduction}
            <span className="text-surface-500 text-xs">ft</span>
          </span>
        </div>

        {/* Proficiency Bonus + Inspiration */}
        <div className="flex flex-col items-center justify-center bg-surface-800/40 rounded-xl border border-surface-700/20 py-2 gap-0">
          <span className="text-[8px] uppercase tracking-widest font-black text-gold-500/50">PB</span>
          <div className="flex items-center gap-1">
            <span className="text-lg font-black tabular-nums leading-none text-gold-300">+{derived.proficiencyBonus}</span>
            <button
              onClick={(e) => { e.stopPropagation(); onInspirationToggle(); }}
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
          {/* HP Bar (full) */}
          <div className="h-3 bg-surface-700/60 rounded-full overflow-hidden relative shadow-inner">
            <div
              className={`h-full ${hpColor} rounded-full transition-all duration-500 ${isDead ? "animate-pulse-soft" : ""}`}
              style={{ width: `${isAtZero ? 0 : Math.max(0, hpRatio * 100)}%` }}
            />
            {hasTemp && c.hitPoints.current > 0 && (
              <div
                className="absolute top-0 h-full bg-gold-500/30 rounded-full transition-all duration-500"
                style={{
                  left: `${Math.min(100, hpRatio * 100)}%`,
                  width: `${Math.min(100 - hpRatio * 100, ((c.temporaryHitPoints || 0) / c.hitPoints.max) * 100)}%`,
                }}
              />
            )}
          </div>

          {/* Level indicator */}
          <div className="flex items-center justify-between px-0.5">
            <span className="text-[9px] text-surface-500">Level {c.level}</span>
            {c.level < 20 ? (
              <span className="text-[9px] text-surface-500">{xpToNext.toLocaleString()} XP to level {c.level + 1}</span>
            ) : (
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

          {/* Custom Input */}
          <div>
            <span className="text-[8px] uppercase tracking-widest font-bold text-gold-400/60 block mb-1">Custom Amount</span>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                value={hpInput}
                onChange={(e) => setHpInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") onHpInput(); }}
                placeholder="+ or − value"
                className="flex-1 py-2.5 px-2 text-[11px] bg-obsidian-mid/60 border border-surface-700/30 rounded-lg text-surface-200 placeholder-surface-600 focus:outline-none focus:border-gold/30 focus:ring-1 focus:ring-gold/20 transition-all"
              />
              <button
                onClick={onHpInput}
                className="px-5 py-2.5 bg-gold-500/10 border border-gold/20 text-gold-400 text-[11px] font-semibold rounded-lg active:scale-90 transition-all duration-150 hover:bg-gold-500/15"
              >Apply</button>
            </div>
          </div>

          {/* ── CONDITIONAL DEATH SAVES ── Only when HP = 0 */}
          {isAtZero && (
            <div className="pt-2 border-t border-red-500/15 animate-slide-in-up">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] uppercase tracking-widest font-black text-red-400/80">Death Saves</span>
                  {isDead && (
                    <span className="text-[9px] uppercase font-bold text-red-400 animate-pulse-soft">☠ DEAD</span>
                  )}
                </div>
                <button
                  onClick={onResetDeathSaves}
                  className="text-[9px] text-surface-500 hover:text-gold-400 transition-colors px-1.5 py-0.5 rounded border border-surface-700/30 hover:border-gold/20"
                >Reset</button>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <span className="text-[8px] uppercase tracking-wider text-green-500/60 block mb-0.5">Successes</span>
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <button
                        key={`s-${i}`}
                        onClick={() => onDeathSaveToggle("successes", i)}
                        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all duration-200 active:scale-90 ${
                          c.deathSaves.successes > i
                            ? "bg-green-500/20 border-green-500/50 text-green-400"
                            : "bg-obsidian-mid/60 border-surface-700/30 text-surface-600 hover:border-green-500/30"
                        }`}
                      >
                        {c.deathSaves.successes > i ? "✓" : "○"}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex-1">
                  <span className="text-[8px] uppercase tracking-wider text-red-400/60 block mb-0.5">Failures</span>
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <button
                        key={`f-${i}`}
                        onClick={() => onDeathSaveToggle("failures", i)}
                        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all duration-200 active:scale-90 ${
                          c.deathSaves.failures > i
                            ? "bg-red-500/20 border-red-500/50 text-red-400"
                            : "bg-obsidian-mid/60 border-surface-700/30 text-surface-600 hover:border-red-500/30"
                        }`}
                      >
                        {c.deathSaves.failures > i ? "✕" : "○"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── EXPANDABLE XP CONTROLS ── */}
      {showXpControls && (
        <div className="animate-slide-in-up space-y-1.5 mb-1">
          {/* XP Bar */}
          {c.level < 20 && (
            <div className="h-3 bg-surface-700/60 rounded-full overflow-hidden relative shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-gold-500 to-amber-400 rounded-full transition-all duration-500"
                style={{ width: `${xpProgress}%` }}
              />
            </div>
          )}

          {/* XP presets */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onXpAdd(50)}
              className="flex-1 py-2 rounded-lg bg-gold-500/10 border border-gold/15 text-gold-400 text-xs font-bold active:scale-90 transition-all duration-150 hover:bg-gold-500/15"
            >+50 XP</button>
            <button
              onClick={() => onXpAdd(100)}
              className="flex-1 py-2 rounded-lg bg-gold-500/12 border border-gold/15 text-gold-400/90 text-xs font-bold active:scale-90 transition-all duration-150 hover:bg-gold-500/15"
            >+100 XP</button>
            <button
              onClick={() => onXpAdd(250)}
              className="flex-1 py-2 rounded-lg bg-gold-500/8 border border-gold/10 text-gold-300/80 text-xs font-bold active:scale-90 transition-all duration-150 hover:bg-gold-500/12"
            >+250 XP</button>
          </div>

          {/* Custom XP Input */}
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              value={xpInput}
              onChange={(e) => setXpInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") onXpInput(); }}
              placeholder="Custom XP amount"
              className="flex-1 py-2.5 px-2 text-[11px] bg-obsidian-mid/60 border border-surface-700/30 rounded-lg text-surface-200 placeholder-surface-600 focus:outline-none focus:border-gold/30 focus:ring-1 focus:ring-gold/20 transition-all"
            />
            <button
              onClick={onXpInput}
              className="px-5 py-2.5 bg-gold-500/10 border border-gold/20 text-gold-400 text-[11px] font-semibold rounded-lg active:scale-90 transition-all duration-150 hover:bg-gold-500/15"
            >Add XP</button>
          </div>
        </div>
      )}

      {/* Tap hints */}
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
