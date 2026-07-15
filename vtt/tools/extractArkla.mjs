import { readFileSync, writeFileSync } from 'fs';

const raw = readFileSync('public/arkla.json', 'utf-8');
const data = JSON.parse(raw);
const chars = data.characters;

const results = {};
for (const [id, c] of Object.entries(chars)) {
  results[c.name] = {
    id,
    class: c.class || (c.classes && c.classes[0]?.name) || 'Adventurer',
    species: c.species || 'Unknown',
    level: c.level || 1,
    hp: c.hp || c.maxHp || 10,
    ac: c.ac || 10,
    stats: c.stats,
    features: c.features?.map(f => f.name) || [],
    inventoryCount: c.inventory?.length || 0,
    hasCompanion: !!c.companion,
    imageUrl: c.imageUrl || null,
    img: c.img || null,
    currency: c.currency,
    proficiencies: c.proficiencies,
    alignment: c.alignment,
    backstory: c.backstory ? c.backstory.substring(0, 100) + '...' : null,
    spells: c.spells?.map(s => s.name) || [],
    resources: c.resources || [],
    hitDice: c.hitDice,
    speed: c.speed,
    spellSlots: c.spellSlots,
    spellAttack: c.spellAttack,
    spellSave: c.spellSave,
    equipment: c.inventory?.map(i => i.name + (i.quantity > 1 ? ` (${i.quantity})` : '')) || [],
    // Full details for Wendy already done, grab full for others
    inventory: c.inventory,
  };
}

writeFileSync('public/arkla_summary.json', JSON.stringify(results, null, 2));
console.log('Wrote summary for ' + Object.keys(results).length + ' characters');

// Print names and basic info
for (const [name, info] of Object.entries(results)) {
  console.log(`- ${name} | ${info.class} | ${info.species} | Lv${info.level} | HP:${info.hp} | AC:${info.ac} | Items:${info.inventoryCount} | Spells:${info.spells.length}`);
}
