/**
 * STᚱ VTT — Player List
 *
 * Displays all player characters in a mobile-first layout.
 * - Mobile: Single column card list
 * - Tablet: 2-column grid
 * - Desktop: 3-column grid
 *
 * Each card shows key stats at a glance. Tapping opens full PlayerSheet modal.
 */

import { useState, useCallback } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import PlayerCardCompact from "./PlayerCardCompact";
import PlayerSheet from "./PlayerSheet";
import { Plus } from "lucide-react";
import type { PlayerCharacter } from "@/types";

export default function PlayerList() {
  const characters = useCampaignStore((s) => s.characters);
  const addCharacter = useCampaignStore((s) => s.addCharacter);
  const [activeSheetChar, setActiveSheetChar] = useState<PlayerCharacter | null>(null);

  const handleOpenSheet = useCallback((char: PlayerCharacter) => {
    setActiveSheetChar(char);
  }, []);

  const handleCloseSheet = useCallback(() => {
    setActiveSheetChar(null);
  }, []);

  // ── Seed: Add a demo character for testing ──
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
      traits: [{ name: "Defensive Fighting Style", description: "+1 AC when wearing armor", source: "class" }],
      proficiencies: [],
      languages: ["Common", "Dwarvish"],
      features: [
        { name: "Second Wind", description: "Regain 1d10+1 HP once per short rest", source: "class" },
        { name: "Fighting Style: Defense", description: "+1 AC", source: "class" },
      ],
      equipment: [
        { slot: "Weapon", item: "Longsword", quantity: 1, weight: 3, notes: "Versatile" },
        { slot: "Armor", item: "Chain Mail", quantity: 1, weight: 55, notes: "AC 16" },
        { slot: "Weapon", item: "Shield", quantity: 1, weight: 6, notes: "+2 AC" },
      ],
      inventory: [
        { name: "Rations", quantity: 5, weight: 1, description: "5 days of food", isEquipped: false },
        { name: "Torch", quantity: 3, weight: 1, description: "Sheds bright light 20ft", isEquipped: false },
        { name: "Potion of Healing", quantity: 2, weight: 0.5, description: "Restores 2d4+2 HP", isEquipped: false },
      ],
      currency: { copper: 12, silver: 8, electrum: 0, gold: 15, platinum: 0 },
      appearance: "A sturdy warrior in polished chain mail, carrying a longsword and shield.",
      backstory: "A veteran of the king's army, now seeking adventure.",
      allies: "The party",
      characterNotes: "Keep an eye on that suspicious merchant.",
      personalityTraits: "I face problems head-on.",
      ideals: "Honor above all.",
      bonds: "My comrades are my family.",
      flaws: "I trust too easily.",
      isHomebrew: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    addCharacter(newChar);
  }, [addCharacter]);

  return (
    <>
      {/* Header + Add button */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-gradient-arcane">Player Characters</span>
          <span className="text-[10px] text-surface-500 bg-surface-800/50 px-1.5 py-0.5 rounded-full">
            {characters.length}
          </span>
        </div>
        <button
          onClick={handleAddDemo}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-accent-600/15 border border-accent-500/20 text-accent-300 text-xs font-semibold active:scale-95 transition-all hover:bg-accent-600/25"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add PC</span>
        </button>
      </div>

      {/* Character list */}
      {characters.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-surface-500 text-sm">No characters yet</p>
          <p className="text-surface-600 text-xs mt-1">
            Add a character to get started with your party
          </p>
          <button
            onClick={handleAddDemo}
            className="mt-4 px-4 py-2.5 rounded-xl bg-accent-600/20 border border-accent-500/20 text-accent-300 text-sm font-semibold active:scale-95 transition-all"
          >
            + Create First Character
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {characters.map((char) => (
            <PlayerCardCompact
              key={char.id}
              character={char}
              onOpen={handleOpenSheet}
            />
          ))}
        </div>
      )}

      {/* Full-screen sheet modal */}
      {activeSheetChar && (
        <PlayerSheet character={activeSheetChar} onClose={handleCloseSheet} />
      )}
    </>
  );
}
