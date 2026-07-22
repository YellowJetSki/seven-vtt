/**
 * STᚱ VTT — SRD Background Definitions (D&D 5.5e)
 *
 * 13 official backgrounds from the 2024 Player's Handbook,
 * each providing skill proficiencies, tool proficiencies,
 * languages, equipment, and a starting feature.
 */
export interface BackgroundDef {
  id: string;
  name: string;
  source: string;
  skillProficiencies: string[];
  toolProficiencies: string[];
  languages: number; // number of bonus languages (0-2)
  equipment: string[];
  featureName: string;
  featureDescription: string;
  suggestedCharacteristics: string[];
  icon: string;
  tags: string[];
}

export const SRD_BACKGROUNDS: BackgroundDef[] = [
  {
    id: "acolyte",
    name: "Acolyte",
    source: "Player's Handbook",
    skillProficiencies: ["insight", "religion"],
    toolProficiencies: [],
    languages: 2,
    equipment: ["Holy Symbol", "Prayer Book", "5 sticks of incense", "Vestments", "Common Clothes", "Belt Pouch (15 gp)"],
    featureName: "Shelter of the Faithful",
    featureDescription: "You and your companions can expect free healing and care at a temple of your faith. You can also request aid from fellow worshippers.",
    suggestedCharacteristics: ["Devoted to a higher power", "Humble servant of the divine", "Seeker of ancient wisdom"],
    icon: "🙏",
    tags: ["phb", "core", "divine"],
  },
  {
    id: "artisan",
    name: "Artisan",
    source: "Player's Handbook",
    skillProficiencies: ["investigation", "persuasion"],
    toolProficiencies: ["Artisan's Tools (any one)"],
    languages: 1,
    equipment: ["Artisan's Tools (1 type)", "Set of traveler's clothes", "Letter of introduction", "Belt Pouch (15 gp)"],
    featureName: "Artisan's Guild Membership",
    featureDescription: "You are a member of an artisan's guild. You can request lodging and food at guild halls, and you have access to crafting resources.",
    suggestedCharacteristics: ["Pride in your craft", "Resourceful problem-solver", "Connected to trade networks"],
    icon: "🔧",
    tags: ["phb", "core", "trade"],
  },
  {
    id: "charlatan",
    name: "Charlatan",
    source: "Player's Handbook",
    skillProficiencies: ["deception", "sleightOfHand"],
    toolProficiencies: ["Disguise Kit", "Forgery Kit"],
    languages: 0,
    equipment: ["Set of fine clothes", "Disguise Kit", "Forgery Kit", "False identity papers", "Belt Pouch (15 gp)"],
    featureName: "False Identity",
    featureDescription: "You have created a second identity that includes documentation, established acquaintances, and disguises that allow you to assume that persona.",
    suggestedCharacteristics: ["Master of deception", "Always has a plan B", "Trusts no one fully"],
    icon: "🎭",
    tags: ["phb", "core", "rogue"],
  },
  {
    id: "criminal",
    name: "Criminal",
    source: "Player's Handbook",
    skillProficiencies: ["stealth", "deception"],
    toolProficiencies: ["Thieves' Tools", "Gaming Set (any one)"],
    languages: 0,
    equipment: ["Crowbar", "Set of dark common clothes", "Hooded lantern", "Thieves' Tools", "Belt Pouch (15 gp)"],
    featureName: "Criminal Contact",
    featureDescription: "You have a reliable and trustworthy contact who acts as a liaison to the criminal underworld. You can get messages to and from this contact.",
    suggestedCharacteristics: ["Survival of the fittest", "Loyal to the crew", "Always watching for an angle"],
    icon: "🔪",
    tags: ["phb", "core", "underworld"],
  },
  {
    id: "entertainer",
    name: "Entertainer",
    source: "Player's Handbook",
    skillProficiencies: ["acrobatics", "performance"],
    toolProficiencies: ["Disguise Kit", "Musical Instrument (any one)"],
    languages: 0,
    equipment: ["Musical Instrument (1 type)", "Costume", "Set of fine clothes", "Mirror", "Face paint", "Belt Pouch (15 gp)"],
    featureName: "By Popular Demand",
    featureDescription: "You can always find a place to perform, and you receive free lodging and food at inns where you perform.",
    suggestedCharacteristics: ["Loves the spotlight", "Free-spirited artist", "Collector of stories"],
    icon: "🎭",
    tags: ["phb", "core", "performance"],
  },
  {
    id: "farmer",
    name: "Farmer",
    source: "Player's Handbook",
    skillProficiencies: ["animalHandling", "nature"],
    toolProficiencies: ["Carpenter's Tools", "Vehicles (Land)"],
    languages: 0,
    equipment: ["Common clothes", "Rope (50ft)", "Waterskin", "Net", "Gardening tools", "Belt Pouch (10 gp)"],
    featureName: "Harvest Home",
    featureDescription: "You know the land and can find food and shelter in rural areas. Farmers and shepherds are inclined to help you.",
    suggestedCharacteristics: ["Hard-working and practical", "Connected to the land", "Honest and straightforward"],
    icon: "🌾",
    tags: ["phb", "core", "rural"],
  },
  {
    id: "guard",
    name: "Guard",
    source: "Player's Handbook",
    skillProficiencies: ["athletics", "perception"],
    toolProficiencies: ["Vehicles (Land)"],
    languages: 0,
    equipment: ["Spear", "Shield", "Uniform", "Horn", "Manacles", "Belt Pouch (10 gp)"],
    featureName: "Military Rank",
    featureDescription: "Your service in a guard or military organization gives you a rank and influence. Fellow soldiers respect your authority.",
    suggestedCharacteristics: ["Disciplined and vigilant", "Protective of others", "Follows the chain of command"],
    icon: "🛡️",
    tags: ["phb", "core", "martial"],
  },
  {
    id: "guide",
    name: "Guide",
    source: "Player's Handbook",
    skillProficiencies: ["survival", "stealth"],
    toolProficiencies: ["Herbalism Kit", "Vehicles (Land)"],
    languages: 1,
    equipment: ["Walking stick", "Tent", "Bedroll", "Waterskin", "Map case", "Belt Pouch (10 gp)"],
    featureName: "Wilderness Expert",
    featureDescription: "You can find food and fresh water for yourself and up to five other people each day, provided the land offers berries, small game, water, and so forth.",
    suggestedCharacteristics: ["Self-reliant and practical", "Knows the wilds intimately", "Respects nature's balance"],
    icon: "🧭",
    tags: ["phb", "core", "wilderness"],
  },
  {
    id: "merchant",
    name: "Merchant",
    source: "Player's Handbook",
    skillProficiencies: ["persuasion", "insight"],
    toolProficiencies: [],
    languages: 1,
    equipment: ["Mule", "Cart", "Goods (50 gp value)", "Scale", "Merchant's scale", "Belt Pouch (50 gp)"],
    featureName: "Professional Network",
    featureDescription: "You know merchants throughout the region. You can always find a buyer or seller for any legal good, and you hear market rumors.",
    suggestedCharacteristics: ["Wheels and deals", "Knows the value of everything", "Network of contacts"],
    icon: "⚖️",
    tags: ["phb", "core", "trade"],
  },
  {
    id: "noble",
    name: "Noble",
    source: "Player's Handbook",
    skillProficiencies: ["persuasion", "history"],
    toolProficiencies: ["Gaming Set (any one)", "Musical Instrument (any one)"],
    languages: 1,
    equipment: ["Set of fine clothes", "Signet ring", "Scroll of pedigree", "Purse (25 gp)"],
    featureName: "Position of Privilege",
    featureDescription: "You are welcomed in high society. People of wealth and power tend to assume you belong among them.",
    suggestedCharacteristics: ["Born to privilege", "Well-educated", "Acutely aware of social rank"],
    icon: "👑",
    tags: ["phb", "core", "aristocrat"],
  },
  {
    id: "sage",
    name: "Sage",
    source: "Player's Handbook",
    skillProficiencies: ["arcana", "history"],
    toolProficiencies: [],
    languages: 2,
    equipment: ["Bottle of ink", "Ink pen", "Parchment (10 sheets)", "Book (lore)", "Common clothes", "Belt Pouch (10 gp)"],
    featureName: "Researcher",
    featureDescription: "You can usually recall obscure lore or find someone who knows it. Libraries and universities grant you access to their collections.",
    suggestedCharacteristics: ["Insatiably curious", "Keeper of forgotten knowledge", "Values truth above all"],
    icon: "📜",
    tags: ["phb", "core", "academic"],
  },
  {
    id: "sailor",
    name: "Sailor",
    source: "Player's Handbook",
    skillProficiencies: ["athletics", "perception"],
    toolProficiencies: ["Navigator's Tools", "Vehicles (Water)"],
    languages: 0,
    equipment: ["Rope (50ft)", "Climber's kit", "Common clothes", "Belt Pouch (10 gp)"],
    featureName: "Ship's Passage",
    featureDescription: "You can arrange free passage for yourself and your companions on a ship. Captains who've sailed with you will likely help.",
    suggestedCharacteristics: ["Weather-beaten and hardy", "Superstitious at sea", "Loyal crewmate"],
    icon: "⛵",
    tags: ["phb", "core", "maritime"],
  },
  {
    id: "soldier",
    name: "Soldier",
    source: "Player's Handbook",
    skillProficiencies: ["athletics", "intimidation"],
    toolProficiencies: ["Gaming Set (any one)", "Vehicles (Land)"],
    languages: 0,
    equipment: ["Insignia of rank", "Trophy (from defeated enemy)", "Common clothes", "Playing cards or dice", "Belt Pouch (10 gp)"],
    featureName: "Military Rank",
    featureDescription: "Your military service grants you a rank and recognition. Soldiers and guards respect your authority and may defer to you.",
    suggestedCharacteristics: ["Disciplined and honorable", "Bonds forged in battle", "Carries the weight of command"],
    icon: "⚔️",
    tags: ["phb", "core", "martial"],
  },
];

export function getBackgroundById(id: string): BackgroundDef | undefined {
  return SRD_BACKGROUNDS.find((b) => b.id === id);
}

export function getBackgroundByName(name: string): BackgroundDef | undefined {
  return SRD_BACKGROUNDS.find((b) => b.name.toLowerCase() === name.toLowerCase());
}
