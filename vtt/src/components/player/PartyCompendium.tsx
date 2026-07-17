/* ── Party Compendium ──────────────────────────────────────────
 * A beautifully crafted overview of all player characters in the
 * campaign. Shows key stats at a glance in a grid of compact cards.
 * Uses flat PlayerCharacter type (ability scores are direct fields).
 * ─────────────────────────────────────────────────────────────── */

import { useState, useMemo } from "react";
import { useCampaignStore } from "@/stores/campaignStore";
import { PlayerCharacterSheet } from "@/components/player/PlayerCharacterSheet";
import { Button } from "@/components/ui/Button";
import { getClassSummary } from "@/types";
import { Modal } from "@/components/ui/Modal";
import { useUiStore } from "@/stores/uiStore";
import type { PlayerCharacter, Ability } from "@/types";

const ABILITY_KEYS: Ability[] = ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"];
const ABILITY_ABBR: Record<Ability, string> = {
  strength: "STR", dexterity: "DEX", constitution: "CON",
  intelligence: "INT", wisdom: "WIS", charisma: "CHA",
};

function abilityModifier(score: number): string {
  const mod = Math.floor((score - 10) / 2);
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

export function PartyCompendium() {
  const characters = useCampaignStore((s) => s.characters);
  const [selectedCharacter, setSelectedCharacter] = useState<PlayerCharacter | null>(null);
  const [showAllAbilities, setShowAllAbilities] = useState(false);
  const openModal = useUiStore((s) => s.openModal);

  const partyStats = useMemo(() => {
    if (characters.length === 0) return null;
    const totalLevel = characters.reduce((sum, c) => sum + c.level, 0);
    const avgLevel = Math.round(totalLevel / characters.length);
    const classCounts: Record<string, number> = {};
    characters.forEach((c) => {
      classCounts[c.class] = (classCounts[c.class] || 0) + 1;
    });
    return { totalLevel, avgLevel, classCounts, count: characters.length };
  }, [characters]);

  if (characters.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-surface-700 bg-surface-850 py-16 text-center">
        <span className="text-5xl text-surface-600 mb-4">👥</span>
        <h3 className="text-lg font-semibold text-surface-200 mb-1">No Party Members</h3>
        <p className="text-sm text-surface-500 mb-6 max-w-sm">
          Player characters will appear here once they're added to the campaign.
        </p>
        <Button variant="secondary" size="sm" onClick={() => {}}>
          + Add Character
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Party Overview Stats */}
      {partyStats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border border-surface-700 bg-surface-850 p-4 text-center">
            <p className="text-2xl font-bold text-surface-100">{partyStats.count}</p>
            <p className="text-xs text-surface-400">Adventurers</p>
          </div>
          <div className="rounded-xl border border-surface-700 bg-surface-850 p-4 text-center">
            <p className="text-2xl font-bold text-surface-100">{partyStats.avgLevel}</p>
            <p className="text-xs text-surface-400">Avg. Level</p>
          </div>
          <div className="rounded-xl border border-surface-700 bg-surface-850 p-4 text-center">
            <p className="text-2xl font-bold text-surface-100">{partyStats.totalLevel}</p>
            <p className="text-xs text-surface-400">Total Levels</p>
          </div>
          <div className="rounded-xl border border-surface-700 bg-surface-850 p-4 text-center">
            <p className="text-2xl font-bold text-surface-100">
              {Object.entries(partyStats.classCounts).length}
            </p>
            <p className="text-xs text-surface-400">Classes</p>
          </div>
        </div>
      )}

      {/* Party Grid */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {characters.map((character) => (
          <CharacterCard
            key={character.id}
            character={character}
            showAllAbilities={showAllAbilities}
            onViewFullSheet={() => {
              setSelectedCharacter(character);
              openModal("party-compendium-sheet");
            }}
          />
        ))}
      </div>

      {/* Full Sheet Modal */}
      {selectedCharacter && (
        <Modal modalId="party-compendium-sheet" title={selectedCharacter.name} size="xl">
          <PlayerCharacterSheet character={selectedCharacter} />
        </Modal>
      )}

      {/* Toggle compact abilities */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-surface-500">
          {characters.length} character{characters.length > 1 ? "s" : ""} in the party
        </p>
        <label className="flex items-center gap-2 text-xs text-surface-400 cursor-pointer">
          <input
            type="checkbox"
            checked={showAllAbilities}
            onChange={() => setShowAllAbilities((o) => !o)}
            className="h-3.5 w-3.5 rounded border-surface-600 bg-surface-800 accent-accent-500"
          />
          Show ability scores
        </label>
      </div>
    </div>
  );
}

/* ── Character Card ─────────────────────────────────────────── */

function CharacterCard({
  character,
  showAllAbilities,
  onViewFullSheet,
}: {
  character: PlayerCharacter;
  showAllAbilities: boolean;
  onViewFullSheet: () => void;
}) {
  const hpPercent = Math.max(0, (character.hitPoints.current / character.hitPoints.max) * 100);
  const hpColor =
    hpPercent > 50 ? "bg-rogue-500" : hpPercent > 25 ? "bg-divine-500" : "bg-warrior-500";

  return (
    <div
      className="rounded-xl border border-surface-700 bg-surface-850 overflow-hidden transition-all hover:border-surface-600 hover:shadow-lg cursor-pointer group"
      onClick={onViewFullSheet}
    >
      {/* Gradient Bar */}
      <div className="h-1 bg-gradient-to-r from-accent-500 via-mage-500 to-rogue-500" />

      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start gap-3">
          {/* Portrait */}
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-surface-800 ring-1 ring-surface-700">
            <span className="text-2xl">
              {character.race.includes("Dwarf") ? "⛰" :
               character.race.includes("Elf") || character.race.includes("Half-Elf") ? "🧝" :
               character.race.includes("Tabaxi") ? "🐱" :
               character.race.includes("Aasimar") ? "😇" :
               character.race.includes("Dragon") ? "🐉" :
               "⚔"}
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-surface-100 truncate leading-tight">
              {character.name}
            </h3>
            <p className="text-xs text-surface-400">
              {character.playerName}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="rounded bg-accent-500/10 px-1.5 py-0.5 text-[10px] font-medium text-accent-400">
                Lvl {character.level}
              </span>
              <span className="text-[10px] text-surface-500">
                {character.race.split(" ")[0]} · {getClassSummary(character.classes)}
              </span>
            </div>
          </div>

          {/* Quick HP */}
          <div className="text-right shrink-0">
            <p className="text-xs text-surface-400">HP</p>
            <p className={`text-sm font-bold ${
              character.hitPoints.current <= 0 ? "text-warrior-400" :
              character.hitPoints.current <= character.hitPoints.max * 0.25 ? "text-warrior-500" :
              "text-surface-100"
            }`}>
              {character.hitPoints.current}/{character.hitPoints.max}
            </p>
          </div>
        </div>

        {/* HP Bar */}
        <div className="h-2 overflow-hidden rounded-full bg-surface-800">
          <div
            className={`h-full rounded-full transition-all duration-500 ${hpColor}`}
            style={{ width: `${hpPercent}%` }}
          />
        </div>

        {/* Key Stats */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-md bg-surface-800 py-1.5">
            <p className="text-[10px] text-surface-500">AC</p>
            <p className="text-sm font-bold text-mage-400">{character.armorClass}</p>
          </div>
          <div className="rounded-md bg-surface-800 py-1.5">
            <p className="text-[10px] text-surface-500">Init</p>
            <p className="text-sm font-bold text-rogue-400">+{character.initiative}</p>
          </div>
          <div className="rounded-md bg-surface-800 py-1.5">
            <p className="text-[10px] text-surface-500">Speed</p>
            <p className="text-sm font-bold text-surface-200">{typeof character.speed === 'number' ? character.speed : character.speed?.walk ?? 30}</p>
          </div>
        </div>

        {/* Ability Scores (compact) */}
        {showAllAbilities && (
          <div className="grid grid-cols-6 gap-1">
            {ABILITY_KEYS.map((ability) => {
              const score = character[ability];
              return (
                <div key={ability} className="rounded-md bg-surface-800 py-1 text-center">
                  <p className="text-[9px] font-semibold uppercase text-surface-500">{ABILITY_ABBR[ability]}</p>
                  <p className="text-xs font-bold text-surface-200">{score}</p>
                  <p className={`text-[9px] font-medium ${score >= 10 ? "text-rogue-400" : "text-warrior-400"}`}>
                    {abilityModifier(score)}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* View full sheet link */}
        <div className="pt-1 text-center">
          <span className="text-[11px] text-accent-400 opacity-0 group-hover:opacity-100 transition-opacity">
            Click to view full character sheet →
          </span>
        </div>
      </div>
    </div>
  );
}
