/**
 * ST VTT — DM Concentration Duration Timer Popover
 *
 * Real-time concentration spell duration tracker.
 * Tracks ALL concentrating combatants with live countdown,
 * configurable durations (1 min, 10 min, 1 hour, custom),
 * and expiry warnings.
 *
 * Campaign: Arkla — Wendy Swiftfoot (Rogue 5), Kehrfuffle Ironheart (Paladin 5)
 */

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useUIStore } from "@/stores/uiStore";
import { useCombatStore } from "@/stores/combatStore";
import { useCanvasFocusStore } from "@/stores/canvasFocusStore";
import PremiumIcon from "@/components/ui/PremiumIcon";

interface ConcentrationEntry {
  id: string;
  combatantId: string;
  combatantName: string;
  spellName: string;
  durationMinutes: number;
  startedAt: number; // Date.now() when concentration was set
  expiresAt: number; // startedAt + durationMinutes * 60000
  isExpired: boolean;
  warnedAt75: boolean;
  warnedAt90: boolean;
}

const DURATION_PRESETS = [
  { label: "1 min", value: 1, color: "text-emerald-400" },
  { label: "10 min", value: 10, color: "text-amber-400" },
  { label: "1 hour", value: 60, color: "text-rose-400" },
  { label: "Custom", value: -1, color: "text-violet-400" },
];

export default function DmConcentrationTimerPopover() {
  const show = useUIStore((s) => s.showConcentrationTimer);
  const setShow = useUIStore((s) => s.setConcentrationTimer);
  const activeEncounter = useCombatStore((s) => s.activeEncounter);

  const [entries, setEntries] = useState<ConcentrationEntry[]>([]);
  const [newSpellName, setNewSpellName] = useState("");
  const [newDuration, setNewDuration] = useState(1);
  const [customMinutes, setCustomMinutes] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [animPhase, setAnimPhase] = useState<"entering" | "visible" | "exiting">("entering");
  const [now, setNow] = useState(Date.now());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const addFormRef = useRef<HTMLInputElement>(null);

  // Tick clock every 1s for live countdown
  useEffect(() => {
    if (!show) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => setNow(Date.now()), 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [show]);

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

  useEffect(() => {
    if (showAddForm && addFormRef.current) addFormRef.current.focus();
  }, [showAddForm]);

  const handleClose = useCallback(() => {
    setAnimPhase("exiting");
    setTimeout(() => { setShow(false); setShowAddForm(false); setNewSpellName(""); setCustomMinutes(""); }, 150);
  }, [setShow]);

  const handleBackdrop = useCallback((e: React.MouseEvent) => {
    if (e.target === overlayRef.current) handleClose();
  }, [handleClose]);

  // Auto-expire entries
  const activeEntries = useMemo(() => {
    return entries.filter((e) => {
      if (e.isExpired) return false;
      if (now >= e.expiresAt) {
        e.isExpired = true;
        return false;
      }
      return true;
    });
  }, [entries, now]);

  const expiredEntries = useMemo(() => {
    return entries.filter((e) => e.isExpired);
  }, [entries]);

  const handleAddTimer = useCallback(() => {
    if (!newSpellName.trim()) return;
    const combatants = activeEncounter?.combatants || [];
    if (combatants.length === 0) return;

    const duration = newDuration === -1 ? (parseInt(customMinutes) || 10) : newDuration;
    const nowTs = Date.now();
    const newEntry: ConcentrationEntry = {
      id: `conc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      combatantId: "",
      combatantName: "Active Concentration",
      spellName: newSpellName.trim(),
      durationMinutes: duration,
      startedAt: nowTs,
      expiresAt: nowTs + duration * 60000,
      isExpired: false,
      warnedAt75: false,
      warnedAt90: false,
    };

    setEntries((prev) => [...prev, newEntry]);
    setNewSpellName("");
    setCustomMinutes("");
    setShowAddForm(false);
  }, [newSpellName, newDuration, customMinutes, activeEncounter]);

  const handleRemoveTimer = useCallback((id: string) => {
    setEntries((prev) => prev.map((e) => e.id === id ? { ...e, isExpired: true } : e));
  }, []);

  const handleClearExpired = useCallback(() => {
    setEntries((prev) => prev.filter((e) => !e.isExpired));
  }, []);

  const handleExtend = useCallback((id: string, extraMinutes: number) => {
    setEntries((prev) => prev.map((e) =>
      e.id === id ? { ...e, expiresAt: e.expiresAt + extraMinutes * 60000, durationMinutes: e.durationMinutes + extraMinutes, isExpired: false } : e
    ));
  }, []);

  const formatDuration = useCallback((ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    if (totalSeconds <= 0) return "Expired";
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  }, []);

  const getProgressPct = useCallback((entry: ConcentrationEntry) => {
    const total = entry.expiresAt - entry.startedAt;
    const elapsed = now - entry.startedAt;
    return Math.min(100, Math.max(0, (elapsed / total) * 100));
  }, [now]);

  const getBarColor = useCallback((pct: number) => {
    if (pct < 50) return "bg-emerald-500";
    if (pct < 75) return "bg-amber-500";
    if (pct < 90) return "bg-rose-500";
    return "bg-red-500";
  }, []);

  if (!show && animPhase !== "entering") return null;

  const concentratingCombatants = activeEncounter?.combatants.filter((c) => c.isConcentrating) || [];

  return (
    <div ref={overlayRef} className={`fixed inset-0 z-50 flex items-center justify-center ${animPhase === "visible" ? "pointer-events-auto" : "pointer-events-none"}`} onClick={handleBackdrop}>
      <div className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200 ${animPhase === "visible" ? "opacity-100" : "opacity-0"}`} />
      <div className={`relative w-[580px] max-w-[95vw] max-h-[85vh] overflow-y-auto bg-gradient-to-b from-[#14151f]/98 to-[#0f1019]/98 border border-white/[0.06] rounded-2xl shadow-[0_32px_80px_rgba(0,0,0,0.55)] ${animPhase === "visible" ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"} transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]`}>
        <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-gold-500/25 to-transparent pointer-events-none" />

        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/[0.04]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/15 flex items-center justify-center">
              <PremiumIcon name="sparkles" className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-amber-50">Concentration Duration Timer</h2>
              <p className="text-[10px] text-surface-500">Track active concentration spells in real-time</p>
            </div>
          </div>
          <button onClick={handleClose} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/[0.06] active:scale-90 transition-all duration-150" aria-label="Close">
            <PremiumIcon name="close" className="w-3.5 h-3.5 text-surface-500" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          ── Active Combatant Concentration Status ──
          {concentratingCombatants.length > 0 && (
            <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl px-3 py-2">
              <h3 className="text-[10px] uppercase tracking-wider text-surface-500 font-bold mb-1.5">Combatant Concentration Status</h3>
              <div className="space-y-1">
                {concentratingCombatants.map((c) => (
                  <div key={c.id} className="flex items-center justify-between px-2 py-1 rounded-lg bg-violet-500/8 border border-violet-500/10">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                      <span className="text-[10px] text-white/80">{c.name}</span>
                      <span className="text-[8px] text-surface-500">concentrating</span>
                    </div>
                    <PremiumIcon name="sparkles" className="w-3 h-3 text-violet-400" />
                  </div>
                ))}
              </div>
            </div>
          )}

          ── Timer Controls ──
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowAddForm((p) => !p)}
              className="px-3 py-1 rounded-lg text-[10px] font-bold bg-violet-500/12 text-violet-400 border border-violet-500/20 hover:bg-violet-500/18 active:scale-[0.97] transition-all duration-150 flex items-center gap-1.5"
            >
              <PremiumIcon name="plus" className="w-3 h-3" />
              {showAddForm ? "Cancel" : "Add Spell Timer"}
            </button>
            {expiredEntries.length > 0 && (
              <button onClick={handleClearExpired} className="text-[9px] text-surface-500 hover:text-amber-400 active:scale-95 transition-all">
                Clear {expiredEntries.length} expired
              </button>
            )}
          </div>

          ── Add Form ──
          {showAddForm && (
            <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-4 space-y-3 animate-in slide-in-from-bottom-1 duration-200">
              <div>
                <label className="text-[9px] uppercase tracking-wider text-surface-500 font-bold block mb-1">Spell Name</label>
                <input
                  ref={addFormRef}
                  type="text"
                  value={newSpellName}
                  onChange={(e) => setNewSpellName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleAddTimer(); }}
                  className="w-full bg-[#07080d]/70 border border-white/[0.06] rounded-lg px-3 py-1.5 text-xs text-white/80 placeholder:text-surface-600 focus:outline-none focus:border-gold-500/25 focus:ring-1 focus:ring-gold-500/15 transition-all"
                  placeholder="e.g. Haste, Bless, Invisibility..."
                />
              </div>
              <div>
                <label className="text-[9px] uppercase tracking-wider text-surface-500 font-bold block mb-1">Duration</label>
                <div className="flex gap-1.5 flex-wrap">
                  {DURATION_PRESETS.map((p) => (
                    <button
                      key={p.label}
                      onClick={() => setNewDuration(p.value)}
                      className={`px-2 py-1 rounded-lg text-[9px] font-bold transition-all duration-150 active:scale-90 ${newDuration === p.value ? "bg-gold-500/12 text-gold-300 border border-gold/20" : "bg-white/[0.02] text-surface-400 border border-white/[0.04] hover:bg-white/[0.04]"}`}
                    >
                      <span className={p.color}>{p.label}</span>
                    </button>
                  ))}
                  {newDuration === -1 && (
                    <input
                      type="number"
                      min="1"
                      max="1440"
                      value={customMinutes}
                      onChange={(e) => setCustomMinutes(e.target.value)}
                      className="w-20 bg-[#07080d]/70 border border-white/[0.06] rounded-lg px-2 py-1 text-[9px] text-white/80 focus:outline-none focus:border-gold-500/25 focus:ring-1 focus:ring-gold-500/15"
                      placeholder="Minutes"
                    />
                  )}
                </div>
              </div>
              <button
                onClick={handleAddTimer}
                disabled={!newSpellName.trim()}
                className="w-full py-1.5 rounded-lg text-[10px] font-bold bg-violet-500/12 text-violet-400 border border-violet-500/20 hover:bg-violet-500/18 active:scale-[0.98] transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Start Timer
              </button>
            </div>
          )}

          ── Active Timers ──
          {activeEntries.length === 0 && !showAddForm && (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-xl bg-violet-500/8 border border-violet-500/10 flex items-center justify-center mx-auto mb-3">
                <PremiumIcon name="sparkles" className="w-6 h-6 text-violet-400/60" />
              </div>
              <p className="text-xs text-surface-500">No active concentration timers</p>
              <p className="text-[9px] text-surface-600 mt-1">Track spell durations with live countdowns</p>
            </div>
          )}

          {activeEntries.length > 0 && (
            <div className="space-y-2">
              {activeEntries.map((entry) => {
                const pct = getProgressPct(entry);
                const remaining = entry.expiresAt - now;
                const barColor = getBarColor(pct);
                return (
                  <div
                    key={entry.id}
                    className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-3 hover:bg-white/[0.03] transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${pct >= 90 ? "bg-red-400 animate-ping" : "bg-violet-400"}`} />
                        <span className="text-[11px] font-bold text-white/80">{entry.spellName}</span>
                        <button
                          onClick={() => useCanvasFocusStore.getState().setFocusToken(entry.combatantId)}
                          className="w-4 h-4 rounded flex items-center justify-center hover:bg-gold-500/10 hover:text-gold-400 active:scale-90 transition-all text-surface-500"
                          title="Locate concentrating creature on map"
                        >
                          <PremiumIcon name="search" className="w-3 h-3" />
                        </button>
                        {pct >= 75 && (
                          <span className="text-[8px] text-amber-400 bg-amber-500/10 border border-amber-500/15 rounded px-1 py-0.5">
                            {pct >= 90 ? "⚠️ Expiring" : "⚠️ Almost Done"}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono tabular-nums text-amber-300">{formatDuration(remaining)}</span>
                        <button
                          onClick={() => handleRemoveTimer(entry.id)}
                          className="w-5 h-5 rounded flex items-center justify-center hover:bg-white/[0.06] active:scale-90 transition-all"
                          title="Mark expired"
                        >
                          <PremiumIcon name="close" className="w-3 h-3 text-surface-500" />
                        </button>
                      </div>
                    </div>

                    ── Progress Bar ──
                    <div className="h-1.5 bg-surface-800/50 rounded-full overflow-hidden mb-2">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${barColor}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[8px] text-surface-600">
                          Started {new Date(entry.startedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        <span className="text-[8px] text-surface-700">·</span>
                        <span className="text-[8px] text-surface-600">
                          {entry.durationMinutes < 60 ? `${entry.durationMinutes} min` : `${(entry.durationMinutes / 60).toFixed(0)} hr`} duration
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleExtend(entry.id, 1)}
                          className="text-[8px] text-surface-500 hover:text-gold-400 active:scale-90 transition-all px-1"
                          title="Add 1 minute"
                        >
                          +1m
                        </button>
                        <button
                          onClick={() => handleExtend(entry.id, 5)}
                          className="text-[8px] text-surface-500 hover:text-gold-400 active:scale-90 transition-all px-1"
                          title="Add 5 minutes"
                        >
                          +5m
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="px-5 py-2 border-t border-white/[0.04] flex items-center justify-between">
          <span className="text-[8px] text-surface-600">
            {activeEntries.length} active · {expiredEntries.length} expired
          </span>
          <span className="text-[7px] text-surface-700">Esc to close</span>
        </div>
      </div>
    </div>
  );
}
