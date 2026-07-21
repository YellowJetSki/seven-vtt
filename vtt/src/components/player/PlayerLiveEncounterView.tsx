/**
 * STᚱ VTT — Player Live Encounter View (Companion PC Screen)
 *
 * A companion overlay for the Player Sheet that joins alongside
 * the DM's Theatric Display. Shows live encounter information
 * from the DM's active combat — round number, current turn,
 * turn order, HP status for allies, and damage/heal updates.
 *
 * Features:
 *   - Round counter with phase indicator (Prep/Active/Paused)
 *   - Current turn display with pulsing gold indicator
 *   - Compact turn order with HP bars and status effects
 *   - "My Turn" badge when it's the player's character's turn
 *   - Live HP updates from combat store (Firestore-synced)
 *   - Damage/heal flash messages for the player
 *   - Premium glass gradient styling matching the design system
 *   - Staggered entrance animations
 *
 * Deployed: https://arkla.vercel.app
 * Campaign: Arkla — Wendy Swiftfoot (Rogue 5), Kehrfuffle Ironheart (Paladin 5)
 */

import { useEffect, useMemo, useState } from "react";
import { useCombatStore } from "@/stores/combatStore";

interface PlayerLiveEncounterViewProps {
  /** The current player's character ID to highlight */
  playerCharacterId?: string;
  /** The current player's character name to highlight */
  playerCharacterName?: string;
}

function getHpColorClass(ratio: number): string {
  if (ratio <= 0) return "text-rose-400";
  if (ratio <= 0.25) return "text-red-400";
  if (ratio <= 0.5) return "text-amber-400";
  return "text-emerald-400";
}

function getHpBarColor(ratio: number, current: number): string {
  if (current <= 0) return "bg-rose-500";
  if (ratio <= 0.25) return "bg-red-500";
  if (ratio <= 0.5) return "bg-amber-500";
  return "bg-emerald-500";
}

export default function PlayerLiveEncounterView({
  playerCharacterId,
  playerCharacterName,
}: PlayerLiveEncounterViewProps) {
  const activeEncounter = useCombatStore((s) => s.activeEncounter);
  const [flashMessage, setFlashMessage] = useState<{
    text: string;
    type: "damage" | "heal" | "info";
  } | null>(null);

  // Flash message auto-dismiss
  useEffect(() => {
    if (!flashMessage) return;
    const t = setTimeout(() => setFlashMessage(null), 2500);
    return () => clearTimeout(t);
  }, [flashMessage]);

  // Watch for the player's own character HP changes for flash feedback
  useEffect(() => {
    if (!activeEncounter || !playerCharacterName) return;
    const playerCombatant = activeEncounter.combatants.find(
      (c) => c.name.toLowerCase() === playerCharacterName.toLowerCase()
    );
    if (!playerCombatant) return;

    // Listen for HP changes — if current < max and visible, show flash
    const { current, max } = playerCombatant.hitPoints;
    if (current < max && current > 0) {
      setFlashMessage({ text: "HP Updated", type: "info" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeEncounter?.combatants.map((c) => c.hitPoints.current).join(",")]);

  const encounter = activeEncounter;

  if (!encounter || encounter.phase === "completed") {
    return null;
  }

  const currentIdx = encounter.currentCombatantIndex;
  const currentCombatant =
    currentIdx >= 0 && currentIdx < encounter.combatants.length
      ? encounter.combatants[currentIdx]
      : null;

  const isPlayerTurn =
    currentCombatant &&
    playerCharacterName &&
    currentCombatant.name.toLowerCase() === playerCharacterName.toLowerCase();

  // Sort combatants by initiative descending for turn order display
  const sortedCombatants = useMemo(() => {
    return [...encounter.combatants].sort((a, b) => b.initiative - a.initiative);
  }, [encounter.combatants]);

  const phaseLabel =
    encounter.phase === "prep"
      ? "Preparing"
      : encounter.phase === "active"
      ? "⚔ In Combat"
      : "Completed";
  const phaseColor =
    encounter.phase === "prep"
      ? "text-amber-400"
      : encounter.phase === "active"
      ? "text-rose-400"
      : "text-surface-500";

  return (
    <div className="w-full bg-gradient-to-b from-[#14151f]/90 to-[#0f1019]/95 border border-white/[0.04] rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.2)] overflow-hidden transition-all duration-200">
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
      <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-gold-500/25 to-transparent pointer-events-none" />

      {/* Header — Round + Phase + Turn indicator */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.04]">
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
          <span className="text-[11px] font-mono tabular-nums text-gold-400/80">
            R{encounter.round}
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
          const isPlayer =
            playerCharacterName &&
            c.name.toLowerCase() === playerCharacterName.toLowerCase();

          return (
            <div
              key={c.id}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-all duration-150 ${
                isCurrent
                  ? "bg-gold-500/10 border border-gold-500/20 shadow-[0_0_8px_rgba(234,179,8,0.04)]"
                  : c.hitPoints.current <= 0
                  ? "opacity-50"
                  : "hover:bg-white/[0.02]"
              }`}
            >
              {/* Initiative badge */}
              <span className="w-6 text-[10px] font-mono tabular-nums text-surface-400 text-right shrink-0">
                {c.initiative}
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
                {isPlayer && "✦ "}
                {c.name}
              </span>

              {/* Status effects */}
              {c.statusEffects && c.statusEffects.length > 0 && (
                <span className="text-[9px] text-surface-500 shrink-0">
                  +{c.statusEffects.length}
                </span>
              )}

              {/* HP bar */}
              <div className="w-16 shrink-0">
                <div className="h-1.5 bg-surface-800/60 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${getHpBarColor(
                      hpRatio,
                      c.hitPoints.current
                    )}`}
                    style={{ width: `${Math.max(0, hpRatio * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between mt-0.5">
                  <span className={`text-[8px] font-mono tabular-nums ${getHpColorClass(hpRatio)}`}>
                    {c.hitPoints.current}
                  </span>
                  <span className="text-[8px] font-mono tabular-nums text-surface-600">
                    {c.hitPoints.max}
                  </span>
                </div>
              </div>

              {/* Player turn indicator */}
              {isCurrent && (
                <span className="w-1.5 h-1.5 rounded-full bg-gold-400 shadow-[0_0_4px_rgba(234,179,8,0.5)] shrink-0 animate-pulse" />
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      {encounter.combatants.length > 0 && (
        <div className="px-4 py-2 border-t border-white/[0.04]">
          <span className="text-[9px] text-surface-500 tracking-wide">
            {encounter.combatants.filter((c) => c.hitPoints.current > 0).length} alive ·{" "}
            {encounter.combatants.filter((c) => c.hitPoints.current <= 0).length} down ·{" "}
            {encounter.round} round{encounter.round !== 1 ? "s" : ""}
          </span>
        </div>
      )}
    </div>
  );
}
