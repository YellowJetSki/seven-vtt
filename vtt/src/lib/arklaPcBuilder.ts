/* ── Arkla PC Builder ───────────────────────────────────────────
 * Converts Arkla template JSON characters into PlayerCharacter format.
 * ─────────────────────────────────────────────────────────────── */

const CLASS_HIT_DICE: Record<string, string> = {
  artificer: "d8", barbarian: "d12", bard: "d8", cleric: "d8",
  druid: "d8", fighter: "d10", monk: "d8", paladin: "d10",
  ranger: "d10", rogue: "d8", sorcerer: "d6", warlock: "d8",
  wizard: "d6",
};

export function buildPcsFromArkla(characters: Record<string, any>): any[] {
  return Object.entries(characters).map(([id, raw]: [string, any]) => {
    const stats = raw.stats || {};
    const speedVal = raw.speed ?? 30;
    const hp = raw.hitPoints || { current: raw.maxHp ?? 10, max: raw.maxHp ?? 10, temporary: 0 };
    const inventory = (raw.inventory || []).map((item: any) => ({
      name: item.name || "Unknown Item",
      quantity: item.quantity ?? 1,
      weight: 0,
      description: item.desc || "",
      isEquipped: false,
    }));

    const className = raw.class || "Unknown";
    const classLevel = raw.level || 1;
    const hitDieType = CLASS_HIT_DICE[className.toLowerCase()] || "d8";

    return {
      id: `pc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name: raw.name || raw.label || "Unknown Hero",
      playerName: raw.playerName || "",
      race: raw.species || raw.race || "Unknown",
      classes: [{ name: className, subClass: raw.subClass || "", level: classLevel, hitDice: hitDieType, classFeatures: [] }],
      class: className,
      subClass: raw.subClass || "",
      level: classLevel,
      experiencePoints: raw.experiencePoints || 0,
      background: raw.background || "",
      alignment: raw.alignment || "Neutral",
      inspiration: raw.inspiration ?? false,
      strength: stats.STR ?? 10,
      dexterity: stats.DEX ?? 10,
      constitution: stats.CON ?? 10,
      intelligence: stats.INT ?? 10,
      wisdom: stats.WIS ?? 10,
      charisma: stats.CHA ?? 10,
      savingThrows: {
        strength: { proficient: false, bonus: Math.floor(((stats.STR ?? 10) - 10) / 2) },
        dexterity: { proficient: false, bonus: Math.floor(((stats.DEX ?? 10) - 10) / 2) },
        constitution: { proficient: false, bonus: Math.floor(((stats.CON ?? 10) - 10) / 2) },
        intelligence: { proficient: false, bonus: Math.floor(((stats.INT ?? 10) - 10) / 2) },
        wisdom: { proficient: false, bonus: Math.floor(((stats.WIS ?? 10) - 10) / 2) },
        charisma: { proficient: false, bonus: Math.floor(((stats.CHA ?? 10) - 10) / 2) },
      },
      skills: Object.fromEntries(
        ['acrobatics','animalHandling','arcana','athletics','deception','history',
         'insight','intimidation','investigation','medicine','nature','perception',
         'performance','persuasion','religion','sleightOfHand','stealth','survival']
          .map(k => [k, 'none'])
      ),
      hitPoints: typeof hp === 'number' ? { current: hp, max: hp, temporary: 0 } : hp,
      armorClass: raw.ac ?? raw.armorClass ?? 10,
      initiative: raw.initiative ?? Math.floor(((stats.DEX ?? 10) - 10) / 2),
      speed: typeof speedVal === 'number' ? { walk: speedVal } : speedVal,
      hitDice: raw.hitDice?.type ? `${raw.hitDice.max || 1}${raw.hitDice.type}` : "1d8",
      proficiencyBonus: raw.proficiencyBonus ?? 2,
      conditions: raw.conditions || [],
      deathSaves: raw.deathSaves || { successes: 0, failures: 0 },
      temporaryHitPoints: raw.temporaryHitPoints ?? 0,
      traits: [],
      proficiencies: [],
      languages: raw.languages || [],
      features: (raw.features || []).map((f: any) => ({
        name: f.name || "Feature",
        description: f.desc || "",
        source: f.source || "",
      })),
      equipment: [],
      inventory,
      currency: raw.currency
        ? {
            copper: raw.currency.leptons ?? raw.currency.copper ?? 0,
            silver: raw.currency.assarions ?? raw.currency.silver ?? 0,
            electrum: raw.currency.bronzeDrakes ?? raw.currency.electrum ?? 0,
            gold: raw.currency.silverDrakes ?? raw.currency.gold ?? 0,
            platinum: raw.currency.goldCrowns ?? raw.currency.platinum ?? 0,
          }
        : { copper: 0, silver: 0, electrum: 0, gold: 0, platinum: 0 },
      appearance: raw.appearance || "",
      backstory: raw.backstory || "",
      allies: raw.allies || "",
      characterNotes: raw.notes || "",
      personalityTraits: raw.personalityTraits || "",
      ideals: raw.ideals || "",
      bonds: raw.bonds || "",
      flaws: raw.flaws || "",
      imageUrl: raw.imageUrl || "",
      isHomebrew: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  });
}
