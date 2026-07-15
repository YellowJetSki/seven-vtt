/* ── Initiative Tracker Component ─────────────────────────────
 * Premium combat management with:
 *  • Drag-reorderable turn order (HTML5 DnD)
 *  • One-click damage / heal / temp HP
 *  • Status effect toggles (blinded, poisoned, stunned, etc.)
 *  • Concentration tracking
 *  • Round counter + turn indicator + turn timer overlay
 *  • Per-combatant turn timer (chess clock) for current turn
 *  • Combat log with search, filter, and JSON export
 *  • Quick-add combatants from player roster
 *  • Enemy group actions (bulk damage/heal)
 *  • Initiative management tools (DEX-based assignment, sort)
 *  • Keyboard accessibility for reordering
 * ─────────────────────────────────────────────────────────────── */

import { useState, useEffect } from "react";
import { useCombatStore } from "@/stores/combatStore";
import { useCampaignStore } from "@/stores/campaignStore";
import { useUiStore } from "@/stores/uiStore";
import { STATUS_EFFECTS } from "@/data/statusEffects";
import type { Combatant, StatusEffect } from "@/types/combat";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { CombatantDragSort } from "./CombatantDragSort";
import { CombatLogPanel } from "./CombatLogPanel";
import { EnemyGroupActions } from "./EnemyGroupActions";
import { InitiativeRoller } from "./InitiativeRoller";
import { SessionRecapNotes } from "./SessionRecapNotes";
import { CombatantTurnTimer } from "./CombatantTurnTimer";

export function InitiativeTracker() {
  const activeEncounter = useCombatStore((s) => s.activeEncounter);
  const _combatLog = useCombatStore((s) => s.combatLog);
  const createEncounter = useCombatStore((s) => s.createEncounter);
  const startEncounter = useCombatStore((s) => s.startEncounter);
  const endEncounter = useCombatStore((s) => s.endEncounter);
  const nextTurn = useCombatStore((s) => s.nextTurn);
  const previousTurn = useCombatStore((s) => s.previousTurn);
  const togglePause = useCombatStore((s) => s.togglePause);
  const addCombatant = useCombatStore((s) => s.addCombatant);
  const addEnemyGroup = useCombatStore((s) => s.addEnemyGroup);
  const setCombatantInitiative = useCombatStore((s) => s.setCombatantInitiative);
  const showToast = useUiStore((s) => s.showToast);
  const characters = useCampaignStore((s) => s.campaign?.playerCharacters ?? []);

  const [showPlayerImport, setShowPlayerImport] = useState(false);
  const [showLogPanel, setShowLogPanel] = useState(false);
  const [showRecapPanel, setShowRecapPanel] = useState(false);

  // Keyboard shortcuts for combat
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (!activeEncounter) return;
      if (e.key === " " && !e.repeat) { e.preventDefault(); nextTurn(); }
      if (e.key === "S" && !e.shiftKey && !e.ctrlKey && activeEncounter.phase === "prep") { startEncounter(); showToast({ message: "Encounter started!", type: "success" }); }
      if (e.key === "P" && activeEncounter.phase === "active") { togglePause(); }
      if (e.key === "E" && activeEncounter.phase === "active") { endEncounter(); showToast({ message: "Encounter ended.", type: "info" }); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activeEncounter, nextTurn, startEncounter, endEncounter, togglePause, showToast]);

  // State
  if (!activeEncounter) {
    return <EmptyEncounterState onCreate={createEncounter} onAddEnemyGroup={addEnemyGroup} />;
  }

  const isPrep = activeEncounter.phase === "prep";
  const isActive = activeEncounter.phase === "active";
  const currentCombatant = activeEncounter.combatants[activeEncounter.currentCombatantIndex];
  const reorderCombatants = (ids: string[]) => {
    ids.forEach((id, idx) => setCombatantInitiative(id, activeEncounter.combatants.length - idx));
  };

  const handleAddCharacter = (pcId: string) => {
    const pc = characters.find((c) => c.id === pcId);
    if (!pc) return;
    addCombatant({
      id: `pc_${Date.now()}`,
      name: pc.name,
      type: "player",
      initiative: 0,
      armorClass: pc.armorClass,
      hitPoints: {
        current: pc.hitPoints.current,
        max: pc.hitPoints.max,
        temporary: 0,
      },
      statusEffects: [],
      isDead: false,
      isConcentrating: false,
      notes: "",
    });
    showToast({ message: `"${pc.name}" added to initiative.`, type: "success" });
  };

  return (
    <div className="space-y-4">
      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Badge variant="accent" size="sm">{activeEncounter.name}</Badge>
          {activeEncounter.round > 0 && <Badge variant="neutral" size="sm">Round {activeEncounter.round}</Badge>}
          {isActive && (
            <Badge variant={activeEncounter.isPaused ? "warning" : "success"} size="sm">
              {activeEncounter.isPaused ? "⏸ Paused" : "▶ Active"}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Turn Timer (chess clock) - shows on current turn */}
          {isActive && currentCombatant && (
            <div className="flex items-center gap-1.5 rounded-md bg-surface-800 px-2.5 py-1.5">
              <span className="text-[10px] text-surface-500">⏱</span>
              <CombatantTurnTimer
                turnStartedAt={activeEncounter.turnStartedAt ?? null}
                isPaused={activeEncounter.isPaused}
                compact
              />
            </div>
          )}

          {/* Turn Controls */}
          <div className="flex items-center gap-1">
            {isActive && (
              <>
                <Button size="xs" variant="ghost" onClick={previousTurn} title="Previous Turn (Shift+Space)">◀</Button>
                <Button size="xs" variant="secondary" onClick={nextTurn} title="Next Turn (Space)">▶</Button>
                <Button size="xs" variant={activeEncounter.isPaused ? "success" : "warning"} onClick={togglePause}>
                  {activeEncounter.isPaused ? "▶" : "⏸"}
                </Button>
              </>
            )}
          </div>

          <div className="flex items-center gap-1">
            <Button size="xs" variant="ghost" onClick={() => setShowLogPanel(!showLogPanel)}>
              📜 Log
            </Button>
            <Button size="xs" variant="ghost" onClick={() => setShowRecapPanel(!showRecapPanel)}>
              📝 Notes
            </Button>
            <Button size="xs" variant="ghost" onClick={() => setShowPlayerImport(true)}>
              👤 Import PC
            </Button>
            {isPrep && (
              <Button size="xs" variant="primary" onClick={() => { startEncounter(); showToast({ message: "Encounter started!", type: "success" }); }}>
                ⚔ Start
              </Button>
            )}
            {isActive && (
              <Button size="xs" variant="danger" onClick={() => { endEncounter(); showToast({ message: "Encounter ended.", type: "info" }); }}>
                ✕ End
              </Button>
            )}
          </div>

          {/* Initiative Roller */}
          {isPrep && <InitiativeRoller combatants={activeEncounter.combatants} setCombatantInitiative={setCombatantInitiative} />}
        </div>
      </div>

      {/* Quick-Add: preset enemy groups */}
      {isPrep && (
        <div className="flex flex-wrap gap-1.5 rounded-lg border border-surface-700 bg-surface-850 p-2">
          <span className="mr-1 text-xs text-surface-500 py-1">Quick Add:</span>
          <Button size="xs" variant="ghost" onClick={() => addEnemyGroup("Goblin", 4)}>
            🐺 Goblin x4
          </Button>
          <Button size="xs" variant="ghost" onClick={() => addEnemyGroup("Skeleton", 3)}>
            💀 Skeleton x3
          </Button>
          <Button size="xs" variant="ghost" onClick={() => addEnemyGroup("Bandit", 5)}>
            🗡️ Bandit x5
          </Button>
          <Button size="xs" variant="ghost" onClick={() => addEnemyGroup("Cultist", 2)}>
            🔮 Cultist x2
          </Button>
          <Button size="xs" variant="ghost" onClick={() => addEnemyGroup("Wolf", 6)}>
            🐺 Wolf x6
          </Button>
          <Button size="xs" variant="ghost" onClick={() => addEnemyGroup("Kobold", 8)}>
            🦎 Kobold x8
          </Button>
        </div>
      )}

      {/* Main Grid: Combatant List + Session Notes */}
      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <CombatantList
            combatants={activeEncounter.combatants}
            currentIndex={activeEncounter.currentCombatantIndex}
            isActive={isActive}
            isPaused={activeEncounter.isPaused}
            turnStartedAt={activeEncounter.turnStartedAt ?? null}
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
                {activeEncounter.isPaused ? "⏸ Combat Paused" : `▶ ${currentCombatant?.name ?? "—"}'s Turn`}
              </p>
              {isActive && currentCombatant && (
                <div className="mt-1 flex items-center justify-center gap-1">
                  <span className="text-[10px] text-surface-500">⏱</span>
                  <CombatantTurnTimer
                    turnStartedAt={activeEncounter.turnStartedAt ?? null}
                    isPaused={activeEncounter.isPaused}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Combat Log Panel */}
      {showLogPanel && <CombatLogPanel />}

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
                  <div key={pc.id} className="flex items-center justify-between rounded-lg bg-surface-800 px-3 py-2">
                    <div>
                      <p className="text-sm font-medium text-surface-200">{pc.name}</p>
                      <p className="text-xs text-surface-500">{pc.class} · Lvl {pc.level}</p>
                    </div>
                    {exists ? (
                      <span className="text-xs text-surface-500">✓ Added</span>
                    ) : (
                      <button onClick={() => handleAddCharacter(pc.id)}
                        className="rounded bg-accent-600 px-3 py-1 text-xs font-medium text-white hover:bg-accent-500 transition-colors">
                        Add
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex justify-end">
              <Button size="sm" onClick={() => setShowPlayerImport(false)}>Done</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Empty Encounter State ──────────────────────────────────── */

function EmptyEncounterState({
  onCreate,
  onAddEnemyGroup,
}: {
  onCreate: (name: string) => void;
  onAddEnemyGroup: (name: string, count: number) => void;
}) {
  const characters = useCampaignStore((s) => s.campaign?.playerCharacters ?? []);
  const [customName, setCustomName] = useState("");
  const addCombatant = useCombatStore((s) => s.addCombatant);
  const showToast = useUiStore((s) => s.showToast);

  const handleCreate = () => {
    const name = customName.trim() || `Encounter ${new Date().toLocaleTimeString()}`;
    onCreate(name);
    // Import all PCs automatically
    characters.forEach((pc) => {
      addCombatant({
        id: `pc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        name: pc.name,
        type: "player",
        initiative: 0,
        armorClass: pc.armorClass,
        hitPoints: {
          current: pc.hitPoints.current,
          max: pc.hitPoints.max,
          temporary: 0,
        },
        statusEffects: [],
        isDead: false,
        isConcentrating: false,
        notes: "",
      });
    });
    showToast({ message: `"${name}" created with ${characters.length} player character${characters.length !== 1 ? "s" : ""}.`, type: "success" });
  };

  const handleQuickStart = () => {
    const name = `Quick Encounter ${new Date().toLocaleTimeString()}`;
    onCreate(name);
    onAddEnemyGroup("Bandit", 4);
    characters.forEach((pc) => {
      addCombatant({
        id: `pc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        name: pc.name,
        type: "player",
        initiative: 0,
        armorClass: pc.armorClass,
        hitPoints: {
          current: pc.hitPoints.current,
          max: pc.hitPoints.max,
          temporary: 0,
        },
        statusEffects: [],
        isDead: false,
        isConcentrating: false,
        notes: "",
      });
    });
    showToast({ message: `"${name}" ready with Bandits!`, type: "success" });
  };

  return (
    <div className="rounded-xl border border-dashed border-surface-700 bg-surface-850 p-8 text-center">
      <span className="mb-4 inline-block text-4xl text-surface-600">⚔️</span>
      <h3 className="mb-2 text-lg font-semibold text-surface-100">No Active Encounter</h3>
      <p className="mb-6 text-sm text-surface-400">Create a new encounter to manage initiative, track HP, and run combat.</p>

      <div className="mx-auto max-w-sm space-y-3">
        <div className="flex gap-2">
          <input value={customName} onChange={(e) => setCustomName(e.target.value)}
            placeholder="Encounter name (optional)"
            className="flex-1 rounded-lg border border-surface-700 bg-surface-800 px-3 py-2 text-sm text-surface-100 placeholder:text-surface-500 focus:border-accent-500 focus:outline-none"
            onKeyDown={(e) => e.key === "Enter" && handleCreate()} />
          <Button onClick={handleCreate} disabled={characters.length === 0}>Create</Button>
        </div>
        <Button variant="secondary" onClick={handleQuickStart} className="w-full">
          ⚡ Quick-Start with {characters.length > 0 ? `${characters.length} PCs` : "Demo"} + 4 Bandits
        </Button>
      </div>
    </div>
  );
}

/* ── Combatant List (with drag-and-drop) ────────────────────── */
function CombatantList({
  combatants,
  currentIndex,
  isActive,
  isPaused,
  turnStartedAt,
  reorderCombatants,
}: {
  combatants: Combatant[];
  currentIndex: number;
  isActive: boolean;
  isPaused: boolean;
  turnStartedAt: number | null;
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
                  {/* Per-Combatant Turn Timer (current turn only) */}
                  {isCurrentTurn && (
                    <div className="shrink-0">
                      <CombatantTurnTimer
                        turnStartedAt={turnStartedAt}
                        isPaused={isPaused}
                        compact
                      />
                    </div>
                  )}
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
