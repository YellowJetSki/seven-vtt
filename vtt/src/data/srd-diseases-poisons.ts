/**
 * STᚱ VTT — Diseases, Poisons & Madness Reference (DMG)
 *
 * Reference data for common D&D diseases (DMG 256-257),
 * poisons (DMG 257-258), and madness effects (DMG 258-260).
 */

export interface DiseaseDef {
  id: string;
  name: string;
  saveDC: number;
  saveAbility: string;
  incubation: string;
  effect: string;
  cure: string;
  icon: string;
}

export interface PoisonDef {
  id: string;
  name: string;
  type: "contact" | "ingested" | "inhaled" | "injury";
  saveDC: number;
  saveAbility: string;
  effect: string;
  cost: string;
  icon: string;
}

export interface MadnessEffect {
  id: string;
  type: "short_term" | "long_term" | "indefinite";
  duration: string;
  effect: string;
}

export const SRD_DISEASES: DiseaseDef[] = [
  { id: "sewer_plague", name: "Sewer Plague", saveDC: 11, saveAbility: "constitution", incubation: "1d4 days", effect: "Fatigued: poisoned condition until cured. Each day, CON save or take 2d6 poison damage and gain one level of exhaustion.", cure: "Lesser Restoration spell or spending 3 consecutive days on a long rest (with a DC 11 CON save each day).", icon: "\uD83E\uDDA0" },
  { id: "sightless", name: "Sight Rot", saveDC: 15, saveAbility: "constitution", incubation: "1d4 hours", effect: "Blindness within 1 hour of onset. Eyes become milky white.", cure: "Lesser Restoration spell. Greater Restoration cures the blindness.", icon: "\uD83D\uDC41\u200D\uD83D\uDDE7" },
  { id: "cackle_fever", name: "Cackle Fever", saveDC: 13, saveAbility: "constitution", incubation: "1d4 hours", effect: "Psychosis: victim cackles uncontrollably. CON save each day or take 2d6 psychic damage.", cure: "Lesser Restoration or finishing a long rest with a DC 13 CON save.", icon: "\uD83E\uDD20" },
  { id: "demon_fever", name: "Demon Fever", saveDC: 17, saveAbility: "constitution", incubation: "1d4 days", effect: "Each day: CON save or take 2d6 necrotic damage. On a failed save, STR score is reduced by 1d4.", cure: "Lesser Restoration. STR reduction cured by Greater Restoration.", icon: "\uD83D\uDC7F" },
  { id: "devil_blight", name: "Devil Blight", saveDC: 15, saveAbility: "constitution", incubation: "1d4 days", effect: "Wasting disease: HP max reduced by 1d6 each day. Victim has disadvantage on CON saving throws.", cure: "Lesser Restoration. HP max restored by Greater Restoration.", icon: "\uD83D\uDC79" },
];

export const SRD_POISONS: PoisonDef[] = [
  { id: "basic_poison", name: "Basic Poison", type: "injury", saveDC: 10, saveAbility: "constitution", effect: "1d4 poison damage on hit (applied to weapon).", cost: "100 gp", icon: "\uD83E\uDEA0" },
  { id: "serpent_venom", name: "Serpent Venom", type: "injury", saveDC: 13, saveAbility: "constitution", effect: "3d6 poison damage and poisoned for 1 hour (half damage on save).", cost: "200 gp", icon: "\uD83D\uDC0D" },
  { id: "purple_worm_poison", name: "Purple Worm Poison", type: "injury", saveDC: 19, saveAbility: "constitution", effect: "12d6 poison damage (half on save).", cost: "2,000 gp", icon: "\uD83D\uDC09" },
  { id: "midnight_tears", name: "Midnight Tears", type: "ingested", saveDC: 17, saveAbility: "constitution", effect: "Creature suffers no effects until midnight. At midnight: CON save or take 9d6 poison damage (half on save).", cost: "1,500 gp", icon: "\uD83C\uDF77" },
  { id: "oil_of_tagit", name: "Oil of Tagit", type: "contact", saveDC: 13, saveAbility: "constitution", effect: "Unconscious for 4d8 hours. Damage wakes the creature.", cost: "400 gp", icon: "\uD83E\uDDF4" },
  { id: "truth_serum", name: "Truth Serum", type: "ingested", saveDC: 11, saveAbility: "constitution", effect: "For 1 hour: creature can't knowingly speak a lie.", cost: "150 gp", icon: "\uD83D\uDCA7" },
  { id: "torpor", name: "Torpor", type: "ingested", saveDC: 15, saveAbility: "constitution", effect: "Poisoned and incapacitated for 4d6 hours.", cost: "600 gp", icon: "\uD83D\uDE34" },
  { id: "assassin's_blood", name: "Assassin's Blood", type: "ingested", saveDC: 10, saveAbility: "constitution", effect: "1d12 poison damage and poisoned for 24 hours (half damage on save).", cost: "150 gp", icon: "\uD83E\uDEC0" },
];

export const SRD_MADNESS: MadnessEffect[] = [
  // Short-Term (DMG 259)
  { id: "st_1", type: "short_term", duration: "1d10 minutes", effect: "You start babbling incoherently." },
  { id: "st_2", type: "short_term", duration: "1d10 minutes", effect: "You are frightened and must use the Hide action." },
  { id: "st_3", type: "short_term", duration: "1d10 minutes", effect: "You laugh uncontrollably." },
  { id: "st_4", type: "short_term", duration: "1d10 minutes", effect: "You believe you're a giant chicken." },
  // Long-Term (DMG 259)
  { id: "lt_1", type: "long_term", duration: "1d10×10 hours", effect: "You suffer from a compulsion to steal." },
  { id: "lt_2", type: "long_term", duration: "1d10×10 hours", effect: "You believe you've been betrayed." },
  { id: "lt_3", type: "long_term", duration: "1d10×10 hours", effect: "You hear voices that give you commands." },
  { id: "lt_4", type: "long_term", duration: "1d10×10 hours", effect: "You become paranoid and trust no one." },
  // Indefinite (DMG 260)
  { id: "inf_1", type: "indefinite", duration: "Until cured", effect: "You develop a phobia of shadows." },
  { id: "inf_2", type: "indefinite", duration: "Until cured", effect: "You believe you're actually someone else." },
  { id: "inf_3", type: "indefinite", duration: "Until cured", effect: "You compulsively hoard worthless objects." },
  { id: "inf_4", type: "indefinite", duration: "Until cured", effect: "You've lost all sense of self-preservation." },
  { id: "inf_5", type: "indefinite", duration: "Until cured", effect: "You are catatonic and unresponsive." },
];
