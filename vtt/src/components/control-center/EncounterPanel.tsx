/**
 * STᚱ VTT — Encounter Panel
 *
 * Allows the DM to create new encounters, load existing ones,
 * and populate the battle map with tokens from an encounter.
 * Integrates with combatStore for initiative tracking.
 * Composed of EncounterPanelHeader, EncounterCard, EncounterEmptyState,
 * and EncounterPopulateButton sub-components.
 *
 * Refactored Cycle 2: All encounter/combatant writes use
 * useCombatEncounterMutations hooks → Zustand + Firestore.
 */

import { useState, useCallback } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import { useCombatEncounterMutations } from "@/hooks/useCombatMutations";
import EncounterPanelHeader from "./EncounterPanelHeader";
import EncounterCard from "./EncounterCard";
import EncounterEmptyState from "./EncounterEmptyState";
import EncounterPopulateButton from "./EncounterPopulateButton";
import type { MapToken, Combatant } from "@/types";

interface EncounterPanelProps {
  mapId: string;
  onTokensAdded?: (tokens: MapToken[]) => void;
}

export default function EncounterPanel({ mapId, onTokensAdded }: EncounterPanelProps) {
  const encounters = useCampaignStore((s) => s.encounters);
  const enemies = useCampaignStore((s) => s.enemies);
  const addMapToken = useCampaignStore((s) => s.addMapToken);

  // Centralized combat mutations — writes to Zustand + Firestore
  const { createEncounter, addCombatant } = useCombatEncounterMutations();

  const [selectedEncounterId, setSelectedEncounterId] = useState<string | null>(null);
  const [isPlacing, setIsPlacing] = useState(false);

  const selectedEncounter = encounters.find((e) => e.id === selectedEncounterId);

  const handlePopulateMap = useCallback(() => {
    if (!selectedEncounter) return;

    setIsPlacing(true);
    const newTokens: MapToken[] = [];

    const cols = Math.ceil(Math.sqrt(selectedEncounter.enemyGroups.length + 1));
    const startX = 5;
    const startY = 5;

    // Create combat encounter in Firestore + Zustand
    const encId = createEncounter(selectedEncounter.name || "Combat Encounter");

    selectedEncounter.enemyGroups.forEach((group, idx) => {
      const enemy = enemies.find((e) => e.id === group.enemyId);
      if (!enemy) return;

      const col = idx % cols;
      const row = Math.floor(idx / cols);

      // Create map token
      for (let i = 0; i < (group.count || 1); i++) {
        const tokenId = `token_${Date.now()}_${idx}_${i}`;
        const token: MapToken = {
          id: tokenId,
          type: "enemy",
          label: group.label ? `${group.label} ${i + 1}` : `${enemy.name} ${i + 1}`,
          x: startX + col * 3 + i,
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

        // Add to Firestore combat tracker
        const combatant: Combatant = {
          id: `combatant_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          name: group.label
            ? `${group.label} ${i + 1}`
            : `${enemy.name} ${i + 1}`,
          type: "enemy",
          initiative: Math.floor(Math.random() * 20) + 1,
          armorClass: enemy.armorClass || 12,
          hitPoints: {
            current: enemy.hitPoints.current,
            max: enemy.hitPoints.max,
            temporary: 0,
          },
          statusEffects: [],
          isDead: false,
          isConcentrating: false,
          notes: "",
        };

        addCombatant(combatant);
      }
    });

    onTokensAdded?.(newTokens);
    setIsPlacing(false);
  }, [selectedEncounter, enemies, mapId, addMapToken, createEncounter, addCombatant, onTokensAdded]);

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
