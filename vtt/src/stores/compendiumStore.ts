import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { HomebrewItem, HomebrewSpell, HomebrewFeat } from "@/types/homebrew";

// ── SRD Seed Data ─────────────────────────────────────────────
const SRD_ITEMS: HomebrewItem[] = [
  { id: "srd_potion_healing", name: "Potion of Healing", category: "potion", rarity: "common", description: "Restores 2d4+2 hit points.", requiresAttunement: false, weight: 0.5, value: 50, isCursed: false, tags: ["consumable", "healing"], source: "SRD", isHomebrew: false, createdAt: 0, updatedAt: 0 },
  { id: "srd_ring_protection", name: "Ring of Protection", category: "ring", rarity: "rare", description: "Grants +1 to AC and saving throws.", requiresAttunement: true, weight: 0.1, value: 5000, isCursed: false, tags: ["defense", "ac"], source: "SRD", isHomebrew: false, createdAt: 0, updatedAt: 0 },
  { id: "srd_cloak_elvenkind", name: "Cloak of Elvenkind", category: "wondrous", rarity: "uncommon", description: "You have advantage on Stealth checks while you wear this cloak.", requiresAttunement: true, weight: 1, value: 2000, isCursed: false, tags: ["stealth", "fey"], source: "SRD", isHomebrew: false, createdAt: 0, updatedAt: 0 },
  { id: "srd_bag_holding", name: "Bag of Holding", category: "wondrous", rarity: "uncommon", description: "This bag has an interior space larger than its exterior dimensions. Holds up to 500 lbs.", requiresAttunement: false, weight: 15, value: 4000, isCursed: false, tags: ["storage", "utility"], source: "SRD", isHomebrew: false, createdAt: 0, updatedAt: 0 },
  { id: "srd_sword_vengeance", name: "Sword of Vengeance", category: "weapon", rarity: "rare", description: "Cursed longsword. You gain +1 to attack and damage, but you cannot willingly end combat.", requiresAttunement: true, weight: 3, value: 1000, isCursed: true, curseDetails: "You cannot end combat willingly", tags: ["weapon", "cursed"], source: "SRD", isHomebrew: false, createdAt: 0, updatedAt: 0 },
  { id: "srd_wand_magic_missiles", name: "Wand of Magic Missiles", category: "wand", rarity: "uncommon", description: "Has 7 charges. Expends 1 charge to cast Magic Missile (3 missiles). Regains 1d6+1 charges daily at dawn.", charges: 7, chargesMax: 7, chargesRecharge: "dawn", requiresAttunement: false, weight: 1, value: 2500, isCursed: false, tags: ["wand", "evocation", "ranged"], source: "SRD", isHomebrew: false, createdAt: 0, updatedAt: 0 },
  { id: "srd_plate_armor", name: "Plate Armor", category: "armor", rarity: "common", description: "AC 18. Requires 15 Str. Disadvantage on Stealth.", requiresAttunement: false, weight: 65, value: 1500, isCursed: false, tags: ["heavy", "armor"], source: "SRD", isHomebrew: false, createdAt: 0, updatedAt: 0 },
  { id: "srd_boots_elvenkind", name: "Boots of Elvenkind", category: "wondrous", rarity: "uncommon", description: "Your steps make no sound. You have advantage on Stealth checks that rely on moving silently.", requiresAttunement: false, weight: 1, value: 1500, isCursed: false, tags: ["stealth", "movement"], source: "SRD", isHomebrew: false, createdAt: 0, updatedAt: 0 },
  { id: "srd_bracers_defense", name: "Bracers of Defense", category: "wondrous", rarity: "rare", description: "Grants +2 to AC while you wear no armor and no shield.", requiresAttunement: true, weight: 1, value: 6000, isCursed: false, tags: ["ac", "defense"], source: "SRD", isHomebrew: false, createdAt: 0, updatedAt: 0 },
  { id: "srd_amulet_health", name: "Amulet of Health", category: "wondrous", rarity: "rare", description: "Your Constitution score is 19 while you wear this amulet.", requiresAttunement: true, weight: 0.5, value: 8000, isCursed: false, tags: ["constitution", "ability"], source: "SRD", isHomebrew: false, createdAt: 0, updatedAt: 0 },
];

const SRD_SPELLS: HomebrewSpell[] = [
  { id: "srd_spell_magic_missile", name: "Magic Missile", level: 1, school: "Evocation", castingTime: "1 action", ritual: false, components: ["V", "S"], concentration: false, duration: "Instantaneous", range: "120 feet", classes: ["Sorcerer", "Wizard"], description: "You create three glowing darts of magical force. Each hits a creature you can see for 1d4+1 force damage. All darts strike simultaneously. At higher levels: +1 dart per slot level above 1st.", isHomebrew: false, source: "SRD", tags: ["damage", "force"], createdAt: 0, updatedAt: 0 },
  { id: "srd_spell_shield", name: "Shield", level: 1, school: "Abjuration", castingTime: "1 reaction", ritual: false, components: ["V", "S"], concentration: false, duration: "1 round", range: "Self", classes: ["Sorcerer", "Wizard"], description: "An invisible barrier of magical force appears, granting +5 AC until the start of your next turn, including against the triggering attack.", isHomebrew: false, source: "SRD", tags: ["defense", "reaction"], createdAt: 0, updatedAt: 0 },
  { id: "srd_spell_fireball", name: "Fireball", level: 3, school: "Evocation", castingTime: "1 action", ritual: false, components: ["V", "S", "M"], materialComponent: "a tiny ball of bat guano and sulfur", concentration: false, duration: "Instantaneous", range: "150 feet", area: "20-foot-radius sphere", classes: ["Sorcerer", "Wizard"], description: "Each creature in a 20-foot-radius sphere centered on a point within range makes a Dex save. On failure: 8d6 fire damage, half on success. At higher levels: +1d6 per slot level above 3rd.", isHomebrew: false, source: "SRD", tags: ["damage", "fire", "aoe"], createdAt: 0, updatedAt: 0 },
  { id: "srd_spell_cure_wounds", name: "Cure Wounds", level: 1, school: "Evocation", castingTime: "1 action", ritual: false, components: ["V", "S"], concentration: false, duration: "Instantaneous", range: "Touch", classes: ["Cleric", "Druid", "Paladin", "Ranger"], description: "A creature you touch regains 1d8 + spellcasting ability modifier hit points. At higher levels: +1d8 per slot level above 1st.", isHomebrew: false, source: "SRD", tags: ["healing", "touch"], createdAt: 0, updatedAt: 0 },
  { id: "srd_spell_bless", name: "Bless", level: 1, school: "Enchantment", castingTime: "1 action", ritual: false, components: ["V", "S", "M"], materialComponent: "a sprinkle of holy water", concentration: true, duration: "Concentration, up to 1 minute", range: "30 feet", classes: ["Cleric", "Paladin"], description: "Up to three creatures of your choice add 1d4 to attack rolls and saving throws for the duration. At higher levels: +1 target per slot level above 1st.", isHomebrew: false, source: "SRD", tags: ["buff", "support"], createdAt: 0, updatedAt: 0 },
  { id: "srd_spell_haste", name: "Haste", level: 3, school: "Transmutation", castingTime: "1 action", ritual: false, components: ["V", "S", "M"], materialComponent: "a shaving of licorice root", concentration: true, duration: "Concentration, up to 1 minute", range: "30 feet", classes: ["Sorcerer", "Wizard"], description: "Target's speed doubles. They gain +2 AC, advantage on Dex saves, and one extra action (Attack, Dash, Disengage, Hide, or Use Object). When the spell ends, the target can't move or take actions until after its next turn.", isHomebrew: false, source: "SRD", tags: ["buff", "speed", "action"], createdAt: 0, updatedAt: 0 },
  { id: "srd_spell_invisibility", name: "Invisibility", level: 2, school: "Illusion", castingTime: "1 action", ritual: false, components: ["V", "S", "M"], materialComponent: "an eyelash encased in gum arabic", concentration: true, duration: "Concentration, up to 1 hour", range: "Touch", classes: ["Bard", "Sorcerer", "Wizard", "Warlock"], description: "A creature you touch becomes invisible until the spell ends. Anything the target is wearing or carrying is invisible as long as it is on the target's person.", isHomebrew: false, source: "SRD", tags: ["stealth", "utility"], createdAt: 0, updatedAt: 0 },
  { id: "srd_spell_counterspell", name: "Counterspell", level: 3, school: "Abjuration", castingTime: "1 reaction", ritual: false, components: ["S"], concentration: false, duration: "Instantaneous", range: "60 feet", classes: ["Sorcerer", "Warlock", "Wizard"], description: "You attempt to interrupt a creature's spellcasting. If the spell is 3rd level or lower, it fails. If it's 4th level or higher, make an ability check (DC 10 + spell level). At higher levels: automatically counter a spell of that slot level or lower.", isHomebrew: false, source: "SRD", tags: ["reaction", "defense"], createdAt: 0, updatedAt: 0 },
];

const SRD_FEATS: HomebrewFeat[] = [
  { id: "srd_feat_alert", name: "Alert", description: "You gain +5 to initiative. You cannot be surprised while conscious. Creatures don't gain advantage on attacks against you from being hidden.", benefits: ["+5 to initiative", "Cannot be surprised", "No advantage from hidden attackers"], prerequisites: [], repeatable: false, tags: ["initiative", "perception"], source: "SRD", isHomebrew: false, createdAt: 0, updatedAt: 0 },
  { id: "srd_feat_athlete", name: "Athlete", description: "You gain +1 to Str or Dex. Climbing costs no extra movement. You can stand from prone using 5 ft of movement.", benefits: ["+1 Str or Dex", "Climb no extra movement", "Stand from prone for 5 ft"], prerequisites: [], repeatable: false, tags: ["movement", "athletics"], source: "SRD", isHomebrew: false, createdAt: 0, updatedAt: 0 },
  { id: "srd_feat_warrior_caster", name: "War Caster", description: "You have advantage on concentration saves. You can perform somatic components with weapons in hand. You can cast a cantrip as an opportunity attack.", benefits: ["Advantage on concentration saves", "Somatic with weapons", "Cantrip as opportunity attack"], prerequisites: [{ type: "ability", description: "Spellcasting feature", ability: "any", minimumValue: undefined }], repeatable: false, tags: ["concentration", "spellcasting"], source: "SRD", isHomebrew: false, createdAt: 0, updatedAt: 0 },
  { id: "srd_feat_tough", name: "Tough", description: "Your hit point maximum increases by 2 per level.", benefits: ["+2 HP per level"], prerequisites: [], repeatable: false, tags: ["hp", "durability"], source: "SRD", isHomebrew: false, createdAt: 0, updatedAt: 0 },
  { id: "srd_feat_sharp_shooter", name: "Sharpshooter", description: "Attacking at long range doesn't impose disadvantage. Your ranged attacks ignore half and three-quarters cover. Before the attack, you can take -5 to attack roll to gain +10 to damage.", benefits: ["No long range disadvantage", "Ignores cover", "-5 attack / +10 damage"], prerequisites: [], repeatable: false, tags: ["ranged", "damage", "archery"], source: "SRD", isHomebrew: false, createdAt: 0, updatedAt: 0 },
];

// ── Store ─────────────────────────────────────────────────────
interface CompendiumState {
  items: HomebrewItem[];
  spells: HomebrewSpell[];
  feats: HomebrewFeat[];
  searchQuery: string;
  activeTab: "items" | "spells" | "feats";
  categoryFilter: string | null;
  schoolFilter: string | null;
  showSRD: boolean;
  draggedItem: { type: "item" | "spell" | "feat"; data: HomebrewItem | HomebrewSpell | HomebrewFeat } | null;

  setSearch: (q: string) => void;
  setTab: (t: "items" | "spells" | "feats") => void;
  setCategoryFilter: (c: string | null) => void;
  setSchoolFilter: (s: string | null) => void;
  toggleSRD: () => void;
  setDraggedItem: (d: { type: "item" | "spell" | "feat"; data: HomebrewItem | HomebrewSpell | HomebrewFeat } | null) => void;
  clearDraggedItem: () => void;

  addItem: (item: HomebrewItem) => void;
  addSpell: (spell: HomebrewSpell) => void;
  addFeat: (feat: HomebrewFeat) => void;
  removeItem: (id: string) => void;
  removeSpell: (id: string) => void;
  removeFeat: (id: string) => void;
}

export const useCompendiumStore = create<CompendiumState>()(
  persist(
    (set) => ({
      items: [],
      spells: [],
      feats: [],
      searchQuery: "",
      activeTab: "items",
      categoryFilter: null,
      schoolFilter: null,
      showSRD: true,
      draggedItem: null,

      setSearch: (q) => set({ searchQuery: q }),
      setTab: (t) => set({ activeTab: t, categoryFilter: null, schoolFilter: null }),
      setCategoryFilter: (c) => set({ categoryFilter: c }),
      setSchoolFilter: (s) => set({ schoolFilter: s }),
      toggleSRD: () => set((p) => ({ showSRD: !p.showSRD })),
      setDraggedItem: (d) => set({ draggedItem: d }),
      clearDraggedItem: () => set({ draggedItem: null }),

      addItem: (item) => set((p) => ({ items: [...p.items, item] })),
      addSpell: (spell) => set((p) => ({ spells: [...p.spells, spell] })),
      addFeat: (feat) => set((p) => ({ feats: [...p.feats, feat] })),
      removeItem: (id) => set((p) => ({ items: p.items.filter((x) => x.id !== id) })),
      removeSpell: (id) => set((p) => ({ spells: p.spells.filter((x) => x.id !== id) })),
      removeFeat: (id) => set((p) => ({ feats: p.feats.filter((x) => x.id !== id) })),
    }),
    { name: "str-vtt-compendium" }
  )
);

// ── Helpers ───────────────────────────────────────────────────
export function getCompendiumItems(store: CompendiumState): HomebrewItem[] {
  let items = [...SRD_ITEMS, ...store.items];
  if (!store.showSRD) items = [...store.items];
  if (store.searchQuery) {
    const q = store.searchQuery.toLowerCase();
    items = items.filter((i) => i.name.toLowerCase().includes(q) || i.description.toLowerCase().includes(q) || i.tags.some((t) => t.includes(q)));
  }
  if (store.categoryFilter) items = items.filter((i) => i.category === store.categoryFilter);
  return items;
}

export function getCompendiumSpells(store: CompendiumState): HomebrewSpell[] {
  let spells = [...SRD_SPELLS, ...store.spells];
  if (!store.showSRD) spells = [...store.spells];
  if (store.searchQuery) {
    const q = store.searchQuery.toLowerCase();
    spells = spells.filter((s) => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q) || s.school.toLowerCase().includes(q));
  }
  if (store.schoolFilter) spells = spells.filter((s) => s.school === store.schoolFilter);
  return spells;
}

export function getCompendiumFeats(store: CompendiumState): HomebrewFeat[] {
  let feats = [...SRD_FEATS, ...store.feats];
  if (!store.showSRD) feats = [...store.feats];
  if (store.searchQuery) {
    const q = store.searchQuery.toLowerCase();
    feats = feats.filter((f) => f.name.toLowerCase().includes(q) || f.description.toLowerCase().includes(q) || f.tags.some((t) => t.includes(q)));
  }
  return feats;
}

export const ITEM_CATEGORIES = ["weapon", "armor", "potion", "scroll", "wand", "ring", "wondrous", "tool", "ammunition", "food", "poison", "other"];
export const SPELL_SCHOOLS = ["Abjuration", "Conjuration", "Divination", "Enchantment", "Evocation", "Illusion", "Necromancy", "Transmutation"];
export const ITEM_RARITIES = ["common", "uncommon", "rare", "very_rare", "legendary", "artifact"];

export function rarityColor(rarity: string): string {
  const map: Record<string, string> = {
    common: "text-surface-400",
    uncommon: "text-rogue-400",
    rare: "text-mage-400",
    very_rare: "text-accent-400",
    legendary: "text-divine-400",
    artifact: "text-warrior-400",
  };
  return map[rarity] ?? "text-surface-400";
}
