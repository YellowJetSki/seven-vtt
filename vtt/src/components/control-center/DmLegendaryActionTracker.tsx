/**
 * STᚱ VTT — DM Legendary & Lair Action Tracker Popover
 *
 * Complete tracking system for legendary actions, legendary resistances,
 * rechargeable abilities, and lair actions per initiative round.
 *
 * 5.5e RAW Implementation:
 *   - Legendary Actions: 3 per round (1 per turn). Reset at top of round.
 *   - Legendary Resistances: Per-day pool. Expend to auto-save.
 *   - Lair Actions: 1 per round. Happen on initiative count 20.
 *   - Mythic Actions: Trigger at 50% HP. 1 per round.
 *   - Recharge: d6-based "Recharge 5-6" tracking per creature.
 *
 * Campaign: Arkla — Wendy Swiftfoot (Rogue 5), Kehrfuffle Ironheart (Paladin 5)
 */

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useUIStore } from "@/stores/uiStore";
import { useCombatStore } from "@/stores/combatStore";
import PremiumIcon from "@/components/ui/PremiumIcon";

interface LegendaryCombatant {
  id: string;
  name: string;
  type: "player" | "enemy" | "ally";
  isLegendary: boolean;
  legendaryActionsRemaining: number;
  maxLegendaryActions: number;
  legendaryResistancesRemaining: number;
  maxLegendaryResistances: number;
  hasMythicPhase: boolean;
  mythicTriggered: boolean;
  mythicActionsRemaining: number;
  maxMythicActions: number;
  lairActionsEnabled: boolean;
  hasLairActions: boolean;
  lairActionUsedThisRound: boolean;
  rechargeAbilities: RechargeAbility[];
  notes: string;
}

interface RechargeAbility {
  id: string;
  name: string;
  rechargeMin: number; // 5 or 6 — dice roll threshold
  isAvailable: boolean;
}

const DEFAULT_LEGENDARY_MAX = 3;
const DEFAULT_RESISTANCE_MAX = 3;
const DEFAULT_MYTHIC_ACTIONS = 1;

const DRAGON_TYPES = ["dragon", "ancient dragon", "wyrm", "dracolich", "greatwyrm"];
const LEGENDARY_TYPES = ["dragon", "lich", "demon lord", "devil", "giant", "archfey", "celestial"];
const MYTHIC_TYPES = ["ancient dragon", "demon lord", "titan", "avatar"];

function detectIsLegendary(name: string): boolean {
  const lower = name.toLowerCase();
  return LEGENDARY_TYPES.some((t) => lower.includes(t)) || lower.includes("legendary");
}

function detectIsMythic(name: string): boolean {
  const lower = name.toLowerCase();
  return MYTHIC_TYPES.some((t) => lower.includes(t)) || lower.includes("mythic");
}

function detectHasLair(name: string): boolean {
  const lower = name.toLowerCase();
  return DRAGON_TYPES.some((t) => lower.includes(t)) || lower.includes("lair");
}

export default function DmLegendaryActionTracker() {
  const show = useUIStore((s) => s.showLegendaryTracker);
  const setShow = useUIStore((s) => s.setLegendaryTracker);
  const activeEncounter = useCombatStore((s) => s.activeEncounter);

  const [customCombatants, setCustomCombatants] = useState<LegendaryCombatant[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [animPhase, setAnimPhase] = useState<"entering" | "visible" | "exiting">("entering");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newLegendary, setNewLegendary] = useState(true);
  const [newResistances, setNewResistances] = useState(3);
  const [newLair, setNewLair] = useState(false);
  const [newMythic, setNewMythic] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (show) { setAnimPhase("entering"); requestAnimationFrame(() => setAnimPhase("visible")); }
    else setAnimPhase("exiting");
  }, [show]);

  useEffect(() => {
    if (!show) return;
    const hk = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    window.addEventListener("keydown", hk);
    return () => window.removeEventListener("keydown", hk);
  }, [show]);

  const handleClose = useCallback(() => {
    setAnimPhase("exiting");
    setTimeout(() => { setShow(false); setShowAddForm(false); }, 150);
  }, [setShow]);

  const handleBackdrop = useCallback((e: React.MouseEvent) => {
    if (e.target === overlayRef.current) handleClose();
  }, [handleClose]);

  // Detect legendary creatures from active encounter
  const encounterLegendaries = useMemo(() => {
    const combatants = activeEncounter?.combatants || [];
    return combatants
      .filter((c) => c.type === "enemy" && (detectIsLegendary(c.name) || detectHasLair(c.name)))
      .map((c) => ({
        id: c.id,
        name: c.name,
        type: c.type,
        isLegendary: detectIsLegendary(c.name) || true,
        legendaryActionsRemaining: 3,
        maxLegendaryActions: 3,
        legendaryResistancesRemaining: detectIsLegendary(c.name) ? 3 : 0,
        maxLegendaryResistances: detectIsLegendary(c.name) ? 3 : 0,
        hasMythicPhase: detectIsMythic(c.name),
        mythicTriggered: false,
        mythicActionsRemaining: 1,
        maxMythicActions: 1,
        lairActionsEnabled: detectHasLair(c.name),
        hasLairActions: detectHasLair(c.name),
        lairActionUsedThisRound: false,
        rechargeAbilities: [],
        notes: "",
      }));
  }, [activeEncounter]);

  // Merge encounter-detected + custom combatants
  const allLegendaries = useMemo(() => {
    const map = new Map<string, LegendaryCombatant>();
    for (const enc of encounterLegendaries) map.set(enc.id, enc);
    for (const cc of customCombatants) map.set(cc.id, cc);
    return Array.from(map.values());
  }, [encounterLegendaries, customCombatants]);

  const roundNumber = activeEncounter?.round || 1;

  const handleResetRound = useCallback(() => {
    setCustomCombatants((prev) =>
      prev.map((c) => ({
        ...c,
        legendaryActionsRemaining: c.maxLegendaryActions,
        lairActionUsedThisRound: false,
        mythicActionsRemaining: c.mythicTriggered ? c.maxMythicActions : 0,
        rechargeAbilities: c.rechargeAbilities.map((ra) => ({ ...ra, isAvailable: true })),
      }))
    );
  }, []);

  const handleActionUsed = useCallback((id: string) => {
    setCustomCombatants((prev) =>
      prev.map((c) =>
        c.id === id && c.legendaryActionsRemaining > 0
          ? { ...c, legendaryActionsRemaining: c.legendaryActionsRemaining - 1 }
          : c
      )
    );
  }, []);

  const handleResistanceUsed = useCallback((id: string) => {
    setCustomCombatants((prev) =>
      prev.map((c) =>
        c.id === id && c.legendaryResistancesRemaining > 0
          ? { ...c, legendaryResistancesRemaining: c.legendaryResistancesRemaining - 1 }
          : c
      )
    );
  }, []);

  const handleLairActionUsed = useCallback((id: string) => {
    setCustomCombatants((prev) =>
      prev.map((c) =>
        c.id === id && c.hasLairActions
          ? { ...c, lairActionUsedThisRound: !c.lairActionUsedThisRound }
          : c
      )
    );
  }, []);

  const handleTriggerMythic = useCallback((id: string) => {
    setCustomCombatants((prev) =>
      prev.map((c) =>
        c.id === id && c.hasMythicPhase && !c.mythicTriggered
          ? { ...c, mythicTriggered: true, mythicActionsRemaining: c.maxMythicActions }
          : c
      )
    );
  }, []);

  const handleMythicActionUsed = useCallback((id: string) => {
    setCustomCombatants((prev) =>
      prev.map((c) =>
        c.id === id && c.mythicActionsRemaining > 0
          ? { ...c, mythicActionsRemaining: c.mythicActionsRemaining - 1 }
          : c
      )
    );
  }, []);

  const handleAddRecharge = useCallback((combatantId: string) => {
    const name = prompt("Recharge ability name (e.g., 'Fire Breath'):");
    if (!name) return;
    setCustomCombatants((prev) =>
      prev.map((c) =>
        c.id === combatantId
          ? {
              ...c,
              rechargeAbilities: [
                ...c.rechargeAbilities,
                {
                  id: `rech_${Date.now()}`,
                  name,
                  rechargeMin: 5,
                  isAvailable: true,
                },
              ],
            }
          : c
      )
    );
  }, []);

  const handleToggleRecharge = useCallback((combatantId: string, abilityId: string) => {
    setCustomCombatants((prev) =>
      prev.map((c) =>
        c.id === combatantId
          ? {
              ...c,
              rechargeAbilities: c.rechargeAbilities.map((ra) =>
                ra.id === abilityId ? { ...ra, isAvailable: !ra.isAvailable } : ra
              ),
            }
          : c
      )
    );
  }, []);

  const handleRemoveRecharge = useCallback((combatantId: string, abilityId: string) => {
    setCustomCombatants((prev) =>
      prev.map((c) =>
        c.id === combatantId
          ? { ...c, rechargeAbilities: c.rechargeAbilities.filter((ra) => ra.id !== abilityId) }
          : c
      )
    );
  }, []);

  const handleAddCustom = useCallback(() => {
    if (!newName.trim()) return;
    const id = `legendary_${Date.now()}`;
    setCustomCombatants((prev) => [
      ...prev,
      {
        id,
        name: newName.trim(),
        type: "enemy",
        isLegendary: newLegendary,
        legendaryActionsRemaining: newLegendary ? 3 : 0,
        maxLegendaryActions: newLegendary ? 3 : 0,
        legendaryResistancesRemaining: newLegendary ? newResistances : 0,
        maxLegendaryResistances: newLegendary ? newResistances : 0,
        hasMythicPhase: newMythic,
        mythicTriggered: false,
        mythicActionsRemaining: newMythic ? 1 : 0,
        maxMythicActions: newMythic ? 1 : 0,
        lairActionsEnabled: newLair,
        hasLairActions: newLair,
        lairActionUsedThisRound: false,
        rechargeAbilities: [],
        notes: "",
      },
    ]);
    setNewName("");
    setShowAddForm(false);
  }, [newName, newLegendary, newResistances, newLair, newMythic]);

  const handleRemove = useCallback((id: string) => {
    setCustomCombatants((prev) => prev.filter((c) => c.id !== id));
  }, []);

  if (!show && animPhase !== "entering") return null;

  return (
    <div
      ref={overlayRef}
      className={`fixed inset-0 z-50 flex items-center justify-center ${animPhase === "visible" ? "pointer-events-auto" : "pointer-events-none"}`}
      onClick={handleBackdrop}
    >
      <div className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200 ${animPhase === "visible" ? "opacity-100" : "opacity-0"}`} />

      <div className={`relative w-[620px] max-w-[95vw] max-h-[85vh] overflow-y-auto bg-gradient-to-b from-[#14151f]/98 to-[#0f1019]/98 border border-white/[0.06] rounded-2xl shadow-[0_32px_80px_rgba(0,0,0,0.55)] ${animPhase === "visible" ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"} transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]`}>
        <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-gold-500/25 to-transparent pointer-events-none" />

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/[0.04]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/15 flex items-center justify-center">
              <PremiumIcon name="attack" className="w-4 h-4 text-rose-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-amber-50">Legendary Actions Tracker</h2>
              <p className="text-[10px] text-surface-500">Track legendary actions, resistances, lair actions & recharges</p>
            </div>
          </div>
          <button onClick={handleClose} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/[0.06] active:scale-90 transition-all duration-150" aria-label="Close">
            <PremiumIcon name="close" className="w-3.5 h-3.5 text-surface-500" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* ── Round Reset Controls ── */}
          {allLegendaries.length > 0 && (
            <div className="flex items-center justify-between bg-white/[0.02] border border-white/[0.04] rounded-xl px-3 py-2">
              <span className="text-[10px] text-surface-400">
                Round <span className="text-gold-300 font-bold tabular-nums">{roundNumber}</span>
                {" · "}
                {allLegendaries.length} legendary creature{allLegendaries.length !== 1 ? "s" : ""}
              </span>
              <button
                onClick={handleResetRound}
                className="px-2.5 py-1 rounded-lg text-[9px] font-bold bg-rose-500/12 text-rose-400 border border-rose-500/20 hover:bg-rose-500/18 active:scale-[0.97] transition-all duration-150"
              >
                Reset Round (Top)
              </button>
            </div>
          )}

          {/* ── Add Custom Button ── */}
          <button
            onClick={() => setShowAddForm((p) => !p)}
            className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-rose-500/12 text-rose-400 border border-rose-500/20 hover:bg-rose-500/18 active:scale-[0.97] transition-all duration-150 flex items-center gap-1.5"
          >
            <PremiumIcon name="plus" className="w-3 h-3" />
            {showAddForm ? "Cancel" : "Add Legendary Creature"}
          </button>

          {/* ── Add Form ── */}
          {showAddForm && (
            <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-4 space-y-3 animate-in slide-in-from-bottom-1 duration-200">
              <div>
                <label className="text-[9px] uppercase tracking-wider text-surface-500 font-bold block mb-1">Creature Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleAddCustom(); }}
                  className="w-full bg-[#07080d]/70 border border-white/[0.06] rounded-lg px-3 py-1.5 text-xs text-white/80 placeholder:text-surface-600 focus:outline-none focus:border-gold-500/25 focus:ring-1 focus:ring-gold-500/15 transition-all"
                  placeholder="e.g. Ancient Red Dragon, Lich King..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={newLegendary} onChange={() => setNewLegendary((p) => !p)} className="w-3 h-3 accent-gold-500" />
                  <span className="text-[9px] text-surface-400">Legendary Actions</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={newLair} onChange={() => setNewLair((p) => !p)} className="w-3 h-3 accent-amber-500" />
                  <span className="text-[9px] text-surface-400">Lair Actions</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={newMythic} onChange={() => setNewMythic((p) => !p)} className="w-3 h-3 accent-violet-500" />
                  <span className="text-[9px] text-surface-400">Mythic Phase</span>
                </label>
                {newLegendary && (
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-surface-500">Resistances:</span>
                    <input
                      type="number"
                      min={0}
                      max={5}
                      value={newResistances}
                      onChange={(e) => setNewResistances(Math.max(0, Math.min(5, parseInt(e.target.value) || 0)))}
                      className="w-12 bg-[#07080d]/70 border border-white/[0.06] rounded px-1.5 py-0.5 text-[10px] text-white/80 text-center focus:outline-none focus:border-gold-500/25 tabular-nums"
                    />
                  </div>
                )}
              </div>
              <button
                onClick={handleAddCustom}
                disabled={!newName.trim()}
                className="w-full py-1.5 rounded-lg text-[10px] font-bold bg-rose-500/12 text-rose-400 border border-rose-500/20 hover:bg-rose-500/18 active:scale-[0.97] transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Add Creature
              </button>
            </div>
          )}

          {/* ── Empty State ── */}
          {allLegendaries.length === 0 && (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-xl bg-rose-500/8 border border-rose-500/10 flex items-center justify-center mx-auto mb-3">
                <PremiumIcon name="sword" className="w-6 h-6 text-rose-400/60" />
              </div>
              <p className="text-xs text-surface-500">No legendary creatures detected</p>
              <p className="text-[9px] text-surface-600 mt-1">
                Add custom creatures or they will auto-detect from active battle map enemies
              </p>
            </div>
          )}

          {/* ── Legendary Creature Cards ── */}
          {allLegendaries.length > 0 && (
            <div className="space-y-2">
              {allLegendaries.map((creature) => {
                const isExpanded = expandedId === creature.id;
                return (
                  <div
                    key={creature.id}
                    className="bg-white/[0.02] border border-white/[0.04] rounded-xl overflow-hidden hover:bg-white/[0.03] transition-colors"
                  >
                    {/* ── Card Header ── */}
                    <div
                      className="flex items-center justify-between px-3 py-2.5 cursor-pointer"
                      onClick={() => setExpandedId(isExpanded ? null : creature.id)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                        <span className="text-[11px] font-bold text-white/80">{creature.name}</span>
                        {creature.hasMythicPhase && creature.mythicTriggered && (
                          <span className="text-[8px] text-violet-400 bg-violet-500/10 border border-violet-500/15 rounded px-1 py-0.5">Mythic</span>
                        )}
                        {creature.hasLairActions && (
                          <span className="text-[8px] text-amber-400 bg-amber-500/10 border border-amber-500/15 rounded px-1 py-0.5">Lair</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {creature.isLegendary && (
                          <span className={`text-[9px] font-mono tabular-nums ${creature.legendaryActionsRemaining > 0 ? "text-gold-300" : "text-rose-500"}`}>
                            ⚡ {creature.legendaryActionsRemaining}/{creature.maxLegendaryActions}
                          </span>
                        )}
                        <button onClick={(e) => { e.stopPropagation(); handleRemove(creature.id); }} className="w-5 h-5 rounded flex items-center justify-center hover:bg-white/[0.06] active:scale-90 transition-all">
                          <PremiumIcon name="close" className="w-3 h-3 text-surface-500" />
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-3 pb-3 space-y-2 border-t border-white/[0.04] pt-2">
                        {/* ── Legendary Actions Row ── */}
                        {creature.isLegendary && (
                          <div className="flex items-center justify-between bg-rose-500/8 border border-rose-500/10 rounded-lg px-2.5 py-1.5">
                            <div className="flex items-center gap-1.5">
                              <PremiumIcon name="attack" className="w-3 h-3 text-rose-400" />
                              <span className="text-[9px] text-surface-400">Legendary Actions</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] font-mono tabular-nums text-gold-300">{creature.legendaryActionsRemaining}/{creature.maxLegendaryActions}</span>
                              <button
                                onClick={() => handleActionUsed(creature.id)}
                                disabled={creature.legendaryActionsRemaining <= 0}
                                className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-rose-500/12 text-rose-400 border border-rose-500/20 hover:bg-rose-500/18 active:scale-90 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                              >
                                Use
                              </button>
                            </div>
                          </div>
                        )}

                        {/* ── Legendary Resistances Row ── */}
                        {(creature.maxLegendaryResistances > 0) && (
                          <div className="flex items-center justify-between bg-amber-500/8 border border-amber-500/10 rounded-lg px-2.5 py-1.5">
                            <div className="flex items-center gap-1.5">
                              <PremiumIcon name="shield" className="w-3 h-3 text-amber-400" />
                              <span className="text-[9px] text-surface-400">Legendary Resistances</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] font-mono tabular-nums text-amber-300">{creature.legendaryResistancesRemaining}/{creature.maxLegendaryResistances}</span>
                              <button
                                onClick={() => handleResistanceUsed(creature.id)}
                                disabled={creature.legendaryResistancesRemaining <= 0}
                                className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-amber-500/12 text-amber-400 border border-amber-500/20 hover:bg-amber-500/18 active:scale-90 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                              >
                                Use
                              </button>
                            </div>
                          </div>
                        )}

                        {/* ── Lair Actions Row ── */}
                        {creature.hasLairActions && (
                          <div className="flex items-center justify-between bg-emerald-500/8 border border-emerald-500/10 rounded-lg px-2.5 py-1.5">
                            <div className="flex items-center gap-1.5">
                              <PremiumIcon name="aoe" className="w-3 h-3 text-emerald-400" />
                              <span className="text-[9px] text-surface-400">Lair Action</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className={`text-[10px] tabular-nums ${creature.lairActionUsedThisRound ? "text-rose-500" : "text-emerald-400"}`}>
                                {creature.lairActionUsedThisRound ? "Used" : "Available"}
                              </span>
                              <button
                                onClick={() => handleLairActionUsed(creature.id)}
                                className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-emerald-500/12 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/18 active:scale-90 transition-all"
                              >
                                {creature.lairActionUsedThisRound ? "Reset" : "Use"}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* ── Mythic Phase Row ── */}
                        {creature.hasMythicPhase && (
                          <div className="flex items-center justify-between bg-violet-500/8 border border-violet-500/10 rounded-lg px-2.5 py-1.5">
                            <div className="flex items-center gap-1.5">
                              <PremiumIcon name="sparkles" className="w-3 h-3 text-violet-400" />
                              <span className="text-[9px] text-surface-400">Mythic Actions</span>
                            </div>
                            <div className="flex items-center gap-1">
                              {!creature.mythicTriggered ? (
                                <button
                                  onClick={() => handleTriggerMythic(creature.id)}
                                  className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-violet-500/12 text-violet-400 border border-violet-500/20 hover:bg-violet-500/18 active:scale-90 transition-all"
                                >
                                  Trigger Mythic
                                </button>
                              ) : (
                                <>
                                  <span className="text-[10px] font-mono tabular-nums text-violet-300">{creature.mythicActionsRemaining}/{creature.maxMythicActions}</span>
                                  <button
                                    onClick={() => handleMythicActionUsed(creature.id)}
                                    disabled={creature.mythicActionsRemaining <= 0}
                                    className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-violet-500/12 text-violet-400 border border-violet-500/20 hover:bg-violet-500/18 active:scale-90 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                                  >
                                    Use
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        )}

                        {/* ── Recharge Abilities ── */}
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] text-surface-500">Recharge Abilities</span>
                          <button
                            onClick={() => handleAddRecharge(creature.id)}
                            className="text-[8px] text-surface-500 hover:text-amber-400 active:scale-90 transition-all px-1.5 py-0.5"
                          >
                            + Add Recharge
                          </button>
                        </div>
                        {creature.rechargeAbilities.length > 0 && (
                          <div className="space-y-1">
                            {creature.rechargeAbilities.map((ra) => (
                              <div key={ra.id} className="flex items-center justify-between bg-slate-900/50 border border-white/[0.03] rounded-lg px-2.5 py-1.5">
                                <div className="flex items-center gap-2">
                                  <span className="text-[9px] text-surface-300">{ra.name}</span>
                                  <span className="text-[8px] text-surface-600">Recharge {ra.rechargeMin}-6</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleToggleRecharge(creature.id, ra.id)}
                                    className={`px-1.5 py-0.5 rounded text-[8px] font-bold transition-all active:scale-90 ${ra.isAvailable ? "bg-emerald-500/12 text-emerald-400 border border-emerald-500/20" : "bg-slate-500/12 text-slate-400 border border-slate-500/20"}`}
                                  >
                                    {ra.isAvailable ? "Available" : "Used"}
                                  </button>
                                  <button
                                    onClick={() => handleRemoveRecharge(creature.id, ra.id)}
                                    className="w-4 h-4 rounded flex items-center justify-center hover:bg-white/[0.06] active:scale-90"
                                  >
                                    <PremiumIcon name="close" className="w-2.5 h-2.5 text-surface-600" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* ── D&D 5.5e Rules Reference ── */}
                        <details className="text-[8px] text-surface-500">
                          <summary className="cursor-pointer hover:text-amber-400 transition-colors">5.5e Rules Reference</summary>
                          <div className="mt-1 space-y-0.5 pl-2 border-l border-white/[0.04]">
                            <p>• Legendary Actions: 3 per round, 1 at a time after another creature's turn</p>
                            <p>• Legendary Resistances: Expend to automatically succeed on a failed save</p>
                            <p>• Lair Actions: 1 per round, takes effect on initiative count 20</p>
                            <p>• Mythic Actions: Triggered at 50% HP, unlocks once per round</p>
                            <p>• Recharge: After using, roll d6 at start of turn. On {">="} recharge_min, it recharges</p>
                          </div>
                        </details>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="px-5 py-2 border-t border-white/[0.04] flex items-center justify-between">
          <span className="text-[8px] text-surface-600">
            {allLegendaries.length} tracked · Round {roundNumber} · {allLegendaries.reduce((a, c) => a + c.legendaryActionsRemaining, 0)} legendary actions remaining
          </span>
          <span className="text-[7px] text-surface-700">Esc to close</span>
        </div>
      </div>
    </div>
  );
}
