/* ── Initiative Tracker Component ─────────────────────────────
 * Premium combat management with:
 *  • Drag-reorderable turn order (HTML5 DnD)
 *  • One-click damage / heal / temp HP
 *  • Status effect toggles (blinded, poisoned, stunned, etc.)
 *  • Concentration tracking
 *  • Round counter + turn indicator + turn timer overlay
 *  • Combat log with search, filter, and JSON export
 *  • Quick-add combatants from player roster
 *  • Enemy group actions (bulk damage/heal)
 *  • Initiative management tools (DEX-based assignment, sort)
 *  • Keyboard accessibility for reordering
 * ─────────────────────────────────────────────────────────────── */

import { useState, useMemo, useCallback, useEffect } from "react";
import { useCombatStore } from "@/stores/combatStore";
import { useCampaignStore } from "@/stores/campaignStore";
import { useUiStore } from "@/stores/uiStore";
import { STATUS_EFFECTS } from "@/data/statusEffects";
import type { Combatant, StatusEffect, CombatLogEntry } from "@/types/combat";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { CombatantDragSort } from "./CombatantDragSort";
import { CombatLogPanel } from "./CombatLogPanel";
import { EnemyGroupActions } from "./EnemyGroupActions";
import { InitiativeRoller } from "./InitiativeRoller";
import { SessionRecapNotes } from "./SessionRecapNotes";

export function InitiativeTracker() {
  const activeEncounter = useCombatStore((s) => s.activeEncounter);
  const combatLog = useCombatStore((s) => s.combatLog);
  const createEncounter = useCombatStore((s) => s.createEncounter);
  const startEncounter = useCombatStore((s) => s.startEncounter);
  const endEncounter = useCombatStore((s) => s.endEncounter);
  const nextTurn = useCombatStore((s) => s.nextTurn);
  const previousTurn = useCombatStore((s) => s.previousTurn);
  const togglePause = useCombatStore((s) => s.togglePause);
  const resetCombat = useCombatStore((s) => s.resetCombat);
  const addCombatant = useCombatStore((s) => s.addCombatant);
  const reorderCombatants = useCombatStore((s) => s.reorderCombatants);
  const showToast = useUiStore((s) => s.showToast);

  const [encounterName, setEncounterName] = useState("");
  const [showPlayerImport, setShowPlayerImport] = useState(false);
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualInit, setManualInit] = useState("10");
  const [manualHp, setManualHp] = useState("20");
  const [manualAc, setManualAc] = useState("12");
  const [manualType, setManualType] = useState<Combatant["type"]>("enemy");
  const [showRecapPanel, setShowRecapPanel] = useState(false);

  const characters = useCampaignStore((s) => s.campaign?.playerCharacters ?? []);

  const handleCreate = useCallback(() => {
    if (!encounterName.trim()) return;
    createEncounter(encounterName.trim());
    setEncounterName("");
    showToast({ message: `Encounter "${encounterName.trim()}" ready!`, type: "success" });
  }, [encounterName, createEncounter, showToast]);

  const importPlayers = () => {
    if (!activeEncounter) return;
    let imported = 0;
    for (const pc of characters) {
      const exists = activeEncounter.combatants.some(
        (c) => c.name.toLowerCase() === pc.name.toLowerCase() && c.type === "player"
      );
      if (exists) continue;
      addCombatant({
        name: pc.name,
        type: "player",
        initiative: pc.initiative,
        initiativeBonus: Math.floor((pc.abilityScores.dexterity - 10) / 2),
        armorClass: pc.armorClass,
        hitPoints: { current: pc.hitPoints.current, max: pc.hitPoints.max, temporary: 0 },
        maxHitPoints: pc.hitPoints.max,
        temporaryHitPoints: 0,
        isDead: false,
        isConcentrating: false,
        statusEffects: [],
        notes: "",
      });
      imported++;
    }
    if (imported > 0) {
      showToast({ message: `Imported ${imported} player character${imported > 1 ? "s" : ""}.`, type: "success" });
    }
    setShowPlayerImport(false);
  };

  const handleManualAdd = () => {
    if (!activeEncounter || !manualName.trim()) return;
    const init = parseInt(manualInit) || 10;
    const hp = parseInt(manualHp) || 20;
    const ac = parseInt(manualAc) || 12;
    addCombatant({
      name: manualName.trim(),
      type: manualType,
      initiative: init,
      initiativeBonus: 0,
      armorClass: ac,
      hitPoints: { current: hp, max: hp, temporary: 0 },
      maxHitPoints: hp,
      temporaryHitPoints: 0,
      isDead: false,
      isConcentrating: false,
      statusEffects: [],
      notes: "",
    });
    setManualName("");
    setShowManualAdd(false);
    showToast({ message: `"${manualName.trim()}" added.`, type: "success" });
  };

  /* ── Empty State ── */
  if (!activeEncounter) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-surface-700 bg-surface-850 py-16">
        <span className="mb-3 text-5xl">⚔️</span>
        <h3 className="mb-2 text-lg font-bold text-surface-100">Initiative Tracker</h3>
        <p className="mb-6 text-sm text-surface-500">Create an encounter to start tracking combat turns</p>
        <div className="flex w-full max-w-sm gap-2">
          <input type="text" value={encounterName} onChange={(e) => setEncounterName(e.target.value)}
            placeholder="Encounter name..." className="flex-1 rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none"
            onKeyDown={(e) => e.key === "Enter" && handleCreate()} />
          <Button size="sm" onClick={handleCreate} disabled={!encounterName.trim()}>Create</Button>
        </div>
      </div>
    );
  }

  const isActive = activeEncounter.phase === "active";
  const isPrep = activeEncounter.phase === "prep";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-surface-700 bg-surface-850 p-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-warrior-500/10 text-lg">⚔️</span>
          <div>
            <h3 className="font-bold text-surface-100">{activeEncounter.name}</h3>
            <p className="text-xs text-surface-500">
              {isActive
                ? `Round ${activeEncounter.round} · ${activeEncounter.combatants.length} combatants${activeEncounter.isPaused ? " · ⏸ PAUSED" : ""}`
                : activeEncounter.phase === "completed"
                  ? `Ended after ${activeEncounter.round} rounds`
                  : `${activeEncounter.combatants.length} combatants — ready to start`}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isActive && (
            <>
              <div className="rounded-md bg-warrior-500/15 px-3 py-1.5 text-center">
                <p className="text-xs text-surface-500">Round</p>
                <p className="text-lg font-bold text-warrior-400">{activeEncounter.round}</p>
              </div>
              <TurnTimer isPaused={activeEncounter.isPaused} />
            </>
          )}
          {isPrep && (
            <>
              <InitiativeRoller />
              <Button size="xs" variant="ghost" onClick={() => setShowPlayerImport(true)}>
                📥 Import PCs
              </Button>
              <Button size="xs" variant="ghost" onClick={() => setShowManualAdd(true)}>
                + Add Combatant
              </Button>
              <Button
                size="sm"
                onClick={startEncounter}
                disabled={activeEncounter.combatants.length === 0}
              >
                ▶ Start
              </Button>
            </>
          )}
          {isActive && (
            <>
              <Button variant="secondary" size="sm" onClick={previousTurn}>◀</Button>
              <Button variant={activeEncounter.isPaused ? "primary" : "secondary"} size="sm" onClick={togglePause}>
                {activeEncounter.isPaused ? "▶" : "⏸"}
              </Button>
              <Button size="sm" onClick={nextTurn}>Next ▶</Button>
              <Button variant="danger" size="sm" onClick={endEncounter}>■ End</Button>
            </>
          )}
          {activeEncounter.phase === "completed" && (
            <Button variant="secondary" size="sm" onClick={resetCombat}>↺ New Combat</Button>
          )}
          {/* Combat log toggle */}
          <CombatLogPanel />
          {/* Recap toggle */}
          <button
            onClick={() => setShowRecapPanel((p) => !p)}
            className="rounded-lg border border-surface-700 bg-surface-850 px-3 py-2 text-xs font-medium text-surface-300 hover:bg-surface-800 hover:text-surface-100 transition-colors"
          >
            <span>📝</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Combatant List + Session Notes */}
      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <CombatantList
            combatants={activeEncounter.combatants}
            currentIndex={activeEncounter.currentCombatantIndex}
            isActive={isActive}
            reorderCombatants={reorderCombatants}
          />
          {isPrep && activeEncounter.combatants.filter((c) => c.type === "enemy").length > 1 && (
            <EnemyGroupActions />
          )}
        </div>
        <div className="space-y-4">
          {showRecapPanel && <SessionRecapNotes />}
          {isActive && (
            <div className="rounded-xl border border-accent-500/20 bg-accent-500/5 p-4 text-center">
              <p className="text-xs text-accent-400 font-medium">
                {activeEncounter.isPaused ? "⏸ Combat Paused" : `▶ ${activeEncounter.combatants[activeEncounter.currentCombatantIndex]?.name ?? "—"}'s Turn`}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Player Import Modal */}
      {showPlayerImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowPlayerImport(false)}>
          <div className="w-full max-w-sm rounded-xl border border-surface-700 bg-surface-850 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-surface-100 mb-2">Import Player Characters</h3>
            <p className="text-sm text-surface-400 mb-4">Add all campaign player characters to the initiative order.</p>
            <div className="space-y-2 mb-4">
              {characters.map((pc) => {
                const exists = activeEncounter.combatants.some((c) => c.name.toLowerCase() === pc.name.toLowerCase());
                return (
                  <div key={pc.id} className={`flex items-center justify-between rounded-lg px-3 py-2 ${exists ? "bg-surface-800 opacity-50" : "bg-surface-800"}`}>
                    <span className="text-sm text-surface-200">{pc.name}</span>
                    <Badge variant={exists ? "neutral" : "success"} size="xs">{exists ? "Added" : "Ready"}</Badge>
                  </div>
                );
              })}
              {characters.length === 0 && <p className="text-sm text-surface-500">No player characters in campaign.</p>}
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" size="sm" onClick={() => setShowPlayerImport(false)}>Cancel</Button>
              <Button size="sm" onClick={importPlayers} disabled={characters.length === 0}>Import All</Button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Add Modal */}
      {showManualAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowManualAdd(false)}>
          <div className="w-full max-w-sm rounded-xl border border-surface-700 bg-surface-850 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-surface-100 mb-4">Add Combatant</h3>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-surface-400">Name</label>
                <input value={manualName} onChange={(e) => setManualName(e.target.value)} placeholder="e.g. Goblin Archer" className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="mb-1 block text-xs text-surface-400">Init</label>
                  <input type="number" value={manualInit} onChange={(e) => setManualInit(e.target.value)} className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 text-center focus:border-accent-500 focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-surface-400">HP</label>
                  <input type="number" value={manualHp} onChange={(e) => setManualHp(e.target.value)} className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 text-center focus:border-accent-500 focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-surface-400">AC</label>
                  <input type="number" value={manualAc} onChange={(e) => setManualAc(e.target.value)} className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 text-center focus:border-accent-500 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs text-surface-400">Type</label>
                <select value={manualType} onChange={(e) => setManualType(e.target.value as Combatant["type"])}
                  className="w-full rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 focus:border-accent-500 focus:outline-none">
                  <option value="enemy">Enemy</option>
                  <option value="ally">Ally</option>
                  <option value="npc">NPC</option>
                  <option value="player">Player</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <Button variant="ghost" size="sm" onClick={() => setShowManualAdd(false)}>Cancel</Button>
              <Button size="sm" onClick={handleManualAdd} disabled={!manualName.trim()}>Add</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Turn Timer ─────────────────────────────────────────────── */
function TurnTimer({ isPaused }: { isPaused: boolean }) {
  const [elapsed, setElapsed] = useState(0);
  const activeEncounter = useCombatStore((s) => s.activeEncounter);

  useEffect(() => {
    if (!activeEncounter || activeEncounter.phase !== "active" || isPaused) return;
    const interval = setInterval(() => {
      if (activeEncounter.startedAt) {
        setElapsed(Math.floor((Date.now() - activeEncounter.startedAt) / 1000));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [activeEncounter, isPaused]);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;

  return (
    <div className="rounded-md bg-surface-800 px-2.5 py-1.5 text-center min-w-[60px]">
      <p className="text-[10px] text-surface-500 uppercase tracking-wider">Timer</p>
      <p className="text-sm font-mono font-bold text-surface-200">
        {minutes}:{seconds.toString().padStart(2, "0")}
      </p>
    </div>
  );
}

/* ── Combatant List (with drag-and-drop) ────────────────────── */
function CombatantList({
  combatants,
  currentIndex,
  isActive,
  reorderCombatants,
}: {
  combatants: Combatant[];
  currentIndex: number;
  isActive: boolean;
  reorderCombatants: (ids: string[]) => void;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-surface-400">Turn Order</h4>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-surface-500">Drag to reorder · ↑↓ keys</span>
          <span className="text-xs text-surface-500">{combatants.length} combatant{combatants.length !== 1 ? "s" : ""}</span>
        </div>
      </div>
      {combatants.length === 0 ? (
        <div className="flex items-center justify-center rounded-lg border border-dashed border-surface-700 bg-surface-850 py-8">
          <p className="text-sm text-surface-500">No combatants added yet. Import PCs or add enemies.</p>
        </div>
      ) : (
        <CombatantDragSort reorderCombatants={reorderCombatants} className="space-y-1.5">
          {combatants.map((combatant, index) => {
            const isCurrentTurn = isActive && index === currentIndex;
            const isDone = isActive && index < currentIndex;
            const isDead = combatant.isDead;
            const isExpanded = expandedId === combatant.id;

            return (
              <div key={combatant.id}
                className={`group relative rounded-xl border-2 transition-all ${
                  isCurrentTurn
                    ? "border-accent-500 bg-accent-500/5 shadow-lg shadow-accent-500/10"
                    : isDone
                      ? "border-surface-700/50 bg-surface-850 opacity-60"
                      : isDead
                        ? "border-warrior-900/50 bg-surface-850"
                        : "border-surface-700 bg-surface-850 hover:border-surface-600"
                }`}
              >
                <div className="flex items-center gap-3 px-4 py-3">
                  {/* Initiative / Turn indicator */}
                  <div className="flex w-7 items-center justify-center">
                    {isCurrentTurn ? (
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-500 text-xs font-bold text-white">▶</span>
                    ) : (
                      <span className="text-xs font-bold text-surface-500">
                        {combatant.initiative > 0 ? `+${combatant.initiative}` : combatant.initiative}
                      </span>
                    )}
                  </div>
                  {/* Type icon */}
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
                    combatant.type === "player"
                      ? "bg-rogue-500/15 text-rogue-400"
                      : combatant.type === "ally"
                        ? "bg-divine-500/15 text-divine-400"
                        : "bg-warrior-500/15 text-warrior-400"
                  }`}>
                    {combatant.type === "player" ? "⚔" : combatant.type === "ally" ? "🛡" : "👹"}
                  </div>
                  {/* Name + Stats */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className={`truncate text-sm font-semibold ${isDead ? "text-warrior-400 line-through" : "text-surface-100"}`}>
                        {combatant.name}
                      </p>
                      {combatant.isConcentrating && (
                        <span className="shrink-0 rounded bg-mage-500/20 px-1.5 py-0.5 text-[10px] font-medium text-mage-400">🧘 Conc</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-[11px] text-surface-500">AC {combatant.armorClass}</p>
                      <p className={`text-[11px] font-medium ${
                        combatant.hitPoints.current <= 0
                          ? "text-warrior-400"
                          : combatant.hitPoints.current <= combatant.hitPoints.max * 0.25
                            ? "text-warrior-500"
                            : "text-surface-400"
                      }`}>
                        {combatant.hitPoints.current}/{combatant.hitPoints.max}
                        {combatant.hitPoints.temporary > 0 && (
                          <span className="ml-1 text-divine-400">(+{combatant.hitPoints.temporary}tmp)</span>
                        )}
                      </p>
                    </div>
                  </div>
                  {/* Status Effect Badges */}
                  <div className="flex shrink-0 gap-1">
                    {combatant.statusEffects.slice(0, 3).map((s) => {
                      const def = STATUS_EFFECTS[s.effect as keyof typeof STATUS_EFFECTS];
                      return (
                        <span
                          key={s.id}
                          className="rounded px-1.5 py-0.5 text-[11px]"
                          style={{ backgroundColor: `${def?.color}15`, color: def?.color ?? "inherit" }}
                          title={def?.description}
                        >
                          {def?.icon ?? "✦"} {def?.label ?? s.effect}
                        </span>
                      );
                    })}
                    {combatant.statusEffects.length > 3 && (
                      <span className="rounded bg-surface-700 px-1.5 py-0.5 text-[11px] text-surface-400">
                        +{combatant.statusEffects.length - 3}
                      </span>
                    )}
                  </div>
                  {/* Expand toggle */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : combatant.id)}
                    className="rounded p-1 text-surface-500 transition-colors hover:bg-surface-700 hover:text-surface-200"
                  >
                    <span className={`text-xs transition-transform ${isExpanded ? "rotate-180" : ""}`}>▼</span>
                  </button>
                </div>
                {isExpanded && <CombatantActions combatant={combatant} />}
              </div>
            );
          })}
        </CombatantDragSort>
      )}
    </div>
  );
}

/* ── Combatant Actions ───────────────────────────────────────── */
function CombatantActions({ combatant }: { combatant: Combatant }) {
  const damageCombatant = useCombatStore((s) => s.damageCombatant);
  const healCombatant = useCombatStore((s) => s.healCombatant);
  const setTempHp = useCombatStore((s) => s.setTempHp);
  const toggleStatus = useCombatStore((s) => s.toggleStatus);
  const toggleConcentration = useCombatStore((s) => s.toggleConcentration);
  const toggleDead = useCombatStore((s) => s.toggleDead);
  const removeCombatant = useCombatStore((s) => s.removeCombatant);
  const showToast = useUiStore((s) => s.showToast);
  const [hpInput, setHpInput] = useState("");

  const handleDamage = () => {
    const val = parseInt(hpInput);
    if (!isNaN(val) && val > 0) { damageCombatant(combatant.id, val, "DM"); setHpInput(""); }
  };
  const handleHeal = () => {
    const val = parseInt(hpInput);
    if (!isNaN(val) && val > 0) { healCombatant(combatant.id, val, "DM"); setHpInput(""); }
  };
  const quickDamage = (amount: number) => damageCombatant(combatant.id, amount, "DM");
  const quickHeal = (amount: number) => healCombatant(combatant.id, amount, "DM");

  return (
    <div className="border-t border-surface-700/50 px-4 py-3 space-y-3">
      {/* HP Controls */}
      <div>
        <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-surface-500">Hit Points</p>
        <div className="flex gap-1.5 flex-wrap">
          <Button variant="danger" size="xs" onClick={() => quickDamage(1)}>-1</Button>
          <Button variant="danger" size="xs" onClick={() => quickDamage(5)}>-5</Button>
          <Button variant="danger" size="xs" onClick={() => quickDamage(10)}>-10</Button>
          <div className="flex flex-1 gap-1 min-w-[120px]">
            <input type="number" value={hpInput} onChange={(e) => setHpInput(e.target.value)} placeholder="HP"
              className="w-full max-w-[80px] rounded-md border border-surface-700 bg-surface-800 px-2 py-1 text-center text-xs text-surface-100 focus:border-accent-500 focus:outline-none"
              onKeyDown={(e) => e.key === "Enter" && (e.shiftKey ? handleHeal() : handleDamage())} />
            <Button size="xs" onClick={handleDamage} title="Damage (Enter)">−</Button>
            <Button size="xs" variant="secondary" onClick={handleHeal} title="Heal (Shift+Enter)">+</Button>
          </div>
          <Button variant="secondary" size="xs" onClick={() => quickHeal(5)}>+5</Button>
          <Button variant="secondary" size="xs" onClick={() => quickHeal(10)}>+10</Button>
        </div>
        <div className="mt-1.5 flex items-center gap-2 flex-wrap">
          <span className="text-[11px] text-surface-500">Temp HP:</span>
          <input type="number" defaultValue={combatant.hitPoints.temporary || ""} placeholder="0"
            className="w-16 rounded-md border border-surface-700 bg-surface-800 px-2 py-1 text-center text-xs text-surface-100 focus:border-divine-500 focus:outline-none"
            onBlur={(e) => { const val = parseInt(e.target.value); setTempHp(combatant.id, isNaN(val) ? 0 : Math.max(0, val)); }}
            onKeyDown={(e) => { if (e.key === "Enter") { const val = parseInt((e.target as HTMLInputElement).value); setTempHp(combatant.id, isNaN(val) ? 0 : Math.max(0, val)); }}} />
          <span className="text-[11px] text-surface-500">· Max HP: {combatant.hitPoints.max}</span>
        </div>
      </div>
      {/* Status Effects */}
      <div>
        <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-surface-500">Status Effects</p>
        <div className="flex flex-wrap gap-1">
          {Object.entries(STATUS_EFFECTS).map(([key, def]) => {
            const isActive = combatant.statusEffects.some((s) => s.effect === key);
            return (
              <button key={key} onClick={() => toggleStatus(combatant.id, key as StatusEffect)}
                className={`rounded-md border px-2 py-1 text-[11px] font-medium transition-all ${
                  isActive
                    ? "border-accent-500 bg-accent-500/15 text-accent-300"
                    : "border-surface-700 bg-surface-800 text-surface-400 hover:border-surface-600 hover:text-surface-200"
                }`}
                title={def.description}>
                {def.icon} {def.label}
              </button>
            );
          })}
        </div>
      </div>
      {/* Toggles + Remove */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <label className="flex cursor-pointer items-center gap-2">
            <input type="checkbox" checked={combatant.isConcentrating} onChange={() => toggleConcentration(combatant.id)}
              className="h-4 w-4 rounded border-surface-600 bg-surface-800 accent-mage-500" />
            <span className="text-xs text-surface-300">🧘 Concentrating</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <input type="checkbox" checked={combatant.isDead} onChange={() => toggleDead(combatant.id)}
              className="h-4 w-4 rounded border-surface-600 bg-surface-800 accent-warrior-500" />
            <span className="text-xs text-surface-300">💀 Dead</span>
          </label>
        </div>
        <button
          onClick={() => { removeCombatant(combatant.id); showToast({ message: `"${combatant.name}" removed.`, type: "info" }); }}
          className="text-[11px] text-surface-500 hover:text-warrior-400 transition-colors"
        >
          Remove
        </button>
      </div>
    </div>
  );
}
