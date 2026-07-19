/**
 * STᚱ VTT — Combat Quick Status (DM War Room)
 *
 * Live combat status snapshot for the DM dashboard.
 * If combat is active: shows round, whose turn it is,
 * combatant counts (alive/dead), and damage dealt summary.
 * If no combat: shows "No active combat" with quick-launch button.
 *
 * This saves DMs from navigating to the control center just
 * to check whether combat is still going.
 */

import { useCallback } from "react";
import { useCombatStore } from "@/stores/combatStore";
import { useNavigate } from "react-router-dom";

export default function CombatQuickStatus() {
  const navigate = useNavigate();
  const activeEncounter = useCombatStore((s) => s.activeEncounter);
  const combatLog = useCombatStore((s) => s.combatLog);

  const isActive = activeEncounter?.phase === "active" || activeEncounter?.phase === "prep";
  const combatants = activeEncounter?.combatants ?? [];
  const round = activeEncounter?.round ?? 0;
  const currentIdx = activeEncounter?.currentCombatantIndex ?? 0;
  const currentCombatant = combatants[currentIdx];

  const aliveCount = combatants.filter((c) => !c.isDead && c.hitPoints.current > 0).length;
  const deadCount = combatants.filter((c) => c.isDead || c.hitPoints.current <= 0).length;
  const totalDamage = combatLog
    .filter((e) => e.type === "damage")
    .reduce((sum, e) => sum + (e.value ?? 0), 0);

  const handleLaunchControlCenter = useCallback(() => {
    navigate("/campaign/battle-maps");
  }, [navigate]);

  return (
    <div className="bg-gradient-to-b from-[#141520] to-[#0f1019] border border-white/[0.04] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.04]">
        <div className="flex items-center gap-2">
          <span className="text-sm">⚔</span>
          <span className="text-xs font-bold text-white/70 uppercase tracking-wider">
            Combat Status
          </span>
        </div>
        {isActive && (
          <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-red-500/15 border border-red-500/20 text-red-400 animate-pulse-soft">
            LIVE
          </span>
        )}
      </div>

      <div className="p-4">
        {!isActive || !activeEncounter ? (
          /* ── No active combat ── */
          <div className="text-center py-3">
            <p className="text-surface-500 text-xs">No active combat encounter</p>
            <p className="text-surface-600 text-[10px] mt-1">
              Launch an encounter from Battle Maps
            </p>
            <button
              onClick={handleLaunchControlCenter}
              className="mt-3 px-3 py-1.5 rounded-lg text-[10px] font-semibold bg-gold-500/10 border border-gold-500/20 text-gold-400 hover:bg-gold-500/15 active:scale-95 transition-all duration-150"
            >
              → Open Battle Maps
            </button>
          </div>
        ) : (
          /* ── Active combat display ── */
          <div className="space-y-3">
            {/* Round + Combatants */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-[#0c0d15] rounded-lg p-2.5 text-center">
                <p className="text-[9px] text-surface-500 uppercase tracking-wider">Round</p>
                <p className="text-lg font-bold text-white/90 tabular-nums">{round}</p>
              </div>
              <div className="bg-[#0c0d15] rounded-lg p-2.5 text-center">
                <p className="text-[9px] text-surface-500 uppercase tracking-wider">Alive</p>
                <p className="text-lg font-bold text-emerald-400 tabular-nums">{aliveCount}</p>
              </div>
              <div className="bg-[#0c0d15] rounded-lg p-2.5 text-center">
                <p className="text-[9px] text-surface-500 uppercase tracking-wider">Dead</p>
                <p className="text-lg font-bold text-red-400 tabular-nums">{deadCount}</p>
              </div>
            </div>

            {/* Current turn */}
            {currentCombatant && (
              <div className="bg-[#0c0d15] rounded-lg p-3">
                <p className="text-[9px] text-surface-500 uppercase tracking-wider mb-1">
                  Current Turn
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      {currentCombatant.type === "player" ? "🛡" : currentCombatant.type === "enemy" ? "👹" : "🧙"}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-white/80">{currentCombatant.name}</p>
                      <p className="text-[9px] text-surface-500">
                        Init {currentCombatant.initiative}
                        {currentCombatant.hitPoints && (
                          <> · HP {currentCombatant.hitPoints.current}/{currentCombatant.hitPoints.max}</>
                        )}
                      </p>
                    </div>
                  </div>
                  {currentCombatant.hitPoints && (
                    <div className="w-16">
                      <div className="h-1 bg-[#07080d] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            (currentCombatant.hitPoints.current / currentCombatant.hitPoints.max) > 0.5
                              ? "bg-emerald-500/70"
                              : (currentCombatant.hitPoints.current / currentCombatant.hitPoints.max) > 0.25
                              ? "bg-amber-500/70"
                              : "bg-red-500/70"
                          }`}
                          style={{
                            width: `${Math.max(0, (currentCombatant.hitPoints.current / currentCombatant.hitPoints.max) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Total damage */}
            {totalDamage > 0 && (
              <div className="flex items-center justify-between bg-[#0c0d15] rounded-lg px-3 py-2">
                <span className="text-[10px] text-surface-500">Total Damage Dealt</span>
                <span className="text-xs font-bold text-red-400 tabular-nums">{totalDamage}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
