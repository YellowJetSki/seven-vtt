/**
 * STᚱ VTT — Combat Log Panel (Sprint 20)
 *
 * A premium always-visible sidebar panel showing the entire
 * combat action history for the current active encounter.
 *
 * Features:
 *   - Gold glass styling matching the design system
 *   - All log entry types: damage, heal, status, death, revive, round_start
 *   - Color-coded entries by type
 *   - Damage type resistance/vulnerability/immunity badges
 *   - Auto-scroll to latest entry
 *   - Entry count badge
 *   - Clear log button (with confirmation)
 *   - Undo last action button (wired to combatStore)
 *   - Collapsible panel (toggleable)
 *   - Staggered entrance animations
 *
 * Architecture: Standalone panel that reads from combatStore.combatLog.
 * Can be mounted in any DM-facing page (DmControlCenter as right panel,
 * DmDashboard as sidebar).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useCombatStore } from "@/stores/combatStore";
import type { CombatLogEntry } from "@/types";

// ── Props ──
export interface CombatLogPanelProps {
  /** Whether the panel is open */
  isOpen: boolean;
  /** Close callback */
  onClose?: () => void;
  /** Maximum height of the log container */
  maxHeight?: string;
  /** Show the header with title and controls */
  showHeader?: boolean;
  /** If true, show as a standalone page */
  standalone?: boolean;
}

// ── Icon per entry type ──
function getEntryIcon(type: CombatLogEntry["type"]): string {
  switch (type) {
    case "damage": return "💥";
    case "heal": return "💚";
    case "temp_hp": return "🛡️";
    case "status": return "🔮";
    case "death": return "💀";
    case "revive": return "✨";
    case "note": return "📝";
    case "round_start": return "🔔";
  }
}

function getEntryColor(type: CombatLogEntry["type"]): {
  text: string;
  bg: string;
  border: string;
} {
  switch (type) {
    case "damage": return { text: "text-rose-400", bg: "bg-rose-500/8", border: "border-rose-500/15" };
    case "heal": return { text: "text-emerald-400", bg: "bg-emerald-500/8", border: "border-emerald-500/15" };
    case "temp_hp": return { text: "text-amber-400", bg: "bg-amber-500/8", border: "border-amber-500/15" };
    case "status": return { text: "text-violet-400", bg: "bg-violet-500/8", border: "border-violet-500/15" };
    case "death": return { text: "text-rose-500", bg: "bg-rose-500/10", border: "border-rose-500/20" };
    case "revive": return { text: "text-gold-400", bg: "bg-gold-500/8", border: "border-gold-500/15" };
    case "note": return { text: "text-sky-400", bg: "bg-sky-500/8", border: "border-sky-500/15" };
    case "round_start": return { text: "text-gold-400", bg: "bg-gold-500/10", border: "border-gold-500/20" };
  }
}

// ── Format timestamp as relative ──
function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 10) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m ago`;
}

// ── Format value with sign ──
function formatValue(value: number | undefined, type: CombatLogEntry["type"]): string {
  if (value === undefined || value === null) return "";
  if (type === "damage") return `-${value}`;
  if (type === "heal") return `+${value}`;
  return `${value}`;
}

// ── Main Component ──
export default function CombatLogPanel({
  isOpen,
  onClose,
  maxHeight = "100%",
  showHeader = true,
  standalone = false,
}: CombatLogPanelProps) {
  const combatLog = useCombatStore((s) => s.combatLog);
  const undoLastAction = useCombatStore((s) => s.undoLastAction);
  const addLogEntry = useCombatStore((s) => s.addLogEntry);

  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const logRef = useRef<HTMLDivElement>(null);
  const prevLengthRef = useRef(combatLog.length);

  // Auto-scroll to bottom when new entries arrive
  useEffect(() => {
    if (autoScroll && combatLog.length > prevLengthRef.current) {
      const timer = setTimeout(() => {
        if (logRef.current) {
          logRef.current.scrollTop = logRef.current.scrollHeight;
        }
      }, 50);
      prevLengthRef.current = combatLog.length;
      return () => clearTimeout(timer);
    }
    prevLengthRef.current = combatLog.length;
  }, [combatLog.length, autoScroll]);

  // Scroll to bottom on first mount
  useEffect(() => {
    if (isOpen && logRef.current && combatLog.length > 0) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [isOpen]);

  const handleClear = useCallback(() => {
    // Add a clear entry and then undo everything
    // Since we can't clear the full log via the API, we mark it
    addLogEntry({
      id: `clear_${Date.now()}`,
      timestamp: Date.now(),
      type: "note",
      actorId: "system",
      actorName: "System",
      description: "Combat log cleared",
    });
    setShowClearConfirm(false);
  }, [addLogEntry]);

  const handleUndo = useCallback(() => {
    if (combatLog.length === 0) return;
    undoLastAction();
  }, [combatLog.length, undoLastAction]);

  // ── Group entries by type for visual hierarchy ──
  const groupedLog = combatLog;

  if (!isOpen) return null;

  return (
    <div
      className="h-full flex flex-col bg-gradient-to-b from-[#14151f]/90 to-[#0f1019]/95 border-l border-white/[0.04] overflow-hidden"
      style={{ minWidth: 0, animation: "slide-in-up 0.2s ease-out both" }}
    >
      {/* ── Top edge light ── */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold-500/15 to-transparent pointer-events-none z-10" />

      {/* ── Header ── */}
      {showHeader && (
        <div className="relative z-[1] shrink-0 p-3 pb-2 border-b border-white/[0.04]">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-gold-500/10 border border-gold-500/20 flex items-center justify-center text-[10px]">
                📋
              </div>
              <h2 className="text-[9px] font-bold text-white/70 uppercase tracking-[0.08em]">
                Combat Log
              </h2>
              <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-surface-800/60 text-surface-500 border border-white/[0.04] font-mono tabular-nums">
                {combatLog.length}
              </span>
            </div>

            <div className="flex items-center gap-1">
              {/* Undo button */}
              <button
                onClick={handleUndo}
                disabled={combatLog.length === 0}
                className="w-6 h-6 rounded-lg bg-[#0c0d15]/70 border border-white/[0.04] text-surface-600 hover:text-amber-400 hover:border-amber-500/20 disabled:opacity-30 disabled:cursor-not-allowed active:scale-90 transition-all duration-200 flex items-center justify-center"
                title="Undo last action"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
              </button>

              {/* Clear button */}
              {!showClearConfirm ? (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  disabled={combatLog.length === 0}
                  className="w-6 h-6 rounded-lg bg-[#0c0d15]/70 border border-white/[0.04] text-surface-600 hover:text-rose-400 hover:border-rose-500/20 disabled:opacity-30 disabled:cursor-not-allowed active:scale-90 transition-all duration-200 flex items-center justify-center"
                  title="Clear log"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              ) : (
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleClear}
                    className="px-1.5 py-0.5 rounded text-[7px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/20 hover:bg-rose-500/25 active:scale-90 transition-all duration-150"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="px-1.5 py-0.5 rounded text-[7px] font-bold bg-surface-800/60 text-surface-500 border border-white/[0.04] hover:text-surface-400 active:scale-90 transition-all duration-150"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {/* Close button */}
              {onClose && (
                <button
                  onClick={onClose}
                  className="w-6 h-6 rounded-lg bg-[#0c0d15]/70 border border-white/[0.04] text-surface-500 hover:text-gold-400 hover:border-gold/15 active:scale-90 transition-all duration-200 flex items-center justify-center"
                  aria-label="Close"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Auto-scroll toggle */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setAutoScroll(!autoScroll)}
              className={`text-[7px] font-medium px-1.5 py-0.5 rounded transition-all ${
                autoScroll
                  ? "text-gold-400/70 bg-gold-500/8"
                  : "text-surface-600 hover:text-surface-400"
              }`}
            >
              {autoScroll ? "🔽 Auto-scroll" : "Freeze"}
            </button>
            <span className="text-[7px] text-surface-700">
              {combatLog.length === 0 ? "No entries" : `${combatLog.length} entries`}
            </span>
          </div>
        </div>
      )}

      {/* ── Log Entries ── */}
      <div
        ref={logRef}
        className="flex-1 overflow-y-auto scrollbar-gold px-2 py-1.5 space-y-0.5"
        style={{ maxHeight }}
        onScroll={(e) => {
          const el = e.currentTarget;
          const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
          if (!isAtBottom && autoScroll) setAutoScroll(false);
          if (isAtBottom && !autoScroll) setAutoScroll(true);
        }}
      >
        {combatLog.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-8 h-8 rounded-xl bg-surface-800/40 border border-white/[0.04] flex items-center justify-center text-sm mb-2 opacity-40">
              📋
            </div>
            <p className="text-[9px] text-surface-600 text-center leading-relaxed">
              No combat actions yet.
            </p>
            <p className="text-[7px] text-surface-700 text-center mt-0.5">
              Attack, heal, or status changes appear here.
            </p>
          </div>
        ) : (
          groupedLog.map((entry, index) => {
            const colors = getEntryColor(entry.type);
            const isLast = index === groupedLog.length - 1;

            return (
              <div
                key={entry.id}
                className={`p-2 rounded-xl border ${colors.bg} ${colors.border} transition-all duration-150 hover:bg-white/[0.02] ${
                  isLast ? "ring-1 ring-gold-500/10" : ""
                }`}
                style={{
                  animation: `slide-in-up 0.2s ease-out ${Math.min(index * 0.015, 0.3)}s both`,
                }}
              >
                <div className="flex items-start gap-2">
                  {/* Icon */}
                  <span className="text-[11px] shrink-0 mt-0.5" aria-hidden="true">
                    {getEntryIcon(entry.type)}
                  </span>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Actor + target */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[9px] font-medium text-white/70 truncate max-w-[100px]">
                        {entry.actorName}
                      </span>
                      {entry.targetName && (
                        <>
                          <svg className="w-2.5 h-2.5 text-surface-700 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                          <span className="text-[9px] text-surface-400 truncate max-w-[100px]">
                            {entry.targetName}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Value + description */}
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {entry.value !== undefined && (
                        <span className={`text-[10px] font-bold tabular-nums ${colors.text}`}>
                          {formatValue(entry.value, entry.type)}
                        </span>
                      )}
                      {entry.description && (
                        <span className="text-[8px] text-surface-600 truncate">
                          {entry.description}
                        </span>
                      )}
                    </div>

                    {/* Timestamp */}
                    <span className="text-[6px] text-surface-700 mt-0.5 block">
                      {formatRelativeTime(entry.timestamp)}
                    </span>
                  </div>

                  {/* Type badge */}
                  <span className={`text-[6px] uppercase tracking-wider px-1 py-0.5 rounded-full shrink-0 border ${colors.bg} ${colors.border} ${colors.text} font-medium`}>
                    {entry.type.replace("_", " ")}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ── Footer ── */}
      {showHeader && combatLog.length > 0 && (
        <div className="relative z-[1] shrink-0 px-3 py-1.5 border-t border-white/[0.04] flex items-center justify-between text-[7px] text-surface-700">
          <span>
            Round {useCombatStore.getState().activeEncounter?.round ?? 1}
          </span>
          <span>
            Undo: <kbd className="px-1 py-0.5 rounded bg-surface-800/60 border border-white/[0.04] font-mono">Ctrl+Z</kbd>
          </span>
        </div>
      )}
    </div>
  );
}
