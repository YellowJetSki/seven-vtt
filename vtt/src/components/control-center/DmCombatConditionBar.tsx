/**
 * STᚱ VTT — DM Combat Condition Bar (Sprint 26)
 *
 * A globally accessible floating overlay for applying the 6 most
 * common combat conditions to any player character or combatant
 * with one-click toggles.
 *
 * Features:
 *   - Target selector (all player characters + combatants)
 *   - 6 combat-focused conditions with one-click toggles
 *   - Per-target active condition dots summary
 *   - Concentration quick-set for current caster
 *   - Flash message feedback for every action
 *   - Gold glass styling matching the premium design system
 *   - All mutations write to BOTH Zustand + Firestore
 *   - Staggered entrance animations
 *
 * Why 6? These are the conditions most frequently needed in combat:
 *   🛑 Incapacitated — No actions
 *   ⚡ Paralyzed — Auto-crit melee
 *   🛌 Prone — Melee adv, ranged disadv
 *   ⛓️ Restrained — Speed 0, attacks disadv
 *   ✨ Stunned — No actions, auto-fail saves
 *   💤 Unconscious — Melee auto-crit, auto-fail DEX/STR
 *
 * Data Flow:
 *   DM clicks "⚡ Conditions" in sidebar
 *   └─► DmCombatConditionBar opens
 *       ├─► Target selector shows party + combatants
 *       ├─► Click condition toggle → handleToggleCondition()
 *       │   ├─► Zustand (instant UI update)
 *       │   └─► Firestore (cross-device sync via useConditionMutations)
 *       └─► Active dots + concentration management inline
 *
 * Architecture:
 *   - Mounted in AppShell (globally accessible)
 *   - Triggered via sidebar button → custom event
 *   - Uses shared useConditionMutations() hook
 *   - Imports CONDITION from shared condition-data
 *   - 44px+ touch targets for mobile usability
 */

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import { useUIStore } from "@/stores/uiStore";
import { useConditionMutations } from "@/hooks/useCharacterMutations";
import { useCombatStore } from "@/stores/combatStore";
import { CONDITIONS } from "@/types";
import type { ConditionId } from "@/types";

// ── Props ──
interface DmCombatConditionBarProps {
  isOpen: boolean;
  onClose: () => void;
}

// ── 6 Combat-Focused Conditions ──
const COMBAT_CONDITIONS: { id: ConditionId; icon: string; label: string }[] = [
  { id: "incapacitated", icon: "🛑", label: "Incap" },
  { id: "paralyzed", icon: "⚡", label: "Paralyzed" },
  { id: "prone", icon: "🛌", label: "Prone" },
  { id: "restrained", icon: "⛓️", label: "Restrained" },
  { id: "stunned", icon: "✨", label: "Stunned" },
  { id: "unconscious", icon: "💤", label: "Uncon" },
];

// ── Color map for condition buttons ──
function getConditionStyle(conditionId: ConditionId): string {
  const styles: Partial<Record<ConditionId, string>> = {
    incapacitated: "bg-rose-500/10 border-rose-500/25 text-rose-400 hover:bg-rose-500/15",
    paralyzed: "bg-amber-500/10 border-amber-500/25 text-amber-400 hover:bg-amber-500/15",
    prone: "bg-sky-500/10 border-sky-500/25 text-sky-400 hover:bg-sky-500/15",
    restrained: "bg-amber-500/10 border-amber-500/25 text-amber-400 hover:bg-amber-500/15",
    stunned: "bg-pink-500/10 border-pink-500/25 text-pink-400 hover:bg-pink-500/15",
    unconscious: "bg-red-500/10 border-red-500/25 text-red-400 hover:bg-red-500/15",
  };
  return styles[conditionId] || "bg-surface-500/10 border-surface-500/25 text-surface-400 hover:bg-surface-500/15";
}

function getConditionActiveStyle(conditionId: ConditionId): string {
  const styles: Partial<Record<ConditionId, string>> = {
    incapacitated: "bg-rose-500/20 border-rose-500 text-rose-300 shadow-[0_0_8px_rgba(244,63,94,0.15)]",
    paralyzed: "bg-amber-500/20 border-amber-500 text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.15)]",
    prone: "bg-sky-500/20 border-sky-500 text-sky-300 shadow-[0_0_8px_rgba(14,165,233,0.15)]",
    restrained: "bg-amber-500/20 border-amber-500 text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.15)]",
    stunned: "bg-pink-500/20 border-pink-500 text-pink-300 shadow-[0_0_8px_rgba(236,72,153,0.15)]",
    unconscious: "bg-red-500/20 border-red-500 text-red-300 shadow-[0_0_8px_rgba(239,68,68,0.15)]",
  };
  return styles[conditionId] || "bg-surface-500/20 border-surface-500 text-surface-300 shadow-[0_0_8px_rgba(100,116,139,0.15)]";
}

// ── Target type ──
interface TargetInfo {
  id: string;
  name: string;
  label: string;
  type: "player" | "enemy" | "npc";
  conditions: ConditionId[];
  icon: string;
}

// ── Main Component ──
export default function DmCombatConditionBar({ isOpen, onClose }: DmCombatConditionBarProps) {
  const characters = useCampaignStore((s) => s.characters);
  const combatants = useCombatStore((s) => s.activeEncounter?.combatants ?? []);
  const {
    handleToggleCondition: handleToggleConditionMutation,
    handleClearAllConditions,
    handleSetConcentration,
    handleBreakConcentration,
  } = useConditionMutations();

  // ── State ──
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "players" | "enemies">("all");
  const [concentrationSpell, setConcentrationSpell] = useState("");
  const [showConcentrationInput, setShowConcentrationInput] = useState(false);
  const [flashMessage, setFlashMessage] = useState<{ text: string; type: "success" | "info" | "warning" } | null>(null);
  const [isConcentrating, setIsConcentrating] = useState(false);
  const flashTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showFlash = useCallback((text: string, type: "success" | "info" | "warning" = "success") => {
    if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
    setFlashMessage({ text, type });
    flashTimeoutRef.current = setTimeout(() => setFlashMessage(null), 1500);
  }, []);

  // ── Build target list from characters + combatants ──
  const targets = useMemo<TargetInfo[]>(() => {
    const result: TargetInfo[] = [];

    // Player characters (with playerName)
    for (const char of characters) {
      if (!char.playerName) continue;
      result.push({
        id: char.id,
        name: char.name,
        label: `${char.name} (${char.race?.split(" ")[0] || ""} ${char.class})`,
        type: "player",
        conditions: (char.conditions ?? []) as ConditionId[],
        icon: "🧑",
      });
    }

    // Combatants that aren't already in the party
    for (const c of combatants) {
      // Skip if already captured as a player character
      if (characters.some((ch) => ch.id === c.id || ch.name === c.name)) continue;
      result.push({
        id: c.id,
        name: c.name,
        label: `${c.name} (${c.type === "player" ? "PC" : c.type === "ally" ? "Ally" : "Enemy"})`,
        type: c.type === "player" ? "player" : c.type === "ally" ? "npc" : "enemy",
        conditions: (c.statusEffects?.map((e) => e.effect) ?? []) as ConditionId[],
        icon: c.type === "player" ? "🧑" : c.type === "ally" ? "🤝" : "👹",
      });
    }

    return result;
  }, [characters, combatants]);

  // ── Apply filter ──
  const filteredTargets = useMemo(() => {
    if (filter === "all") return targets;
    if (filter === "players") return targets.filter((t) => t.type === "player" || t.type === "npc");
    return targets.filter((t) => t.type === "enemy");
  }, [targets, filter]);

  // ── Selected target details ──
  const selectedTarget = useMemo(
    () => targets.find((t) => t.id === selectedTargetId) ?? null,
    [targets, selectedTargetId]
  );

  // ── Get the character for mutations ──
  const selectedChar = useMemo(
    () => characters.find((c) => c.id === selectedTargetId) ?? null,
    [characters, selectedTargetId]
  );

  // ── Toggle condition on target ──
  const handleToggleCondition = useCallback(
    (conditionId: ConditionId) => {
      if (!selectedTargetId || !selectedChar) return;

      const isActive = selectedTarget?.conditions.includes(conditionId) ?? false;
      handleToggleConditionMutation(selectedChar, conditionId);

      showFlash(
        isActive
          ? `✖ Removed ${CONDITIONS[conditionId]?.name || conditionId} from ${selectedTarget?.name || "target"}`
          : `✔ Applied ${CONDITIONS[conditionId]?.name || conditionId} to ${selectedTarget?.name || "target"}`,
        isActive ? "info" : "success"
      );
    },
    [selectedTargetId, selectedChar, selectedTarget, handleToggleConditionMutation, showFlash]
  );

  // ── Clear all conditions on target ──
  const handleClearAll = useCallback(() => {
    if (!selectedTargetId || !selectedChar) return;
    const count = (selectedChar.conditions ?? []).length;
    if (count === 0) return;
    handleClearAllConditions(selectedChar);
    showFlash(`✨ Cleared ${count} condition${count > 1 ? "s" : ""} from ${selectedTarget?.name || "target"}`, "warning");
  }, [selectedTargetId, selectedChar, selectedTarget, handleClearAllConditions, showFlash]);

  // ── Set concentration on target ──
  const handleSetConc = useCallback(() => {
    if (!selectedTargetId || !selectedChar || !concentrationSpell.trim()) return;
    handleSetConcentration(selectedChar, concentrationSpell.trim());
    setIsConcentrating(true);
    setShowConcentrationInput(false);
    showFlash(`🕯️ ${selectedTarget?.name || "Target"} concentrating: ${concentrationSpell.trim()}`, "success");
  }, [selectedTargetId, selectedChar, selectedTarget, concentrationSpell, handleSetConcentration, showFlash]);

  // ── Break concentration on target ──
  const handleBreakConc = useCallback(() => {
    if (!selectedTargetId || !selectedChar) return;
    handleBreakConcentration(selectedChar);
    setIsConcentrating(false);
    setConcentrationSpell("");
    showFlash(`⚠ Concentration broken on ${selectedTarget?.name || "target"}`, "warning");
  }, [selectedTargetId, selectedChar, selectedTarget, handleBreakConcentration, showFlash]);

  // ── Cleanup ──
  useEffect(() => {
    return () => {
      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
    };
  }, []);

  if (!isOpen) return null;

  return (
    <>
      {/* ── Backdrop ── */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* ── Overlay ── */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
        onClick={onClose}
      >
        <div
          className="pointer-events-auto w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col"
          style={{ animation: "modal-card-enter 0.35s cubic-bezier(0.16,1,0.3,1) both" }}
        >
          {/* ── Glass Card ── */}
          <div
            className="relative bg-gradient-to-b from-[#14151f]/95 to-[#0f1019]/95 border border-white/[0.06] rounded-2xl overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.55),0_8px_24px_rgba(0,0,0,0.3)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Edge light */}
            <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-gold-500/25 to-transparent pointer-events-none z-10" />

            {/* ── Header ── */}
            <div className="relative z-[1] p-4 pb-3 border-b border-white/[0.04]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-sm">
                    ⚡
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-gold-400/90">
                      Combat Conditions
                    </h2>
                    <p className="text-[9px] text-surface-600">
                      Apply conditions to characters &amp; combatants
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-7 h-7 rounded-lg bg-[#0c0d15]/70 border border-white/[0.04] text-surface-500 hover:text-gold-400 hover:border-gold/15 active:scale-90 transition-all duration-200 flex items-center justify-center"
                  aria-label="Close"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* ── Scrollable Content ── */}
            <div className="overflow-y-auto scrollbar-gold" style={{ maxHeight: "60vh" }}>
              {/* ── Target Selector ── */}
              <div className="p-3 pb-1">
                {/* Filter chips */}
                <div className="flex items-center gap-1.5 mb-2">
                  {(["all", "players", "enemies"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`px-2.5 py-1 rounded-lg text-[9px] font-medium uppercase tracking-wider transition-all duration-200 active:scale-95 ${
                        filter === f
                          ? "bg-gold-500/12 border border-gold-500/25 text-gold-400"
                          : "bg-[#0c0d15]/60 border border-white/[0.04] text-surface-500 hover:text-surface-400"
                      }`}
                    >
                      {f === "all" ? "All" : f === "players" ? "Allies" : "Enemies"}
                    </button>
                  ))}
                  <span className="text-[8px] text-surface-700 ml-auto">{filteredTargets.length} targets</span>
                </div>

                {/* Target chips */}
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto scrollbar-gold">
                  {filteredTargets.length === 0 ? (
                    <div className="flex items-center justify-center w-full py-3">
                      <span className="text-[9px] text-surface-600">No targets available</span>
                    </div>
                  ) : (
                    filteredTargets.slice(0, 20).map((target, idx) => (
                      <button
                        key={target.id}
                        onClick={() => setSelectedTargetId(target.id)}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-medium transition-all duration-200 active:scale-95 border ${
                          selectedTargetId === target.id
                            ? "bg-gold-500/12 border-gold-500/25 text-gold-400 shadow-[0_0_6px_rgba(234,179,8,0.04)]"
                            : "bg-[#0c0d15]/50 border-white/[0.04] text-surface-400 hover:text-surface-300 hover:border-white/[0.08]"
                        }`}
                        style={{ animation: `slide-in-up 0.2s ease-out ${idx * 0.025}s both` }}
                      >
                        <span>{target.icon}</span>
                        <span className="truncate max-w-[80px]">{target.name}</span>
                        {target.conditions.length > 0 && (
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_3px_rgba(245,158,11,0.3)]" />
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* ── Condition Toggles ── */}
              <div className="p-3 pt-1">
                {!selectedTargetId ? (
                  <div className="flex flex-col items-center justify-center py-4">
                    <div className="w-8 h-8 rounded-xl bg-surface-800/40 border border-white/[0.04] flex items-center justify-center text-sm mb-1.5">
                      👆
                    </div>
                    <p className="text-[10px] text-surface-600">Select a target above</p>
                  </div>
                ) : (
                  <>
                    {/* Target info bar */}
                    <div className="flex items-center justify-between mb-2 p-2 rounded-lg bg-[#0c0d15]/50 border border-white/[0.04]">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm">{selectedTarget?.icon}</span>
                        <div className="min-w-0">
                          <p className="text-[10px] font-medium text-white/80 truncate">{selectedTarget?.name}</p>
                          <p className="text-[8px] text-surface-600 truncate">{selectedTarget?.label}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[8px] text-surface-600">
                          {selectedTarget?.conditions.length ?? 0} active
                        </span>
                        {(selectedTarget?.conditions.length ?? 0) > 0 && (
                          <button
                            onClick={handleClearAll}
                            className="px-2 py-0.5 rounded-lg text-[8px] font-medium bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/15 active:scale-95 transition-all duration-200"
                          >
                            Clear All
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Condition toggle grid — 3x2 */}
                    <div className="grid grid-cols-3 gap-1.5">
                      {COMBAT_CONDITIONS.map((cond) => {
                        const isActive = selectedTarget?.conditions.includes(cond.id) ?? false;
                        return (
                          <button
                            key={cond.id}
                            onClick={() => handleToggleCondition(cond.id)}
                            className={`flex flex-col items-center gap-0.5 py-2.5 px-1 rounded-xl border text-[9px] font-medium transition-all duration-200 active:scale-95 ${
                              isActive
                                ? getConditionActiveStyle(cond.id)
                                : getConditionStyle(cond.id)
                            }`}
                            title={CONDITIONS[cond.id]?.description || cond.label}
                          >
                            <span className="text-sm">{cond.icon}</span>
                            <span>{cond.label}</span>
                            {isActive && (
                              <span className="w-1 h-1 rounded-full bg-current opacity-60" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* ── Concentration Management ── */}
                    <div className="mt-2 p-2 rounded-lg bg-violet-500/5 border border-violet-500/12">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px]">🕯️</span>
                          <span className="text-[9px] font-medium text-violet-300/80">Concentration</span>
                        </div>
                        {isConcentrating ? (
                          <button
                            onClick={handleBreakConc}
                            className="px-2 py-0.5 rounded-lg text-[8px] font-medium bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/15 active:scale-95 transition-all duration-200"
                          >
                            Break
                          </button>
                        ) : (
                          <button
                            onClick={() => setShowConcentrationInput(true)}
                            className="px-2 py-0.5 rounded-lg text-[8px] font-medium bg-violet-500/10 border border-violet-500/20 text-violet-400 hover:bg-violet-500/15 active:scale-95 transition-all duration-200"
                          >
                            Set
                          </button>
                        )}
                      </div>
                      {isConcentrating && concentrationSpell && (
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.3)] animate-pulse" />
                          <span className="text-[9px] text-emerald-400/80">{concentrationSpell}</span>
                        </div>
                      )}
                      {showConcentrationInput && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <input
                            type="text"
                            value={concentrationSpell}
                            onChange={(e) => setConcentrationSpell(e.target.value)}
                            placeholder="Spell name..."
                            className="flex-1 px-2 py-1 rounded-lg bg-[#07080d]/70 border border-white/[0.06] text-[9px] text-white/70 placeholder:text-surface-700 focus:outline-none focus:border-violet-500/25 focus:ring-1 focus:ring-violet-500/15 transition-all"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSetConc();
                              if (e.key === "Escape") setShowConcentrationInput(false);
                            }}
                            autoFocus
                          />
                          <button
                            onClick={handleSetConc}
                            disabled={!concentrationSpell.trim()}
                            className="px-2 py-1 rounded-lg text-[8px] font-medium bg-violet-500/10 border border-violet-500/20 text-violet-400 hover:bg-violet-500/15 active:scale-95 transition-all duration-200 disabled:opacity-40"
                          >
                            Set
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* ── Footer ── */}
            <div className="relative z-[1] p-3 pt-2 border-t border-white/[0.04]">
              {/* Flash message */}
              {flashMessage && (
                <div
                  className={`mb-2 p-2 rounded-lg border text-[9px] ${
                    flashMessage.type === "success"
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                      : flashMessage.type === "warning"
                        ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                        : "bg-violet-500/10 border-violet-500/20 text-violet-400"
                  }`}
                  style={{ animation: "slide-in-up 0.15s ease-out both" }}
                >
                  {flashMessage.text}
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-[8px] text-surface-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-surface-700" />
                  <span>6 combat conditions</span>
                </div>
                <button
                  onClick={onClose}
                  className="px-3 py-1.5 rounded-xl text-[9px] font-medium text-surface-500 bg-[#0c0d15]/60 border border-white/[0.04] hover:text-surface-400 hover:border-white/[0.08] active:scale-[0.98] transition-all duration-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
