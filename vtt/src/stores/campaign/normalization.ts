/* ── Campaign Normalization ────────────────────────────────────
 * Helper functions for data normalization and legacy migration.
 * ─────────────────────────────────────────────────────────────── */

import type { Campaign, PlayerCharacter, BattleMap, MapToken } from "@/types";
import type { CampaignMeta, EnemyDoc } from "@/types/firestore";

/**
 * Build a legacy Campaign object from normalized state.
 */
export function buildCampaign(state: {
  meta: CampaignMeta | null;
  characters: PlayerCharacter[];
  encounters: any[];
  battleMaps: BattleMap[];
  mapTokens: Record<string, MapToken[]>;
  journal: any[];
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

/**
 * Normalize legacy PC data to the current format.
 * Handles migration of currency, features, speed, savingThrows, skills, classes.
 */
export function normalizeCharacters(chars: PlayerCharacter[]): PlayerCharacter[] {
  return chars.map((c: any) => {
    if (!c.currency) {
      c.currency = { copper: c.copper ?? 0, silver: c.silver ?? 0, electrum: c.electrum ?? 0, gold: c.gold ?? 0, platinum: c.platinum ?? 0 };
    }
    if (c.features && c.features.length > 0 && typeof c.features[0] === 'string') {
      c.features = c.features.map((f: string) => ({ name: f, description: f, source: 'Legacy' }));
    }
    if (typeof c.speed === 'number') {
      c.speed = { walk: c.speed };
    }
    if (!c.savingThrows) {
      const def = (a: number) => ({ proficient: false, bonus: Math.floor((a - 10) / 2) });
      c.savingThrows = {
        strength: def(c.strength), dexterity: def(c.dexterity),
        constitution: def(c.constitution), intelligence: def(c.intelligence),
        wisdom: def(c.wisdom), charisma: def(c.charisma),
      };
    }
    if (!c.skills) {
      c.skills = Object.fromEntries(
        ['acrobatics','animalHandling','arcana','athletics','deception','history',
         'insight','intimidation','investigation','medicine','nature','perception',
         'performance','persuasion','religion','sleightOfHand','stealth','survival']
          .map(k => [k, 'none'])
      );
    }
    if (!c.classes || c.classes.length === 0) {
      const className = c.class || 'Unknown';
      const hitDieTypes: Record<string, string> = {
        artificer: 'd8', barbarian: 'd12', bard: 'd8', cleric: 'd8',
        druid: 'd8', fighter: 'd10', monk: 'd8', paladin: 'd10',
        ranger: 'd10', rogue: 'd8', sorcerer: 'd6', warlock: 'd8', wizard: 'd6',
      };
      c.classes = [{
        name: className,
        subClass: c.subClass || '',
        level: c.level || 1,
        hitDice: hitDieTypes[className.toLowerCase()] || 'd8',
        classFeatures: [],
      }];
    }
    return c as PlayerCharacter;
  });
}
