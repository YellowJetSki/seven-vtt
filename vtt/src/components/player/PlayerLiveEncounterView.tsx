/**
 * STᚱ VTT — Player Live Encounter View (Companion PC Screen — Overrrides-Grade)
 *
 * A companion overlay for the Player Sheet that joins alongside
 * the DM's Theatric Display. Shows live encounter information
 * from the DM's active combat — round number, current turn,
 * turn order, HP status for allies, and damage/heal updates.
 *
 * Features:
 *   - Round counter with phase indicator (Prep/Active/Paused)
 *   - Current turn display with pulsing gold indicator + "Your Turn" cinematic
 *   - Premium turn order cards with color-coded HP bars and 5-tier status
 *   - "Your Turn" cinematic pulse overlay (full glow ring animation)
 *   - Live HP updates from combat store (Firestore-synced)
 *   - Damage/heal flash messages with ACTUAL numerical values
 *   - Turn transition animation effects
 *   - Premium glass gradient styling matching the design system
 *   - Staggered entrance animations
 *
 * Deployed: https://arkla.vercel.app
 * Campaign: Arkla — Wendy Swiftfoot (Rogue 5), Kehrfuffle Ironheart (Paladin 5)
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useCombatStore } from "@/stores/combatStore";

interface PlayerLiveEncounterViewProps {
  /** The current player's character ID to highlight */
  playerCharacterId?: string;
  /** The current player's character name to highlight */
  playerCharacterName?: string;
  /** Optional compact mode for sidebar integration */
  compact?: boolean;
}

// ── 5-tier HP status with color coding ──
function getHpTier(current: number, max: number): { label: string; color: string; bar: string } {
  if (current <= 0 || max <= 0) return { label: "Down", color: "text-rose-400", bar: "bg-rose-500/40" };
  const r = current / max;
  if (r <= 0.25) return { label: "Critical", color: "text-red-400", bar: "bg-red-500" };
  if (r <= 0.5) return { label: "Bloodied", color: "text-amber-400", bar: "bg-amber-500" };
  if (r <= 0.75) return { label: "Scratched", color: "text-emerald-400", bar: "bg-emerald-400" };
  return { label: "Healthy", color: "text-emerald-400", bar: "bg-emerald-500" };
}

export default function PlayerLiveEncounterView({
  playerCharacterId,
  playerCharacterName,
  compact = false,
}: PlayerLiveEncounterViewProps) {
  const activeEncounter = useCombatStore((s) => s.activeEncounter);
  const [flashMessage, setFlashMessage] = useState<{
    text: string;
    type: "damage" | "heal" | "info";
  } | null>(null);
  const [prevHpMap, setPrevHpMap] = useState<Record<string, number>>({});
  const [shownFlashIds, setShownFlashIds] = useState<Set<string>>(new Set());
  const flashTimestampsRef = useRef<Record<string, number>>({});

  // Flash message auto-dismiss
  useEffect(() => {
    if (!flashMessage) return;
    const t = setTimeout(() => setFlashMessage(null), 2500);
    return () => clearTimeout(t);
  }, [flashMessage]);

  // Detect HP changes per combatant and show flash messages with actual values
  useEffect(() => {
    if (!activeEncounter) return;

    for (const c of activeEncounter.combatants) {
      const prevHp = prevHpMap[c.id] ?? c.hitPoints.current;
      const currentHp = c.hitPoints.current;
      const diff = currentHp - prevHp;

      if (diff !== 0 && c.hitPoints.max > 0) {
        const flashKey = `${c.id}-${currentHp}-${Date.now()}`;
        const now = Date.now();
        const lastFlash = flashTimestampsRef.current[c.id] ?? 0;

        // Only show flash if > 500ms since last for this combatant (debounce)
        if (now - lastFlash > 500 && !shownFlashIds.has(flashKey)) {
          setShownFlashIds((prev) => new Set(prev).add(flashKey));
          flashTimestampsRef.current[c.id] = now;

          if (diff < 0) {
            setFlashMessage({
              text: `${c.name}: ${diff} HP`,
              type: "damage",
            });
          } else if (diff > 0) {
            setFlashMessage({
              text: `${c.name}: +${diff} HP`,
              type: "heal",
            });
          }
        }
      }
    }

    // Update HP map for next comparison
    const newMap: Record<string, number> = {};
    for (const c of activeEncounter.combatants) {
      newMap[c.id] = c.hitPoints.current;
    }
    setPrevHpMap(newMap);
    // Clean up old flash IDs
    if (shownFlashIds.size > 50) {
      setShownFlashIds(new Set());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeEncounter?.combatants.map((c) => `${c.id}:${c.hitPoints.current}`).join(",")]);

  if (!activeEncounter || activeEncounter.phase === "completed") {
    return null;
  }

  const currentIdx = activeEncounter.currentCombatantIndex;
  const currentCombatant =
    currentIdx >= 0 && currentIdx < activeEncounter.combatants.length
      ? activeEncounter.combatants[currentIdx]
      : null;

  const isPlayerTurn =
    currentCombatant &&
    playerCharacterName &&
    currentCombatant.name.toLowerCase() === playerCharacterName.toLowerCase();

  // Sort combatants by initiative descending for turn order display
  const sortedCombatants = useMemo(() => {
    return [...activeEncounter.combatants].sort((a, b) => b.initiative - a.initiative);
  }, [activeEncounter.combatants]);

  const phaseLabel =
    activeEncounter.phase === "prep"
      ? "Preparing"
      : activeEncounter.phase === "active"
      ? "⚔ In Combat"
      : "Completed";
  const phaseColor =
    activeEncounter.phase === "prep"
      ? "text-amber-400"
      : activeEncounter.phase === "active"
      ? "text-rose-400"
      : "text-surface-500";

  const aliveCount = activeEncounter.combatants.filter((c) => c.hitPoints.current > 0).length;
  const deadCount = activeEncounter.combatants.filter((c) => c.hitPoints.current <= 0).length;

  return (
    <div className="relative w-full bg-gradient-to-b from-[#14151f]/[0.92] to-[#0f1019]/[0.96] border border-white/[0.04] rounded-xl shadow-[0_8px_40px_rgba(0,0,0,0.3)] overflow-hidden transition-all duration-200">
      {/* Your Turn — Cinematic full-width pulse banner */}
      {isPlayerTurn && (
        <div className="absolute inset-0 rounded-xl border-2 border-gold-500/20 pointer-events-none animate-pulse z-0" />
      )}

      {/* Flash message toast */}
      {flashMessage && (
        <div
          className={`absolute top-2 right-2 z-10 px-3 py-1.5 rounded-lg text-[11px] font-semibold backdrop-blur-xl shadow-lg animate-in slide-in-from-top-1 duration-200 ${
            flashMessage.type === "damage"
              ? "bg-rose-500/20 text-rose-300 border border-rose-500/20"
              : flashMessage.type === "heal"
              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/20"
              : "bg-gold-500/15 text-gold-300 border border-gold-500/15"
          }`}
        >
          {flashMessage.text}
        </div>
      )}

      {/* Edge light */}
      <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-gold-500/25 to-transparent pointer-events-none z-[1]" />

      {/* Header — Round + Phase + Turn indicator */}
      <div className="relative flex items-center justify-between px-4 py-3 border-b border-white/[0.04] z-[1]">
        <div className="flex items-center gap-3">
          <h3 className="text-[13px] font-bold text-white/90 font-display tracking-tight">
            ⚔ Combat
          </h3>
          {isPlayerTurn && (
            <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest bg-gold-500/15 text-gold-300 border border-gold-500/20 rounded-md animate-pulse">
              Your Turn
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {currentCombatant && (
            <span className={`text-[10px] font-semibold ${isPlayerTurn ? "text-gold-300" : "text-surface-400"} truncate max-w-[80px] hidden sm:block`}>
              {currentCombatant.name}
            </span>
          )}
          <span className="text-[11px] font-mono tabular-nums text-gold-400/80">
            R{activeEncounter.round}
          </span>
          <span className={`text-[10px] font-mono uppercase tracking-wider ${phaseColor}`}>
            {phaseLabel}
          </span>
        </div>
      </div>

      {/* Turn order list */}
      <div className="px-2 py-2 space-y-1 max-h-[240px] overflow-y-auto scrollbar-gold">
        {sortedCombatants.map((c, idx) => {
          const hpRatio = c.hitPoints.max > 0 ? c.hitPoints.current / c.hitPoints.max : 0;
          const isCurrent = c.id === currentCombatant?.id;
          const isPlayer = playerCharacterName && c.name.toLowerCase() === playerCharacterName.toLowerCase();
          const tier = getHpTier(c.hitPoints.current, c.hitPoints.max);

          return (
            <div
              key={c.id}
              className={`relative flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-all duration-150 ${
                isCurrent
                  ? "bg-gold-500/10 border border-gold-500/20 shadow-[0_0_8px_rgba(234,179,8,0.04)]"
                  : c.hitPoints.current <= 0
                  ? "opacity-50"
                  : "hover:bg-white/[0.02]"
              } ${isCurrent && isPlayerTurn ? "ring-1 ring-gold-500/30" : ""}`}
            >
              {/* Current turn indicator bar */}
              {isCurrent && (
                <div className="absolute left-0 top-1 bottom-1 w-[2px] rounded-r-full bg-gold-500" />
              )}

              {/* Initiative badge */}
              <span className="w-6 text-[10px] font-mono tabular-nums text-surface-400 text-right shrink-0">
                {c.initiative}
              </span>

              {/* Creature type icon */}
              <span className="text-[10px] shrink-0">
                {c.type === "player" ? "🛡" : c.type === "ally" ? "🧙" : "👹"}
              </span>

              {/* Name and type */}
              <span
                className={`flex-1 text-[12px] truncate ${
                  isPlayer
                    ? "text-gold-300 font-bold"
                    : isCurrent
                    ? "text-gold-400 font-semibold"
                    : "text-surface-300"
                }`}
              >
                {isPlayer && <span className="text-gold-400">✦ </span>}
                {c.name}
              </span>

              {/* Status effects */}
              {c.statusEffects && c.statusEffects.length > 0 && (
                <span className="text-[9px] text-surface-500 shrink-0">
                  +{c.statusEffects.length}
                </span>
              )}

              {/* Compact HP with percentage bar */}
              <div className="w-20 shrink-0">
                <div className="h-1.5 bg-surface-800/60 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${tier.bar}`}
                    style={{ width: `${Math.max(0, Math.min(100, hpRatio * 100))}%` }}
                  />
                </div>
                <div className="flex justify-between mt-0.5">
                  <span className={`text-[8px] font-mono tabular-nums ${tier.color}`}>
                    {c.hitPoints.current}
                  </span>
                  <span className="text-[8px] font-mono tabular-nums text-surface-600">
                    {c.hitPoints.max}
                  </span>
                </div>
              </div>

              {/* Status dot */}
              {isCurrent && (
                <span className="w-1.5 h-1.5 rounded-full bg-gold-400 shadow-[0_0_4px_rgba(234,179,8,0.5)] shrink-0 animate-pulse" />
              )}
            </div>
          );
        })}
      </div>

      {/* Footer — Alive/Dead + Round counter + Your Turn hint */}
      {activeEncounter.combatants.length > 0 && (
        <div className="relative flex items-center justify-between px-4 py-2 border-t border-white/[0.04] z-[1]">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-[9px] text-surface-500 tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              {aliveCount} alive
            </span>
            {deadCount > 0 && (
              <span className="flex items-center gap-1 text-[9px] text-surface-500 tracking-wide">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                {deadCount} down
              </span>
            )}
            <span className="text-[9px] text-surface-600 tracking-wide">
              R{activeEncounter.round}
            </span>
          </div>
          {isPlayerTurn && (
            <span className="text-[9px] font-bold text-gold-400 animate-pulse tracking-wider">
              Act Now
            </span>
          )}
        </div>
      )}
    </div>
  );
}
