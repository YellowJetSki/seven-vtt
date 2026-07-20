/**
 * STᚱ VTT — Attack Resolution Popover (Sprint 19)
 *
 * A premium floating tool that enables one-click attack resolution
 * during live combat. When the DM selects a combatant token and
 * has an active encounter, this popover appears showing:
 *   - The attacker's available attacks (from EnemyDoc)
 *   - Click "Roll Attack" → auto-roll d20+ATK vs target AC
 *   - If hit: auto-roll damage, show result, apply to target
 *   - Premium animated d20 result with hit/miss/crit visuals
 *   - Works for both enemies attacking players AND vice versa
 *
 * Integration point: TokenHpPopover → "⚔ Roll Attack" button
 * → AttackResolutionPopover opens with attacker pre-selected
 * → DM picks target from combatant list → resolves attack
 *
 * Architecture:
 *   AttackResolutionPopover
 *   ├── Attacker section (combatant name, AC, attacks dropdown)
 *   ├── Target selector (combatant list or manual AC input)
 *   ├── Roll Attack button → animated result
 *   ├── Result display (d20 result, damage, hit/miss status)
 *   └── Apply Damage button (writes to combatStore)
 */

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import { useCombatStore } from "@/stores/combatStore";
import {
  resolveAttack,
  makeAttackRoll,
  rollDamageExpression,
  getEnemyAttacks,
  formatDiceRoll,
  type AttackResultType,
} from "@/lib/combat/attack-engine";
import {
  applyDamageTypes,
  getDamageEffectColor,
  getDamageEffectLabel,
  formatDamageType,
  type DamageApplicationResult,
  type DamageEffect,
} from "@/lib/combat/damage-type-engine";
import { getCombatantDefenses } from "@/lib/combat/typed-damage-engine";
import type { Combatant, EnemyAttack, EnemyDoc } from "@/types";

interface AttackResolutionPopoverProps {
  /** Initial attacker combatant (pre-selected from token click) */
  initialAttacker: Combatant | null;
  /** All combatants in the active encounter */
  combatants: Combatant[];
  /** Whether the popover is open */
  isOpen: boolean;
  /** Close callback */
  onClose: () => void;
  /** Optional position override for floating placement */
  position?: { top: number; left: number };
}

// ── D20 result icon ──
function ResultD20({
  value,
  resultType,
}: {
  value: number;
  resultType?: AttackResultType;
}) {
  const isNatural20 = value === 20;
  const isNatural1 = value === 1;
  const strokeColor = isNatural20
    ? "#fbbf24"
    : isNatural1
    ? "#f87171"
    : value >= 15
    ? "#34d399"
    : value >= 10
    ? "#a78bfa"
    : "#94a3b8";

  return (
    <div className="relative w-10 h-10 flex items-center justify-center">
      <svg viewBox="0 0 24 24" className="w-10 h-10">
        <polygon
          points="12,2 22,8 22,18 12,22 2,18 2,8"
          className="fill-none"
          stroke={strokeColor}
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
        <text
          x="12"
          y="15"
          textAnchor="middle"
          className="text-[8px] font-black"
          fill={strokeColor}
          dominantBaseline="middle"
        >
          {value}
        </text>
      </svg>
    </div>
  );
}

// ── Damage die icon ──
function DamageDie({ value, sides }: { value: number; sides: number }) {
  const color = sides === 20 ? "#fbbf24" : sides === 12 ? "#f87171" : sides === 10 ? "#34d399" : sides === 8 ? "#a78bfa" : sides === 6 ? "#60a5fa" : "#94a3b8";

  return (
    <div className="w-5 h-5 flex items-center justify-center" title={`d${sides}`}>
      <svg viewBox="0 0 24 24" className="w-5 h-5">
        <rect
          x="3" y="3" width="18" height="18" rx="3"
          className="fill-none"
          stroke={color}
          strokeWidth={1.5}
        />
        <text
          x="12" y="15"
          textAnchor="middle"
          className="text-[6px] font-bold"
          fill={color}
          dominantBaseline="middle"
        >
          {value}
        </text>
      </svg>
    </div>
  );
}

export default function AttackResolutionPopover({
  initialAttacker,
  combatants,
  isOpen,
  onClose,
  position,
}: AttackResolutionPopoverProps) {
  const enemies = useCampaignStore((s) => s.enemies);
  const damageCombatant = useCombatStore((s) => s.damageCombatant);

  const [selectedAttackerId, setSelectedAttackerId] = useState<string>(
    initialAttacker?.id ?? ""
  );
  const [selectedAttackId, setSelectedAttackId] = useState<string>("");
  const [targetType, setTargetType] = useState<"combatant" | "manual">("combatant");
  const [selectedTargetId, setSelectedTargetId] = useState<string>("");
  const [manualAC, setManualAC] = useState<string>("15");
  const [attackResult, setAttackResult] = useState<any>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [applied, setApplied] = useState(false);
  const [resistanceInfo, setResistanceInfo] = useState<{
    rawDamage: number;
    finalDamage: number;
    effect: DamageEffect;
    explanation: string;
  } | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setAttackResult(null);
      setIsResolving(false);
      setIsAnimating(false);
      setApplied(false);
      if (initialAttacker?.id) {
        setSelectedAttackerId(initialAttacker.id);
      }
    }
  }, [isOpen, initialAttacker?.id]);

  // Click outside to close
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
    };
  }, [isOpen, onClose]);

  // ── Derive attacks for selected attacker ──
  const selectedAttacker = useMemo(
    () => combatants.find((c) => c.id === selectedAttackerId) || null,
    [combatants, selectedAttackerId]
  );

  const availableAttacks = useMemo(() => {
    if (!selectedAttacker) return [];

    // Try to find the enemy doc and get their attacks
    const enemyDoc = enemies.find(
      (e) => e.name.toLowerCase() === selectedAttacker.name.toLowerCase()
    );
    if (enemyDoc) {
      // Use getEnemyAttacks which parses structured attacks + actions text
      return getEnemyAttacks(enemyDoc);
    }

    // Fallback: synthesize generic attack from combatant data
    const estimatedAtk = Math.max(2, Math.floor(selectedAttacker.armorClass * 0.3));
    return [
      {
        id: "atk_default",
        name: "Attack",
        attackBonus: estimatedAtk,
        damageDice: "1d6",
        damageType: "bludgeoning",
        isMelee: true,
        isRanged: false,
        range: "5 ft",
        properties: [],
      },
    ];
  }, [selectedAttacker, enemies]);

  // Set default attack selection
  useEffect(() => {
    if (availableAttacks.length > 0 && !selectedAttackId) {
      setSelectedAttackId(availableAttacks[0].id);
    }
  }, [availableAttacks, selectedAttackId]);

  const selectedAttack = useMemo(
    () => availableAttacks.find((a) => a.id === selectedAttackId) || availableAttacks[0] || null,
    [availableAttacks, selectedAttackId]
  );

  // ── Target ──
  const targetCombatant = useMemo(
    () => combatants.find((c) => c.id === selectedTargetId) || null,
    [combatants, selectedTargetId]
  );

  const targetAC = useMemo(() => {
    if (targetType === "manual") return parseInt(manualAC, 10) || 10;
    return targetCombatant?.armorClass ?? 10;
  }, [targetType, manualAC, targetCombatant]);

  // Players (for targeting) = all non-enemy combatants
  const playerCombatants = useMemo(
    () => combatants.filter((c) => c.type !== "enemy"),
    [combatants]
  );

  // Enemies (for targeting when attacker is a player)
  const enemyCombatants = useMemo(
    () => combatants.filter((c) => c.type === "enemy"),
    [combatants]
  );

  // ── Determine available targets based on attacker ──
  const availableTargets = useMemo(() => {
    if (!selectedAttacker) return combatants;
    if (selectedAttacker.type === "enemy") {
      // Enemies target players/allies
      return combatants.filter((c) => c.type !== "enemy");
    }
    // Players target enemies
    return combatants.filter((c) => c.type === "enemy");
  }, [selectedAttacker, combatants]);

  // ── Handle Roll Attack ──
  const handleRollAttack = useCallback(() => {
    if (!selectedAttacker || !selectedAttack) return;

    setIsResolving(true);
    setIsAnimating(true);
    setApplied(false);

    const result = resolveAttack(
      selectedAttacker.name,
      targetCombatant?.name || "Target",
      selectedAttack.name,
      selectedAttack.attackBonus,
      selectedAttack.damageDice,
      selectedAttack.damageType,
      targetAC,
      selectedAttack.secondaryDamage
    );

    // Compute resistance-applied damage for display
    if (result.attackRoll.hit && result.damageRoll && targetCombatant) {
      const defenses = getCombatantDefenses(targetCombatant, enemies);
      const { results, totalFinalDamage } = applyDamageTypes(
        result.totalDamage,
        [selectedAttack.damageType],
        defenses.resistances,
        defenses.immunities,
        defenses.vulnerabilities
      );

      if (results.length > 0) {
        setResistanceInfo({
          rawDamage: result.totalDamage,
          finalDamage: totalFinalDamage,
          effect: results[0].effect,
          explanation: results[0].explanation,
        });
        // Override the result's totalDamage with resistance-applied value
        result.totalDamage = totalFinalDamage;
      }
    } else {
      setResistanceInfo(null);
    }

    // Animate after a brief delay (simulating the die rolling)
    setTimeout(() => {
      setAttackResult(result);
      setIsResolving(false);
      // Keep the "rolling" visual for a moment
      setTimeout(() => setIsAnimating(false), 200);
    }, 500);
  }, [selectedAttacker, selectedAttack, targetCombatant, targetAC, enemies]);

  // ── Handle Apply Damage ──
  const handleApplyDamage = useCallback(() => {
    if (!attackResult || !selectedAttacker || !targetCombatant) return;

    if (attackResult.attackRoll.hit) {
      // Use resistance-finalized damage if available
      const damageToApply = resistanceInfo?.finalDamage ?? attackResult.totalDamage;
      if (damageToApply > 0) {
        damageCombatant(targetCombatant.id, damageToApply);
      }
    }

    setApplied(true);

    // Auto-close after brief delay
    setTimeout(() => {
      onClose();
    }, 800);
  }, [attackResult, selectedAttacker, targetCombatant, resistanceInfo, damageCombatant, onClose]);

  // ── Position ──
  const popoverStyle = position
    ? {
        position: "fixed" as const,
        top: `${Math.max(10, Math.min(position.top, window.innerHeight - 600))}px`,
        left: `${Math.max(10, Math.min(position.left, window.innerWidth - 380))}px`,
      }
    : { position: "fixed" as const, top: "50%", left: "50%", transform: "translate(-50%, -50%)" as const };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pointer-events-none"
      style={{ paddingTop: "60px" }}
    >
      <div
        ref={popoverRef}
        className="pointer-events-auto w-[340px] max-h-[85vh] bg-gradient-to-b from-[#14151f]/95 to-[#0f1019]/98 border border-white/[0.06] rounded-2xl shadow-[0_32px_64px_rgba(0,0,0,0.5),0_0_40px_rgba(234,179,8,0.02)] overflow-hidden flex flex-col"
        style={{
          ...popoverStyle,
          animation: "slide-in-up 0.2s ease-out both",
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Attack Resolution"
      >
        {/* Top edge light */}
        <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-gold-500/20 to-transparent pointer-events-none z-10" />

        {/* ── HEADER ── */}
        <div className="relative z-[1] p-3 pb-2.5 border-b border-white/[0.04] shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-sm">
                ⚔
              </div>
              <div>
                <h2 className="text-[10px] font-bold text-white/80 uppercase tracking-[0.08em]">
                  Attack
                </h2>
                <p className="text-[7px] text-surface-500">
                  Roll attack & apply damage
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-6 h-6 rounded-lg bg-[#0c0d15]/70 border border-white/[0.04] text-surface-500 hover:text-gold-400 hover:border-gold/15 hover:bg-gold-500/8 active:scale-90 transition-all duration-200 flex items-center justify-center"
              aria-label="Close"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── BODY ── */}
        <div className="relative z-[1] flex-1 overflow-y-auto scrollbar-gold p-3 space-y-3" style={{ minHeight: 0 }}>
          {/* ── ATTACKER SELECTION ── */}
          <div>
            <label className="text-[7px] uppercase tracking-wider font-bold text-surface-500 mb-1.5 block">
              Attacker
            </label>
            <select
              value={selectedAttackerId}
              onChange={(e) => {
                setSelectedAttackerId(e.target.value);
                setAttackResult(null);
                setApplied(false);
              }}
              disabled={isResolving || !!attackResult}
              className="w-full px-2.5 py-2 rounded-xl text-[10px] bg-[#0c0d15]/80 border border-white/[0.06] text-white/70 focus:border-gold-500/30 focus:ring-1 focus:ring-gold-500/20 outline-none transition-all duration-200 appearance-none"
            >
              <option value="" disabled>Select attacker</option>
              {combatants.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.type === "enemy" ? "👹" : c.type === "player" ? "🛡" : "🧙"}
                  {c.isDead ? " 💀" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* ── ATTACK SELECTION ── */}
          {selectedAttacker && (
            <div>
              <label className="text-[7px] uppercase tracking-wider font-bold text-surface-500 mb-1.5 block">
                Attack
              </label>
              <select
                value={selectedAttackId}
                onChange={(e) => {
                  setSelectedAttackId(e.target.id);
                  setAttackResult(null);
                  setApplied(false);
                }}
                disabled={isResolving || !!attackResult}
                className="w-full px-2.5 py-2 rounded-xl text-[10px] bg-[#0c0d15]/80 border border-white/[0.06] text-white/70 focus:border-gold-500/30 focus:ring-1 focus:ring-gold-500/20 outline-none transition-all duration-200 appearance-none"
              >
                {availableAttacks.map((atk) => (
                  <option key={atk.id} value={atk.id}>
                    {atk.name} · +{atk.attackBonus} · {atk.damageDice} {atk.damageType}
                    {atk.isMelee ? " ⚔" : atk.isRanged ? " 🏹" : ""}
                  </option>
                ))}
              </select>
              {selectedAttack && (
                <div className="flex items-center gap-2 mt-1.5 text-[8px] text-surface-600">
                  <span>+{selectedAttack.attackBonus} ATK</span>
                  <span className="text-surface-700">·</span>
                  <span>{selectedAttack.damageDice} {selectedAttack.damageType}</span>
                  <span className="text-surface-700">·</span>
                  <span>{selectedAttack.range}</span>
                </div>
              )}
            </div>
          )}

          {/* ── TARGET SELECTION ── */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[7px] uppercase tracking-wider font-bold text-surface-500">
                Target
              </label>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setTargetType("combatant")}
                  className={`text-[7px] px-1.5 py-0.5 rounded font-medium transition-all ${
                    targetType === "combatant"
                      ? "bg-gold-500/10 text-gold-400 border border-gold-500/20"
                      : "text-surface-600 hover:text-surface-400 border border-transparent"
                  }`}
                >
                  Combatant
                </button>
                <button
                  onClick={() => setTargetType("manual")}
                  className={`text-[7px] px-1.5 py-0.5 rounded font-medium transition-all ${
                    targetType === "manual"
                      ? "bg-gold-500/10 text-gold-400 border border-gold-500/20"
                      : "text-surface-600 hover:text-surface-400 border border-transparent"
                  }`}
                >
                  Manual AC
                </button>
              </div>
            </div>

            {targetType === "combatant" ? (
              <select
                value={selectedTargetId}
                onChange={(e) => {
                  setSelectedTargetId(e.target.value);
                  setAttackResult(null);
                  setApplied(false);
                }}
                disabled={isResolving || !!attackResult}
                className="w-full px-2.5 py-2 rounded-xl text-[10px] bg-[#0c0d15]/80 border border-white/[0.06] text-white/70 focus:border-gold-500/30 focus:ring-1 focus:ring-gold-500/20 outline-none transition-all duration-200 appearance-none"
              >
                <option value="" disabled>Select target</option>
                {availableTargets.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} (AC {c.armorClass}) · HP {c.hitPoints.current}/{c.hitPoints.max}
                    {c.isDead ? " 💀" : ""}
                  </option>
                ))}
              </select>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-surface-500">AC:</span>
                <input
                  type="number"
                  min="1"
                  max="40"
                  value={manualAC}
                  onChange={(e) => {
                    setManualAC(e.target.value);
                    setAttackResult(null);
                    setApplied(false);
                  }}
                  className="w-16 px-2 py-1.5 rounded-lg text-[10px] bg-[#0c0d15]/80 border border-white/[0.06] text-white/70 focus:border-gold-500/30 focus:ring-1 focus:ring-gold-500/20 outline-none text-center tabular-nums"
                  disabled={isResolving || !!attackResult}
                />
              </div>
            )}
          </div>

          {/* ── DIVIDER ── */}
          <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

          {/* ── ROLL ATTACK BUTTON ── */}
          {!attackResult && (
            <button
              onClick={handleRollAttack}
              disabled={
                isResolving ||
                !selectedAttackerId ||
                !selectedAttackId ||
                (targetType === "combatant" && !selectedTargetId)
              }
              className="w-full py-2.5 rounded-xl text-[9px] font-bold bg-gradient-to-br from-rose-500/15 to-red-500/10 border border-rose-500/25 text-rose-400 hover:from-rose-500/25 hover:to-red-500/15 hover:border-rose-500/35 hover:shadow-[0_0_24px_rgba(244,63,94,0.06)] disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2"
            >
              {isResolving ? (
                <>
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-rose-500/30 border-t-rose-400 animate-spin" />
                  <span>Rolling attack...</span>
                </>
              ) : (
                <>
                  <span>🎲</span>
                  <span>Roll Attack</span>
                  {selectedAttack && (
                    <span className="text-[8px] text-rose-400/50">
                      (d20+{selectedAttack.attackBonus} vs AC {targetAC})
                    </span>
                  )}
                </>
              )}
            </button>
          )}

          {/* ── ATTACK RESULT ── */}
          {attackResult && (
            <div className="space-y-3">
              {/* Result banner */}
              <div
                className={`p-3 rounded-xl border ${
                  attackResult.attackRoll.resultType === "critical_hit"
                    ? "bg-gold-500/10 border-gold-500/25"
                    : attackResult.attackRoll.resultType === "hit"
                    ? "bg-emerald-500/10 border-emerald-500/25"
                    : attackResult.attackRoll.resultType === "critical_miss"
                    ? "bg-rose-500/10 border-rose-500/25"
                    : "bg-surface-800/50 border-white/[0.06]"
                }`}
                style={{
                  animation: isAnimating
                    ? "none"
                    : "slide-in-up 0.2s ease-out both",
                }}
              >
                {/* D20 result */}
                <div className="flex items-center gap-3">
                  <ResultD20
                    value={attackResult.attackRoll.naturalRoll}
                    resultType={attackResult.attackRoll.resultType}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[12px] font-black ${
                          attackResult.attackRoll.resultType === "critical_hit"
                            ? "text-gold-400"
                            : attackResult.attackRoll.resultType === "hit"
                            ? "text-emerald-400"
                            : attackResult.attackRoll.resultType === "critical_miss"
                            ? "text-rose-400"
                            : "text-surface-400"
                        }`}
                      >
                        {attackResult.attackRoll.resultType === "critical_hit"
                          ? "⚡ CRITICAL HIT!"
                          : attackResult.attackRoll.resultType === "hit"
                          ? "✅ Hit!"
                          : attackResult.attackRoll.resultType === "critical_miss"
                          ? "❌ Critical Miss!"
                          : "❌ Miss"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[8px] text-surface-500">
                      <span className="tabular-nums">
                        {attackResult.attackRoll.naturalRoll}
                        {attackResult.attackRoll.attackBonus >= 0 ? "+" : ""}
                        {attackResult.attackRoll.attackBonus} = {attackResult.attackRoll.total}
                      </span>
                      <span className="text-surface-700">vs</span>
                      <span className="tabular-nums">AC {attackResult.attackRoll.targetAC}</span>
                      <span
                        className={`text-[8px] font-bold tabular-nums ${
                          attackResult.attackRoll.margin >= 0
                            ? "text-emerald-400/60"
                            : "text-rose-400/60"
                        }`}
                      >
                        ({attackResult.attackRoll.margin >= 0 ? "+" : ""}
                        {attackResult.attackRoll.margin})
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Damage result (if hit) */}
              {attackResult.damageRoll && (
                <div
                  className="p-3 rounded-xl bg-gradient-to-b from-[#07080d]/80 to-[#0c0d15]/80 border border-white/[0.04]"
                  style={{ animation: "slide-in-up 0.25s ease-out 0.1s both" }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[8px] uppercase tracking-wider font-bold text-surface-500">
                      Damage
                    </span>
                    <span
                      className={`text-[14px] font-black tabular-nums ${
                        attackResult.attackRoll.resultType === "critical_hit"
                          ? "text-gold-400"
                          : "text-rose-400"
                      }`}
                    >
                      {attackResult.totalDamage}
                    </span>
                  </div>

                  {/* Die rolls */}
                  <div className="flex flex-wrap gap-1 mb-1.5">
                    {attackResult.damageRoll.rolls.map((roll, i) => (
                      <DamageDie
                        key={i}
                        value={roll}
                        sides={
                          (() => {
                            const parsed =
                              attackResult.damageRoll.expression.match(/d(\d+)/i);
                            return parsed ? parseInt(parsed[1], 10) : 6;
                          })()
                        }
                      />
                    ))}
                  </div>

                  {/* Formula */}
                  <p className="text-[8px] text-surface-600">
                    {formatDiceRoll(
                      attackResult.damageRoll.rolls,
                      attackResult.damageRoll.bonus,
                      attackResult.totalDamage
                    )}
                  </p>

                  {/* Damage type */}
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className="text-[7px] px-1.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400/80 border border-rose-500/15 font-medium uppercase tracking-wider">
                      {attackResult.damageRoll.damageType}
                    </span>
                    {attackResult.damageRoll.isCritical && (
                      <span className="text-[7px] px-1.5 py-0.5 rounded-full bg-gold-500/10 text-gold-400/80 border border-gold-500/15 font-medium">
                        CRITICAL
                      </span>
                    )}
                  </div>

                  {/* ── Resistance/Vulnerability/Immunity Display ── */}
                  {resistanceInfo && resistanceInfo.effect !== "standard" && (
                    <div
                      className={`mt-2 p-2 rounded-lg border flex items-center gap-2 ${
                        resistanceInfo.effect === "immune"
                          ? "bg-sky-500/8 border-sky-500/15"
                          : resistanceInfo.effect === "resistance"
                          ? "bg-emerald-500/8 border-emerald-500/15"
                          : "bg-rose-500/8 border-rose-500/15"
                      }`}
                    >
                      <span className="text-[10px]">
                        {resistanceInfo.effect === "immune" ? "🛡️" : resistanceInfo.effect === "resistance" ? "½" : "×2"}
                      </span>
                      <div className="flex-1">
                        <p className={`text-[8px] font-bold ${
                          resistanceInfo.effect === "immune"
                            ? "text-sky-400"
                            : resistanceInfo.effect === "resistance"
                            ? "text-emerald-400"
                            : "text-rose-400"
                        }`}>
                          {resistanceInfo.effect === "immune" ? "Immune" : resistanceInfo.effect === "resistance" ? "Resistance" : "Vulnerability"}
                        </p>
                        <p className="text-[7px] text-surface-600 mt-0.5">
                          {resistanceInfo.explanation}
                        </p>
                      </div>
                      <span className="text-[9px] font-black tabular-nums text-surface-400">
                        {resistanceInfo.rawDamage} → {resistanceInfo.finalDamage}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Apply damage button */}
              {attackResult.damageRoll && !applied && targetCombatant && (
                <button
                  onClick={handleApplyDamage}
                  className="w-full py-2.5 rounded-xl text-[9px] font-bold bg-gradient-to-br from-emerald-500/15 to-green-500/10 border border-emerald-500/25 text-emerald-400 hover:from-emerald-500/25 hover:to-green-500/15 hover:border-emerald-500/35 hover:shadow-[0_0_24px_rgba(52,211,153,0.06)] active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2"
                >
                  <span>⚔</span>
                  <span>
                    Apply {resistanceInfo?.finalDamage ?? attackResult.totalDamage} damage to {targetCombatant.name}
                  </span>
                </button>
              )}

              {/* Applied confirmation */}
              {applied && (
                <div
                  className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center"
                  style={{ animation: "slide-in-up 0.2s ease-out both" }}
                >
                  <p className="text-[10px] text-emerald-400 font-bold">✓ Damage applied!</p>
                  <p className="text-[8px] text-emerald-400/60 mt-0.5">
                    {resistanceInfo?.finalDamage ?? attackResult.totalDamage} damage dealt to {targetCombatant?.name}
                  </p>
                </div>
              )}

              {/* New Roll button */}
              {applied && (
                <button
                  onClick={() => {
                    setAttackResult(null);
                    setApplied(false);
                  }}
                  className="w-full py-2 rounded-xl text-[8px] font-bold bg-[#0c0d15]/70 border border-white/[0.06] text-surface-400 hover:text-gold-400 hover:border-gold/15 active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-1.5"
                >
                  <span>🎲</span>
                  <span>Roll Another Attack</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── FOOTER ── */}
        <div className="relative z-[1] shrink-0 px-3 py-2 border-t border-white/[0.04] flex items-center justify-between text-[7px] text-surface-600">
          <span>
            {selectedAttacker ? `${selectedAttacker.name}` : "No attacker selected"}
          </span>
          <span>
            {combatants.length} combatants · {availableAttacks.length} attacks
          </span>
        </div>
      </div>
    </div>
  );
}
