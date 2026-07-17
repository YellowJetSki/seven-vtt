/* ── Campaign Normalization ────────────────────────────────────
 * Helper functions for data normalization and legacy migration.
 * ─────────────────────────────────────────────────────────────── */

import type { Campaign, PlayerCharacter, BattleMap, MapToken, Encounter, JournalEntry, FeatureEntry, SkillProficiency } from "@/types";
import type { CampaignMeta } from "@/types/firestore";

interface LegacyChar {
  copper?: number; silver?: number; electrum?: number; gold?: number; platinum?: number;
  class?: string; subClass?: string; level?: number;
  strength?: number; dexterity?: number; constitution?: number;
  intelligence?: number; wisdom?: number; charisma?: number;
  speed?: number | { walk: number };
  features?: string[] | FeatureEntry[];
  classes?: { name: string; subClass: string; level: number; hitDice: string; classFeatures: never[] }[];
  savingThrows?: Record<string, { proficient: boolean; bonus: number }>;
  skills?: Record<string, SkillProficiency>;
  [key: string]: unknown;
}

/**
 * Build a legacy Campaign object from normalized state.
 */
export function buildCampaign(state: {
  meta: CampaignMeta | null;
  characters: PlayerCharacter[];
  encounters: Encounter[];
  battleMaps: BattleMap[];
  mapTokens: Record<string, MapToken[]>;
  journal: JournalEntry[];
}): Campaign | null {
  if (!state.meta) return null;
  return {
    id: state.meta.id,
    name: state.meta.name,
    description: state.meta.description,
    dmName: state.meta.dmName,
    settings: state.meta.settings,
    playerCharacters: state.characters,
    encounters: state.encounters,
    battleMaps: state.battleMaps.map((bm) => ({
      ...bm,
      tokens: state.mapTokens[bm.id] ?? bm.tokens ?? [],
    })),
    journal: state.journal,
    createdAt: state.meta.createdAt,
    updatedAt: state.meta.updatedAt,
  };
}

const HIT_DIE_TYPES: Record<string, string> = {
  artificer: 'd8', barbarian: 'd12', bard: 'd8', cleric: 'd8',
  druid: 'd8', fighter: 'd10', monk: 'd8', paladin: 'd10',
  ranger: 'd10', rogue: 'd8', sorcerer: 'd6', warlock: 'd8', wizard: 'd6',
};

const SKILL_KEYS = [
  'acrobatics','animalHandling','arcana','athletics','deception','history',
  'insight','intimidation','investigation','medicine','nature','perception',
  'performance','persuasion','religion','sleightOfHand','stealth','survival',
] as const;

/**
 * Normalize legacy PC data to the current format.
 */
export function normalizeCharacters(chars: PlayerCharacter[]): PlayerCharacter[] {
  return chars.map((c) => {
    const old = c as unknown as LegacyChar;

    // Migrate flat currency to object
    if (!c.currency) {
      (c as Record<string, unknown>).currency = {
        copper: old.copper ?? 0,
        silver: old.silver ?? 0,
        electrum: old.electrum ?? 0,
        gold: old.gold ?? 0,
        platinum: old.platinum ?? 0,
      };
    }

    // Migrate string[] features to FeatureEntry[]
    if (c.features && c.features.length > 0 && typeof c.features[0] === 'string') {
      c.features = (c.features as unknown as string[]).map((f) => ({ name: f, description: f, source: 'Legacy' }));
    }

    // Migrate numeric speed to Speed object
    if (typeof old.speed === 'number') {
      (c as Record<string, unknown>).speed = { walk: old.speed };
    }

    // Ensure saving throws
    if (!c.savingThrows) {
      const def = (a: number) => ({ proficient: false, bonus: Math.floor((a - 10) / 2) });
      c.savingThrows = {
        strength: def(c.strength), dexterity: def(c.dexterity),
        constitution: def(c.constitution), intelligence: def(c.intelligence),
        wisdom: def(c.wisdom), charisma: def(c.charisma),
      };
    }

    // Ensure skills
    if (!c.skills || Object.keys(c.skills).length === 0) {
      c.skills = Object.fromEntries(SKILL_KEYS.map(k => [k, 'none' as const]));
    }

    // Ensure classes
    if (!c.classes || c.classes.length === 0) {
      const className = old.class ?? 'Unknown';
      c.classes = [{
        name: className,
        subClass: old.subClass ?? '',
        level: old.level ?? 1,
        hitDice: HIT_DIE_TYPES[className.toLowerCase()] ?? 'd8',
        classFeatures: [],
      }];
    }

    return c;
  });
}
