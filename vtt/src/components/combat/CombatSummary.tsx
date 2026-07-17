/* ── CombatSummary ─────────────────────────────────────────────
 * Shows active encounter name, round count, alive/dead, turn indicator.
 * ─────────────────────────────────────────────────────────────── */

import type { CombatEncounter } from "@/types/combat";

interface Props {
  activeEncounter: CombatEncounter | null;
}

export function CombatSummary({ activeEncounter }: Props) {
  if (!activeEncounter) return null;

  const aliveCount = activeEncounter.combatants.filter((c) => !c.isDead).length;
  const deadCount = activeEncounter.combatants.length - aliveCount;
  const currentCombatant = activeEncounter.combatants[activeEncounter.currentCombatantIndex];

  return (
    <div className={`rounded-xl border p-4 ${
      activeEncounter.phase === "active" ? "border-warrior-500/30 bg-warrior-500/5" : "border-surface-700 bg-surface-850"
    }`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">⚔️</span>
        <h4 className="text-sm font-semibold text-surface-100">{activeEncounter.name}</h4>
        {activeEncounter.phase === "active" && (
          <span className="rounded bg-warrior-500/20 px-2 py-0.5 text-[11px] font-medium text-warrior-400">R{activeEncounter.round}</span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="rounded bg-surface-800 p-2"><p className="text-surface-500">Alive</p><p className="font-bold text-surface-200">{aliveCount}</p></div>
        <div className="rounded bg-surface-800 p-2"><p className="text-surface-500">Defeated</p><p className="font-bold text-warrior-400">{deadCount}</p></div>
      </div>
      {activeEncounter.phase === "active" && currentCombatant && (
        <div className="mt-2 rounded-lg bg-accent-500/10 p-2 text-center">
          <p className="text-[11px] text-accent-400">▶ {currentCombatant.name}'s Turn</p>
        </div>
      )}
    </div>
  );
}
