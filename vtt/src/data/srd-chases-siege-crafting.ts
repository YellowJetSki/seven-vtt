/**
 * STᚱ VTT — Chases (DMG 252-255), Siege Equipment (DMG 255), & Crafting Reference
 *
 * Lightweight data-only modules for DM quick reference during sessions.
 */

// ═══════════════════════════════════════════════════════════════
// CHASE RULES (DMG 252-255)
// ═══════════════════════════════════════════════════════════════

export interface ChaseObstacle {
  id: string;
  description: string;
  check: string;
  dc: number;
  failure: string;
}

export const CHASE_OBSTACLES: ChaseObstacle[] = [
  { id: "crowd", description: "Weaving through a crowded market", check: "Acrobatics or Athletics", dc: 12, failure: "Lose 1 round of progress" },
  { id: "rooftop", description: "Leaping across a rooftop gap", check: "Acrobatics", dc: 15, failure: "Fall 10-20 feet, take 1d6 bludgeoning per 10ft" },
  { id: "cart_block", description: "A cart overturns, blocking the path", check: "Athletics", dc: 14, failure: "Lose 2 rounds clearing the obstacle" },
  { id: "sewer_grate", description: "Dashing through a sewer grate opening", check: "Acrobatics or Athletics", dc: 13, failure: "Lose 1 round" },
  { id: "alley_dead_end", description: "Dead-end alley with a 15-foot wall", check: "Athletics (climb)", dc: 15, failure: "Lose 2 rounds finding another route" },
  { id: "street_merchant", description: "A merchant's stall collapses behind you", check: "Dexterity (avoid)", dc: 12, failure: "Tripped: fall prone and lose 1 round" },
  { id: "water_crossing", description: "A river or canal blocks the route", check: "Athletics (swim)", dc: 14, failure: "Swept downstream, lose 2 rounds" },
  { id: "magical_barrier", description: "A magical barrier (e.g., Wall of Fire)", check: "Investigation or Arcana", dc: 16, failure: "Take 2d6 damage and lose 1 round" },
];

export const CHASE_RULES = {
  dashLimit: "CHA-based limit per creature (typically 3 + CHA mod consecutive dashes)",
  fatigue: "After exceeding dash limit, CON save DC 10 or gain 1 level of exhaustion",
  escape: "If the quarry gets 100+ feet ahead in an urban chase, they escape",
  pursuit: "If the pursuer gets within 5 feet, they can attempt to grapple",
  obstacles: "Roll a d20 at the start of each round: 1-10 = obstacle ahead, 11-20 = clear path",
};

// ═══════════════════════════════════════════════════════════════
// SIEGE EQUIPMENT (DMG 255)
// ═══════════════════════════════════════════════════════════════

export interface SiegeWeaponDef {
  id: string;
  name: string;
  ac: number;
  hp: number;
  damageDice: string;
  damageType: string;
  range: string;
  crew: number;
  cost: string;
  description: string;
  icon: string;
}

export const SIEGE_WEAPONS: SiegeWeaponDef[] = [
  { id: "ballista", name: "Ballista", ac: 15, hp: 50, damageDice: "3d10", damageType: "piercing", range: "120/480 ft", crew: 1, cost: "500 gp", description: "A mounted crossbow that fires heavy bolts.", icon: "\uD83C\uDFF9" },
  { id: "cannon", name: "Cannon", ac: 19, hp: 75, damageDice: "8d6", damageType: "bludgeoning", range: "600/2,400 ft", crew: 3, cost: "1,000 gp", description: "A cast-iron cannon that fires stone balls or grapeshot.", icon: "\uD83D\uDD2B" },
  { id: "mangonel", name: "Mangonel", ac: 15, hp: 100, damageDice: "5d10", damageType: "bludgeoning", range: "200/800 ft", crew: 2, cost: "300 gp", description: "A torsion-powered catapult that hurls stones.", icon: "\uD83E\uDEA8" },
  { id: "trebuchet", name: "Trebuchet", ac: 15, hp: 150, damageDice: "8d10", damageType: "bludgeoning", range: "300/1,200 ft", crew: 4, cost: "400 gp", description: "A counterweight-powered siege engine with enormous reach.", icon: "\u2699\uFE0F" },
  { id: "greek_fire", name: "Greek Fire Projector", ac: 15, hp: 75, damageDice: "4d8", damageType: "fire", range: "100/400 ft", crew: 2, cost: "1,500 gp", description: "A projector that sprays alchemical fire. Ignites flammable targets.", icon: "\uD83D\uDD25" },
  { id: "ram", name: "Battering Ram", ac: 15, hp: 100, damageDice: "4d10", damageType: "bludgeoning", range: "Melee (door/gate)", crew: 4, cost: "200 gp", description: "A heavy log on chains used to break down doors and gates.", icon: "\uD83E\uDE93" },
];

// ═══════════════════════════════════════════════════════════════
// CRAFTING (PHB/XGtE guidelines)
// ═══════════════════════════════════════════════════════════════

export interface CraftingRule {
  id: string;
  itemType: string;
  costPerDay: string;
  timePerUnit: string;
  requirements: string;
  notes: string;
}

export const CRAFTING_RULES: CraftingRule[] = [
  { id: "potion_craft", itemType: "Potion of Healing", costPerDay: "25 gp", timePerUnit: "1 day", requirements: "Proficiency in Herbalism Kit", notes: "Higher-level potions cost more and take longer: Greater (100 gp, 1 week), Superior (500 gp, 3 weeks), Supreme (5,000 gp, 4 weeks)" },
  { id: "spell_scroll", itemType: "Spell Scroll", costPerDay: "25 gp per spell level", timePerUnit: "1 day per spell level", requirements: "Proficiency in Arcana, must know the spell", notes: "Cantrip: 15 gp, 1 day. Max spell level is half your proficiency bonus rounded up." },
  { id: "magic_item", itemType: "Magic Item (Common/Uncommon)", costPerDay: "50 gp", timePerUnit: "Variable", requirements: "Proficiency in Arcana, formula/recipe", notes: "Common: 2 weeks (100 gp). Uncommon: 4 weeks (200 gp). Rare: 20 weeks (2,000 gp)." },
  { id: "armor_smithing", itemType: "Armor", costPerDay: "15 gp", timePerUnit: "Based on armor cost/2", requirements: "Proficiency in Smith's Tools or Leatherworker's Tools", notes: "Costs half the market price in materials. Time = total gp cost / 15 days." },
  { id: "weapon_smithing", itemType: "Weapon", costPerDay: "15 gp", timePerUnit: "Based on weapon cost/2", requirements: "Proficiency in Smith's Tools or Woodcarver's Tools", notes: "Costs half the market price in materials. Time = total gp cost / 15 days." },
  { id: "poison_craft", itemType: "Poison (Basic)", costPerDay: "25 gp", timePerUnit: "1 day per 100 gp of sale price", requirements: "Proficiency in Poisoner's Kit", notes: "Harvesting from creatures: DC 20 Investigation + Poisoner's Kit to extract 1d4 doses of the creature's venom." },
  { id: "tool_craft", itemType: "Artisan's Tools / Adventuring Gear", costPerDay: "10 gp", timePerUnit: "Based on item cost/10", requirements: "Appropriate tool proficiency", notes: "Costs half the market price in materials. Time = total gp cost / 10 days." },
];
