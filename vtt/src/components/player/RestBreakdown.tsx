/**
 * STᚱ VTT — Rest Breakdown Component
 *
 * Interactive rest modal showing what will be restored before committing.
 * Supports Short Rest (spend hit dice, recharge resources) and Long Rest (full).
 *
 * Features:
 *   - Slide-down sheet with 5e rest rules
 *   - Hit dice selector with live HP preview
 *   - Resource recovery preview
 *   - Spell slot recovery preview
 *   - One-click Short Rest / Long Rest buttons
 *   - Arcane Recovery toggle for wizards
 */

import { useState, useMemo, useCallback } from "react";
import type { HitPoints, SpellSlots } from "@/types/character-core";
import type { PlayerCharacter } from "@/types/character";
import {
  computeShortRestSummary,
  computeLongRestSummary,
  applyShortRest,
  applyLongRest,
  computeAvailableHitDice,
  computeHitDiceTotal,
  computeHitDieType,
} from "@/lib/mechanics/rest-engine";
import { useCampaignStore } from "@/stores/campaignStore";

interface RestBreakdownProps {
  /** The character to rest */
  character: PlayerCharacter;
  /** Called when the sheet closes */
  onClose: () => void;
  /** Rest type to show initially */
  initialMode?: "short" | "long";
}

type RestMode = "short" | "long";

export default function RestBreakdown({ character, onClose, initialMode = "short" }: RestBreakdownProps) {
  const updateCharacter = useCampaignStore((s) => s.updateCharacter);
  const [mode, setMode] = useState<RestMode>(initialMode);
  const [hitDiceToSpend, setHitDiceToSpend] = useState(0);
  const [isApplying, setIsApplying] = useState(false);
  const [confirmLong, setConfirmLong] = useState(false);

  const availHd = useMemo(() => computeAvailableHitDice(character), [character]);
  const totalHd = useMemo(() => computeHitDiceTotal(character), [character]);
  const hitDieType = useMemo(() => computeHitDieType(character), [character]);

  const shortSummary = useMemo(
    () => computeShortRestSummary(character, { hitDiceToSpend, availableHitDice: availHd }),
    [character, hitDiceToSpend, availHd]
  );

  const longSummary = useMemo(
    () => computeLongRestSummary(character),
    [character]
  );

  // ── Short Rest apply ──
  const handleShortRest = useCallback(() => {
    setIsApplying(true);
    const updates = applyShortRest(character, { hitDiceToSpend });
    updateCharacter(character.id, updates as Partial<PlayerCharacter>);
    setIsApplying(false);
    onClose();
  }, [character, hitDiceToSpend, updateCharacter, onClose]);

  // ── Long Rest apply ──
  const handleLongRest = useCallback(() => {
    if (!confirmLong) {
      setConfirmLong(true);
      return;
    }
    setIsApplying(true);
    const updates = applyLongRest(character);
    updateCharacter(character.id, updates as Partial<PlayerCharacter>);
    setIsApplying(false);
    onClose();
  }, [character, confirmLong, updateCharacter, onClose]);

  // ── Hit dice input ──
  const handleHdChange = useCallback(
    (delta: number) => {
      setHitDiceToSpend((prev) => {
        const next = prev + delta;
        return Math.max(0, Math.min(next, availHd));
      });
    },
    [availHd]
  );

  const conMod = useMemo(
    () => Math.floor((character.constitution - 10) / 2),
    [character.constitution]
  );

  // Average heal per die (used for display only — actual heal from engine)
  const avgHealPerDie = useMemo(
    () => Math.max(1, Math.floor(hitDieType / 2) + 1 + conMod),
    [hitDieType, conMod]
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <div className="relative w-full max-w-md mx-auto bg-gradient-to-b from-[#181a2a]/[0.98] to-[#0c0d15]/[0.99] border border-white/[0.06] rounded-t-2xl shadow-[0_-8px_40px_rgba(0,0,0,0.5)] max-h-[85vh] overflow-y-auto">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-white/[0.12]" />
        </div>

        {/* ── HEADER ── */}
        <div className="px-5 pb-3 border-b border-white/[0.04]">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold text-gold-300 flex items-center gap-2">
              <span>🛏️</span> Rest &amp; Recovery
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center text-surface-500 hover:text-surface-300 transition-colors"
            >
              ✕
            </button>
          </div>
          <p className="text-xs text-surface-500">
            Choose a rest type to restore HP, spell slots, and class resources.
          </p>
        </div>

        {/* ── MODE TOGGLE ── */}
        <div className="flex gap-2 px-5 py-3">
          <button
            onClick={() => { setMode("short"); setHitDiceToSpend(0); setConfirmLong(false); }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
              mode === "short"
                ? "bg-gold-500/10 text-gold-400 border border-gold/20 shadow-[0_0_8px_rgba(234,179,8,0.08)]"
                : "bg-white/[0.03] text-surface-500 border border-white/[0.06] hover:bg-white/[0.06]"
            }`}
          >
            ⏳ Short Rest
          </button>
          <button
            onClick={() => { setMode("long"); setConfirmLong(false); }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
              mode === "long"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.08)]"
                : "bg-white/[0.03] text-surface-500 border border-white/[0.06] hover:bg-white/[0.06]"
            }`}
          >
            🌙 Long Rest
          </button>
        </div>

        {mode === "short" ? (
          /* ════════════════════════════════════════════ SHORT REST ═══ */
          <div className="px-5 pb-5 space-y-4">
            {/* Info card */}
            <div className="rounded-xl bg-amber-500/5 border border-amber-500/15 p-3">
              <p className="text-[10px] text-amber-400/80 leading-relaxed">
                A short rest takes <strong className="text-amber-300">1 hour</strong>. You may spend Hit Dice to recover HP.
                Class resources with short-rest recharge are restored. Cantrips and features are unaffected.
              </p>
            </div>

            {/* Hit Dice selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-surface-400">
                  🎲 Hit Dice to Spend
                </span>
                <span className="text-[10px] text-surface-500">
                  d{hitDieType} × {availHd}/{totalHd} available
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleHdChange(-1)}
                  disabled={hitDiceToSpend <= 0}
                  className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-surface-400 hover:text-surface-200 hover:bg-white/[0.08] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  −
                </button>
                <div className="flex-1 h-10 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                  <span className="text-lg font-bold tabular-nums text-gold-300">{hitDiceToSpend}</span>
                </div>
                <button
                  onClick={() => handleHdChange(1)}
                  disabled={hitDiceToSpend >= availHd}
                  className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-surface-400 hover:text-surface-200 hover:bg-white/[0.08] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  +
                </button>
                <button
                  onClick={() => setHitDiceToSpend(availHd)}
                  disabled={availHd <= 0}
                  className="px-3 py-2 rounded-xl text-[9px] font-bold uppercase tracking-wider bg-gold-500/8 text-gold-500/70 border border-gold/10 hover:bg-gold-500/12 transition-all disabled:opacity-30"
                >
                  Max
                </button>
              </div>
              <div className="flex items-center gap-1.5 text-[9px] text-surface-500">
                <span>Avg heal per die: <strong className="text-emerald-400">{avgHealPerDie}</strong></span>
                <span className="text-surface-700">·</span>
                <span>CON: {conMod >= 0 ? `+${conMod}` : conMod}</span>
              </div>
            </div>

            {/* Recovery preview */}
            <div className="rounded-xl bg-obsidian-mid/40 border border-surface-700/20 divide-y divide-surface-700/10">
              {/* HP heal */}
              <div className="flex items-center justify-between p-3">
                <span className="text-xs text-surface-300">❤️ HP Recovery</span>
                <span className="text-sm font-bold tabular-nums text-emerald-400">
                  +{shortSummary.hpHealed}
                  <span className="text-[10px] font-normal text-surface-500 ml-1">
                    / {character.hitPoints.max - character.hitPoints.current} missing
                  </span>
                </span>
              </div>

              {/* Temp HP */}
              {character.temporaryHitPoints > 0 && (
                <div className="flex items-center justify-between p-3">
                  <span className="text-xs text-surface-300">🛡️ Temp HP</span>
                  <span className="text-xs text-amber-400">Cleared</span>
                </div>
              )}

              {/* Resources */}
              {shortSummary.resourcesRecharged.length > 0 ? (
                <div className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-surface-300">⚡ Resources Recharged</span>
                    <span className="text-[10px] text-emerald-400">{shortSummary.resourcesRecharged.length} restored</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {shortSummary.resourcesRecharged.map((name) => (
                      <span
                        key={name}
                        className="px-1.5 py-0.5 rounded text-[8px] font-medium bg-emerald-500/8 text-emerald-400 border border-emerald-500/15"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-3">
                  <span className="text-[10px] text-surface-600">No short-rest resources to recharge</span>
                </div>
              )}
            </div>

            {/* Apply button */}
            <button
              onClick={handleShortRest}
              disabled={isApplying || (hitDiceToSpend <= 0 && shortSummary.resourcesRecharged.length === 0)}
              className={`w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                isApplying
                  ? "bg-gold-500/20 text-gold-600"
                  : "bg-gold-500/10 border border-gold/20 text-gold-400 hover:bg-gold-500/15 hover:shadow-[0_0_12px_rgba(234,179,8,0.08)] active:scale-[0.98]"
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              {isApplying ? "Resting..." : `Take Short Rest`}
            </button>

            {/* Note */}
            <p className="text-[9px] text-surface-600 text-center">
              You may take one short rest per hour. Arcane Recovery available once per day.
            </p>
          </div>
        ) : (
          /* ════════════════════════════════════════════ LONG REST ════ */
          <div className="px-5 pb-5 space-y-4">
            {/* Info card */}
            <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/15 p-3">
              <p className="text-[10px] text-emerald-400/80 leading-relaxed">
                A long rest takes <strong className="text-emerald-300">8 hours</strong>. You regain all HP, all spell slots,
                recover half your Hit Dice (min 1), and recharge all class resources.
              </p>
            </div>

            {/* Recovery preview */}
            <div className="rounded-xl bg-obsidian-mid/40 border border-surface-700/20 divide-y divide-surface-700/10">
              {/* HP */}
              <div className="flex items-center justify-between p-3">
                <span className="text-xs text-surface-300">❤️ HP</span>
                <span className="text-sm font-bold tabular-nums text-emerald-400">
                  +{longSummary.hpHealed}
                  <span className="text-[10px] font-normal text-surface-500 ml-1">
                    → {character.hitPoints.max}/{character.hitPoints.max}
                  </span>
                </span>
              </div>

              {/* Hit Dice */}
              <div className="flex items-center justify-between p-3">
                <span className="text-xs text-surface-300">🎲 Hit Dice Recovered</span>
                <span className="text-sm font-bold tabular-nums text-gold-400">
                  +{longSummary.hitDiceRecovered}
                  <span className="text-[10px] font-normal text-surface-500 ml-1">
                    / {longSummary.hitDiceTotal}
                  </span>
                </span>
              </div>

              {/* Resources */}
              {longSummary.resourcesRecharged.length > 0 && (
                <div className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-surface-300">⚡ All Resources Recharged</span>
                    <span className="text-[10px] text-emerald-400">{longSummary.resourcesRecharged.length} restored</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {longSummary.resourcesRecharged.map((name) => (
                      <span
                        key={name}
                        className="px-1.5 py-0.5 rounded text-[8px] font-medium bg-emerald-500/8 text-emerald-400 border border-emerald-500/15"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Spell slots */}
              {Object.keys(longSummary.slotsRestored).length > 0 && (
                <div className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-surface-300">✨ Spell Slots Restored</span>
                    <span className="text-[10px] text-emerald-400">{Object.keys(longSummary.slotsRestored).length} levels</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(longSummary.slotsRestored).map(([level, count]) => (
                      <span
                        key={level}
                        className="px-1.5 py-0.5 rounded text-[8px] font-medium bg-violet-500/8 text-violet-400 border border-violet-500/15"
                      >
                        Lv.{level} ({count})
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Temp HP */}
              {character.temporaryHitPoints > 0 && (
                <div className="flex items-center justify-between p-3">
                  <span className="text-xs text-surface-300">🛡️ Temp HP</span>
                  <span className="text-xs text-amber-400">Cleared</span>
                </div>
              )}
            </div>

            {/* Confirm + Apply */}
            {confirmLong ? (
              <div className="rounded-xl bg-rose-500/8 border border-rose-500/20 p-3 space-y-2">
                <p className="text-[10px] text-rose-400/80">
                  This will fully restore your character. Are you sure the party has taken a full 8-hour rest?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleLongRest}
                    disabled={isApplying}
                    className="flex-1 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold uppercase tracking-wider hover:bg-rose-500/15 active:scale-[0.98] transition-all disabled:opacity-40"
                  >
                    {isApplying ? "Resting..." : "✅ Confirm Long Rest"}
                  </button>
                  <button
                    onClick={() => setConfirmLong(false)}
                    className="py-2.5 px-4 rounded-xl bg-white/[0.04] border border-white/[0.06] text-surface-400 text-xs hover:text-surface-200 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={handleLongRest}
                disabled={isApplying}
                className={`w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                  isApplying
                    ? "bg-emerald-500/20 text-emerald-600"
                    : "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/15 hover:shadow-[0_0_12px_rgba(16,185,129,0.08)] active:scale-[0.98]"
                } disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                {isApplying ? "Resting..." : "🌙 Take Long Rest"}
              </button>
            )}

            <p className="text-[9px] text-surface-600 text-center">
              You may take one long rest per 24-hour period.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
