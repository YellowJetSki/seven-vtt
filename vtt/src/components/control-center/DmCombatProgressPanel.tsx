/**
 * STᚱ VTT — DM Combat Progress Dashboard (Overrrides-Grade Premium)
 *
 * Cycle 26: Globally accessible popover showing the complete combat
 * encounter status. One-stop shop for the DM to see all combatants,
 * live HP bars, status effects, damage/healing totals, turn timer,
 * and quick controls — accessible from any page via the sidebar.
 *
 * Features:
 *   - Round counter + phase indicator + elapsed combat time
 *   - Turn timer (seconds since current turn started)
 *   - All combatants sorted by initiative with color-coded HP bars
 *   - Per-combatant damage dealt / healing received tracking
 *   - Status effect dot indicators (color-coded per condition type)
 *   - Inline quick HP controls (-5/+5, death save toggle for players)
 *   - Quick action buttons: End Combat, Next Turn, Prev Turn
 *   - Encounter summary footer (alive/dead/damage totals)
 *   - Premium glass gradient design matching all DM popovers
 *
 * Design: Overrrides/Ventriloc — gold glass card, staggered entrance,
 *   color-coded HP tiers (emerald/amber/rose), status dot legend.
 *   No dice rolling — pure state display with quick controls.
 */

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useCombatStore } from "@/stores/combatStore";
import PremiumIcon from "@/components/ui/PremiumIcon";
import { getAbilityMod } from "@/lib/mechanics/character-derivations";

// ═══════════════════════════════════════════════════════
// CONSTANTS & HELPERS
// ═══════════════════════════════════════════════════════

/** 5-tier HP status (alive) */
function getHpTier(current: number, max: number): { label: string; color: string; barColor: string } {
  if (max <= 0) return { label: "Dead", color: "text-rose-500", barColor: "bg-rose-500" };
  const ratio = current / max;
  if (ratio > 0.75) return { label: "Healthy", color: "text-emerald-400", barColor: "bg-emerald-500" };
  if (ratio > 0.5) return { label: "Scratched", color: "text-emerald-300", barColor: "bg-emerald-400" };
  if (ratio > 0.25) return { label: "Bloodied", color: "text-amber-400", barColor: "bg-amber-500" };
  if (ratio > 0) return { label: "Critical", color: "text-rose-400", barColor: "bg-red-500" };
  return { label: "Down", color: "text-rose-500", barColor: "bg-rose-500" };
}

/** Map status effect to color dot */
function getStatusDot(effect: string | { id?: string; effect: string }): { bg: string; label: string } {
  const effectName = typeof effect === "string" ? effect : effect.effect || effect.id || "";
  const map: Record<string, { bg: string; label: string }> = {
    poisoned: { bg: "bg-emerald-500", label: "Poisoned" },
    paralyzed: { bg: "bg-amber-500", label: "Paralyzed" },
    unconscious: { bg: "bg-red-500", label: "Unconscious" },
    stunned: { bg: "bg-pink-500", label: "Stunned" },
    restrained: { bg: "bg-amber-500", label: "Restrained" },
    prone: { bg: "bg-sky-500", label: "Prone" },
    blinded: { bg: "bg-slate-500", label: "Blinded" },
    frightened: { bg: "bg-violet-500", label: "Frightened" },
    incapacitated: { bg: "bg-rose-500", label: "Incapacitated" },
    invisible: { bg: "bg-indigo-300", label: "Invisible" },
    concentrating: { bg: "bg-gold-500", label: "Concentrating" },
    charmed: { bg: "bg-pink-400", label: "Charmed" },
    deafened: { bg: "bg-cyan-500", label: "Deafened" },
    exhaustion: { bg: "bg-amber-500", label: "Exhausted" },
    petrified: { bg: "bg-surface-500", label: "Petrified" },
    grappled: { bg: "bg-amber-500", label: "Grappled" },
  };
  return map[effectName.toLowerCase()] || { bg: "bg-surface-500", label: effectName };
}

/** Format seconds as mm:ss */
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** Format relative time */
function formatRelative(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

// ═══════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════

interface DmCombatProgressPanelProps {
  onClose: () => void;
}

export default function DmCombatProgressPanel({ onClose }: DmCombatProgressPanelProps) {
  const activeEncounter = useCombatStore((s) => s.activeEncounter);
  const combatLog = useCombatStore((s) => s.combatLog);
  const nextTurn = useCombatStore((s) => s.nextTurn);
  const prevTurn = useCombatStore((s) => s.prevTurn);
  const endCombat = useCombatStore((s) => s.endCombat);
  const damageCombatant = useCombatStore((s) => s.damageCombatant);
  const healCombatant = useCombatStore((s) => s.healCombatant);

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [turnSeconds, setTurnSeconds] = useState(0);
  const [showLegend, setShowLegend] = useState(false);

  // ── Escape key ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // ── Timer tick ──
  useEffect(() => {
    if (!activeEncounter || activeEncounter.phase !== "active") {
      setElapsedSeconds(0);
      setTurnSeconds(0);
      return;
    }
    const startedAt = activeEncounter.startedAt || Date.now();
    const turnStarted = activeEncounter.turnStartedAt || startedAt;

    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
      setTurnSeconds(Math.floor((Date.now() - turnStarted) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [activeEncounter?.id, activeEncounter?.phase, activeEncounter?.currentCombatantIndex]);

  // ── Sort combatants by initiative ──
  const sortedCombatants = useMemo(() => {
    if (!activeEncounter) return [];
    return [...activeEncounter.combatants].sort(
      (a, b) => (b.initiative || 0) - (a.initiative || 0) || a.name.localeCompare(b.name)
    );
  }, [activeEncounter?.combatants]);

  const currentIndex = activeEncounter?.currentCombatantIndex ?? -1;
  const currentCombatant = currentIndex >= 0 && activeEncounter?.combatants
    ? activeEncounter.combatants[currentIndex]
    : null;

  // ── Damage/healing totals per combatant ──
  const combatantTotals = useMemo(() => {
    if (!combatLog || combatLog.length === 0) return new Map<string, { damage: number; healing: number }>();

    const totals = new Map<string, { damage: number; healing: number }>();
    for (const entry of combatLog) {
      if (!entry.actorId) continue;
      const existing = totals.get(entry.actorId) || { damage: 0, healing: 0 };
      if (entry.type === "damage" && entry.value != null && entry.value > 0) {
        existing.damage += entry.value;
      } else if (entry.type === "heal" && entry.value != null && entry.value > 0) {
        existing.healing += entry.value;
      }
      totals.set(entry.actorId, existing);
    }
    return totals;
  }, [combatLog]);

  // ── Totals ──
  const summary = useMemo(() => {
    if (!activeEncounter) return { alive: 0, dead: 0, total: 0, totalDamage: 0, totalHealing: 0 };
    const alive = activeEncounter.combatants.filter((c) => !c.isDead && c.hitPoints.current > 0).length;
    const dead = activeEncounter.combatants.filter((c) => c.isDead || c.hitPoints.current <= 0).length;
    let totalDamage = 0;
    let totalHealing = 0;
    for (const [, v] of combatantTotals) {
      totalDamage += v.damage;
      totalHealing += v.healing;
    }
    return {
      alive,
      dead,
      total: activeEncounter.combatants.length,
      totalDamage,
      totalHealing,
    };
  }, [activeEncounter?.combatants, combatantTotals]);

  if (!activeEncounter) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
        <div className="relative w-full max-w-md bg-gradient-to-b from-[#14151f]/98 to-[#0f1019]/98
          border border-white/[0.06] rounded-2xl shadow-[0_32px_80px_rgba(0,0,0,0.55)] p-6 text-center
          animate-in slide-in-from-bottom-2 fade-in duration-300"
          style={{ animationTimingFunction: "cubic-bezier(0.16,1,0.3,1)" }}
        >
          <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-gold-500/25 to-transparent pointer-events-none" />
          <div className="w-10 h-10 rounded-xl bg-surface-800/30 border border-white/[0.04] flex items-center justify-center mx-auto mb-2">
            <PremiumIcon name="encounterComplete" className="w-5 h-5 text-surface-500" />
          </div>
          <p className="text-sm text-surface-300 font-display">No Active Combat</p>
          <p className="text-[10px] text-surface-500 mt-1">Start an encounter on the Battle Maps page.</p>
          <button onClick={onClose}
            className="mt-3 px-3 py-1.5 text-[10px] rounded-lg bg-gold-500/12 text-gold-300
              border border-gold-500/20 hover:bg-gold-500/18 transition-all active:scale-95"
          >Close</button>
        </div>
      </div>
    );
  }

  const isCombatActive = activeEncounter.phase === "active";
  const isPaused = activeEncounter.isPaused;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      <div className="relative w-full max-w-lg max-h-[85vh] overflow-hidden
        bg-gradient-to-b from-[#14151f]/98 to-[#0f1019]/98
        border border-white/[0.06] rounded-2xl shadow-[0_32px_80px_rgba(0,0,0,0.55)]
        animate-in slide-in-from-bottom-2 fade-in duration-300"
        style={{ animationTimingFunction: "cubic-bezier(0.16,1,0.3,1)" }}
      >
        <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-gold-500/25 to-transparent pointer-events-none" />

        {/* ── HEADER ── */}
        <div className="flex items-center justify-between px-3 pt-3 pb-1">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-gold-500/15 to-amber-500/10 flex items-center justify-center border border-gold/10">
              <PremiumIcon name="encounterComplete" className="w-4 h-4 text-gold-400" />
            </div>
            <h3 className="font-display text-sm text-white/90">Combat Progress</h3>
            <span className="text-[9px] text-surface-500 tabular-nums">{activeEncounter.name}</span>
          </div>
          <button onClick={onClose}
            className="w-6 h-6 rounded-lg bg-surface-800/40 border border-white/[0.04] flex items-center justify-center
              text-surface-400 hover:text-white/70 transition-colors"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── COMBAT STATUS BAR ── */}
        <div className="mx-3 mb-1 flex items-center gap-2 p-1.5 rounded-lg bg-surface-800/20 border border-white/[0.04]
          animate-in slide-in-from-bottom-1 fade-in duration-200">
          {/* Round counter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[8px] text-surface-500 uppercase tracking-wider">Round</span>
            <span className="text-sm font-mono tabular-nums text-gold-400">{activeEncounter.round || 1}</span>
          </div>

          <div className="w-px h-4 bg-white/[0.06]" />

          {/* Phase */}
          <div className="flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full ${isCombatActive ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
            <span className="text-[9px] text-surface-300">
              {isPaused ? "Paused" : isCombatActive ? "Active" : "Prep"}
            </span>
          </div>

          <div className="w-px h-4 bg-white/[0.06]" />

          {/* Elapsed time */}
          <div className="flex items-center gap-1">
            <span className="text-[9px] text-surface-400">⏱</span>
            <span className="text-[10px] font-mono tabular-nums text-surface-300">{formatTime(elapsedSeconds)}</span>
          </div>

          <div className="flex-1" />

          {/* Turn timer (if active) */}
          {isCombatActive && currentCombatant && (
            <div className={`flex items-center gap-1 text-[9px] ${turnSeconds > 120 ? "text-rose-400" : turnSeconds > 60 ? "text-amber-400" : "text-surface-400"}`}>
              <span>⏲ {formatRelative(turnSeconds)}</span>
            </div>
          )}
        </div>

        {/* ── CURRENT TURN BANNER ── */}
        {isCombatActive && currentCombatant && (
          <div className="mx-3 mb-1 p-1.5 rounded-lg bg-gold-500/8 border border-gold-500/15
            animate-in slide-in-from-bottom-1 fade-in duration-200"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-1.5 h-1.5 rounded-full bg-gold-400 shadow-[0_0_4px_rgba(234,179,8,0.4)]" />
                <span className="text-[10px] font-medium text-gold-300 truncate">{currentCombatant.name}</span>
                <span className="text-[8px] text-gold-500/60">Current Turn</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[9px] font-mono tabular-nums text-gold-400">
                  {currentCombatant.hitPoints.current}/{currentCombatant.hitPoints.max} HP
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ── COMBATANT LIST ── */}
        <div className="flex-1 overflow-y-auto mx-1 max-h-[50vh] space-y-0.5 scrollbar-gold">
          {sortedCombatants.map((c, i) => {
            const isCurrent = c.id === currentCombatant?.id;
            const tier = getHpTier(c.hitPoints.current, c.hitPoints.max);
            const hpRatio = c.hitPoints.max > 0 ? Math.min(1, Math.max(0, c.hitPoints.current / c.hitPoints.max)) : 0;
            const totals = combatantTotals.get(c.id) || { damage: 0, healing: 0 };
            const hasStatus = (c.statusEffects?.length || 0) > 0;

            return (
              <div key={c.id}
                className={`flex items-center gap-1 p-1.5 rounded-lg border transition-all duration-100
                  animate-in slide-in-from-bottom-1 fade-in
                  ${isCurrent
                    ? "bg-gold-500/6 border-gold-500/12"
                    : c.isDead
                      ? "bg-surface-900/40 border-white/[0.02] opacity-60"
                      : "bg-surface-800/10 border-white/[0.02] hover:bg-surface-800/20"}`}
                style={{ animationDelay: `${i * 20}ms` }}
              >
                {/* Initiative */}
                <span className="w-4 text-[8px] font-mono tabular-nums text-surface-500 text-right shrink-0">
                  {c.initiative || "-"}
                </span>

                {/* Type icon */}
                <span className="shrink-0 text-[9px]">
                  {c.type === "player" ? "🛡" : c.type === "enemy" ? "👹" : "🧑"}
                </span>

                {/* Name + status dots */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className={`text-[9px] truncate ${c.isDead ? "text-surface-500 line-through" : "text-white/80"}`}>
                      {c.name}
                    </span>
                    {/* Status effect dots */}
                    {!c.isDead && hasStatus && (
                      <div className="flex items-center gap-0.5">
                        {c.statusEffects!.slice(0, 3).map((eff, ei) => (
                          <span key={ei} className={`w-1.5 h-1.5 rounded-full shrink-0 ${getStatusDot(eff).bg}`}
                            title={getStatusDot(eff).label} />
                        ))}
                        {c.statusEffects!.length > 3 && (
                          <span className="text-[6px] text-surface-500">+{c.statusEffects!.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* AC */}
                <span className="text-[8px] font-mono tabular-nums text-indigo-400 shrink-0 w-6 text-right">
                  {c.armorClass || 10}
                </span>

                {/* HP bar */}
                <div className="w-16 shrink-0">
                  <div className="h-1 rounded-full bg-surface-800/60 overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-300 ${tier.barColor}`}
                      style={{ width: `${hpRatio * 100}%` }} />
                  </div>
                  <div className={`text-[7px] font-mono tabular-nums text-right ${tier.color}`}>
                    {c.hitPoints.current}/{c.hitPoints.max}
                  </div>
                </div>

                {/* Damage/Healing totals */}
                <div className="flex flex-col items-end gap-0.5 shrink-0 w-10">
                  {totals.damage > 0 && (
                    <span className="text-[7px] font-mono tabular-nums text-rose-400">
                      -{totals.damage}
                    </span>
                  )}
                  {totals.healing > 0 && (
                    <span className="text-[7px] font-mono tabular-nums text-emerald-400">
                      +{totals.healing}
                    </span>
                  )}
                </div>

                {/* Quick HP controls */}
                <div className="flex items-center gap-0.5 shrink-0">
                  <button onClick={() => damageCombatant(c.id, 5)}
                    className="w-4 h-4 rounded bg-rose-500/10 border border-rose-500/15 text-rose-400
                      text-[6px] flex items-center justify-center hover:bg-rose-500/20 transition-colors"
                    title="-5 HP"
                  >-5</button>
                  <button onClick={() => healCombatant(c.id, 5)}
                    className="w-4 h-4 rounded bg-emerald-500/10 border border-emerald-500/15 text-emerald-400
                      text-[6px] flex items-center justify-center hover:bg-emerald-500/20 transition-colors"
                    title="+5 HP"
                  >+5</button>
                </div>

                {/* Death marker */}
                {c.isDead && (
                  <span className="text-[7px] text-rose-500 font-medium shrink-0">💀</span>
                )}
              </div>
            );
          })}
        </div>

        {/* ── STATUS DOT LEGEND ── */}
        {showLegend && (
          <div className="mx-3 mb-1 p-1.5 rounded-lg bg-surface-800/30 border border-white/[0.04]
            animate-in slide-in-from-bottom-1 fade-in duration-150"
          >
            <div className="flex flex-wrap gap-x-2 gap-y-0.5">
              {Object.entries({
                poisoned: "Poisoned", paralyzed: "Paralyzed", unconscious: "Unconscious",
                stunned: "Stunned", restrained: "Restrained", prone: "Prone",
                blinded: "Blinded", frightened: "Frightened", concentrating: "Concentrating",
              }).map(([key, label]) => (
                <div key={key} className="flex items-center gap-0.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${getStatusDot(key).bg}`} />
                  <span className="text-[6px] text-surface-500">{label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── FOOTER ── */}
        <div className="px-3 py-1.5 border-t border-white/[0.04]">
          <div className="flex items-center justify-between mb-1">
            {/* Summary stats */}
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-emerald-400 tabular-nums">{summary.alive} Alive</span>
              {summary.dead > 0 && (
                <span className="text-[9px] text-rose-400 tabular-nums">{summary.dead} Dead</span>
              )}
              <span className="text-[9px] text-surface-500 tabular-nums">{summary.total} Total</span>
              {summary.totalDamage > 0 && (
                <span className="text-[9px] text-rose-400 tabular-nums">
                  -{summary.totalDamage} DMG
                </span>
              )}
              {summary.totalHealing > 0 && (
                <span className="text-[9px] text-emerald-400 tabular-nums">
                  +{summary.totalHealing} Heal
                </span>
              )}
            </div>

            {/* Legend toggle */}
            <button onClick={() => setShowLegend(!showLegend)}
              className="text-[7px] text-surface-500 hover:text-surface-300 transition-colors"
            >{showLegend ? "Hide" : "Status"} Legend</button>
          </div>

          {/* Quick actions */}
          <div className="flex items-center gap-1">
            {isCombatActive && (
              <button onClick={() => prevTurn()}
                className="flex-1 flex items-center justify-center gap-1 py-1 rounded-lg
                  bg-surface-800/30 border border-white/[0.04] text-surface-300
                  hover:bg-surface-800/50 transition-all text-[9px] active:scale-95"
              >◀ Prev</button>
            )}
            {isCombatActive && (
              <button onClick={() => nextTurn()}
                className="flex-1 flex items-center justify-center gap-1 py-1 rounded-lg
                  bg-gold-500/8 border border-gold-500/12 text-gold-300
                  hover:bg-gold-500/15 transition-all text-[9px] active:scale-95"
              >Next ▶</button>
            )}
            <button onClick={() => { endCombat(); onClose(); }}
              className="flex-1 flex items-center justify-center gap-1 py-1 rounded-lg
                bg-rose-500/8 border border-rose-500/12 text-rose-300
                hover:bg-rose-500/15 transition-all text-[9px] active:scale-95"
            >End Combat</button>
          </div>
        </div>
      </div>
    </div>
  );
}
