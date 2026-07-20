/**
 * STᚱ VTT — Multi-Target AoE Damage Popover (Sprint 21)
 *
 * A premium floating tool for applying area-of-effect damage
 * to multiple combatants at once. The DM selects targets,
 * enters a damage amount and type, and the engine applies
 * resistance/vulnerability/immunity per-target automatically.
 *
 * Features:
 *   - Target selection: toggleable checkboxes per combatant
 *   - "Select All Enemies" / "Select All Players" quick buttons
 *   - Damage: amount input + type dropdown (13 D&D damage types)
 *   - Spell name input (for combat log clarity)
 *   - Optional DEX save half-toggle with per-target save checkboxes
 *   - Per-target preview: HP before, resistance effect, HP after
 *   - Apply button writes to all targets in one Zustand action
 *   - Premium gold glass styling matching the design system
 *
 * Architecture: Standalone popover, appends to body, receives
 * combatants from the active encounter via props.
 */

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import { useCombatHpMutations } from "@/hooks/useCombatMutations";
import {
  computeAoEDamage,
  type AoETargetResult,
  type AoEDamageResult,
} from "@/lib/combat/aoe-damage-engine";
import {
  DAMAGE_TYPES,
  getDamageEffectColor,
  formatDamageType,
} from "@/lib/combat/damage-type-engine";
import type { Combatant } from "@/types";

// ── Props ──
export interface MultiTargetAoEPopoverProps {
  /** All combatants in the active encounter (for target selection) */
  combatants: Combatant[];
  /** Whether the popover is open */
  isOpen: boolean;
  /** Close callback */
  onClose: () => void;
  /** Optional position override */
  position?: { top: number; left: number };
}

// ── Default damage types ──
const COMMON_DAMAGE_TYPES = ["fire", "cold", "lightning", "acid", "poison", "necrotic", "radiant", "force", "thunder", "psychic"];

export default function MultiTargetAoEPopover({
  combatants,
  isOpen,
  onClose,
  position,
}: MultiTargetAoEPopoverProps) {
  const enemies = useCampaignStore((s) => s.enemies);
  // FIX (Sprint 27): Use the Firestore-synced hook instead of raw Zustand store action.
  // Previously used: useCombatStore((s) => s.aoeDamageCombatants) → Zustand only, no cross-device sync.
  const { aoeDamageCombatants } = useCombatHpMutations();

  const [selectedTargetIds, setSelectedTargetIds] = useState<Set<string>>(new Set());
  const [damageAmount, setDamageAmount] = useState<string>("28"); // Fireball average
  const [damageType, setDamageType] = useState<string>("fire");
  const [spellName, setSpellName] = useState<string>("Fireball");
  const [saveHalves, setSaveHalves] = useState(false);
  const [savedTargetIds, setSavedTargetIds] = useState<Set<string>>(new Set());
  const [showPreview, setShowPreview] = useState(false);
  const [aoEResult, setAoEResult] = useState<AoEDamageResult | null>(null);
  const [applied, setApplied] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  // FIX (Sprint 29): Ref for timeout to prevent dangling setTimeouts after unmount.
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setSelectedTargetIds(new Set());
      setSavedTargetIds(new Set());
      setShowPreview(false);
      setAoEResult(null);
      setApplied(false);
      setDamageAmount("28");
      setDamageType("fire");
      setSpellName("Fireball");
      setSaveHalves(false);
    }
  }, [isOpen]);

  // Click outside / Escape to close
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
      // FIX (Sprint 29): Clear any pending close timeout on unmount.
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = null;
      }
    };
  }, [isOpen, onClose]);

  // ── Toggle a single target ──
  const toggleTarget = useCallback((id: string) => {
    setSelectedTargetIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // ── Quick select helpers ──
  const selectAllEnemies = useCallback(() => {
    const ids = combatants.filter((c) => c.type === "enemy" && !c.isDead).map((c) => c.id);
    setSelectedTargetIds(new Set(ids));
  }, [combatants]);

  const selectAllPlayers = useCallback(() => {
    const ids = combatants.filter((c) => c.type !== "enemy" && !c.isDead).map((c) => c.id);
    setSelectedTargetIds(new Set(ids));
  }, [combatants]);

  const clearSelection = useCallback(() => {
    setSelectedTargetIds(new Set());
  }, []);

  // ── Toggle saved (for save halves) ──
  const toggleSaved = useCallback((id: string) => {
    setSavedTargetIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // ── Selected combatants ──
  const selectedCombatants = useMemo(
    () => combatants.filter((c) => selectedTargetIds.has(c.id)),
    [combatants, selectedTargetIds]
  );

  // ── Compute preview ──
  const handlePreview = useCallback(() => {
    const damage = parseInt(damageAmount, 10) || 0;
    if (damage <= 0 || selectedCombatants.length === 0) return;

    const result = computeAoEDamage(
      selectedCombatants,
      damage,
      [damageType],
      enemies,
      saveHalves,
      [...savedTargetIds]
    );

    setAoEResult(result);
    setShowPreview(true);
  }, [damageAmount, selectedCombatants, damageType, enemies, saveHalves, savedTargetIds]);

  // ── Apply damage ──
  const handleApply = useCallback(() => {
    if (!aoEResult) return;

    const damage = parseInt(damageAmount, 10) || 0;
    aoeDamageCombatants("system", "AoE", spellName || "AoE", damage, damageType, aoEResult);

    setApplied(true);

    // FIX (Sprint 29): Store timeout ref for cleanup on unmount.
    // Previously, the 1.2s setTimeout could fire after component unmount,
    // causing React state update warnings and potential double-close.
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    closeTimeoutRef.current = setTimeout(() => {
      closeTimeoutRef.current = null;
      onClose();
    }, 1200);
  }, [aoEResult, damageAmount, damageType, spellName, aoeDamageCombatants, onClose]);

  // ── Count by type for display ──
  const targetCounts = useMemo(() => {
    const enemies = combatants.filter((c) => c.type === "enemy" && !c.isDead).length;
    const players = combatants.filter((c) => c.type !== "enemy" && !c.isDead).length;
    return { enemies, players, total: enemies + players };
  }, [combatants]);

  if (!isOpen) return null;

  // ── Position ──
  const popoverStyle: React.CSSProperties = position
    ? {
        position: "fixed",
        top: Math.max(8, Math.min(position.top, window.innerHeight - 600)),
        left: Math.max(8, Math.min(position.left, window.innerWidth - 420)),
        zIndex: 9999,
        animation: "slide-in-up 0.2s ease-out both",
      }
    : {
        animation: "slide-in-up 0.2s ease-out both",
      };

  return (
    <div ref={popoverRef} style={popoverStyle}>
      <div
        className="w-[380px] max-h-[85vh] flex flex-col rounded-2xl bg-gradient-to-b from-[#14151f]/95 to-[#0f1019]/95 border border-white/[0.06] shadow-[0_32px_80px_rgba(0,0,0,0.55),0_8px_24px_rgba(0,0,0,0.3)] backdrop-blur-2xl overflow-hidden"
      >
        {/* ── Top edge light ── */}
        <div className="absolute top-0 left-[5%] right-[5%] h-px bg-gradient-to-r from-transparent via-gold-500/20 to-transparent pointer-events-none z-10" />

        {/* ── Header ── */}
        <div className="relative z-[1] shrink-0 p-4 pb-3 border-b border-white/[0.04]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-[11px]">
                💥
              </div>
              <h2 className="text-[10px] font-bold text-white/80 uppercase tracking-[0.06em]">
                AoE Damage
              </h2>
            </div>
            <button
              onClick={onClose}
              className="w-6 h-6 rounded-lg bg-[#0c0d15]/70 border border-white/[0.04] text-surface-500 hover:text-gold-400 hover:border-gold/15 active:scale-90 transition-all duration-200 flex items-center justify-center"
              aria-label="Close"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Spell name input */}
          <div className="flex items-center gap-2">
            <span className="text-[7px] uppercase tracking-wider font-bold text-surface-500 shrink-0">
              Spell
            </span>
            <input
              value={spellName}
              onChange={(e) => setSpellName(e.target.value)}
              placeholder="Fireball, Lightning Bolt..."
              className="flex-1 px-2 py-1 rounded-lg text-[9px] bg-[#0c0d15]/80 border border-white/[0.06] text-white/70 placeholder:text-surface-700 focus:border-gold-500/30 focus:ring-1 focus:ring-gold-500/20 outline-none transition-all duration-200"
            />
          </div>
        </div>

        {/* ── Content ── */}
        <div className="flex-1 overflow-y-auto scrollbar-gold p-4 space-y-4">
          {/* ── Damage Input ── */}
          <div>
            <label className="text-[7px] uppercase tracking-wider font-bold text-surface-500 mb-1.5 block">
              Damage Amount & Type
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={damageAmount}
                onChange={(e) => { setDamageAmount(e.target.value); setShowPreview(false); }}
                className="w-20 px-2.5 py-2 rounded-xl text-[11px] font-bold tabular-nums bg-[#0c0d15]/80 border border-white/[0.06] text-rose-400 focus:border-rose-500/30 focus:ring-1 focus:ring-rose-500/20 outline-none transition-all duration-200"
              />
              <select
                value={damageType}
                onChange={(e) => { setDamageType(e.target.value); setShowPreview(false); }}
                className="flex-1 px-2.5 py-2 rounded-xl text-[9px] bg-[#0c0d15]/80 border border-white/[0.06] text-white/70 focus:border-gold-500/30 focus:ring-1 focus:ring-gold-500/20 outline-none transition-all duration-200 appearance-none"
              >
                {COMMON_DAMAGE_TYPES.map((t) => (
                  <option key={t} value={t}>{formatDamageType(t)}</option>
                ))}
                {DAMAGE_TYPES.filter((t) => !COMMON_DAMAGE_TYPES.includes(t)).map((t) => (
                  <option key={t} value={t}>{formatDamageType(t)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* ── Save Half Toggle ── */}
          <div className="flex items-center gap-2 p-2 rounded-xl bg-[#0c0d15]/60 border border-white/[0.04]">
            <button
              onClick={() => setSaveHalves(!saveHalves)}
              className={`w-8 h-4 rounded-full transition-all duration-200 relative ${
                saveHalves ? "bg-amber-500/40" : "bg-surface-800/60"
              }`}
            >
              <div
                className={`w-3 h-3 rounded-full bg-white absolute top-0.5 transition-all duration-200 ${
                  saveHalves ? "left-[18px]" : "left-[2px]"
                }`}
              />
            </button>
            <div className="flex-1">
              <p className="text-[8px] font-medium text-white/70">DEX Save halves damage</p>
              <p className="text-[6px] text-surface-600 mt-0.5">
                Toggle per-target saves below
              </p>
            </div>
            {saveHalves && (
              <span className="text-[7px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400/80 border border-amber-500/15 font-medium">
                {savedTargetIds.size} saved
              </span>
            )}
          </div>

          {/* ── Target Selection ── */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[7px] uppercase tracking-wider font-bold text-surface-500">
                Targets ({selectedTargetIds.size}/{targetCounts.total})
              </label>
              <div className="flex items-center gap-1">
                <button
                  onClick={selectAllEnemies}
                  className="text-[7px] px-1.5 py-0.5 rounded font-medium bg-rose-500/8 text-rose-400/80 border border-rose-500/15 hover:bg-rose-500/15 active:scale-90 transition-all duration-150"
                >
                  All Enemies
                </button>
                <button
                  onClick={selectAllPlayers}
                  className="text-[7px] px-1.5 py-0.5 rounded font-medium bg-emerald-500/8 text-emerald-400/80 border border-emerald-500/15 hover:bg-emerald-500/15 active:scale-90 transition-all duration-150"
                >
                  All Players
                </button>
                <button
                  onClick={clearSelection}
                  className="text-[7px] px-1.5 py-0.5 rounded font-medium bg-surface-800/50 text-surface-600 border border-white/[0.04] hover:text-surface-400 active:scale-90 transition-all duration-150"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="space-y-0.5 max-h-[200px] overflow-y-auto scrollbar-gold">
              {combatants.length === 0 ? (
                <p className="text-[8px] text-surface-700 text-center py-4">No combatants in encounter</p>
              ) : (
                combatants.map((c) => {
                  const isSelected = selectedTargetIds.has(c.id);
                  const isSavedCombatant = savedTargetIds.has(c.id);
                  const preview = aoEResult?.targets.find((t) => t.combatantId === c.id);

                  return (
                    <div
                      key={c.id}
                      onClick={() => toggleTarget(c.id)}
                      className={`flex items-center gap-2 p-2 rounded-xl cursor-pointer transition-all duration-150 border ${
                        isSelected
                          ? "bg-gold-500/8 border-gold-500/20"
                          : "bg-[#0c0d15]/40 border-transparent hover:bg-white/[0.02] hover:border-white/[0.04]"
                      } ${c.isDead ? "opacity-40 pointer-events-none" : ""}`}
                    >
                      {/* Checkbox */}
                      <div
                        className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-all duration-150 ${
                          isSelected
                            ? "bg-gold-500 border-gold-500"
                            : "bg-[#0c0d15]/60 border-white/[0.08]"
                        }`}
                      >
                        {isSelected && (
                          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>

                      {/* Name + Type */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-medium text-white/70 truncate">
                            {c.name}
                          </span>
                          <span className={`text-[6px] px-1 py-0.5 rounded-full font-medium ${
                            c.type === "enemy"
                              ? "bg-rose-500/8 text-rose-400/80"
                              : c.type === "player"
                              ? "bg-emerald-500/8 text-emerald-400/80"
                              : "bg-amber-500/8 text-amber-400/80"
                          }`}>
                            {c.type}
                          </span>
                        </div>
                        <span className="text-[7px] text-surface-600 tabular-nums">
                          HP: {c.hitPoints.current}/{c.hitPoints.max}
                          {c.hitPoints.temporary > 0 && ` +${c.hitPoints.temporary}THP`}
                          {c.isDead && " 💀"}
                        </span>
                      </div>

                      {/* Save half toggle (if enabled) */}
                      {saveHalves && isSelected && (
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleSaved(c.id); }}
                          className={`text-[7px] px-1.5 py-0.5 rounded font-medium transition-all ${
                            isSavedCombatant
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              : "bg-surface-800/50 text-surface-600 border border-transparent hover:text-surface-400"
                          }`}
                        >
                          {isSavedCombatant ? "Saved ✓" : "Save"}
                        </button>
                      )}

                      {/* Preview effect */}
                      {preview && (
                        <div className="flex items-center gap-1">
                          <span
                            className={`text-[7px] px-1 py-0.5 rounded font-bold tabular-nums ${
                              preview.isDead ? "text-rose-500" : preview.finalDamage <= 0 ? "text-sky-400" : "text-rose-400"
                            }`}
                          >
                            {preview.hpBefore.current}→{preview.hpAfter.current}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ── Preview Results ── */}
          {showPreview && aoEResult && (
            <div
              className="p-3 rounded-xl bg-gradient-to-b from-[#07080d]/80 to-[#0c0d15]/80 border border-white/[0.04]"
              style={{ animation: "slide-in-up 0.2s ease-out both" }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[8px] uppercase tracking-wider font-bold text-surface-500">
                  Preview
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[7px] text-surface-600 tabular-nums">
                    {aoEResult.targets.length} targets
                  </span>
                  <span className="text-[7px] font-bold tabular-nums text-rose-400">
                    -{aoEResult.totalFinalDamage} total
                  </span>
                  {aoEResult.totalDeaths > 0 && (
                    <span className="text-[7px] font-bold tabular-nums text-rose-500">
                      💀{aoEResult.totalDeaths}
                    </span>
                  )}
                </div>
              </div>

              {/* Per-target breakdown */}
              <div className="space-y-1 max-h-[180px] overflow-y-auto scrollbar-gold">
                {aoEResult.targets.map((target) => {
                  const primaryResult = target.typeResults[0];
                  const effectColor = primaryResult
                    ? getDamageEffectColor(primaryResult.effect)
                    : null;

                  return (
                    <div
                      key={target.combatantId}
                      className="p-1.5 rounded-lg bg-[#0c0d15]/50 border border-white/[0.03]"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[8px] font-medium text-white/70">
                            {target.combatantName}
                          </span>
                          {/* Resistance badge */}
                          {primaryResult && primaryResult.effect !== "standard" && effectColor && (
                            <span className={`text-[6px] px-1 py-0.5 rounded-full ${effectColor.bg} ${effectColor.border} ${effectColor.text} font-medium`}>
                              {effectColor.icon} {primaryResult.effect}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[7px] text-surface-600 tabular-nums">
                            {target.hpBefore.current}
                          </span>
                          <svg className="w-2.5 h-2.5 text-surface-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                          <span className={`text-[8px] font-bold tabular-nums ${
                            target.isDead ? "text-rose-500" : "text-emerald-400"
                          }`}>
                            {target.hpAfter.current}
                          </span>
                          {target.isDead && <span className="text-[9px]">💀</span>}
                        </div>
                      </div>
                      {/* Resistance explanation */}
                      {primaryResult && primaryResult.effect !== "standard" && (
                        <p className="text-[6px] text-surface-700 mt-0.5">
                          {primaryResult.explanation}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Summary stats */}
              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/[0.04]">
                <span className="text-[7px] text-surface-600">
                  Raw: {aoEResult.totalRawDamage} {formatDamageType(aoEResult.damageTypes[0] || "")}
                </span>
                <span className="text-surface-700">·</span>
                <span className="text-[7px] text-surface-600">
                  After resistance: {aoEResult.totalFinalDamage}
                </span>
                <span className="text-surface-700">·</span>
                <span className={`text-[7px] font-bold ${aoEResult.totalDeaths > 0 ? "text-rose-500" : "text-surface-600"}`}>
                  {aoEResult.totalDeaths > 0
                    ? `${aoEResult.totalDeaths} died`
                    : "No deaths"}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="relative z-[1] shrink-0 px-4 py-3 border-t border-white/[0.04] flex items-center justify-between gap-2">
          <button
            onClick={onClose}
            className="px-3 py-2 rounded-xl text-[8px] font-bold bg-[#0c0d15]/70 border border-white/[0.06] text-surface-400 hover:text-surface-300 hover:border-white/[0.10] active:scale-[0.98] transition-all duration-150"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            {!showPreview ? (
              <button
                onClick={handlePreview}
                disabled={selectedTargetIds.size === 0 || !damageAmount || parseInt(damageAmount, 10) <= 0}
                className="px-3 py-2 rounded-xl text-[8px] font-bold bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 hover:border-amber-500/30 disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.98] transition-all duration-150 flex items-center gap-1.5"
              >
                <span>🔍</span>
                <span>Preview</span>
              </button>
            ) : !applied ? (
              <button
                onClick={handleApply}
                className="px-4 py-2 rounded-xl text-[8px] font-bold bg-gradient-to-br from-rose-500/15 to-red-500/10 border border-rose-500/25 text-rose-400 hover:from-rose-500/25 hover:to-red-500/15 hover:border-rose-500/35 hover:shadow-[0_0_24px_rgba(244,63,94,0.06)] active:scale-[0.98] transition-all duration-150 flex items-center gap-1.5"
              >
                <span>💥</span>
                <span>Apply {aoEResult?.totalFinalDamage || 0} damage to {selectedTargetIds.size} targets</span>
              </button>
            ) : (
              <div className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8px] font-bold flex items-center gap-1.5">
                <span>✓</span>
                <span>Damage applied!</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
