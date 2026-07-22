/**
 * STᚱ VTT — Traps & Hazards Reference (DMG 120-123)
 *
 * Reference data for common dungeon traps and environmental hazards.
 * Provides DCs, damage, detection/disable info for DM quick reference.
 */

export interface TrapDef {
  id: string;
  name: string;
  type: "mechanical" | "magical" | "environmental";
  severity: "setback" | "dangerous" | "deadly";
  detectDC: number;
  disableDC: number;
  saveDC: number;
  saveAbility: string;
  damageDice: string;
  damageType: string;
  description: string;
  icon: string;
}

export interface HazardDef {
  id: string;
  name: string;
  type: "natural" | "magical" | "environmental";
  severity: "minor" | "major" | "deadly";
  description: string;
  effect: string;
  icon: string;
}

export const SRD_TRAPS: TrapDef[] = [
  { id: "pit_trap", name: "Pit Trap", type: "mechanical", severity: "dangerous", detectDC: 15, disableDC: 12, saveDC: 13, saveAbility: "dexterity", damageDice: "4d10", damageType: "bludgeoning", description: "A 10-foot-deep pit concealed by a false floor. Spikes at the bottom.", icon: "\uD83D\uDD73\uFE0F" },
  { id: "poison_dart", name: "Poison Dart Trap", type: "mechanical", severity: "dangerous", detectDC: 15, disableDC: 13, saveDC: 13, saveAbility: "dexterity", damageDice: "2d8", damageType: "piercing", description: "Small darts coated with basic poison fire from wall slots when a pressure plate is triggered.", icon: "\uD83C\uDFF9" },
  { id: "scything_blade", name: "Scything Blade", type: "mechanical", severity: "deadly", detectDC: 18, disableDC: 15, saveDC: 15, saveAbility: "dexterity", damageDice: "8d10", damageType: "slashing", description: "A large blade swings from the ceiling when a tripwire is disturbed.", icon: "\u2694\uFE0F" },
  { id: "magic_mouth", name: "Magic Mouth Alarm", type: "magical", severity: "setback", detectDC: 12, disableDC: 14, saveDC: 0, saveAbility: "", damageDice: "0", damageType: "", description: "A triggered Magic Mouth spell alerts nearby creatures.", icon: "\uD83D\uDC40" },
  { id: "glyph_of_warding", name: "Glyph of Warding", type: "magical", severity: "deadly", detectDC: 17, disableDC: 0, saveDC: 17, saveAbility: "dexterity", damageDice: "8d8", damageType: "varies", description: "A magical glyph inscribed on a surface. When triggered, it explodes with stored spell energy.", icon: "\u2728" },
  { id: "flame_jet", name: "Flame Jet Trap", type: "mechanical", severity: "dangerous", detectDC: 14, disableDC: 12, saveDC: 14, saveAbility: "dexterity", damageDice: "4d6", damageType: "fire", description: "A hidden nozzle sprays a jet of flame across a 10-foot area.", icon: "\uD83D\uDD25" },
  { id: "falling_net", name: "Falling Net", type: "mechanical", severity: "setback", detectDC: 12, disableDC: 10, saveDC: 12, saveAbility: "strength", damageDice: "0", damageType: "", description: "A weighted net drops from the ceiling, entangling creatures beneath.", icon: "\uD83E\uDDF5" },
  { id: "rolling_boulder", name: "Rolling Boulder", type: "mechanical", severity: "deadly", detectDC: 16, disableDC: 14, saveDC: 16, saveAbility: "dexterity", damageDice: "10d10", damageType: "bludgeoning", description: "A massive stone sphere rolls down a corridor, crushing everything in its path.", icon: "\uD83E\uDEA8" },
];

export const SRD_HAZARDS: HazardDef[] = [
  { id: "lava", name: "Lava", type: "natural", severity: "deadly", description: "A pool of molten rock.", effect: "Contact: 10d10 fire damage. Entering: 18d10 fire damage. Immune to lava effects are rare.", icon: "\uD83C\uDF2B\uFE0F" },
  { id: "poison_gas", name: "Poison Gas", type: "environmental", severity: "major", description: "A room filled with poisonous vapor.", effect: "CON save DC 13 each round or take 2d6 poison damage and poisoned condition.", icon: "\uD83D\uDCA8" },
  { id: "slippery_ice", name: "Slippery Ice", type: "natural", severity: "minor", description: "A patch of ice on the ground.", effect: "DEX save DC 10 or fall prone. Movement halved on the ice.", icon: "\u2744\uFE0F" },
  { id: "web", name: "Giant Spider Webs", type: "environmental", severity: "major", description: "Thick, sticky webs fill the area.", effect: "STR check DC 14 to escape. Fire damage destroys webs. Creatures restrained on a failed save.", icon: "\uD83D\uDD78\uFE0F" },
  { id: "razorwire", name: "Razorwire Fence", type: "environmental", severity: "major", description: "A fence of razor-sharp wire.", effect: "DEX save DC 12 or take 2d4 slashing damage. Climbing requires STR save DC 15.", icon: "\u26A1" },
  { id: "acid_puddle", name: "Acid Puddle", type: "environmental", severity: "major", description: "A pool of corrosive acid.", effect: "Contact: 4d8 acid damage. Armor touched by acid takes a permanent -1 penalty to AC.", icon: "\uD83E\uDDEA" },
  { id: "quicksand", name: "Quicksand", type: "natural", severity: "major", description: "A pit of shifting sand that pulls creatures under.", effect: "STR save DC 12 to avoid sinking. Fully submerged: suffocation begins in 1 minute.", icon: "\uD83C\uDF0A" },
  { id: "avalanche", name: "Avalanche", type: "natural", severity: "deadly", description: "A massive cascade of snow and ice.", effect: "DEX save DC 18 or take 10d10 bludgeoning damage. Buried creatures begin suffocating.", icon: "\u26F0\uFE0F" },
];

export function getTrapById(id: string): TrapDef | undefined {
  return SRD_TRAPS.find((t) => t.id === id);
}

export function getHazardById(id: string): HazardDef | undefined {
  return SRD_HAZARDS.find((h) => h.id === id);
}
