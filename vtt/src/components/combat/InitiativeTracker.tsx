/* ── Initiative Tracker ─────────────────────────────────────────
 * Premium combat management orchestrator.
 * Delegates to focused sub-components for each concern.
 * ─────────────────────────────────────────────────────────────── */

import { useState, useEffect, useCallback } from "react";
import { useCombatStore } from "@/stores/combatStore";
import { useCampaignStore } from "@/stores/campaignStore";
import { useUiStore } from "@/stores/uiStore";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyEncounterState } from "./EmptyEncounterState";
import { CombatantList } from "./CombatantList";
import { PlayerImportModal } from "./PlayerImportModal";
import { CombatLogPanel } from "./CombatLogPanel";
import { EnemyGroupActions } from "./EnemyGroupActions";
import { InitiativeRoller } from "./InitiativeRoller";
import { SessionRecapNotes } from "./SessionRecapNotes";
import { CombatantTurnTimer } from "./CombatantTurnTimer";

export function InitiativeTracker() {
  const activeEncounter = useCombatStore((s) => s.activeEncounter);
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
  const characters = useCampaignStore((s) => s.characters);

  const [showPlayerImport, setShowPlayerImport] = useState(false);
  const [showLogPanel, setShowLogPanel] = useState(false);
  const [showRecapPanel, setShowRecapPanel] = useState(false);

  /* ── Keyboard Shortcuts ── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (!activeEncounter) return;
      if (e.key === " " && !e.repeat) { e.preventDefault(); nextTurn(); }
      if (e.key === "S" && !e.shiftKey && !e.ctrlKey && activeEncounter.phase === "prep") {
        startEncounter();
        showToast({ message: "Encounter started!", type: "success" });
      }
      if (e.key === "P" && activeEncounter.phase === "active") togglePause();
      if (e.key === "E" && activeEncounter.phase === "active") {
        endEncounter();
        showToast({ message: "Encounter ended.", type: "info" });
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activeEncounter, nextTurn, startEncounter, endEncounter, togglePause, showToast]);

  /* ── Empty State ── */
  if (!activeEncounter) {
    return (
      <EmptyEncounterState
        onCreate={createEncounter}
        onAddEnemyGroup={addEnemyGroup}
      />
    );
  }

  const isPrep = activeEncounter.phase === "prep";
  const isActive = activeEncounter.phase === "active";
  const currentCombatant = activeEncounter.combatants[activeEncounter.currentCombatantIndex];

  const handleAddCharacter = useCallback(
    (pcId: string) => {
      const pc = characters.find((c) => c.id === pcId);
      if (!pc) return;
      addCombatant({
        name: pc.name,
        type: "player",
        initiative: 0,
        armorClass: pc.armorClass,
        hitPoints: { current: pc.hitPoints.current, max: pc.hitPoints.max, temporary: 0 },
        statusEffects: [],
        isDead: false,
        isConcentrating: false,
        notes: "",
      });
      showToast({ message: `"${pc.name}" added to initiative.`, type: "success" });
    },
    [characters, addCombatant, showToast],
  );

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
          {/* Turn Timer */}
          {isActive && currentCombatant && (
            <div className="flex items-center gap-1.5 rounded-md bg-surface-800 px-2.5 py-1.5">
              <span className="text-[10px] text-surface-500">⏱</span>
              <CombatantTurnTimer turnStartedAt={activeEncounter.turnStartedAt ?? null} isPaused={activeEncounter.isPaused} compact />
            </div>
          )}

          {/* Turn Controls */}
          <div className="flex items-center gap-1">
            {isActive && (
              <>
                <Button size="xs" variant="ghost" onClick={previousTurn}>◀</Button>
                <Button size="xs" variant="secondary" onClick={nextTurn}>▶</Button>
                <Button size="xs" variant={activeEncounter.isPaused ? "secondary" : "danger"} onClick={togglePause}>
                  {activeEncounter.isPaused ? "▶" : "⏸"}
                </Button>
              </>
            )}
          </div>

          <div className="flex items-center gap-1">
            <Button size="xs" variant="ghost" onClick={() => setShowLogPanel(!showLogPanel)}>📜 Log</Button>
            <Button size="xs" variant="ghost" onClick={() => setShowRecapPanel(!showRecapPanel)}>📝 Notes</Button>
            <Button size="xs" variant="ghost" onClick={() => setShowPlayerImport(true)}>👤 Import PC</Button>
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

          {isPrep && <InitiativeRoller />}
        </div>
      </div>

      {/* Quick-Add Enemy Groups */}
      {isPrep && (
        <div className="flex flex-wrap gap-1.5 rounded-lg border border-surface-700 bg-surface-850 p-2">
          <span className="mr-1 text-xs text-surface-500 py-1">Quick Add:</span>
          <Button size="xs" variant="ghost" onClick={() => addEnemyGroup("Goblin", 4)}>🐺 Goblin x4</Button>
          <Button size="xs" variant="ghost" onClick={() => addEnemyGroup("Skeleton", 3)}>💀 Skeleton x3</Button>
          <Button size="xs" variant="ghost" onClick={() => addEnemyGroup("Bandit", 5)}>🗡️ Bandit x5</Button>
          <Button size="xs" variant="ghost" onClick={() => addEnemyGroup("Cultist", 2)}>🔮 Cultist x2</Button>
          <Button size="xs" variant="ghost" onClick={() => addEnemyGroup("Wolf", 6)}>🐺 Wolf x6</Button>
          <Button size="xs" variant="ghost" onClick={() => addEnemyGroup("Kobold", 8)}>🦎 Kobold x8</Button>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <CombatantList
            combatants={activeEncounter.combatants}
            currentIndex={activeEncounter.currentCombatantIndex}
            isActive={isActive}
            isPaused={activeEncounter.isPaused}
            turnStartedAt={activeEncounter.turnStartedAt ?? null}
            reorderCombatants={(ids) => {
              ids.forEach((id, idx) => setCombatantInitiative(id, activeEncounter.combatants.length - idx));
            }}
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
                  <CombatantTurnTimer turnStartedAt={activeEncounter.turnStartedAt ?? null} isPaused={activeEncounter.isPaused} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Panels */}
      {showLogPanel && <CombatLogPanel />}

      {/* Player Import Modal */}
      {showPlayerImport && (
        <PlayerImportModal
          characters={characters}
          activeEncounter={activeEncounter}
          onImport={handleAddCharacter}
          onClose={() => setShowPlayerImport(false)}
        />
      )}
    </div>
  );
}
