/**
 * STᚱ VTT — Token HP Popover (Premium Lusion Edition)
 *
 * Rapid DM token HP manipulation tool — instant popover on token click.
 * Allows the DM to adjust HP without opening the full token inspector.
 *
 * Features:
 * - Premium floating glass card with edge light + directional glow
 * - Token icon, label, type badge (player/enemy/npc)
 * - Large color-coded HP bar with fraction display
 * - Quick HP buttons: -10/-5/+5/+10 + custom input
 * - Temp HP display with gold accent
 * - Status effect indicator dots
 * - Enter animation (slide-in-up + fade)
 * - Auto-closes when clicking outside or pressing Escape
 * - Staggered entrance for sub-elements
 * - Consistent with premium design system glass tokens
 *
 * Architecture: Standalone popover that overlays the canvas.
 * Triggered by DmControlCenter when a token is clicked.
 * Writes HP changes immediately to Zustand → Firestore.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useCombatStore } from "@/stores/combatStore";
import { useCampaignStore } from "@/stores/campaignStore";
import AttackResolutionPopover from "@/components/encounters/AttackResolutionPopover";
import type { MapToken, PlayerCharacter } from "@/types";

// ── Type Definitions ──

export interface TokenHpPopoverProps {
  /** The token to display HP for */
  token: MapToken;
  /** Map ID (required for store writes) */
  mapId: string;
  /** Position relative to canvas container */
  position: { top: number; left: number };
  /** Called when popover wants to close */
  onClose: () => void;
  /** Called when HP is changed (updates store) */
  onHpChange: (tokenId: string, current: number, max: number) => void;
}

// ── HP Color Helper ──

function getHpColor(ratio: number): string {
  if (ratio > 0.75) return "text-emerald-400";
  if (ratio > 0.5) return "text-emerald-300";
  if (ratio > 0.25) return "text-amber-400";
  if (ratio > 0) return "text-red-400";
  return "text-rose-500";
}

function getHpBarColor(ratio: number): string {
  if (ratio > 0.75) return "bg-emerald-500";
  if (ratio > 0.5) return "bg-emerald-400";
  if (ratio > 0.25) return "bg-amber-500";
  if (ratio > 0) return "bg-red-500";
  return "bg-rose-500";
}

function getStatusLabel(current: number, max: number): string {
  const ratio = max > 0 ? current / max : 1;
  if (current <= 0 && max > 0) return "Dead";
  if (ratio <= 0.25) return "Critical";
  if (ratio <= 0.5) return "Bloodied";
  if (ratio <= 0.75) return "Injured";
  if (current < max) return "Scratched";
  return "Healthy";
}

function getStatusColor(ratio: number): string {
  if (ratio <= 0) return "text-rose-500";
  if (ratio <= 0.25) return "text-red-400";
  if (ratio <= 0.5) return "text-amber-400";
  if (ratio <= 0.75) return "text-emerald-300";
  return "text-emerald-400";
}

// ── Type Icon Map ──

const TYPE_ICONS: Record<string, string> = {
  player: "🛡️",
  enemy: "👹",
  npc: "🧙",
  custom: "✦",
};

// ── Main Component ──

export default function TokenHpPopover({
  token,
  mapId: _mapId,
  position,
  onClose,
  onHpChange,
}: TokenHpPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [hpCurrent, setHpCurrent] = useState(token.hp?.current ?? 0);
  const [hpMax, setHpMax] = useState(token.hp?.max ?? 1);
  const [customInput, setCustomInput] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const [animPhase, setAnimPhase] = useState<"entering" | "idle" | "exiting">("entering");
  const [showAttackPopover, setShowAttackPopover] = useState(false);

  // Combat store
  const activeEncounter = useCombatStore((s) => s.activeEncounter);
  const combatants = activeEncounter?.combatants ?? [];

  // Find matching combatant for this token
  const matchingCombatant = combatants.find(
    (c) => c.name.toLowerCase() === token.label.toLowerCase()
  ) || null;

  // ── Death Save tracking for player tokens at 0 HP ──
  const [deathSaveSuccesses, setDeathSaveSuccesses] = useState(0);
  const [deathSaveFailures, setDeathSaveFailures] = useState(0);
  const [deathSaveStabilized, setDeathSaveStabilized] = useState(false);
  const [deathSaveDead, setDeathSaveDead] = useState(false);
  const [deathSaveRolling, setDeathSaveRolling] = useState(false);

  const isPlayerAtZero = token.type === "player" && hpCurrent <= 0;

  // Try to read character's death saves from campaign store
  const characters = useCampaignStore((s) => s.characters);
  const matchingCharacter = characters.find(
    (c: PlayerCharacter) => c.name.toLowerCase() === token.label.toLowerCase()
  );

  // Sync death saves from character sheet when available
  useEffect(() => {
    if (matchingCharacter && matchingCharacter.deathSaves) {
      setDeathSaveSuccesses(matchingCharacter.deathSaves.successes ?? 0);
      setDeathSaveFailures(matchingCharacter.deathSaves.failures ?? 0);
      const succ = matchingCharacter.deathSaves.successes ?? 0;
      const fail = matchingCharacter.deathSaves.failures ?? 0;
      setDeathSaveStabilized(succ >= 3);
      setDeathSaveDead(fail >= 3);
    } else {
      // Reset when no matching character or new token
      setDeathSaveSuccesses(0);
      setDeathSaveFailures(0);
      setDeathSaveStabilized(false);
      setDeathSaveDead(false);
    }
  }, [matchingCharacter, hpCurrent]);

  // Sync with token prop changes
  useEffect(() => {
    setHpCurrent(token.hp?.current ?? 0);
    setHpMax(token.hp?.max ?? 1);
  }, [token.hp?.current, token.hp?.max]);

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
    // Delay adding to avoid immediate trigger from the token click itself
    const t = setTimeout(() => document.addEventListener("mousedown", handleClick), 100);
    return () => {
      clearTimeout(t);
      document.removeEventListener("mousedown", handleClick);
    };
  }, [onClose]);

  const applyHp = useCallback(
    (newCurrent: number) => {
      const clamped = Math.max(0, Math.min(hpMax, newCurrent));
      setHpCurrent(clamped);
      onHpChange(token.id, clamped, hpMax);
    },
    [hpMax, token.id, onHpChange]
  );

  const handleDamage = useCallback(
    (amount: number) => applyHp(hpCurrent - amount),
    [hpCurrent, applyHp]
  );

  const handleHeal = useCallback(
    (amount: number) => applyHp(hpCurrent + amount),
    [hpCurrent, applyHp]
  );

  const handleCustomApply = useCallback(() => {
    const val = parseInt(customInput, 10);
    if (!isNaN(val)) {
      if (val >= 0) {
        setHpCurrent(Math.min(hpMax, val));
        onHpChange(token.id, Math.min(hpMax, val), hpMax);
      } else {
        // Negative values = damage
        handleDamage(Math.abs(val));
      }
    }
    setCustomInput("");
    setShowCustom(false);
  }, [customInput, hpMax, token.id, onHpChange, handleDamage]);

  const handleCustomKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") handleCustomApply();
      if (e.key === "Escape") {
        setShowCustom(false);
        setCustomInput("");
      }
    },
    [handleCustomApply]
  );

  const hpRatio = hpMax > 0 ? hpCurrent / hpMax : 1;
  const typeIcon = TYPE_ICONS[token.type] ?? "✦";

  // ── Death Save handlers (defined here after applyHp to avoid forward-ref issue) ──
  const handleAutoRollDeathSave = useCallback(() => {
    setDeathSaveRolling(true);
    const roll = Math.floor(Math.random() * 20) + 1;

    setTimeout(() => {
      if (roll === 20) {
        // Natural 20: regain 1 HP and consciousness
        applyHp(1);
        setDeathSaveSuccesses(0);
        setDeathSaveFailures(0);
        setDeathSaveStabilized(false);
      } else if (roll >= 10) {
        // Success — use functional updater to avoid stale closure
        setDeathSaveSuccesses((prev: number) => {
          const next = prev + 1;
          if (next >= 3) {
            setDeathSaveStabilized(true);
          }
          return next;
        });
      } else if (roll === 1) {
        // Natural 1: 2 failures — use functional updater
        setDeathSaveFailures((prev: number) => {
          const next = prev + 2;
          if (next >= 3) {
            setDeathSaveDead(true);
          }
          return next;
        });
      } else {
        // Failure — use functional updater
        setDeathSaveFailures((prev: number) => {
          const next = prev + 1;
          if (next >= 3) {
            setDeathSaveDead(true);
          }
          return next;
        });
      }
      setDeathSaveRolling(false);
    }, 600);
  }, [applyHp]);

  const handleToggleDeathSaveSuccess = useCallback((index: number) => {
    const newSucc = index < deathSaveSuccesses ? index : index + 1;
    setDeathSaveSuccesses(newSucc);
    if (newSucc >= 3) { setDeathSaveStabilized(true); setDeathSaveDead(false); }
    else { setDeathSaveStabilized(false); }
  }, [deathSaveSuccesses]);

  const handleToggleDeathSaveFailure = useCallback((index: number) => {
    const newFail = index < deathSaveFailures ? index : index + 1;
    setDeathSaveFailures(newFail);
    if (newFail >= 3) { setDeathSaveDead(true); setDeathSaveStabilized(false); }
  }, [deathSaveFailures]);

  const handleStabilize = useCallback(() => {
    setDeathSaveSuccesses(3);
    setDeathSaveFailures(0);
    setDeathSaveStabilized(true);
    setDeathSaveDead(false);
  }, []);

  // Clamp position to viewport
  const clampedLeft = Math.max(8, Math.min(position.left, window.innerWidth - 340));
  const clampedTop = Math.max(8, Math.min(position.top, window.innerHeight - 420));

  return (
    <div
      ref={popoverRef}
      className="fixed z-50 w-[320px] select-none"
      style={{
        left: `${clampedLeft}px`,
        top: `${clampedTop}px`,
        animation: animPhase === "exiting"
          ? "fade-out 0.15s ease-out forwards"
          : "slide-in-up 0.25s ease-out both",
      }}
    >
      {/* Glass card container */}
      <div className="relative bg-gradient-to-b from-[#1a1c2a]/95 to-[#0f101a]/98 backdrop-blur-2xl border border-white/[0.06] rounded-2xl shadow-2xl overflow-hidden group">
        {/* Edge light */}
        <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-gold-500/20 to-transparent pointer-events-none" />

        {/* Directional glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-gold-500/[0.015] via-transparent to-amber-500/[0.01] pointer-events-none" />

        {/* Content */}
        <div className="relative z-[1] p-4 space-y-3">
          {/* ── Header row ── */}
          <div className="flex items-center gap-3" style={{ animation: "slide-in-up 0.2s ease-out both" }}>
            {/* Token icon */}
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-lg border shrink-0"
              style={{
                backgroundColor: `${token.color}20`,
                borderColor: `${token.color}30`,
              }}
            >
              <span aria-hidden="true">{token.icon || typeIcon}</span>
            </div>

            {/* Label + type */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-surface-200 truncate max-w-[180px]">
                  {token.label}
                </span>
                <span className={`text-[8px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-full border shrink-0 ${
                  token.type === "player"
                    ? "bg-sky-500/10 text-sky-400 border-sky-500/15"
                    : token.type === "enemy"
                      ? "bg-red-500/10 text-red-400 border-red-500/15"
                      : "bg-amber-500/10 text-amber-400 border-amber-500/15"
                }`}>
                  {token.type}
                </span>
              </div>
              {/* Status label */}
              <span className={`text-[10px] font-medium ${getStatusColor(hpRatio)}`}>
                {getStatusLabel(hpCurrent, hpMax)}
              </span>
            </div>

            {/* Close button */}
            <button
              onClick={() => { setAnimPhase("exiting"); setTimeout(onClose, 150); }}
              className="shrink-0 p-1 rounded-lg hover:bg-white/[0.06] text-surface-500 hover:text-surface-200 transition-all duration-200 active:scale-90"
              aria-label="Close popover"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* ── HP Bar ── */}
          <div style={{ animation: "slide-in-up 0.2s ease-out 0.04s both" }}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] uppercase tracking-wider text-surface-500 font-medium">HP</span>
              <span className={`text-sm font-bold font-mono tabular-nums ${getHpColor(hpRatio)}`}>
                {hpCurrent}
                <span className="text-surface-600 text-xs font-normal"> / {hpMax}</span>
              </span>
            </div>
            <div className="h-2.5 bg-[#0c0d15] rounded-full overflow-hidden shadow-inner">
              <div
                className={`h-full rounded-full transition-all duration-300 ease-out ${getHpBarColor(hpRatio)}`}
                style={{ width: `${Math.max(0, hpRatio * 100)}%`, boxShadow: hpRatio > 0 ? `0 0 8px ${hpRatio > 0.5 ? 'rgba(52,211,153,0.2)' : 'rgba(251,191,36,0.2)'}` : 'none' }}
              />
            </div>
          </div>

          {/* ── Quick HP Buttons ── */}
          <div className="grid grid-cols-5 gap-1.5" style={{ animation: "slide-in-up 0.2s ease-out 0.08s both" }}>
            <button
              onClick={() => handleDamage(10)}
              className="px-1 py-2 rounded-xl text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/10 hover:bg-red-500/15 hover:border-red-500/20 active:scale-90 transition-all duration-150"
            >
              -10
            </button>
            <button
              onClick={() => handleDamage(5)}
              className="px-1 py-2 rounded-xl text-[10px] font-bold bg-red-500/8 text-red-400/80 border border-red-500/8 hover:bg-red-500/12 hover:border-red-500/15 active:scale-90 transition-all duration-150"
            >
              -5
            </button>
            <button
              onClick={() => handleDamage(1)}
              className="px-1 py-2 rounded-xl text-[10px] font-bold bg-red-500/6 text-red-400/60 border border-red-500/6 hover:bg-red-500/10 hover:border-red-500/12 active:scale-90 transition-all duration-150"
            >
              -1
            </button>
            <button
              onClick={() => handleHeal(1)}
              className="px-1 py-2 rounded-xl text-[10px] font-bold bg-emerald-500/6 text-emerald-400/60 border border-emerald-500/6 hover:bg-emerald-500/10 hover:border-emerald-500/12 active:scale-90 transition-all duration-150"
            >
              +1
            </button>
            <button
              onClick={() => handleHeal(5)}
              className="px-1 py-2 rounded-xl text-[10px] font-bold bg-emerald-500/8 text-emerald-400/80 border border-emerald-500/8 hover:bg-emerald-500/12 hover:border-emerald-500/15 active:scale-90 transition-all duration-150"
            >
              +5
            </button>
          </div>

          {/* ── Second row: +10 and set ── */}
          <div className="flex gap-1.5" style={{ animation: "slide-in-up 0.2s ease-out 0.12s both" }}>
            <button
              onClick={() => handleHeal(10)}
              className="flex-1 px-2 py-2 rounded-xl text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 hover:bg-emerald-500/15 hover:border-emerald-500/20 active:scale-90 transition-all duration-150"
            >
              +10 Heal
            </button>
            <button
              onClick={() => {
                setShowCustom(true);
                setCustomInput(hpCurrent.toString());
              }}
              className="flex-1 px-2 py-2 rounded-xl text-[10px] font-bold bg-gold-500/10 text-gold-400 border border-gold-500/10 hover:bg-gold-500/15 hover:border-gold-500/20 active:scale-90 transition-all duration-150"
            >
              ✎ Set HP
            </button>
          </div>

          {/* ── Death Saves (player at 0 HP only) ── */}
          {isPlayerAtZero && !deathSaveStabilized && !deathSaveDead && (
            <div className="space-y-2 pt-1 border-t border-white/[0.04]" style={{ animation: "slide-in-up 0.2s ease-out 0.14s both" }}>
              {/* Header */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-rose-500 font-medium flex items-center gap-1">
                  <span>💀</span> Death Saves
                </span>
                {/* Status badge */}
                <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-medium ${
                  deathSaveStabilized ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/15" :
                  deathSaveDead ? "text-rose-400 bg-rose-500/10 border border-rose-500/15" :
                  "text-amber-400 bg-amber-500/8 border border-amber-500/15"
                }`}>
                  {deathSaveStabilized ? "Stable" : deathSaveDead ? "Dead" : "Rolling"}
                </span>
              </div>

              {/* Success circles */}
              <div className="flex items-center gap-2">
                <span className="text-[8px] text-surface-600 w-10">Success</span>
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <button
                      key={`succ-${i}`}
                      onClick={() => handleToggleDeathSaveSuccess(i)}
                      className={`w-5 h-5 rounded-full border transition-all duration-200 flex items-center justify-center ${
                        i < deathSaveSuccesses
                          ? "bg-emerald-500/25 border-emerald-500/50 text-emerald-400"
                          : "bg-[#0c0d15] border-white/[0.06] text-surface-700 hover:border-emerald-500/20"
                      }`}
                      title={`Toggle success ${i + 1}`}
                    >
                      {i < deathSaveSuccesses && (
                        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Failure circles */}
              <div className="flex items-center gap-2">
                <span className="text-[8px] text-surface-600 w-10">Failure</span>
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <button
                      key={`fail-${i}`}
                      onClick={() => handleToggleDeathSaveFailure(i)}
                      className={`w-5 h-5 rounded-full border transition-all duration-200 flex items-center justify-center ${
                        i < deathSaveFailures
                          ? "bg-rose-500/25 border-rose-500/50 text-rose-400"
                          : "bg-[#0c0d15] border-white/[0.06] text-surface-700 hover:border-rose-500/20"
                      }`}
                      title={`Toggle failure ${i + 1}`}
                    >
                      {i < deathSaveFailures && (
                        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-1.5">
                <button
                  onClick={handleAutoRollDeathSave}
                  disabled={deathSaveRolling}
                  className="flex-1 px-2 py-1.5 rounded-lg text-[8px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/15 hover:bg-amber-500/15 hover:border-amber-500/25 disabled:opacity-40 disabled:cursor-not-allowed active:scale-90 transition-all duration-150 flex items-center justify-center gap-1"
                >
                  {deathSaveRolling ? (
                    <>
                      <svg className="w-2.5 h-2.5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Rolling...
                    </>
                  ) : (
                    <>
                      <span>🎲</span> Roll Death Save
                    </>
                  )}
                </button>
                <button
                  onClick={handleStabilize}
                  className="px-2 py-1.5 rounded-lg text-[8px] font-bold bg-emerald-500/8 text-emerald-400 border border-emerald-500/10 hover:bg-emerald-500/12 hover:border-emerald-500/20 active:scale-90 transition-all duration-150"
                  title="Manually stabilize (3 successes)"
                >
                  Stabilize
                </button>
              </div>
            </div>
          )}

          {/* ── Stabilized/Revived notification ── */}
          {isPlayerAtZero && deathSaveStabilized && (
            <div className="pt-1 border-t border-white/[0.04]" style={{ animation: "slide-in-up 0.2s ease-out 0.14s both" }}>
              <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                <div className="flex items-center gap-2">
                  <span className="text-sm">✅</span>
                  <div>
                    <span className="text-[9px] font-bold text-emerald-400">Stabilized</span>
                    <p className="text-[7px] text-surface-600">3 successes — alive but unconscious</p>
                  </div>
                </div>
                <button
                  onClick={() => { setDeathSaveStabilized(false); setDeathSaveSuccesses(0); setDeathSaveFailures(0); }}
                  className="text-[8px] px-1.5 py-1 rounded text-surface-500 hover:text-gold-400 hover:bg-gold-500/5 transition-all"
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          {/* ── Dead notification ── */}
          {isPlayerAtZero && deathSaveDead && (
            <div className="pt-1 border-t border-white/[0.04]" style={{ animation: "slide-in-up 0.2s ease-out 0.14s both" }}>
              <div className="flex items-center justify-between p-2 rounded-lg bg-rose-500/5 border border-rose-500/10">
                <div className="flex items-center gap-2">
                  <span className="text-sm">💀</span>
                  <div>
                    <span className="text-[9px] font-bold text-rose-400">Dead</span>
                    <p className="text-[7px] text-surface-600">3 failures — death confirmed</p>
                  </div>
                </div>
                <button
                  onClick={() => { setDeathSaveDead(false); setDeathSaveSuccesses(0); setDeathSaveFailures(0); }}
                  className="text-[8px] px-1.5 py-1 rounded text-surface-500 hover:text-rose-400 hover:bg-rose-500/5 transition-all"
                >
                  Revive
                </button>
              </div>
            </div>
          )}

          {/* ── Roll Attack (combat only) ── */}
          {activeEncounter && matchingCombatant && (
            <div style={{ animation: "slide-in-up 0.2s ease-out 0.18s both" }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAttackPopover(true);
                }}
                className="w-full px-2 py-2 rounded-xl text-[9px] font-bold bg-gradient-to-br from-rose-500/12 to-red-500/8 border border-rose-500/20 text-rose-400 hover:from-rose-500/20 hover:to-red-500/12 hover:border-rose-500/30 hover:shadow-[0_0_16px_rgba(244,63,94,0.04)] active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2"
              >
                <span>⚔</span>
                <span>Roll Attack</span>
                <span className="text-[7px] text-rose-400/50">({matchingCombatant.type})</span>
              </button>
            </div>
          )}

          {/* ── Custom HP Input ── */}
          {showCustom && (
            <div
              className="flex items-center gap-2"
              style={{ animation: "slide-in-up 0.15s ease-out both" }}
            >
              <input
                type="number"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                onKeyDown={handleCustomKeyDown}
                min={0}
                max={hpMax}
                className="flex-1 px-3 py-2 rounded-xl text-sm bg-[#0c0d15] border border-gold-500/25 text-gold-300 font-mono focus:outline-none focus:border-gold-500/40 focus:ring-1 focus:ring-gold-500/20 transition-all duration-200"
                placeholder={`0–${hpMax}`}
                autoFocus
              />
              <button
                onClick={handleCustomApply}
                className="px-3 py-2 rounded-xl text-[10px] font-bold bg-gold-500/15 text-gold-400 border border-gold-500/20 hover:bg-gold-500/20 active:scale-90 transition-all duration-150"
              >
                Apply
              </button>
            </div>
          )}

          {/* ── Status Effect Dots ── */}
          {token.statusMarkers && token.statusMarkers.length > 0 && (
            <div className="flex items-center gap-2 pt-1 border-t border-white/[0.04]" style={{ animation: "slide-in-up 0.2s ease-out 0.16s both" }}>
              <span className="text-[9px] uppercase tracking-wider text-surface-600 font-medium">Effects</span>
              <div className="flex gap-1">
                {token.statusMarkers.map((marker, i) => (
                  <span
                    key={i}
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: marker === "poisoned" ? "#22c55e" : marker === "paralyzed" ? "#f59e0b" : marker === "unconscious" ? "#ef4444" : marker === "invisible" ? "#8b5cf6" : marker === "concentrating" ? "#eab308" : marker === "restrained" ? "#f97316" : marker === "prone" ? "#a1a1aa" : "#eab308" }}
                    title={marker}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── Quick Stats footer ── */}
          <div className="flex items-center gap-3 pt-1 text-[9px] text-surface-600" style={{ animation: "slide-in-up 0.2s ease-out 0.2s both" }}>
            <span>Pos: ({token.x}, {token.y})</span>
            {token.speed && <span>Speed: {token.speed}ft</span>}
            {token.initiative !== undefined && <span>Init: {token.initiative > 0 ? `+${token.initiative}` : token.initiative}</span>}
            <div className="flex-1" />
            <span className="text-surface-700 italic">Tap outside to close</span>
          </div>
        </div>
      </div>

      {/* ── Attack Resolution Popover ── */}
      {activeEncounter && (
        <AttackResolutionPopover
          initialAttacker={matchingCombatant}
          combatants={combatants}
          isOpen={showAttackPopover}
          onClose={() => setShowAttackPopover(false)}
        />
      )}
    </div>
  );
}
