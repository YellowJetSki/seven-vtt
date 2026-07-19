/**
 * STᚱ VTT — Player List
 *
 * Displays all player characters in a mobile-first layout.
 * Composed of PlayerListHeader, PlayerListEmptyState, PlayerListGrid,
 * and PlayerCardCompact sub-components.
 *
 * - Mobile: Single column card list
 * - Tablet: 2-column grid
 * - Desktop: 3-column grid
 *
 * Each card shows key stats at a glance. Tapping opens full PlayerSheet modal.
 */

import { useState, useCallback } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import PlayerListHeader from "./PlayerListHeader";
import PlayerListEmptyState from "./PlayerListEmptyState";
import PlayerListGrid from "./PlayerListGrid";
import PlayerCardCompact from "./PlayerCardCompact";
import PlayerSheet from "./PlayerSheet";
import type { PlayerCharacter } from "@/types";

export default function PlayerList() {
  const characters = useCampaignStore((s) => s.characters);
  const addCharacter = useCampaignStore((s) => s.addCharacter);
  const [activeSheetChar, setActiveSheetChar] =
    useState<PlayerCharacter | null>(null);

  const handleOpenSheet = useCallback((char: PlayerCharacter) => {
    setActiveSheetChar(char);
  }, []);

  const handleCloseSheet = useCallback(() => {
    setActiveSheetChar(null);
  }, []);

  const handleAddDemo = useCallback(() => {
    const newChar: PlayerCharacter = {
      id: `pc_${Date.now()}`,
      name: "New Hero",
      playerName: "Player",
      race: "Human",
      class: "Fighter",
      level: 1,
      classes: [{ name: "Fighter", level: 1 }],
      experiencePoints: 0,
      background: "Soldier",
      alignment: "Lawful Good",
      inspiration: false,
      strength: 15,
      dexterity: 13,
      constitution: 14,
      intelligence: 10,
      wisdom: 12,
      charisma: 8,
      savingThrows: {
        strength: { proficient: true, bonus: 0 },
        dexterity: { proficient: false, bonus: 0 },
        constitution: { proficient: true, bonus: 0 },
        intelligence: { proficient: false, bonus: 0 },
        wisdom: { proficient: false, bonus: 0 },
        charisma: { proficient: false, bonus: 0 },
      },
      skills: {
        athletics: "proficient",
        perception: "proficient",
        intimidation: "proficient",
        survival: "expertise",
      },
      hitPoints: { current: 12, max: 12, temporary: 0 },
      armorClass: 16,
      initiative: 1,
      speed: { walk: 30 },
      hitDice: "1d10",
      proficiencyBonus: 2,
      conditions: [],
      deathSaves: { successes: 0, failures: 0 },
      temporaryHitPoints: 0,
      traits: [],
      proficiencies: [],
      languages: ["Common", "Dwarvish"],
      features: [],
      equipment: [],
      inventory: [],
      currency: { copper: 0, silver: 0, electrum: 0, gold: 0, platinum: 0 },
      appearance: "",
      backstory: "",
      allies: "",
      characterNotes: "",
      isHomebrew: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    addCharacter(newChar);
  }, [addCharacter]);

  return (
    <>
      <PlayerListHeader
        characterCount={characters.length}
        onAdd={handleAddDemo}
      />

      {characters.length === 0 ? (
        <PlayerListEmptyState onCreateFirst={handleAddDemo} />
      ) : (
        <PlayerListGrid>
          {characters.map((char) => (
            <PlayerCardCompact
              key={char.id}
              character={char}
              onOpen={handleOpenSheet}
            />
          ))}
        </PlayerListGrid>
      )}

      {activeSheetChar && (
        <PlayerSheet character={activeSheetChar} onClose={handleCloseSheet} />
      )}
    </>
  );
}
