/**
 * STᚱ VTT — Concentration Check Popover (Sprint 24)
 *
 * A premium popover that appears when a concentrating combatant
 * takes damage during combat. Auto-computes the concentration DC
 * (max of 10 or half the damage taken) and provides a one-click
 * concentration check with animation.
 *
 * Also used to SET concentration (spell name + DC override) when
 * the DM clicks the concentration badge on a combatant row.
 *
 * 5e RAW Concentration Rules (PHB pg. 203):
 *   - Casting a spell that requires concentration: mark as concentrating
 *   - Taking damage: DC = max(10, half damage taken)
 *   - Failing the save: concentration breaks
 *   - Being incapacitated/killed: concentration breaks automatically
 *
 * Integration: Called from InitiativeCombatantRow when DM applies
 * damage to a combatant with isConcentrating=true OR when DM clicks
 * the concentration badge to set/manage concentration.
 */

import { useState, useCallback, useEffect, useRef } from "react";
import PremiumIcon from "@/components/ui/PremiumIcon";
import type { Combatant } from "@/types";

// ── Types ──

export interface ConcentrationCheckPopoverProps {
  /** The combatant taking the concentration check */
  combatant: Combatant;
  /** Amount of damage taken (0 if just setting concentration) */
  damageAmount: number;
  /** Whether to show the "Set Concentration" UI instead of a check */
  mode: "check" | "set_initial";
  /** Called when concentration is set (spell name) */
  onSetConcentration: (combatantId: string, spellName: string, dcOverride?: number) => void;
  /** Called when concentration breaks */
  onBreakConcentration: (combatantId: string) => void;
  /** Called to close the popover */
  onClose: () => void;
  /** Position reference for popover placement */
  anchorRect?: DOMRect;
}

// ── Helpers ──

function computeConcentrationDC(damage: number): number {
  return Math.max(10, Math.floor(damage / 2));
}

function computeConMod(combatant: Combatant): number {
  // Estimate CON mod from name/type if not directly available
  // In a full system, this would read from the character's CON score
  return 0;
}

/**
 * Simulates a d20 concentration check.
 * Returns { roll, total, dc, passed }
 */
function makeConcentrationCheck(
  damage: number,
  conMod: number
): { roll: number; total: number; dc: number; passed: boolean } {
  const roll = Math.floor(Math.random() * 20) + 1;
  const dc = computeConcentrationDC(damage);
  const total = roll + conMod;
  return { roll, total, dc, passed: total >= dc };
}

// ── Main Component ──

export default function ConcentrationCheckPopover({
  combatant,
  damageAmount,
  mode,
  onSetConcentration,
  onBreakConcentration,
  onClose,
  anchorRect,
}: ConcentrationCheckPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [animPhase, setAnimPhase] = useState<"entering" | "idle" | "exiting">("entering");
  const [checkResult, setCheckResult] = useState<{
    roll: number;
    total: number;
    dc: number;
    passed: boolean;
  } | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [spellName, setSpellName] = useState("");
  const [dcOverride, setDCOverride] = useState<number>(10);
  const [showOverride, setShowOverride] = useState(false);

  // Entrance animation
  useEffect(() => {
    const t = setTimeout(() => setAnimPhase("idle"), 50);
    return () => clearTimeout(t);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setAnimPhase("exiting");
        setTimeout(onClose, 150);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // Close on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setAnimPhase("exiting");
        setTimeout(onClose, 150);
      }
    };
    const t = setTimeout(() => document.addEventListener("mousedown", handleClick), 100);
    return () => {
      clearTimeout(t);
      document.removeEventListener("mousedown", handleClick);
    };
  }, [onClose]);

  const handleRollCheck = useCallback(() => {
    setIsRolling(true);
    const conMod = computeConMod(combatant);

    setTimeout(() => {
      const result = makeConcentrationCheck(damageAmount, conMod);
      setCheckResult(result);
      setIsRolling(false);

      if (!result.passed) {
        // Auto-break concentration on failed save after a brief delay
        setTimeout(() => {
          onBreakConcentration(combatant.id);
        }, 1200);
      }
    }, 500);
  }, [damageAmount, combatant, onBreakConcentration]);

  const handleSetSpell = useCallback(() => {
    if (spellName.trim()) {
      onSetConcentration(combatant.id, spellName.trim(), showOverride ? dcOverride : undefined);
    }
  }, [spellName, dcOverride, showOverride, combatant.id, onSetConcentration]);

  const conMod = computeConMod(combatant);
  const dc = computeConcentrationDC(damageAmount);
  const isAtZero = combatant.hitPoints.current <= 0;

  // Position
  const top = anchorRect ? anchorRect.bottom + 8 : 200;
  const left = anchorRect ? Math.max(8, Math.min(anchorRect.left, window.innerWidth - 340)) : 200;

  return (
    <div
      ref={popoverRef}
      className="fixed z-50 w-[320px] select-none"
      style={{
        top: `${top}px`,
        left: `${left}px`,
        animation: animPhase === "exiting"
          ? "fade-out 0.15s ease-out forwards"
          : "slide-in-up 0.25s ease-out both",
      }}
    >
      {/* Glass card */}
      <div className="relative bg-gradient-to-b from-[#1a1c2a]/95 to-[#0f101a]/98 backdrop-blur-2xl border border-white/[0.06] rounded-2xl shadow-2xl overflow-hidden">
        {/* Edge light */}
        <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-violet-500/25 to-transparent pointer-events-none" />

        {/* Directional glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/[0.015] via-transparent to-gold-500/[0.01] pointer-events-none" />

        <div className="relative z-[1] p-4 space-y-3">
          {/* ── Header ── */}
          <div className="flex items-center justify-between" style={{ animation: "slide-in-up 0.2s ease-out both" }}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/15 flex items-center justify-center">
                <PremiumIcon name="sparkles" className="w-4 h-4 text-violet-400" />
              </div>
              <div>
                <span className="text-xs font-bold text-surface-200">Concentration</span>
                <span className="block text-[9px] text-surface-500">{combatant.name}</span>
              </div>
            </div>
            <button
              onClick={() => { setAnimPhase("exiting"); setTimeout(onClose, 150); }}
              className="shrink-0 p-1 rounded-lg hover:bg-white/[0.06] text-surface-500 hover:text-surface-200 transition-all duration-200 active:scale-90"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* ── Mode: Set Initial Concentration ── */}
          {mode === "set_initial" && (
            <div className="space-y-2.5" style={{ animation: "slide-in-up 0.2s ease-out 0.04s both" }}>
              <div>
                <label className="text-[9px] uppercase tracking-wider text-surface-500 font-medium block mb-1">
                  Spell Name
                </label>
                <input
                  type="text"
                  value={spellName}
                  onChange={(e) => setSpellName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSetSpell();
                    if (e.key === "Escape") onClose();
                  }}
                  placeholder="e.g. Haste, Spirit Guardians, Fly..."
                  className="w-full px-3 py-2 rounded-xl text-xs bg-[#0c0d15] border border-violet-500/25 text-violet-300 placeholder:text-surface-600 focus:outline-none focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/20 transition-all duration-200"
                  autoFocus
                />
              </div>

              {/* DC Override toggle */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowOverride(!showOverride)}
                  className={`text-[8px] px-2 py-1 rounded-lg font-bold border transition-all duration-150 ${
                    showOverride
                      ? "bg-violet-500/10 border-violet-500/20 text-violet-400"
                      : "bg-white/[0.03] border-white/[0.06] text-surface-500 hover:text-surface-400"
                  }`}
                >
                  {showOverride ? "✓ Override DC" : "Override DC"}
                </button>
                {showOverride && (
                  <input
                    type="number"
                    value={dcOverride}
                    onChange={(e) => setDCOverride(Math.max(8, Math.min(30, parseInt(e.target.value) || 10)))}
                    className="w-14 px-2 py-1 rounded-lg text-[10px] font-mono bg-[#0c0d15] border border-violet-500/20 text-violet-300 text-center focus:outline-none focus:border-violet-500/30"
                    min={8}
                    max={30}
                  />
                )}
              </div>

              {/* Rules text */}
              <p className="text-[8px] text-surface-600 italic leading-relaxed">
                The caster must maintain concentration to sustain this spell.
                Taking damage requires a CON save: DC = max(10, damage/2).
              </p>

              {/* Action buttons */}
              <div className="flex gap-1.5">
                <button
                  onClick={handleSetSpell}
                  disabled={!spellName.trim()}
                  className="flex-1 px-3 py-2 rounded-xl text-[9px] font-bold bg-violet-500/12 text-violet-400 border border-violet-500/20 hover:bg-violet-500/20 hover:border-violet-500/30 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all duration-150"
                >
                  Start Concentration
                </button>
                <button
                  onClick={() => { setAnimPhase("exiting"); setTimeout(onClose, 150); }}
                  className="px-3 py-2 rounded-xl text-[9px] font-bold bg-white/[0.03] text-surface-500 border border-white/[0.06] hover:text-surface-300 active:scale-[0.98] transition-all duration-150"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* ── Mode: Concentration Check (from damage) ── */}
          {mode === "check" && !checkResult && (
            <div style={{ animation: "slide-in-up 0.2s ease-out 0.04s both" }}>
              {/* Damage Info */}
              <div className="p-2.5 rounded-xl bg-violet-500/5 border border-violet-500/10 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-surface-500">Damage taken</span>
                  <span className="text-xs font-bold text-rose-400">{damageAmount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-surface-500">Concentration DC</span>
                  <span className="text-xs font-bold text-violet-400">{dc}</span>
                </div>
                {conMod !== 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-surface-500">CON modifier</span>
                    <span className="text-xs font-bold text-gold-400">{conMod > 0 ? `+${conMod}` : conMod}</span>
                  </div>
                )}
              </div>

              {/* Rules note */}
              <p className="text-[8px] text-surface-600 italic mt-2 mb-3">
                DC = max(10, half damage). Roll d20 + CON mod ≥ DC to maintain.
              </p>

              {/* Roll button */}
              <button
                onClick={handleRollCheck}
                disabled={isRolling || isAtZero}
                className="w-full px-3 py-2.5 rounded-xl text-[9px] font-bold bg-gradient-to-r from-violet-500/12 to-amber-500/8 text-violet-400 border border-violet-500/20 hover:from-violet-500/20 hover:to-amber-500/12 hover:border-violet-500/30 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2"
              >
                {isRolling ? (
                  <>
                    <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Rolling Save...
                  </>
                ) : (
                  <>
                    <span>🎲</span> Roll Concentration Save
                  </>
                )}
              </button>

              {/* Auto-fail notice */}
              {isAtZero && (
                <p className="text-[8px] text-rose-400/70 mt-1 text-center">
                  Unconscious — concentration broken automatically
                </p>
              )}
            </div>
          )}

          {/* ── Roll Result ── */}
          {checkResult && (
            <div style={{ animation: "slide-in-up 0.2s ease-out both" }}>
              {/* Result card */}
              <div className={`p-3 rounded-xl border ${
                checkResult.passed
                  ? "bg-emerald-500/8 border-emerald-500/15"
                  : "bg-rose-500/8 border-rose-500/15"
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{checkResult.passed ? "✅" : "❌"}</span>
                  <div>
                    <span className={`text-xs font-bold ${checkResult.passed ? "text-emerald-400" : "text-rose-400"}`}>
                      {checkResult.passed ? "Concentration Maintained!" : "Concentration Broken!"}
                    </span>
                    <p className="text-[8px] text-surface-600">
                      Rolled {checkResult.roll} + {conMod} = {checkResult.total} vs DC {checkResult.dc}
                    </p>
                  </div>
                </div>

                {/* Die face visualization */}
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                    checkResult.passed
                      ? "bg-emerald-500/10 border-emerald-500/20"
                      : "bg-rose-500/10 border-rose-500/20"
                  }`}>
                    <span className={`text-sm font-bold font-mono ${checkResult.passed ? "text-emerald-400" : "text-rose-400"}`}>
                      {checkResult.roll}
                    </span>
                  </div>
                  <span className="text-[9px] text-surface-500">
                    {checkResult.roll >= 20 ? "Natural 20!" :
                     checkResult.roll <= 1 ? "Natural 1..." :
                     `d20 + ${conMod} = ${checkResult.total}`}
                  </span>
                </div>
              </div>

              {/* Close button */}
              <button
                onClick={() => { setAnimPhase("exiting"); setTimeout(onClose, 150); }}
                className="w-full mt-2 px-3 py-2 rounded-xl text-[9px] font-bold bg-white/[0.03] text-surface-500 border border-white/[0.06] hover:text-surface-300 active:scale-[0.98] transition-all duration-150"
              >
                {checkResult.passed ? "Continue" : "Close (Concentration Broken)"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
