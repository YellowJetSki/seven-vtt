/* ── Death Save Tracker ─────────────────────────────────────────
 * Tracks death saving throws for downed player characters.
 * 3 successes = stabilized, 3 failures = dead.
 * Only rendered from PlayerCharacterSheet when HP ≤ 0.
 * ──────────────────────────────────────────────────────────────── */
import { useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { useCampaignStore } from "@/stores/campaignStore";
import type { PlayerCharacter } from "@/types";

export function DeathSaveTracker({ character }: { character: PlayerCharacter }) {
  const updateCharacter = useCampaignStore((s) => s.updateCharacter);

  // Derive state directly from character data each render
  const saves = character.deathSaves ?? { successes: 0, failures: 0, stabilized: false, isDead: false };

  const recordSave = useCallback((type: "success" | "failure") => {
    // Read fresh from store to avoid stale closure
    const char = (useCampaignStore.getState()).characters.find(c => c.id === character.id);
    const prev = char?.deathSaves ?? { successes: 0, failures: 0, stabilized: false, isDead: false };
    const next = { ...prev };
    if (type === "success") {
      next.successes = Math.min(3, prev.successes + 1);
      if (next.successes >= 3) next.stabilized = true;
    } else {
      next.failures = Math.min(3, prev.failures + 1);
      if (next.failures >= 3) next.isDead = true;
    }
    updateCharacter(character.id, { deathSaves: next });
  }, [character.id, updateCharacter]);

  const resetSaves = useCallback(() => {
    const reset = { successes: 0, failures: 0, stabilized: false, isDead: false };
    updateCharacter(character.id, { deathSaves: reset });
  }, [character.id, updateCharacter]);

  const healToStable = useCallback(() => {
    if (character.hitPoints.current <= 0) {
      updateCharacter(character.id, { hitPoints: { ...character.hitPoints, current: 1 } });
    }
    resetSaves();
  }, [character, updateCharacter, resetSaves]);

  return (
    <div className="rounded-xl border border-warrior-500/40 bg-warrior-500/10 p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-bold text-warrior-300">
          {saves.isDead ? "💀 DEAD" : saves.stabilized ? "⚕️ Stabilized" : "🩸 Death Saves"}
        </h4>
        <span className="text-xs text-surface-500">{character.name}</span>
      </div>

      {!saves.stabilized && !saves.isDead && (
        <div className="space-y-3">
          {/* Successes */}
          <div>
            <p className="text-[10px] text-surface-400 mb-1">Successes ({saves.successes}/3)</p>
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={`h-3 w-8 rounded-full transition-colors ${
                    i < saves.successes ? "bg-divine-500" : "bg-surface-700"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Failures */}
          <div>
            <p className="text-[10px] text-surface-400 mb-1">Failures ({saves.failures}/3)</p>
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={`h-3 w-8 rounded-full transition-colors ${
                    i < saves.failures ? "bg-warrior-500" : "bg-surface-700"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Quick action buttons */}
          <div className="flex gap-2 flex-wrap">
            <Button size="xs" variant="ghost" onClick={() => recordSave("success")}>
              ✓ Success
            </Button>
            <Button size="xs" variant="ghost" onClick={() => recordSave("failure")}>
              ✗ Failure
            </Button>
            <Button size="xs" variant="ghost" onClick={resetSaves}>
              ↺ Reset
            </Button>
            <Button size="xs" variant="primary" onClick={healToStable}>
              💊 Heal to 1 HP
            </Button>
          </div>
        </div>
      )}

      {(saves.stabilized || saves.isDead) && (
        <div className="space-y-2">
          <p className="text-xs text-surface-400">
            {saves.stabilized
              ? "Character is stable at 0 HP. A heal will revive them."
              : "Character has died. A revivify or resurrection is needed."}
          </p>
          <div className="flex gap-2">
            <Button size="xs" variant="ghost" onClick={resetSaves}>
              ↺ Clear Saves
            </Button>
            <Button size="xs" variant="primary" onClick={healToStable}>
              💊 Revive to 1 HP
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
