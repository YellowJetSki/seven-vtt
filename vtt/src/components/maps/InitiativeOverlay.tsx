/**
 * STᚱ VTT — Initiative Overlay HUD (Premium)
 *
 * A DOM-based floating initiative tracker that overlays the battle map canvas.
 * Provides at-a-glance turn order, current turn indicator, and quick actions.
 *
 * Features:
 *   - Compact turn order list (5 entries visible, rest scrollable)
 *   - Current turn: Gold glowing badge with animated pulse
 *   - Next-up: Amber dot indicator
 *   - Dead combatants: Red X + reduced opacity + strikethrough
 *   - HP bar for each combatant (color-coded green/amber/red)
 *   - Status effect count badges
 *   - Quick "Next Turn" and "Previous Turn" buttons
 *   - Round counter badge
 *   - Phase indicator (Preparation / Active / Paused / Completed)
 *
 * Architecture:
 *   ┌──────────────────────────────────────────────┐
 *   │  ⚔ Round 3    ► Bob    (Current) 🟡 20      │
 *   │  ⏳ Next: Alice        🟢 18    [🧘]        │
 *   │  Carol                  🟡 15    [💀]        │
 *   │  ──── scroll ────                             │
 *   │  Dave                   🔴 12                 │
 *   │  Eve                    🟢 10                 │
 *   ├──────────────────────────────────────────────┤
 *   │  [_Back_]  [Start/Pause]  [► Next] [◄ Prev]  │
 *   └──────────────────────────────────────────────┘
 *
 * Cycle 23 (Premium Battlemap Overhaul):
 *   - Direct integration with combatStore for real-time state
 *   - Next turn / prev turn buttons wired to combatStore
 *   - Auto-scrolls to current combatant
 */

import { useEffect, useRef } from "react";
import { useCombatStore } from "@/stores/combatStore";
import type { Combatant } from "@/types";

// ── Props ───────────────────────────────────────────────

interface InitiativeOverlayProps {
  /** Whether the overlay is visible */
  visible: boolean;
  /** Called when DM clicks "Next Turn" */
  onNextTurn: () => void;
  /** Called when DM clicks "Previous Turn" */
  onPrevTurn: () => void;
  /** Called when combatant row is clicked (for selection/highlighting) */
  onSelectCombatant?: (combatantId: string) => void;
  /** Currently highlighted combatant ID (for canvas sync) */
  activeCombatantId?: string | null;
}

// ── Helpers ─────────────────────────────────────────────

function getHpBarColor(current: number, max: number): string {
  const ratio = current / max;
  if (ratio > 0.5) return "#22c55e";
  if (ratio > 0.25) return "#eab308";
  return "#ef4444";
}

function getHpBarWidth(current: number, max: number): string {
  return `${Math.max(0, Math.min(100, (current / max) * 100))}%`;
}

function getTypeIcon(type: string): string {
  switch (type) {
    case "player": return "🛡";
    case "enemy": return "👹";
    case "ally": return "🧙";
    default: return "✦";
  }
}

// ── Component ───────────────────────────────────────────

export default function InitiativeOverlay({
  visible,
  onNextTurn,
  onPrevTurn,
  onSelectCombatant,
  activeCombatantId,
}: InitiativeOverlayProps) {
  const activeEncounter = useCombatStore((s) => s.activeEncounter);
  const listRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to current combatant
  useEffect(() => {
    if (!listRef.current || !activeEncounter) return;
    const currentIdx = activeEncounter.currentCombatantIndex;
    const items = listRef.current.querySelectorAll<HTMLElement>("[data-combatant-index]");
    const currentItem = items[currentIdx];
    if (currentItem) {
      currentItem.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [activeEncounter?.currentCombatantIndex, activeEncounter?.combatants.length]);

  if (!visible || !activeEncounter) return null;

  const { combatants, currentCombatantIndex, round, phase, isPaused } = activeEncounter;
  const current = combatants[currentCombatantIndex];
  const nextIndex = combatants.length > 1 ? (currentCombatantIndex + 1) % combatants.length : -1;
  const next = nextIndex >= 0 ? combatants[nextIndex] : null;

  // ── Phase badge config ──
  const phaseConfig: Record<string, { label: string; color: string; bg: string }> = {
    prep: { label: "⚙ Prep", color: "#94a3b8", bg: "rgba(148, 163, 184, 0.1)" },
    active: { label: "⚔ Active", color: "#eab308", bg: "rgba(234, 179, 8, 0.1)" },
    completed: { label: "✓ Done", color: "#22c55e", bg: "rgba(34, 197, 94, 0.1)" },
  };
  const pc = phaseConfig[phase] || phaseConfig.prep;

  return (
    <div className="absolute top-2 right-2 z-30 select-none" style={{ maxWidth: "280px" }}>
      {/* ── Glass card ── */}
      <div className="rounded-xl overflow-hidden" style={{
        background: "rgba(15, 16, 26, 0.88)",
        backdropFilter: "blur(16px)",
        border: "1px solid rgba(255, 255, 255, 0.05)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(234, 179, 8, 0.06)",
      }}>
        {/* ── Header bar ── */}
        <div className="flex items-center justify-between px-3 py-2" style={{
          borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
        }}>
          <div className="flex items-center gap-2">
            {/* Round badge */}
            <span className="text-[11px] font-bold text-gold-400" style={{
              background: "rgba(234, 179, 8, 0.12)",
              padding: "2px 7px",
              borderRadius: "4px",
              border: "1px solid rgba(234, 179, 8, 0.18)",
            }}>
              R{round || "-"}
            </span>

            {/* Phase badge */}
            <span className="text-[10px] font-medium px-2 py-0.5 rounded" style={{
              color: pc.color,
              background: pc.bg,
              border: `1px solid ${pc.color}20`,
            }}>
              {pc.label}
            </span>

            {isPaused && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded text-amber-400" style={{
                background: "rgba(251, 191, 36, 0.1)",
                border: "1px solid rgba(251, 191, 36, 0.2)",
              }}>
                ⏸ Paused
              </span>
            )}
          </div>
        </div>

        {/* ── Combatant list ── */}
        <div ref={listRef} className="overflow-y-auto" style={{
          maxHeight: "280px",
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(234, 179, 8, 0.15) transparent",
        }}>
          {combatants.length === 0 ? (
            <div className="px-3 py-6 text-center text-surface-500 text-[11px]">
              No combatants in initiative order.
            </div>
          ) : (
            combatants.map((c, i) => {
              const isCurrent = i === currentCombatantIndex;
              const isNext = next?.id === c.id && !isCurrent && !c.isDead;
              const isActive = c.id === activeCombatantId;

              return (
                <div
                  key={c.id}
                  data-combatant-index={i}
                  onClick={() => onSelectCombatant?.(c.id)}
                  className="flex items-center gap-2 px-3 py-1.5 cursor-pointer transition-all duration-150"
                  style={{
                    background: isCurrent
                      ? "rgba(234, 179, 8, 0.08)"
                      : isActive
                        ? "rgba(234, 179, 8, 0.04)"
                        : "transparent",
                    borderLeft: isCurrent
                      ? "2px solid #eab308"
                      : isActive
                        ? "2px solid rgba(234, 179, 8, 0.3)"
                        : "2px solid transparent",
                    opacity: c.isDead ? 0.45 : 1,
                  }}
                >
                  {/* Turn indicator */}
                  <div className="w-4 flex-shrink-0 flex justify-center">
                    {isCurrent ? (
                      <span className="w-2 h-2 rounded-full bg-gold-400 animate-pulse shadow-[0_0_6px_rgba(234,179,8,0.5)]" />
                    ) : isNext ? (
                      <span className="w-2 h-2 rounded-full bg-amber-400" style={{
                        animation: "pulse 1.5s ease-in-out infinite",
                      }} />
                    ) : null}
                  </div>

                  {/* Initiative value */}
                  <span className="w-7 text-right text-[11px] font-mono font-bold flex-shrink-0" style={{
                    color: c.isDead ? "#6b7280" : isCurrent ? "#eab308" : "#e2e8f0",
                  }}>
                    {c.initiative}
                  </span>

                  {/* Name + type icon */}
                  <div className="flex-1 min-w-0 flex items-center gap-1.5">
                    <span className="text-[11px] flex-shrink-0">{getTypeIcon(c.type)}</span>
                    <span className="text-[11px] font-medium truncate" style={{
                      color: c.isDead ? "#6b7280" : isCurrent ? "#fde047" : "#d1d5db",
                      textDecoration: c.isDead ? "line-through" : "none",
                    }}>
                      {c.name}
                    </span>
                  </div>

                  {/* HP bar (compact) */}
                  <div className="w-14 flex-shrink-0">
                    <div className="h-1.5 rounded-full overflow-hidden" style={{
                      background: "rgba(255,255,255,0.06)",
                    }}>
                      <div className="h-full rounded-full transition-all duration-300" style={{
                        width: getHpBarWidth(c.hitPoints.current, c.hitPoints.max),
                        background: getHpBarColor(c.hitPoints.current, c.hitPoints.max),
                      }} />
                    </div>
                    <div className="text-[9px] font-mono text-right mt-px" style={{
                      color: c.isDead ? "#6b7280" : "#9ca3af",
                    }}>
                      {c.hitPoints.current}/{c.hitPoints.max}
                    </div>
                  </div>

                  {/* Status effects count */}
                  {c.statusEffects.length > 0 && (
                    <span className="text-[9px] px-1 rounded flex-shrink-0" style={{
                      background: "rgba(251, 191, 36, 0.1)",
                      color: "#fbbf24",
                    }}>
                      +{c.statusEffects.length}
                    </span>
                  )}

                  {/* Death marker */}
                  {c.isDead && (
                    <span className="text-[10px] flex-shrink-0">💀</span>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* ── Action bar ── */}
        <div className="flex items-center gap-1 px-2 py-1.5" style={{
          borderTop: "1px solid rgba(255, 255, 255, 0.04)",
        }}>
          {/* Previous Turn */}
          <button
            onClick={onPrevTurn}
            disabled={phase !== "active"}
            className="flex-1 flex items-center justify-center gap-1 text-[10px] font-medium py-1.5 rounded-lg transition-all duration-150 disabled:opacity-30 hover:bg-white/[0.04]"
            style={{ color: "#9ca3af" }}
            title="Previous Turn"
          >
            ◄ Prev
          </button>

          {/* Center spacer with combatant count */}
          <span className="text-[9px] text-surface-500 px-1">
            {currentCombatantIndex + 1}/{combatants.length}
          </span>

          {/* Next Turn */}
          <button
            onClick={onNextTurn}
            disabled={phase !== "active"}
            className="flex-1 flex items-center justify-center gap-1 text-[10px] font-medium py-1.5 rounded-lg transition-all duration-150 disabled:opacity-30 hover:bg-gold-500/[0.06]"
            style={{ color: "#eab308" }}
            title="Next Turn"
          >
            Next ►
          </button>
        </div>
      </div>
    </div>
  );
}
