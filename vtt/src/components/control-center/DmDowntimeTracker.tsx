/**
 * STᚱ VTT — DM Rest & Downtime Activity Tracker (Sprint 38)
 *
 * Comprehensive downtime management tool for between-session activities
 * in D&D 5.5e. Supports all core downtime activities:
 *   - Training (levels, feats, languages, tools)
 *   - Crafting (items, potions, scrolls, magic items)
 *   - Research (lore, spells, quest intel)
 *   - Carousing (contacts, renown, rumors)
 *   - Scribing Scrolls (spell scroll creation)
 *   - Pit Fighting / Gambling (gold earning)
 *   - Religious Service (temple patronage)
 *   - Work (earn gold per day)
 *   - Luxury Rest / Recovery (remove exhaustion, heal long-term injuries)
 *   - Copy Spells to Spellbook (Wizard)
 *
 * Campaign: Arkla — Wendy Swiftfoot (Rogue 5), Kehrfuffle Ironheart (Paladin 5)
 */

import { useState, useMemo, useEffect, useRef } from "react";
import { useUIStore } from "@/stores/uiStore";
import { useCampaignStore } from "@/stores/campaignStore";
import PremiumIcon from "@/components/ui/PremiumIcon";

interface DowntimeEntry {
  id: string;
  charId: string;
  charName: string;
  activity: string;
  activityType: DowntimeActivityType;
  daysSpent: number;
  daysTotal: number;
  cost: number; // Total gold cost
  description: string;
  status: "in_progress" | "completed" | "abandoned";
  startedAt: number;
  completedAt: number | null;
  // Activity-specific results
  result?: string;
  goldEarned?: number;
  xpAward?: number;
  itemProduced?: string;
  contactGained?: string;
  spellLearned?: string;
}

type DowntimeActivityType =
  | "training" | "crafting" | "research" | "carousing"
  | "scribing" | "pit_fighting" | "religious" | "work"
  | "luxury_rest" | "copy_spells";

interface ActivityDefinition {
  type: DowntimeActivityType;
  label: string;
  icon: string;
  color: string;
  baseCostPerDay: number;
  baseDays: number;
  description: string;
  requiresLevel?: boolean;
  requiresTool?: boolean;
}

const ACTIVITY_DEFS: ActivityDefinition[] = [
  { type: "training", label: "Training", icon: "sword", color: "amber", baseCostPerDay: 25, baseDays: 7, description: "Level advancement, feats, languages, or tool proficiencies", requiresLevel: false, requiresTool: false },
  { type: "crafting", label: "Crafting", icon: "sword", color: "cyan", baseCostPerDay: 15, baseDays: 5, description: "Craft items, potions, armor, or magic items", requiresLevel: false, requiresTool: true },
  { type: "research", label: "Research", icon: "search", color: "violet", baseCostPerDay: 10, baseDays: 5, description: "Lore research, quest intel, or spell research", requiresLevel: false, requiresTool: false },
  { type: "carousing", label: "Carousing", icon: "sparkles", color: "pink", baseCostPerDay: 15, baseDays: 3, description: "Make contacts, gain renown, gather rumors", requiresLevel: false, requiresTool: false },
  { type: "scribing", label: "Scribe Scrolls", icon: "sparkles", color: "indigo", baseCostPerDay: 50, baseDays: 2, description: "Create spell scrolls from known spells", requiresLevel: false, requiresTool: false },
  { type: "pit_fighting", label: "Pit Fighting", icon: "sword", color: "rose", baseCostPerDay: 0, baseDays: 1, description: "Gamble and fight for gold earnings", requiresLevel: false, requiresTool: false },
  { type: "religious", label: "Religious Service", icon: "sparkles", color: "emerald", baseCostPerDay: 0, baseDays: 1, description: "Temple patronage and community service", requiresLevel: false, requiresTool: false },
  { type: "work", label: "Work", icon: "search", color: "slate", baseCostPerDay: -2, baseDays: 1, description: "Earn gold through honest labor", requiresLevel: false, requiresTool: false },
  { type: "luxury_rest", label: "Luxury Rest", icon: "restRecovery", color: "gold", baseCostPerDay: 50, baseDays: 7, description: "Remove exhaustion levels and heal long-term injuries", requiresLevel: false, requiresTool: false },
  { type: "copy_spells", label: "Copy Spells", icon: "sparkles", color: "teal", baseCostPerDay: 50, baseDays: 2, description: "Wizard: copy spells into spellbook", requiresLevel: false, requiresTool: false },
];

export default function DmDowntimeTracker() {
  const show = useUIStore((s) => s.showDowntimeTracker);
  const setShow = useUIStore((s) => s.setDowntimeTracker);
  const characters = useCampaignStore((s) => s.characters);

  const [entries, setEntries] = useState<DowntimeEntry[]>([]);
  const [selCharId, setSelCharId] = useState("");
  const [selActivity, setSelActivity] = useState<DowntimeActivityType>("training");
  const [totalDays, setTotalDays] = useState(7);
  const [costGP, setCostGP] = useState(100);
  const [description, setDescription] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "in_progress" | "completed">("all");
  const [anim, setAnim] = useState<"entering" | "visible" | "exiting">("entering");
  const [expandId, setExpandId] = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const descRef = useRef<HTMLTextAreaElement>(null);

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

  const handleClose = () => {
    setAnim("exiting");
    setTimeout(() => setShow(false), 150);
  };

  const handleBackdrop = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) handleClose();
  };

  const charOptions = useMemo(() => {
    return characters.map((ch) => ({ id: ch.id, name: ch.name }));
  }, [characters]);

  const activityDef = ACTIVITY_DEFS.find((a) => a.type === selActivity);

  // Auto-compute costs when activity or days change
  useEffect(() => {
    if (activityDef) {
      if (activityDef.baseCostPerDay >= 0) {
        setCostGP(activityDef.baseCostPerDay * totalDays);
      } else {
        // Work: earn gold (negative cost = earnings)
        const earned = Math.abs(activityDef.baseCostPerDay) * totalDays * 2;
        setCostGP(-earned);
      }
    }
  }, [selActivity, totalDays, activityDef]);

  const handleAddEntry = () => {
    if (!selCharId) return;
    const char = charOptions.find((c) => c.id === selCharId);
    if (!char) return;
    const act = activityDef;
    if (!act) return;
    // Determine if this produces an auto-completed result or requires resolution
    const isAutoComplete = ["work", "luxury_rest", "pit_fighting", "religious"].includes(act.type);
    const entry: DowntimeEntry = {
      id: `dt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      charId: selCharId,
      charName: char.name,
      activity: act.label,
      activityType: act.type,
      daysSpent: 0,
      daysTotal: totalDays,
      cost: costGP,
      description: description || `${act.label} (${totalDays} days)`,
      status: isAutoComplete ? "completed" : "in_progress",
      startedAt: Date.now(),
      completedAt: isAutoComplete ? Date.now() : null,
      result: isAutoComplete ? autoCompleteResult(act.type, totalDays, char.name) : undefined,
      goldEarned: isAutoComplete && costGP < 0 ? Math.abs(costGP) : undefined,
    };
    setEntries((prev) => [entry, ...prev]);
    // Reset form
    setDescription("");
    setSelCharId("");
  };

  const handleComplete = (entryId: string, resultText: string) => {
    setEntries((prev) => prev.map((e) => {
      if (e.id !== entryId) return e;
      return { ...e, status: "completed", result: resultText, completedAt: Date.now(), daysSpent: e.daysTotal };
    }));
  };

  const handleAbandon = (entryId: string) => {
    setEntries((prev) => prev.map((e) => {
      if (e.id !== entryId) return e;
      return { ...e, status: "abandoned", completedAt: Date.now() };
    }));
  };

  const handleRemove = (entryId: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== entryId));
  };

  const filteredEntries = useMemo(() => {
    if (filterStatus === "all") return entries;
    return entries.filter((e) => e.status === filterStatus);
  }, [entries, filterStatus]);

  const inProgressCount = entries.filter((e) => e.status === "in_progress").length;
  const totalGoldSpent = entries.reduce((s, e) => s + (e.cost > 0 ? e.cost : 0), 0);
  const totalGoldEarned = entries.reduce((s, e) => s + (e.goldEarned || 0), 0);

  if (!show && anim !== "entering") return null;

  return (
    <div ref={overlayRef} className={`fixed inset-0 z-50 flex items-center justify-center ${anim === "visible" ? "pointer-events-auto" : "pointer-events-none"}`} onClick={handleBackdrop}>
      <div className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200 ${anim === "visible" ? "opacity-100" : "opacity-0"}`} />
      <div className={`relative w-[660px] max-w-[95vw] max-h-[90vh] overflow-y-auto bg-gradient-to-b from-[#14151f]/98 to-[#0f1019]/98 border border-white/[0.06] rounded-2xl shadow-[0_32px_80px_rgba(0,0,0,0.55)] ${anim === "visible" ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"} transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]`}>
        <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-gold-500/25 to-transparent pointer-events-none" />

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/[0.04]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/15 flex items-center justify-center">
              <PremiumIcon name="restRecovery" className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-amber-50">Rest & Downtime</h2>
              <p className="text-[10px] text-surface-500">{inProgressCount} in progress · {entries.length} total · {totalGoldSpent > 0 ? `${totalGoldSpent.toLocaleString()} GP spent` : ""}{totalGoldEarned > 0 ? ` · ${totalGoldEarned.toLocaleString()} GP earned` : ""}</p>
            </div>
          </div>
          <button onClick={handleClose} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/[0.06] active:scale-90 transition-all" aria-label="Close">
            <PremiumIcon name="close" className="w-3.5 h-3.5 text-surface-500" />
          </button>
        </div>

        {/* ── New Downtime Activity Form ── */}
        <div className="px-5 pt-3 pb-2 border-b border-white/[0.04] space-y-2">
          <h3 className="text-[9px] uppercase tracking-wider text-surface-600 font-bold">New Downtime Activity</h3>
          <div className="grid grid-cols-5 gap-1">
            {ACTIVITY_DEFS.map((act) => {
              const isActive = selActivity === act.type;
              return (
                <button
                  key={act.type}
                  onClick={() => { setSelActivity(act.type); setTotalDays(act.baseDays); }}
                  className={`px-1.5 py-1.5 rounded-lg text-center border transition-all duration-150 active:scale-95 ${
                    isActive
                      ? `bg-${act.color}-500/10 border-${act.color}-500/20`
                      : "bg-white/[0.02] border-white/[0.04] hover:border-white/[0.08]"
                  }`}
                  title={act.description}
                >
                  <div className="text-[8px] font-bold text-white/70 leading-tight truncate">{act.label}</div>
                  <div className="text-[6px] text-surface-600 mt-0.5">{act.baseDays}d · {act.baseCostPerDay >= 0 ? `${act.baseCostPerDay}gp/d` : `+${Math.abs(act.baseCostPerDay)*2}gp/d`}</div>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-4 gap-2 items-end">
            <div className="col-span-2">
              <label className="text-[7px] uppercase tracking-wider text-surface-600 font-bold block mb-0.5">Character</label>
              <select
                value={selCharId}
                onChange={(e) => setSelCharId(e.target.value)}
                className="w-full bg-[#07080d]/70 border border-white/[0.06] rounded-lg px-2 py-1.5 text-[10px] text-white/80 focus:outline-none focus:border-amber-500/25 focus:ring-1 focus:ring-amber-500/15 transition-all"
              >
                <option value="">Select character...</option>
                {charOptions.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[7px] uppercase tracking-wider text-surface-600 font-bold block mb-0.5">Days</label>
              <input
                type="number"
                min={1}
                max={365}
                value={totalDays}
                onChange={(e) => setTotalDays(Math.max(1, Math.min(365, parseInt(e.target.value) || 1)))}
                className="w-full bg-[#07080d]/70 border border-white/[0.06] rounded-lg px-2 py-1.5 text-[10px] text-white/80 focus:outline-none focus:border-amber-500/25 focus:ring-1 focus:ring-amber-500/15 transition-all tabular-nums"
              />
            </div>
            <div>
              <label className="text-[7px] uppercase tracking-wider text-surface-600 font-bold block mb-0.5">
                {costGP < 0 ? "Earns" : "Cost"}
              </label>
              <div className="w-full bg-[#07080d]/70 border border-white/[0.06] rounded-lg px-2 py-1.5 text-[10px] tabular-nums flex items-center justify-between">
                <span className={costGP < 0 ? "text-emerald-400" : "text-rose-400"}>
                  {costGP < 0 ? `+${Math.abs(costGP)}` : costGP}
                </span>
                <span className="text-surface-600">GP</span>
              </div>
            </div>
          </div>

          <div>
            <label className="text-[7px] uppercase tracking-wider text-surface-600 font-bold block mb-0.5">Notes (optional)</label>
            <div className="flex gap-2">
              <textarea
                ref={descRef}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={activityDef?.description || "Describe the activity..."}
                rows={1}
                className="flex-1 bg-[#07080d]/70 border border-white/[0.06] rounded-lg px-2 py-1.5 text-[10px] text-white/80 placeholder:text-surface-600 resize-none focus:outline-none focus:border-amber-500/25 focus:ring-1 focus:ring-amber-500/15 transition-all"
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAddEntry(); } }}
              />
              <button
                onClick={handleAddEntry}
                disabled={!selCharId}
                className={`px-3 py-1 rounded-lg text-[9px] font-bold border transition-all active:scale-90 flex-shrink-0 ${
                  selCharId
                    ? "bg-amber-500/12 text-amber-400 border-amber-500/20 hover:bg-amber-500/18"
                    : "bg-white/[0.02] text-surface-600 border-white/[0.04] cursor-not-allowed"
                }`}
              >
                Add Activity
              </button>
            </div>
          </div>

          {/* Activity-specific hints */}
          {activityDef && selActivity === "training" && (
            <div className="bg-amber-500/5 border border-amber-500/10 rounded-lg px-2 py-1.5">
              <p className="text-[8px] text-amber-400/80"><span className="font-bold">Training costs:</span> 25 gp/day. Level advancement requires enough downtime (usually 7+ days per level). Feats: 7 days. Languages/Tools: 7 days each.</p>
            </div>
          )}
          {activityDef && selActivity === "crafting" && (
            <div className="bg-cyan-500/5 border border-cyan-500/10 rounded-lg px-2 py-1.5">
              <p className="text-[8px] text-cyan-400/80"><span className="font-bold">Crafting costs:</span> 15 gp/day + half item value. Potion of Healing: 2 days, 25 gp. Spell scroll: 1 day + 25 gp per level. Magic item: varies by rarity.</p>
            </div>
          )}
          {activityDef && selActivity === "luxury_rest" && (
            <div className="bg-gold-500/5 border border-gold-500/10 rounded-lg px-2 py-1.5">
              <p className="text-[8px] text-gold-400/80"><span className="font-bold">Luxury Rest:</span> Removes exhaustion levels and provides long-term care. 50 gp/day for lavish accommodations in a major city.</p>
            </div>
          )}
        </div>

        {/* ── Entries ── */}
        <div className="px-3 pt-3 pb-3">
          <div className="flex items-center justify-between mb-1.5 px-1">
            <h3 className="text-[9px] uppercase tracking-wider text-surface-600 font-bold">
              Downtime Log ({filteredEntries.length})
            </h3>
            <div className="flex gap-0.5">
              {(["all", "in_progress", "completed"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilterStatus(f)}
                  className={`px-1.5 py-0.5 rounded text-[8px] font-bold border transition-all active:scale-90 ${
                    filterStatus === f ? "bg-amber-500/12 text-amber-400 border-amber-500/20" : "bg-white/[0.02] text-surface-500 border-white/[0.04] hover:text-surface-300"
                  }`}
                >
                  {f === "all" ? "All" : f === "in_progress" ? "In Progress" : "Done"}
                </button>
              ))}
            </div>
          </div>

          {filteredEntries.length === 0 ? (
            <div className="text-center py-6">
              <div className="w-8 h-8 rounded-xl bg-surface-800/30 border border-white/[0.03] flex items-center justify-center mx-auto mb-2">
                <PremiumIcon name="restRecovery" className="w-4 h-4 text-surface-600" />
              </div>
              <p className="text-[10px] text-surface-500">No downtime activities yet</p>
              <p className="text-[8px] text-surface-600 mt-0.5">Select a character and activity above to begin</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {filteredEntries.map((entry) => {
                const isExpanded = expandId === entry.id;
                const isInProgress = entry.status === "in_progress";
                const pctComplete = entry.daysTotal > 0 ? Math.round((entry.daysSpent / entry.daysTotal) * 100) : 0;
                const def = ACTIVITY_DEFS.find((a) => a.type === entry.activityType);
                const colorClass = def?.color || "amber";

                return (
                  <div
                    key={entry.id}
                    className={`rounded-lg border transition-all duration-200 ${
                      entry.status === "completed" ? "bg-emerald-500/5 border-emerald-500/15" :
                      entry.status === "abandoned" ? "bg-rose-500/5 border-rose-500/15 opacity-60" :
                      "bg-white/[0.02] border-white/[0.04]"
                    }`}
                  >
                    <button
                      onClick={() => setExpandId(isExpanded ? null : entry.id)}
                      className="w-full text-left px-2.5 py-1.5 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          entry.status === "completed" ? "bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.4)]" :
                          entry.status === "abandoned" ? "bg-rose-400" :
                          "bg-amber-400 animate-pulse"
                        }`} />
                        <span className="text-[10px] font-bold text-white/70 truncate">{entry.charName}</span>
                        <span className={`text-[8px] text-${colorClass}-400 bg-${colorClass}-500/10 rounded px-1 py-0.5 truncate max-w-[90px]`}>{entry.activity}</span>
                        {entry.status === "completed" && <span className="text-[8px] text-emerald-400">✓ {entry.daysTotal}d</span>}
                        {entry.status === "abandoned" && <span className="text-[8px] text-rose-400">✗</span>}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {entry.cost > 0 && <span className="text-[8px] text-rose-400 tabular-nums">{entry.cost} gp</span>}
                        {entry.goldEarned && entry.goldEarned > 0 && <span className="text-[8px] text-emerald-400 tabular-nums">+{entry.goldEarned} gp</span>}
                        <PremiumIcon name="chevronRight" className={`w-3 h-3 text-surface-500 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                      </div>
                    </button>

                    {/* Progress bar for in-progress entries */}
                    {isInProgress && (
                      <div className="px-2.5 pb-1.5">
                        <div className="h-1 bg-surface-800/50 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-amber-500 transition-all duration-500" style={{ width: `${pctComplete}%` }} />
                        </div>
                      </div>
                    )}

                    {/* Expanded Detail */}
                    {isExpanded && (
                      <div className="px-2.5 pb-2 space-y-1.5">
                        <div className="grid grid-cols-2 gap-1 text-[8px] text-surface-500">
                          <div><span className="text-surface-600">Days:</span> <span className="text-white/60 tabular-nums">{entry.daysSpent}/{entry.daysTotal}</span></div>
                          <div><span className="text-surface-600">Cost:</span> <span className={entry.cost > 0 ? "text-rose-400 tabular-nums" : "text-emerald-400 tabular-nums"}>{entry.cost >= 0 ? `${entry.cost} GP` : `Earns ${Math.abs(entry.cost)} GP`}</span></div>
                          <div><span className="text-surface-600">Started:</span> <span className="text-white/60">{new Date(entry.startedAt).toLocaleDateString()}</span></div>
                          {entry.completedAt && <div><span className="text-surface-600">Completed:</span> <span className="text-white/60">{new Date(entry.completedAt).toLocaleDateString()}</span></div>}
                        </div>

                        <p className="text-[9px] text-surface-400 italic">{entry.description}</p>

                        {entry.result && (
                          <div className="bg-white/[0.03] rounded-lg px-2 py-1">
                            <span className="text-[7px] uppercase tracking-wider text-surface-600 font-bold block mb-0.5">Result</span>
                            <p className="text-[9px] text-emerald-400">{entry.result}</p>
                          </div>
                        )}

                        {/* Activity-specific result entry */}
                        {isInProgress && (
                          <div className="space-y-1 pt-1">
                            {entry.activityType === "training" && (
                              <div className="flex gap-1">
                                <input type="text" placeholder="What was learned (e.g., Language: Elvish)..." className="flex-1 bg-[#07080d]/70 border border-white/[0.06] rounded px-2 py-1 text-[9px] text-white/70 placeholder:text-surface-600 focus:outline-none focus:border-amber-500/25" />
                                <button onClick={() => {
                                  const input = document.activeElement as HTMLInputElement;
                                  const val = input?.value || "Training completed";
                                  handleComplete(entry.id, val);
                                }} className="px-2 py-1 rounded text-[8px] font-bold bg-amber-500/12 text-amber-400 border border-amber-500/20 hover:bg-amber-500/18 active:scale-90 transition-all">Complete</button>
                              </div>
                            )}
                            {entry.activityType === "crafting" && (
                              <div className="flex gap-1">
                                <input type="text" placeholder="What was crafted (e.g., Potion of Healing)" className="flex-1 bg-[#07080d]/70 border border-white/[0.06] rounded px-2 py-1 text-[9px] text-white/70 placeholder:text-surface-600 focus:outline-none focus:border-cyan-500/25" />
                                <button onClick={() => {
                                  const input = document.activeElement as HTMLInputElement;
                                  const val = input?.value || "Item crafted";
                                  handleComplete(entry.id, `Crafted: ${val}`);
                                }} className="px-2 py-1 rounded text-[8px] font-bold bg-cyan-500/12 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/18 active:scale-90 transition-all">Complete</button>
                              </div>
                            )}
                            {entry.activityType === "research" && (
                              <div className="flex gap-1">
                                <input type="text" placeholder="Research findings..." className="flex-1 bg-[#07080d]/70 border border-white/[0.06] rounded px-2 py-1 text-[9px] text-white/70 placeholder:text-surface-600 focus:outline-none focus:border-violet-500/25" />
                                <button onClick={() => {
                                  const input = document.activeElement as HTMLInputElement;
                                  const val = input?.value || "Research completed";
                                  handleComplete(entry.id, `Found: ${val}`);
                                }} className="px-2 py-1 rounded text-[8px] font-bold bg-violet-500/12 text-violet-400 border border-violet-500/20 hover:bg-violet-500/18 active:scale-90 transition-all">Complete</button>
                              </div>
                            )}
                            {/* Default complete for any other type */}
                            {!["training", "crafting", "research"].includes(entry.activityType) && (
                              <div className="flex gap-1">
                                <input type="text" placeholder="Enter activity result..." className="flex-1 bg-[#07080d]/70 border border-white/[0.06] rounded px-2 py-1 text-[9px] text-white/70 placeholder:text-surface-600 focus:outline-none focus:border-amber-500/25" />
                                <button onClick={() => {
                                  const input = document.activeElement as HTMLInputElement;
                                  const val = input?.value || "Activity completed";
                                  handleComplete(entry.id, val);
                                }} className="px-2 py-1 rounded text-[8px] font-bold bg-amber-500/12 text-amber-400 border border-amber-500/20 hover:bg-amber-500/18 active:scale-90 transition-all">Complete</button>
                              </div>
                            )}
                            <div className="flex gap-0.5">
                              <button onClick={() => handleAbandon(entry.id)} className="px-1.5 py-0.5 rounded text-[7px] font-bold bg-rose-500/12 text-rose-400 border border-rose-500/20 hover:bg-rose-500/18 active:scale-90 transition-all">Abandon</button>
                              <button onClick={() => handleRemove(entry.id)} className="px-1.5 py-0.5 rounded text-[7px] font-bold bg-white/[0.03] text-surface-500 border border-white/[0.04] hover:bg-white/[0.06] active:scale-90 transition-all">Remove</button>
                            </div>
                          </div>
                        )}

                        {/* Completed entry actions */}
                        {entry.status === "completed" && (
                          <div className="flex gap-0.5 pt-1">
                            <button onClick={() => handleRemove(entry.id)} className="px-1.5 py-0.5 rounded text-[7px] font-bold bg-white/[0.03] text-surface-500 border border-white/[0.04] hover:bg-white/[0.06] active:scale-90 transition-all">Dismiss</button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-5 py-2 border-t border-white/[0.04] flex items-center justify-between">
          <span className="text-[8px] text-surface-600">
            {ACTIVITY_DEFS.length} activity types · {entries.length} total entries · {totalGoldSpent.toLocaleString()} GP spent{totalGoldEarned > 0 ? ` · ${totalGoldEarned.toLocaleString()} GP earned` : ""}
          </span>
          <span className="text-[7px] text-surface-700">Select char & activity · Add to create · Esc to close</span>
        </div>
      </div>
    </div>
  );
}

function autoCompleteResult(type: DowntimeActivityType, days: number, charName: string): string {
  switch (type) {
    case "work":
      return `${charName} earned ${(days * 4).toLocaleString()} GP through honest labor.`;
    case "luxury_rest":
      return `${charName} completed a lavish rest period (${days} days). All exhaustion levels removed. Long-term injuries healed.`;
    case "pit_fighting": {
      const earnings = days * (2 + Math.floor(Math.random() * 10));
      return `${charName} fought in the pits for ${days} day(s), earning ${earnings} GP.`;
    }
    case "religious":
      return `${charName} performed ${days} day(s) of religious service, gaining favor with their temple.`;
    default:
      return "Activity completed successfully.";
  }
}
