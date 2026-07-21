/**
 * STᚱ VTT — Combat Quick Status (Ventriloc-Grade Live Data Viz)
 *
 * Premium live combat status snapshot with real-time data visualization.
 *
 * Architecture:
 *   Active combat → 3 stat cards (Round/Alive/Dead) + current turn display + damage total
 *   No combat    → "No active encounter" with quick-launch CTA
 *
 * Design inspiration: Ventriloc's data dashboard aesthetic with
 * tabular-nums, color-coded stat cards, subtle progress bars,
 * and glass depth layers.
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

  const aliveCount = combatants.filter((c) => !c.isDead && (c.hitPoints?.current ?? 0) > 0).length;
  const deadCount = combatants.filter((c) => c.isDead || (c.hitPoints?.current ?? 0) <= 0).length;
  const totalDamage = combatLog
    .filter((e) => e.type === "damage")
    .reduce((sum, e) => sum + (e.value ?? 0), 0);

  const handleLaunch = useCallback(() => {
    navigate("/campaign/maps");
  }, [navigate]);

  return (
    <div className="relative group">
      {/* Glass gradient background */}
      <div className="bg-gradient-to-b from-[#141520] to-[#0f1019] border border-white/[0.04] rounded-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.04]">
          <div className="flex items-center gap-2">
            <span className="text-sm">⚔</span>
            <span className="text-[10px] font-bold text-white/70 uppercase tracking-wider">
              Combat Status
            </span>
          </div>
          {isActive && (
            <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-red-500/15 border border-red-500/20 text-red-400">
              <span className="w-1 h-1 rounded-full bg-red-400 animate-pulse-soft" />
              LIVE
            </span>
          )}
        </div>

        <div className="p-4">
          {!isActive || !activeEncounter ? (
            /* ── Inactive state ── */
            <div className="text-center py-4">
              {/* Icon container */}
              <div className="w-10 h-10 rounded-xl bg-[#0c0d15] border border-white/[0.04] flex items-center justify-center mx-auto mb-3">
                <span className="text-lg opacity-50">⚔</span>
              </div>

              <p className="text-[11px] font-semibold text-surface-400">No Active Combat</p>
              <p className="text-[9px] text-surface-600 mt-1 max-w-[180px] mx-auto">
                Launch an encounter from Battle Maps to start tracking
              </p>

              <button
                onClick={handleLaunch}
                className="mt-3 px-3 py-1.5 rounded-lg text-[10px] font-semibold bg-gold-500/10 border border-gold-500/20 text-gold-400 hover:bg-gold-500/15 hover:shadow-[0_0_12px_rgba(234,179,8,0.06)] active:scale-95 transition-all duration-150"
              >
                → Open Battle Maps
              </button>
            </div>
          ) : (
            /* ── Active combat display ── */
            <div className="space-y-3">
              {/* Round + Alive + Dead stat cards */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Round", value: round, color: "text-white/90" },
                  { label: "Alive", value: aliveCount, color: "text-emerald-400" },
                  { label: "Dead", value: deadCount, color: "text-red-400" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="bg-[#0c0d15] rounded-lg p-2.5 text-center border border-white/[0.03]"
                  >
                    <p className="text-[9px] text-surface-500 uppercase tracking-wider font-medium">{stat.label}</p>
                    <p className={`text-xl font-bold ${stat.color} tabular-nums mt-0.5`}>
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Current turn card */}
              {currentCombatant && (
                <div className="bg-[#0c0d15] rounded-lg p-3 border border-white/[0.04] relative overflow-hidden">
                  {/* Top edge light */}
                  <div className="absolute top-0 left-[20%] right-[20%] h-px bg-gradient-to-r from-transparent via-gold-500/15 to-transparent" />

                  <p className="text-[9px] text-surface-500 uppercase tracking-wider mb-2">Current Turn</p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      {/* Type icon */}
                      <div className="w-8 h-8 rounded-lg bg-[#07080d] border border-white/[0.04] flex items-center justify-center">
                        <span className="text-sm">
                          {currentCombatant.type === "player" ? "🛡"
                            : currentCombatant.type === "enemy" ? "👹"
                            : "🧙"}
                        </span>
                      </div>

                      <div>
                        <p className="text-sm font-bold text-white/80 leading-tight">
                          {currentCombatant.name}
                        </p>
                        <p className="text-[9px] text-surface-500 mt-0.5">
                          Init {currentCombatant.initiative ?? "—"}
                          {currentCombatant.hitPoints && (
                            <> · HP {currentCombatant.hitPoints.current}/{currentCombatant.hitPoints.max}</>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* HP micro bar */}
                    {currentCombatant.hitPoints && (
                      <div className="w-16">
                        <div className="h-1.5 bg-[#07080d] rounded-full overflow-hidden border border-white/[0.03]">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
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

              {/* Total damage dealt */}
              {totalDamage > 0 && (
                <div className="flex items-center justify-between bg-[#0c0d15] rounded-lg px-3 py-2 border border-white/[0.03]">
                  <span className="text-[10px] text-surface-500">Total Damage Dealt</span>
                  <span className="text-xs font-bold text-red-400 tabular-nums">{totalDamage}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
