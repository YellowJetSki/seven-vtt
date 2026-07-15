/* ── Quick-Add from Encounters ──────────────────────────────────
 * A dropdown panel in the Initiative Tracker's prep phase that
 * lets the DM quickly add all enemies from any saved encounter
 * into the current combat, preserving stats.
 *
 * ── Usage ─────────────────────────────────────────────────────
 * <QuickAddFromEncounters onAddCombatant={(c) => addCombatant(c)} />
 * ─────────────────────────────────────────────────────────────── */

import { useState, useMemo } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import { useCombatStore } from "@/stores/combatStore";
import { useUiStore } from "@/stores/uiStore";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import type { Encounter, EncounterEnemy } from "@/types";
import type { Combatant } from "@/types/combat";

// Static monster reference for quick lookup
// In production, this would come from a monster compendium
const MONSTER_STATS: Record<string, { hp: number; ac: number; initBonus: number }> = {
  bandit: { hp: 11, ac: 12, initBonus: 1 },
  bandit_captain: { hp: 65, ac: 15, initBonus: 2 },
  skeleton: { hp: 13, ac: 13, initBonus: 2 },
  zombie: { hp: 22, ac: 8, initBonus: -1 },
  wight: { hp: 67, ac: 14, initBonus: 2 },
  mud_mephit: { hp: 27, ac: 11, initBonus: 2 },
  earth_elemental: { hp: 126, ac: 17, initBonus: -1 },
  goblin: { hp: 7, ac: 15, initBonus: 2 },
  hobgoblin: { hp: 11, ac: 18, initBonus: 2 },
  wolf: { hp: 11, ac: 13, initBonus: 2 },
  cultist: { hp: 9, ac: 12, initBonus: 1 },
  gnoll: { hp: 22, ac: 15, initBonus: 0 },
  ogre: { hp: 59, ac: 11, initBonus: -1 },
  harpy: { hp: 38, ac: 11, initBonus: 2 },
};

function monsterDisplayName(key: string): string {
  return key
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

interface QuickAddProps {
  onAddCombatant: (data: Omit<Combatant, "id">) => string;
}

export function QuickAddFromEncounters({ onAddCombatant }: QuickAddProps) {
  const encounters = useCampaignStore((s) => s.campaign?.encounters ?? []);
  const activeEncounter = useCombatStore((s) => s.activeEncounter);
  const showToast = useUiStore((s) => s.showToast);
  const [isOpen, setIsOpen] = useState(false);

  const handleAddEncounter = (encounter: Encounter) => {
    if (!activeEncounter) return;

    let added = 0;
    for (const ee of encounter.enemies) {
      const stats = MONSTER_STATS[ee.enemyId];
      const hp = ee.customHp ?? stats?.hp ?? 20;
      const ac = stats?.ac ?? 12;
      const initBonus = stats?.initBonus ?? 0;

      for (let i = 0; i < ee.count; i++) {
        const init = Math.max(1, initBonus + Math.floor(Math.random() * 20) + 1);
        onAddCombatant({
          name: `${monsterDisplayName(ee.enemyId)} ${i + 1}`,
          type: "enemy",
          initiative: init,
          initiativeBonus,
          armorClass: ac,
          hitPoints: { current: hp, max: hp, temporary: 0 },
          maxHitPoints: hp,
          temporaryHitPoints: 0,
          isDead: false,
          isConcentrating: false,
          statusEffects: [],
          notes: "",
        });
        added++;
      }
    }

    if (added > 0) {
      showToast({
        message: `Added ${added} enemies from "${encounter.name}".`,
        type: "success",
      });
    }
    setIsOpen(false);
  };

  if (encounters.length === 0) return null;

  return (
    <div className="relative">
      <Button size="xs" variant="secondary" onClick={() => setIsOpen((o) => !o)}>
        📋 Quick-Add Encounter
      </Button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 top-full z-50 mt-1 w-72 rounded-xl border border-surface-700 bg-surface-850 shadow-xl">
            <div className="border-b border-surface-700 px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-surface-400">
                Saved Encounters
              </p>
            </div>
            <div className="max-h-60 overflow-y-auto p-1.5 space-y-1">
              {encounters.map((enc) => (
                <button
                  key={enc.id}
                  onClick={() => handleAddEncounter(enc)}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-surface-200 hover:bg-surface-800 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{enc.name}</p>
                    <p className="text-[10px] text-surface-500">
                      {enc.enemies.reduce((s, e) => s + e.count, 0)} enemies
                      {enc.difficulty ? ` · ${enc.difficulty}` : ""}
                    </p>
                  </div>
                  <Badge variant="neutral" size="xs">
                    Add
                  </Badge>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
