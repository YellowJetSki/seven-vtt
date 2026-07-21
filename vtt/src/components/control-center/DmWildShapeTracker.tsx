/**
 * STᚱ VTT — DM Wild Shape / Polymorph Statblock Tracker (Sprint 37)
 *
 * Tracks transformed creature statblocks for Druid Wild Shape, Polymorph,
 * Shapechange, and other shape-changing effects in D&D 5.5e.
 *
 * Features:
 *   - Assign transformed creature statblock to any combatant
 *   - Built-in beast shape presets (Wolf, Bear, Giant Spider, Dire Wolf, etc.)
 *   - Track original vs transformed HP pools separately
 *   - Polymorph drops to 0HP → revert to original form
 *   - Custom statblock for non-standard forms
 *   - Visual indicator for transformed creatures
 *   - Active/inactive toggle with original statblock restore
 *
 * Campaign: Arkla — Wendy Swiftfoot (Rogue 5), Kehrfuffle Ironheart (Paladin 5)
 */

import { useState, useMemo, useEffect, useRef } from "react";
import { useUIStore } from "@/stores/uiStore";
import { useCombatStore } from "@/stores/combatStore";
import { useCampaignStore } from "@/stores/campaignStore";
import { useCanvasFocusStore } from "@/stores/canvasFocusStore";
import { useDMSelectionStore } from "@/stores/dmSelectionStore";
import PremiumIcon from "@/components/ui/PremiumIcon";

interface BeastPreset {
  id: string;
  name: string;
  size: string;
  type: string;
  ac: number;
  hp: number;
  speed: string;
  stats: Record<string, number>;
  attacks: { name: string; bonus: number; damage: string; type: string }[];
  specialTraits: string[];
  cr: string;
  source: string;
}

interface TransformationEntry {
  id: string;
  combatantId: string;
  combatantName: string;
  originalMaxHP: number;
  transformation: BeastPreset;
  shapeHp: number;
  isActive: boolean;
  startedAt: number;
  type: "wild_shape" | "polymorph" | "shapechange" | "custom";
}

// ── Beast Presets (CR 0–4) ──
const BEAST_PRESETS: BeastPreset[] = [
  { id: "wolf", name: "Wolf", size: "Medium", type: "Beast", ac: 13, hp: 11, speed: "40 ft", stats: { str: 12, dex: 15, con: 12, int: 3, wis: 12, cha: 6 }, attacks: [{ name: "Bite", bonus: 4, damage: "2d4+2", type: "piercing" }], specialTraits: ["Keen Hearing & Smell", "Pack Tactics"], cr: "1/4", source: "SRD" },
  { id: "brown_bear", name: "Brown Bear", size: "Large", type: "Beast", ac: 11, hp: 34, speed: "40 ft, climb 30 ft", stats: { str: 17, dex: 10, con: 15, int: 2, wis: 13, cha: 7 }, attacks: [{ name: "Claw", bonus: 5, damage: "1d8+3", type: "slashing" }, { name: "Bite", bonus: 5, damage: "2d6+3", type: "piercing" }], specialTraits: ["Keen Smell", "Multiattack"], cr: "1", source: "SRD" },
  { id: "giant_spider", name: "Giant Spider", size: "Large", type: "Beast", ac: 14, hp: 26, speed: "30 ft, climb 30 ft", stats: { str: 14, dex: 16, con: 12, int: 2, wis: 11, cha: 4 }, attacks: [{ name: "Bite", bonus: 5, damage: "1d8+3", type: "piercing" }], specialTraits: ["Spider Climb", "Web Sense", "Web Walker", "Bite: DC 11 CON or 2d6 poison"], cr: "1", source: "SRD" },
  { id: "dire_wolf", name: "Dire Wolf", size: "Large", type: "Beast", ac: 14, hp: 37, speed: "50 ft", stats: { str: 17, dex: 15, con: 15, int: 3, wis: 12, cha: 7 }, attacks: [{ name: "Bite", bonus: 5, damage: "2d6+3", type: "piercing" }], specialTraits: ["Keen Hearing & Smell", "Pack Tactics"], cr: "1", source: "SRD" },
  { id: "giant_elk", name: "Giant Elk", size: "Huge", type: "Beast", ac: 15, hp: 42, speed: "60 ft", stats: { str: 19, dex: 16, con: 14, int: 7, wis: 14, cha: 10 }, attacks: [{ name: "Ram", bonus: 7, damage: "2d6+4", type: "bludgeoning" }, { name: "Hooves", bonus: 7, damage: "1d8+4", type: "bludgeoning" }], specialTraits: ["Charge", "Multiattack"], cr: "2", source: "SRD" },
  { id: "giant_scorpion", name: "Giant Scorpion", size: "Large", type: "Beast", ac: 15, hp: 52, speed: "40 ft", stats: { str: 15, dex: 13, con: 15, int: 1, wis: 9, cha: 3 }, attacks: [{ name: "Claw", bonus: 4, damage: "1d8+2", type: "bludgeoning" }, { name: "Sting", bonus: 4, damage: "1d10+2", type: "piercing" }], specialTraits: ["Multiattack (2 Claws + Sting)", "Sting: DC 12 CON or 4d10 poison"], cr: "3", source: "SRD" },
  { id: "elephant", name: "Elephant", size: "Huge", type: "Beast", ac: 12, hp: 76, speed: "40 ft", stats: { str: 22, dex: 9, con: 17, int: 3, wis: 11, cha: 6 }, attacks: [{ name: "Gore", bonus: 10, damage: "3d8+6", type: "piercing" }, { name: "Stomp", bonus: 10, damage: "3d10+6", type: "bludgeoning" }], specialTraits: ["Trampling Charge", "Multiattack"], cr: "4", source: "SRD" },
];

const CR_TIERS = ["All", "0", "1/8", "1/4", "1/2", "1", "2", "3", "4"] as const;

export default function DmWildShapeTracker() {
  const show = useUIStore((s) => s.showWildShapeTracker);
  const setShow = useUIStore((s) => s.setWildShapeTracker);
  const activeEncounter = useCombatStore((s) => s.activeEncounter);
  const allCharacters = useCampaignStore((s) => s.characters);

  const [transforms, setTransforms] = useState<TransformationEntry[]>([]);
  const [selTargetId, setSelTargetId] = useState("");
  const [searchQ, setSearchQ] = useState("");
  const [crFilt, setCrFilt] = useState("All");
  const [anim, setAnim] = useState<"entering" | "visible" | "exiting">("entering");
  const [expandId, setExpandId] = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const combatants = useMemo(() => activeEncounter?.combatants || [], [activeEncounter]);

  const targetOptions = useMemo(() => {
    const names = new Set<string>();
    const items: { id: string; name: string }[] = [];
    for (const c of combatants) {
      if (!names.has(c.name)) { names.add(c.name); items.push({ id: c.id, name: c.name }); }
    }
    for (const ch of allCharacters) {
      if (!names.has(ch.name)) { names.add(ch.name); items.push({ id: ch.id, name: ch.name }); }
    }
    return items;
  }, [combatants, allCharacters]);

  const filteredPresets = useMemo(() => {
    let list = BEAST_PRESETS;
    if (searchQ.trim()) {
      const q = searchQ.toLowerCase();
      list = list.filter((b) => b.name.toLowerCase().includes(q) || b.type.toLowerCase().includes(q));
    }
    if (crFilt !== "All") list = list.filter((b) => b.cr === crFilt);
    return list;
  }, [searchQ, crFilt]);

  useEffect(() => {
    if (show) { setAnim("entering"); requestAnimationFrame(() => setAnim("visible")); }
    else setAnim("exiting");
  }, [show]);

  useEffect(() => {
    if (!show) return;
    const hk = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    window.addEventListener("keydown", hk);
    return () => window.removeEventListener("keydown", hk);
  }, [show]);

  // Cycle 18: Canvas token click → expand matching transformation
  useEffect(() => {
    if (!show) return;
    const unsub = useDMSelectionStore.subscribe((state) => {
      const selectedId = state.selectedCombatantId;
      if (!selectedId) return;
      const match = transforms.find((t) => t.combatantId === selectedId);
      if (match) {
        setExpandId(match.id);
      }
    });
    return () => unsub();
  }, [show, transforms]);

  const handleClose = () => {
    setAnim("exiting");
    setTimeout(() => setShow(false), 150);
  };

  const handleBackdrop = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) handleClose();
  };

  const applyTransformation = (preset: BeastPreset) => {
    if (!selTargetId) return;
    const target = targetOptions.find((t) => t.id === selTargetId);
    if (!target) return;
    const combatant = combatants.find((c) => c.id === selTargetId);
    const originalMax = combatant?.hitPoints?.max || 30;
    const entry: TransformationEntry = {
      id: `tf_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      combatantId: selTargetId,
      combatantName: target.name,
      originalMaxHP: originalMax,
      transformation: preset,
      shapeHp: preset.hp,
      isActive: true,
      startedAt: Date.now(),
      type: "wild_shape",
    };
    setTransforms((prev) => [entry, ...prev]);
    setSelTargetId("");
  };

  const handleDamage = (tfId: string, dmg: number) => {
    setTransforms((prev) => prev.map((tf) => {
      if (tf.id !== tfId) return tf;
      const newHp = Math.max(0, tf.shapeHp - dmg);
      if (newHp === 0) {
        // KO'd: revert to original form
        return { ...tf, shapeHp: 0, isActive: false };
      }
      return { ...tf, shapeHp: newHp };
    }));
  };

  const handleHeal = (tfId: string, amt: number) => {
    setTransforms((prev) => prev.map((tf) => {
      if (tf.id !== tfId || !tf.isActive) return tf;
      return { ...tf, shapeHp: Math.min(tf.transformation.hp, tf.shapeHp + amt) };
    }));
  };

  const handleRevert = (tfId: string) => {
    setTransforms((prev) => prev.map((tf) => {
      if (tf.id !== tfId) return tf;
      return { ...tf, isActive: false, shapeHp: 0 };
    }));
  };

  const handleReactivate = (tfId: string) => {
    setTransforms((prev) => prev.map((tf) => {
      if (tf.id !== tfId) return tf;
      return { ...tf, isActive: true, shapeHp: tf.transformation.hp };
    }));
  };

  const handleRemove = (tfId: string) => {
    setTransforms((prev) => prev.filter((tf) => tf.id !== tfId));
  };

  const activeTransforms = transforms.filter((t) => t.isActive);
  const inactiveTransforms = transforms.filter((t) => !t.isActive);

  if (!show && anim !== "entering") return null;

  return (
    <div ref={overlayRef} className={`fixed inset-0 z-50 flex items-center justify-center ${anim === "visible" ? "pointer-events-auto" : "pointer-events-none"}`} onClick={handleBackdrop}>
      <div className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200 ${anim === "visible" ? "opacity-100" : "opacity-0"}`} />
      <div className={`relative w-[640px] max-w-[95vw] max-h-[90vh] overflow-y-auto bg-gradient-to-b from-[#14151f]/98 to-[#0f1019]/98 border border-white/[0.06] rounded-2xl shadow-[0_32px_80px_rgba(0,0,0,0.55)] ${anim === "visible" ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"} transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]`}>
        <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-gold-500/25 to-transparent pointer-events-none" />

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/[0.04]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center">
              <PremiumIcon name="sparkles" className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-amber-50">Wild Shape & Polymorph</h2>
              <p className="text-[10px] text-surface-500">{activeTransforms.length} active · {inactiveTransforms.length} reverted</p>
            </div>
          </div>
          <button onClick={handleClose} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/[0.06] active:scale-90 transition-all" aria-label="Close">
            <PremiumIcon name="close" className="w-3.5 h-3.5 text-surface-500" />
          </button>
        </div>

        {/* ── Target Selector ── */}
        <div className="px-5 pt-3 pb-2 border-b border-white/[0.04] space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <select
                value={selTargetId}
                onChange={(e) => setSelTargetId(e.target.value)}
                className="w-full bg-[#07080d]/70 border border-white/[0.06] rounded-lg px-2.5 py-1.5 text-[10px] text-white/80 focus:outline-none focus:border-emerald-500/25 focus:ring-1 focus:ring-emerald-500/15 transition-all"
              >
                <option value="">Select target creature...</option>
                {targetOptions.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <span className="text-[8px] text-surface-600 w-16 text-right tabular-nums">{activeTransforms.length} shapes</span>
          </div>

          {/* Search + CR filter */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <PremiumIcon name="search" className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-surface-600 pointer-events-none" />
              <input
                type="text"
                placeholder="Search beasts by name or type..."
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                className="w-full bg-[#07080d]/70 border border-white/[0.06] rounded-lg pl-7 pr-2.5 py-1 text-[10px] text-white/80 placeholder:text-surface-600 focus:outline-none focus:border-emerald-500/25 focus:ring-1 focus:ring-emerald-500/15 transition-all"
              />
            </div>
            <div className="flex gap-1">
              {CR_TIERS.map((cr) => (
                <button
                  key={cr}
                  onClick={() => setCrFilt(cr)}
                  className={`px-1.5 py-0.5 rounded text-[8px] font-bold border transition-all active:scale-90 ${
                    crFilt === cr ? "bg-emerald-500/12 text-emerald-400 border-emerald-500/20" : "bg-white/[0.02] text-surface-500 border-white/[0.04] hover:text-surface-300"
                  }`}
                >{cr === "All" ? "All" : cr}</button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Active Transformations ── */}
        {transforms.length > 0 && (
          <div className="px-3 pt-3 pb-1 border-b border-white/[0.04]">
            <h3 className="text-[9px] uppercase tracking-wider text-surface-600 font-bold mb-1.5 px-1">
              Transformations {activeTransforms.length > 0 ? `(${activeTransforms.length} active)` : ""}
            </h3>
            <div className="space-y-1.5">
              {transforms.map((tf) => {
                const isExpanded = expandId === tf.id;
                const pct = tf.transformation.hp > 0 ? Math.round((tf.shapeHp / tf.transformation.hp) * 100) : 0;
                const hpColor = pct > 50 ? "text-emerald-400" : pct > 25 ? "text-amber-400" : "text-rose-400";
                const barColor = pct > 50 ? "bg-emerald-500" : pct > 25 ? "bg-amber-500" : "bg-rose-500";
                return (
                  <div
                    key={tf.id}
                    className={`rounded-lg border transition-all duration-200 ${
                      tf.isActive ? "bg-emerald-500/5 border-emerald-500/15" : "bg-surface-800/20 border-white/[0.04] opacity-60"
                    }`}
                  >
                    <button
                      onClick={() => setExpandId(isExpanded ? null : tf.id)}
                      className="w-full text-left px-2.5 py-1.5 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {tf.isActive ? (
                          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.4)] flex-shrink-0" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-surface-600 flex-shrink-0" />
                        )}
                        <span className="text-[10px] font-bold text-white/70 truncate">{tf.combatantName}</span>
                        <button
                          onClick={() => useCanvasFocusStore.getState().setFocusToken(tf.combatantId)}
                          className="w-4 h-4 rounded flex items-center justify-center hover:bg-gold-500/10 hover:text-gold-400 active:scale-90 transition-all text-surface-500 flex-shrink-0"
                          title="Locate transformed creature on map"
                        >
                          <PremiumIcon name="search" className="w-3 h-3" />
                        </button>
                        <span className="text-[8px] text-emerald-400 bg-emerald-500/10 rounded px-1 py-0.5 truncate max-w-[100px]">{tf.transformation.name}</span>
                        {!tf.isActive && <span className="text-[8px] text-rose-400">Reverted</span>}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {tf.isActive && (
                          <span className={`text-[9px] tabular-nums ${hpColor}`}>{tf.shapeHp}/{tf.transformation.hp}</span>
                        )}
                        <PremiumIcon name="chevronRight" className={`w-3 h-3 text-surface-500 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                      </div>
                    </button>

                    {/* HP bar (always visible when active) */}
                    {tf.isActive && (
                      <div className="px-2.5 pb-1.5">
                        <div className="h-1 bg-surface-800/50 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )}

                    {/* Expanded Detail */}
                    {isExpanded && (
                      <div className="px-2.5 pb-2 space-y-1.5">
                        {/* Stat block */}
                        <div className="grid grid-cols-6 gap-0.5">
                          {["STR", "DEX", "CON", "INT", "WIS", "CHA"].map((ab) => {
                            const val = tf.transformation.stats[ab.toLowerCase()] || 10;
                            const mod = Math.floor((val - 10) / 2);
                            return (
                              <div key={ab} className="text-center bg-white/[0.02] rounded py-0.5">
                                <div className="text-[6px] uppercase text-surface-600 font-bold">{ab}</div>
                                <div className="text-[10px] font-bold text-white/80 tabular-nums">{val}</div>
                                <div className={`text-[7px] tabular-nums ${mod >= 0 ? "text-emerald-400" : "text-rose-400"}`}>{mod >= 0 ? `+${mod}` : mod}</div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-1 text-[8px] text-surface-500">
                          <div><span className="text-surface-600">AC:</span> <span className="text-white/60 tabular-nums">{tf.transformation.ac}</span></div>
                          <div><span className="text-surface-600">Speed:</span> <span className="text-white/60">{tf.transformation.speed}</span></div>
                          <div><span className="text-surface-600">CR:</span> <span className="text-white/60">{tf.transformation.cr}</span></div>
                        </div>

                        {/* Attacks */}
                        {tf.transformation.attacks.length > 0 && (
                          <div>
                            <span className="text-[7px] uppercase tracking-wider text-surface-600 font-bold">Attacks</span>
                            <div className="space-y-0.5 mt-0.5">
                              {tf.transformation.attacks.map((atk, i) => (
                                <div key={i} className="flex items-center gap-1.5 text-[8px]">
                                  <span className="text-white/70">{atk.name}</span>
                                  <span className="text-rose-400 tabular-nums">+{atk.bonus}</span>
                                  <span className="text-amber-400 tabular-nums">{atk.damage}</span>
                                  <span className="text-surface-500">{atk.type}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Traits */}
                        {tf.transformation.specialTraits.length > 0 && (
                          <div>
                            <span className="text-[7px] uppercase tracking-wider text-surface-600 font-bold">Traits & Abilities</span>
                            <ul className="list-disc list-inside mt-0.5 space-y-0.5">
                              {tf.transformation.specialTraits.map((t, i) => (
                                <li key={i} className="text-[8px] text-surface-400">{t}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 pt-1">
                          {tf.isActive ? (
                            <>
                              <div className="flex gap-0.5">
                                <button onClick={() => handleDamage(tf.id, 5)} className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-rose-500/12 text-rose-400 border border-rose-500/20 hover:bg-rose-500/18 active:scale-90 transition-all">-5</button>
                                <button onClick={() => handleDamage(tf.id, 10)} className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-rose-500/12 text-rose-400 border border-rose-500/20 hover:bg-rose-500/18 active:scale-90 transition-all">-10</button>
                                <button onClick={() => handleHeal(tf.id, 5)} className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-emerald-500/12 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/18 active:scale-90 transition-all">+5</button>
                                <button onClick={() => handleHeal(tf.id, 10)} className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-emerald-500/12 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/18 active:scale-90 transition-all">+10</button>
                              </div>
                              <button onClick={() => handleRevert(tf.id)} className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-amber-500/12 text-amber-400 border border-amber-500/20 hover:bg-amber-500/18 active:scale-90 transition-all">Revert</button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => handleReactivate(tf.id)} className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-emerald-500/12 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/18 active:scale-90 transition-all">Reactivate</button>
                              <button onClick={() => handleRemove(tf.id)} className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-rose-500/12 text-rose-400 border border-rose-500/20 hover:bg-rose-500/18 active:scale-90 transition-all">Remove</button>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Beast Presets Grid ── */}
        <div className="px-3 pt-3 pb-3">
          <h3 className="text-[9px] uppercase tracking-wider text-surface-600 font-bold mb-1.5 px-1">
            Beast Presets {selTargetId ? `→ Apply to ${targetOptions.find((t) => t.id === selTargetId)?.name || "target"}` : "(Select a target first)"}
          </h3>

          {filteredPresets.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-[10px] text-surface-500">No beasts match your search</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {filteredPresets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => applyTransformation(preset)}
                  disabled={!selTargetId}
                  className={`text-left px-2 py-1.5 rounded-lg border transition-all duration-200 active:scale-[0.97] ${
                    selTargetId
                      ? "bg-white/[0.02] border-white/[0.04] hover:bg-emerald-500/8 hover:border-emerald-500/15"
                      : "bg-white/[0.01] border-white/[0.03] opacity-40 cursor-not-allowed"
                  }`}
                >
                  <div className="text-[9px] font-bold text-white/70 truncate">{preset.name}</div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-[7px] text-surface-500">{preset.size} {preset.type}</span>
                    <span className="text-[7px] text-amber-500 ml-auto tabular-nums">CR {preset.cr}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[7px] text-cyan-400 tabular-nums">AC {preset.ac}</span>
                    <span className="text-[7px] text-emerald-400 tabular-nums">HP {preset.hp}</span>
                    {preset.attacks.length > 0 && (
                      <span className="text-[7px] text-rose-400">⚔ {preset.attacks.length}</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-5 py-2 border-t border-white/[0.04] flex items-center justify-between">
          <span className="text-[8px] text-surface-600">
            {filteredPresets.length} beasts · {activeTransforms.length} active transformations
          </span>
          <span className="text-[7px] text-surface-700">Select target & click beast to apply · Esc to close</span>
        </div>
      </div>
    </div>
  );
}
