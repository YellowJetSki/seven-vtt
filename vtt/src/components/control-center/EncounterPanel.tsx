/**
 * STᚱ VTT — Encounter Panel
 *
 * Allows the DM to create new encounters, load existing ones,
 * and populate the battle map with tokens from an encounter.
 * Integrates with combatStore for initiative tracking.
 * Composed of EncounterPanelHeader, EncounterCard, EncounterEmptyState,
 * and EncounterPopulateButton sub-components.
 */

import { useState, useCallback } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import { useCombatStore } from "@/stores/combatStore";
import EncounterPanelHeader from "./EncounterPanelHeader";
import EncounterCard from "./EncounterCard";
import EncounterEmptyState from "./EncounterEmptyState";
import EncounterPopulateButton from "./EncounterPopulateButton";
import type { MapToken } from "@/types";

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

  const selectedEncounter = encounters.find((e) => e.id === selectedEncounterId);

  const handlePopulateMap = useCallback(() => {
    if (!selectedEncounter) return;

    setIsPlacing(true);
    const newTokens: MapToken[] = [];
    const combatants: {
      name: string;
      initiative: number;
      hp: { current: number; max: number };
      ac: number;
    }[] = [];

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

      for (let i = 0; i < (group.count || 1); i++) {
        combatants.push({
          name: group.label
            ? `${group.label} ${i + 1}`
            : `${enemy.name} ${i + 1}`,
          initiative: Math.floor(Math.random() * 20) + 1,
          hp: { current: enemy.hitPoints.current, max: enemy.hitPoints.max },
          ac: enemy.armorClass,
        });
      }
    });

    if (combatants.length > 0) {
      const encId = createEncounter(
        selectedEncounter.name || "Combat Encounter"
      );
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
      <EncounterPanelHeader encounterCount={encounters.length} />

      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-2">
        {encounters.length === 0 && <EncounterEmptyState />}

        {encounters.map((enc) => (
          <EncounterCard
            key={enc.id}
            encounter={enc}
            enemies={enemies}
            isSelected={selectedEncounterId === enc.id}
            onSelect={setSelectedEncounterId}
          />
        ))}
      </div>

      <EncounterPopulateButton
        isPlacing={isPlacing}
        hasSelection={!!selectedEncounter}
        onPopulate={handlePopulateMap}
      />
    </div>
  );
}
