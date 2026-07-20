/**
 * STᚱ VTT — Initiative Roll Overlay (Sprint 18)
 *
 * A premium animated overlay that shows initiative roll results
 * with animated d20 icons, DEX modifiers, and sorted turn order.
 *
 * Features:
 *   - Animated d20 spin-in results per combatant
 *   - Color-coded initiative tiers (high=gold, mid=amber, low=rose)
 *   - Proper 5e tiebreaker indicators
 *   - Roll All / Re-roll Individual / Confirm buttons
 *   - Premium glass modal with staggered entrance
 *   - Auto-sorts by initiative descending with tiebreaker
 *
 * Flow:
 *   DM deploys encounter → overlay shows initiative options
 *   → "Roll Initiative" → animated d20 results appear
 *   → DM confirms → combat encounter created with sorted combatants
 *   → Auto-navigate to Battle Maps with initiative ready
 */

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useCampaignStore } from "@/stores/campaignStore";
import { useCombatStore } from "@/stores/combatStore";
import {
  buildCombatantFromToken,
  sortByInitiative,
  getDexModifier,
  getInitiativeRange,
  type TokenCombatantSource,
  type InitiativeRollResult,
} from "@/lib/combat/initiative-engine";
import type { Combatant } from "@/types";

interface InitiativeRollOverlayProps {
  /** The tokens (enemies + players) to roll initiative for */
  tokens: TokenCombatantSource[];
  /** Whether the overlay is visible */
  isOpen: boolean;
  /** Close callback */
  onClose: () => void;
  /** After initiative is confirmed and combat is created */
  onConfirmed?: () => void;
  /** Encounter name to use for the combat encounter */
  encounterName?: string;
}

// ── D20 SVG icon component ──
function D20Icon({ value, isRolling, color }: { value?: number; isRolling: boolean; color: string }) {
  return (
    <div className="relative w-8 h-8 flex items-center justify-center">
      <svg
        viewBox="0 0 24 24"
        className={`w-8 h-8 ${isRolling ? "animate-spin" : ""}`}
        style={{ animationDuration: "0.6s" }}
      >
        <polygon
          points="12,2 22,8 22,18 12,22 2,18 2,8"
          className="fill-none"
          stroke={color}
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
        {value !== undefined && !isRolling && (
          <text
            x="12"
            y="15"
            textAnchor="middle"
            className="text-[7px] font-bold"
            fill={color}
            dominantBaseline="middle"
          >
            {value}
          </text>
        )}
      </svg>
    </div>
  );
}

// ── Initiative tier colors ──
function getInitColor(total: number): string {
  if (total >= 20) return "#fbbf24"; // gold
  if (total >= 15) return "#f59e0b"; // amber
  if (total >= 10) return "#a78bfa"; // violet
  if (total >= 5) return "#94a3b8";  // slate
  return "#f87171";                   // rose (low)
}

function getInitBgColor(total: number): string {
  if (total >= 20) return "rgba(251,191,36,0.10)";
  if (total >= 15) return "rgba(245,158,11,0.08)";
  if (total >= 10) return "rgba(167,139,250,0.08)";
  if (total >= 5)  return "rgba(148,163,184,0.06)";
  return "rgba(248,113,113,0.08)";
}

export default function InitiativeRollOverlay({
  tokens,
  isOpen,
  onClose,
  onConfirmed,
  encounterName = "Encounter",
}: InitiativeRollOverlayProps) {
  const navigate = useNavigate();
  const characters = useCampaignStore((s) => s.characters);
  const addBattleMapToken = useCampaignStore((s) => s.addMapToken);
  const createEncounterWithCombatants = useCombatStore((s) => s.createEncounterWithCombatants);
  const setEncounter = useCombatStore((s) => s.setEncounter);
  const startCombat = useCombatStore((s) => s.startCombat);

  const [rollResults, setRollResults] = useState<InitiativeRollResult[]>([]);
  const [isRolling, setIsRolling] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmedCombatants, setConfirmedCombatants] = useState<Combatant[]>([]);
  const [animPhase, setAnimPhase] = useState<"entering" | "idle" | "rolling" | "results" | "confirming" | "confirmed">("entering");

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setRollResults([]);
      setIsRolling(false);
      setIsConfirming(false);
      setConfirmedCombatants([]);
      setAnimPhase("entering");
      const timer = setTimeout(() => setAnimPhase("idle"), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // ── Derive player combatants from campaign characters ──
  const playerCombatantSources = useMemo(() => {
    return characters.map((char) => ({
      id: char.id,
      name: char.name,
      type: "player" as const,
      hp: { current: char.hitPoints.current, max: char.hitPoints.max },
      armorClass: char.armorClass,
      dexScore: char.dexterity,
    }));
  }, [characters]);

  // ── All combatant sources (players + tokens/enemies) ──
  const allSources = useMemo(() => {
    return [...playerCombatantSources, ...tokens] as TokenCombatantSource[];
  }, [playerCombatantSources, tokens]);

  // ── Handle Roll All ──
  const handleRollAll = useCallback(() => {
    if (allSources.length === 0) return;

    setAnimPhase("rolling");
    setIsRolling(true);

    // Simulate rolling animation with staggered results
    const results: InitiativeRollResult[] = [];
    const combatants: Combatant[] = [];

    allSources.forEach((source, idx) => {
      const dexScore = (source as any).dexScore ?? source.type === "player" ? 10 : 10;
      const dexMod = getDexModifier(dexScore);
      const roll = Math.floor(Math.random() * 20) + 1;
      const total = roll + dexMod;

      results.push({
        combatantId: source.id,
        name: source.name,
        type: source.type === "player" ? "player" : source.type === "npc" ? "ally" : "enemy",
        roll,
        dexMod,
        total,
      });

      const hp = source.hp || { current: 10, max: 10 };
      combatants.push({
        id: `cmb_${Date.now()}_${idx}`,
        name: source.name,
        type: source.type === "player" ? "player" : source.type === "npc" ? "ally" : "enemy",
        initiative: total,
        armorClass: (source as any).armorClass ?? 10,
        hitPoints: { current: hp.current, max: hp.max, temporary: 0 },
        statusEffects: [],
        isDead: false,
        isConcentrating: false,
        notes: "",
      });
    });

    // Sort by initiative with tiebreaker
    const sorted = sortByInitiative(combatants);
    const sortedResults = sorted.map((c) => results.find((r) => r.combatantId === (c as any).tokenId || r.name === c.name)).filter(Boolean) as InitiativeRollResult[];

    // Stagger the reveal (simulate rolling animation)
    setTimeout(() => {
      setRollResults(results);
      setConfirmedCombatants(combatants);
      setIsRolling(false);
      setAnimPhase("results");
    }, 600);
  }, [allSources]);

  // ── Re-roll individual ──
  const handleReRoll = useCallback((index: number) => {
    setRollResults((prev) => {
      const updated = [...prev];
      const source = allSources[index];
      if (!source) return prev;
      const dexScore = (source as any).dexScore ?? 10;
      const dexMod = getDexModifier(dexScore);
      const roll = Math.floor(Math.random() * 20) + 1;
      const total = roll + dexMod;
      updated[index] = { ...updated[index], roll, dexMod, total };
      return updated;
    });

    // Also update the combatant
    setConfirmedCombatants((prev) => {
      const updated = [...prev];
      const source = allSources[index];
      if (!source) return prev;
      const dexScore = (source as any).dexScore ?? 10;
      const dexMod = getDexModifier(dexScore);
      const roll = Math.floor(Math.random() * 20) + 1;
      const total = roll + dexMod;
      updated[index] = { ...updated[index], initiative: total };
      return sortByInitiative(updated);
    });
  }, [allSources]);

  // ── Confirm initiative and create combat encounter ──
  const handleConfirm = useCallback(() => {
    if (confirmedCombatants.length === 0) return;
    setIsConfirming(true);
    setAnimPhase("confirming");

    setTimeout(() => {
      try {
        // Create the combat encounter with sorted combatants
        const sorted = sortByInitiative(confirmedCombatants);
        const encounterId = createEncounterWithCombatants(encounterName, sorted);

        // Start combat
        startCombat();

        setAnimPhase("confirmed");

        // Navigate after short delay
        setTimeout(() => {
          onClose();
          onConfirmed?.();
          navigate("/campaign/maps");
        }, 1200);
      } catch (err) {
        console.error("Failed to create combat encounter:", err);
        setIsConfirming(false);
        setAnimPhase("results");
      }
    }, 400);
  }, [confirmedCombatants, encounterName, createEncounterWithCombatants, startCombat, navigate, onClose, onConfirmed]);

  if (!isOpen) return null;

  const totalParticipants = allSources.length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ animation: animPhase === "entering" ? "fade-in 0.2s ease-out both" : undefined }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/55 backdrop-blur-sm"
        onClick={animPhase === "idle" ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div
        className="relative w-full max-w-md max-h-[85vh] flex flex-col bg-gradient-to-b from-[#14151f]/95 to-[#0f1019]/98 border border-white/[0.06] rounded-2xl shadow-[0_32px_64px_rgba(0,0,0,0.5),0_0_40px_rgba(234,179,8,0.02)] overflow-hidden"
        style={{ animation: animPhase === "entering" ? "slide-in-up 0.25s ease-out both" : undefined }}
        role="dialog"
        aria-modal="true"
        aria-label="Initiative Roll"
      >
        {/* Top edge light */}
        <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-gold-500/20 to-transparent pointer-events-none z-10" />

        {/* ── HEADER ── */}
        <div className="relative z-[1] p-4 pb-3 border-b border-white/[0.04] shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="relative w-8 h-8 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center">
                <span className="text-sm">🎲</span>
                {isRolling && (
                  <div className="absolute inset-0 rounded-xl border-2 border-transparent border-t-gold-500 animate-spin" style={{ animationDuration: "0.6s" }} />
                )}
              </div>
              <div>
                <h2 className="text-[11px] font-bold text-white/80 uppercase tracking-[0.08em]">
                  Initiative Roll
                </h2>
                <p className="text-[8px] text-surface-500 mt-0.5">
                  {animPhase === "results" || animPhase === "confirming" || animPhase === "confirmed"
                    ? `${totalParticipants} combatants · Click to re-roll`
                    : `${totalParticipants} participant${totalParticipants !== 1 ? "s" : ""}`
                  }
                </p>
              </div>
            </div>
            {animPhase === "idle" && (
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-lg bg-[#0c0d15]/70 border border-white/[0.04] text-surface-500 hover:text-gold-400 hover:border-gold/15 hover:bg-gold-500/8 active:scale-90 transition-all duration-200 flex items-center justify-center"
                aria-label="Close"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Action buttons in header */}
          <div className="flex items-center gap-2 mt-2.5">
            {animPhase === "idle" && (
              <button
                onClick={handleRollAll}
                className="flex-1 py-2 rounded-xl text-[9px] font-bold bg-gradient-to-br from-gold-500/15 to-amber-500/10 border border-gold-500/25 text-gold-400 hover:from-gold-500/25 hover:to-amber-500/15 hover:border-gold-500/35 hover:shadow-[0_0_24px_rgba(234,179,8,0.06)] active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-1.5"
              >
                <span>🎲</span>
                <span>Roll Initiative ({totalParticipants})</span>
              </button>
            )}
            {animPhase === "results" && (
              <>
                <button
                  onClick={handleRollAll}
                  className="flex-1 py-2 rounded-xl text-[9px] font-bold bg-gradient-to-br from-gold-500/12 to-amber-500/8 border border-gold-500/20 text-gold-400 hover:from-gold-500/20 hover:to-amber-500/12 active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-1.5"
                >
                  <span>🎲</span>
                  <span>Re-Roll All</span>
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={isConfirming}
                  className="flex-1 py-2 rounded-xl text-[9px] font-bold bg-gradient-to-br from-emerald-500/15 to-green-500/10 border border-emerald-500/25 text-emerald-400 hover:from-emerald-500/25 hover:to-green-500/15 hover:border-emerald-500/35 hover:shadow-[0_0_24px_rgba(52,211,153,0.06)] disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-1.5"
                >
                  <span>✓</span>
                  <span>Confirm & Start</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* ── BODY: Combatant List ── */}
        <div className="relative z-[1] flex-1 overflow-y-auto scrollbar-gold p-4 pt-3 space-y-1.5" style={{ minHeight: 0 }}>
          {/* Loading state */}
          {isRolling && (
            <div className="flex flex-col items-center justify-center py-10 space-y-3">
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 rounded-full border-2 border-gold-500/20" />
                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-gold-500 animate-spin" style={{ animationDuration: "0.6s" }} />
              </div>
              <p className="text-[9px] text-surface-500 animate-pulse">Rolling initiative...</p>
            </div>
          )}

          {/* Results list */}
          {!isRolling && rollResults.length > 0 && (
            <>
              {/* Sorted turn order header */}
              <div className="flex items-center gap-1.5 px-1 pb-1.5 text-[7px] uppercase tracking-widest text-surface-600 font-bold">
                <span className="w-6 text-center">#</span>
                <span className="flex-1">Combatant</span>
                <span className="w-8 text-center">D20</span>
                <span className="w-6 text-center">DEX</span>
                <span className="w-9 text-center">Total</span>
              </div>

              {/* Sorted combatants */}
              {(() => {
                const sorted = sortByInitiative(confirmedCombatants);
                return sorted.map((combatant, idx) => {
                  const result = rollResults.find(
                    (r) => r.name === combatant.name && r.total === combatant.initiative
                  ) || rollResults[idx];
                  if (!result) return null;

                  const initColor = getInitColor(result.total);
                  const initBg = getInitBgColor(result.total);

                  return (
                    <div
                      key={`${combatant.id}-${idx}`}
                      className="relative flex items-center gap-2 px-2.5 py-2 rounded-xl transition-all duration-200"
                      style={{
                        background: initBg,
                        border: `1px solid ${initColor}15`,
                        animation: `slide-in-up 0.2s ease-out ${idx * 0.04}s both`,
                      }}
                    >
                      {/* Rank badge */}
                      <div className="w-6 text-center shrink-0">
                        <span
                          className="text-[9px] font-black tabular-nums"
                          style={{ color: initColor }}
                        >
                          {idx + 1}
                        </span>
                      </div>

                      {/* Name + type badge */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-white/80 font-medium truncate">
                            {result.name}
                          </span>
                          <span className={`text-[7px] px-1 py-0.5 rounded-full font-medium ${
                            result.type === "player"
                              ? "bg-blue-500/10 text-blue-400 border border-blue-500/15"
                              : result.type === "ally"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15"
                              : "bg-rose-500/10 text-rose-400 border border-rose-500/15"
                          }`}>
                            {result.type === "player" ? "PC" : result.type === "ally" ? "NPC" : "EN"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[8px] text-surface-600">
                            AC {combatant.armorClass} · HP {combatant.hitPoints.current}/{combatant.hitPoints.max}
                          </span>
                        </div>
                      </div>

                      {/* D20 roll */}
                      <div className="flex items-center gap-1">
                        <D20Icon value={result.roll} isRolling={false} color={initColor} />
                      </div>

                      {/* DEX mod */}
                      <div className="w-6 text-center shrink-0">
                        <span className="text-[9px] text-surface-500 tabular-nums">
                          {result.dexMod >= 0 ? `+${result.dexMod}` : result.dexMod}
                        </span>
                      </div>

                      {/* Total */}
                      <div className="w-9 text-center shrink-0">
                        <span
                          className="text-[13px] font-black tabular-nums"
                          style={{ color: initColor }}
                        >
                          {result.total}
                        </span>
                      </div>

                      {/* Re-roll button */}
                      <button
                        onClick={() => {
                          const sourceIdx = allSources.findIndex((s) => s.name === result.name);
                          if (sourceIdx >= 0) handleReRoll(sourceIdx);
                        }}
                        className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded flex items-center justify-center text-[8px] text-surface-600 hover:text-gold-400 hover:bg-gold-500/10 active:scale-90 transition-all"
                        title="Re-roll"
                      >
                        ↻
                      </button>
                    </div>
                  );
                });
              })()}
            </>
          )}

          {/* Empty state (before rolling) */}
          {!isRolling && rollResults.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
              <div className="relative w-14 h-14 rounded-2xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-gold-500/10 to-amber-500/5" />
                <div className="absolute inset-0 rounded-2xl border border-gold-500/20" />
                <span className="absolute inset-0 flex items-center justify-center text-xl">🎲</span>
              </div>
              <p className="text-[10px] text-surface-500 max-w-[200px]">
                Roll initiative for <span className="text-gold-400/80">{totalParticipants}</span> combatants
              </p>
              <p className="text-[8px] text-surface-600">
                Players will be auto-detected from your campaign
              </p>

              {/* Quick preview */}
              <div className="w-full p-2.5 rounded-xl bg-[#07080d]/70 border border-white/[0.04] mt-2">
                <p className="text-[8px] text-surface-600 uppercase tracking-wider font-bold mb-1.5">Participants</p>
                <div className="space-y-1">
                  {playerCombatantSources.map((p, idx) => {
                    const range = getInitiativeRange(p.dexScore || 10);
                    return (
                      <div key={p.id} className="flex items-center gap-2 text-[9px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                        <span className="text-surface-400 flex-1 truncate">{p.name}</span>
                        <span className="text-surface-600 tabular-nums">{range.min}–{range.max}</span>
                      </div>
                    );
                  })}
                  {tokens.map((t, idx) => (
                    <div key={t.id} className="flex items-center gap-2 text-[9px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                      <span className="text-surface-400 flex-1 truncate">{t.name}</span>
                      <span className="text-surface-600 tabular-nums">{getInitiativeRange(10).min}–{getInitiativeRange(10).max}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Confirming state */}
          {animPhase === "confirming" && (
            <div className="flex flex-col items-center justify-center py-8 space-y-3">
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 rounded-full border-2 border-emerald-500/20" />
                <div
                  className="absolute inset-0 rounded-full border-2 border-transparent border-t-emerald-500 animate-spin"
                  style={{ animationDuration: "0.6s" }}
                />
                <span className="absolute inset-0 flex items-center justify-center text-sm">⚔</span>
              </div>
              <p className="text-[10px] text-emerald-400 font-medium">Starting combat...</p>
            </div>
          )}

          {/* Confirmed success */}
          {animPhase === "confirmed" && (
            <div className="flex flex-col items-center justify-center py-8 space-y-2">
              <div
                className="relative w-14 h-14"
                style={{ animation: "slide-in-up 0.3s ease-out both" }}
              >
                <div className="absolute inset-0 rounded-full bg-emerald-500/10 animate-ping" />
                <div className="absolute inset-0 rounded-full bg-emerald-500/15 flex items-center justify-center">
                  <span className="text-xl">✨</span>
                </div>
              </div>
              <p className="text-[12px] text-emerald-400 font-bold">Combat Ready!</p>
              <p className="text-[9px] text-surface-500">
                Redirecting to Battle Maps...
              </p>
            </div>
          )}
        </div>

        {/* ── FOOTER (roll results summary) ── */}
        {animPhase === "results" && rollResults.length > 0 && (
          <div className="relative z-[1] shrink-0 px-4 py-2.5 border-t border-white/[0.04] flex items-center justify-between">
            <div className="flex items-center gap-2 text-[8px] text-surface-600">
              <span>Highest:</span>
              <span className="text-gold-400 font-bold tabular-nums">
                {Math.max(...rollResults.map((r) => r.total))}
              </span>
              <span className="text-surface-700">·</span>
              <span>Lowest:</span>
              <span className="text-rose-400 font-bold tabular-nums">
                {Math.min(...rollResults.map((r) => r.total))}
              </span>
              <span className="text-surface-700">·</span>
              <span>Avg:</span>
              <span className="text-surface-400 font-bold tabular-nums">
                {Math.round(rollResults.reduce((s, r) => s + r.total, 0) / rollResults.length)}
              </span>
            </div>
            <span className="text-[8px] text-surface-700 tabular-nums">{confirmedCombatants.length} combatants</span>
          </div>
        )}
      </div>
    </div>
  );
}
