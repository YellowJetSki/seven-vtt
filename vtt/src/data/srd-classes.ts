/**
 * STᚱ VTT — SRD Class Definitions (D&D 5e)
 *
 * Canonical class data from the 5e SRD.
 * All official classes use the same schema as homebrew classes.
 *
 * Data Sources: Player's Handbook, SRD 5.1
 * Each class includes:
 *   - Hit die, proficiencies, starting equipment
 *   - Full feature progression (1-20)
 *   - Spellcasting ability & caster type
 *   - Multiclass requirements
 *   - Skill choices & options
 */

import type { ClassDefinition } from "@/types/race-class";

export const SRD_CLASSES: ClassDefinition[] = [
  // ── BARBARIAN ─────────────────────────────────────
  {
    id: "barbarian",
    name: "Barbarian",
    source: "Player's Handbook",
    hitDie: "1d12",
    casterType: "none",
    proficiencies: [
      { type: "save", name: "Strength" },
      { type: "save", name: "Constitution" },
      { type: "armor", name: "Light Armor" },
      { type: "armor", name: "Medium Armor" },
      { type: "armor", name: "Shields" },
      { type: "weapon", name: "Simple Weapons" },
      { type: "weapon", name: "Martial Weapons" },
    ],
    startingEquipment: [
      "Greataxe or any martial weapon",
      "Two handaxes or any simple weapon",
      "Explorer's Pack and four javelins",
    ],
    features: [
      { name: "Rage", description: "Enter a rage for 1 minute. Gain advantage on STR checks/saves, +2 melee damage, resistance to bludgeoning/piercing/slashing damage. Duration ends early if unconscious or no attack taken.", level: 1, shortRest: true, limitedUse: { max: 2, recharge: "long_rest" } },
      { name: "Unarmored Defense", description: "AC = 10 + DEX modifier + CON modifier when not wearing armor.", level: 1 },
      { name: "Reckless Attack", description: "Can take reckless attack to gain advantage on melee STR attacks. Attackers gain advantage on attacks against you until next turn.", level: 2 },
      { name: "Danger Sense", description: "Advantage on DEX saves against effects you can see (not blinded/deafened/incapacitated).", level: 2 },
      { name: "Primal Path", description: "Choose a primal path (Berserker, Totem Warrior, etc.) that grants features at levels 3, 6, 10, and 14.", level: 3 },
      { name: "Ability Score Improvement", description: "Increase one ability score by 2 or two by 1.", level: 4 },
      { name: "Extra Attack", description: "Attack twice instead of once when taking the Attack action.", level: 5 },
      { name: "Fast Movement", description: "Speed increases by 10ft when not wearing heavy armor.", level: 5 },
      { name: "Feral Instinct", description: "Advantage on initiative rolls. Can enter rage at start of combat if surprised.", level: 7 },
      { name: "Brutal Critical", description: "Roll one additional weapon damage die on a critical hit.", level: 9 },
      { name: "Relentless Rage", description: "When reduced to 0 HP while raging, make DC 10 CON save to drop to 1 HP instead. DC increases by 5 each use.", level: 11 },
      { name: "Persistent Rage", description: "Rage only ends early if you fall unconscious.", level: 15 },
      { name: "Indomitable Might", description: "If STR check total is less than STR score, use STR score instead.", level: 18 },
      { name: "Primal Champion", description: "STR and CON increase by 4 (max 24).", level: 20 },
    ],
    skillChoices: 2,
    skillOptions: ["Animal Handling", "Athletics", "Intimidation", "Nature", "Perception", "Survival"],
    multiclassRequirements: { strength: 13 },
    isHomebrew: false,
    icon: "🪓",
    description: "A fierce warrior driven by primal fury, channeling rage into devastating combat power.",
    tags: ["phb", "martial", "strength", "tank"],
  },

  // ── BARD ──────────────────────────────────────────
  {
    id: "bard",
    name: "Bard",
    source: "Player's Handbook",
    hitDie: "1d8",
    spellcastingAbility: "charisma",
    casterType: "full",
    proficiencies: [
      { type: "save", name: "Dexterity" },
      { type: "save", name: "Charisma" },
      { type: "armor", name: "Light Armor" },
      { type: "weapon", name: "Simple Weapons" },
      { type: "weapon", name: "Hand Crossbows" },
      { type: "weapon", name: "Longswords" },
      { type: "weapon", name: "Rapiers" },
      { type: "weapon", name: "Shortswords" },
    ],
    startingEquipment: [
      "Rapier or longsword or any simple weapon",
      "Diplomat's Pack or Entertainer's Pack",
      "Lute or any musical instrument",
      "Leather armor and a dagger",
    ],
    features: [
      { name: "Spellcasting", description: "You can cast known spells from the bard spell list using CHA as your spellcasting ability. You know 4 cantrips and (4 + CHA mod) spells at level 1.", level: 1 },
      { name: "Bardic Inspiration", description: "As a bonus action, give a creature a d6 inspiration die. They can add it to one ability check, attack roll, or saving throw within 10 minutes.", level: 1, shortRest: true, limitedUse: { max: 3, recharge: "long_rest" } },
      { name: "Jack of All Trades", description: "Add half your proficiency bonus (rounded down) to any ability check that doesn't already include your PB.", level: 2 },
      { name: "Song of Rest", description: "During a short rest, you and friendly creatures regain +1d6 extra HP.", level: 2 },
      { name: "Bard College", description: "Choose a bard college (Lore, Valor, etc.) that grants features at levels 3, 6, and 14.", level: 3 },
      { name: "Expertise", description: "Double your proficiency bonus for two skills of your choice.", level: 3 },
      { name: "Ability Score Improvement", description: "Increase one ability score by 2 or two by 1.", level: 4 },
      { name: "Font of Inspiration", description: "Regain all Bardic Inspiration uses on a short rest.", level: 5 },
      { name: "Countercharm", description: "As an action, grant advantage against being frightened/charmed to allies within 30ft.", level: 6 },
      { name: "Ability Score Improvement", description: "Increase one ability score by 2 or two by 1.", level: 8 },
      { name: "Magical Secrets", description: "Choose two spells from any class. They count as bard spells.", level: 10 },
      { name: "Superior Inspiration", description: "When rolling initiative, regain one Bardic Inspiration use if you have none.", level: 20 },
    ],
    skillChoices: 3,
    skillOptions: ["Any skill"],
    multiclassRequirements: { charisma: 13 },
    isHomebrew: false,
    icon: "🎵",
    description: "A versatile performer who weaves magic through music, inspiring allies and confounding foes.",
    tags: ["phb", "support", "charisma", "skill-monkey"],
  },

  // ── CLERIC ─────────────────────────────────────────
  {
    id: "cleric",
    name: "Cleric",
    source: "Player's Handbook",
    hitDie: "1d8",
    spellcastingAbility: "wisdom",
    casterType: "full",
    proficiencies: [
      { type: "save", name: "Wisdom" },
      { type: "save", name: "Charisma" },
      { type: "armor", name: "Light Armor" },
      { type: "armor", name: "Medium Armor" },
      { type: "armor", name: "Shields" },
      { type: "weapon", name: "Simple Weapons" },
    ],
    startingEquipment: [
      "Mace or warhammer",
      "Scale mail, leather armor, or chain mail",
      "Light crossbow with 20 bolts or any simple weapon",
      "Priest's Pack or Explorer's Pack",
      "Shield and holy symbol",
    ],
    features: [
      { name: "Spellcasting", description: "You can cast prepared spells from the cleric spell list using WIS as your spellcasting ability. You prepare (WIS mod + level) spells after a long rest. You have cantrips known equal to 3 + (level / 4).", level: 1 },
      { name: "Divine Domain", description: "Choose a divine domain (Life, Light, War, etc.) that grants domain spells and features at levels 1, 2, 6, 8, and 17.", level: 1 },
      { name: "Channel Divinity", description: "Turn Undead: As an action, present holy symbol. Undead within 30ft make WIS save or flee for 1 minute. Also grants domain-specific CD options. One use per short or long rest.", level: 2, shortRest: true, limitedUse: { max: 1, recharge: "short_rest" } },
      { name: "Ability Score Improvement", description: "Increase one ability score by 2 or two by 1.", level: 4 },
      { name: "Destroy Undead", description: "Undead of CR 1/2 or lower are instantly destroyed on a failed Turn Undead save.", level: 5 },
      { name: "Ability Score Improvement", description: "Increase one ability score by 2 or two by 1.", level: 8 },
      { name: "Divine Intervention", description: "As an action, call on your deity. There is a chance (your cleric level % per day) of divine intervention. Automatic at level 20.", level: 10 },
      { name: "Destroy Undead (improved)", description: "Destroy CR 1 or lower.", level: 8 },
      { name: "Destroy Undead (improved)", description: "Destroy CR 2 or lower.", level: 11 },
      { name: "Destroy Undead (improved)", description: "Destroy CR 3 or lower.", level: 14 },
      { name: "Destroy Undead (improved)", description: "Destroy CR 4 or lower.", level: 17 },
      { name: "Blessed Strikes", description: "Cantrips deal +1d8 radiant damage once per turn.", level: 14 },
      { name: "Supreme Healing", description: "Healing spells heal for maximum.", level: 17 },
    ],
    skillChoices: 2,
    skillOptions: ["History", "Insight", "Medicine", "Persuasion", "Religion"],
    multiclassRequirements: { wisdom: 13 },
    isHomebrew: false,
    icon: "✝️",
    description: "A divine champion wielding holy magic to heal allies, smite undead, and channel the power of the gods.",
    tags: ["phb", "healer", "wisdom", "support"],
  },

  // ── DRUID ──────────────────────────────────────────
  {
    id: "druid",
    name: "Druid",
    source: "Player's Handbook",
    hitDie: "1d8",
    spellcastingAbility: "wisdom",
    casterType: "full",
    proficiencies: [
      { type: "save", name: "Intelligence" },
      { type: "save", name: "Wisdom" },
      { type: "armor", name: "Light Armor" },
      { type: "armor", name: "Medium Armor" },
      { type: "armor", name: "Shields" },
      { type: "weapon", name: "Clubs, daggers, darts, javelins, maces, quarterstaffs, scimitars, sickles, slings, spears" },
      { type: "tool", name: "Herbalism Kit" },
    ],
    startingEquipment: [
      "Wooden shield or any simple weapon",
      "Scimitar or any simple melee weapon",
      "Leather armor, Explorer's Pack, and druidic focus",
    ],
    features: [
      { name: "Spellcasting", description: "You can cast prepared spells from the druid spell list using WIS as your spellcasting ability. You prepare (WIS mod + level) spells after a long rest.", level: 1 },
      { name: "Druidic", description: "You know Druidic, the secret language of druids. You can speak it and leave hidden messages.", level: 1 },
      { name: "Wild Shape", description: "As an action, transform into a beast you've seen. CR limits: 1/4 at level 2, 1/2 at 4, 1 at 8. Duration: half druid level in hours. Two uses per short or long rest.", level: 2, shortRest: true, limitedUse: { max: 2, recharge: "short_rest" } },
      { name: "Druid Circle", description: "Choose a druid circle (Land, Moon, etc.) that grants features at levels 2, 6, 10, and 14.", level: 2 },
      { name: "Ability Score Improvement", description: "Increase one ability score by 2 or two by 1.", level: 4 },
      { name: "Extra Attack", description: "Attack twice instead of once (affects wild shape forms).", level: 5 },
      { name: "Timeless Body", description: "Aging is slowed by a factor of 10.", level: 18 },
      { name: "Beast Spells", description: "Can cast spells while in wild shape.", level: 18 },
      { name: "Archdruid", description: "Unlimited Wild Shape uses. Ignore verbal/somatic/material components.", level: 20 },
    ],
    skillChoices: 2,
    skillOptions: ["Animal Handling", "Arcana", "Insight", "Medicine", "Nature", "Perception", "Religion", "Survival"],
    multiclassRequirements: { wisdom: 13 },
    isHomebrew: false,
    icon: "🌿",
    description: "A guardian of nature who commands beasts, plants, and the primal forces of the natural world.",
    tags: ["phb", "nature", "wisdom", "shapeshifter"],
  },

  // ── FIGHTER ─────────────────────────────────────────
  {
    id: "fighter",
    name: "Fighter",
    source: "Player's Handbook",
    hitDie: "1d10",
    casterType: "none",
    proficiencies: [
      { type: "save", name: "Strength" },
      { type: "save", name: "Constitution" },
      { type: "armor", name: "All Armor" },
      { type: "armor", name: "Shields" },
      { type: "weapon", name: "Simple Weapons" },
      { type: "weapon", name: "Martial Weapons" },
    ],
    startingEquipment: [
      "Chain mail or leather armor + longbow + 20 arrows",
      "A martial weapon and a shield or two martial weapons",
      "Light crossbow with 20 bolts or two handaxes",
      "Dungeoneer's Pack or Explorer's Pack",
    ],
    features: [
      { name: "Fighting Style", description: "Choose a fighting style: Archery (+2 ranged), Defense (+1 AC), Dueling (+2 damage one-handed), Great Weapon Fighting (reroll 1-2 with 2H), Protection (impose disadvantage on adjacent ally attacks), Two-Weapon Fighting (add mod to offhand).", level: 1 },
      { name: "Second Wind", description: "As a bonus action, regain 1d10 + fighter level HP. Once per short or long rest.", level: 1, shortRest: true, limitedUse: { max: 1, recharge: "short_rest" } },
      { name: "Action Surge", description: "Take one additional action on your turn. Once per short or long rest. Two uses at level 17.", level: 2, shortRest: true, limitedUse: { max: 1, recharge: "short_rest" } },
      { name: "Martial Archetype", description: "Choose a martial archetype (Champion, Battle Master, Eldritch Knight, etc.) that grants features at levels 3, 7, 10, 15, and 18.", level: 3 },
      { name: "Ability Score Improvement", description: "Increase one ability score by 2 or two by 1.", level: 4 },
      { name: "Extra Attack", description: "Attack twice instead of once when taking the Attack action.", level: 5 },
      { name: "Ability Score Improvement", description: "Increase one ability score by 2 or two by 1.", level: 6 },
      { name: "Extra Attack (2)", description: "Attack three times instead of once.", level: 11 },
      { name: "Indomitable", description: "Reroll a failed saving throw. Once per long rest.", level: 9, limitedUse: { max: 1, recharge: "long_rest" } },
      { name: "Ability Score Improvement", description: "Increase one ability score by 2 or two by 1.", level: 8 },
      { name: "Ability Score Improvement", description: "Increase one ability score by 2 or two by 1.", level: 12 },
      { name: "Ability Score Improvement", description: "Increase one ability score by 2 or two by 1.", level: 14 },
      { name: "Ability Score Improvement", description: "Increase one ability score by 2 or two by 1.", level: 16 },
      { name: "Action Surge (2)", description: "Two uses per short or long rest.", level: 17 },
      { name: "Ability Score Improvement", description: "Increase one ability score by 2 or two by 1.", level: 19 },
      { name: "Extra Attack (3)", description: "Attack four times instead of once.", level: 20 },
    ],
    skillChoices: 2,
    skillOptions: ["Acrobatics", "Animal Handling", "Athletics", "History", "Insight", "Intimidation", "Perception", "Survival"],
    multiclassRequirements: { strength: 13, dexterity: 13 },
    isHomebrew: false,
    icon: "⚔️",
    description: "A master of martial combat, skilled with all weapons and armor, unmatched in battle prowess.",
    tags: ["phb", "martial", "strength", "weapons"],
  },

  // ── MONK ───────────────────────────────────────────
  {
    id: "monk",
    name: "Monk",
    source: "Player's Handbook",
    hitDie: "1d8",
    casterType: "none",
    proficiencies: [
      { type: "save", name: "Strength" },
      { type: "save", name: "Dexterity" },
      { type: "weapon", name: "Simple Weapons" },
      { type: "weapon", name: "Shortswords" },
      { type: "tool", name: "Artisan's Tools or Musical Instrument" },
    ],
    startingEquipment: [
      "Shortsword or any simple weapon",
      "Dungeoneer's Pack or Explorer's Pack",
      "10 darts",
    ],
    features: [
      { name: "Unarmored Defense", description: "AC = 10 + DEX modifier + WIS modifier when not wearing armor or wielding a shield.", level: 1 },
      { name: "Martial Arts", description: "Unarmed strikes deal 1d4 damage. Can use DEX instead of STR for unarmed strikes and monk weapons. Can make an additional unarmed strike as a bonus action when taking the Attack action.", level: 1 },
      { name: "Ki", description: "You have ki points equal to your monk level. Spend 1 ki for Flurry of Blows, Patient Defense, or Step of the Wind.", level: 2, shortRest: true, limitedUse: { max: 2, recharge: "short_rest" } },
      { name: "Unarmored Movement", description: "Speed increases by +10ft (not wearing armor).", level: 2 },
      { name: "Monastic Tradition", description: "Choose a monastic tradition (Open Hand, Shadow, Four Elements, etc.) that grants features at levels 3, 6, 11, and 17.", level: 3 },
      { name: "Deflect Missiles", description: "Use reaction to reduce ranged weapon damage by 1d10 + DEX mod + monk level. If reduced to 0, can spend 1 ki to throw it back.", level: 3 },
      { name: "Ability Score Improvement", description: "Increase one ability score by 2 or two by 1.", level: 4 },
      { name: "Slow Fall", description: "Use reaction to reduce falling damage by 5x your monk level.", level: 4 },
      { name: "Extra Attack", description: "Attack twice instead of once with the Attack action.", level: 5 },
      { name: "Stunning Strike", description: "When you hit with a melee weapon attack, spend 1 ki. Target makes CON save or is stunned until end of your next turn.", level: 5 },
      { name: "Ki-Empowered Strikes", description: "Unarmed strikes count as magical for overcoming resistance.", level: 6 },
      { name: "Evasion", description: "When subjected to a DEX save that deals half damage, take no damage on success and half on failure.", level: 7 },
      { name: "Stillness of Mind", description: "As an action, end one effect causing charmed or frightened.", level: 7 },
      { name: "Ability Score Improvement", description: "Increase one ability score by 2 or two by 1.", level: 8 },
      { name: "Unarmored Movement Improvement", description: "Speed +15ft. Also gain slow fall without reaction at 9th level.", level: 9 },
      { name: "Purity of Body", description: "Immune to poison and disease.", level: 10 },
      { name: "Tongue of the Sun and Moon", description: "Can speak to any living creature that knows a language.", level: 13 },
      { name: "Diamond Soul", description: "Proficient in all saving throws. Can spend 1 ki to reroll a save.", level: 14 },
      { name: "Timeless Body", description: "No longer suffer the frailty of old age. Can't be aged magically.", level: 15 },
      { name: "Empty Body", description: "As an action, spend 4 ki to become invisible for 1 minute. Also resistance to all damage except force.", level: 18 },
      { name: "Perfect Self", description: "When you roll initiative and have 0 ki, regain 4 ki.", level: 20 },
    ],
    skillChoices: 2,
    skillOptions: ["Acrobatics", "Athletics", "History", "Insight", "Religion", "Stealth"],
    multiclassRequirements: { dexterity: 13, wisdom: 13 },
    isHomebrew: false,
    icon: "🥋",
    description: "A master of martial arts, channeling ki energy to achieve superhuman feats of combat and agility.",
    tags: ["phb", "martial", "dexterity", "mobility"],
  },

  // ── PALADIN ────────────────────────────────────────
  {
    id: "paladin",
    name: "Paladin",
    source: "Player's Handbook",
    hitDie: "1d10",
    spellcastingAbility: "charisma",
    casterType: "half",
    proficiencies: [
      { type: "save", name: "Wisdom" },
      { type: "save", name: "Charisma" },
      { type: "armor", name: "All Armor" },
      { type: "armor", name: "Shields" },
      { type: "weapon", name: "Simple Weapons" },
      { type: "weapon", name: "Martial Weapons" },
    ],
    startingEquipment: [
      "A martial weapon and a shield or two martial weapons",
      "Chain mail",
      "Holy symbol",
      "Priest's Pack or Explorer's Pack",
    ],
    features: [
      { name: "Divine Sense", description: "As an action, detect celestials, fiends, or undead within 60ft. Can sense consecrated/desecrated ground. Use = 1 + CHA mod per long rest.", level: 1 },
      { name: "Lay on Hands", description: "Healing pool of 5x paladin level. As an action, heal a creature you touch up to remaining pool. Also can spend 5 HP to cure one poison or disease.", level: 1 },
      { name: "Fighting Style", description: "Choose a fighting style: Defense (+1 AC), Dueling (+2 damage one-handed), Great Weapon Fighting (reroll 1-2 with 2H), Interception (reduce damage to ally), Blessed Warrior (two cantrips).", level: 2 },
      { name: "Spellcasting", description: "You can cast prepared spells from the paladin spell list using CHA as your spellcasting ability. You prepare (CHA mod + half paladin level) spells.", level: 2 },
      { name: "Divine Smite", description: "When you hit a creature, spend a spell slot to deal extra radiant damage: 2d8 for 1st level, +1d8 per level above 1st (max 5d8). Extra 1d8 against undead/fiends.", level: 2 },
      { name: "Sacred Oath", description: "Choose a sacred oath (Devotion, Ancients, Vengeance, etc.) that grants features at levels 3, 7, 15, and 20.", level: 3 },
      { name: "Channel Divinity", description: "Two Channel Divinity options from your oath. Use = 1 per short or long rest.", level: 3, shortRest: true, limitedUse: { max: 1, recharge: "short_rest" } },
      { name: "Ability Score Improvement", description: "Increase one ability score by 2 or two by 1.", level: 4 },
      { name: "Extra Attack", description: "Attack twice instead of once when taking the Attack action.", level: 5 },
      { name: "Aura of Protection", description: "Add CHA mod to all saving throws for you and allies within 10ft.", level: 6 },
      { name: "Aura of Courage", description: "Can't be frightened while conscious. Allies within 10ft gain immunity to frightened.", level: 10 },
      { name: "Improved Divine Smite", description: "All melee weapon attacks deal an extra 1d8 radiant damage.", level: 11 },
      { name: "Cleansing Touch", description: "As an action, touch a creature and end one spell affecting it. Use = CHA mod per long rest.", level: 14 },
    ],
    skillChoices: 2,
    skillOptions: ["Athletics", "Insight", "Intimidation", "Medicine", "Persuasion", "Religion"],
    multiclassRequirements: { strength: 13, charisma: 13 },
    isHomebrew: false,
    icon: "🛡️",
    description: "A holy knight sworn to a sacred oath, blending divine magic with martial prowess.",
    tags: ["phb", "martial", "charisma", "tank", "healer"],
  },

  // ── RANGER ─────────────────────────────────────────
  {
    id: "ranger",
    name: "Ranger",
    source: "Player's Handbook",
    hitDie: "1d10",
    spellcastingAbility: "wisdom",
    casterType: "half",
    proficiencies: [
      { type: "save", name: "Strength" },
      { type: "save", name: "Dexterity" },
      { type: "armor", name: "Light Armor" },
      { type: "armor", name: "Medium Armor" },
      { type: "armor", name: "Shields" },
      { type: "weapon", name: "Simple Weapons" },
      { type: "weapon", name: "Martial Weapons" },
    ],
    startingEquipment: [
      "Scale mail or leather armor",
      "Two shortswords or two simple melee weapons",
      "Longbow with 20 arrows",
      "Dungeoneer's Pack or Explorer's Pack",
    ],
    features: [
      { name: "Favored Enemy", description: "Choose one enemy type (aberration, beast, celestial, construct, dragon, elemental, fey, fiend, giant, monstrosity, ooze, plant, undead). Advantage on Survival and Int checks to track/know them. Learn one language they speak.", level: 1 },
      { name: "Natural Explorer", description: "Choose one terrain type (arctic, coast, desert, forest, grassland, mountain, swamp, Underdark). Your travel benefits in that terrain: difficult terrain doesn't slow group, alert to danger, stealth while moving, foraging finds food, tracking creatures reveals exact numbers.", level: 1 },
      { name: "Fighting Style", description: "Choose a fighting style: Archery (+2 ranged), Defense (+1 AC), Dueling (+2 damage one-handed), Two-Weapon Fighting (add mod to offhand).", level: 2 },
      { name: "Spellcasting", description: "You can cast known spells from the ranger spell list using WIS as your spellcasting ability. You know 2 spells at level 2, gaining more at higher levels.", level: 2 },
      { name: "Primeval Awareness", description: "Spend 1 minute to sense favored enemies within 1 mile (6 miles in favored terrain).", level: 3 },
      { name: "Ranger Archetype", description: "Choose a ranger archetype (Hunter, Beast Master, Gloom Stalker, etc.) that grants features at levels 3, 7, 11, and 15.", level: 3 },
      { name: "Ability Score Improvement", description: "Increase one ability score by 2 or two by 1.", level: 4 },
      { name: "Extra Attack", description: "Attack twice instead of once when taking the Attack action.", level: 5 },
      { name: "Fleet of Foot", description: "Speed increases by 5ft in favored terrain.", level: 8 },
      { name: "Hide in Plain Sight", description: "Can spend 1 minute camouflaging. Gain +10 to Stealth checks while staying still.", level: 10 },
      { name: "Vanish", description: "As a bonus action, hide. Cannot be tracked by nonmagical means.", level: 14 },
      { name: "Feral Senses", description: "Can sense invisible creatures within 30ft. No disadvantage on attacks against creatures you can't see.", level: 18 },
      { name: "Foe Slayer", description: "Add WIS mod to attack or damage rolls against favored enemies.", level: 20 },
    ],
    skillChoices: 3,
    skillOptions: ["Animal Handling", "Athletics", "Insight", "Investigation", "Nature", "Perception", "Stealth", "Survival"],
    multiclassRequirements: { dexterity: 13, wisdom: 13 },
    isHomebrew: false,
    icon: "🏹",
    description: "A cunning hunter and natural explorer, tracking foes across the wilds with deadly precision.",
    tags: ["phb", "martial", "dexterity", "nature"],
  },

  // ── ROGUE ──────────────────────────────────────────
  {
    id: "rogue",
    name: "Rogue",
    source: "Player's Handbook",
    hitDie: "1d8",
    casterType: "none",
    proficiencies: [
      { type: "save", name: "Dexterity" },
      { type: "save", name: "Intelligence" },
      { type: "armor", name: "Light Armor" },
      { type: "weapon", name: "Simple Weapons" },
      { type: "weapon", name: "Hand Crossbows" },
      { type: "weapon", name: "Longswords" },
      { type: "weapon", name: "Rapiers" },
      { type: "weapon", name: "Shortswords" },
      { type: "tool", name: "Thieves' Tools" },
    ],
    startingEquipment: [
      "Rapier or shortsword",
      "Shortbow and 20 arrows or shortsword",
      "Burglar's Pack, Dungeoneer's Pack, or Explorer's Pack",
      "Leather armor, two daggers, and thieves' tools",
    ],
    features: [
      { name: "Expertise", description: "Double your proficiency bonus for two skills of your choice (or thieves' tools).", level: 1 },
      { name: "Sneak Attack", description: "Once per turn, deal extra 1d6 damage (scales to 10d6) with a finesse/ranged weapon when you have advantage or an ally is within 5ft of the target.", level: 1 },
      { name: "Thieves' Cant", description: "A secret language of thieves and criminals. Can hide messages in seemingly normal conversation.", level: 1 },
      { name: "Cunning Action", description: "Dash, Disengage, or Hide as a bonus action.", level: 2 },
      { name: "Roguish Archetype", description: "Choose a roguish archetype (Thief, Assassin, Arcane Trickster, etc.) that grants features at levels 3, 9, 13, and 17.", level: 3 },
      { name: "Ability Score Improvement", description: "Increase one ability score by 2 or two by 1.", level: 4 },
      { name: "Uncanny Dodge", description: "When hit by an attacker you can see, use reaction to halve damage.", level: 5 },
      { name: "Expertise (2)", description: "Double proficiency for two more skills.", level: 6 },
      { name: "Evasion", description: "When subjected to DEX save that deals half damage, take no damage on success and half on failure.", level: 7 },
      { name: "Reliable Talent", description: "Any ability check you're proficient in, a roll of 9 or less counts as 10.", level: 11 },
      { name: "Blindsense", description: "If you can hear, you know the location of hidden/invisible creatures within 10ft.", level: 14 },
      { name: "Slippery Mind", description: "Proficiency in Wisdom saving throws.", level: 15 },
      { name: "Elusive", description: "No attack roll has advantage against you while you're not incapacitated.", level: 18 },
      { name: "Stroke of Luck", description: "If you miss an attack or fail an ability check, you can treat the roll as a 20. Once per short or long rest.", level: 20, shortRest: true, limitedUse: { max: 1, recharge: "short_rest" } },
    ],
    skillChoices: 4,
    skillOptions: ["Acrobatics", "Athletics", "Deception", "Insight", "Intimidation", "Investigation", "Perception", "Performance", "Persuasion", "Sleight of Hand", "Stealth"],
    multiclassRequirements: { dexterity: 13 },
    isHomebrew: false,
    icon: "🗡️",
    description: "A cunning infiltrator and master of stealth, striking from the shadows with deadly precision.",
    tags: ["phb", "martial", "dexterity", "stealth"],
  },

  // ── SORCERER ───────────────────────────────────────
  {
    id: "sorcerer",
    name: "Sorcerer",
    source: "Player's Handbook",
    hitDie: "1d6",
    spellcastingAbility: "charisma",
    casterType: "full",
    proficiencies: [
      { type: "save", name: "Constitution" },
      { type: "save", name: "Charisma" },
      { type: "weapon", name: "Daggers, darts, slings, quarterstaffs, light crossbows" },
    ],
    startingEquipment: [
      "Light crossbow with 20 bolts or any simple weapon",
      "Component pouch or arcane focus",
      "Dungeoneer's Pack or Explorer's Pack",
      "Two daggers",
    ],
    features: [
      { name: "Spellcasting", description: "You know cantrips and spells from the sorcerer spell list using CHA as your spellcasting ability. You know 4 cantrips and (level + CHA mod) spells. You have sorcery points equal to your sorcerer level.", level: 1 },
      { name: "Sorcerous Origin", description: "Choose a sorcerous origin (Draconic Bloodline, Wild Magic, etc.) that grants features at levels 1, 6, 14, and 18.", level: 1 },
      { name: "Font of Magic", description: "You have sorcery points equal to your sorcerer level (replenished on long rest). Convert spell slots to points or points to slots at bonus action speed.", level: 2, limitedUse: { max: 2, recharge: "long_rest" } },
      { name: "Metamagic", description: "Choose 2 metamagic options at level 3. Quickened Spell (1 SP, bonus action cast), Twinned Spell (SP = slot level, target another creature), Subtle Spell (1 SP, no components), Careful Spell (1 SP, allies auto-save), Empowered Spell (1 SP, reroll dice), Distant Spell (1 SP, double range), Extended Spell (1 SP, double duration), Heightened Spell (3 SP, target has disadvantage on save).", level: 3 },
      { name: "Ability Score Improvement", description: "Increase one ability score by 2 or two by 1.", level: 4 },
      { name: "Metamagic (2)", description: "Learn a third metamagic option.", level: 10 },
      { name: "Metamagic (3)", description: "Learn a fourth metamagic option.", level: 17 },
    ],
    skillChoices: 2,
    skillOptions: ["Arcana", "Deception", "Insight", "Intimidation", "Persuasion", "Religion"],
    multiclassRequirements: { charisma: 13 },
    isHomebrew: false,
    icon: "🔮",
    description: "A wielder of innate arcane magic, bending spells to their will through sheer force of personality.",
    tags: ["phb", "caster", "charisma", "arcane"],
  },

  // ── WARLOCK ────────────────────────────────────────
  {
    id: "warlock",
    name: "Warlock",
    source: "Player's Handbook",
    hitDie: "1d8",
    spellcastingAbility: "charisma",
    casterType: "pact",
    proficiencies: [
      { type: "save", name: "Wisdom" },
      { type: "save", name: "Charisma" },
      { type: "armor", name: "Light Armor" },
      { type: "weapon", name: "Simple Weapons" },
    ],
    startingEquipment: [
      "Light crossbow with 20 bolts or any simple weapon",
      "Component pouch or arcane focus",
      "Scholar's Pack or Dungeoneer's Pack",
      "Leather armor, any simple weapon, and two daggers",
    ],
    features: [
      { name: "Otherworldly Patron", description: "Choose a patron (Archfey, Fiend, Great Old One, etc.) that grants features at levels 1, 6, 10, and 14.", level: 1 },
      { name: "Pact Magic", description: "Cast known spells using pact magic slots. All slots are of the same level and recharge on short rest. 1 slot at level 1, 2 at level 2, 3 at level 11.", level: 1 },
      { name: "Eldritch Invocations", description: "Learn eldritch invocations from a list of arcane secrets. Examples: Agonizing Blast (add CHA to eldritch blast), Devil's Sight (120ft darkvision in magical darkness), Repelling Blast (push 10ft per blast hit).", level: 2 },
      { name: "Pact Boon", description: "Choose a pact boon at level 3: Pact of the Chain (improved familiar), Pact of the Blade (magic weapon bond), Pact of the Tome (bonus cantrips and rituals).", level: 3 },
      { name: "Ability Score Improvement", description: "Increase one ability score by 2 or two by 1.", level: 4 },
      { name: "Mystic Arcanum", description: "Learn one spell of 6th level (at 11th), 7th level (13th), 8th level (15th), 9th level (17th). Recharge on long rest.", level: 11 },
      { name: "Eldritch Master", description: "Regain all pact magic slots after 1 minute of meditation. Once per long rest.", level: 20, limitedUse: { max: 1, recharge: "long_rest" } },
    ],
    skillChoices: 2,
    skillOptions: ["Arcana", "Deception", "History", "Intimidation", "Investigation", "Nature", "Religion"],
    multiclassRequirements: { charisma: 13 },
    isHomebrew: false,
    icon: "🌀",
    description: "A wielder of arcane power granted by an otherworldly patron, trading service for forbidden knowledge.",
    tags: ["phb", "caster", "charisma", "pact"],
  },

  // ── WIZARD ─────────────────────────────────────────
  {
    id: "wizard",
    name: "Wizard",
    source: "Player's Handbook",
    hitDie: "1d6",
    spellcastingAbility: "intelligence",
    casterType: "full",
    proficiencies: [
      { type: "save", name: "Intelligence" },
      { type: "save", name: "Wisdom" },
      { type: "weapon", name: "Daggers, darts, slings, quarterstaffs, light crossbows" },
    ],
    startingEquipment: [
      "Quarterstaff or dagger",
      "Component pouch or arcane focus",
      "Scholar's Pack or Explorer's Pack",
      "Spellbook",
    ],
    features: [
      { name: "Spellcasting", description: "You cast prepared spells from your spellbook using INT as your spellcasting ability. You prepare (INT mod + level) spells after a long rest. Your spellbook starts with 6 1st-level spells and can add more from scrolls or other books.", level: 1 },
      { name: "Arcane Recovery", description: "Once per day during a short rest, recover spell slots with combined level equal to half your wizard level (rounded up, max 5th level).", level: 1, shortRest: true, limitedUse: { max: 1, recharge: "long_rest" } },
      { name: "Arcane Tradition", description: "Choose an arcane tradition (Abjuration, Conjuration, Divination, Enchantment, Evocation, Illusion, Necromancy, Transmutation, etc.) that grants features at levels 2, 6, 10, and 14.", level: 2 },
      { name: "Ability Score Improvement", description: "Increase one ability score by 2 or two by 1.", level: 4 },
      { name: "Spell Mastery", description: "Choose two 1st-level and two 2nd-level wizard spells from your spellbook. Can cast them at their lowest level without spending a slot.", level: 18 },
      { name: "Signature Spells", description: "Choose two 3rd-level spells from your spellbook. Always considered prepared and can cast them once each without a spell slot per long rest.", level: 20 },
    ],
    skillChoices: 2,
    skillOptions: ["Arcana", "History", "Insight", "Investigation", "Medicine", "Religion"],
    multiclassRequirements: { intelligence: 13 },
    isHomebrew: false,
    icon: "📜",
    description: "A scholarly practitioner of arcane magic, mastering spells through rigorous study and a personal spellbook.",
    tags: ["phb", "caster", "intelligence", "arcane"],
  },

  // ── ARTIFICER ──────────────────────────────────────
  {
    id: "artificer",
    name: "Artificer",
    source: "Tasha's Cauldron of Everything",
    hitDie: "1d8",
    spellcastingAbility: "intelligence",
    casterType: "half",
    proficiencies: [
      { type: "save", name: "Constitution" },
      { type: "save", name: "Intelligence" },
      { type: "armor", name: "Light Armor" },
      { type: "armor", name: "Medium Armor" },
      { type: "armor", name: "Shields" },
      { type: "weapon", name: "Simple Weapons" },
      { type: "tool", name: "Thieves' Tools" },
      { type: "tool", name: "Artisan's Tools" },
    ],
    startingEquipment: [
      "Light crossbow with 20 bolts or any simple weapon",
      "Scale mail or leather armor",
      "Thieves' tools and dungeoneer's pack",
      "Two daggers",
    ],
    features: [
      { name: "Spellcasting", description: "You cast prepared spells from the artificer spell list using INT as your spellcasting ability. You prepare (INT mod + half artificer level) spells after a long rest.", level: 1 },
      { name: "Magical Tinkering", description: "Touch a Tiny nonmagical object to imbue it with minor magic: shed light, record a message, emit odor/sound, or show a static image. Works on up to INT mod objects at a time.", level: 1 },
      { name: "Infuse Item", description: "Learn infusions (magical item recipes). You can have up to (INT mod + half artificer level) infused items active at once. Items become nonmagical if you die or after 30 days.", level: 2 },
      { name: "Artificer Specialist", description: "Choose a specialist (Alchemist, Artillerist, Battle Smith, Armorer) that grants features at levels 3, 5, 9, and 15.", level: 3 },
      { name: "Ability Score Improvement", description: "Increase one ability score by 2 or two by 1.", level: 4 },
      { name: "Extra Attack", description: "Attack twice instead of once with the Attack action (Battle Smith only).", level: 5 },
      { name: "Flash of Genius", description: "When you or a creature within 30ft makes an ability check or save, use reaction to add INT mod. Use = INT mod per long rest.", level: 7, limitedUse: { max: 5, recharge: "long_rest" } },
      { name: "Magic Item Adept", description: "Can attune to up to 4 magic items. Craft magic items in quarter the time.", level: 10 },
      { name: "Spell-Storing Item", description: "Store a 2nd-level artificer spell in a weapon, tool, or other object. Up to (2 x INT mod) uses. Anyone holding it can cast the spell.", level: 11 },
      { name: "Magic Item Savant", description: "Ignore all class, race, spell, and level requirements on magic items. Attune up to 5 items.", level: 14 },
      { name: "Magic Item Master", description: "Attune up to 6 magic items.", level: 18 },
      { name: "Soul of Artifice", description: "+1 to all saving throws per attuned item. When reduced to 0 HP, can use reaction to end infusion and drop to 1 HP instead.", level: 20 },
    ],
    skillChoices: 2,
    skillOptions: ["Arcana", "History", "Investigation", "Medicine", "Nature", "Perception", "Sleight of Hand"],
    multiclassRequirements: { intelligence: 13 },
    isHomebrew: false,
    icon: "⚙️",
    description: "A master inventor who imbues items with magic, creating wondrous devices and arcane gadgets.",
    tags: ["tasha", "caster", "intelligence", "support"],
  },

  // ── BLOOD HUNTER ───────────────────────────────────
  {
    id: "blood-hunter",
    name: "Blood Hunter",
    source: "Critical Role (Matt Mercer Homebrew)",
    hitDie: "1d10",
    casterType: "none",
    proficiencies: [
      { type: "save", name: "Dexterity" },
      { type: "save", name: "Intelligence" },
      { type: "armor", name: "Light Armor" },
      { type: "armor", name: "Medium Armor" },
      { type: "armor", name: "Shields" },
      { type: "weapon", name: "Simple Weapons" },
      { type: "weapon", name: "Martial Weapons" },
    ],
    startingEquipment: [
      "A martial weapon and a shield or two martial weapons",
      "Leather armor or scale mail",
      "Hand crossbow with 20 bolts or any simple weapon",
      "Dungeoneer's Pack or Explorer's Pack",
    ],
    features: [
      { name: "Hunter's Bane", description: "When you hit a creature with a weapon attack, you can brand it as your quarry. You deal +1d4 damage to it. Once per turn. Also advantage on tracking and Survival checks against your quarry.", level: 1 },
      { name: "Blood Maledict", description: "As a bonus action, curse a creature. Use hemocraft die (starts at d4, grows to d10). Effects include: Marked (attack rolls), Fallen Puppet (reaction to drop weapon), Binding (speed reduction). Take damage equal to hemocraft die when using. Once per short rest.", level: 1, shortRest: true, limitedUse: { max: 1, recharge: "short_rest" } },
      { name: "Fighting Style", description: "Choose a fighting style: Archery, Defense, Dueling, Great Weapon Fighting, Two-Weapon Fighting, Mariner (+1 AC, climb/swim speed), or Tunnel Fighter (reaction attacks).", level: 2 },
      { name: "Primal Rite", description: "As a bonus action, imbue your weapon with hemocraft elemental energy. Deal +1d4 fire/cold/lightning/psychic damage (scales to 1d6 at 5th, 1d8 at 11th). Take damage equal to hemocraft die when activating.", level: 3 },
      { name: "Blood Hunter Order", description: "Choose an order: Order of the Ghostslayer (extra damage to undead, ethereal step), Order of the Lycan (lycanthropic transformation + claws), Order of the Mutant (mutagenic concoctions), Order of the Profane Soul (pact magic).", level: 3 },
      { name: "Ability Score Improvement", description: "Increase one ability score by 2 or two by 1.", level: 4 },
      { name: "Extra Attack", description: "Attack twice instead of once when taking the Attack action.", level: 5 },
      { name: "Brand of Castigation", description: "Your quarry is marked by arcane sigils. Deal +1d6 damage. They shed dim light. When they attack another creature, you can use reaction to deal half your BH level in damage.", level: 7 },
      { name: "Dark Augmentation", description: "Gain darkvision 60ft. Resistance to necrotic and psychic damage. Can't have your HP maximum reduced.", level: 9 },
      { name: "Brand of Tethering", description: "When brand deals damage to target, they can't teleport and their speed is halved until end of your next turn.", level: 13 },
      { name: "Sanguine Mastery", description: "You no longer take damage from your Blood Maledict and Primal Rite. Your hemocraft die becomes a d10.", level: 15 },
      { name: "Grim Psychometry", description: "Gain insights from blood and injuries. When examining a corpse or blood sample, can learn how creature died, who killed it, and their emotional state. Advantage on Investigation.", level: 18 },
    ],
    skillChoices: 3,
    skillOptions: ["Acrobatics", "Arcana", "Athletics", "History", "Insight", "Investigation", "Medicine", "Perception", "Survival"],
    multiclassRequirements: { dexterity: 13, intelligence: 13 },
    isHomebrew: false,
    icon: "🩸",
    description: "A dark hunter who harnesses blood magic to hunt supernatural threats, sacrificing vitality for power.",
    tags: ["critical-role", "martial", "dexterity", "dark"],
  },
];

// ── Helper Functions ────────────────────────────────────────────

export function getClassById(id: string): ClassDefinition | undefined {
  return SRD_CLASSES.find(c => c.id === id);
}

export function getClassByName(name: string): ClassDefinition | undefined {
  return SRD_CLASSES.find(c => c.name.toLowerCase() === name.toLowerCase());
}

export function getClassNames(): string[] {
  return SRD_CLASSES.map(c => c.name);
}

export function getCasterType(className: string): "full" | "half" | "third" | "pact" | "none" {
  const cls = getClassByName(className);
  return cls?.casterType || "none";
}

export function getSpellcastingAbility(className: string): string | undefined {
  const cls = getClassByName(className);
  return cls?.spellcastingAbility;
}

export function isCaster(className: string): boolean {
  const type = getCasterType(className);
  return type !== "none";
}

export function getClassHitDie(className: string): string {
  const cls = getClassByName(className);
  return cls?.hitDie || "1d8";
}
