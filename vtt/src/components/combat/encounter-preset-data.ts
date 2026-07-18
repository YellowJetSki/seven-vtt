/* ── Built-in Encounter Presets ─────────────────────────────────
 * Pre-built D&D encounter templates organized by difficulty
 * and environment. Used by EncounterPresets component.
 * Extracted from EncounterPresets.tsx to keep files under 150 lines.
 * ─────────────────────────────────────────────────────────────── */

import type { EncounterPreset } from "./encounter-preset-types";

export const BUILT_IN_PRESETS: EncounterPreset[] = [
  {
    name: "Goblin Ambush",
    difficulty: "easy",
    environment: "forest",
    description: "A standard goblin ambush — perfect for levels 1-3.",
    enemies: [
      { enemyId: "goblin", count: 4 },
      { enemyId: "hobgoblin", count: 1 },
    ],
  },
  {
    name: "Undead Rising",
    difficulty: "medium",
    environment: "dungeon",
    description: "Skeletons and zombies crawl from the earth.",
    enemies: [
      { enemyId: "skeleton", count: 3 },
      { enemyId: "zombie", count: 3 },
      { enemyId: "wight", count: 1 },
    ],
  },
  {
    name: "Bandit Raid",
    difficulty: "medium",
    environment: "road",
    description: "A well-organized bandit crew intercepts the party.",
    enemies: [
      { enemyId: "bandit", count: 6 },
      { enemyId: "bandit_captain", count: 1 },
    ],
  },
  {
    name: "Cultist Rite",
    difficulty: "hard",
    environment: "temple",
    description: "Fanatics performing a dark ritual with monstrous guardians.",
    enemies: [
      { enemyId: "cultist", count: 4 },
      { enemyId: "cult_fanatic", count: 2 },
      { enemyId: "specter", count: 1 },
    ],
  },
  {
    name: "Elemental Fury",
    difficulty: "hard",
    environment: "mountain",
    description: "Elementals and mephits pour from a rift.",
    enemies: [
      { enemyId: "mud_mephit", count: 3 },
      { enemyId: "earth_elemental", count: 2 },
    ],
  },
  {
    name: "The Horde",
    difficulty: "deadly",
    environment: "plains",
    description: "A massive goblinoid war party.",
    enemies: [
      { enemyId: "goblin", count: 8 },
      { enemyId: "hobgoblin", count: 3 },
      { enemyId: "bugbear", count: 2 },
    ],
  },
  {
    name: "Dragon's Lair",
    difficulty: "deadly",
    environment: "cavern",
    description: "A young dragon and its cultist servants.",
    enemies: [
      { enemyId: "young_dragon", count: 1 },
      { enemyId: "cult_fanatic", count: 2 },
      { enemyId: "cultist", count: 2 },
    ],
  },
  {
    name: "Lycanthrope Hunt",
    difficulty: "hard",
    environment: "forest",
    description: "Werewolves stalk the party through the woods.",
    enemies: [
      { enemyId: "werewolf", count: 3 },
      { enemyId: "dire_wolf", count: 2 },
    ],
  },
  {
    name: "Swamp Ambush",
    difficulty: "medium",
    environment: "swamp",
    description: "Lizardfolk and a giant crocodile ambush from murky waters.",
    enemies: [
      { enemyId: "lizardfolk", count: 4 },
      { enemyId: "giant_crocodile", count: 1 },
    ],
  },
  {
    name: "City Watch Patrol",
    difficulty: "easy",
    environment: "urban",
    description: "A heavily-armored city watch squad with a captain.",
    enemies: [
      { enemyId: "guard", count: 4 },
      { enemyId: "veteran", count: 1 },
    ],
  },
  {
    name: "Underdark Encounter",
    difficulty: "hard",
    environment: "cavern",
    description: "Drow raiders with a drider in the deep tunnels.",
    enemies: [
      { enemyId: "drow", count: 3 },
      { enemyId: "drow_mage", count: 1 },
      { enemyId: "drider", count: 1 },
    ],
  },
  {
    name: "Arctic Trek",
    difficulty: "medium",
    environment: "arctic",
    description: "Yetis and winter wolves ambush the party in a blizzard.",
    enemies: [
      { enemyId: "yetis", count: 2 },
      { enemyId: "winter_wolf", count: 3 },
    ],
  },
  {
    name: "Desert Scourge",
    difficulty: "hard",
    environment: "desert",
    description: "A young blue dragon with its half-dragon servants.",
    enemies: [
      { enemyId: "blue_dragon_wyrmling", count: 1 },
      { enemyId: "half_dragon", count: 2 },
      { enemyId: "scout", count: 3 },
    ],
  },
  {
    name: "Spectral Tide",
    difficulty: "deadly",
    environment: "coast",
    description: "Ghosts and ghouls rise from a shipwreck graveyard.",
    enemies: [
      { enemyId: "ghost", count: 3 },
      { enemyId: "ghoul", count: 4 },
      { enemyId: "wraith", count: 1 },
    ],
  },
];
