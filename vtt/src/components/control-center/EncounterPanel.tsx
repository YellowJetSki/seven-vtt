/**
 * STᚱ VTT — Encounter Panel
 *
 * Allows the DM to create new encounters, load existing ones,
 * and populate the battle map with tokens from an encounter.
 * Integrates with combatStore for initiative tracking.
 */

import { useState, useCallback } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import { useCombatStore } from "@/stores/combatStore";
import Button from "@/components/ui/Button";
import type { Encounter, MapToken } from "@/types";

interface EncounterPanelProps {
  mapId: string;
  onTokensAdded?: (tokens: MapToken[]) => void;
}

export default function EncounterPanel({ mapId, onTokensAdded }: EncounterPanelProps) {
  const encounters = useCampaignStore((s) => s.encounters);
  const enemies = useCampaignStore((s) => s.enemies);
  const addMapToken = useCampaignStore((s) => s.addMapToken);
  const createEncounter = useCombatStore((s) => s.createEncounter);

  const [selectedEncounterId, setSelectedEncounterId] = useState<string | null>(null);
  const [isPlacing, setIsPlacing] = useState(false);
  const [placementMode, setPlacementMode] = useState<"auto" | "manual">("auto");

  const selectedEncounter = encounters.find((e) => e.id === selectedEncounterId);

  const handlePopulateMap = useCallback(() => {
    if (!selectedEncounter) return;

    setIsPlacing(true);
    const newTokens: MapToken[] = [];
    const combatants: { name: string; initiative: number; hp: { current: number; max: number }; ac: number }[] = [];

    // Calculate grid placement — spread tokens across the map
    const cols = Math.ceil(Math.sqrt(selectedEncounter.enemyGroups.length + 1));
    const startX = 5;
    const startY = 5;

    selectedEncounter.enemyGroups.forEach((group, idx) => {
      const enemy = enemies.find((e) => e.id === group.enemyId);
      if (!enemy) return;

      const col = idx % cols;
      const row = Math.floor(idx / cols);

      const token: MapToken = {
        id: `token_${Date.now()}_${idx}`,
        type: "enemy",
        label: group.label || enemy.name,
        x: startX + col * 3,
        y: startY + row * 3,
        color: "#ef4444",
        size: 1,
        visible: true,
        icon: "👹",
        hp: { current: enemy.hitPoints.current, max: enemy.hitPoints.max },
        speed: enemy.speed || 30,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      addMapToken(mapId, token);
      newTokens.push(token);

      // Add to combatants list
      for (let i = 0; i < (group.count || 1); i++) {
        combatants.push({
          name: group.label ? `${group.label} ${i + 1}` : `${enemy.name} ${i + 1}`,
          initiative: Math.floor(Math.random() * 20) + 1,
          hp: { current: enemy.hitPoints.current, max: enemy.hitPoints.max },
          ac: enemy.armorClass,
        });
      }
    });

    // Create combat encounter
    if (combatants.length > 0) {
      const encId = createEncounter(selectedEncounter.name || "Combat Encounter");
      combatants.forEach((c) => {
        useCombatStore.getState().addCombatant({
          id: `combatant_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          name: c.name,
          type: "enemy",
          initiative: c.initiative,
          armorClass: c.ac,
          hitPoints: { current: c.hp.current, max: c.hp.max, temporary: 0 },
          statusEffects: [],
          isDead: false,
          isConcentrating: false,
          notes: "",
        });
      });
    }

    onTokensAdded?.(newTokens);
    setIsPlacing(false);
  }, [selectedEncounter, enemies, mapId, addMapToken, createEncounter, onTokensAdded]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-surface-700/20 shrink-0">
        <span className="text-sm font-bold text-gradient-arcane">Encounters</span>
        <span className="text-[10px] text-surface-500">{encounters.length} saved</span>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-2">
        {encounters.length === 0 && (
          <div className="text-center py-6">
            <p className="text-surface-500 text-xs">No encounters saved</p>
            <p className="text-surface-600 text-[10px] mt-1">Create one from the Encounters page</p>
          </div>
        )}

        {encounters.map((enc) => (
          <div
            key={enc.id}
            onClick={() => setSelectedEncounterId(enc.id)}
            className={`p-2.5 rounded-lg cursor-pointer transition-all duration-150 border ${
              selectedEncounterId === enc.id
                ? "bg-accent-600/15 border-accent-500/30"
                : "bg-surface-800/30 border-surface-700/20 hover:bg-surface-700/40"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-surface-200">{enc.name}</span>
              <span className="text-[10px] text-surface-500">
                {enc.enemyGroups.reduce((sum, g) => sum + (g.count || 1), 0)} units
              </span>
            </div>
            <div className="flex gap-1 mt-1.5 flex-wrap">
              {enc.enemyGroups.map((g, i) => {
                const enemy = enemies.find((e) => e.id === g.enemyId);
                return (
                  <span
                    key={i}
                    className="text-[9px] bg-surface-700/30 text-surface-400 px-1 py-0.5 rounded"
                  >
                    {g.count || 1}x {enemy?.name || g.label || "Unknown"}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="shrink-0 border-t border-surface-700/20 px-3 py-2.5 space-y-2">
        <Button
          variant="arcane"
          size="sm"
          className="w-full"
          onClick={handlePopulateMap}
          disabled={!selectedEncounter}
          isLoading={isPlacing}
        >
          {isPlacing ? "✦ Placing..." : "✦ Populate Map with Encounter"}
        </Button>
        {!selectedEncounter && (
          <p className="text-[9px] text-surface-500 text-center">Select an encounter above</p>
        )}
      </div>
    </div>
  );
}
